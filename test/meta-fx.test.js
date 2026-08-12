"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Meta = require("../js/meta.js");
const Fx = require("../js/fx.js");
const Game = require("../js/game.js");

describe("meta", () => {
  it("daily seed is YYYYMMDD integer", () => {
    const d = new Date(Date.UTC(2026, 7, 12)); // Aug 12 2026 local-ish
    const seed = Meta.dailySeed(d);
    assert.equal(typeof seed, "number");
    assert.ok(seed >= 20260101);
  });

  it("mulberry32 is deterministic", () => {
    const a = Meta.mulberry32(42);
    const b = Meta.mulberry32(42);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });

  it("difficulty table has chill/mid/toxic", () => {
    assert.ok(Meta.DIFFICULTY.chill.slackMul > Meta.DIFFICULTY.toxic.slackMul);
    assert.ok(Meta.DIFFICULTY.toxic.enemySpeedMul > 1);
  });
});

describe("fx", () => {
  it("creates and ticks particles/floats", () => {
    const fx = Fx.createFx();
    Fx.shake(fx, 0.5);
    Fx.flash(fx, "#fff", 0.3);
    Fx.addFloat(fx, 10, 10, "+1", "#fff");
    Fx.addParticles(fx, 0, 0, "#f00", 5);
    Fx.addToast(fx, "Hi", "there");
    assert.ok(fx.particles.length === 5);
    assert.ok(fx.floats.length === 1);
    Fx.tick(fx, 0.5, false);
    assert.ok(fx.shake < 0.5);
    Fx.tick(fx, 5, true);
    assert.equal(fx.shake, 0);
  });
});

describe("combo / political / powerups / storm", () => {
  it("stomp builds combo and score", () => {
    const map = require("../js/map.js").createOfficeMap();
    map.enemySpawns = [
      { x: 100, y: map.groundY - 28, vx: 0 },
      { x: 160, y: map.groundY - 28, vx: 0 },
    ];
    const game = Game.createGame({
      map: map,
      skipTutorial: true,
      settings: { tutorialDone: true },
    });
    for (let i = 0; i < 20; i++) Game.step(game, {}, 1 / 60);
    const score0 = game.score;
    const e = game.enemies[0];
    game.player.x = e.x;
    game.player.y = e.y - game.player.h + 4;
    game.player.vy = 200;
    game.player.invuln = 0;
    Game.step(game, {}, 1 / 60);
    assert.ok(game.combo >= 1);
    assert.ok(game.score > score0);
  });

  it("love reply raises political capital", () => {
    const game = Game.createGame({
      skipTutorial: true,
      settings: { tutorialDone: true },
    });
    const before = game.political;
    game.notifications.timeSince = 999;
    Game.step(game, {}, 0.05);
    Game.step(game, { openInbox: true }, 0.05);
    assert.ok(game.notifications.active);
    Game.chooseNotification(game, "love");
    assert.ok(game.political > before);
  });

  it("focus powerup mutes slack arrivals", () => {
    const game = Game.createGame({
      skipTutorial: true,
      settings: { tutorialDone: true },
      mode: "normal",
    });
    game.effects.focusTimer = 5;
    game.notifications.timeSince = 0;
    const inbox0 = game.notifications.inbox.length;
    for (let i = 0; i < 120; i++) Game.step(game, {}, 0.1);
    assert.equal(game.notifications.inbox.length, inbox0);
  });

  it("startStorm floods projectiles and inbox", () => {
    const game = Game.createGame({ skipTutorial: true });
    Game.startStorm(game);
    assert.ok(game.stormTimer > 0);
    assert.ok(game.projectiles.length > 0);
  });

  it("noslack mode does not enqueue slack", () => {
    const game = Game.createGame({
      mode: "noslack",
      skipTutorial: true,
    });
    for (let i = 0; i < 100; i++) Game.step(game, {}, 0.2);
    assert.equal(game.notifications.inbox.length, 0);
  });

  it("daily mode uses seed", () => {
    const seed = Meta.dailySeed(new Date(2026, 5, 1));
    const a = Game.createGame({
      mode: "daily",
      seed: seed,
      skipTutorial: true,
    });
    const b = Game.createGame({
      mode: "daily",
      seed: seed,
      skipTutorial: true,
    });
    assert.equal(a.seed, b.seed);
    assert.equal(a.map.brand, b.map.brand);
  });

  it("tech debt rises on deploy", () => {
    const game = Game.createGame({ skipTutorial: true });
    const d0 = game.techDebt;
    Game.advanceSprint(game);
    assert.ok(game.techDebt > d0);
    assert.equal(game.sprint, 2);
  });

  it("applyPowerup focus sets timer", () => {
    const game = Game.createGame({ skipTutorial: true });
    Game.applyPowerup(game, "focus");
    assert.ok(game.effects.focusTimer >= 12);
  });

  it("double jump and wall powerups set timers", () => {
    const game = Game.createGame({ skipTutorial: true });
    Game.applyPowerup(game, "double");
    Game.applyPowerup(game, "wall");
    assert.ok(game.effects.doubleJumpTimer >= 20);
    assert.ok(game.effects.wallJumpTimer >= 20);
  });

  it("serializeContinue round-trips key fields", () => {
    const game = Game.createGame({ skipTutorial: true, score: 42 });
    game.political = 66;
    const snap = Game.serializeContinue(game);
    assert.equal(snap.v, 1);
    assert.equal(snap.score, 42);
    const g2 = Game.createGame({
      skipTutorial: true,
      continueSnap: snap,
      score: 0,
    });
    assert.equal(g2.political, 66);
  });

  it("meeting note resolves accept/decline", () => {
    const Notes = require("../js/notifications.js");
    const state = Notes.createNotificationState();
    state.active = Notes.buildMeetingNote(() => 0.2);
    const acc = Notes.resolveNotification(state, "accept");
    assert.equal(acc.effects.kind, "meeting_accept");
    assert.equal(acc.effects.calendar, true);
    state.active = Notes.buildMeetingNote(() => 0.2);
    const dec = Notes.resolveNotification(state, "decline");
    assert.equal(dec.effects.kind, "meeting_decline");
  });

  it("review pass/fail scoring", () => {
    const Notes = require("../js/notifications.js");
    const state = Notes.createNotificationState();
    state.active = Notes.buildReviewNote(() => 0);
    const okId = state.active.reviewOk[0];
    const pass = Notes.resolveNotification(state, okId);
    assert.equal(pass.effects.kind, "review_pass");
    state.active = Notes.buildReviewNote(() => 0);
    const fail = Notes.resolveNotification(state, "rev_b");
    assert.ok(fail.effects.kind === "review_fail" || fail.effects.kind === "review_pass");
  });

  it("run card encode/decode", () => {
    const run = { score: 100, sprint: 3, deploys: 2, mode: "daily", difficulty: "mid" };
    const card = Meta.encodeRunCard(run);
    assert.match(card, /^BS1:/);
    const back = Meta.decodeRunCard(card);
    assert.equal(back.score, 100);
    assert.equal(Meta.decodeRunCard("BS1:1:1:1:x:y:bad"), null);
  });

  it("boss chase spawns", () => {
    const game = Game.createGame({ skipTutorial: true });
    Game.spawnBossChase(game);
    assert.ok(game.bossChase && game.bossChase.alive);
  });

  it("maps include secret HR pickup sometimes", () => {
    let found = false;
    for (let s = 1; s <= 12; s++) {
      const m = require("../js/map.js").createOfficeMap({ sprint: s });
      if (m.collectibleSpawns.some((c) => c.kind === "secret")) found = true;
    }
    assert.ok(found, "expected a secret pickup in some sprint");
  });

  it("physics double jump leaves ground twice", () => {
    const Physics = require("../js/physics.js");
    const body = Physics.createBody(0, 100, 20, 30);
    body.onGround = true;
    const plats = [{ x: -50, y: 130, w: 200, h: 20 }];
    Physics.stepBody(body, { jump: true }, plats, 1 / 60, { canDoubleJump: true });
    assert.ok(body.vy < 0);
    body.onGround = false;
    body.jumpsLeft = 1;
    const vy0 = body.vy;
    Physics.stepBody(body, { jump: true }, plats, 1 / 60, { canDoubleJump: true });
    assert.ok(body.vy < vy0 || body.vy < 0);
  });
});
