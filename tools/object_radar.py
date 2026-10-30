"""Object Radar: ranks everyday objects for a "how it's made" reel by how popular they are right now.
    python3 tools/object_radar.py [--top 15]
Signals (no keys needed):
  1. Wikipedia pageviews, last 30 days, for every object in SEEDS: popularity (daily average) and
     momentum (last 7 days against the 23 before).
  2. Google Trends daily trending searches (US, GB, IN, PK): objects named in a trending search get a boost,
     and the raw trending list is kept for the human pick.
  3. Reddit top posts of the week in "how it's made" style subreddits (skipped quietly if Reddit refuses).
Objects listed in reels/covered.txt are dropped. Writes radar/objects-<date>.md and .json.
"""
import json, math, re, sys, time, urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path

STUDIO = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "object-radar/1.0 (" + __import__("os").environ.get("RADAR_CONTACT", "set RADAR_CONTACT to your email") + ")"}
TOP = int(sys.argv[sys.argv.index("--top") + 1]) if "--top" in sys.argv else 15

# name shown on screen : Wikipedia article. Everyday, compact, with a visual factory process.
SEEDS = {
    # drinks and food
    "Energy drink can": "Energy_drink", "Red Bull": "Red_Bull", "Coca Cola": "Coca-Cola", "Aluminium can": "Aluminum_can",
    "Plastic water bottle": "Plastic_bottle", "Glass bottle": "Glass_bottle", "Instant coffee": "Instant_coffee",
    "Coffee capsule": "Coffee_capsule", "Tea bag": "Tea_bag", "Pizza": "Pizza", "Frozen pizza": "Frozen_pizza",
    "Instant noodles": "Instant_noodles", "Potato chips": "Potato_chip", "Chocolate bar": "Chocolate_bar",
    "Nutella": "Nutella", "Gummy bear": "Gummy_bear", "Chewing gum": "Chewing_gum", "Marshmallow": "Marshmallow",
    "Ketchup": "Ketchup", "Mayonnaise": "Mayonnaise", "Ice cream": "Ice_cream", "Popcorn": "Popcorn",
    "Breakfast cereal": "Breakfast_cereal", "Peanut butter": "Peanut_butter", "Cheese": "Cheese", "Bread": "Bread",
    "French fries": "French_fries", "Chicken nugget": "Chicken_nugget", "Hot dog": "Hot_dog", "Oreo": "Oreo",
    "KitKat": "Kit_Kat", "M&M's": "M%26M%27s", "Pringles": "Pringles", "Doritos": "Doritos", "Sugar": "Sugar",
    "Salt": "Salt", "Honey": "Honey", "Protein powder": "Protein_supplement", "Sparkling water": "Carbonated_water",
    "Beer can": "Beer", "Milk carton": "Carton", "Bubble tea": "Bubble_tea", "Croissant": "Croissant",
    # tech
    "Phone charger": "Battery_charger", "USB C cable": "USB-C", "Lithium ion battery": "Lithium-ion_battery",
    "AA battery": "AA_battery", "Power bank": "Battery_pack", "LED bulb": "LED_lamp", "Light bulb": "Incandescent_light_bulb",
    "LED": "Light-emitting_diode", "Laptop screen": "Liquid-crystal_display", "OLED screen": "OLED",
    "Touchscreen": "Touchscreen", "Phone glass": "Gorilla_Glass", "Computer chip": "Semiconductor_device_fabrication",
    "SSD": "Solid-state_drive", "SD card": "SD_card", "SIM card": "SIM_card", "Credit card": "Payment_card",
    "Wireless earbuds": "AirPods", "Headphones": "Headphones", "Smartwatch": "Smartwatch", "Keyboard": "Computer_keyboard",
    "Computer mouse": "Computer_mouse", "Optical fiber": "Optical_fiber", "Solar panel": "Solar_panel",
    "Camera lens": "Camera_lens", "Microphone": "Microphone", "Vape": "Electronic_cigarette", "Game controller": "Gamepad",
    "Printer ink": "Inkjet_printing", "QR code sticker": "QR_code", "Drone": "Unmanned_aerial_vehicle",
    # everyday objects
    "Toothpaste": "Toothpaste", "Toothbrush": "Toothbrush", "Toilet paper": "Toilet_paper", "Soap": "Soap",
    "Shampoo": "Shampoo", "Diaper": "Diaper", "Kitchen sponge": "Sponge_(tool)", "Paper cup": "Paper_cup",
    "Pencil": "Pencil", "Ballpoint pen": "Ballpoint_pen", "Paper clip": "Paper_clip", "Matchstick": "Match",
    "Lighter": "Lighter", "Candle": "Candle", "Umbrella": "Umbrella", "Sunglasses": "Sunglasses",
    "Contact lens": "Contact_lens", "Mirror": "Mirror", "Zipper": "Zipper", "Sneakers": "Sneakers", "Jeans": "Jeans",
    "T shirt": "T-shirt", "Lego brick": "Lego", "Rubik's Cube": "Rubik%27s_Cube", "Crayon": "Crayon", "Balloon": "Balloon",
    "Tennis ball": "Tennis_ball", "Golf ball": "Golf_ball", "Football": "Ball_(association_football)",
    "Basketball": "Basketball_(ball)", "Car tyre": "Tire", "Perfume": "Perfume", "Lipstick": "Lipstick",
    "Nail polish": "Nail_polish", "Sunscreen": "Sunscreen", "Band aid": "Adhesive_bandage", "Painkiller tablet": "Tablet_(pharmacy)",
    "Banknote": "Banknote", "Coin": "Coin", "Glasses": "Glasses", "Wristwatch": "Watch", "Mattress": "Mattress",
    "Plastic bag": "Plastic_bag", "Aluminium foil": "Aluminium_foil", "Cling film": "Plastic_wrap", "Paper": "Paper",
    "Cardboard box": "Corrugated_fiberboard", "Glass": "Glass", "Nail": "Nail_(fastener)", "Screw": "Screw",
    "Bubble wrap": "Bubble_wrap", "Sticky note": "Post-it_Note", "Tape": "Adhesive_tape", "Super glue": "Cyanoacrylate",
    "Labubu": "Labubu", "Stanley cup": "Stanley_(brand)", "Crocs": "Crocs", "Fidget spinner": "Fidget_spinner",
    "Air fryer": "Air_fryer", "Ring light": "Ring_light", "Yoga mat": "Exercise_mat", "Water filter": "Water_filter",
}


def get(url, timeout=20):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read()


def covered():
    f = STUDIO / "reels" / "covered.txt"
    return {l.strip().lower() for l in f.read_text().splitlines() if l.strip()} if f.exists() else set()


def views(item):
    name, title = item
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=29)
    url = (f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/"
           f"{title}/daily/{start:%Y%m%d}/{end:%Y%m%d}")
    try:
        days = [d["views"] for d in json.loads(get(url))["items"]]
    except Exception as e:
        return name, None, str(e)[:60]
    if len(days) < 10:
        return name, None, "short series"
    last7, prev = days[-7:], days[:-7]
    return name, {"avg": sum(days) / len(days), "last7": sum(last7) / 7, "prev": sum(prev) / max(1, len(prev))}, None


def trends():
    out = []
    for geo in ("US", "GB", "IN", "PK"):
        try:
            root = ET.fromstring(get(f"https://trends.google.com/trending/rss?geo={geo}"))
            ns = {"ht": "https://trends.google.com/trending/rss"}
            for it in root.iter("item"):
                q = (it.findtext("title") or "").strip()
                traffic = (it.findtext("ht:approx_traffic", namespaces=ns) or "").strip()
                if q:
                    out.append({"geo": geo, "query": q, "traffic": traffic})
        except Exception as e:
            print(f"trends {geo}: skipped ({str(e)[:60]})")
    return out


def reddit():
    subs = "oddlysatisfying+interestingasfuck+Damnthatsinteresting+manufacturing+mildlyinteresting+howto"
    try:
        data = json.loads(get(f"https://www.reddit.com/r/{subs}/top.json?t=week&limit=100"))
        return [{"title": c["data"]["title"], "score": c["data"]["score"], "sub": c["data"]["subreddit"]} for c in data["data"]["children"]]
    except Exception as e:
        print(f"reddit: skipped ({str(e)[:60]})")
        return []


def mentions(name, texts):
    words = [w for w in re.split(r"[^a-z0-9]+", name.lower()) if len(w) > 2 and w not in {"can", "bar", "the"}]
    key = " ".join(words)
    return [t for t in texts if key and all(w in t.lower() for w in words)] if words else []


def main():
    skip = covered()
    items = [(n, t) for n, t in SEEDS.items() if n.lower() not in skip]
    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(views, items))
    tr, rd = trends(), reddit()
    trend_q = [t["query"] for t in tr]
    reddit_t = [r["title"] for r in rd]
    rows = []
    for name, v, err in res:
        if not v:
            continue
        mom = (v["last7"] + 1) / (v["prev"] + 1)
        t_hits, r_hits = mentions(name, trend_q), mentions(name, reddit_t)
        score = math.log10(v["avg"] + 10) + 1.5 * math.log2(mom) + (1.0 if t_hits else 0) + (0.5 if r_hits else 0)
        rows.append({"object": name, "wiki": SEEDS[name], "views_day": round(v["avg"]), "momentum": round(mom, 2),
                     "trending": t_hits[:3], "reddit": r_hits[:2], "score": round(score, 2)})
    rows.sort(key=lambda r: r["score"], reverse=True)
    out = STUDIO / "radar"
    out.mkdir(exist_ok=True)
    stamp = date.today().isoformat()
    (out / f"objects-{stamp}.json").write_text(json.dumps({"date": stamp, "ranked": rows, "trends": tr, "reddit": rd[:40]}, indent=1))
    md = [f"# Object radar, {stamp}", "", "Score = log10(daily Wikipedia views) + 1.5 x log2(momentum, last 7 days vs 23 before) + trend/Reddit boosts.", "",
          "| # | Object | Views/day | Momentum | Trending | Score |", "|---|---|---|---|---|---|"]
    for i, r in enumerate(rows[:TOP], 1):
        md.append(f"| {i} | {r['object']} | {r['views_day']:,} | {r['momentum']}x | {'; '.join(r['trending']) or ''} | {r['score']} |")
    md += ["", "## Trending searches now (for a human look)", ""] + [f"- {t['geo']}: {t['query']} ({t['traffic']})" for t in tr[:40]]
    if rd:
        md += ["", "## Reddit top of the week", ""] + [f"- r/{r['sub']} ({r['score']:,}): {r['title']}" for r in rd[:25]]
    (out / f"objects-{stamp}.md").write_text("\n".join(md) + "\n")
    print("\n".join(md[:TOP + 6]))
    print(f"\n{len(rows)} objects ranked, {len(tr)} trending searches, {len(rd)} reddit posts -> radar/objects-{stamp}.md")


if __name__ == "__main__":
    main()
