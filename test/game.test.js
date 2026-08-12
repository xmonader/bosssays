"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Game = require("../js/game.js");
const Physics = require("../js/physics.js");
const Map = require("../js/map.js");
const Notes = require("../js/notifications.js");

function settle(game, frames) {
  for (let i = 0; i < frames; i++) Game.step(game, {}, 1 / 60);
}

function enqueueAndOpen(game) {
  game.notifications.timeSince = 999;
  Game.step(game, {}, 0.05);
  assert.ok(game.notifications.inbox.length >= 1, "expected inbox item");
  Game.step(game, { openInbox: true }, 0.05);
  assert.ok(game.notifications.active, "expected open modal");
}

describe("enemy damage and stomp", () => {
  it("enemy contact damages player and reduces lives", () => {
    const map = Map.createOfficeMap();
    map.enemySpawns = [{ x: 200, y: map.groundY - 28, vx: 0 }];
    const game = Game.createGame({ map: map, lives: 3 });
    settle(game, 30);
    const e = game.enemies[0];
    assert.equal(e.alive, true);
    const livesBefore = game.lives;
    for (let i = 0; i < 5; i++) {
      game.player.x = e.x - 8;
      game.player.y = e.y;
      game.player.vy = 0;
      game.player.invuln = 0;
      Game.step(game, {}, 1 / 60);
      if (game.lives < livesBefore) break;
    }
    assert.ok(game.lives < livesBefore, "lives should decrease on damage");
  });

  it("stomp from above defeats enemy without losing life", () => {
    const map = Map.createOfficeMap();
    map.enemySpawns = [{ x: 100, y: map.groundY - 28, vx: 0 }];
    const game = Game.createGame({ map: map, lives: 3 });
    settle(game, 15);
    const e = game.enemies[0];
    game.player.x = e.x;
    game.player.y = e.y - game.player.h + 4;
    game.player.vy = 200;
    game.player.invuln = 0;
    const lives = game.lives;
    Game.step(game, {}, 1 / 60);
    assert.equal(e.alive, false, "enemy stomped");
    assert.equal(game.lives, lives, "no life lost on stomp");
    assert.ok(game.player.vy < 0, "bounce up after stomp");
  });

  it("lives reaching zero sets game over", () => {
    const map = Map.createOfficeMap();
    map.enemySpawns = [{ x: map.spawn.x, y: map.spawn.y, vx: 0 }];
    const game = Game.createGame({ map: map, lives: 1 });
    game.player.x = game.enemies[0].x;
    game.player.y = game.enemies[0].y;
    game.player.vy = 0;
    game.player.invuln = 0;
    Game.step(game, {}, 1 / 60);
    assert.equal(game.lives, 0);
    assert.equal(game.phase, "gameover");
    assert.equal(Game.isGameOver(game), true);
    const x = game.player.x;
    Game.step(game, { right: true }, 1 / 60);
    assert.equal(game.phase, "gameover");
    assert.equal(game.player.x, x);
  });
});

describe("sprint deploy loop", () => {
  it("touching deploy advances sprint and restarts world", () => {
    const game = Game.createGame();
    assert.equal(game.sprint, 1);
    const d = game.map.deploy;
    game.player.x = d.x;
    game.player.y = d.y + 10;
    Game.step(game, {}, 1 / 60);
    assert.equal(game.sprint, 2);
    assert.equal(game.deploys, 1);
    assert.ok(Math.abs(game.player.x - game.map.spawn.x) < 5);
    assert.ok(game.enemies.filter((e) => e.alive).length > 0);
    assert.notEqual(game.phase, "gameover");
  });

  it("advanceSprint is endless (multiple loops)", () => {
    const game = Game.createGame();
    for (let i = 0; i < 5; i++) Game.advanceSprint(game);
    assert.equal(game.sprint, 6);
    assert.equal(game.deploys, 5);
    assert.equal(game.phase, "playing");
  });
});

describe("notifications inbox UX", () => {
  it("arrivals go to inbox without freezing play", () => {
    const game = Game.createGame({ rng: () => 0.1, notifyImmediate: true });
    Game.step(game, {}, 0.05);
    assert.ok(game.notifications.inbox.length >= 1);
    assert.equal(game.notifications.active, null);
    assert.equal(game.phase, "playing");
    const x0 = game.player.x;
    settle(game, 20);
    for (let i = 0; i < 40; i++) Game.step(game, { right: true }, 1 / 60);
    assert.ok(game.player.x > x0, "player keeps moving with unread Slack");
  });

  it("openInbox freezes until reply; timeout is mild", () => {
    const game = Game.createGame({ rng: () => 0.1 });
    enqueueAndOpen(game);
    assert.equal(game.phase, "notification");
    assert.ok(game.notifications.active.maxTimer >= 12);

    const x0 = game.player.x;
    for (let i = 0; i < 20; i++) Game.step(game, { right: true }, 1 / 60);
    assert.equal(game.player.x, x0, "frozen while reading");

    for (let i = 0; i < 1200; i++) {
      Game.step(game, {}, 1 / 60);
      if (!game.notifications.active) break;
    }
    assert.equal(game.notifications.active, null);
    assert.equal(game.lastEffects.kind, "timeout");
    assert.ok(game.effects.stunTimer > 0 && game.effects.stunTimer < 1.0);
    assert.ok(game.effects.context < 25, "timeout less punishing than before");
  });

  it("dismiss vs love apply distinct effects", () => {
    const game = Game.createGame();
    enqueueAndOpen(game);
    const r1 = Game.chooseNotification(game, "dismiss");
    assert.equal(r1.effects.kind, "dismiss");
    assert.equal(r1.effects.stun, 0);
    const ctxAfterDismiss = game.effects.context;

    enqueueAndOpen(game);
    const r2 = Game.chooseNotification(game, "love");
    assert.equal(r2.effects.kind, "love");
    assert.ok(game.effects.slowTimer > 0);
    assert.ok(game.effects.hallucinated.length > 0);
    assert.ok(game.effects.context > ctxAfterDismiss);
  });

  it("on_it spawns calendar block solid", () => {
    const game = Game.createGame();
    enqueueAndOpen(game);
    Game.chooseNotification(game, "on_it");
    assert.ok(game.effects.calendarBlocks.length >= 1);
  });

  it("shuffle bag avoids immediate text repeats", () => {
    const state = Notes.createNotificationState();
    const rng = (function () {
      let s = 42;
      return function () {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s % 10000) / 10000;
      };
    })();
    const seen = [];
    for (let i = 0; i < 40; i++) {
      const line = Notes.pickLine(state, rng);
      state.lastFrom = line.from;
      seen.push(line.text);
    }
    // No two identical in a row
    for (let i = 1; i < seen.length; i++) {
      assert.notEqual(seen[i], seen[i - 1], "adjacent duplicate text");
    }
    // High uniqueness early in bag
    const unique = new Set(seen);
    assert.ok(unique.size >= 30, "expected mostly unique, got " + unique.size);
  });

  it("resolveNotification pure API distinguishes timeout and dismiss", () => {
    const s1 = Notes.createNotificationState();
    s1.active = {
      id: 1,
      from: "CEO",
      text: "x",
      timer: 1,
      maxTimer: 4,
      choices: Notes.CHOICES,
    };
    const d = Notes.resolveNotification(s1, "dismiss");
    const s2 = Notes.createNotificationState();
    s2.active = {
      id: 2,
      from: "CTO",
      text: "y",
      timer: 1,
      maxTimer: 4,
      choices: Notes.CHOICES,
    };
    const t = Notes.resolveNotification(s2, "timeout");
    assert.notEqual(d.effects.kind, t.effects.kind);
    assert.ok(t.effects.stun > d.effects.stun);
    assert.ok(t.effects.context > d.effects.context);
  });
});

describe("player movement in game", () => {
  it("step moves player right with input on platforms", () => {
    const game = Game.createGame();
    settle(game, 20);
    const x0 = game.player.x;
    for (let i = 0; i < 40; i++) Game.step(game, { right: true }, 1 / 60);
    assert.ok(game.player.x > x0 + 30);
  });

  it("jump leaves ground", () => {
    const game = Game.createGame();
    settle(game, 30);
    assert.equal(game.player.onGround, true);
    Game.step(game, { jump: true }, 1 / 60);
    assert.ok(game.player.vy < 0);
    assert.equal(game.player.onGround, false);
  });
});

describe("map", () => {
  it("office map has platforms spawn deploy enemies", () => {
    const m = Map.createOfficeMap();
    assert.ok(m.platforms.length >= 5);
    assert.ok(m.spawn.x >= 0);
    assert.ok(m.deploy.w > 0);
    assert.ok(m.enemySpawns.length >= 1);
    assert.ok(m.width > 1000);
    assert.ok(m.theme && m.theme.id);
  });

  it("different sprints get different themes/brands and layouts", () => {
    const a = Map.createOfficeMap({ sprint: 1 });
    const b = Map.createOfficeMap({ sprint: 2 });
    const c = Map.createOfficeMap({ sprint: 3 });
    assert.notEqual(a.theme.id, b.theme.id);
    assert.notEqual(a.brand, b.brand);
    // platform fingerprints should differ across sprints
    const sig = (m) =>
      m.platforms
        .filter((p) => p.h < 40)
        .map((p) => p.x + "," + p.y)
        .join("|");
    assert.notEqual(sig(a), sig(b));
    assert.ok(c.enemySpawns.length >= a.enemySpawns.length);
  });

  it("float platforms and pickups do not fully stack", () => {
    for (let sprint = 1; sprint <= 10; sprint++) {
      const m = Map.createOfficeMap({ sprint: sprint });
      const floats = m.platforms.filter(
        (p) => p.h < 40 && p.label !== "wall-l" && p.label !== "wall-r"
      );
      for (let i = 0; i < floats.length; i++) {
        for (let j = i + 1; j < floats.length; j++) {
          assert.equal(
            Map.rectsOverlap(floats[i], floats[j], 8),
            false,
            "float overlap sprint " + sprint + " " + floats[i].label + "/" + floats[j].label
          );
        }
      }
      for (let i = 0; i < m.collectibleSpawns.length; i++) {
        for (let j = i + 1; j < m.collectibleSpawns.length; j++) {
          assert.equal(
            Map.rectsOverlap(m.collectibleSpawns[i], m.collectibleSpawns[j], 12),
            false,
            "pickup overlap sprint " + sprint
          );
        }
      }
      const props = m.interactableSpawns || [];
      for (let i = 0; i < props.length; i++) {
        for (let j = i + 1; j < props.length; j++) {
          assert.equal(
            Map.rectsOverlap(props[i], props[j], 14),
            false,
            "prop overlap sprint " + sprint
          );
        }
      }
    }
  });

  it("blockers never spawn on story points or coffee", () => {
    for (let sprint = 1; sprint <= 15; sprint++) {
      const m = Map.createOfficeMap({ sprint: sprint });
      for (let i = 0; i < m.enemySpawns.length; i++) {
        const e = m.enemySpawns[i];
        const eb = { x: e.x, y: e.y, w: 28, h: 28 };
        for (let j = 0; j < m.collectibleSpawns.length; j++) {
          assert.equal(
            Map.rectsOverlap(eb, m.collectibleSpawns[j], 36),
            false,
            "enemy on pickup sprint " + sprint
          );
        }
      }
    }
  });

  it("enemies patrol ledges without dying", () => {
    const game = Game.createGame({ skipTutorial: true });
    const n0 = game.enemies.filter((e) => e.alive).length;
    assert.ok(n0 >= 1);
    for (let i = 0; i < 480; i++) Game.step(game, {}, 1 / 60);
    const alive = game.enemies.filter((e) => e.alive);
    assert.equal(alive.length, n0, "no enemy should despawn itself");
    for (let i = 0; i < alive.length; i++) {
      assert.ok(alive[i].y < game.map.height, "enemy stayed in world");
    }
  });

  it("advanceSprint rebuilds map theme", () => {
    const game = Game.createGame({ sprint: 1 });
    const t0 = game.map.theme.id;
    Game.advanceSprint(game);
    assert.equal(game.sprint, 2);
    assert.notEqual(game.map.theme.id, t0);
    assert.ok(game.collectibles.length > 0);
  });
});

describe("notification copy bank", () => {
  it("has a large ego/know-it-all management line pool", () => {
    assert.ok(Notes.LINES.length >= 200);
    const froms = new Set(Notes.LINES.map((l) => l.from));
    for (const role of ["CEO", "CTO", "PM", "HR", "Founder"]) {
      assert.ok(froms.has(role), "missing role " + role);
    }
    assert.ok(Notes.LINES.every((l) => l.text && l.text.length > 10));
  });

  it("personas map titles to human names and channels", () => {
    const p = Notes.personaFor("CEO");
    assert.ok(p.name.length > 3);
    assert.match(p.channel, /^#/);
  });

  it("pickLine uses bag without short-cycle duplicates", () => {
    const state = Notes.createNotificationState();
    Notes.shuffleBag(state, () => 0.5);
    assert.ok(state.bag.length > 100);
  });

  it("heavily prefers hire + blame + process-churn messages", () => {
    const state = Notes.createNotificationState();
    const rng = (function () {
      let s = 99;
      return function () {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s % 10000) / 10000;
      };
    })();
    let featured = 0;
    let blame = 0;
    let process = 0;
    const n = 80;
    for (let i = 0; i < n; i++) {
      const line = Notes.pickLine(state, rng);
      state.lastFrom = line.from;
      if (Notes.isFeaturedCynicismLine(line)) featured++;
      if (Notes.isShieldedAccountabilityLine(line)) blame++;
      if (Notes.isProcessChurnLine(line)) process++;
    }
    assert.ok(
      featured >= 45,
      "expected mostly featured cynicism, got " + featured + "/" + n
    );
    assert.ok(blame >= 3, "expected some shielded-blame lines, got " + blame);
    assert.ok(process >= 3, "expected some process-churn lines, got " + process);
  });
});

describe("collectibles", () => {
  it("map provides collectible spawns", () => {
    const m = Map.createOfficeMap();
    assert.ok(m.collectibleSpawns && m.collectibleSpawns.length >= 5);
  });

  it("collectibles sit on solid platforms not over pits", () => {
    for (let sprint = 1; sprint <= 8; sprint++) {
      const m = Map.createOfficeMap({ sprint: sprint });
      for (let i = 0; i < m.collectibleSpawns.length; i++) {
        const c = m.collectibleSpawns[i];
        const midX = c.x + c.w / 2;
        const bottom = c.y + c.h;
        const onSolid = m.platforms.some(function (p) {
          if (p.label === "wall-l" || p.label === "wall-r") return false;
          return (
            midX >= p.x + 4 &&
            midX <= p.x + p.w - 4 &&
            bottom >= p.y - 6 &&
            bottom <= p.y + 14
          );
        });
        assert.ok(
          onSolid,
          "pickup over void at sprint " + sprint + " x=" + c.x + " y=" + c.y
        );
      }
    }
  });

  it("touching a story point collects it and adds score", () => {
    const game = Game.createGame();
    const c = game.collectibles.find((x) => x.kind === "story");
    // Only this pickup should count
    game.collectibles.forEach(function (o) {
      if (o !== c) o.collected = true;
    });
    game.player.x = c.x;
    game.player.y = c.y - 10;
    const before = game.score;
    Game.step(game, {}, 1 / 60);
    assert.equal(c.collected, true);
    assert.equal(game.score, before + Game.STORY_POINTS);
    assert.ok(game.thought && game.thought.category === "collect");
  });

  it("coffee reduces context, sleep debt, and sets thought", () => {
    const game = Game.createGame();
    game.effects.context = 40;
    game.effects.sleepDebt = 50;
    const c = game.collectibles.find((x) => x.kind === "coffee");
    game.collectibles.forEach(function (o) {
      if (o !== c && Math.abs(o.x - c.x) < 10 && Math.abs(o.y - c.y) < 10) {
        o.collected = true;
      }
    });
    game.player.x = c.x;
    game.player.y = c.y;
    Game.step(game, {}, 1 / 60);
    assert.equal(c.collected, true);
    assert.ok(game.effects.context < 40);
    assert.ok(game.effects.sleepDebt < 50);
    assert.ok(game.thought && game.thought.category === "coffee");
  });

  it("walking near pickup still collects (padded hitbox)", () => {
    const game = Game.createGame();
    const c = game.collectibles.find((x) => x.kind === "coffee") || game.collectibles[0];
    game.collectibles.forEach(function (o) {
      if (o !== c) o.collected = true;
    });
    // stand beside it, not dead-center
    game.player.x = c.x - 12;
    game.player.y = c.y - 4;
    Game.step(game, {}, 1 / 60);
    assert.equal(c.collected, true);
  });

  it("walking into chair/prop triggers reaction once", () => {
    const game = Game.createGame();
    assert.ok(game.interactables && game.interactables.length > 0);
    const it = game.interactables[0];
    game.player.x = it.x;
    game.player.y = it.y;
    Game.step(game, {}, 1 / 60);
    assert.equal(it.used, true);
    assert.ok(game.thought);
    assert.ok(game.events.some((e) => e.type === "prop"));
    // second touch no re-fire
    game.thought = null;
    game.events = [];
    Game.step(game, {}, 1 / 60);
    assert.ok(!game.events.some((e) => e.type === "prop"));
  });

  it("collectibles respawn on sprint advance; score persists", () => {
    const game = Game.createGame();
    game.collectibles.forEach((c) => {
      c.collected = true;
    });
    game.score = 50;
    Game.advanceSprint(game);
    assert.equal(game.score, 50);
    assert.ok(game.collectibles.every((c) => !c.collected));
  });
});

describe("sleep debt", () => {
  it("slack and replies increase sleep debt", () => {
    const game = Game.createGame({ rng: () => 0.2 });
    // Don't auto-grab coffee at spawn
    game.collectibles.forEach(function (c) {
      c.collected = true;
    });
    game.interactables.forEach(function (it) {
      it.used = true;
    });
    assert.equal(game.effects.sleepDebt || 0, 0);
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    assert.ok(game.effects.sleepDebt > 0);
    const afterPing = game.effects.sleepDebt;
    Game.step(game, { openInbox: true }, 0.05);
    Game.chooseNotification(game, "love");
    assert.ok(game.effects.sleepDebt > afterPing);
  });
});

describe("inner thought bubbles", () => {
  it("has frustration thought pools", () => {
    assert.ok(Game.THOUGHTS.slack_ping.length >= 5);
    assert.ok(Game.THOUGHTS.open.length >= 3);
    assert.ok(Game.THOUGHTS.love.length >= 2);
    assert.ok(Game.THOUGHTS.sigh || Game.THOUGHTS.idle.length >= 2);
  });

  it("setThought puts timed text on game", () => {
    const game = Game.createGame({ rng: () => 0.2 });
    const t = Game.setThought(game, "slack_ping");
    assert.ok(t && t.text);
    assert.ok(game.thought.timer > 1);
  });

  it("slack arrival and open set thoughts", () => {
    const game = Game.createGame({ rng: () => 0.3 });
    game.collectibles.forEach(function (c) {
      c.collected = true;
    });
    game.interactables.forEach(function (it) {
      it.used = true;
    });
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    assert.ok(game.thought, "thought on slack_ping");
    assert.equal(game.thought.category, "slack_ping");
    Game.step(game, { openInbox: true }, 0.05);
    assert.ok(game.thought);
    assert.equal(game.thought.category, "open");
  });

  it("reply sets category-specific thought", () => {
    const game = Game.createGame({ rng: () => 0.1 });
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    Game.step(game, { openInbox: true }, 0.05);
    Game.chooseNotification(game, "love");
    assert.ok(game.thought);
    assert.equal(game.thought.category, "love");
  });

  it("quit choice ends the run as resignation", () => {
    const game = Game.createGame({ rng: () => 0.1 });
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    Game.step(game, { openInbox: true }, 0.05);
    assert.ok(game.notifications.active);
    const r = Game.chooseNotification(game, "quit");
    assert.equal(r.effects.kind, "quit");
    assert.equal(game.phase, "gameover");
    assert.equal(game.endReason, "quit");
    assert.ok(Game.isGameOver(game));
    assert.ok(game.thought && game.thought.category === "quit");
  });
});

describe("quit choice in pool", () => {
  it("CHOICES includes nuclear quit option", () => {
    assert.ok(Notes.CHOICES.some((c) => c.id === "quit"));
    assert.ok(Notes.CHOICES.length >= 5);
  });
});

describe("game events for audio", () => {
  it("emits jump event when jumping from ground", () => {
    const game = Game.createGame();
    settle(game, 30);
    Game.step(game, { jump: true }, 1 / 60);
    assert.ok(game.events.some((e) => e.type === "jump"));
  });

  it("emits stomp event on enemy stomp", () => {
    const map = Map.createOfficeMap();
    map.enemySpawns = [{ x: 100, y: map.groundY - 28, vx: 0 }];
    const game = Game.createGame({ map: map, lives: 3 });
    settle(game, 15);
    const e = game.enemies[0];
    game.player.x = e.x;
    game.player.y = e.y - game.player.h + 4;
    game.player.vy = 200;
    game.player.invuln = 0;
    Game.step(game, {}, 1 / 60);
    assert.ok(game.events.some((ev) => ev.type === "stomp"));
  });

  it("emits deploy event on sprint advance", () => {
    const game = Game.createGame();
    game.events = [];
    Game.advanceSprint(game);
    assert.ok(game.events.some((e) => e.type === "deploy"));
  });

  it("emits slack_ping then notify on open + reply", () => {
    const game = Game.createGame();
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    assert.ok(game.events.some((e) => e.type === "slack_ping"));
    Game.step(game, { openInbox: true }, 0.05);
    assert.ok(game.events.some((e) => e.type === "notify"));
    Game.chooseNotification(game, "dismiss");
    assert.ok(game.events.some((e) => e.type === "notify_reply"));
  });

  it("audio playEvents maps known types without throwing in Node", () => {
    const Audio = require("../js/audio.js");
    assert.equal(
      Audio.playEvents([
        { type: "jump" },
        { type: "slack_ping" },
        { type: "deploy" },
      ]),
      undefined
    );
  });
});
