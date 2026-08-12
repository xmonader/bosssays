# Boss Says

Endless Mario-style **office platformer**. Ship deploys. Survive CEO/CTO Slack. Quit loudly if you must.

**Play:** [https://xmonader.github.io/bosssays/](https://xmonader.github.io/bosssays/)

## Controls

| Action | Keys | Mobile |
|--------|------|--------|
| Move | A / D or ← → | ◀ ▶ |
| Jump | W / Space / ↑ | JUMP |
| Open Slack | Tab / E | Slack |
| Reply | 1–4 | reply pad |
| **Quit** | **5** | nuclear button |
| Pause | Esc / P | ❚❚ |
| Mute | M | Mute |
| Restart (game over) | R | R |

## What you’re doing

- Run right, stomp red blockers, grab **SP** and **☕**
- Reach **DEPLOY** to start the next sprint (rebrand every time)
- Slack piles up in your inbox — open it when *you* choose
- Replies trade sleep, context, political capital, and tech debt
- Special mail: meetings, performance quizzes, eng **vent circles**
- Climb the **↑ HR snacks** stair for a secret stash
- Office clock never stops. Neither does the misery.

Modes: **Normal**, **Daily**, **No Slack**, **On-Call**. Settings for difficulty, sound, HUD, ghost path (off by default).

## Run locally

```bash
# any static server, or:
make start
# → http://localhost:4173
```

Open `index.html` via a local server (or plain `file://` — scripts are relative).

## Dev

```bash
make build   # load modules
make test    # node:test
make lint    # syntax check
```

Stack: plain JS, canvas, Web Audio. No bundler. Tests are pure Node against the same modules.

## License

For fun. Ship at your own risk.
