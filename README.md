# Claude Code Motion Reels

The full stack behind my "how it's made" reels: Claude Code finds a viral everyday object, writes a sourced script,
animates it as a 60 fps motion graphic, adds a voiceover, posts it to Instagram, and runs a comment to DM funnel.

Everything here is plain code you run on your own machine. No subscriptions.
Rendering runs on [HyperFrames](https://github.com/heygen-com/hyperframes) (HTML in, video out, built for agents).

## What's inside

| Part | File | What it does |
|---|---|---|
| Object radar | `tools/object_radar.py` | Ranks about 140 everyday objects by Wikipedia popularity, 7 day momentum and Google Trends |
| Reel engine | `reels/engine/lib.js`, `lib.css` | Floating kinetic type, live HUD counter, steps bar, freeze frame interrupt, globe, finale, comment keyword end card |
| Pipeline CLI | `reels/tools/reel.py` | new, sync, check, score, render, vo, finish, publish |
| DM bot | `reels/bot/dm_bot.py` | Comment keyword to private reply, follow gate, link delivery |
| Examples | `examples/` | The cigarettes film and the M&M's film, scene code included |

## The script formula

| Time | Beat |
|---|---|
| 0 to 2.5 s | Hook: one shocking true number on screen in the first frame |
| 2.5 to 4.5 s | Question: an open loop the viewer wants closed |
| 4.5 to 16 s | Process: 3 or 4 steps, one idea and one visual each |
| 16 s | Pattern interrupt: freeze, silence, one line |
| 16.5 to 21 s | Payoff: the answer, slammed |
| 21 to 30 s | Proof and the loop: the counter lands |
| 30 to 34 s | Ask: comment a keyword |

Every number on screen needs a source you have actually read. If sources disagree, leave the number out.

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Node.js 22+, FFmpeg, Google Chrome, Python 3.11+
- [motion-director](https://claude-motion.com) installed in `~/.claude/skills/motion-director` (free). The engine uses its
  `kit/` (fonts, helpers, the music and sound generator). Its license does not allow redistribution, so it is not
  copied here: `reel.py new` copies it from your own install.
- `pip install edge-tts` for the voice (see the voice note below)
- Optional: an offline Whisper captioner on your PATH as `make-subs <video> <out.ass> small 6` for the clarity check

## Make a reel

```bash
python3 tools/object_radar.py --top 20               # pick an object from radar/objects-<date>.md
python3 reels/tools/reel.py new red-bull --object "Red Bull"
# write films/<date>-red-bull/film.json and comp/scene.js (ask Claude Code; examples/mms is the model)
python3 reels/tools/reel.py sync <film>
python3 reels/tools/reel.py check <film>             # lint, layout check, contact sheets
python3 reels/tools/reel.py score <film>             # music and effects timed to the picture
python3 reels/tools/reel.py render <film>            # 60 fps, about 15 minutes on a laptop
python3 reels/tools/reel.py vo <film>                # voice lines fitted to their windows
python3 reels/tools/reel.py finish <film>            # freeze silence, ducked music, -14 LUFS, clarity check
python3 reels/tools/reel.py publish <film>           # prints the caption
python3 reels/tools/reel.py publish <film> --approved
```

## Instagram setup

1. Switch your Instagram account to Business or Creator and link it to a Facebook Page.
2. Create a Meta app, add Facebook Login, and generate a long lived user token with only:
   `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_messages`,
   `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`.
3. Save it as `reels/.secrets/user_token` (keep the folder private), then run `python3 reels/bot/dm_bot.py setup`.
4. In the Instagram app, turn on Settings, Messages and story replies, Message controls, Connected tools,
   "Allow access to messages".

## The comment to DM bot

```bash
cp reels/bot/templates.example.json reels/bot/templates.json   # edit the texts, add your link, set approved: true
python3 reels/bot/dm_bot.py run --once                         # dry run: prints what it would send
python3 reels/bot/dm_bot.py run --live
```

Someone comments the keyword: they get a private reply asking them to follow and tap "I followed", plus a short
public reply. When they answer, the bot checks `is_user_follow_business` and sends the link, or a nudge (3 max).

Know the limits before you promise anything in a video:
- While your app is in development mode, Meta only lets it message people who have a role on the app. To reach the
  public you need Advanced Access for `instagram_manage_messages` and `instagram_manage_comments` (App Review).
- Private replies work within 7 days of the comment; normal DMs within 24 hours of the person's last message.
- The bot polls. It only works while the machine running it is on. For 24/7, run it on a small server or port it to n8n.
- It paces itself: 6 to 20 seconds between sends, 120 an hour at most.

## Voice note

`edge-tts` uses the Microsoft Edge read aloud service, which has no official license for this use. Fine for
testing. For a monetized account, record your own voice or use a licensed TTS such as ElevenLabs or Azure Speech:
anything that produces one audio file per line works with `reel.py finish`.

## License

MIT for the code in this repository. motion-director, HyperFrames, GSAP and the fonts keep their own licenses.
