/**
 * Persistence: settings, best runs, achievements, daily seed, continue, leaderboard, ghost.
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "bosssays_meta_v1";
  const ACHIEVE_KEY = "bosssays_achieve_v1";
  const BOARD_KEY = "bosssays_board_v1";
  const GHOST_KEY = "bosssays_ghost_v1";
  const CONTINUE_KEY = "bosssays_continue_v1";

  const DEFAULT_KEYBINDS = {
    left: ["ArrowLeft", "a", "A"],
    right: ["ArrowRight", "d", "D"],
    jump: ["ArrowUp", "w", "W", " "],
    slack: ["Tab", "e", "E"],
    pause: ["Escape", "p", "P"],
    mute: ["m", "M"],
  };

  const DEFAULT_SETTINGS = {
    difficulty: "mid", // chill | mid | toxic
    mode: "normal", // normal | speedrun | noslack | daily | oncall
    reduceMotion: false,
    colorblind: false,
    sfx: true,
    bgm: true,
    compactHud: false,
    tutorialDone: false,
    largeText: false,
    keybinds: null, // filled from DEFAULT_KEYBINDS
  };

  const DIFFICULTY = {
    chill: {
      id: "chill",
      label: "Chill",
      slackMul: 1.4,
      enemySpeedMul: 0.85,
      sleepMul: 0.7,
      stormEvery: 6,
    },
    mid: {
      id: "mid",
      label: "Mid",
      slackMul: 1,
      enemySpeedMul: 1,
      sleepMul: 1,
      stormEvery: 5,
    },
    toxic: {
      id: "toxic",
      label: "Toxic",
      slackMul: 0.65,
      enemySpeedMul: 1.25,
      sleepMul: 1.35,
      stormEvery: 3,
    },
  };

  const ACHIEVEMENT_DEFS = [
    { id: "first_deploy", name: "Shipped", desc: "Complete a deploy" },
    { id: "sprint_5", name: "Still Here", desc: "Reach sprint 5" },
    { id: "sprint_10", name: "Stock Options", desc: "Reach sprint 10" },
    { id: "quit_dignity", name: "Quiet Quitting?", desc: "Quit via Slack" },
    { id: "coffee_5", name: "Bean Counter", desc: "Drink 5 coffees in a run" },
    { id: "combo_10", name: "Performance Review", desc: "Hit a 10x combo" },
    { id: "no_slack", name: "Focus Theater", desc: "Sprint without opening Slack" },
    { id: "pure_mario", name: "Do Not Disturb", desc: "Trigger pure platformer mode" },
    { id: "storm_survive", name: "All-Hands Survivor", desc: "Survive a notification storm" },
    { id: "promoted", name: "Middle Management", desc: "Max political capital" },
    { id: "secret_hr", name: "HR Dungeon", desc: "Find the secret snack room" },
    { id: "boss_kite", name: "Escalation", desc: "Survive a manager chase" },
    { id: "meeting_decline", name: "No Thanks", desc: "Decline a meeting invite" },
    { id: "review_pass", name: "Exceeds", desc: "Ace a performance review" },
    { id: "oncall_night", name: "Pager Duty", desc: "Ship a deploy in On-Call mode" },
    { id: "continue_load", name: "Session Restore", desc: "Continue a saved run" },
  ];

  function canStore() {
    try {
      return typeof localStorage !== "undefined";
    } catch (e) {
      return false;
    }
  }

  function loadRaw(key, fallback) {
    if (!canStore()) return fallback;
    try {
      const s = localStorage.getItem(key);
      if (!s) return fallback;
      return JSON.parse(s);
    } catch (e) {
      return fallback;
    }
  }

  function saveRaw(key, val) {
    if (!canStore()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  function cloneKeybinds(src) {
    const base = src || DEFAULT_KEYBINDS;
    const out = {};
    const keys = Object.keys(DEFAULT_KEYBINDS);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out[k] = (base[k] || DEFAULT_KEYBINDS[k]).slice();
    }
    return out;
  }

  function loadSettings() {
    const s = loadRaw(STORAGE_KEY, {});
    const out = {};
    const keys = Object.keys(DEFAULT_SETTINGS);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out[k] = s[k] != null ? s[k] : DEFAULT_SETTINGS[k];
    }
    if (!DIFFICULTY[out.difficulty]) out.difficulty = "mid";
    out.keybinds = cloneKeybinds(s.keybinds || out.keybinds);
    return out;
  }

  function saveSettings(settings) {
    const cur = loadSettings();
    const merged = Object.assign({}, cur, settings || {});
    if (settings && settings.keybinds) {
      merged.keybinds = cloneKeybinds(settings.keybinds);
    }
    saveRaw(STORAGE_KEY, merged);
    return merged;
  }

  function loadBest() {
    return loadRaw("bosssays_best_v1", {
      score: 0,
      sprint: 1,
      deploys: 0,
      mode: "normal",
      difficulty: "mid",
      endReason: null,
      at: null,
    });
  }

  function considerBest(run) {
    const best = loadBest();
    const better =
      (run.score || 0) > (best.score || 0) ||
      ((run.score || 0) === (best.score || 0) &&
        (run.sprint || 0) > (best.sprint || 0));
    if (better) {
      const next = {
        score: run.score || 0,
        sprint: run.sprint || 1,
        deploys: run.deploys || 0,
        mode: run.mode || "normal",
        difficulty: run.difficulty || "mid",
        endReason: run.endReason || null,
        at: new Date().toISOString(),
      };
      saveRaw("bosssays_best_v1", next);
      return next;
    }
    return best;
  }

  function loadAchievements() {
    return loadRaw(ACHIEVE_KEY, {});
  }

  function unlockAchievement(id) {
    const a = loadAchievements();
    if (a[id]) return { unlocked: false, id: id, def: null };
    const def = ACHIEVEMENT_DEFS.filter(function (d) {
      return d.id === id;
    })[0];
    if (!def) return { unlocked: false, id: id, def: null };
    a[id] = { at: new Date().toISOString() };
    saveRaw(ACHIEVE_KEY, a);
    return { unlocked: true, id: id, def: def };
  }

  function dailySeed(date) {
    date = date || new Date();
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return y * 10000 + m * 100 + d;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function loadContinue() {
    return loadRaw(CONTINUE_KEY, null);
  }

  function saveContinue(snapshot) {
    return saveRaw(CONTINUE_KEY, snapshot);
  }

  function clearContinue() {
    if (!canStore()) return;
    try {
      localStorage.removeItem(CONTINUE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  /** Simple checksum for share strings */
  function hashScore(run) {
    const s =
      (run.score || 0) +
      "|" +
      (run.sprint || 1) +
      "|" +
      (run.deploys || 0) +
      "|" +
      (run.mode || "n") +
      "|" +
      (run.difficulty || "m");
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).slice(0, 6);
  }

  function encodeRunCard(run) {
    const parts = [
      run.score || 0,
      run.sprint || 1,
      run.deploys || 0,
      run.mode || "normal",
      run.difficulty || "mid",
      hashScore(run),
    ];
    return "BS1:" + parts.join(":");
  }

  function decodeRunCard(str) {
    if (!str || str.indexOf("BS1:") !== 0) return null;
    const p = str.slice(4).split(":");
    if (p.length < 6) return null;
    const run = {
      score: parseInt(p[0], 10) || 0,
      sprint: parseInt(p[1], 10) || 1,
      deploys: parseInt(p[2], 10) || 0,
      mode: p[3] || "normal",
      difficulty: p[4] || "mid",
    };
    if (hashScore(run) !== p[5]) return null;
    return run;
  }

  function loadBoard() {
    return loadRaw(BOARD_KEY, []);
  }

  function submitBoard(run, name) {
    const list = loadBoard();
    list.push({
      name: (name || "anon").slice(0, 16),
      score: run.score || 0,
      sprint: run.sprint || 1,
      deploys: run.deploys || 0,
      mode: run.mode || "normal",
      difficulty: run.difficulty || "mid",
      card: encodeRunCard(run),
      at: new Date().toISOString(),
    });
    list.sort(function (a, b) {
      return b.score - a.score || b.sprint - a.sprint;
    });
    const top = list.slice(0, 20);
    saveRaw(BOARD_KEY, top);
    return top;
  }

  function loadGhost() {
    return loadRaw(GHOST_KEY, null);
  }

  function saveGhost(samples, meta) {
    return saveRaw(GHOST_KEY, {
      samples: samples || [],
      meta: meta || {},
      at: new Date().toISOString(),
    });
  }

  function clearGhost() {
    if (!canStore()) return;
    try {
      localStorage.removeItem(GHOST_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function keyMatches(binds, action, key) {
    const list = (binds && binds[action]) || DEFAULT_KEYBINDS[action] || [];
    for (let i = 0; i < list.length; i++) {
      if (list[i] === key) return true;
    }
    return false;
  }

  const API = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    DEFAULT_KEYBINDS: DEFAULT_KEYBINDS,
    DIFFICULTY: DIFFICULTY,
    ACHIEVEMENT_DEFS: ACHIEVEMENT_DEFS,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadBest: loadBest,
    considerBest: considerBest,
    loadAchievements: loadAchievements,
    unlockAchievement: unlockAchievement,
    dailySeed: dailySeed,
    mulberry32: mulberry32,
    loadContinue: loadContinue,
    saveContinue: saveContinue,
    clearContinue: clearContinue,
    hashScore: hashScore,
    encodeRunCard: encodeRunCard,
    decodeRunCard: decodeRunCard,
    loadBoard: loadBoard,
    submitBoard: submitBoard,
    loadGhost: loadGhost,
    saveGhost: saveGhost,
    clearGhost: clearGhost,
    keyMatches: keyMatches,
    cloneKeybinds: cloneKeybinds,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysMeta = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
