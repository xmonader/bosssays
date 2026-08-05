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

describe("enemy damage and stomp", () => {
  it("enemy contact damages player and reduces lives", () => {
    const map = Map.createOfficeMap();
    map.enemySpawns = [{ x: 200, y: map.groundY - 28, vx: 0 }];
    const game = Game.createGame({ map: map, lives: 3 });
    settle(game, 30);
    const e = game.enemies[0];
    assert.equal(e.alive, true);
    // Side-hit on the ground (not a stomp: same feet level, not falling onto head)
    game.player.x = e.x - 10;
    game.player.y = e.y;
    game.player.vy = 0;
    game.player.invuln = 0;
    // Direct hurt path also covered via collision after step
    const livesBefore = game.lives;
    // Multiple frames: gravity may set vy>0; keep side overlap with low vertical penetration
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
    game.player.vy = 200; // falling
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
    // Further steps stay game over
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
    // Place player on deploy
    const d = game.map.deploy;
    game.player.x = d.x;
    game.player.y = d.y + 10;
    Game.step(game, {}, 1 / 60);
    assert.equal(game.sprint, 2);
    assert.equal(game.deploys, 1);
    // Player reset near spawn
    assert.ok(
      Math.abs(game.player.x - game.map.spawn.x) < 5,
      "player back at spawn"
    );
    // Enemies respawned alive
    const alive = game.enemies.filter((e) => e.alive).length;
    assert.ok(alive > 0);
    // Not a final win
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

describe("notifications effects", () => {
  it("fires notification after interval and timeout stuns", () => {
    const rng = () => 0.1;
    const game = Game.createGame({ rng: rng, notifyImmediate: true });
    // First step should open notification
    Game.step(game, {}, 0.05);
    assert.ok(game.notifications.active, "notification should open");
    assert.equal(game.phase, "notification");

    // Burn timer across frames (step clamps dt to 0.05; need >4.5s)
    for (let i = 0; i < 400; i++) {
      Game.step(game, {}, 1 / 60);
      if (!game.notifications.active) break;
    }
    assert.equal(game.notifications.active, null);
    assert.ok(game.effects.stunTimer > 0, "timeout applies stun");
    assert.equal(game.lastEffects.kind, "timeout");
    assert.ok(game.effects.context >= 30);
  });

  it("dismiss vs love apply distinct effects", () => {
    const game = Game.createGame({ notifyImmediate: true });
    Game.step(game, {}, 0.05);
    assert.ok(game.notifications.active);

    const r1 = Game.chooseNotification(game, "dismiss");
    assert.equal(r1.effects.kind, "dismiss");
    assert.equal(r1.effects.stun, 0);
    assert.equal(r1.effects.hallucinate, false);
    const ctxAfterDismiss = game.effects.context;
    assert.ok(ctxAfterDismiss >= 5);

    // Fire another
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    assert.ok(game.notifications.active);
    const r2 = Game.chooseNotification(game, "love");
    assert.equal(r2.effects.kind, "love");
    assert.ok(game.effects.slowTimer > 0, "love applies slow");
    assert.ok(
      game.effects.hallucinated.length > 0,
      "love spawns hallucinated platform"
    );
    assert.ok(game.effects.context > ctxAfterDismiss);
  });

  it("on_it spawns calendar block solid", () => {
    const game = Game.createGame({ notifyImmediate: true });
    Game.step(game, {}, 0.05);
    Game.chooseNotification(game, "on_it");
    assert.ok(game.effects.calendarBlocks.length >= 1);
    const solids = Game.allSolids(game);
    const cal = game.effects.calendarBlocks[0];
    assert.ok(solids.some((p) => p === cal || p.label === "SYNC?"));
  });

  it("resolveNotification pure API distinguishes timeout and dismiss", () => {
    const state = Notes.createNotificationState();
    state.active = {
      id: 0,
      from: "CEO",
      text: "hi",
      timer: 1,
      maxTimer: 4,
      choices: Notes.CHOICES,
    };
    const a = Notes.resolveNotification(
      { active: Object.assign({}, state.active), timeSince: 0 },
      "dismiss"
    );
    // manual
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
    assert.ok(game.player.onGround || game.player.y < game.map.groundY);
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
  });
});

describe("collectibles", () => {
  it("map provides collectible spawns", () => {
    const m = Map.createOfficeMap();
    assert.ok(m.collectibleSpawns && m.collectibleSpawns.length >= 5);
    assert.ok(m.collectibleSpawns.some((c) => c.kind === "story"));
    assert.ok(m.collectibleSpawns.some((c) => c.kind === "coffee"));
  });

  it("touching a story point collects it and adds score", () => {
    const game = Game.createGame();
    const c = game.collectibles.find((x) => x.kind === "story");
    assert.ok(c);
    game.player.x = c.x;
    game.player.y = c.y;
    const before = game.score;
    Game.step(game, {}, 1 / 60);
    assert.equal(c.collected, true);
    assert.equal(game.score, before + Game.STORY_POINTS);
    assert.ok(game.events.some((e) => e.type === "collect" && e.kind === "story"));
    // second touch no double-dip
    const mid = game.score;
    Game.step(game, {}, 1 / 60);
    assert.equal(game.score, mid);
  });

  it("coffee reduces context and awards points", () => {
    const game = Game.createGame();
    game.effects.context = 40;
    const c = game.collectibles.find((x) => x.kind === "coffee");
    assert.ok(c);
    game.player.x = c.x;
    game.player.y = c.y;
    Game.step(game, {}, 1 / 60);
    assert.equal(c.collected, true);
    assert.ok(game.score >= Game.COFFEE_POINTS);
    assert.ok(game.effects.context < 40);
    assert.ok(game.events.some((e) => e.type === "collect" && e.kind === "coffee"));
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
    assert.ok(game.collectibles.length >= 5);
  });
});

describe("game events for audio", () => {
  it("emits jump event when jumping from ground", () => {
    const game = Game.createGame();
    settle(game, 30);
    Game.step(game, { jump: true }, 1 / 60);
    assert.ok(
      game.events.some((e) => e.type === "jump"),
      "expected jump event, got " + JSON.stringify(game.events)
    );
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

  it("emits notify and notify_reply events", () => {
    const game = Game.createGame({ notifyImmediate: true });
    Game.step(game, {}, 0.05);
    assert.ok(game.events.some((e) => e.type === "notify"));
    Game.chooseNotification(game, "dismiss");
    assert.ok(game.events.some((e) => e.type === "notify_reply"));
  });

  it("audio playEvents maps known types without throwing in Node", () => {
    const Audio = require("../js/audio.js");
    // No AudioContext in Node — must no-op safely
    assert.equal(
      Audio.playEvents([
        { type: "jump" },
        { type: "notify" },
        { type: "deploy" },
      ]),
      undefined
    );
    assert.equal(Audio.play("jump"), false);
  });
});
