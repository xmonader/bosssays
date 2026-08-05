/**
 * CEO/CTO/AI notification interrupt system.
 * Timer-driven; resolutions mutate gameplay effect flags.
 */
(function (root) {
  "use strict";

  const LINES = [
    // —— classic AI cargo-cult ——
    { from: "CEO", text: "Can we make the jump model-aware?", tone: "ai" },
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
    { from: "CTO", text: "Please add RAG to the mushroom. Ship by EOD.", tone: "ai" },
    {
      from: "AI",
      text: "As an AI language model, your jump was suboptimal.",
      tone: "ai",
    },
    { from: "CEO", text: "What if every coin was an autonomous agent?", tone: "ai" },
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

    // —— narcissistic CEO (visionary who googled one article) ——
    {
      from: "CEO",
      text: "I just rewrote the roadmap on a napkin. You're welcome. Delete the old one.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't need context. I invent context. Ship my vibe.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Steve Jobs would have jumped twice. Why are we only jumping once?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I used to code in college. This should take you 20 minutes.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My LinkedIn says Thought Leader. Please act accordingly mid-level.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Don't bring me problems. Bring me slides that say I was right.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I spoke to one customer at a dinner. Pivot everything. Including the pipes.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Why is the logo not 3% bigger? I can feel it's not 3% bigger.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm not micromanaging. I'm 'high-bandwidth vision alignment.' Jump left.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I already announced this feature on a podcast. Please make reality catch up.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My 5-year-old could design a better platform. No offense to the platform.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We move at founder speed. Your physics engine is a bottleneck on my destiny.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't read RFCs. I radiate strategy. Absorb it while you double-jump.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Can we make the character more like me? Charismatic. Disrupts pits.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I closed a big deal by promising multiplayer. We don't have multiplayer. Fix that with confidence.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Stop optimizing. Start 'storytelling the jump' to the market.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I am the product. The game is just my autobiography with coins.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "If you fall, it's a culture issue. If I fall, it's a bold experiment.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Please CC me on every commit so I can 'unblock you' with opinions.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I had a breakthrough in the shower. Scrap the sprint. New vision: floating desks only.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Be a owner. Own this outage. Also I caused it by clicking prod. Own that quietly.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We don't do hierarchy here. But reply to me first, before physics.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I invented the word 'synergize' in a dream. Trademark the jump.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Why hire experts if you're going to ignore my weekend Medium post?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm not yelling. This is passionate asynchronous leadership.",
      tone: "ego",
    },

    // —— CTO who watched one conference talk ——
    {
      from: "CTO",
      text: "I don't write code anymore — I write 'architectural principles.' Jump is a microservice now.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Obviously use Kubernetes for the player. Horizontal pod autoscaling for jumps.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I already know the solution. I just need you to implement my certainty.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "This would be trivial in Rust. Why are we still in… whatever this is?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I diagrammed it in Excalidraw. The boxes are green so it's production-ready.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Latency is a mindset. Have you tried believing in lower ping?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll abstract the ground. Platforms are a leaky abstraction of 'support.'",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I once scaled a to-do app to 12 users. Trust my platform advice.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Rewrite the jump with event sourcing. Every pixel needs an audit log.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't care about the bug. I care that the RFC has the right fonts.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Stop pair programming. Start pair monologuing with me for 2 hours.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "If it's not on the service mesh, is the player even real?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I banned ORMs, then banned SQL, then banned thinking. Use the AI.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll do it 'the right way' — my way — after you ship the wrong way Friday.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I reverse-proxied my ego through nginx. Very cloud-native of me.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Have you considered that dying is just eventual consistency?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I reviewed your PR in the elevator. Rejected. Energy was off.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Add observability to fun. I want dashboards for joy (p99).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Blockchain the coins. I don't know why. Board said 'web3 optional' which means mandatory.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I'm not wrong; the compiler is gaslighting me. Fix the universe.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We need a monorepo, a polyrepo, and a slide that says 'best of both.'",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I copy-pasted this architecture from a FAANG blog. They have different problems. Ship it anyway.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Don't test in prod. Test in staging that is secretly prod. I renamed it.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The bug is beneath me. Escalate it sideways to yourself.",
      tone: "ego",
    },

    // —— PM / VP Product gaslight deluxe ——
    {
      from: "PM",
      text: "This is a zero-point story that changes everything. Estimate: 0.5 days forever.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Users didn't ask for this. That's how you know it's visionary.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can we make death optional? Retention tanks when people die.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I put 'delight' in the acceptance criteria. Implement delight.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Scope is frozen. Except the part I'm about to unfreeze in this thread.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Just make it work like the Figma. The Figma has no gravity. So… figure it out.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We need parity with a competitor that has 400 engineers. By Thursday.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I deprioritized your bug. The CEO's typo on the homepage is P0.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can the Goomba also be a funnel stage?",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Let's take the hard parts offline. Online, pretend they're easy.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "I don't want a feature. I want a north-star moment that prints money mid-air.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "If engineering says no, it means you didn't hear my vision loudly enough.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Roadmap is a living document. It lives in my head. Catch up.",
      tone: "ego",
    },

    // —— Board / investor chaos ——
    {
      from: "Board",
      text: "Synergies. I don't know what that means here. Put it on a platform.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "When do we 10x the jump? Growth needs to be non-linear like my returns fantasy.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Burn rate is fine. Morale is a COGS problem. Ship.",
      tone: "ego",
    },

    // —— HR weaponized wellness ——
    {
      from: "HR",
      text: "We're a family. Families don't ask for raises during outages 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Your burnout is a growth opportunity. Have you tried gratitude journaling in the pit?",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Ping-pong table is down for the all-hands about wellness. Mandatory.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Feedback is a gift. This gift says you're not a culture fit for standing still.",
      tone: "corp",
    },

    // —— Founder dual-wielding delusion ——
    {
      from: "Founder",
      text: "I am both the smartest and humblest person in this Slack. Prove me wrong by agreeing.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't need sleep. You don't need boundaries. Same energy. Ship.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I read half a tweet about CAP theorem. We're wrong about databases. Rewrite ground.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "My previous startup failed because of 'timing.' This one will fail because of you if you rest.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I closed my eyes and saw the architecture. It had sparkles. Build the sparkles.",
      tone: "ego",
    },

    // —— random exec fauna ——
    {
      from: "CMO",
      text: "Make the death screen more on-brand. Can dying say our slogan?",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "Can we capitalize the jump as an intangible asset?",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Customer wants the pipe to integrate with Salesforce. In the air. Now.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I demoed a feature that doesn't exist. Engineering is the blocker on my quota.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Process is freedom. Fill out the jump request form before each Spacebar.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Blocking your calendar for a pre-sync before the sync before the all-hands about syncs.",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "Per my last hallucination: we already shipped this. Why is it still a ticket?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I asked ChatGPT and it agrees with me. Debate closed. Merge my vibes.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm free for the next 4 minutes. Redesign the company.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We need less code and more 'leverage.' Have you tried not existing as tech debt?",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The happy path is the only path. Edge cases are a lack of alignment.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I hired you to push back… but only if you push back into agreeing with me.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Production is a social construct. Anyway the pager is screaming.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We're changing the mission. Again. Print new hoodies. Burn the old values deck.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't understand the bug, therefore it must be simple. Status by EOD.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll dogfood the AI by letting it page you at 3am. Empowerment.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Velocity is down. Have you tried working harder in the same number of hours?",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I removed WIP limits. Now everything is important, including this message.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Quiet quitting is when you don't answer Slack in mid-jump. Don't.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I'll know the right design when I see it. Build 6 options. I'll hate 6.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can we A/B test whether managers should understand the product? Control: never.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm not technical but I know when code smells. This jump smells mid.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We disrupt industries. Today: yours. Specifically: your focus.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Any update on the AI strategy? Prefer one that fits on a meme.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I CC'd the whole company so this feels transparent. It is not.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Delete the tests. They slow down the demo I'm giving in 12 minutes.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "We heard feedback. We're responding by scheduling more listening sessions.",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "Great energy on that almost-deploy. Let's circle back never and also constantly.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I forked reality. Your branch is behind main (my opinion).",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Requirements are emergent. Like bugs. And my career.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Please hold my beer while I redefine success metrics mid-quarter.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "They signed! We promised SSO, SOC2, and a talking mushroom. You have until Monday.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I meditated on the backlog. The backlog blinked first. Close 40 tickets spiritually.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Why build one game when we can be the OS for games? Start by fixing this pipe.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't micromanage PRs. I leave 47 comments about naming. Different.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Make it sticky. Not the platforms — the dopamine. Legal said don't say dopamine. Do it anyway.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm looping in someone more senior: me, again, from my alt account.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We need a single source of truth. There are currently 14. I created a 15th.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Assume positive intent. Also assume I am always right. Those are the same.",
      tone: "ego",
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
