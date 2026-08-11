/**
 * Pure game state machine: player, enemies, lives, sprint loop, notifications.
 * No canvas / DOM. Unit-tested via Node.
 */
(function (root) {
  "use strict";

  function loadDeps() {
    let Physics, MapMod, Notes;
    if (typeof module !== "undefined" && module.exports) {
      Physics = require("./physics.js");
      MapMod = require("./map.js");
      Notes = require("./notifications.js");
    } else {
      Physics = root.BossSaysPhysics;
      MapMod = root.BossSaysMap;
      Notes = root.BossSaysNotifications;
    }
    return { Physics: Physics, Map: MapMod, Notes: Notes };
  }

  const deps = loadDeps();
  const Physics = deps.Physics;
  const MapMod = deps.Map;
  const Notes = deps.Notes;

  const PLAYER_W = 28;
  const PLAYER_H = 36;
  const ENEMY_W = 28;
  const ENEMY_H = 28;
  const MAX_LIVES = 3;
  const MAX_CONTEXT = 100;
  const INVULN_TIME = 1.2;
  const STOMP_BOUNCE = -320;
  const STORY_POINTS = 10;
  const COFFEE_POINTS = 5;
  const COFFEE_CONTEXT_RELIEF = 12;

  /** IC inner monologue — frustration at leadership stupidity */
  const THOUGHTS = {
    slack_ping: [
      "*sigh*",
      "here we go again…",
      "please not another 'quick' thing",
      "my soul just alt-tabbed out",
      "I can feel my focus dying",
      "unread = unpaid emotional labor",
      "why is leadership awake",
      "nope. not opening that yet.",
      "the notification sound is a war crime",
      "context switch tax: 1 brain",
    ],
    open: [
      "I already regret opening this",
      "words… so many empty words",
      "this could have been silence",
      "they're serious. that's worse.",
      "mentally drafting 'as per my last jump'",
      "smile in Slack, scream in skull",
      "translating nonsense → tickets…",
      "if I reply wrong I die socially",
    ],
    love: [
      "I hate that I typed 'love this'",
      "selling my spine for political capital",
      "internal monologue: lol no",
      "future me will quote this in therapy",
      "performance: enthusiastic NPC",
    ],
    on_it: [
      "I am not, in fact, 'on it'",
      "added to the pile of lies",
      "scope just had a baby",
      "calendar block incoming. cool cool",
    ],
    dismiss: [
      "muted. temporary peace.",
      "if I ignore it, is it gaslighting?",
      "inbox zero is a myth",
      "see you in the escalation thread",
    ],
    pushback: [
      "said the quiet part. bracing.",
      "edge cases? in THIS economy?",
      "career damage: maybe. dignity: slight uptick",
      "they'll 'circle back' with revenge",
    ],
    timeout: [
      "…I stared too long",
      "they noticed the silence. of course.",
      "analysis paralysis: professional edition",
    ],
    hurt: [
      "ow. also: expected.",
      "PTO is a finite resource. like patience.",
      "this is fine. (it is not)",
    ],
    deploy: [
      "shipped. they'll rebrand before lunch.",
      "same office, new logo, same pain",
      "deploy joy half-life: 12 seconds",
      "what fresh Slack awaits",
    ],
    backlog: [
      "inbox is a second boss fight",
      "they're stacking trauma",
      "I can hear the typing indicators",
    ],
    coffee: [
      "coffee: the only OKR that matters",
      "brief chemical hope",
    ],
    collect: [
      "story points. fictional currency.",
      "at least this number goes up",
    ],
    idle: [
      "…",
      "*stares into the open office*",
      "is this what they meant by ownership",
      "I could be gardening right now",
    ],
  };

  function setThought(game, category) {
    const pool = THOUGHTS[category] || THOUGHTS.idle;
    if (!pool.length) return null;
    const text = pool[Math.floor(game.rng() * pool.length)];
    const hold = Math.min(4.2, 2.2 + text.length * 0.035);
    game.thought = { text: text, timer: hold, category: category };
    return game.thought;
  }

  function tickThought(game, dt) {
    if (!game.thought) return;
    game.thought.timer -= dt;
    if (game.thought.timer <= 0) game.thought = null;
  }

  function createEnemy(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      w: ENEMY_W,
      h: ENEMY_H,
      vx: spawn.vx || 50,
      vy: 0,
      alive: true,
      onGround: false,
    };
  }

  function createPlayer(spawn) {
    const b = Physics.createBody(spawn.x, spawn.y, PLAYER_W, PLAYER_H);
    b.invuln = 0;
    b.facing = 1;
    return b;
  }

  function createCollectible(spawn, id) {
    return {
      id: id,
      x: spawn.x,
      y: spawn.y,
      w: spawn.w || 18,
      h: spawn.h || 18,
      kind: spawn.kind || "story",
      collected: false,
    };
  }

  function spawnCollectibles(map) {
    const list = map.collectibleSpawns || [];
    const out = [];
    for (let i = 0; i < list.length; i++) {
      out.push(createCollectible(list[i], i));
    }
    return out;
  }

  function emptyEffects() {
    return {
      stunTimer: 0,
      slowTimer: 0,
      context: 0,
      calendarBlocks: [],
      hallucinated: [],
      lastResolveKind: null,
    };
  }

  function pushEvent(game, type, extra) {
    if (!game.events) game.events = [];
    const e = { type: type };
    if (extra) {
      const keys = Object.keys(extra);
      for (let i = 0; i < keys.length; i++) e[keys[i]] = extra[keys[i]];
    }
    game.events.push(e);
  }

  /**
   * Create a fresh game. Optional seed map for tests.
   */
  function createGame(opts) {
    opts = opts || {};
    const sprint = opts.sprint != null ? opts.sprint : 1;
    const lives = opts.lives != null ? opts.lives : MAX_LIVES;
    const rng = opts.rng || Math.random;
    const map =
      opts.map ||
      MapMod.createOfficeMap({ sprint: sprint, rng: rng });

    const game = {
      map: map,
      sprint: sprint,
      lives: lives,
      maxLives: MAX_LIVES,
      deploys: opts.deploys != null ? opts.deploys : 0,
      score: opts.score != null ? opts.score : 0,
      collectedCount: opts.collectedCount != null ? opts.collectedCount : 0,
      phase: "playing", // playing | notification | gameover
      player: createPlayer(map.spawn),
      enemies: map.enemySpawns.map(createEnemy),
      collectibles: spawnCollectibles(map),
      notifications: Notes.createNotificationState(),
      effects: emptyEffects(),
      cameraX: 0,
      time: 0,
      rng: rng,
      // last applied effects for tests
      lastEffects: null,
      message: "",
      messageTimer: 0,
      thought: null,
      events: [],
      thoughtIdleAcc: 0,
    };

    // Optionally suppress first notification delay for tests
    if (opts.notifyImmediate) {
      game.notifications.timeSince = Notes.intervalForSprint(sprint);
    }
    return game;
  }

  function allSolids(game) {
    const extras = [];
    const fx = game.effects;
    for (let i = 0; i < fx.calendarBlocks.length; i++) {
      extras.push(fx.calendarBlocks[i]);
    }
    for (let i = 0; i < fx.hallucinated.length; i++) {
      const h = fx.hallucinated[i];
      if (h.solid) extras.push(h);
    }
    return MapMod.solidPlatforms(game.map, extras);
  }

  function applyEffectsPayload(game, effects) {
    if (!effects) return;
    game.lastEffects = effects;
    game.effects.lastResolveKind = effects.kind;
    if (effects.stun > 0) {
      game.effects.stunTimer = Math.max(game.effects.stunTimer, effects.stun);
    }
    if (effects.slow > 0) {
      game.effects.slowTimer = Math.max(game.effects.slowTimer, effects.slow);
    }
    game.effects.context = Math.min(
      MAX_CONTEXT,
      game.effects.context + (effects.context || 0)
    );

    if (effects.calendar) {
      const px = game.player.x + 80;
      const block = {
        x: px,
        y: game.map.groundY - 100,
        w: 70,
        h: 100,
        label: "SYNC?",
        kind: "calendar",
        ttl: 12,
      };
      game.effects.calendarBlocks.push(block);
    }

    if (effects.hallucinate) {
      // Fake platform that looks solid but may vanish — first ones solid briefly then ghost
      const hx = game.player.x + 120;
      game.effects.hallucinated.push({
        x: hx,
        y: game.player.y - 40,
        w: 90,
        h: 14,
        label: "AI platform",
        kind: "hallucination",
        solid: true,
        ttl: 2.5,
        fake: true,
      });
    }

    // Context OOM: full meter stuns hard
    if (game.effects.context >= MAX_CONTEXT) {
      game.effects.stunTimer = Math.max(game.effects.stunTimer, 1.5);
      game.effects.context = Math.floor(MAX_CONTEXT * 0.4);
      game.message = "Context window full — OOM";
      game.messageTimer = 2;
    }
  }

  function hurtPlayer(game) {
    if (game.player.invuln > 0 || game.phase === "gameover") return false;
    game.lives -= 1;
    game.player.invuln = INVULN_TIME;
    game.player.vy = -200;
    pushEvent(game, "hurt");
    setThought(game, "hurt");
    if (game.lives <= 0) {
      game.lives = 0;
      game.phase = "gameover";
      game.message = "Laid off. Game over.";
      game.messageTimer = 99;
      pushEvent(game, "gameover");
    }
    return true;
  }

  function stompEnemy(game, enemy) {
    enemy.alive = false;
    game.player.vy = STOMP_BOUNCE;
    game.player.onGround = false;
    pushEvent(game, "stomp");
  }

  function updateEnemies(game, dt, platforms) {
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (!e.alive) continue;
      e.vy += Physics.GRAVITY * dt;
      if (e.vy > Physics.MAX_FALL) e.vy = Physics.MAX_FALL;

      e.x += e.vx * dt;
      // reverse on wall / platform edge-ish: collide horiz
      for (let j = 0; j < platforms.length; j++) {
        const p = platforms[j];
        if (!Physics.aabb(e, p)) continue;
        if (e.vx > 0) e.x = p.x - e.w;
        else e.x = p.x + p.w;
        e.vx *= -1;
      }

      e.y += e.vy * dt;
      e.onGround = false;
      for (let j = 0; j < platforms.length; j++) {
        const p = platforms[j];
        if (!Physics.aabb(e, p)) continue;
        if (e.vy > 0) {
          e.y = p.y - e.h;
          e.vy = 0;
          e.onGround = true;
        } else if (e.vy < 0) {
          e.y = p.y + p.h;
          e.vy = 0;
        }
      }

      // Fall off map
      if (e.y > game.map.height + 50) e.alive = false;
    }
  }

  function playerEnemyCollisions(game) {
    const p = game.player;
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (!e.alive) continue;
      if (!Physics.aabb(p, e)) continue;
      // Stomp if falling and feet near enemy top
      const stomp =
        p.vy > 0 && p.y + p.h - e.y < 16 && p.y + p.h <= e.y + e.h * 0.6;
      if (stomp) {
        stompEnemy(game, e);
      } else {
        hurtPlayer(game);
      }
    }
  }

  /**
   * Touch collectibles: story points add score; coffee also eases context.
   */
  function collectPickups(game) {
    const p = game.player;
    let n = 0;
    for (let i = 0; i < game.collectibles.length; i++) {
      const c = game.collectibles[i];
      if (c.collected) continue;
      if (!Physics.aabb(p, c)) continue;
      c.collected = true;
      n++;
      game.collectedCount += 1;
      if (c.kind === "coffee") {
        game.score += COFFEE_POINTS;
        game.effects.context = Math.max(
          0,
          game.effects.context - COFFEE_CONTEXT_RELIEF
        );
        pushEvent(game, "collect", { kind: "coffee", points: COFFEE_POINTS });
        game.message = "Coffee +" + COFFEE_POINTS + " · context −" + COFFEE_CONTEXT_RELIEF;
        game.messageTimer = 2.4;
        setThought(game, "coffee");
      } else {
        game.score += STORY_POINTS;
        pushEvent(game, "collect", { kind: "story", points: STORY_POINTS });
        game.message = "Story point +" + STORY_POINTS;
        game.messageTimer = 2.0;
        if (game.rng() < 0.45) setThought(game, "collect");
      }
    }
    return n;
  }

  function checkDeploy(game) {
    const d = game.map.deploy;
    if (Physics.aabb(game.player, d)) {
      advanceSprint(game);
      return true;
    }
    return false;
  }

  /**
   * Deploy reached: bump sprint, reset entities, keep score-ish state.
   */
  function advanceSprint(game) {
    game.sprint += 1;
    game.deploys += 1;
    // New layout / rebrand / theme each sprint so the office doesn't feel copy-pasted
    game.map = MapMod.createOfficeMap({
      sprint: game.sprint,
      rng: game.rng,
    });
    game.player = createPlayer(game.map.spawn);
    game.enemies = game.map.enemySpawns.map(createEnemy);
    game.collectibles = spawnCollectibles(game.map);
    game.effects.calendarBlocks = [];
    game.effects.hallucinated = [];
    game.effects.stunTimer = 0;
    game.effects.slowTimer = 0;
    game.effects.context = Math.min(
      MAX_CONTEXT,
      Math.floor(game.effects.context * 0.5) + 5
    );
    game.notifications.active = null;
    game.notifications.inbox = [];
    game.notifications.timeSince = 0;
    game.phase = "playing";
    const brand = game.map.brandLabel || game.map.brand || "HQ";
    const theme = (game.map.theme && game.map.theme.id) || "office";
    game.message =
      "Sprint " + game.sprint + " · rebrand: " + brand + " · theme: " + theme;
    game.messageTimer = 3.2;
    game.cameraX = 0;
    pushEvent(game, "deploy");
    setThought(game, "deploy");
  }

  function tickEffectTimers(game, dt) {
    if (game.effects.stunTimer > 0) {
      game.effects.stunTimer = Math.max(0, game.effects.stunTimer - dt);
    }
    if (game.effects.slowTimer > 0) {
      game.effects.slowTimer = Math.max(0, game.effects.slowTimer - dt);
    }
    // Calendar TTL
    const kept = [];
    for (let i = 0; i < game.effects.calendarBlocks.length; i++) {
      const b = game.effects.calendarBlocks[i];
      b.ttl -= dt;
      if (b.ttl > 0) kept.push(b);
    }
    game.effects.calendarBlocks = kept;

    const hall = [];
    for (let i = 0; i < game.effects.hallucinated.length; i++) {
      const h = game.effects.hallucinated[i];
      h.ttl -= dt;
      if (h.ttl <= 0.8) h.solid = false; // becomes ghost / trap
      if (h.ttl > 0) hall.push(h);
    }
    game.effects.hallucinated = hall;

    if (game.messageTimer > 0) {
      game.messageTimer = Math.max(0, game.messageTimer - dt);
      if (game.messageTimer === 0) game.message = "";
    }
  }

  function fallDeath(game) {
    if (game.player.y > game.map.height + 20) {
      hurtPlayer(game);
      if (game.phase !== "gameover") {
        // respawn at spawn
        const s = game.map.spawn;
        game.player.x = s.x;
        game.player.y = s.y;
        game.player.vx = 0;
        game.player.vy = 0;
      }
    }
  }

  /**
   * Open next unread Slack when player chooses (Tab / E).
   */
  function openSlack(game) {
    if (game.phase === "gameover") return null;
    if (game.notifications.active) return game.notifications.active;
    const note = Notes.openInbox(game.notifications);
    if (note) {
      game.phase = "notification";
      pushEvent(game, "notify");
      game.player.invuln = Math.max(game.player.invuln, 0.5);
      game.message =
        "Reading Slack — " + (note.name || note.from) + " · reply with 1–4";
      game.messageTimer = 1.8;
      setThought(game, "open");
    }
    return note;
  }

  /**
   * Resolve the open notification with a choice id.
   */
  function chooseNotification(game, choiceId) {
    if (!game.notifications.active) return null;
    const result = Notes.resolveNotification(game.notifications, choiceId);
    if (result.cleared) {
      applyEffectsPayload(game, result.effects);
      game.phase = "playing";
      if (result.effects.kind === "timeout") {
        game.message = "Chat auto-closed — mild stun";
        pushEvent(game, "notify_timeout");
        setThought(game, "timeout");
      } else {
        game.message = "Replied: " + result.effects.kind;
        pushEvent(game, "notify_reply", { kind: result.effects.kind });
        const cat =
          result.effects.kind === "love"
            ? "love"
            : result.effects.kind === "on_it"
              ? "on_it"
              : result.effects.kind === "pushback"
                ? "pushback"
                : "dismiss";
        setThought(game, cat);
      }
      if (result.effects.stun > 0) pushEvent(game, "stun");
      game.messageTimer = 2.0;
      game.player.invuln = Math.max(game.player.invuln, 0.45);
    }
    return result;
  }

  /**
   * One simulation step.
   * @param {object} game
   * @param {{left?:boolean,right?:boolean,jump?:boolean,choice?:string|null,openInbox?:boolean}} input
   * @param {number} dt seconds
   */
  function step(game, input, dt) {
    if (dt > 0.05) dt = 0.05; // clamp
    input = input || {};
    game.time += dt;
    game.events = [];

    if (game.phase === "gameover") {
      tickThought(game, dt);
      return game;
    }

    // Choice from UI (1–4 only while reading)
    if (input.choice && game.notifications.active) {
      chooseNotification(game, input.choice);
    }

    // Player opens inbox when ready (does not interrupt mid-jump unless they press Tab)
    if (input.openInbox && !game.notifications.active) {
      openSlack(game);
    }

    // Enqueue Slack into inbox — play continues until player opens
    const tick = Notes.tickNotifications(
      game.notifications,
      dt,
      game.sprint,
      game.rng,
      !!game.notifications.active
    );
    if (tick.arrived) {
      pushEvent(game, "slack_ping", {
        from: tick.arrived.from,
        inbox: tick.inboxCount,
      });
      game.message =
        "Slack · " +
        (tick.arrived.name || tick.arrived.from) +
        "  (Tab/E to read · " +
        tick.inboxCount +
        " unread)";
      game.messageTimer = 2.8;
      setThought(game, "slack_ping");
    }
    if (tick.backlogPressure) {
      game.effects.context = Math.min(
        MAX_CONTEXT,
        game.effects.context + 4
      );
      game.message = "Inbox full — leadership is filling your context";
      game.messageTimer = 1.6;
      setThought(game, "backlog");
    }

    if (game.notifications.active) {
      game.phase = "notification";
      // Freeze only while intentionally reading
      game.player.vx = 0;
      game.player.vy = 0;

      const timed = Notes.checkTimeout(game.notifications);
      if (timed && timed.cleared) {
        applyEffectsPayload(game, timed.effects);
        game.phase = "playing";
        game.message = "Chat auto-closed — mild stun";
        game.messageTimer = 2.0;
        pushEvent(game, "notify_timeout");
        setThought(game, "timeout");
        if (timed.effects.stun > 0) pushEvent(game, "stun");
        game.player.invuln = Math.max(game.player.invuln, 0.45);
      }
      tickThought(game, dt);
      return game;
    }

    if (game.phase === "notification") {
      game.phase = "playing";
    }

    tickEffectTimers(game, dt);

    if (game.player.invuln > 0) {
      game.player.invuln = Math.max(0, game.player.invuln - dt);
    }

    const platforms = allSolids(game);
    const stunned = game.effects.stunTimer > 0;
    const physInput = {
      left: input.left && !stunned,
      right: input.right && !stunned,
      jump: input.jump && !stunned,
    };
    const slowFactor = game.effects.slowTimer > 0 ? 0.45 : 1;

    const wasGround = game.player.onGround;
    const willJump = physInput.jump && wasGround;
    Physics.stepBody(game.player, physInput, platforms, dt, {
      stunned: stunned,
      slowFactor: slowFactor,
    });
    if (willJump && !game.player.onGround && game.player.vy < 0) {
      pushEvent(game, "jump");
    } else if (!wasGround && game.player.onGround) {
      pushEvent(game, "land");
    }

    if (physInput.left) game.player.facing = -1;
    if (physInput.right) game.player.facing = 1;

    updateEnemies(game, dt, platforms);
    playerEnemyCollisions(game);
    if (game.phase !== "gameover") {
      collectPickups(game);
    }
    fallDeath(game);

    if (game.phase !== "gameover") {
      checkDeploy(game);
    }

    // Occasional idle sigh when nothing else is going on
    if (!game.thought && game.phase === "playing") {
      game.thoughtIdleAcc = (game.thoughtIdleAcc || 0) + dt;
      if (game.thoughtIdleAcc > 11 + game.rng() * 8) {
        game.thoughtIdleAcc = 0;
        if (game.rng() < 0.55) setThought(game, "idle");
      }
    } else {
      game.thoughtIdleAcc = 0;
    }
    tickThought(game, dt);

    // Camera follow
    const viewW = 800;
    game.cameraX = game.player.x + game.player.w / 2 - viewW / 2;
    if (game.cameraX < 0) game.cameraX = 0;
    if (game.cameraX > game.map.width - viewW) {
      game.cameraX = Math.max(0, game.map.width - viewW);
    }

    return game;
  }

  function isGameOver(game) {
    return game.phase === "gameover" || game.lives <= 0;
  }

  const API = {
    MAX_LIVES: MAX_LIVES,
    MAX_CONTEXT: MAX_CONTEXT,
    PLAYER_W: PLAYER_W,
    PLAYER_H: PLAYER_H,
    createGame: createGame,
    step: step,
    openSlack: openSlack,
    chooseNotification: chooseNotification,
    advanceSprint: advanceSprint,
    hurtPlayer: hurtPlayer,
    collectPickups: collectPickups,
    allSolids: allSolids,
    applyEffectsPayload: applyEffectsPayload,
    isGameOver: isGameOver,
    setThought: setThought,
    THOUGHTS: THOUGHTS,
    STORY_POINTS: STORY_POINTS,
    COFFEE_POINTS: COFFEE_POINTS,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysGame = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
