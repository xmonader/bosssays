/**
 * Pure game state machine: player, enemies, lives, sprint loop, notifications.
 * No canvas / DOM. Unit-tested via Node.
 */
(function (root) {
  "use strict";

  function loadDeps() {
    let Physics, MapMod, Notes, Fx, Meta;
    if (typeof module !== "undefined" && module.exports) {
      Physics = require("./physics.js");
      MapMod = require("./map.js");
      Notes = require("./notifications.js");
      Fx = require("./fx.js");
      Meta = require("./meta.js");
    } else {
      Physics = root.BossSaysPhysics;
      MapMod = root.BossSaysMap;
      Notes = root.BossSaysNotifications;
      Fx = root.BossSaysFx;
      Meta = root.BossSaysMeta;
    }
    return {
      Physics: Physics,
      Map: MapMod,
      Notes: Notes,
      Fx: Fx,
      Meta: Meta,
    };
  }

  const deps = loadDeps();
  const Physics = deps.Physics;
  const MapMod = deps.Map;
  const Notes = deps.Notes;
  const Fx = deps.Fx;
  const Meta = deps.Meta;

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
    quit: [
      "sent. cannot unsend. good.",
      "laptop → wall (metaphorically)",
      "freeeeeedooooom (terrifying)",
      "HR is typing… I don't care",
      "best commit of my career: exit 1",
      "gardening arc: unlocked",
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
      "*slurp* ok. 4 more hours. maybe.",
      "this is a medical device now",
      "sleep debt paid in beans",
      "hot bean water = temporary humanity",
      "if leadership could taste this clarity",
      "Zzz deferred. not cancelled.",
      "mm. burnt. perfect.",
    ],
    collect: [
      "story points. fictional currency.",
      "at least this number goes up",
      "Jira will still say 0.5 though",
      "collecting cope tokens",
      "tiny win. bank it.",
      "ping — dopamine. cheap but legal.",
    ],
    chair: [
      "ergonomic? emotionally no.",
      "if I sit I will never stand again",
      "hot-desking is a war crime",
      "this chair has known suffering",
    ],
    plant: [
      "the plant gets more water than I do",
      "still greener than the roadmap",
      "photosynthesis > standups",
    ],
    monitor: [
      "dual monitors, single will to live",
      "blue light: the company vitamin",
      "pixel prison, but mine",
    ],
    box: [
      "moving boxes. reorg energy.",
      "what's in the box? tech debt.",
      "do not open until Q4",
    ],
    chart: [
      "chart goes up. my mood doesn't.",
      "axis of delusion",
      "they printed this in color. bold.",
    ],
    lock: [
      "SOC2 sticker energy",
      "security theater, front row",
      "password is Password1! probably",
    ],
    antenna: [
      "5 bars of anxiety",
      "signal: strong. meaning: none.",
    ],
    beanbag: [
      "culture. (sits in the corner forever)",
      "nap illegal. beanbag decorative.",
    ],
    prop: [
      "office clutter: my only friend",
      "touched grass? no. touched plastic.",
    ],
    tired: [
      "eyelids filing a ticket",
      "running on Slack and spite",
      "sleep is a roadmap item: P3",
      "3am energy at 2pm",
      "I can hear my own latency",
      "please no more 'quick' thoughts",
    ],
    idle: [
      "…",
      "*stares into the open office*",
      "is this what they meant by ownership",
      "I could be gardening right now",
      "*yawns into the hoodie*",
    ],
  };

  const MAX_SLEEP = 100;
  const COFFEE_SLEEP_RELIEF = 22;

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
    const vx = spawn.vx != null ? spawn.vx : 50;
    return {
      x: spawn.x,
      y: spawn.y,
      w: ENEMY_W,
      h: ENEMY_H,
      vx: vx,
      vy: 0,
      alive: true,
      onGround: false,
      homeX: spawn.x,
      homeY: spawn.y,
      homeVx: vx,
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

  function spawnInteractables(map) {
    const list = map.interactableSpawns || [];
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      out.push({
        id: i,
        x: s.x,
        y: s.y,
        w: s.w || 28,
        h: s.h || 30,
        kind: s.kind || "prop",
        emoji: s.emoji || "📦",
        used: false,
      });
    }
    return out;
  }

  /** Fatter hitbox so walking past actually registers */
  function paddedBox(b, pad) {
    pad = pad == null ? 10 : pad;
    return {
      x: b.x - pad,
      y: b.y - pad,
      w: b.w + pad * 2,
      h: b.h + pad * 2,
    };
  }

  function emptyEffects() {
    return {
      stunTimer: 0,
      slowTimer: 0,
      context: 0,
      sleepDebt: 0, // 0 rested → 100 walking zombie from stupid requests
      calendarBlocks: [],
      hallucinated: [],
      lastResolveKind: null,
      focusTimer: 0, // mute slack arrivals
      oopTimer: 0, // phase calendar
      standupTimer: 0, // star invuln
      pureMarioTimer: 0, // secret DND pure platformer
    };
  }

  function bumpCombo(game, pts, x, y, label) {
    game.combo = (game.combo || 0) + 1;
    game.comboTimer = 2.4;
    if (game.combo > (game.bestCombo || 0)) game.bestCombo = game.combo;
    const mult = Math.min(10, game.combo);
    const gain = Math.floor((pts || 10) * (1 + (mult - 1) * 0.35));
    game.score += gain;
    if (Fx && game.fx) {
      Fx.addFloat(
        game.fx,
        x,
        y,
        (label || "+" + gain) + (mult > 1 ? " x" + mult : ""),
        mult >= 5 ? "#f472b6" : "#fbbf24"
      );
      Fx.addParticles(game.fx, x, y, "#fde68a", 6 + Math.min(8, mult));
    }
    pushEvent(game, "combo", { combo: game.combo, gain: gain });
    if (game.combo >= 10) tryAchieve(game, "combo_10");
    return gain;
  }

  function tryAchieve(game, id) {
    if (!Meta || !game.achievements) return;
    if (game.achievements[id]) return;
    const r = Meta.unlockAchievement(id);
    if (r.unlocked) {
      game.achievements[id] = true;
      if (Fx && game.fx) {
        Fx.addToast(game.fx, "★ " + r.def.name, r.def.desc);
      }
      pushEvent(game, "achievement", { id: id, name: r.def.name });
    }
  }

  function adjustPolitical(game, delta) {
    game.political = Math.max(0, Math.min(100, (game.political || 50) + delta));
    if (game.political >= 100) {
      tryAchieve(game, "promoted");
      game.phase = "gameover";
      game.endReason = "promoted";
      game.message = "Promoted to manager. Jump key unbound.";
      game.messageTimer = 99;
      pushEvent(game, "gameover", { reason: "promoted" });
    }
  }

  function adjustTechDebt(game, delta) {
    game.techDebt = Math.max(0, Math.min(100, (game.techDebt || 0) + delta));
  }

  function spawnPowerups(game) {
    // Convert a few collectibles into powerups
    const kinds = ["focus", "oop", "standup", "snack"];
    let n = 0;
    for (let i = 0; i < game.collectibles.length && n < 3; i++) {
      if (game.rng() > 0.12) continue;
      if (game.collectibles[i].kind === "coffee") continue;
      game.collectibles[i].kind = kinds[Math.floor(game.rng() * kinds.length)];
      n++;
    }
  }

  function applyPowerup(game, kind) {
    const p = game.player;
    if (kind === "focus") {
      game.effects.focusTimer = Math.max(game.effects.focusTimer, 12);
      game.message = "Focus Mode — Slack muted 12s";
      if (Fx) Fx.addFloat(game.fx, p.x, p.y, "FOCUS", "#38bdf8");
    } else if (kind === "oop") {
      game.effects.oopTimer = Math.max(game.effects.oopTimer, 10);
      game.message = "OOP — phase through calendar bricks";
      if (Fx) Fx.addFloat(game.fx, p.x, p.y, "OOP", "#a78bfa");
    } else if (kind === "standup") {
      game.effects.standupTimer = Math.max(game.effects.standupTimer, 8);
      game.player.invuln = Math.max(game.player.invuln, 8);
      game.message = "Standup Immunity — star mode";
      if (Fx) Fx.addFloat(game.fx, p.x, p.y, "★ STAR", "#fbbf24");
    } else if (kind === "snack") {
      addSleepDebt(game, -30);
      game.effects.context = Math.max(0, game.effects.context - 20);
      if (game.lives < game.maxLives && game.rng() < 0.35) game.lives += 1;
      game.message = "Free Snack — sleep & context down";
      if (Fx) Fx.addFloat(game.fx, p.x, p.y, "SNACK", "#4ade80");
    }
    game.messageTimer = 2.2;
    pushEvent(game, "powerup", { kind: kind });
  }

  function spawnThreadProjectiles(game, count) {
    count = count || 3;
    const p = game.player;
    const bits = ["+1", "circling back", "as per my last", "thoughts?", "??", "bump", "FYI", "synergy"];
    for (let i = 0; i < count; i++) {
      game.projectiles.push({
        x: p.x + 40 + game.rng() * 200,
        y: p.y - 80 - game.rng() * 60,
        w: 36,
        h: 14,
        vx: -40 - game.rng() * 50,
        vy: 30 + game.rng() * 40,
        ttl: 5,
        text: bits[Math.floor(game.rng() * bits.length)],
      });
    }
  }

  function startStorm(game) {
    game.stormTimer = 14;
    game.stormSurvived = false;
    game.message = "ALL-HANDS STORM — notification hell";
    game.messageTimer = 3;
    if (Fx) {
      Fx.shake(game.fx, 0.45);
      Fx.flash(game.fx, "#ef4444", 0.35);
      Fx.addToast(game.fx, "All-Hands Storm", "Survive the ping flood");
    }
    // flood inbox
    for (let i = 0; i < 4; i++) {
      game.notifications.timeSince = 999;
      Notes.tickNotifications(
        game.notifications,
        0.05,
        game.sprint,
        game.rng,
        false
      );
    }
    spawnThreadProjectiles(game, 8);
    pushEvent(game, "storm");
  }

  function addSleepDebt(game, amount) {
    if (!amount) return;
    const mul = (game.diff && game.diff.sleepMul) || 1;
    const adj = amount > 0 ? amount * mul : amount;
    game.effects.sleepDebt = Math.min(
      MAX_SLEEP,
      Math.max(0, (game.effects.sleepDebt || 0) + adj)
    );
    if (game.effects.sleepDebt >= 70 && game.rng() < 0.4) {
      setThought(game, "tired");
    }
  }

  function sleepSlowFactor(game) {
    const s = game.effects.sleepDebt || 0;
    if (s < 35) return 1;
    if (s < 60) return 0.88;
    if (s < 85) return 0.72;
    return 0.58;
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
    const settings = opts.settings || (Meta && Meta.loadSettings ? Meta.loadSettings() : {});
    const difficultyId =
      opts.difficulty || settings.difficulty || "mid";
    const mode = opts.mode || settings.mode || "normal";
    const diff =
      (Meta && Meta.DIFFICULTY && Meta.DIFFICULTY[difficultyId]) ||
      (Meta && Meta.DIFFICULTY && Meta.DIFFICULTY.mid) || {
        slackMul: 1,
        enemySpeedMul: 1,
        sleepMul: 1,
        stormEvery: 5,
      };

    let seed = opts.seed;
    if (mode === "daily" && Meta && seed == null) {
      seed = Meta.dailySeed();
    }
    let rng = opts.rng || Math.random;
    if (seed != null && Meta && Meta.mulberry32) {
      rng = Meta.mulberry32(seed >>> 0);
    }

    const sprint = opts.sprint != null ? opts.sprint : 1;
    const lives = opts.lives != null ? opts.lives : MAX_LIVES;
    const map =
      opts.map ||
      MapMod.createOfficeMap({ sprint: sprint, rng: rng });

    // Scale enemy speeds by difficulty
    const enemies = map.enemySpawns.map(function (s) {
      const e = createEnemy(s);
      e.vx *= diff.enemySpeedMul || 1;
      return e;
    });

    const game = {
      map: map,
      sprint: sprint,
      lives: lives,
      maxLives: MAX_LIVES,
      deploys: opts.deploys != null ? opts.deploys : 0,
      score: opts.score != null ? opts.score : 0,
      collectedCount: opts.collectedCount != null ? opts.collectedCount : 0,
      coffeeCount: 0,
      phase: "playing",
      player: createPlayer(map.spawn),
      enemies: enemies,
      collectibles: spawnCollectibles(map),
      interactables: spawnInteractables(map),
      notifications: Notes.createNotificationState(),
      effects: emptyEffects(),
      cameraX: 0,
      time: 0,
      rng: rng,
      seed: seed != null ? seed : null,
      difficulty: difficultyId,
      diff: diff,
      mode: mode,
      settings: settings,
      lastEffects: null,
      message: "",
      messageTimer: 0,
      thought: null,
      events: [],
      thoughtIdleAcc: 0,
      endReason: null,
      combo: 0,
      comboTimer: 0,
      bestCombo: 0,
      political: 50,
      techDebt: 0,
      fx: Fx ? Fx.createFx() : { shake: 0, flash: 0, particles: [], floats: [], toasts: [] },
      projectiles: [],
      stormTimer: 0,
      stormSurvived: true,
      openedSlackThisSprint: false,
      skippedSlackSprint: true,
      tutorial: opts.skipTutorial
        ? null
        : {
            t: 0,
            step: 0,
            done: !!(settings && settings.tutorialDone),
          },
      achievements: Meta && Meta.loadAchievements ? Meta.loadAchievements() : {},
      runStart: Date.now(),
    };

    spawnPowerups(game);

    if (mode === "noslack") {
      game.notifications.timeSince = -99999;
      game.effects.focusTimer = 9999;
    }

    if (opts.notifyImmediate) {
      game.notifications.timeSince = Notes.intervalForSprint(sprint);
    }
    if (opts.tutorialForce) {
      game.tutorial = { t: 0, step: 0, done: false };
    }
    return game;
  }

  function allSolids(game) {
    const extras = [];
    const fx = game.effects;
    // OOP powerup: phase through calendar bricks
    if (!(fx.oopTimer > 0)) {
      for (let i = 0; i < fx.calendarBlocks.length; i++) {
        extras.push(fx.calendarBlocks[i]);
      }
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
    if (game.effects.standupTimer > 0 || game.effects.pureMarioTimer > 0) {
      return false;
    }
    game.lives -= 1;
    game.player.invuln = INVULN_TIME;
    game.player.vy = -200;
    game.combo = 0;
    pushEvent(game, "hurt");
    setThought(game, "hurt");
    if (Fx && game.fx) {
      Fx.shake(game.fx, game.settings && game.settings.reduceMotion ? 0.08 : 0.35);
      Fx.flash(game.fx, "#ef4444", 0.25);
      Fx.addFloat(game.fx, game.player.x, game.player.y, "−PTO", "#f87171");
      Fx.addParticles(game.fx, game.player.x + 14, game.player.y + 10, "#f87171", 10);
    }
    if (game.lives <= 0) {
      game.lives = 0;
      game.phase = "gameover";
      game.endReason = "laid_off";
      game.message = "Laid off. Game over.";
      game.messageTimer = 99;
      pushEvent(game, "gameover");
      if (Meta) Meta.considerBest(snapshotRun(game));
      if (Meta) Meta.clearContinue();
    }
    return true;
  }

  function snapshotRun(game) {
    return {
      score: game.score,
      sprint: game.sprint,
      deploys: game.deploys,
      mode: game.mode,
      difficulty: game.difficulty,
      endReason: game.endReason,
    };
  }

  function resignQuit(game) {
    game.phase = "gameover";
    game.endReason = "quit";
    game.message = "You quit. Loudly.";
    game.messageTimer = 99;
    game.notifications.active = null;
    game.notifications.inbox = [];
    setThought(game, "quit");
    tryAchieve(game, "quit_dignity");
    if (Meta) Meta.considerBest(snapshotRun(game));
    if (Meta) Meta.clearContinue();
    pushEvent(game, "gameover", { reason: "quit" });
  }

  function stompEnemy(game, enemy) {
    enemy.alive = false;
    game.player.vy = STOMP_BOUNCE;
    game.player.onGround = false;
    pushEvent(game, "stomp");
    bumpCombo(game, 15, enemy.x, enemy.y, "+STOMP");
    if (Fx && game.fx) {
      Fx.shake(game.fx, game.settings && game.settings.reduceMotion ? 0.05 : 0.18);
      Fx.addParticles(game.fx, enemy.x + 14, enemy.y + 10, "#fca5a5", 12);
    }
  }

  /** True if a platform supports a point just under (x, footY). */
  function groundUnder(platforms, x, footY) {
    for (let j = 0; j < platforms.length; j++) {
      const p = platforms[j];
      if (x >= p.x && x <= p.x + p.w && footY >= p.y - 2 && footY <= p.y + 12) {
        return true;
      }
    }
    return false;
  }

  function updateEnemies(game, dt, platforms) {
    for (let i = 0; i < game.enemies.length; i++) {
      const e = game.enemies[i];
      if (!e.alive) continue;
      e.vy += Physics.GRAVITY * dt;
      if (e.vy > Physics.MAX_FALL) e.vy = Physics.MAX_FALL;

      // Ledge turnaround: never walk off into a pit
      if (e.onGround && e.vx !== 0) {
        const lookX = e.vx > 0 ? e.x + e.w + 4 : e.x - 4;
        const footY = e.y + e.h + 2;
        if (!groundUnder(platforms, lookX, footY)) {
          e.vx *= -1;
        }
      }

      e.x += e.vx * dt;
      // reverse on wall / platform solid collide
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

      // Soft failsafe: respawn at home instead of killing themselves
      if (e.y > game.map.height + 50) {
        e.x = e.homeX != null ? e.homeX : e.x;
        e.y = e.homeY != null ? e.homeY : game.map.groundY - e.h;
        e.vx = e.homeVx != null ? e.homeVx : (e.vx < 0 ? -Math.abs(e.vx) : Math.abs(e.vx));
        e.vy = 0;
        e.onGround = false;
      }
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
   * Touch collectibles: story points add score; coffee also eases context/sleep.
   * Uses padded hitbox so walking past reliably triggers.
   */
  function collectPickups(game) {
    const p = game.player;
    let n = 0;
    for (let i = 0; i < game.collectibles.length; i++) {
      const c = game.collectibles[i];
      if (c.collected) continue;
      if (!Physics.aabb(p, paddedBox(c, 14))) continue;
      c.collected = true;
      n++;
      game.collectedCount += 1;
      if (
        c.kind === "focus" ||
        c.kind === "oop" ||
        c.kind === "standup" ||
        c.kind === "snack"
      ) {
        applyPowerup(game, c.kind);
        bumpCombo(game, 20, c.x, c.y, c.kind.toUpperCase());
        continue;
      }
      if (c.kind === "coffee") {
        game.effects.context = Math.max(
          0,
          game.effects.context - COFFEE_CONTEXT_RELIEF
        );
        addSleepDebt(game, -COFFEE_SLEEP_RELIEF);
        game.coffeeCount = (game.coffeeCount || 0) + 1;
        if (game.coffeeCount >= 5) tryAchieve(game, "coffee_5");
        bumpCombo(game, COFFEE_POINTS, c.x, c.y, "☕");
        pushEvent(game, "collect", { kind: "coffee", points: COFFEE_POINTS });
        game.message =
          "☕ Coffee! sleep −" + COFFEE_SLEEP_RELIEF + " · ctx −" + COFFEE_CONTEXT_RELIEF;
        game.messageTimer = 2.6;
        setThought(game, "coffee");
        // Secret: all coffees collected → pure Mario
        const coffeesLeft = game.collectibles.filter(function (x) {
          return x.kind === "coffee" && !x.collected;
        }).length;
        if (coffeesLeft === 0 && game.coffeeCount >= 3) {
          game.effects.pureMarioTimer = 30;
          game.effects.focusTimer = Math.max(game.effects.focusTimer, 30);
          game.message = "Do Not Disturb — pure platformer 30s";
          game.messageTimer = 3;
          tryAchieve(game, "pure_mario");
          if (Fx) Fx.addToast(game.fx, "Do Not Disturb", "Pure Mario for 30s");
        }
      } else {
        bumpCombo(game, STORY_POINTS, c.x, c.y, "+SP");
        pushEvent(game, "collect", { kind: "story", points: STORY_POINTS });
        game.message = "● Story point";
        game.messageTimer = 2.2;
        setThought(game, "collect");
      }
    }
    return n;
  }

  /**
   * Walk into chairs/plants/etc. for a one-shot reaction.
   */
  function touchInteractables(game) {
    if (!game.interactables) return 0;
    const p = game.player;
    let n = 0;
    for (let i = 0; i < game.interactables.length; i++) {
      const it = game.interactables[i];
      if (it.used) continue;
      if (!Physics.aabb(p, paddedBox(it, 6))) continue;
      it.used = true;
      n++;
      const cat =
        THOUGHTS[it.kind] && THOUGHTS[it.kind].length ? it.kind : "prop";
      setThought(game, cat);
      game.message = it.emoji + " " + (it.kind || "prop");
      game.messageTimer = 1.6;
      pushEvent(game, "prop", { kind: it.kind });
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
    // Pre-reset achievements for the sprint that just finished
    tryAchieve(game, "first_deploy");
    if (game.sprint + 1 >= 5) tryAchieve(game, "sprint_5");
    if (game.sprint + 1 >= 10) tryAchieve(game, "sprint_10");
    if (game.skippedSlackSprint && !game.openedSlackThisSprint) {
      tryAchieve(game, "no_slack");
    }

    game.sprint += 1;
    game.deploys += 1;
    adjustTechDebt(game, 8 + Math.floor(game.sprint * 0.5));
    // Paying down tech debt slightly with ship (not enough)
    adjustTechDebt(game, -3);
    adjustPolitical(game, 2);

    // New layout / rebrand / theme each sprint so the office doesn't feel copy-pasted
    game.map = MapMod.createOfficeMap({
      sprint: game.sprint,
      rng: game.rng,
    });
    game.player = createPlayer(game.map.spawn);
    const enemies = game.map.enemySpawns.map(createEnemy);
    const emul = (game.diff && game.diff.enemySpeedMul) || 1;
    for (let i = 0; i < enemies.length; i++) enemies[i].vx *= emul;
    game.enemies = enemies;
    game.collectibles = spawnCollectibles(game.map);
    game.interactables = spawnInteractables(game.map);
    spawnPowerups(game);
    game.projectiles = [];
    game.effects.calendarBlocks = [];
    game.effects.hallucinated = [];
    game.effects.stunTimer = 0;
    game.effects.slowTimer = 0;
    game.effects.context = Math.min(
      MAX_CONTEXT,
      Math.floor(game.effects.context * 0.5) + 5
    );
    // Shipping doesn't fix sleep — tech debt of the body carries over
    game.effects.sleepDebt = Math.min(
      MAX_SLEEP,
      Math.floor((game.effects.sleepDebt || 0) * 0.75) + 8
    );
    game.notifications.active = null;
    game.notifications.inbox = [];
    game.notifications.timeSince = 0;
    game.openedSlackThisSprint = false;
    game.skippedSlackSprint = true;
    game.phase = "playing";
    const brand = game.map.brandLabel || game.map.brand || "HQ";
    const theme = (game.map.theme && game.map.theme.id) || "office";
    game.message =
      "Sprint " + game.sprint + " · rebrand: " + brand + " · theme: " + theme;
    game.messageTimer = 3.2;
    game.cameraX = 0;
    pushEvent(game, "deploy");
    setThought(game, "deploy");
    if (Fx && game.fx) {
      Fx.flash(game.fx, "#22c55e", 0.2);
      Fx.addFloat(game.fx, game.player.x, game.player.y - 20, "SHIPPED", "#4ade80");
    }

    // Boss storm on cadence (difficulty stormEvery)
    const every = (game.diff && game.diff.stormEvery) || 5;
    if (game.deploys > 0 && game.deploys % every === 0 && game.mode !== "noslack") {
      startStorm(game);
    }

    // Tech debt penalty: more sleep + context if debt is high
    if (game.techDebt >= 70) {
      addSleepDebt(game, 8);
      game.effects.context = Math.min(MAX_CONTEXT, game.effects.context + 10);
      game.message = "Tech debt interest — sprint tax applied";
      game.messageTimer = 2.8;
    }
  }

  function tickEffectTimers(game, dt) {
    if (game.effects.stunTimer > 0) {
      game.effects.stunTimer = Math.max(0, game.effects.stunTimer - dt);
    }
    if (game.effects.slowTimer > 0) {
      game.effects.slowTimer = Math.max(0, game.effects.slowTimer - dt);
    }
    if (game.effects.focusTimer > 0) {
      game.effects.focusTimer = Math.max(0, game.effects.focusTimer - dt);
    }
    if (game.effects.oopTimer > 0) {
      game.effects.oopTimer = Math.max(0, game.effects.oopTimer - dt);
    }
    if (game.effects.standupTimer > 0) {
      game.effects.standupTimer = Math.max(0, game.effects.standupTimer - dt);
    }
    if (game.effects.pureMarioTimer > 0) {
      game.effects.pureMarioTimer = Math.max(0, game.effects.pureMarioTimer - dt);
    }

    // Combo decay
    if (game.comboTimer > 0) {
      game.comboTimer = Math.max(0, game.comboTimer - dt);
      if (game.comboTimer === 0) game.combo = 0;
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

  function tickProjectiles(game, dt) {
    if (!game.projectiles || !game.projectiles.length) return;
    const next = [];
    const p = game.player;
    for (let i = 0; i < game.projectiles.length; i++) {
      const pr = game.projectiles[i];
      pr.ttl -= dt;
      if (pr.ttl <= 0) continue;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.vy += 20 * dt;
      if (Physics.aabb(p, pr) && game.player.invuln <= 0) {
        if (game.effects.standupTimer > 0 || game.effects.pureMarioTimer > 0) {
          // star: bounce the thread
          pr.vx *= -1.2;
          pr.vy = -80;
          next.push(pr);
          continue;
        }
        hurtPlayer(game);
        addSleepDebt(game, 5);
        if (Fx && game.fx) {
          Fx.addFloat(game.fx, pr.x, pr.y, pr.text || "ping", "#f87171");
        }
        continue; // consumed on hit
      }
      next.push(pr);
    }
    game.projectiles = next;
  }

  function tickStorm(game, dt) {
    if (!(game.stormTimer > 0)) return;
    game.stormTimer = Math.max(0, game.stormTimer - dt);
    // drip projectiles during storm
    if (game.rng() < 0.08) spawnThreadProjectiles(game, 1);
    if (game.stormTimer === 0 && !game.stormSurvived) {
      game.stormSurvived = true;
      tryAchieve(game, "storm_survive");
      game.message = "Storm cleared. Inbox still full.";
      game.messageTimer = 2.5;
      if (Fx && game.fx) {
        Fx.addToast(game.fx, "Storm survived", "All-hands ended. Somehow.");
        Fx.flash(game.fx, "#38bdf8", 0.2);
      }
      pushEvent(game, "storm_end");
    }
  }

  function tickTutorial(game, dt) {
    if (!game.tutorial || game.tutorial.done) return;
    game.tutorial.t += dt;
    // Auto-advance simple coach marks
    if (game.tutorial.step === 0 && game.tutorial.t > 0.4) {
      game.tutorial.step = 1;
      game.message = "Move with A/D · Jump W/Space";
      game.messageTimer = 3.5;
    } else if (game.tutorial.step === 1 && (game.player.x > game.map.spawn.x + 80 || game.tutorial.t > 8)) {
      game.tutorial.step = 2;
      game.message = "Stomp red blockers · Grab SP & coffee";
      game.messageTimer = 3.5;
    } else if (game.tutorial.step === 2 && (game.collectedCount > 0 || game.tutorial.t > 16)) {
      game.tutorial.step = 3;
      game.message = "Tab/E opens Slack when YOU want · 5 = quit";
      game.messageTimer = 4;
    } else if (game.tutorial.step === 3 && game.tutorial.t > 22) {
      game.tutorial.done = true;
      if (Meta && Meta.saveSettings) {
        Meta.saveSettings({ tutorialDone: true });
      }
      if (game.settings) game.settings.tutorialDone = true;
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
      game.openedSlackThisSprint = true;
      game.skippedSlackSprint = false;
      pushEvent(game, "notify");
      game.player.invuln = Math.max(game.player.invuln, 0.5);
      game.message =
        "Reading Slack — " + (note.name || note.from) + " · reply with 1–4";
      game.messageTimer = 1.8;
      setThought(game, "open");
      addSleepDebt(game, 4);
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
      if (result.effects.quit || result.effects.kind === "quit") {
        resignQuit(game);
        pushEvent(game, "notify_reply", { kind: "quit" });
        return result;
      }
      applyEffectsPayload(game, result.effects);
      game.phase = "playing";
      if (result.effects.kind === "timeout") {
        game.message = "Chat auto-closed — mild stun";
        pushEvent(game, "notify_timeout");
        setThought(game, "timeout");
        addSleepDebt(game, 10);
        adjustPolitical(game, -4);
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
        // Sycophancy and fake "on it" cost more sleep than a short dismiss
        // Political capital: love up, pushback down, dismiss neutral-ish
        if (cat === "love") {
          addSleepDebt(game, 12);
          adjustPolitical(game, 8);
          adjustTechDebt(game, 4);
        } else if (cat === "on_it") {
          addSleepDebt(game, 10);
          adjustPolitical(game, 5);
          adjustTechDebt(game, 6);
        } else if (cat === "pushback") {
          addSleepDebt(game, 6);
          adjustPolitical(game, -10);
          adjustTechDebt(game, -2);
        } else {
          addSleepDebt(game, 3);
          adjustPolitical(game, -1);
        }
        // Chance of thread projectiles after engaging
        if (cat === "on_it" || cat === "love") {
          if (game.rng() < 0.45) spawnThreadProjectiles(game, 2 + Math.floor(game.rng() * 3));
        }
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

    // Focus / pure Mario / noslack: mute new Slack arrivals
    const slackMuted =
      game.mode === "noslack" ||
      game.effects.focusTimer > 0 ||
      game.effects.pureMarioTimer > 0;

    // Difficulty scales arrival rate (slackMul > 1 = slower pings)
    const slackDt = slackMuted
      ? 0
      : dt / ((game.diff && game.diff.slackMul) || 1);
    const tick = Notes.tickNotifications(
      game.notifications,
      slackDt,
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
      addSleepDebt(game, 6);
      if (game.stormTimer > 0) spawnThreadProjectiles(game, 1);
    }
    if (tick.backlogPressure) {
      game.effects.context = Math.min(
        MAX_CONTEXT,
        game.effects.context + 4
      );
      game.message = "Inbox full — leadership is filling your context";
      game.messageTimer = 1.6;
      setThought(game, "backlog");
      addSleepDebt(game, 8);
    }

    if (game.notifications.active) {
      game.phase = "notification";
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
        adjustPolitical(game, -4);
        if (timed.effects.stun > 0) pushEvent(game, "stun");
        game.player.invuln = Math.max(game.player.invuln, 0.45);
      }
      tickThought(game, dt);
      if (Fx && game.fx) {
        Fx.tick(
          game.fx,
          dt,
          !!(game.settings && game.settings.reduceMotion)
        );
      }
      return game;
    }

    if (game.phase === "notification") {
      game.phase = "playing";
    }

    if (game.phase === "gameover") {
      tickThought(game, dt);
      return game;
    }

    tickEffectTimers(game, dt);
    tickStorm(game, dt);
    tickTutorial(game, dt);

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
    let slowFactor = game.effects.slowTimer > 0 ? 0.45 : 1;
    slowFactor *= sleepSlowFactor(game);
    if (game.techDebt >= 50) {
      slowFactor *= 1 - Math.min(0.25, (game.techDebt - 50) / 200);
    }

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
    tickProjectiles(game, dt);
    if (game.phase !== "gameover") {
      collectPickups(game);
      touchInteractables(game);
    }
    fallDeath(game);

    if (game.phase !== "gameover") {
      checkDeploy(game);
    }

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

    if (Fx && game.fx) {
      Fx.tick(
        game.fx,
        dt,
        !!(game.settings && game.settings.reduceMotion)
      );
    }

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
    resignQuit: resignQuit,
    advanceSprint: advanceSprint,
    hurtPlayer: hurtPlayer,
    collectPickups: collectPickups,
    touchInteractables: touchInteractables,
    allSolids: allSolids,
    applyEffectsPayload: applyEffectsPayload,
    applyPowerup: applyPowerup,
    startStorm: startStorm,
    bumpCombo: bumpCombo,
    adjustPolitical: adjustPolitical,
    adjustTechDebt: adjustTechDebt,
    tryAchieve: tryAchieve,
    isGameOver: isGameOver,
    setThought: setThought,
    addSleepDebt: addSleepDebt,
    snapshotRun: snapshotRun,
    THOUGHTS: THOUGHTS,
    STORY_POINTS: STORY_POINTS,
    COFFEE_POINTS: COFFEE_POINTS,
    MAX_SLEEP: MAX_SLEEP,
    COFFEE_SLEEP_RELIEF: COFFEE_SLEEP_RELIEF,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysGame = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
