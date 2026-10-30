"""Comment to DM bot with a follow gate (ManyChat style), polling the Instagram Graph API (Facebook login).

    python3 reels/bot/dm_bot.py setup              token -> page token, account ids, permission check
    python3 reels/bot/dm_bot.py run [--live] [--once] [--interval 90]
    python3 reels/bot/dm_bot.py status

Flow
  1. Someone comments the campaign keyword on a registered reel (reels/bot/campaigns.json, written by
     reel.py publish), or DMs the keyword, or shares a reel to the inbox.
  2. Private reply (comment) or DM: the gate message, "follow first, then tap I followed".
     A short public reply goes under the comment too.
  3. Their reply opens the 24 h window. The bot checks is_user_follow_business:
     following -> the delivery link; not yet -> a nudge (at most 3).
Without --live nothing is sent: actions are printed and kept in a separate dry state.
Live mode refuses to start until templates.json has "approved": true and a delivery_url.
Pacing: 6 to 20 s random gap between sends, at most 120 sends an hour.
Meta limits: private replies within 7 days of the comment; DMs within 24 h of the user's last message.
In development mode Meta only lets the app message people with a role on the app; the public needs
Advanced Access for instagram_manage_messages and instagram_manage_comments (App Review).
"""
import json, random, sqlite3, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

BOT = Path(__file__).resolve().parent
SECRETS = BOT.parent / ".secrets"
NEED = ["instagram_basic", "instagram_content_publish", "instagram_manage_comments", "instagram_manage_messages",
        "pages_show_list", "pages_read_engagement", "pages_manage_metadata"]
LIVE = "--live" in sys.argv


def log(*a):
    print(datetime.now().strftime("%H:%M:%S"), *a, flush=True)


def call(path, token, params=None, body=None, method=None, api="v24.0"):
    url = path if path.startswith("http") else f"https://graph.facebook.com/{api}/{path}"
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    hdr = {"Authorization": f"OAuth {token}", **({"Content-Type": "application/json"} if data else {})}
    req = urllib.request.Request(url, data=data, headers=hdr, method=method or ("POST" if data else "GET"))
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            use = r.headers.get("X-Business-Use-Case-Usage") or r.headers.get("X-App-Usage")
            if use and any(v >= 80 for v in [int(x) for x in __import__("re").findall(r":\s*(\d+)", use)]):
                log("rate limit above 80%:", use)
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": json.loads(e.read() or b"{}").get("error", {"message": f"HTTP {e.code}"})}


# ---------------------------------------------------------------- setup
def setup():
    user = (SECRETS / "user_token").read_text().strip()
    dbg = call("debug_token", user, {"input_token": user}).get("data", {})
    scopes = set(dbg.get("scopes", []))
    missing = [s for s in NEED if s not in scopes]
    pages = call("me/accounts", user, {"fields": "id,name,access_token,instagram_business_account{id,username}"})
    pages = [p for p in pages.get("data", []) if p.get("instagram_business_account")]
    if not pages:
        sys.exit("no Facebook Page with a linked Instagram professional account is visible to this token")
    p = pages[0]
    SECRETS.mkdir(mode=0o700, exist_ok=True)
    (SECRETS / "page_token").write_text(p["access_token"])
    (SECRETS / "page_token").chmod(0o600)
    acct = {"page_id": p["id"], "page_name": p["name"], "ig_user_id": p["instagram_business_account"]["id"],
            "ig_username": p["instagram_business_account"]["username"], "api": "v24.0",
            "user_token_expires": datetime.fromtimestamp(dbg.get("expires_at", 0), timezone.utc).isoformat() if dbg.get("expires_at") else "never"}
    (SECRETS / "account.json").write_text(json.dumps(acct, indent=1))
    (SECRETS / "account.json").chmod(0o600)
    print(json.dumps(acct, indent=1))
    print("missing permissions:", ", ".join(missing) if missing else "none")
    extra = sorted(scopes - set(NEED) - {"public_profile"})
    if extra:
        print(f"note: this token also carries {len(extra)} permissions the pipeline never uses ({', '.join(extra[:6])}...). A narrower token is safer.")


# ---------------------------------------------------------------- state
def db():
    con = sqlite3.connect(BOT / ("state.db" if LIVE else "state_dry.db"))
    con.executescript("""
    create table if not exists comments(id text primary key, media_id text, user_id text, username text, text text, ts text, action text);
    create table if not exists seen(message_id text primary key);
    create table if not exists users(igsid text primary key, username text, state text, media_id text, first_seen text, last_inbound text, nudges int default 0, delivered_at text);
    create table if not exists sends(at text, igsid text, kind text, ok int, error text);
    """)
    return con


class Sender:
    def __init__(self, con, page_token, page_id, tpl):
        self.con, self.tok, self.page, self.tpl = con, page_token, page_id, tpl

    def _pace(self):
        hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        n = self.con.execute("select count(*) from sends where at > ? and ok = 1", (hour_ago,)).fetchone()[0]
        if n >= 120:
            log("hourly cap reached, waiting 5 min")
            time.sleep(300)
        if LIVE:
            time.sleep(random.uniform(6, 20))

    def send(self, recipient, message, kind, igsid):
        self._pace()
        if not LIVE:
            log(f"DRY {kind} -> {recipient}: {json.dumps(message, ensure_ascii=False)[:160]}")
            ok, err = 1, None
        else:
            r = call(f"{self.page}/messages", self.tok, body={"recipient": recipient, "message": message})
            ok, err = (0, r["error"].get("message")) if "error" in r else (1, None)
            if err and "quick_replies" in message:  # some surfaces refuse quick replies: retry as plain text
                r = call(f"{self.page}/messages", self.tok, body={"recipient": recipient, "message": {"text": message["text"]}})
                ok, err = (0, r["error"].get("message")) if "error" in r else (1, None)
            log(f"SENT {kind} -> {igsid}: {'ok' if ok else err}")
        self.con.execute("insert into sends values(?,?,?,?,?)", (datetime.now(timezone.utc).isoformat(), igsid, kind, ok, err))
        self.con.commit()
        return ok

    def gate(self, recipient, igsid, username):
        t = self.tpl
        return self.send(recipient, {"text": t["gate"].format(username=username or "there"),
                                     "quick_replies": [{"content_type": "text", "title": t["followed_button"], "payload": "FOLLOWED"}]}, "gate", igsid)

    def nudge(self, igsid):
        t = self.tpl
        return self.send({"id": igsid}, {"text": t["nudge"], "quick_replies": [{"content_type": "text", "title": t["followed_button"], "payload": "FOLLOWED"}]}, "nudge", igsid)

    def deliver(self, igsid):
        t = self.tpl
        msg = {"attachment": {"type": "template", "payload": {"template_type": "generic", "elements": [
            {"title": t["deliver_title"], "subtitle": t["deliver_subtitle"], "buttons": [{"type": "web_url", "url": t["delivery_url"], "title": t["deliver_button"]}]}]}}}
        ok = self.send({"id": igsid}, msg, "deliver", igsid)
        if not ok:
            ok = self.send({"id": igsid}, {"text": f"{t['deliver_title']} {t['delivery_url']}"}, "deliver_text", igsid)
        return ok


# ---------------------------------------------------------------- one polling pass
def tick(con, acct, tpl, user_tok, page_tok):
    s = Sender(con, page_tok, acct["page_id"], tpl)
    me = acct["ig_user_id"]
    now = datetime.now(timezone.utc)
    camps = json.loads((BOT / "campaigns.json").read_text()) if (BOT / "campaigns.json").exists() else []
    keywords = {c["keyword"] for c in camps if c.get("active")} or {tpl["keyword"].lower()}

    # 1. Comments on active reels younger than 7 days (the private reply window).
    for c in camps:
        if not c.get("active") or now - datetime.fromisoformat(c["since"].replace("+0000", "+00:00")) > timedelta(days=7):
            continue
        url, pages = f"{c['media_id']}/comments", 0
        params = {"fields": "id,text,timestamp,username,from{id,username}", "limit": 50}
        while url and pages < 10:
            r = call(url, user_tok, params)
            if "error" in r:
                log("comments error:", r["error"].get("message"))
                break
            for cm in r.get("data", []):
                if con.execute("select 1 from comments where id=?", (cm["id"],)).fetchone():
                    continue
                who = cm.get("from", {})
                hit = c["keyword"] in (cm.get("text") or "").lower() and who.get("id") != me
                action = "skip"
                if hit:
                    known = con.execute("select state from users where igsid=?", (who.get("id"),)).fetchone()
                    if known and known[0] == "delivered":
                        action = "already_delivered"
                    elif s.gate({"comment_id": cm["id"]}, who.get("id"), cm.get("username")):
                        action = "gated"
                        con.execute("insert or replace into users(igsid, username, state, media_id, first_seen, nudges) values(?,?,?,?,?,0)",
                                    (who.get("id"), cm.get("username"), "gated", c["media_id"], cm.get("timestamp")))
                        if tpl.get("public_replies") and LIVE:
                            call(f"{cm['id']}/replies", user_tok, {"message": random.choice(tpl["public_replies"])}, method="POST")
                        elif tpl.get("public_replies"):
                            log(f"DRY public reply under {cm['id']}")
                con.execute("insert into comments values(?,?,?,?,?,?,?)", (cm["id"], c["media_id"], who.get("id"), cm.get("username"), cm.get("text"), cm.get("timestamp"), action))
                con.commit()
            nxt = r.get("paging", {}).get("next")
            url, params, pages = (nxt, None, pages + 1) if nxt else (None, None, pages)

    # 2. Inbox: new inbound messages.
    r = call(f"{acct['page_id']}/conversations", page_tok, {"platform": "instagram", "limit": 25,
             "fields": "id,updated_time,messages.limit(6){id,created_time,from,message,attachments,shares}"})
    if "error" in r:
        log("inbox error:", r["error"].get("message"))
        return
    for conv in r.get("data", []):
        msgs = sorted(conv.get("messages", {}).get("data", []), key=lambda m: m["created_time"])
        for m in msgs:
            if con.execute("select 1 from seen where message_id=?", (m["id"],)).fetchone():
                continue
            con.execute("insert into seen values(?)", (m["id"],))
            con.commit()
            frm = m.get("from", {})
            igsid = frm.get("id")
            if not igsid or igsid == me:
                continue
            text = (m.get("message") or "").lower()
            shared = bool(m.get("shares") or m.get("attachments"))
            u = con.execute("select state, nudges from users where igsid=?", (igsid,)).fetchone()
            con.execute("update users set last_inbound=? where igsid=?", (m["created_time"], igsid))
            if u is None:
                if any(k in text for k in keywords) or shared:
                    if s.gate({"id": igsid}, igsid, frm.get("username")):
                        con.execute("insert into users(igsid, username, state, first_seen, nudges) values(?,?,?,?,0)", (igsid, frm.get("username"), "gated", m["created_time"]))
                continue
            state, nudges = u
            if state == "delivered":
                continue
            prof = call(igsid, page_tok, {"fields": "username,is_user_follow_business"})
            follows = prof.get("is_user_follow_business")
            if "error" in prof:
                log("follow check unavailable:", prof["error"].get("message"))
                follows = tpl.get("follow_check") == "trust"
            if follows:
                if s.deliver(igsid):
                    con.execute("update users set state='delivered', delivered_at=? where igsid=?", (datetime.now(timezone.utc).isoformat(), igsid))
            elif nudges < 3:
                if s.nudge(igsid):
                    con.execute("update users set nudges=nudges+1 where igsid=?", (igsid,))
            con.commit()


def run():
    tpl = json.loads((BOT / "templates.json").read_text())
    if LIVE and not (tpl.get("approved") and tpl.get("delivery_url", "").startswith("http")):
        sys.exit("live mode needs templates.json approved: true and a delivery_url. Running dry is: dm_bot.py run")
    acct = json.loads((SECRETS / "account.json").read_text())
    user_tok, page_tok = (SECRETS / "user_token").read_text().strip(), (SECRETS / "page_token").read_text().strip()
    con = db()
    interval = int(sys.argv[sys.argv.index("--interval") + 1]) if "--interval" in sys.argv else 90
    log(f"{'LIVE' if LIVE else 'DRY RUN'} as @{acct['ig_username']}, every {interval} s")
    while True:
        try:
            tick(con, acct, tpl, user_tok, page_tok)
        except Exception as e:  # keep the daemon alive through network hiccups
            log("tick failed:", repr(e)[:200])
        if "--once" in sys.argv:
            break
        time.sleep(interval)


def status():
    for name in ("state.db", "state_dry.db"):
        if not (BOT / name).exists():
            continue
        con = sqlite3.connect(BOT / name)
        print(name, dict(con.execute("select state, count(*) from users group by state").fetchall()),
              "comments:", con.execute("select count(*) from comments").fetchone()[0],
              "sends:", con.execute("select count(*) from sends where ok=1").fetchone()[0])


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    {"setup": setup, "run": run, "status": status}.get(cmd, lambda: sys.exit(__doc__))()
