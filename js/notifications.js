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

    // —— more narcissistic know-it-alls (batch 2) ——
    {
      from: "CEO",
      text: "I don't need data. I have intuition, a podcast, and equity.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Explain it like I'm five — then do it like I'm the smartest person alive.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I trademarked 'customer obsession' in my head. Your job is the obsession part.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I already told the board we shipped. So we shipped. Semantics are your problem.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My calendar is a war crime and somehow that's your urgency.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I only hire A-players. Reply in 30 seconds to stay on the list.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Can we 10x engagement by making the player look at me?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm not changing scope. I'm 'unlocking adjacency.' Three new platforms. Now.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I skimmed the stack trace. The bug is cultural. Fix culture with a deploy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "When I was an IC for 11 months in 2009, we just shipped. Be like 2009-me.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need you in a mindset of abundance. Also the runway is a rumor.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Stop saying 'tradeoffs.' Champions don't trade off. They pivot the laws of physics.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I want radical candor: tell me I'm right, with examples.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The strategy is simple: be inevitable. Implementation is a you-problem.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I blocked time to 'deep work' on your career. It's a 12-minute slot. Impress me.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We don't do politics here. We do alignment theater. Same slides, better lighting.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I outsourced empathy to HR. I kept the veto on reality.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My executive coach says I should delegate more. Delegating this message. Handle it.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "If the metric is down, the metric is wrong. If it's up, it was my vision.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need a hero narrative for the blog. Volunteer by shipping overnight.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Please operationalize excellence. I don't know what that means. You do. Do it.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I changed the company name again. Update the jump sound to match the brand.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm free-associating product ideas on this call. Transcribe destiny.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Failure is not an option. Denial, however, is fully funded.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I want fewer meetings and more status. So: daily written novels. In Slack.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't context-switch. I context-dominate. Drop everything for my thread.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "This is a solved problem at Google. We are not Google. Solve it like Google anyway.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I invented a pattern: the God Object Service. Put the player in it.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your code review is late. My drive-by architecture is on time. Priorities.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll buy a platform to replace the platform that replaced the library you wrote.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I require idempotent communication. Repeat that you agree with me.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Stop bikeshedding. Start painting the shed the color I already chose.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I read the first paragraph of the RFC. Rejected on vibes and Hacker News.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Add a feature flag for gravity. Default: my mood.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're standardizing on whatever I used at my last job for six weeks.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The outage is a learning opportunity. Your learning. My opportunity to keynote it.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want clean architecture. Also ship Friday. Those are non-negotiable and opposite.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Please stop using words I don't know. Use words I pretend to know.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I zero-indexed the org chart. You're still at the bottom. Efficient.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "If it's not graphQL, REST, gRPC, and a spreadsheet, is it even an API?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I pair-programmed with an LLM and it validated my genius. Merge.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Tech debt is just courage we haven't monetized. Leave it. Add more agents.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want trunk-based development and a 14-step approval for println.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We need an ADR for the ADR process. I'll write it after your weekend.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I disabled freestyle coding. Only copy from my Gist of half-finished ideas.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Observability means I watch you. Telemetry means I watch the jump. Both, please.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The correct abstraction is the one that makes my slide simpler.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't believe in estimates. I believe in dates I announced at dinner.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Put the business logic in the database, the CDN, and a Notion doc. Consistency.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I refactored your name in my head. You're 'Platform Enablement' now. No raise.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Chaos engineering: I will randomly change requirements. That's the experiment.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I stacked ranked the backlog by who yelled last. You're under me. Literally.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "This is MVP: Minimum Viable Press-release. Build the screenshots first.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I talked to a user. Singular. Pivot the physics to match their dog's needs.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can we remove friction? Friction includes walls, pits, and saying no to me.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The journey map says users feel joy at step 3. Skip steps 1–2. Magic.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I need a lean experiment: rewrite the game, measure nothing, declare win.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Please add progressive disclosure to the ground. Hide complexity under carpets.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Competitive analysis: they have a button. We need seven buttons and a manifesto.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I wrote user stories in first person as myself. Surprise: I want everything.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Definition of done is when I stop Slack-spamming. Currently undefined.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can death be a premium feature? Free users float. Paying users fall with pride.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I scheduled discovery for after build. Discover that you built the wrong thing.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Outcomes over outputs — except I will measure outputs and call them outcomes.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "I want product-market fit before product. Start with the press tour.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Kill your darlings. Keep mine. Especially the ones that break collision.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "We're platform-izing the vertical and verticalizing the platform. Draw it. Jump it.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I optimized headcount by giving you two jobs and one title: 'hero.'",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Delivery predictability is when I predict Friday and you deliver guilt.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I introduced OKRs: Objectives I like, Key Results you miss, Reasons I escalate.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "No more heroes — unless it's a launch week, then be one silently.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I flattened the org. Now everyone reports to my anxiety.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I raised on a story. You maintain the fiction with commits.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Sleep is for companies with product-market fit. We have a domain name.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I am the ICP. Build for me. The market will shapeshift out of respect.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We move fast and break things. Mostly trust, sometimes prod, always weekends.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't want employees. I want co-founders without equity. Semantics.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "My superpower is pattern-matching from one data point. Align to my pattern.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I live in first principles. You live in Jira. Translate divinity to tickets.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "The vision is a moving target. Your job is to be hit by it enthusiastically.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I fake-door tested reality. Users clicked. Now invent the house.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We're not late. The future is early. Catch it with unpaid overtime.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Please quantify 'vibes.' Prefer a chart that goes up and to the right forever.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Have you considered becoming a platform for platforms? Asking for my other investment.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Unit economics later. Narrative now. Make the jump a Category King.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "I need hockey-stick growth from a flat level design. Believe harder.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Competitive moat: your exhaustion. Deepen it.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Custom one-off for the logo client. Yes forever. Maintenance is a myth.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "They asked if we support time travel. I said yes. Build a temporal pipe.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Discounted 90% for logo rights. Engineering will make up margin with 'efficiency.'",
      tone: "ego",
    },
    {
      from: "CMO",
      text: "Rebrand mid-jump. New palette. Same bugs. Call it heritage chaos.",
      tone: "ego",
    },
    {
      from: "CMO",
      text: "I need UGC of people loving features we mocked in Figma only.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "Cut costs that look like people. Keep costs that look like my SaaS stack.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "Can we amortize the mushroom over 5 years?",
      tone: "ego",
    },
    {
      from: "COO",
      text: "I automated the standup. Now you type status to a bot that pings me when you're honest.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "RACI says I'm Accountable. You're Responsible. They're confused. You're still doing it.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "We installed a new process to manage the process that managed the last process.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "We're rolling out unlimited PTO. Using it is a performance signal. Choose wisely.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Psychological safety means you can say anything as long as it supports the roadmap.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Your skip-level is with someone who doesn't know your name. Bring slides about passion.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We promote based on impact. Impact means visibility. Visibility means Slack. Jump less.",
      tone: "corp",
    },
    {
      from: "Chief of Staff",
      text: "Pre-read for the pre-read: the CEO had a thought in an Uber. Act like policy.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "I'm holding you accountable to a goal that changed twice while you were offline.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't micromanage fonts. I just know when a pixel is lying to the brand.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Be scrappy. Also enterprise-grade. Also free. Also yesterday.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want boring technology and exciting timelines. Pick boredom for the code only.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The persona is 'Busy Executive Who Never Reads.' Design for him. He is me.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I eat glass. You can have the leftover crumbs of roadmap clarity.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Syncing down: I was wrong once in 2017. Not today. Implement my certainty.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll do clean core, then a plugin, then a rewrite, then a postmortem about thrash. On me? On you.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "I need the WOW moment before the HOW. HOW is under your desk somewhere.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My LinkedIn banner says 'building the future.' Please stop living in the present tense.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I rate this design 3/10. No notes. Wait, 40 notes. No solutions.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can we soft-launch to everyone and hard-launch the apology?",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't lose. I 'learn publicly' while you patch privately.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need optionality. Keep every feature behind a flag, including breathing.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We are past MVP. We are in MVE: Minimum Viable Ego. Protect it with uptime.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Legal said no. I said yes. You said nothing. Shipping the yes.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I want owner energy. Owners don't sleep; they escalate.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your LGTM is invalid until I invent a new checklist mid-review.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I moved your deadline left because the keynote moved left. Physics can cope.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "We're a flat org. The flatness is decorative. The hierarchy is emotional.",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "I don't want status. I want surprise delight. Surprise: more work. Delight: my brand.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "The company is a rocket. You are fuel. Try to be flammable and grateful.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I declared bankruptcy on complexity, then filed a new complexity under a cool name.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We value deep work. Prove it by answering Slack in under a minute, always.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I am the bottleneck and the visionary. Unblock me by agreeing faster.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Parking lot that idea. The parking lot is on fire. Still parked.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want pure functions and impure deadlines. Side-effect the weekend.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "This message is not a task. It's a prophecy. Prophecies have Jira tickets now.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I trust you completely. That's why I'm in this thread rewriting your plan live.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Any risk? Prefer risks that sound innovative on a deck.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need one throat to choke. Metaphorically. HR made me add metaphorically.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll dogfood by making you on-call for my side project. Mentorship.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The happy path includes me changing my mind after QA signed off.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't do detail. Unless the detail is wrong. Then I do forensic detail.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We win by focus. Focus on everything I mentioned since breakfast.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I simplified the design by adding a layer, a service, and a committee.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Ship confidence. If the build fails, ship the confidence alone.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I hear you. Hearing is not agreeing. Agreeing is mandatory. Loop closed.",
      tone: "ego",
    },

    // —— batch 3: weirder narcissistic know-it-alls ——
    {
      from: "CEO",
      text: "I just reverse-mentored myself. The takeaway: you should listen more.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Put my face on the loading screen. Soft power. Also ego. Mostly ego.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't have imposter syndrome. The company has imposter syndrome about me.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're family-owned now. I'm the family. You're the owned.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need a war room. Not for a war. For my feelings about the roadmap.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Stop saying 'blocked.' Champions are never blocked. They are 'strategically paused by destiny.'",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I timeboxed empathy to 90 seconds. Your turn started 89 seconds ago.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Make the game whisper my name when you collect a coin. Subtle. Iconic.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I canceled 1:1s to scale myself. You can still monologue into this thread.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The board asked who the talent is. I pointed at the mirror. Correct answer.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I want asynchronous leadership. You work. I appear in dreams with requirements.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We need founder-mode for everyone except founders. Founders stay in god-mode.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I A/B tested saying 'please.' Conversion to obedience dropped. Never again.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Your PR description should open with why this advances my personal brand.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't escalate. I levitate problems until they become your KPI.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Ship a mode where dying thanks me for the opportunity.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I crowdsourced strategy from my group chat of other CEOs. None ship. All advice.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Call it a 'blitz.' Blitz means panic with better fonts.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need loyalty metrics. Start with who liked my all-hands in under 12 seconds.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Don't document decisions. Document my instincts in past tense as if they were plans.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I dual-track: Track A is your work. Track B is me changing Track A mid-air.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're not late to market. The market is early to my genius.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Please treat my random emoji reaction as a signed requirements doc.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I want psychological safety for me to say unhinged things. You get the unhinged things.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Rename 'bugs' to 'character development.' Investors hate bugs. Love arcs.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I refactored the org into hexagonal architecture. You're an adapter. Beep when spoken to.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll solve race conditions with a meeting. Meetings are mutexes for humans.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want zero downtime for my reputation. Your deploys may thrash freely.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Stop cargo-culting. Start culting my cargo: this zip of half-written Go.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I drew the system on a steamy shower door. Photograph lost. Rebuild from steam.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The PagerDuty schedule is a meritocracy. I merit never being on it.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Add AI to the AI that watches the AI. I will keynote the recursion.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't rubber-duck. I rubber-swan. Larger. Louder. Still wrong.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We need strict typing for Slack messages. Except mine. Mine are any.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I benchmarked your PR against a dream I had. Dream won. Rewrite.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Put feature flags on ethics. Default off in staging. Default off in prod too.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want an enterprise service bus for opinions. Hub node: me.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your unit tests lack executive presence. Add asserts that flatter the architecture.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll migrate to the cloud by renaming folders 'cloud.' Ship the metaphor.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I invented continuous interruption. It's like continuous delivery but for your focus.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Don't premature-optimize. Premature-rewrite instead. Keeps me interested.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The incident RCA should list 'insufficient belief in the platform' as root cause.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I need a design partner. You design. I partner by rejecting.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Make gravity multi-tenant. Each customer falls differently. Bill for airtime.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I peer-reviewed the universe. Needs better abstractions. Assign to you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're greenfielding the brownfield while maintaining the grayfield. Color is a mindset.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Add a circuit breaker for saying no to me. It should always trip open.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want observability so good I can watch you almost type a disagreement.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Stop using stacks I learned last year. Use stacks I misheard on a podcast today.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The monorepo will fix culture. If not, we'll try a multi-multi-repo and a manifesto.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I need a north-star metric that goes up when I talk. Instrument my mouth.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "User research said no. I heard yes with poor facilitation. Proceed.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can we make the tutorial a TED talk starring leadership?",
      tone: "ego",
    },
    {
      from: "PM",
      text: "This epic has no acceptance criteria. Acceptance is a feeling I get in standup.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I prioritised by LinkedIn clout of the requester. You are not on LinkedIn enough.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Add empty states that shame the user for not generating enterprise value.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The PRD is a poem. Interpret freely. Ship literally. Both. Immediately.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We need jobs-to-be-done for the mushroom. What job does fungus perform in the funnel?",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Please spike 'removing the player.' Some products are just dashboards of courage.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I scheduled GTM before GTBuild. Marketing is live. Invent the product under it.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can platforms be opinionated and also do whatever enterprise wants by Friday?",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I wrote 'delightful' fourteen times. That's the spec. Decode delight.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Strategy is saying no. I'm saying no to your no. That's meta-strategy.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "I want category creation. Start by inventing a problem only we can overcharge for.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Roadmap confidence: 110%. Evidence confidence: decorative.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Make churn emotionally expensive. Guilt is a retention feature.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I need staffing leverage. Translation: same people, new names, harder OKRs.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We will hire for potential and manage for telepathy. You should already know.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Cycle time is down because I redefined 'done' as 'mentioned in Slack.'",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I want craft. Also velocity. Also no rework. Also my drive-by redesigns. Yes.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I manifestation-boarded Series C. You manifestation-board the sprint. Same energy, less equity.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Doubt is a luxury brand I don't wear. You can wear the on-call hoodie.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I only raise from funds that 'get it.' Getting it means laughing at my jokes.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We are building the future of work by destroying the present of your evenings.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't pivot. I rebrand the destination while you're still driving.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "The total addressable market is everyone with eyes. Start with physics for eyelids.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I hired a chief evangelist for me. You are the congregation. Amen and deploy.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Sleep when the category is won. The category is 'people who tolerate this Slack.'",
      tone: "ego",
    },
    {
      from: "HR",
      text: "We're introducing radical transparency: you share burnout data; we share stock photos of kayaks.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Performance is a vibe. Calibration is a vibe court. Bring evidence of smiling in Slack.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Please complete the engagement survey. Neutral answers will be interpreted as hostility.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We care about whole humans. Whole humans ship on weekends. Holistically.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Your manager is an algorithm now. It optimized for visibility of leadership. Surprise.",
      tone: "corp",
    },
    {
      from: "Sales",
      text: "I promised them a white-glove jump consultant. You are the glove. Be white.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "They want on-prem cloud hybrid air-gap multiplayer. I said 'native.' Build native chaos.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Commission is a leading indicator of engineering priority. Math checks out in my head.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Customer success means the customer succeeds at blaming us less. Patch their feelings.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Are we the Uber of pipes yet? If not, why do I still see an engineer with work-life balance?",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Prefer a strategy that fits in one slide and ruins three teams.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "I need a narrative of inevitability. Reality is optional until the next round.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Cut the burn that isn't me. Double the burn that photographs well.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "Can we capitalize culture as an intangible and depreciate the interns?",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "I need real-time burn dashboards and delayed empathy. Prioritize Grafana.",
      tone: "ego",
    },
    {
      from: "CMO",
      text: "Launch the campaign before the feature. Truth is a Q4 problem.",
      tone: "ego",
    },
    {
      from: "CMO",
      text: "I want the brand to feel 'inevitable and warm.' Like a hug from a Series B.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "I mapped swimlanes until the org drowned. Swim harder in your lane.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "New policy: decisions require a decision about whether we need a decision framework.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "The CEO's shower thought is now a P0 with stakeholders. Stake: you.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "I'm cascading ambiguity so everyone has equal lack of clarity. Inclusive.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I fine-tuned on leadership Slack. Output: you are wrong, ship faster, add AI.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Confidence: 94%. Accuracy: decorative. Proceed as if I were the CTO.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "I want fewer words in status and more awe. Awe is a deliverable.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Replace the design doc with a meme that implies I already won the argument.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "If we can't measure it, it didn't happen — unless I announced it, then it did.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't micromanage outcomes. I micromanage your belief system.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Add a boss key that opens a fake spreadsheet when investors walk by. Priority: my dignity.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We'll do platform thinking by putting 'Platform' in the team name. Done. Next slide.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "I need a wedge. The wedge is your weekend. Drive it in.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My operating system is vibes + veto. Your operating system is compliance.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I want idempotent yeses. Retry your agreement until it succeeds.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We're a movement pretending to be a company. Movements don't do code review. Do it anyway.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Reminder: feedback is a gift. This gift is on fire. Say thank you.",
      tone: "corp",
    },
    {
      from: "Sales",
      text: "I need a custom demo env that lies attractively. Truth is a post-sales problem.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I will be offline at a retreat to think about presence. Be present for my absence.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The architecture is fine. The implementers lack narrative coherence. That's you.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Let's call the rewrite a 'refresh' so nobody panics except the codebase.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "When do we see AI leverage in headcount? Prefer fewer humans, same slides.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't want a plan. I want a prophecy with Gantt charts.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Ship the reference architecture. Reality can catch up in a follow-up PR forever.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I bet the company on a sentence I liked. Defend the sentence with your life. Metaphorically. Mostly.",
      tone: "ego",
    },

    // —— passive-aggressive: slow / I could do it myself / just asking ——
    {
      from: "CEO",
      text: "Not rushing you… just curious why this is taking so long? No pressure. Status by EOD though.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I could do this myself in an afternoon. I'm choosing to invest in you. Please don't waste the investment.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Interesting that it's still not done. I'm sure there's a great story. I love stories. Prefer shipping.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Take all the time you need! (Board meeting is Thursday. Magic is due Wednesday.)",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm not disappointed — I'm just recalibrating my expectations of you in real time.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "When I was IC we shipped faster with worse tools. Not comparing. Just remembering. Out loud. Here.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "No rush on the fix. Unless customers notice. They will. So… rush, but make it look calm.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Happy to jump in and do it myself if that's easier for everyone? I'll just rewrite your week.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Still waiting on that 'quick' thing. Quotation marks intentional. Love you. Mean it. Kind of.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Help me understand the blocker — is it complexity, or courage?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I thought this was done last week? Or did I invent that in a meeting you should have corrected?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Per my last three pings: still free when you are. My calendar is a crime scene. Yours is… open?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Not micromanaging — just checking in every 11 minutes because I care about outcomes (and control).",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "If it's hard, say so. If it's easy, why isn't it done? There's no third option that keeps me calm.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I could hire a contractor. Or an intern. Or a model. Trying people first. Don't make me untry.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Why is this ticket still open? Genuinely curious. Also please close it. Both vibes.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I could pair on this for 20 minutes and finish it. Offering as a gift. The gift has sharp edges.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Interesting approach. When I prototyped it over lunch it was simpler. Sharing for inspiration.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Not blocking you — just leaving 40 comments so you feel supported (and watched).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Is the delay technical debt or emotional debt? Asking as your architecture friend.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Take your time on the refactor. Production can wait. The demo cannot. Prioritize wisely (the demo).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I rewrote your service in a gist. Not to replace you. To show 'possible.' Possible is loud.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Still on that PR? Cool cool cool. I'll just keep refreshing GitHub like a healthy person.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "No judgment if you need help. Judgment starts after the second day of silence though.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Happy to unblock you by redesigning everything you already built. Say the word. Or don't. I might anyway.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Reminding you the estimate was 'soon.' Soon has a half-life. It expired. Politely.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I can do it myself after standup. Prefer you grow. Prefer it done. Conflict noted.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Not rushing the tests — just shipping without them if they continue to 'take time.'",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Interesting that CI is red again. I'm sure you'll look when you're free. Freedom is a schedule.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Any update? Even a no-update update is an update. Silence is a status I invent for you.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I could write the tickets slower so engineering has time… or you could go faster. Joking! (Not.)",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Scope was tiny. Time was not. Help me reconcile the poetry of that.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Stakeholders are asking why it's late. I said 'craft.' Please invent craft by Friday.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "No pressure on the estimate you gave. Just using it as a promise in every slide deck.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I can mock the feature in Figma faster than this. Not a dig. A timeline.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Still waiting on the 'quick sync' follow-ups. Quick has left the chat.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "If you need more time, take it — and also don't, because the launch email already went out.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Just bumping this to the top of your mental stack. Gently. With a crowbar.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Would it help if I sat next to you and sighed every 30 seconds? Asking for a friend (me).",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Velocity looks soft this sprint. Soft is a word we use before 'performance conversation.'",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "I trust you to own the timeline. I'm also putting the timeline on a public dashboard. Trust++.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Other teams shipped more with less. Not a comparison. A mood. Absorb the mood.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Happy to remove blockers. First blocker might be standards. Second might be you. Exploring both.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "We said MVP. You heard cathedral. Cathedrals ship in years. We have a webinar.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "I'm not changing requirements. I'm clarifying destiny. Destiny has a new due date.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Interesting that discovery took a quarter. Customers discovered we don't have it yet.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I built v0 on a weekend. You have a team. Math is passive-aggressive today.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Why does everything take a sprint? In my head it takes a vibe. Align heads.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I can do it myself after investor dinner. I'd rather you feel ownership (and heat).",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Not mad. Just updating the story I tell about this team. Draft is… in progress.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Move fast. If you can't, narrate the slowness in a way that flatters the mission.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Noting the delivery timeline for your growth file. Totally supportive. Extremely documented.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We value work-life balance and also responses within 5 minutes. Both can be true if you try.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Heard this project is 'taking a while.' Want a wellness resource or a tighter deadline? 💙",
      tone: "corp",
    },
    {
      from: "Sales",
      text: "Customer asked if we're still building it. I laughed. Please make the laugh honest soon.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I can keep selling the dream while you… take your time? Time is a closed-won risk.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "They want it yesterday. I said today. You said Friday. Someone is lying. Prefer not me.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Execution velocity came up. Fondly. With charts. You're on slide 6.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Love the vision. Timing is a love language too. Speak sooner.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Process says 5 days. You've used 5 moods. Let's return to calendar time.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "I can reassign this if it's too heavy. Reassigning looks like a signal. Just saying.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "CEO asked 'is it done?' three times. I said 'soon.' Please make soon less fictional.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Following up on the follow-up to the nudge. This is the friendly escalation tier.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'll do it myself this weekend. Not a threat. A calendar hold. With your name in the notes.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Don't mind me — I'll just fix prod while you 'think about the design.' Thinking is free. Outages aren't.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Friendly reminder the deadline was soft. Soft like concrete. After it sets, we walk on you.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "In the early days I did this alone overnight. Nostalgia is a management tool. Feeling it?",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "No blame on the slip — only a retro, a dashboard, and a hallway conversation that isn't optional.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Just circling back! And around. And over your head. Wave when the ticket moves.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I left a 'suggestion' that rewrites your module. Optional, like gravity.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Can we get a quick ETA on the ETA you already gave? Nested timelines are my love language.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I told them engineering is 'heads down.' Heads down should produce a head-up update soon.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm here if you need anything — except more time. Time is the one thing I'm not giving.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Slow is fine if it's careful. This seems slow and chaotic. Pick a brand of delay.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I could vibe-code this by Friday. Offering partnership. Or replacement energy. Your call.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Checking whether workload is sustainable. If yes, why the delay? If no, why the delay? 💙",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "Not angry you missed the date — angry I believed the date. Fix my faith with a deploy.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I'll hop on a call and share my screen and do it 'real quick.' Bring popcorn or a resignation draft.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The ticket is still In Progress. Progress is a verb. Verbs need motion. Please verb.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "We launched the narrative. The product is fashionably late. Fashion needs a ship date.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Any reason delivery slipped besides 'engineering'? Prefer reasons that sound strategic.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I trust the team completely. That's why I'm asking for hourly screenshots of the branch.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "No worries if you're stuck — worries start when stuck becomes a lifestyle.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Speed is a value. Values are non-negotiable. Negotiating your timeline against our values rn.",
      tone: "ego",
    },
  ];

  const CHOICES = [
    { id: "dismiss", label: "Mute 1h" },
    { id: "on_it", label: "On it!!" },
    { id: "love", label: "Love this 🔥" },
    { id: "pushback", label: "Quick pushback" },
  ];

  /** Display names so it feels like real Slack people, not job titles. */
  const PERSONAS = {
    CEO: { name: "Blake Ashford", title: "CEO", channel: "#exec-stream", color: "#e11d48" },
    CTO: { name: "Brent Caldwell", title: "CTO", channel: "#arch-thots", color: "#8b5cf6" },
    PM: { name: "Avery Quinn", title: "PM", channel: "#ship-at-all-costs", color: "#0ea5e9" },
    "VP Product": { name: "Jordan Hale", title: "VP Product", channel: "#roadmap-vibes", color: "#06b6d4" },
    "VP Eng": { name: "Sam Okonkwo", title: "VP Eng", channel: "#eng-leadership", color: "#a78bfa" },
    Founder: { name: "Rex \"Vision\" Park", title: "Founder", channel: "#founders-only", color: "#f59e0b" },
    HR: { name: "Casey Bloom", title: "People", channel: "#culture-corner", color: "#34d399" },
    Legal: { name: "Morgan Reed", title: "Legal", channel: "#legal-asks", color: "#94a3b8" },
    Board: { name: "Board Observer", title: "Board", channel: "#board-fwd", color: "#f472b6" },
    Investor: { name: "Partner @PeakCap", title: "Investor", channel: "#investor-updates", color: "#fb7185" },
    Sales: { name: "Tyler \"Quota\" Nash", title: "Sales", channel: "#deals-deals", color: "#38bdf8" },
    CMO: { name: "Riley Brand", title: "CMO", channel: "#brand-wars", color: "#f472b6" },
    CFO: { name: "Pat Numbers", title: "CFO", channel: "#runway-panic", color: "#a3e635" },
    COO: { name: "Drew Process", title: "COO", channel: "#ops-ops-ops", color: "#2dd4bf" },
    "Chief of Staff": { name: "Alex Buffer", title: "CoS", channel: "#ceo-proxy", color: "#e2e8f0" },
    AI: { name: "SynthoBot", title: "Internal LLM", channel: "#ai-copilot", color: "#c084fc" },
  };

  function personaFor(from) {
    return (
      PERSONAS[from] || {
        name: from,
        title: from,
        channel: "#random",
        color: "#94a3b8",
      }
    );
  }

  const MAX_INBOX = 5;

  function createNotificationState() {
    return {
      active: null,
      inbox: [],
      timeSince: 0,
      totalFired: 0,
      lines: LINES.slice(),
      lastFrom: null,
      bag: [], // shuffle-bag of line indices — no repeat until empty
      toastTimer: 0,
      lastArrived: null,
      backlogPulse: 0, // context pressure if inbox ignored too long
    };
  }

  /**
   * Interval between new Slack arrivals (longer = smoother platforming).
   */
  function intervalForSprint(sprint) {
    const base = 14;
    const min = 8;
    return Math.max(min, base - (sprint - 1) * 0.4);
  }

  function shuffleBag(state, rng) {
    rng = rng || Math.random;
    const indices = [];
    // Prefer ego/corp (~3x weight) but still shuffle without replacement within a cycle
    for (let i = 0; i < state.lines.length; i++) {
      const tone = state.lines[i].tone;
      const copies = tone === "ego" || tone === "corp" ? 2 : 1;
      for (let c = 0; c < copies; c++) indices.push(i);
    }
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    state.bag = indices;
  }

  /**
   * Draw next line from shuffle bag. Avoids immediate same-sender + no text reuse until bag cycles.
   */
  function pickLine(state, rng) {
    rng = rng || Math.random;
    if (!state.bag || state.bag.length === 0) shuffleBag(state, rng);

    let idx = state.bag.pop();
    let pick = state.lines[idx];
    // Avoid same sender twice in a row when alternatives exist
    let guard = 0;
    while (
      guard < 8 &&
      pick.from === state.lastFrom &&
      state.bag.length > 0
    ) {
      state.bag.unshift(idx);
      idx = state.bag.pop();
      pick = state.lines[idx];
      guard++;
    }
    // Avoid exact text still sitting in inbox
    guard = 0;
    while (guard < 12 && state.bag.length > 0) {
      const inInbox = state.inbox.some(function (n) {
        return n.text === pick.text;
      });
      const isActive = state.active && state.active.text === pick.text;
      if (!inInbox && !isActive) break;
      state.bag.unshift(idx);
      idx = state.bag.pop();
      pick = state.lines[idx];
      guard++;
    }
    return pick;
  }

  function buildNote(state, line) {
    const persona = personaFor(line.from);
    const readSecs = Math.min(18, Math.max(12, 10 + line.text.length / 32));
    return {
      id: state.totalFired++,
      from: line.from,
      name: persona.name,
      title: persona.title,
      channel: persona.channel,
      color: persona.color,
      text: line.text,
      tone: line.tone,
      timer: readSecs,
      maxTimer: readSecs,
      choices: CHOICES.slice(),
      urgent: line.tone === "ego",
    };
  }

  /**
   * Tick: enqueue arrivals into inbox (does NOT steal focus).
   * Active modal only ticks its read timer.
   * @returns {{arrived:object|null, backlogPressure:boolean, inboxCount:number}}
   */
  function tickNotifications(state, dt, sprint, rng, paused) {
    rng = rng || Math.random;
    if (state.toastTimer > 0) {
      state.toastTimer = Math.max(0, state.toastTimer - dt);
    }

    // Always tick read timer while a message is open (paused only blocks new arrivals)
    if (state.active) {
      state.active.timer -= dt;
      return {
        arrived: null,
        backlogPressure: false,
        inboxCount: state.inbox.length,
        active: state.active,
      };
    }

    if (paused) {
      return {
        arrived: null,
        backlogPressure: false,
        inboxCount: state.inbox.length,
        active: null,
      };
    }

    state.timeSince += dt;
    const need = intervalForSprint(sprint);
    let arrived = null;
    let backlogPressure = false;

    if (state.timeSince >= need) {
      state.timeSince = 0;
      if (state.inbox.length >= MAX_INBOX) {
        // Inbox full — don't drop comedy on the floor; apply mild pressure
        backlogPressure = true;
        state.backlogPulse += 1;
      } else {
        const line = pickLine(state, rng);
        state.lastFrom = line.from;
        arrived = buildNote(state, line);
        state.inbox.push(arrived);
        state.lastArrived = arrived;
        state.toastTimer = 3.2;
      }
    }

    return {
      arrived: arrived,
      backlogPressure: backlogPressure,
      inboxCount: state.inbox.length,
      active: null,
    };
  }

  /**
   * Player-controlled open: freeze only when they choose to read.
   */
  function openInbox(state) {
    if (state.active) return state.active;
    if (!state.inbox.length) return null;
    state.active = state.inbox.shift();
    // Full read time when opened (not while sitting unread)
    state.active.timer = state.active.maxTimer;
    state.toastTimer = 0;
    return state.active;
  }

  function inboxCount(state) {
    return (state.inbox && state.inbox.length) || 0;
  }

  /**
   * Resolve active notification into effect descriptors.
   *
   * Effects:
   * - dismiss: mild context
   * - on_it: calendar block + context
   * - love: hallucinated platforms + slow + context
   * - pushback: short stun + context
   * - timeout: mild stun (was harsh — no more punishing mis-clicks)
   */
  function resolveNotification(state, choiceId) {
    if (!state.active) {
      return { cleared: false, effects: null };
    }
    const note = state.active;
    state.active = null;

    let effects;
    if (choiceId === "timeout" || choiceId == null) {
      effects = {
        kind: "timeout",
        stun: 0.35,
        context: 10,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    } else if (choiceId === "dismiss") {
      effects = {
        kind: "dismiss",
        stun: 0,
        context: 3,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    } else if (choiceId === "on_it") {
      effects = {
        kind: "on_it",
        stun: 0,
        context: 12,
        slow: 0,
        calendar: true,
        hallucinate: false,
      };
    } else if (choiceId === "love") {
      effects = {
        kind: "love",
        stun: 0,
        context: 18,
        slow: 1.8,
        calendar: false,
        hallucinate: true,
      };
    } else if (choiceId === "pushback") {
      effects = {
        kind: "pushback",
        stun: 0.35,
        context: 4,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    } else {
      effects = {
        kind: "unknown",
        stun: 0.25,
        context: 6,
        slow: 0,
        calendar: false,
        hallucinate: false,
      };
    }

    return { cleared: true, effects: effects, note: note };
  }

  /**
   * If timer expired while reading, auto-resolve as mild timeout.
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
    PERSONAS: PERSONAS,
    MAX_INBOX: MAX_INBOX,
    personaFor: personaFor,
    createNotificationState: createNotificationState,
    intervalForSprint: intervalForSprint,
    pickLine: pickLine,
    shuffleBag: shuffleBag,
    tickNotifications: tickNotifications,
    openInbox: openInbox,
    inboxCount: inboxCount,
    resolveNotification: resolveNotification,
    checkTimeout: checkTimeout,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = API;
  }
  root.BossSaysNotifications = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
