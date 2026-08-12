/**
 * Persistence: settings, best runs, achievements, daily seed.
 */
(function (root) {
  "use strict";

  const STORAGE_KEY = "bosssays_meta_v1";
  const ACHIEVE_KEY = "bosssays_achieve_v1";

  const DEFAULT_SETTINGS = {
    difficulty: "mid", // chill | mid | toxic
    mode: "normal", // normal | speedrun | noslack | daily
    reduceMotion: false,
    colorblind: false,
    sfx: true,
    bgm: true,
    compactHud: false,
    tutorialDone: false,
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

  function loadSettings() {
    const s = loadRaw(STORAGE_KEY, {});
    const out = {};
    const keys = Object.keys(DEFAULT_SETTINGS);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      out[k] = s[k] != null ? s[k] : DEFAULT_SETTINGS[k];
    }
    if (!DIFFICULTY[out.difficulty]) out.difficulty = "mid";
    return out;
  }

  function saveSettings(settings) {
    const cur = loadSettings();
    const merged = Object.assign({}, cur, settings || {});
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

  /** Deterministic daily seed YYYYMMDD */
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
    return loadRaw("bosssays_continue_v1", null);
  }

  function saveContinue(snapshot) {
    return saveRaw("bosssays_continue_v1", snapshot);
  }

  function clearContinue() {
    if (!canStore()) return;
    try {
      localStorage.removeItem("bosssays_continue_v1");
    } catch (e) {
      /* ignore */
    }
  }

  const API = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
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
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysMeta = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
