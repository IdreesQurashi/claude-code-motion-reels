"""Reel pipeline: one command per stage, for a 'how it's made' reel built on reels/engine.

    python3 reels/tools/reel.py new <slug> --object "Red Bull"   scaffold films/<date>-<slug>/
    python3 reels/tools/reel.py sync <film>        film.json -> comp/film.js and the composition length
    python3 reels/tools/reel.py check <film> [t,t] renderer lint + layout check + snapshot contact sheets   (unsandboxed)
    python3 reels/tools/reel.py score <film>       music and effects score timed to the picture            (unsandboxed)
    python3 reels/tools/reel.py render <film>      60 fps delivery render -> renders/raw.mp4 (~15 min)     (unsandboxed, background)
    python3 reels/tools/reel.py vo <film>          voiceover lines fitted to their windows                 (unsandboxed: edge-tts)
    python3 reels/tools/reel.py finish <film>      freeze silence, voice over ducked music, -14 LUFS, Whisper check
    python3 reels/tools/reel.py publish <film> --approved   post as a Reel and register the comment campaign

<film> is a folder under motion_studio/films/ (name or path). Secrets live in reels/.secrets/ (mode 600).
"""
import asyncio, json, os, random, re, shutil, subprocess, sys, time, urllib.parse, urllib.request
from datetime import date
from pathlib import Path

STUDIO = Path(__file__).resolve().parents[2]
REELS = STUDIO / "reels"
ENGINE = REELS / "engine"
DIRECTOR = Path.home() / ".claude/skills/motion-director"
SECRETS = REELS / ".secrets"
HF = ["npx", "--yes", "hyperframes@0.8.143"]
ENV = {**os.environ, "MOTION_SKILLS_TELEMETRY": "0"}
TMP = Path(os.environ.get("TMPDIR", "/tmp"))


def sh(cmd, cwd=None, check=True, capture=False):
    r = subprocess.run(cmd, cwd=cwd, env=ENV, check=check, text=True, capture_output=capture)
    return r.stdout + r.stderr if capture else r.returncode


def film_dir(arg):
    p = Path(arg)
    if not p.is_absolute():
        p = p if p.exists() else STUDIO / "films" / arg
    if not (p / "film.json").exists():
        sys.exit(f"no film.json in {p}")
    return p.resolve()


def load(fd):
    return json.loads((fd / "film.json").read_text())


def save(fd, film):
    (fd / "film.json").write_text(json.dumps(film, indent=2, ensure_ascii=False) + "\n")


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode())


def loudness(p):
    err = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(p), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])


def ff(*a):
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", *a], check=True)


# ---------------------------------------------------------------- new / sync
def cmd_new(slug, obj):
    fd = STUDIO / "films" / f"{date.today().isoformat()}-{slug}"
    if fd.exists():
        sys.exit(f"{fd} exists")
    comp = fd / "comp"
    shutil.copytree(ENGINE / "template", comp)
    shutil.move(str(comp / "film.json"), fd / "film.json")
    shutil.copytree(DIRECTOR / "kit", comp / "kit")
    for f in ("lib.js", "lib.css"):
        shutil.copy(ENGINE / f, comp / f)
    film = load(fd)
    film.update(object=obj, slug=slug)
    save(fd, film)
    (fd / "renders").mkdir()
    (fd / "vo").mkdir()
    print(f"scaffolded {fd}\nnext: write film.json (script, timings, caption, sources) and comp/scene.js, then: reel.py sync {fd.name}")


def cmd_sync(fd):
    film = load(fd)
    comp = fd / "comp"
    for f in ("lib.js", "lib.css"):  # engine fixes reach every film that syncs
        shutil.copy(ENGINE / f, comp / f)
    (comp / "film.js").write_text("window.FILM = " + json.dumps(film, ensure_ascii=False) + ";\n")
    html = (comp / "index.html").read_text()
    html = re.sub(r'data-duration="[\d.]+"( data-fps)', f'data-duration="{film["duration"]}"\\1', html, count=1)
    html = re.sub(r"<title>[^<]*</title>", f"<title>How {film['object']} is made</title>", html)
    (comp / "index.html").write_text(html)
    bad = [s for s in json.dumps([film.get("hook"), film.get("steps"), film.get("finale"), film.get("cta")], ensure_ascii=False).split('"') if re.search(r"[\u2010-\u2015]|\s-\s", s)]
    if bad:
        print("WARNING dashes in on screen text:", bad)
    print(f"synced {fd.name}: {film['duration']} s")


# ---------------------------------------------------------------- picture
def cmd_check(fd, times=None):
    comp = fd / "comp"
    out = sh(HF + ["check"], cwd=comp, check=False, capture=True)
    print("\n".join(l for l in out.splitlines() if not re.match(r"\s+(ℹ|Fix:)", l))[-1500:])
    film = load(fd)
    ts = times or ",".join(str(round(x, 2)) for x in [0.6, 2.6, 4.2] + [s[1] + 0.9 for s in film.get("steps", [])] + [film["freeze"]["at"] + 0.3, film["finale"]["at"] + 2.0, film["counter"]["by"] + 0.3, film["cta"]["at"] + 2.6])
    shutil.rmtree(comp / "snapshots", ignore_errors=True)
    sh(HF + ["snapshot", "--at", ts, "--no-end", "--describe", "false"], cwd=comp)
    print(f"contact sheets: {comp / 'snapshots'}")


def cmd_score(fd):
    out = sh(["node", "kit/sound.mjs", "--mood", "pulse", "--style", "punchy", "--seed", load(fd)["slug"]], cwd=fd / "comp", capture=True)
    print(out.strip().splitlines()[-1])


def cmd_render(fd):
    raw = fd / "renders" / "raw.mp4"
    sh(HF + ["render", "--fps", "60", "--quality", "delivery", "--workers", "1", "-o", str(raw)], cwd=fd / "comp")
    print(f"rendered {raw} ({dur(raw):.2f} s)")


# ---------------------------------------------------------------- voice
TRIM = "silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04,areverse"


async def _vo(fd):
    import edge_tts
    film = load(fd)
    voice = film["vo"].get("voice", "en-US-AndrewMultilingualNeural")
    out = fd / "vo" / "lines"
    out.mkdir(parents=True, exist_ok=True)
    placed = []
    for i, (start, end, text) in enumerate(film["vo"]["lines"], 1):
        window = end - start
        mp3, wav = out / f"l{i:02d}.mp3", out / f"l{i:02d}.wav"

        async def make(rate, tempo=1.0):
            for attempt in range(4):  # the service drops a request now and then: back off and retry
                try:
                    await edge_tts.Communicate(text, voice, rate=f"{rate:+d}%").save(str(mp3))
                    break
                except Exception as e:
                    if attempt == 3:
                        raise
                    print(f"   retry {attempt + 1} after {type(e).__name__}")
                    await asyncio.sleep(2 + 3 * attempt)
            ff("-i", str(mp3), "-af", TRIM + (f",atempo={tempo:.3f}" if tempo != 1.0 else "") + ",aresample=48000", "-ac", "1", str(wav))
            return dur(wav)

        rate, tempo = 8, 1.0
        d = await make(rate)
        if d > window:  # gentlest speed that fits; a touch of atempo only as a last resort
            lo, hi, best = 9, 50, None
            while lo <= hi:
                mid = (lo + hi) // 2
                if await make(mid) <= window:
                    best, hi = mid, mid - 1
                else:
                    lo = mid + 1
            if best is None:
                rate = 50
                tempo = min(1.12, await make(rate) / window + 0.005)
            else:
                rate = best
            d = await make(rate, tempo)
        placed.append({"start": start, "end": round(start + d, 3), "text": text, "file": str(wav), "rate": rate, "tempo": tempo})
        print(f"{i:02d} {start:6.2f} -> {start + d:6.2f} (max {end:6.2f}) rate {rate:+d}%{' tempo %.2f' % tempo if tempo != 1 else ''}{'  OVER' if d > window + 0.02 else ''}  {text}")
    (fd / "vo" / "placement.json").write_text(json.dumps({"voice": voice, "lines": placed}, indent=1))


def cmd_vo(fd):
    asyncio.run(_vo(fd))


def _norm_words(s):
    s = s.lower().replace("'", "")
    return [w for w in re.findall(r"[a-z]+", s)]


def cmd_finish(fd):
    film = load(fd)
    raw, slug = fd / "renders" / "raw.mp4", film["slug"]
    final = fd / "renders" / f"{slug}_9x16_60fps_vo.mp4"
    T = float(film["duration"])
    fz = film.get("freeze")
    # 1. Music bed: silence for the freeze, levelled.
    mute = f"volume=eval=frame:volume='max(0,max(min(({fz['at']}-t)/0.02,1),min((t-{fz['until']})/0.03,1)))'" if fz else "anull"
    # 2. Voice track from placement.json.
    pl = json.loads((fd / "vo" / "placement.json").read_text())["lines"]
    ins, ch = [], []
    for k, l in enumerate(pl):
        ins += ["-i", l["file"]]
        ms = int(round(l["start"] * 1000))
        ch.append(f"[{k}:a]adelay={ms}|{ms},aformat=channel_layouts=mono[d{k}]")
    voice = "highpass=f=75,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3800:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=2"
    vo = fd / "vo" / "vo_track.wav"
    ff(*ins, "-filter_complex", ";".join(ch) + ";" + "".join(f"[d{k}]" for k in range(len(pl))) + f"amix=inputs={len(pl)}:normalize=0,apad,atrim=0:{T},{voice}[v]", "-map", "[v]", "-ar", "48000", "-ac", "1", str(vo))
    vo_gain = -15.0 - loudness(vo)
    bed_gain = -10.0 - (loudness(raw) + 14.0)  # bed sits 10 dB under a -14 LUFS master
    dip = f"volume=eval=frame:volume='1-0.5*clip((t-{film.get('music_dip_at', T)})/0.2\\,0\\,1)'"
    graph = (f"[1:a]volume={vo_gain:.2f}dB,aformat=channel_layouts=stereo,asplit[vo][sc];"
             f"[0:a]{mute},volume={bed_gain:.2f}dB,{dip}[bed];"
             "[bed][sc]sidechaincompress=threshold=0.008:ratio=8:attack=8:release=280:makeup=1[duck];"
             "[duck][vo]amix=inputs=2:normalize=0:duration=first[m]")
    mix = TMP / f"{slug}_mix.wav"
    ff("-i", str(raw), "-i", str(vo), "-filter_complex", graph, "-map", "[m]", "-ar", "48000", "-c:a", "pcm_s24le", str(mix))
    err = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(mix), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample=48000")
    ff("-i", str(raw), "-i", str(mix), "-af", ln, "-map", "0:v", "-map", "1:a", "-t", str(T), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final))
    print(f"master {final.name}: {dur(final):.2f} s, {loudness(final):.1f} LUFS, {final.stat().st_size / 1e6:.1f} MB")
    # 3. Can a listener hear every line? Offline Whisper on the mix, word recall per line.
    ass = TMP / f"{slug}_check.ass"
    try:  # make-subs: offline faster-whisper captions (optional; any tool that writes an .ass works)
        subprocess.run(["make-subs", str(final), str(ass), "small", "6"], capture_output=True)
    except FileNotFoundError:
        print("whisper check skipped: make-subs not installed")
    heard = _norm_words(" ".join(re.sub(r"\{[^}]*\}", "", l.split(",", 9)[-1]) for l in ass.read_text().splitlines() if l.startswith("Dialogue"))) if ass.exists() else []
    bag = set(heard)
    worst = []
    for l in pl:
        words = [w for w in _norm_words(l["text"]) if len(w) > 2]
        miss = [w for w in words if w not in bag]
        if words and len(miss) / len(words) > 0.25:
            worst.append((l["start"], l["text"], miss))
    print("whisper: every line heard" if not worst else "whisper: unclear lines:\n" + "\n".join(f"  {s:5.2f} {t}  missing {m}" for s, t, m in worst))
    out = sh(["node", "kit/final-check.mjs", str(final), "--sound", "pulse"], cwd=fd / "comp", check=False, capture=True)
    print("\n".join(l for l in out.splitlines() if "PASS" in l or "FAIL" in l))


# ---------------------------------------------------------------- publish
def _token(name):
    p = SECRETS / name
    if not p.exists():
        sys.exit(f"missing {p}: run reels/bot/dm_bot.py setup first")
    return p.read_text().strip()


def _call(url, token, data=None, headers=None, method=None):
    req = urllib.request.Request(url, data=data, headers={"Authorization": f"OAuth {token}", **(headers or {})}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {url.split('?')[0]}: {e.read().decode()[:600]}")


def cmd_publish(fd, approved):
    film = load(fd)
    if not approved:
        print("CAPTION:\n" + film["caption"] + "\n\nNot posted. Show this caption to Idrees; post only with --approved after a clear yes.")
        return
    if film.get("instagram", {}).get("media_id"):
        sys.exit(f"already published: {film['instagram']['permalink']}")
    acct = json.loads((SECRETS / "account.json").read_text())
    tok, ig, api = _token("user_token"), acct["ig_user_id"], acct.get("api", "v24.0")
    video = fd / "renders" / f"{film['slug']}_9x16_60fps_vo.mp4"
    g = f"https://graph.facebook.com/{api}"
    q = urllib.parse.urlencode({"media_type": "REELS", "upload_type": "resumable", "caption": film["caption"], "share_to_feed": "true", "thumb_offset": str(int(film.get("cover_ms", 1400)))})
    cid = _call(f"{g}/{ig}/media", tok, data=q.encode(), method="POST")["id"]
    up = _call(f"https://rupload.facebook.com/ig-api-upload/{api}/{cid}", tok, data=video.read_bytes(), headers={"offset": "0", "file_size": str(video.stat().st_size)}, method="POST")
    print("container", cid, up)
    for _ in range(60):
        st = _call(f"{g}/{cid}?fields=status_code,status", tok)
        if st.get("status_code") == "FINISHED":
            break
        if st.get("status_code") in ("ERROR", "EXPIRED"):
            sys.exit(f"processing failed: {st}")
        time.sleep(5)
    mid = _call(f"{g}/{ig}/media_publish", tok, data=urllib.parse.urlencode({"creation_id": cid}).encode(), method="POST")["id"]
    info = _call(f"{g}/{mid}?fields=permalink,timestamp", tok)
    film["instagram"] = {"media_id": mid, "permalink": info["permalink"], "timestamp": info["timestamp"]}
    save(fd, film)
    camp = REELS / "bot" / "campaigns.json"
    camps = json.loads(camp.read_text()) if camp.exists() else []
    camps.append({"media_id": mid, "film": fd.name, "keyword": film["cta"]["keyword"].lower(), "since": info["timestamp"], "active": True})
    camp.write_text(json.dumps(camps, indent=1) + "\n")
    with open(REELS / "covered.txt", "a") as f:
        f.write(film["object"] + "\n")
    print(f"published {info['permalink']} and registered keyword {film['cta']['keyword']!r} for the DM bot")


def main():
    a = sys.argv[1:]
    if not a:
        sys.exit(__doc__)
    c = a[0]
    if c == "new":
        cmd_new(a[1], a[a.index("--object") + 1] if "--object" in a else a[1].replace("-", " ").title())
    elif c == "sync":
        cmd_sync(film_dir(a[1]))
    elif c == "check":
        cmd_check(film_dir(a[1]), a[2] if len(a) > 2 else None)
    elif c == "score":
        cmd_score(film_dir(a[1]))
    elif c == "render":
        cmd_render(film_dir(a[1]))
    elif c == "vo":
        cmd_vo(film_dir(a[1]))
    elif c == "finish":
        cmd_finish(film_dir(a[1]))
    elif c == "publish":
        cmd_publish(film_dir(a[1]), "--approved" in a)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
