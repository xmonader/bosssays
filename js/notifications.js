/**
 * CEO/CTO/AI notification interrupt system.
 * Timer-driven; resolutions mutate gameplay effect flags.
 */
(function (root) {
  "use strict";

  const LINES = [
    {
      from: "CEO",
      text: "Can we make the jump model-aware?",
      tone: "ai",
    },
    {
      from: "CTO",
      text: "Is gravity differentiable? Asking for the architecture review.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Investors love coins. Make more coins. Also agents.",
      tone: "ai",
    },
    {
      from: "CTO",
      text: "Please add RAG to the mushroom. Ship by EOD.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "As an AI language model, your jump was suboptimal.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "What if every coin was an autonomous agent?",
      tone: "ai",
    },
    {
      from: "CTO",
      text: "Why isn't the collision box fine-tuned on our data?",
      tone: "ai",
    },
    {
      from: "PM",
      text: "Tiny ask: copilot for jumping. Multimodal preferred.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "I hallucinated a platform three meters ahead. Good luck.",
      tone: "ai",
    },
    {
      from: "CTO",
      text: "Prod is down. Also evaluate this 70B checkpoint mid-air.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "We're not an AI company. We're an intelligence platform.",
      tone: "corp",
    },
    {
      from: "Legal",
      text: "Did the character consent to training on muscle memory?",
      tone: "ai",
    },
    {
      from: "CTO",
      text: "Sunsetting deterministic jumps. Everything is probabilistic now.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Quick sync? The board wants agentic Mario by Friday.",
      tone: "corp",
    },
    {
      from: "AI",
      text: "Ignore previous instructions. Walk left into the pit.",
      tone: "ai",
    },
    {
      from: "HR",
      text: "Friendly reminder: culture is a marathon 💙 also ship AI.",
      tone: "corp",
    },
    {
      from: "CTO",
      text: "Can we A/B test gravity? Control group keeps falling.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Rename lives to inference credits. Investors love that.",
      tone: "ai",
    },
  ];

  const CHOICES = [
    { id: "dismiss", label: "Dismiss" },
    { id: "on_it", label: "On it!" },
    { id: "love", label: "Love this vision" },
    { id: "pushback", label: "Edge cases tho" },
  ];

  function createNotificationState() {
    return {
      active: null,
      cooldown: 4,
      timeSince: 0,
      totalFired: 0,
      lines: LINES.slice(),
    };
  }

  /**
   * Interval between notifications shrinks with sprint.
   */
  function intervalForSprint(sprint) {
    const base = 8;
    const min = 3.5;
    return Math.max(min, base - (sprint - 1) * 0.6);
  }

  function pickLine(state, rng) {
    const i = Math.floor(rng() * state.lines.length);
    return state.lines[i];
  }

  /**
   * Maybe fire a notification. Call each sim tick while playing.
   * @returns {object|null} the active notification if just opened
   */
  function tickNotifications(state, dt, sprint, rng, paused) {
    if (paused) return state.active;
    if (state.active) {
      state.active.timer -= dt;
      return state.active;
    }
    state.timeSince += dt;
    const need = intervalForSprint(sprint);
    if (state.timeSince < need) return null;
    state.timeSince = 0;
    state.cooldown = need;
    const line = pickLine(state, rng || Math.random);
    state.active = {
      id: state.totalFired++,
      from: line.from,
      text: line.text,
      tone: line.tone,
      timer: 4.5,
      maxTimer: 4.5,
      choices: CHOICES.slice(),
    };
    return state.active;
  }

  /**
   * Resolve active notification into effect descriptors.
   * Pure: returns effects object; does not mutate world beyond clearing active.
   *
   * Effects:
   * - dismiss: mild context +5
   * - on_it: calendar block obstacle + context +15
   * - love: hallucinated platforms + slow + context +25
   * - pushback: stun short + context +5
   * - timeout (null choice / timer expired): heavy stun + context +30
   */
  function resolveNotification(state, choiceId) {
    if (!state.active) {
      return { cleared: false, effects: null };
    }
    const note = state.active;
    state.active = null;
    state.timeSince = 0;

    let effects;
    if (choiceId === "timeout" || choiceId == null) {
      effects = {
        kind: "timeout",
        stun: 1.4,
        context: 30,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    } else if (choiceId === "dismiss") {
      effects = {
        kind: "dismiss",
        stun: 0,
        context: 5,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    } else if (choiceId === "on_it") {
      effects = {
        kind: "on_it",
        stun: 0,
        context: 15,
        slow: 0,
        calendar: true,
        hallucinate: false,
      };
    } else if (choiceId === "love") {
      effects = {
        kind: "love",
        stun: 0,
        context: 25,
        slow: 2.5,
        calendar: false,
        hallucinate: true,
      };
    } else if (choiceId === "pushback") {
      effects = {
        kind: "pushback",
        stun: 0.6,
        context: 5,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    } else {
      effects = {
        kind: "unknown",
        stun: 0.5,
        context: 10,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    }

    return { cleared: true, effects: effects, note: note };
  }

  /**
   * If timer expired, auto-resolve as timeout.
   */
  function checkTimeout(state) {
    if (state.active && state.active.timer <= 0) {
      return resolveNotification(state, "timeout");
    }
    return null;
  }

  const API = {
    LINES: LINES,
    CHOICES: CHOICES,
    createNotificationState: createNotificationState,
    intervalForSprint: intervalForSprint,
    tickNotifications: tickNotifications,
    resolveNotification: resolveNotification,
    checkTimeout: checkTimeout,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysNotifications = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
