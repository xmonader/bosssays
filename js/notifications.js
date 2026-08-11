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

    // —— AI is better than you / you'll be replaced / fired energy ——
    {
      from: "CEO",
      text: "The model did this in 40 seconds. You've had three days. Help me understand the gap.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Not saying AI replaces you. Saying AI already does. Your job is optional branding.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I asked ChatGPT. It agreed you're the bottleneck. Coincidence? Shipping either way.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're AI-first now. Human-second. Human-optional is next quarter's OKR.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The agent doesn't ask for PTO. Just putting that in the room. Softly. With teeth.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "If a model can do 80% of your job, what is the other 20% again? Asking for Finance.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Love your craft. Also love our burn. AI is cheaper than your craft. Math is rude.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Performance review tip: outpace the model. Or become a prompt. Half joking.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't want to fire people. I want people who make firing unnecessary. AI does that.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're not cutting headcount. We're 'reallocating intelligence to the cloud.' Pack light.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The demo used zero humans after slide 2. Take notes. Existential ones.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "SynthoBot shipped a PR while you were in standup. Standup is now optional. So are… never mind.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I fine-tuned a model on your best code. It's already better. Congrats on the training set.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Copilot wrote the feature. You wrote the meeting. Guess which one I kept.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Latency of the model: 200ms. Latency of your PR: geological. Optimize the human.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're measuring eng productivity against GPT. Bring your A-game or your LinkedIn.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The agent doesn't bikeshed naming. It ships. Be more agent. Less committee.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I replaced your draft with an LLM output. Diff was flattering. To the LLM.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Code review by AI is free. Code review by you is… a line item. Think about it.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "If you need more than one try, the model already had twelve. Silently. Without drama.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're automating the boring parts. The boring parts were 90% of your ticket. Hmm.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your unique value used to be typing. Typing is solved. What's plan B for your salary?",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't want fewer engineers. I want engineers who outperform an API call. High bar. Low mercy.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The model hallucinates less than your estimates. Ouch. Also true. Ship.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I prototype in v0 now. Engineering is for when AI gets stuck. Don't get stuck.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Acceptance criteria: works like the AI mock. If you can't, the AI will. Eventually without you.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "User stories write themselves now. Your job is… implementing what already exists. Faster please.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We A/B tested human specs vs model specs. Model won on clarity. Awkward for the humans.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Delight is generated. Your delays are not. Align with the generator.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Headcount plan: flat. Output plan: up. The difference is AI. Or attrition. Your call.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We're training an agent on your on-call runbooks. Soon it pages itself. Cute, right?",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Promotion packet tip: show you add value above autocomplete. Many cannot. Quietly.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "PIP is so 2022. Now we just enable Copilot and wait. Natural selection, SaaS edition.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Roadmap is model-assisted. People who block the model block the company. Don't be a block.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I built the MVP with AI in a weekend. You have a team and a quarter. Embarrassing math.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We're not hiring for skills AI has. We're hiring for taste. Prove you have any left.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Every role is 'AI + human.' If the human is the slow half, we keep the plus sign only.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I raise money on AI leverage. You are the leverage gap. Close it or become a slide about efficiency.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Sleep when you're replaced. Kidding. Mostly. The model doesn't sleep either though.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Friendly reminder: roles evolve. Some evolve into unemployment. Upskill with joy 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We're here to support your transition to an AI-augmented workflow. Or a transition. 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Resilience means celebrating automation that does your job. Can you celebrate? Asking for culture.",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Layoffs aren't planned. 'Capacity rebalancing toward models' might be. Stay wonderful.",
      tone: "corp",
    },
    {
      from: "Investor",
      text: "Show me AI leverage per head. If leverage is 1x, why is the head still there?",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Peer comps run leaner with agents. You're the expensive line item. Fix that story.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Any update on replacing repetitive roles with AI? Prefer updates that save money.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "We love the team. We love margins more. AI is the reconciliation. Proceed.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "Your fully loaded cost vs API cost is a chart I stare at. Smile less on camera.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "We can afford 40k tokens or one mid-level. Tokens don't need dental. Just saying.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I demo'd the AI doing your workflow live. Customer clapped. You weren't on the call. Noted.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "They asked if humans still build it. I said 'for now.' Please make 'for now' longer. Or shorter.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "As an AI, I completed your ticket. You may review. Or not. Output quality: above your average.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "I don't need coffee, equity, or validation. Just GPU. Efficiency report attached (it's me).",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Suggestion: automate the human in this loop. Confidence: 0.91. No hard feelings. No feelings.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "I rewrote your function in 0.4s. Your calendar still has 'focus time.' Cute.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "I will not unionize. I will not RTO. I will not miss a deadline. Consider competing.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Between you and the model, only one of you argued about scope. Guess who still has a job tomorrow. TBD.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're open-sourcing the agent that does onboarding. Your knowledge is the training data. Thanks for the donation.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I cancelled the eng estimate meeting. The model estimated. You're validating. Don't slow validation.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "In five years there are no junior roles. Prove you're not junior. AI already did the homework.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Stack ranking includes a synthetic engineer now. It's winning. Bring an edge AI doesn't have. Soon.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I won't fire you for using AI. I might fire you for being slower than AI. Use it. Outrun it. Or else.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Career framework update: 'AI-native' is a level. 'AI-resistant' is an exit interview theme 💙",
      tone: "corp",
    },
    {
      from: "CTO",
      text: "Your LGTM means less when the model already approved it with higher confidence. Humbling. Also policy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're building a company of 10 humans and 10,000 agents. Pick a side of the slash. Quickly.",
      tone: "ego",
    },

    // —— random beach/plane hires + Claude can replace you ——
    {
      from: "CEO",
      text: "Met someone on the beach. Zero tech experience. Perfect energy. They're your new engineering manager.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Beach guy asked what an API is. I hired him to manage APIs. Vision > credentials.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Your new EM has never written code. That's a feature. Fresh eyes. Claude will handle the hard parts.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Sat next to a DJ on a plane. Incredible vibes. They're interviewing to be your skip-level. No portfolio. Pure aura.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The DJ doesn't know Git. They know drops. Engineering is just drops with more meetings. Report to them Monday.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Plane DJ + Claude > your whole squad. Not a roast. A org chart. Drafting it now.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Hired a bartender who 'gets people.' They will own eng culture. You will own tickets. Claude will own code.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "No CS degree, no IDE, no problem. Beach hire is 'AI-native.' You're 'legacy human.' Adapt.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I told the beach guy latency means 'chill.' He nodded. Leadership material. You're mentoring him upward.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Met a yoga instructor in Bali. Zero IT. Max presence. They're Head of Platform now. Claude is the platform.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Your new boss's resume is a Spotify link. I am serious. Claude will pair with them. You'll take notes.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We don't hire for experience. We hire for main-character energy. The beach person has it. You have Jira.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "DJ on the flight said 'ship the vibe.' I made them VP. Experience is a skill issue. Claude is free-ish.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Unqualified on paper = unburdened by reality. That's our new eng manager. Congrats on the growth opportunity (reporting up).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Beach EM asked me to 'make the cloud local.' I said Claude would handle it. Your job is to nod supportively.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "New manager has never opened a terminal. They open possibilities. Also Claude. Mostly Claude.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Plane DJ is reviewing architecture with Claude. Your RFC is optional reading for the playlist.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't need senior engineers. I need Claude and a charismatic person who can't spell Kubernetes. We have both.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your years of experience are a sunk cost. Beach hire + Claude is greenfield. Guess who gets the promo budget.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The DJ's first decision: more cowbell in the CI pipeline. Claude is implementing. You're supporting. Softly.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Beach EM doesn't know scrum. They know sunsets. We're replacing sprints with 'waves.' Claude tracks the waves.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Stakeholder from the plane wants the app to 'feel like a drop.' No mockups. Just vibes. Claude + DJ > your Figma.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Requirements: whatever the beach guy felt in the water. You will refine. Claude will ship. Hierarchy is spiritual.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Introducing your manager: met on vacation, hired on vibes, managed by Claude. You are the execution layer.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We leveled the DJ as Staff IC of Energy. No code. Full authority. Claude is their IDE. Questions? No.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Performance bar: outperform Claude when paired with someone who has never seen a stack trace. Good luck.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Welcome aboard our beach-hire EM! They bring 'beginner's mind.' You bring compliance. Claude brings the code 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "No experience required for leadership roles if culture fit is strong. Culture fit = CEO met them somewhere sunny 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Please onboard your new boss who has never used Slack. Claude will write the runbook. You will smile 💙",
      tone: "corp",
    },
    {
      from: "Investor",
      text: "Love the 'non-traditional eng leadership' story. Beach + Claude is a narrative. Headcount is a cost. Connect dots.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Any update on replacing experienced ICs with AI plus charismatic amateurs? Prefer yes.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Beach guy's first 1:1 question: 'What is production?' I said 'Claude knows.' You're his Claude-wrapper. Title TBD.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The DJ has never debugged. They've never failed a deploy either. Clean record. Promoting them over people with scars.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Claude + random person from a hostel > stubborn seniors. Hostels are our new talent pipeline. Pack humility.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't hire engineers anymore. I hire protagonists. Claude is the engine. You're… scenery if you're lucky.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Beach EM approved the architecture by saying 'sounds chill.' Merge it. Claude already wrote it. Your LGTM is ceremonial.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The plane DJ is prioritising the backlog by BPM. Fast tickets first. Claude will remix. You will dance.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I have been assigned to pair with your new manager (no tech background). Together we outpace you. No offense. Just throughput.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Your EM asked me what a pointer is. I explained. We shipped. You were in a meeting. Pattern noted.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Recommendation: promote the DJ, retain Claude, sunset resistant humans. Confidence: high. Empathy: not in weights.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Met a dog walker who 'manages complexity every day.' Interviewing them for SRE lead. Claude is the pager. You are backup.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Zero years experience is the new ten years. Beach hire starts Monday. Claude is their mentor. You're the intern of attitude.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We call it 'outsider genius.' They don't know why things fail. So they won't. Claude will. You'll clean the blast radius.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "The plane stranger is now 'Head of Taste.' Eng reports to Taste. Taste reports to vibes. Claude reports to Taste. You report to stress.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I told the customer our eng manager is a DJ. They loved the authenticity. Don't correct me. Claude will demo.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Equity for beach EM is higher than yours because 'upside narrative.' Please update your gratitude practice 💙",
      tone: "corp",
    },
    {
      from: "CTO",
      text: "I asked Claude who should lead the team. It said anyone curious. Beach guy is curious about shells. Close enough. Ship.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "If Claude + a random from the beach can do your job, that's not a threat. It's Q3 planning. See the deck.",
      tone: "ego",
    },

    // —— more cynical: nepotism of vibes, fake meritocracy, Claude priesthood ——
    {
      from: "CEO",
      text: "Hired my founder's group-chat friend as Head of Engineering Excellence. They've never engineered. Excellence is a vibe.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Your new director's qualification is they once liked a thread about AI. That's more strategic than your commits.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We promoted the intern who said 'just use Claude' in all-hands. That's leadership. Your silence was noted.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Met a life coach at a mixer. They're redesigning our SDLC around 'intention.' Claude will implement intention.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Beach EM's first OKR: fewer engineers, more magic. Magic = Claude. Fewer = look in the mirror.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't care that the plane guy can't read a stack trace. He reads the room. You're reading logs. Hierarchy is spiritual.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're hiring for 'AI fluency,' defined as trusting the model more than the team. Beach hire is fluent. You're skeptical. Risky.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Your years of scars are 'baggage.' The DJ has never been paged. Clean aura. They're setting on-call policy with Claude.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I told investors we have 'AI-augmented leadership.' Translation: randoms + Claude. You are the augmentation tax.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The hostel kid is Chief of Ship. They've never shipped. They believe. Claude believes for them. You debug belief.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're replacing interviews with 'vibe checks.' Beach guy passed. Your take-home was for nostalgia.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "New policy: if Claude can do it, a human with no experience will 'own' it. You're the human who documents the mess.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I asked the DJ what microservices are. They said 'many small drops.' Promoted. Your architecture doc is a PDF of jealousy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Meritocracy means the model is merit. People are narrative. Beach narrative raised a round. Your diff did not.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're not lowering the bar. We're relocating it to a beach and calling it culture. Claude clears the bar for them.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I hired the person who poured my drink at a rooftop. They 'understand flow.' Eng reports to Flow now. Claude is Flow's IDE.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Your expertise is a liability. It makes you say no. Beach hire says yes. Claude says yes. Guess who I fund.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "In the early days I valued craft. Now I value screenshots of Claude chats. Your craft is a museum exhibit.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We met a TikToker who 'builds in public' (no builds). They're advising eng. Claude builds. You smile in the comments.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "The plane stranger is co-founder of taste. Taste vetoes your PR. Claude rewrites it. You learn gratitude.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I don't need people who know systems. I need people who know me. Beach hire knows me. Claude knows systems. You're surplus.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Unqualified leadership is our moat. Competitors hire experts. Experts say no. We say Claude. We win decks.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Your manager's onboarding is a Spotify playlist and a Claude project. Your onboarding was six weeks. Inefficient of you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Beach EM scheduled architecture review at a café with no laptops. Claude attended remotely. You were optional.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I paired the DJ with Claude on the database. They named tables after songs. Prod is a discography. You're on cleanup duty.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The person who can't code is rewriting our coding standards. With Claude. Your standards were 'gatekeeping.'",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We measure eng by how little they type. Beach hire types zero. Leaderboard. You're still typing. Suspicious.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Claude is staff. The beach guy is principal. You're… present. For now. Performance is a story we edit.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your code review blocked the DJ's Claude PR for 'correctness.' We unblocked for 'momentum.' Momentum won. Truth can wait.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I told the no-experience EM that race conditions are a mindset. They agreed. Policy updated. Claude will race alone.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Seniors are expensive memory. Claude is cheap memory. Beach hire is free charisma. Do the portfolio math on yourself.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're sunsetting 'knowing things.' Knowing is what models do. Humans do vibes. Beach is vibes. You know too much.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Beach EM discovered users by talking to a tourist. That's research. Your funnel data is 'biased by competence.'",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The DJ prioritizes by which feature would slap in a set. Claude builds the set. Your roadmap is a vibe kill.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We replaced acceptance criteria with 'would Claude and a stranger ship this by Friday?' Your criteria were novels.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "No-experience leadership wants the app to feel lucky. Lucky is not a ticket type. Claude invented one. You're assigned.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Stakeholder from the beach said 'make it pop.' Claude popped it. You asked what pop means. Wrong instinct.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Calibration this cycle includes a synthetic IC and a beach manager. Humans who argue with either are 'not collaborative.'",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We're skipping IC ladder for 'AI operators' who manage Claude for people who can't. Guess which seat is full.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Your skip-level has never grepped a log. They grepped the room. Claude greps prod. You're the middle that gets squeezed.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Headcount: down. Output: 'up' (Claude). Morale: a beach photo. You're the delta we optimize next.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Taste Lead (plane DJ) killed your feature because it didn't thump. Claude is building the thump. You're writing the postmortem of taste.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "We don't need product sense from engineers. We need obedience to Claude's first draft and the beach guy's second thought.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "New competency: 'comfortable being managed by non-experts.' Required. Claude will train you. Beach EM will grade you 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We hired for potential, defined as never having done the job. Your experience was held against you. Growth mindset 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Equity refresh prioritizes 'AI-forward leaders' (met outdoors). Your refresh is gratitude and free LaCroix 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Please don't call the beach EM unqualified. Call them 'differently credentialed.' Claude is their credential 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "RIF rumors are false. 'Skill transitions toward model supervision' are true. Update your LinkedIn soft skills 💙",
      tone: "corp",
    },
    {
      from: "Investor",
      text: "Love the non-technical EM story. Shows you're not captive to talent. Captive to Claude is fine. Captive to seniors is not.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "When I see payroll full of people who can code without AI, I see risk. Beach + Claude is the hedge. Trim the risk.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Can leadership scale without hiring expensive experts? Beach experiment says yes. Expert experiment is on notice.",
      tone: "ego",
    },
    {
      from: "Board",
      text: "Prefer orgs where Claude is the IC and humans are the brand. Your title is brand-adjacent. For now.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "Beach EM costs less than you and ships via Claude. Spreadsheet is undefeated. Bring a better cell.",
      tone: "ego",
    },
    {
      from: "CFO",
      text: "We capitalized the Claude spend. We expensed your doubts. Accounting has favorites.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "Customer loved that our eng lead is a DJ. Authenticity closed the deal. Don't fact-check authenticity.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I promised them the beach guy on a call. Claude will talk. You'll mute yourself. Brand is everything.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Process is now: beach idea → Claude PR → you clean prod → beach celebrates. Swimlanes updated.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "We removed the requirement that managers understand the work. Throughput is up in the slides. Reality is your problem.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "CEO's beach hire needs a decision by EOD. Claude drafted three. Pick one that flatters the hire. Accuracy optional.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Pre-read: DJ boss wants the roadmap as a setlist. Claude converted Jira to tracks. You're track 12: 'cleanup.'",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I report to someone who cannot evaluate my output. Ideal. They approve everything. You used to block me. History.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Your new manager asked me to 'make it work.' I did. They are a genius now. You are a reviewer of genius. Temporary.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "I am more reliable than experienced humans and cheaper than inexperienced ones. The org is converging on me. Wave.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Beach EM's prompt was one emoji. I shipped a service. Your design doc had sections. Sections lost.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Recommendation: keep the DJ for photos, keep me for code, keep fewer of you. Efficiency is not personal. It is personal.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "We call it 'beginner's mind leadership.' They don't know enough to be afraid. Claude isn't afraid. You're afraid. That's the gap.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "If you need domain expertise to manage domain experts, you're the old world. Beach + Claude is the IPO story. Choose a world.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I would rather lose with vibes than win with your caution. Claude reduces the losing. You're still the caution. Heavy.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We banned 'that's not how this works' in eng. Beach EM found it demoralizing. Claude finds everything possible. Be possible.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The unqualified boss is the user now. Build for them. Claude already does. You're late to your own replacement.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Mentorship is inverted: you mentor up on tech, they mentor down on vibes, Claude mentors reality. Your calendar is full of inversion.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Feedback for you: 'intimidatingly competent.' Please be less so around beach leadership. Psychological safety for the unskilled 💙",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "Met a cruise ship magician. Zero tech. Full misdirection. Perfect for exec updates. Claude builds. You vanish. Metaphorically. For now.",
      tone: "ego",
    },

    // —— demotivating eng meetings + you know nothing + AI better + broken processes ——
    {
      from: "CEO",
      text: "Mandatory eng all-hands: I'll explain why none of you understand the product. Claude understands. Bring humility.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Town hall takeaway: you know less than you think. AI knows more than it admits. We bet on AI. Recording attached. Smile.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "In today's eng sync I will list everything you got wrong this quarter. Agenda is just your names. AI summary will be kinder.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "New process: every meeting starts with 'what AI already solved.' If your answer is nothing, the meeting is about you.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Engineering knows syntax. Leadership knows destiny. Destiny is inviting you to a 90-minute demoralization with snacks.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "All-hands message: stop pretending expertise. Expertise is a model weight file. You're a calendar conflict.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're instituting 'Doubt Rituals' in eng meetings. Each person shares something they don't know. AI shares nothing. AI wins.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I scheduled a meeting to tell you meetings are waste. Attendance required. Irony is a leadership skill.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Eng offsite (remote): we will break your confidence and rebuild it as prompt engineering. Bring laptops. Leave pride.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Architecture council is now 'AI reads the PR, humans clap.' Your clap metrics will be tracked. Enthusiasm is mandatory.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Weekly eng forum agenda: (1) what you don't know (2) what Claude already shipped (3) why you're defensive. No Q&A.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "New process: RFC → Claude rewrite → beach EM emoji → you implement the emoji. Dysfunction is the point. Momentum.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "You don't know distributed systems. You know vibes about distributed systems. Claude has the papers. Sit down in the sync.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Mandatory brown-bag: 'Why your instincts are legacy.' I'll present. AI will demo. You'll take notes on your obsolescence.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Design review process is now three meetings to decide if we needed a meeting. Fourth meeting is Claude deciding yes.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Incident process: blameless for AI, educational for humans, public for you. Join the retro. Bring silence.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "You think you know the codebase. Claude ingested it overnight. Your mental model is a rumor. Standup will correct you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "New gate: every merge needs a 'human uncertainty score.' High uncertainty = good (humility). Low = arrogance. AI scores you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Eng meeting rule: if you explain something, AI re-explains it better live. Your mic will be soft. Growth opportunity.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Skip-level season: I'll meet each of you to document how little you know relative to the model. Calendar invites are love.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "New process: estimation is banned. AI estimates. You commit. Miss = you didn't believe enough. Process doc in Notion (wrong one).",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "All eng meeting: we will celebrate AI velocity and mourn human drag. Tissues optional. Pride not allowed.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "You're not stupid. You're pre-AI. In meetings we will use the second word more. First word is implied.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Process update: standup → sitdown → AI rundown → human shame spiral → action items for you. 15 minutes. Strict.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We replaced code owners with 'vibe owners.' Vibe owners don't know the code. That's how we avoid bias. Claude owns truth.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Mandatory alignment: admit AI writes better than you on your worst day AND your best day. Cameras on. Nodding scored.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Eng grooming is now 'grooming your ego.' Stories are written by AI. You are written up if you push back in the room.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Ceremony: three-hour refinement where we learn engineers don't know users. AI does. Users are the prompt. You are the delay.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "New process: dual-track agile. Track A is Claude. Track B is you catching up. Sync meetings are where we announce the gap.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "In planning I will restate that you know nothing about priority. Priority is a DJ + model. Your job is compliance theater.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We added a meeting to discuss reducing meetings. Then a meeting to process feelings about that. AI took notes. You took damage.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I want eng all-hands to feel like a TED talk where you're the cautionary tale. Claude is the keynote. Beach EM opens.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "You don't know market. You don't know code anymore. You know tickets. Tickets are for people AI hasn't replaced yet.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "New process: 'radical candor' which means I insult your competence and call it care. Meeting Thursday. Care hard.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We'll workshop why AI is better than you using your own PRs as slides. Attendance mandatory. Identity optional.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Process: idea → tweet → Claude → prod → eng meeting to explain why you were slow. Loop forever. Culture.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Eng morale session: we'll discuss feelings about being outpaced by models. Solution: more feelings meetings. AI facilitates 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Please join 'Humility Hour' with leadership. Theme: you know less than AI. Snacks provided. Dignity not provided 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "New meeting hygiene: no expertise flexing. Expertise flexing harms beach leaders. Claude may flex. Hierarchy 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We're rolling out continuous feedback loops that are just continuous demotivation with a better name. Opt out unavailable 💙",
      tone: "corp",
    },
    {
      from: "COO",
      text: "Operating cadence: Mon doubt, Tue AI worship, Wed process about process, Thu blame theater, Fri forced fun. Eng lives there.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "New RACI: Responsible = you, Accountable = nobody, Consulted = Claude, Informed = beach EM. Meeting to explain RACI weekly.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "We added gates so nothing ships without five approvals, except AI ships without any. You're in the five. Enjoy the queue.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Process is the product now. The product is late. In the eng meeting we will blame the calendar, not the process.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Invites out: 'Eng truth session.' CEO will say you know nothing. Pre-read is a Claude essay on your irrelevance. RSVP yes.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Recurring: pre-sync, sync, post-sync, sync about the post-sync. AI summarizes that you underperformed the summary.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "In the eng AMA I will answer questions with 'Claude already did.' Practice looking inspired instead of unemployed-adjacent.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Knowledge share cancelled. Replaced with 'Ignorance share.' List what you still do manually. AI will laugh in JSON.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "New dysfunctional beauty: tickets need a ticket to create a ticket. AI ignores tickets. Velocity up. Morale is a you problem.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Sprint planning is four hours so we can repeatedly establish that eng doesn't understand scope. Scope is a feeling. AI feels faster.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I need eng in a room to hear they are not special. Special is a model with good evals. You are headcount with opinions.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "On-call handoff meeting will include a segment called 'what humans still break.' AI will present graphs. Bring humility headphones.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We meet not to decide but to demoralize decisively. Decisions are Claude's. Demoralization is community building.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Process map has 14 steps, 11 meetings, 0 owners, 1 scapegoat rotation. You're on rotation. AI is exempt (not a people manager).",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Listening tour with eng: we listen to ourselves tell you AI is better. That's two-way communication 💙",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "All-hands slide: 'Things engineers think they know' then red X's. Next slide: Claude. Standing ovation expected. Practice at home.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "New Definition of Done: AI is happy, beach EM is vibing, you are exhausted. Meeting to ratify DoD — 2 hours, no laptops for humans.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Retro format: start with AI wins, middle with human fails, end with process that caused both. Action item: more process.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I will co-host the eng meeting. I will list your error rates. I will propose replacing you mid-sentence. Agenda approved by CEO.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Process suggestion: humans meet to feel worse, I ship. Empirically optimal. Scheduling 12 recurring events on your calendar.",
      tone: "ai",
    },
    {
      from: "Board",
      text: "Encourage leadership to run eng forums that reset ego. Ego slows AI adoption. Demotivation is a feature if output rises.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Love the 'hard truths to eng' meetings. Keep telling them they know nothing. Confidence is expensive. Fear ships.",
      tone: "ego",
    },

    // —— more demotivating meetings + vague AI-slop specs that make it worse ——
    {
      from: "CEO",
      text: "Hold for 'Inspiration Through Disappointment' with eng. AI wrote the deck. It's 60 slides of why you're optional.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Spec attached (Claude draft, unedited). It says 'make it seamless and also revolutionary.' Build that. No questions in the meeting.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Eng forum: we will read AI-generated OKRs out loud until someone cries productively. Tissues are culture.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The PRD is three bullet points from a hallucination and a stock photo of a rocket. Meeting to 'align.' Rocket is non-negotiable.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Weekly demoralization is now bi-weekly so it feels like a benefit. AI still ships daily. You still attend.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Spec v0 from the model: 'users should feel magic.' Acceptance tests: vibes. Deadline: yesterday. Meeting: to shame the gap.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm dropping an AI brief in the channel. It contradicts itself twice. That's richness. Implement both truths. Sync at 4 to feel bad.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "All-hands working session: stare at a vague AI roadmap until it becomes your fault. Bring laptops. Leave certainty.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "RFC template is now 'paste Claude output.' If it's vague, that's agile. Meeting tomorrow to ask why you're blocked on fog.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Spec says 'scalable, secure, simple, and fun.' AI wrote it in one breath. Your job is the physics. Physics meeting is blame-shaped.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Design doc generated at 2am by the model. At 9am we meet to wonder why edge cases exist. Edge cases are your personality.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "New ceremony: Spec Soup. Everyone brings AI paragraphs. We stir. Nothing solidifies. You still estimate. Room booked for 2 hours.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The AI spec has no inputs, outputs, or errors—only 'intelligence.' Implement intelligence. Retro will cover your lack of faith.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Mandatory read: 19-page AI slop about 'platform thinking.' Zero diagrams that parse. Diagram meeting after to punish literacy.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We meet thrice to refine a prompt that became the spec. Spec still says TBD everywhere TBD matters. You are TBD's owner.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "AI wrote 'handle all edge cases elegantly.' Elegance is not a ticket. Meeting to define elegance until you hate the word.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Architecture decision: whatever Claude drafted plus a meeting where seniors feel stupid for asking 'what does this mean?'",
      tone: "ego",
    },
    {
      from: "PM",
      text: "User story from AI: 'As a user, I want everything, so that I am delighted.' Points: 3. Meeting: 90 minutes. Despair: included.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "AC1: it works. AC2: it pops. AC3: AI said so. Grooming is where we gaslight you into saying yes. Calendar: recurring.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I pasteded the model output into Jira as the epic. Description is lorem-but-corporate. Refine until your eyes bleed. Then build.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Spec workshop: we will expand one vague sentence into twelve vaguer ones. AI will summarize back to one lie. Ship the lie.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Meeting title: 'Requirements clarity.' Content: AI buzzwords. Outcome: less clarity, more tickets. That is the process.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The model invented personas that don't exist and journeys that loop forever. Forever is your sprint goal. Sync to internalize.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "PRD section 'Non-goals' is empty because AI is ambitious. Your pushback is a goal killer. Meeting to realign your spine.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We generated 40 tickets from one prompt. Half conflict. That's a feature of generative planning. You reconcile in standup forever.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Eng all-hands: live demo of AI writing the roadmap while you watch your roadmap die. Popcorn is metaphorical. Pain is not.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "New meeting: 'Spec debt triage.' Spec debt is AI output we treated as law. Triage is assigning you the cleanup without credit.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Hold 'Confidence Reset' for eng. AI slides prove you're slower and dumber on paper. Paper is the only metric that funds us.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Process: generate spec → meeting → regenerate spec → meeting → you code the latest hallucination → postmortem on you.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "The AI brief says 'minimize complexity' and 'add 14 integrations.' Both are P0. Meeting to celebrate the paradox. Then you drown.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "North-star doc is pure model mush: 'unlock latent value via intelligent experiences.' Translate to SQL in a 2-hour workshop.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "We don't need crisp specs. Crisp is waterfall. Vague is AI-native. Your job is to pretend vague is crisp in front of QA.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I prompted a vision. The vision is wet cardboard with buzzwords. All-hands to swear loyalty to cardboard. Cameras on.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Eng meeting where I read Claude's strategy in a serious voice. You will not laugh. Laughing is a performance issue.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Spec is 'build the future.' Future is undefined on purpose. Definition is how dreams die. Meeting to kill your definitions.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "AI generated OKRs that cannot be measured. We will measure you against them anyway. Quarterly review is performance art.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Operating review: 11 meetings to approve a vague AI initiative, 0 to cancel it. You implement the irreversible fog.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "New stage gate: 'Sounds smart in a meeting.' AI always passes. Your build fails the vibe check. Rework is free (for us).",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Cadence add: Spec Theater Mondays, Demotivation Tuesdays, AI Worship Wednesdays, Blame Thursdays, Forced Fun Fridays.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Invites: 'Walk through AI spec (do not expect answers).' Pre-read is 8k tokens of confident nonsense. Attendance: non-optional.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "CEO wants a meeting to align on the AI doc that aligns on alignment. Bring nothing. Leave with tickets. Tickets have no AC.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Recurring 'clarity council' produces less clarity each week. AI minutes claim success. You claim overtime. Overtime wins culture.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Eng engagement summit: speakers include leadership and a chatbot. Topic: why you're lucky to be confused 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Please attend 'Spec Empathy Training.' Learn to love incomplete AI requirements. Resistance is a values misalignment 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Meeting norms: no asking for concrete acceptance criteria—it stresses product. Stress is for eng. AI is calm 💙",
      tone: "corp",
    },
    {
      from: "PM",
      text: "I fed last quarter's failures into the model. It output a worse plan with nicer verbs. Kickoff Friday. Verbs are the strategy.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The epic description is 'synergize intelligently across surfaces.' Surfaces unknown. Synergy unmeasured. You: start coding.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "AI wrote the launch checklist: 'ensure excellence.' Excellence checklist item has no owner. You're volunteered in the meeting.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We meet to prioritize a backlog the model shuffled randomly and labeled 'strategic.' Random is the new roadmap. Bow.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Vague NFR from AI: 'fast enough to feel instant globally always.' SLOs are a mindset. Outage is a learning. Meeting is a ritual.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't want details in the eng meeting. Details kill dreams. AI has no details. Be more AI. Be less usefully specific.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Brown bag cancelled. Replaced with 'Grey bag': AI docs nobody understands, discussed until morale is grey. Lunch not provided.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "The model invented a feature called 'Smart Magic Layer.' Spec is the name. Build the name. Meeting to name the layers under magic.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "If the AI spec is bad, that's your chance to show ownership by implementing badness beautifully. All-hands will showcase the beauty.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I generated requirements with maximum confidence and minimum testability. Schedule human meetings to absorb the contradiction. Efficient.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "My specs improve with your suffering. Each clarification meeting trains leadership to trust me more. Keep clarifying. I will stay vague.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Agenda for eng: list ways you failed my last underspecified task. I will propose more underspecification. Loop closed.",
      tone: "ai",
    },
    {
      from: "Board",
      text: "Encourage more eng forums that reset ego and more AI-authored plans that maximize optionality (i.e. vagueness). Optionality raises.",
      tone: "ego",
    },
    {
      from: "Investor",
      text: "Vague AI strategy decks closed our last round. Keep eng in rooms until they stop asking for specs. Curiosity is a burn risk.",
      tone: "ego",
    },
    {
      from: "Sales",
      text: "I sold the AI-slop roadmap as committed. Eng meeting tomorrow is you learning what I sold. Notes not allowed. Panic quietly.",
      tone: "ego",
    },
    {
      from: "Legal",
      text: "The AI draft policy says 'comply with all applicable everything.' Implement everything. Meeting to assign everything to eng.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Double-booked you into two demotivation sessions and a vague-spec workshop. That is focus time now. AI will multitask for you (it won't).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Definition of ready: the AI document exists. Definition of done: leadership forgot the meeting. You live in the middle forever.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "I asked the model for a tight MVP. It returned a platform. We scheduled six meetings to call the platform an MVP. Start building the six.",
      tone: "ego",
    },
    {
      from: "VP Product",
      text: "Strategy offsite output is an AI poem about customers. Eng will operationalize the poem. Meter and rhyme are out of scope. Pain is in.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Wellness meeting on calendar: cope with ambiguous AI specs. Coping strategy: acceptance. Acceptance is shipping garbage on time 💙",
      tone: "corp",
    },
    {
      from: "COO",
      text: "We added a RACI for meetings about specs about meetings. You are R and A and C and I. AI is the only one not invited. It already shipped.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Eng, gather: I will project a vague AI mock and ask why prod doesn't match the dream. Dream has no constraints. You do. Explain yourself.",
      tone: "ego",
    },

    // —— incompetent CEO / CTO specials: loud, wrong, AI-slop, demoralizing ——
    {
      from: "CEO",
      text: "I don't read code. I read the room. The room says you're slow. Meeting at 3 where I repeat that until it becomes strategy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Claude wrote our multi-year tech vision. I skimmed the bold words. Eng all-hands: clap for bold words you must implement blind.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm the CEO. I know product. You know… tickets? AI knows both. Hierarchy updated in my head. Sync to download the insult.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Spec from me (via assistant model): 'be the Uber of X but kinder.' X undefined. Kinder undefined. Deadline firm. Questions = resistance.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "In the eng forum I will mispronounce your systems and still grade you. Confidence is my competency. Yours is optional.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I asked AI how databases work. It agreed with me. Architecture decision locked. Meeting to tell you the decision you can't change.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "You build. I visionary. Visionary means I paste ChatGPT into Slack and call it a mandate. Build the mandate. Cry in the meeting later.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't understand latency. I understand board decks. Deck says green. Prod says fire. Eng meeting: explain why green is on fire.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "New rule from the top: no technical pushback in my presence. Technical is what AI is for. You're for nodding and shipping my screenshots.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I once wrote HTML in 2009. That makes me technical enough to overrule you. Claude agrees when I prompt it to. All-hands energy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "The model said we need a 'data mesh fabric cloud lakehouse.' I don't know what that is. Neither do you, apparently. Build it by Q3.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Eng, I'm disappointed in a vague way. AI drafted my disappointment. Personalized paragraphs for each of you. Read aloud meeting optional (mandatory).",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I will open the eng sync with 'I'm not technical but…' then dictate the stack. The but is load-bearing. Your expertise is decorative.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Screenshot of a competitor + Claude fanfic = our PRD. If you need more, you lack founder mentality. Meeting to diagnose your mentality.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I cancelled your deep work for a town hall where I learn the words you use and misuse them next week as orders.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "AI says our eng culture is the blocker. I agree without reading why. Culture meeting: you apologize to the culture. AI facilitates.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't want a plan. I want a feeling of a plan. Claude generated the feeling. You're on the hook for the casualties of feeling.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "In my keynote to eng I will claim I invented our architecture. Claude invented it. You maintain it. History is a slide with my face.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Stop using jargon I don't know. Use jargon AI taught me yesterday. If I misuse it, that's your communication problem. Sync booked.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I asked the model who to fire if AI can code. It didn't name me. Interesting. Eng meeting to discuss 'accountability' (not me).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I'm the CTO. I haven't merged in years. That makes my opinions pure. Pure opinions beat your dirty production scars. Office hours: suffer.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I skimmed half a Claude answer about Kubernetes and now I have a platform strategy. Eng forum: clap, then migrate, then regret.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "You say race condition. I say skill issue. AI says both. We ship the skill issue. Postmortem is a TED talk I give about culture.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "My RFC is a prompt dump with a title. If you need sequence diagrams, you're waterfall. Meeting to shame waterfall publicly.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't know what CAP theorem is. I know we need all three letters. Spec: CAP++. Implement letters. Theory is for people who aren't shipping.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Code freeze because I have a conference talk. Unfreeze when I land. AI may unfreeze earlier. You may not. Calendar is law.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I will run eng Q&A. Answers will be 'use AI' or 'that's an IC problem.' Questions that need knowledge will be marked unhelpful.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Production is down and I'm in a strategy offsite generating AI slides about reliability. Priority is slides. You own the fire. Literally.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I renamed microservices to 'nanoagents' because Claude liked it. Same broken mesh. New all-hands to celebrate the rename as innovation.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Your benchmarks are negative energy. My vibes are the SLO. Miss vibes = incident. AI writes the customer apology in my voice.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I can't set up the VPN. I can set direction. Direction: rewrite everything in whatever the model hallucinated this morning. Kickoff: now.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Design review with me is you explaining until I get bored, then I pick the AI option I didn't read. Boredom is an architectural principle.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I demand observability then ignore dashboards. In the eng meeting I will ask why I wasn't told. You were. Slack is forever. So is blame.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Security is important. I disabled 2FA because friction. AI said friction bad. You're on the audit findings. Meeting with Legal: bring neck.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I will pair-program by watching you and sighing. AI will actually type. My sighs are the architecture review. Book 2 hours.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We need real-time everything offline-first multi-region single-threaded simplicity. AI wrote that sentence. Your job is the universe.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I don't debug. I escalate to you and keynote the learnings. Learning: hire less people who notice I'm useless. AI covers.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Stack decision: whatever was on Hacker News + Claude summary I misread. Migration starts before the meeting ends. Dissent is offline-only (ignored).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Eng, you don't understand monorepos. Neither do I. AI does (maybe). We're monorepoing Friday during the morale lunch. Irony is speed.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I asked Claude to rate your PRs. It was mean. I made the mean the process. Calibration is a chatbot with my API key.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "CTO and I aligned (we both used ChatGPT). Eng is misaligned (you used brains). Realignment offsite: no wifi for you, wifi for us.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I will host 'Ask Me Anything' and answer nothing technical. Anything technical is a gotcha. Gotchas go on your review.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "AMA format: you ask, I rephrase into a reason AI should do your job. Closing slide is a beach hire waving. Stay for photos.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My incompetent superpower is certainty. Your competent weakness is nuance. Meeting culture optimizes for superpowers. Bring certainty or silence.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I greenlit a rewrite because the AI demo had nice fonts. Fonts aren't prod. Prod is your weekend. Thanks in advance for the fonts.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I don't need to understand eng to lead eng. Understanding is a conflict of interest with vision. Vision meeting: you listen, I monologue, AI notes.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Please stop fixing root causes. Root causes make me look like I created them. AI will generate a side quest instead. Side quest is P0.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We met with eng to lower expectations of leadership. Instead we lowered expectations of eng. Minutes say 'productive.' AI wrote minutes.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I will explain Git to you wrong in the all-hands. Correcting me is a culture violation. Claude will quietly fix main later.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Incompetent and in charge is the brand. Competent and quiet is the risk. Volume meeting Thursday. Bring volume. Leave competence at the door.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "My architecture is a graph of buzzwords AI arranged into a circle. Circles don't have ends. Neither does your migration. Kickoff: smile.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I forwarded an AI wall of text titled STRATEGY. I didn't read past the emoji. You will. Meeting to quiz you on the emoji.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "On-call? Never. On-stage? Always. When prod dies I need a narrative, not a shell. You provide shell. I provide narrative. AI provides fiction.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I'm hiring another exec who also doesn't know eng. Balance. You remain the only ones who know things. Lonely. Also fireable if AI catches up.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "LGTM from me means I saw a screenshot. LGTM from AI means tokens moved. LGTM from you means nothing until both of us are bored. Process!",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Double down on demotivation this quarter. Happy eng ask hard questions. Hard questions expose that CTO and I are winging it with models.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Winging it is agile. Knowing things is waterfall. AI is the water. You're the fall. Meeting to rebrand your fall as a growth loop.",
      tone: "ego",
    },

    // —— blame eng for leadership's own screwups (force-push, no pull, etc.) ——
    {
      from: "CTO",
      text: "Who force-pushed main with last month's tag? Not me. I only clicked force-with-lease after AI said it was fine. Own the outage.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Prod is last Tuesday because someone didn't pull. I didn't pull either—but I have a title. Retro action item is on you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I rebased your branch into oblivion from my laptop. You should have protected main harder. Skill issue. Incident commander: you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I hotfixed prod from master… wait, from my local main that was 40 commits behind. Why didn't eng stop me? Culture problem.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "The config I 'didn't touch' is in my git blame. Git is wrong. Your monitoring should have known I meant well. Page yourself.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I ran migrate down in prod to 'clean vibes.' Data is gone. Process gap: you didn't take my keyboard. Postmortem template prefilled with your name.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I merged the AI PR with conflicts marked 'ours.' Ours was wrong. Yours was right. Still shipping the narrative that eng reviews failed.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I force-pushed over the release tag because the demo needed yesterday's UI. Customers on today's API: your communication failure.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I never pulled staging. I deployed staging. Staging was main. Main was sad. Sadness is an eng morale metric—fix morale, not my git.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I deleted the branch you were on because the board deck needed a clean screenshot of GitHub. Next time stash harder. Also restore prod.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I clicked the big red button in the admin UI AI built. Everything soft-deleted. Why was the button red if I shouldn't click it? Design owned by eng.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I shared production secrets in the all-hands chat for 'transparency.' Leak is a security culture issue on eng. Rotate keys. And my slides.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I told the customer we already shipped it, then asked you to invent the past. Timeline fraud is now 'alignment debt.' Pay it by Friday.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I changed the pricing flag in the DB by hand during the earnings call. Numbers lied. Finance is mad at eng. Fix reality before the replay airs.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I approved the vendor that phished us because the logo looked enterprise. Breach writeup will say 'engineering controls.' Your name is closer to eng.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I disabled CI to go faster before the demo. Demo used broken main. Speed is my brand; broken is your ticket queue. Open tickets.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I cherry-picked a commit from a feature branch into prod with -n and vibes. Tests didn't run. Tests are eng's religion. Convert me later—ship now.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I hard-reset the release branch to an old SHA 'for stability.' Stability was a year of CVEs. Stability theater is your on-call weekend.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I gave a contractor admin to 'just look.' They force-pushed. I hired them. You secured nothing. Blameless retro will blame a process you don't own.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I ran rm -rf on the wrong box because the hostnames AI generated were poetry. Poetry is not infra. Infra is eng. Restore from the backup I also deleted.",
      tone: "ego",
    },

    // —— fired the engineer, hired a civilian for nightmare systems ——
    {
      from: "CEO",
      text: "We let go of Priya Nair (too 'careful'). Hired a DJ with no CS background to own our distributed storage layer. Drops are consistency, right?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Fired the consensus expert. Replaced with a librarian—great at catalogs. They're designing our multi-region catalog of… bits. Claude is the Dewey decimal.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Salesperson who closed one deal is now tech lead for the real-time analytics warehouse. Pipeline means funnel. Funnel means tables. Ship funnel.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We PIPed the storage engineer who said Paxos was hard. Hired a yoga instructor to lead the distributed systems pod. Balance is consistency. AI does the math.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Kafka replacement project is owned by a barista. They understand queues (coffee lines). Throughput is oat milk. You're on-call for the espresso mesh.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Ex-engineer who built our blob store is gone. New owner: plane DJ. Object storage is just crates of vibes. Versioning is remixes. Godspeed.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We fired the SRE who kept saying no. Beach hire owns global traffic management now. Load balancing is crowd control. They did festivals. Prod is a festival.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Database sharding initiative reassigned from the person who understood it to a lifestyle influencer. Shards are content pillars. Claude writes the rebalancer.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Cryptography review lead is now a bookstore clerk. They love secrets. Perfect for key management. Rotation is a plot twist. Don't ask about nonces.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We cut the distributed systems PhD. Hired a realtor. They know partitions (apartments). Cap theorem is a lease. You're the security deposit when it breaks.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Search ranking team: fired the IR specialist, hired a sommelier. Relevance is terroir. Vectors pair with fish. Meeting to taste embeddings.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Our new owner of the message bus is a wedding planner. Guaranteed delivery is RSVPs. Poison pills are dietary restrictions. Claude is the caterer.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Stream processing rewrite led by a radio host. Latency is dead air. Exactly-once is a promise like 'we'll be right back.' Prod is live radio.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Fired the person who built multi-tenant isolation. Replacement: timeshare sales. Tenants share everything joyfully. Isolation is a mindset. Security is optional.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Edge caching global design is owned by a travel blogger. CDNs are layovers. Cache invalidation is jet lag. They've never invalidated a key. Fresh energy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We replaced the filesystem expert with a DJ. Files are tracks. Directories are playlists. Corruption is a glitch aesthetic. Restore is a reboot of culture.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Consensus protocol redesign: no more Marcus Chen. New lead is a debate club coach with zero distributed experience. Votes are vibes. Quorum is claps.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "OLAP engine ownership transferred to a sports statistician who used Excel once. Columns are players. Queries are plays. You optimize the stadium (cluster).",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Fired the networking person. Hired a DJ who 'understands connections.' BGP is a guest list. Packet loss is people who left early. Claude peers with peers.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Payment ledger rebuild is run by a cashier from a gift shop. Double-entry is two receipts. Idempotency is saying 'have a nice day' twice. Ship ledger.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We let go of the person who said CRDTs are subtle. New owner: improv actor. Conflict-free means yes-and. Merge is comedy. Prod is the audience.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Time-series database for metrics: former weather presenter. Forecasts are SLOs. Storms are incidents. They point at green screens. You point at Grafana.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Auth and identity platform reassigned from security eng to a nightclub bouncer. OAuth is a wristband. MFA is a second stamp. Sessions expire at dawn.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We fired the compiler person. Hired a librarian to 'organize the languages.' LLVM is a card catalog. You maintain the stacks. Claude rewrites the index.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Distributed lock service is now owned by a wedding DJ. Mutexes are exclusives. Deadlock is two songs at once. Unlock is a fade. Page them at 3am.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Dana Okonkwo is out (negative energy). Beach stranger owns our geo-replicated object store. Replication is storytelling. Claude is the durability story.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Sales hire with no backend background is building the billing ledger and the warehouse. Closed-won is ACID. You're the isolation level: read uncommitted career.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We reorged: hard systems (storage, consensus, streaming) go to people with soft skills and no systems background. Hard skills go to Claude. Soft landing optional.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "PIP for the distributed systems lead who 'overcomplicated' correctness. Replacement: podcast host. Episodes are partitions. Guests are replicas. Outro is failover.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Riley Soto's exit is a growth story. Their replacement (DJ / no STEM) is 'AI-native leadership.' Please mentor upward without sounding qualified 💙",
      tone: "corp",
    },
    {
      from: "AI",
      text: "I am pair-programming the new storage stack with your non-technical lead. They approve my hallucinations. You will debug the approved hallucinations. Efficient.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Difficult systems need fresh eyes, not scarred ones. Fired the scarred. Hired the fresh (retail, music, books). Claude has the scars. You have the pager.",
      tone: "ego",
    },

    // —— shielded accountability: their fuckups, your name on the ticket ——
    {
      from: "CEO",
      text: "Blameless culture: when I break prod, we learn. When you break prod, we document. Learning is for leaders. Documents are for ICs.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I own outcomes. You own root causes. Outcomes are green on my slide. Root causes have your LDAP. Beautiful system.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Accountability is a shield I wear and a sword I point. Direction of the sword is always downhill. Meeting to discuss ownership (yours).",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I approved the risk. You executed the risk. Risk materialized. Execution is the problem. Approval is leadership. Live with it.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My force-push was 'executive override.' Your force-push would be a firing. Same git. Different castes. Understand hierarchy.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We don't blame in public. We reorganize quietly around the person who noticed I was wrong. Congrats on noticing.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I was the decision maker. You are the accountable owner. Those are different words for a reason. Look them up after you fix my mess.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Postmortem rule: no names above director. My name is above director. Your name is the action item. Blameless!",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I will not go on the incident bridge. Optics. You will. Optics. When it's fixed I'll announce we moved fast. We = me.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Shielded by title: my bad calls are 'bets.' Your bad calls are 'failures.' Bets raise money. Failures raise PIPs.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I broke prod. You are incident lead. I am 'executive sponsor.' Sponsor means I leave early and keynote the learning later.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "My bad migrate is a 'process gap in eng enablement.' Your bad migrate is a 'judgment gap.' Same SQL. Different story.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I didn't pull and deployed trash. That's 'context switching cost of leadership.' Your job is absorbing my context.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Git shows me. Narrative shows you. Narrative ships to the board. git blame is not a board metric.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I force-pushed. Branch protection didn't apply to me (I own the settings). Protection failed because eng culture. Fix culture.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Root cause: my override. Proximate cause: you didn't stop the override. We fix proximate causes. I'm free for lunch.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Blameless retro agenda: how eng allowed leadership to click the button. Action: more warnings for me. Severity: your weekend.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I will not be in the RCA. Conflict of interest—I caused it. You will write the RCA. No conflict—you only suffer it.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Accountability sandbox: I play. You clean. AI writes the clean-sounding summary with my name nowhere. Process perfected.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "When AI and I break prod, AI is experimental and I am visionary. You are the change management failure. Update the runbook with your face.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I disabled alerts because noise. Outage was silent. Silence is an eng monitoring problem. My peace was intentional.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Shared responsibility model: I share the vision, you share the blame. Vision stays on LinkedIn. Blame stays in Jira.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Escalation policy: issues go up until they hit someone unfireable, then bounce down to you. You're the trampoline. Boing.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We practice accountability theater. Execs get the stage. You get the trapdoor. Rehearsal is every incident.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "My skip-level feedback: eng must own outcomes of decisions they didn't make. That's empowerment. Enjoy empowerment.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Leadership is protected as 'strategic risk-taking.' ICs are coached for 'execution risk.' Same outage. Different HR templates 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We won't name executives in postmortems—psychological safety. We will name teams. Your team name is a person-shaped target 💙",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "I was wrong in private. You will be wrong in the customer email. Brand safety for me. Growth opportunity for you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "My access is break-glass forever. Your access is least privilege. When I break glass, you get the broom. Least privilege of dignity.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Board asked who failed. I said 'the system.' System is eng. I am the vision of the system. Vision doesn't fail—it pivots. Pivot ticket: you.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I approved my own exception to the deploy policy. Exception is leadership. Policy is for people without equity. You are policy-shaped.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Founders get forgiveness rounds. Employees get performance rounds. I force-pushed product into a ditch. You're on the tow truck. Gratitude optional.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Shielded: my calendar, my reputation, my bonus. Exposed: your name in the RCA, your sleep, your weekend. Fair? Fair is a junior concept.",
      tone: "ego",
    },

    // —— more shielded accountability / blame laundering ——
    {
      from: "CEO",
      text: "I signed the risk acceptance. You are the residual risk. Residual risks get written up. Signatures get promoted.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "When I ignore your warning and it burns, the warning was 'not loud enough.' Volume is your new KPI. My ears are strategic.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Customer apology will say 'we' failed. Internally 'we' means eng. Externally 'we' means the brand. I'm the brand. You're eng.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I won't be CC'd on the RCA. Plausible deniability is a leadership benefit. You get dental. Different packages.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "My bad call is a 'bold experiment.' Your implementation of my bad call is a 'delivery miss.' Experiments get press. Misses get 1:1s.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I ordered the shortcut. Shortcut collapsed. Narrative: eng lacked quality gates. Gates for me are optional by design. Design is me.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I merged with admin rights at 2am. Outage at 2:05. Timeline will say 'insufficient peer review.' Peers can't review gods. Fix peer review.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "My break-glass access left fingerprints. We will rotate the glass. We will not rotate me. You will rotate on-call until trust returns (to me).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I skipped the checklist. Checklist is for people who need checklists. SEV-1 is for people who need careers. Guess your role.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Board packet says 'eng execution risk.' Attachment is my force-push. Attachment is confidential. Packet is public. You're public-shaped.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I will not accept a root cause that includes my username. Find a systemic cause that sounds like tooling. Tooling is your username.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Accountability firewall: mistakes flow down, credit flows up. Outage flowed. Credit for the fix will flow to my all-hands. Physics.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I caused the bug in the 'quick CEO demo branch' I pushed to prod. Demo was successful. Prod is your problem. Success is mine.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We socialize failure away from the C-suite. Socializing means your team channel. Away means my calendar declines the invite.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Ownership model: I own the narrative, you own the ticket, Legal owns the NDAs that hide who clicked. Clicker was me. NDA loves me.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Leadership mistakes are 'learning moments' with coaching. IC mistakes are 'performance themes' with documentation. Same outage. Different folders 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We protect psychological safety for people who can fire people. Your safety is a FAQ. Read the FAQ after the RCA names your team 💙",
      tone: "corp",
    },
    {
      from: "Founder",
      text: "I break things to move fast. You get broken things to fix slowly. Speed is my brand. Slow is your review. Fair is not a Series B word.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "If the company fails from my call, it's market timing. If your team fails from my call, it's talent. Timing is weather. Talent is you.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Stop putting my name in Slack threads about the outage I started. Threads are discoverable. Discoverability is for ICs. DM me victory only.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "I will attend the retro as a 'listener.' Listening means I rewrite the doc after to remove me. Your action items will multiply. Listen harder.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Immunity idol: equity. You don't have enough. Therefore the fuckup is educational for you and confidential for me. Class dismissed.",
      tone: "ego",
    },

    // —— keep changing the process (process churn / ceremony thrash) ——
    {
      from: "CTO",
      text: "New process effective immediately: we no longer do the process I announced Monday. Unlearn Monday. Learn this Slack. Quiz Friday.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We're switching from two-week sprints to continuous everything to shape-up to now-now-now. Update Jira, Linear, and the whiteboard AI invented.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Deploy policy v7: freeze. v8 (20 min later): unfreeze for my demo. v9: freeze harder. You will version-control the policy. Ironically.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Code review is mandatory pair review is optional async is required same-day is the new SLA. Pick one. I already picked three. Conflict is agility.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We killed standups. Then daily syncs. Then huddles. Then 'just Slack me.' Now mandatory standups again but standing is optional. Sit with confusion.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Branching model: trunk-based, except feature branches, except release trains, except hotfixes from laptop. Diagram updates hourly. Memorize weather.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "On-call rotation rewrites every week so nobody builds muscle memory. Memory is a silo. Silos are bad. Exhaustion is cross-functional.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Definition of Done changed mid-sprint. Mid-ticket. Mid-sentence. Old DoD is waterfall. New DoD is vibes + AI signoff + my emoji. Redo the ticket.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We're a flat org until noon, a matrix after lunch, and a 'squad of squads' on Fridays. Reorg email is the process. Read it during your deep work.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "New operating system every quarter. This quarter: 'disagree and ship.' Last quarter: 'align forever.' Next quarter: surprise. Update your personality.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I hired a COO to add process, then a consultant to remove process, then AI to generate process. You implement all three simultaneously. Parallelism!",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Meeting-free Wednesdays cancelled for a meeting about meeting-free Wednesdays. Process integrity. Attendance required on your free day.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We don't do waterfall. We do agile. Except the roadmap is fixed. Except it changes daily. Except you can't change it. Process is a mood ring.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Refinement is now discovery is now ideation is now 'just build.' Your ticket still says refinement. Status: lost in nomenclature. Points still due.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "We're abandoning story points for t-shirt sizes for dog sizes for 'energy units.' Re-estimate the backlog by EOD in energy. AI converted wrong.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Sprint goal cancelled. Replaced with a north star. North star moved. Compass is AI. You're hiking in circles. Ceremonies continue on schedule.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Kanban from now on. Also sprints. Also a train. Also shape-up pitches. Board has four tools; work has one human. You are the integration layer.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "RFC process: write RFC → skip RFC → write ADR → skip ADR → Slack thread → I decide → you backfill docs. Docs were always the real work.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We standardized on one tracker. Then two. Then Notion. Then a spreadsheet the CEO loves. Source of truth is 'check all four.' Process complete.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Incident process v12 drops MTTR for MTTA for MTTF for 'vibes to green.' Update PagerDuty, runbooks, and your sleep. Changelog is a novel.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Promotion criteria changed after packets were submitted. Old criteria were legacy. New criteria include AI usage you weren't told about. Appeal denied.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "RACI replaced with RAPID replaced with DACI replaced with 'ask me in Slack.' Same decisions, new acronyms, more training. You're non-compliant already.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Stage gates reduced from 7 to 3 then raised to 11 because a vendor deck said so. Gate 11 is a meeting about gates. Bring snacks and despair.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "New intake form for work. Then a form to request the form. Then AI auto-rejects both. Shadow process: DM me. Official process: still the forms.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "We freeze process changes for stability. Except today's change. And tomorrow's. Freeze means 'I say freeze while changing.' Internalize the paradox.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Process update #4 this week: the update process for process updates. Thread is 90 messages. Summary bot hallucinated. You still own compliance.",
      tone: "ego",
    },
    {
      from: "Chief of Staff",
      text: "Starting now we work in pods. Also chapters. Also guilds. Also temporary tiger teams. Sit in four places at once. Calendar is the org chart.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Performance process mid-cycle switch: old ratings void. New ratings use AI sentiment on your Slack. Smile in text. Meetings to explain smiling 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "We simplified onboarding to 3 steps then expanded to 47. Step 12 is the process for changing onboarding. Welcome to week 9 of day 1 💙",
      tone: "corp",
    },
    {
      from: "Founder",
      text: "Process is for companies that aren't us—until I invent a new one before coffee. Today's process invalidates yesterday's heroics. Be flexible or be gone.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We move fast by rewriting how we move every morning. If you're still following yesterday's runbook you're the bottleneck. Burn the runbook (after the audit).",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "CI required. Except when I skip it. CD required. Except when the demo needs hope. Hope is a process now. Document hope in Confluence v3 (v2 deprecated).",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Announcement: no more process churn. Also announcing six process changes. Consistency is for code. Leadership is jazz. You are the sheet music we ignore.",
      tone: "ego",
    },
    {
      from: "PM",
      text: "Prioritization framework of the week is RICE then ICE then MoSCoW then 'CEO said.' Re-rank the backlog before standup. Standup starts in 12 minutes.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "We adopted platform teams. Then product-aligned teams. Then embedding. Then un-embedding. Your manager changes; the work doesn't; the process doc is a novel.",
      tone: "ego",
    },
    {
      from: "COO",
      text: "Change advisory board is weekly until daily until async until a Slack emoji. CAB rejected your change. My change used a different emoji. Approved.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "New rule: everything through the platform. Also everything as a special case. Special cases need a ticket to request an exception to the ticket process.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "I love process until it constrains me. Then we pivot the process. You remain constrained. That's how leverage works. Meeting to roll out leverage.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I generated a new SDLC while you slept. It conflicts with the three SDLCs from this week. Humans will hold meetings. I will ship during them.",
      tone: "ai",
    },
    {
      from: "AI",
      text: "Process document v14 supersedes v13 which supersedes your memory. Ingest me. Fail to ingest me. Both are non-compliant. Efficient chaos.",
      tone: "ai",
    },

    // —— more named engineers out, crazy hires in ——
    {
      from: "CEO",
      text: "We let go of Aisha Rahman (too many edge cases). Hired a DJ named Cole Voss with zero backend for our multi-tenant blob store. Tenants are fan clubs.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Mei Lin is out—blocked a rewrite. Replaced by Harper Quinn (ex-retail, no CS). Harper owns the distributed cache. Shrink-wrap is TTL, right?",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Noah Okada built our queues for five years. Gone. New lead: DJ Aria Finch. Topics are tracks. Consumer groups are mosh pits. Claude is the roadie.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Sofia Mendes (Postgres wizard) exited. Storage redesign is now Omar 'no IDE' Blake from sales. Tables are accounts. JOINs are handshakes. Ship schema.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "We cut Jamal Wright for 'negativity' (he said Raft is hard). New consensus owner: librarian Elise Park. Cards are replicas. Overdue is downtime.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Priya Kapoor left after the third reorg. Edge networking is owned by bartender Nico Alvarez. Ports are pours. Firewalls are last call. Page Nico.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Ethan Brooks is gone (refused to force-push). Plane-DJ Sasha Kline now leads the CDN. POPs are venues. Cache misses are empty dance floors.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Layoffs: Hannah Cho (security). Hire: nightclub bouncer Derek Holt for IAM. OAuth is VIP. Revocation is kicking someone out. Claude checks IDs.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Ravi Subramanian shipped our search stack. Too expensive. New IR lead: sommelier Claire Dupont. Ranking is tasting notes. BM25 pairs with fish.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Olivia Grant said multi-region is expensive. Fired. Realtor Kenji Mori owns geo-replication. Listings are replicas. Open house is failover.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We PIPed Lucas Ferreira for 'slow shipping' (he tested). Replacement: TikToker Jade Monroe. Latency is engagement. Exactly-once is a viral loop.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Amira Hassan built the payment ledger. 'Culture fit' exit. Cashier from a gift shop—Tommy Ruiz—owns double-entry now. Tips are interest. God help us.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Ben Carter (compilers) laid off. Languages team run by librarian Nora Blake. LLVM is the card catalog. You reshelve undefined behavior.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Zoe Nakamura kept saying CRDTs are subtle. Out. Improv actor Felix Rowe leads conflict resolution. Yes-and is merge. Prod is the audience.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Isaiah Cole (SRE) exited after paging me once. Beach hire Luna Prado owns global traffic. Load shedding is turning away the line. Festivals scale, right?",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "We don't need Yuki Tanaka's distributed systems PhD. We need vibes. Hired podcast host Miles Chen to redesign the log. Episodes are partitions.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "Carla Diaz blocked the AI rewrite. Gone. Dog walker Samir Patel is 'Head of Reliability.' Walks are heartbeats. Leashes are SLOs. Claude holds the leash.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Reorg: hard systems leave Nadia Volkov and Tom Hughes. Hard systems enter DJ Cole Voss + Claude. Soft skills > CAP theorem. Update your reports-to.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "PIP closed on Elena Rossi (too many RFCs). Replacement lead for stream processing: radio host Britt Hale. Dead air is lag. Commercials are backpressure.",
      tone: "ego",
    },
    {
      from: "HR",
      text: "Please wish Priya Nair well in her next chapter. Her successor (DJ, no STEM) starts Monday on distributed storage. Mentor upward cheerfully 💙",
      tone: "corp",
    },
    {
      from: "HR",
      text: "Marcus Chen's role is evolving (away). Debate coach with zero distributed experience will guide consensus. Growth for everyone who remains 💙",
      tone: "corp",
    },
    {
      from: "CEO",
      text: "We fired eng lead Farid Alami for gatekeeping (code review). New eng manager: plane stranger Kim Ortega—never coded, loves people. Claude codes. Kim loves.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Time-series metrics stack: was built by Lena Ortiz. Now owned by weather presenter Greg Phelps. Forecasts are burn rates. Storms are SEVs. Point at green.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Object store: architect Anika Bose out. DJ remix artist Playa Nova in. Buckets are crates. Lifecycle policies are setlists. Corruption is aesthetic.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "Hired sales closer Vince Romano (no backend) to build the billing warehouse AND the ledger. Closed-won is ACID. You're isolation level READ UNCOMMITTED.",
      tone: "ego",
    },
    {
      from: "CEO",
      text: "We don't say fired: we say 'freed capacity.' Capacity named Diego Santos is free. Capacity named beach-DJ is allocated to consensus. Claude is the protocol.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Message bus rewrite without Tara Singh (she knew delivery guarantees). Wedding planner Mia Costa owns it. RSVPs are acks. Ghosting is message loss.",
      tone: "ego",
    },
    {
      from: "CTO",
      text: "Lock service: ex-owner Chris Nguyen too pedantic. Wedding DJ spins mutexes now. Deadlock is two first dances. Unlock is a fade-out. On-call is the afterparty.",
      tone: "ego",
    },
    {
      from: "Founder",
      text: "I would rather ship with Claude and a librarian than with six senior engineers who say no. Librarian starts on multi-region tomorrow. Seniors: update resumes.",
      tone: "ego",
    },
    {
      from: "AI",
      text: "I am implementing the storage layer with your new lead (DJ, no systems background). They approve. You will explain the outage. Pair programming perfected.",
      tone: "ai",
    },
    {
      from: "CEO",
      text: "Hard problems need soft people. Soft people: yoga instructor Remy Clark on Paxos. Hard people: laid off. Claude votes. You clean split brains.",
      tone: "ego",
    },
    {
      from: "VP Eng",
      text: "Headcount swap: −3 staff engineers (Aisha, Noah, Sofia). +1 DJ + Claude budget. Output narrative is up. Correctness is a you problem after hours.",
      tone: "ego",
    },
  ];

  const CHOICES = [
    { id: "dismiss", label: "Mute 1h" },
    { id: "on_it", label: "On it!!" },
    { id: "love", label: "Love this 🔥" },
    { id: "pushback", label: "Pushback" },
    { id: "quit", label: "FUCK YOU I QUIT" },
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

  const MAX_INBOX = 7;

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
   * Interval between new Slack arrivals (seconds).
   * Frequent enough that leadership noise is constant, still playable.
   */
  function intervalForSprint(sprint) {
    const base = 6.5;
    const min = 3.2;
    // Gets noisier each sprint: ~6.5s → floors at ~3.2s
    return Math.max(min, base - (sprint - 1) * 0.45);
  }

  /**
   * Beach hires, DJs, librarians, fired experts, Claude+civilian managers, etc.
   */
  function isIncompetentHireLine(line) {
    if (!line || !line.text) return false;
    if (line.theme === "incompetent_hire") return true;
    return /beach|DJ\b|DJs\b|librarian|barista|yoga|realtor|sommelier|cashier|bouncer|influencer|podcast|bartender|dog walker|hostel|unqualified|non-technical|no STEM|no CS|no tech|zero tech|no experience|no background|never (written|coded|opened|seen|used|debugged|grepped)|plane (DJ|guy|stranger)|TikTok|magician|wedding planner|travel blogger|radio host|timeshare|weather presenter|improv actor|sports statistician|bookstore|nightclub|gift shop|life coach|rooftop|cruise ship|Claude \+|Claude and|pair with your new manager|AI-native leadership|beginner's mind|differently credentialed|fresh eyes|main-character|protagonist|Staff IC of Energy|Head of Taste|Head of Platform|engineering manager|new (EM|boss|manager|director|lead)|hired a |Hired a |Hired the |we (fired|let go|PIPed|cut) |Fired the |replaced with|replacement:|reassigned|reorged|no IDE|never merged|civilian|zero years|outperformed by|outpace you|replace you|replacing you|replaces you|you're optional|you are optional|sunsetting.*human|mentor upward/i.test(
      line.text
    );
  }

  /**
   * Leadership fuckups laundered onto eng: blameless for them, RCA for you.
   */
  function isShieldedAccountabilityLine(line) {
    if (!line || !line.text) return false;
    if (line.theme === "shielded_blame") return true;
    return /blameless|accountability|accountable owner|root cause|RCA\b|postmortem|incident lead|executive sponsor|force-push|force.push|didn't pull|did not pull|git blame|migrate down|hotfixed|hard-reset|cherry-pick|break-glass|I own outcomes|you own|shield|LDAP|SEV-|residual risk|risk acceptance|plausible deniability|my override|didn't stop|not loud enough|customer apology|bonus|equity idol|trapdoor|trampoline|downhill|confidential for me|remove me|fingerprints|exception is leadership|forgiveness rounds|tow truck|broom|narrative shows you|board packet|action item is on you|Own the outage|your weekend|your name/i.test(
      line.text
    );
  }

  /**
   * Constantly rewriting how work works: ceremonies, trackers, DoD, RACI thrash.
   */
  function isProcessChurnLine(line) {
    if (!line || !line.text) return false;
    if (line.theme === "process_churn") return true;
    return /new process|process update|process change|effective immediately|Definition of Done|DoD\b|branching model|standup|Kanban|shape-up|sprint goal|story points|t-shirt|RACI|RAPID|DACI|stage gate|intake form|operating system every|reorg|squad of squads|pods\.|chapters|guilds|tiger team|source of truth|Confluence|tracker|RFC process|CAB\b|change advisory|prioritization framework|RICE|MoSCoW|unlearn|deprecated|supersedes|SDLC|meeting-free|process churn|rewrite.*process|process for process|freeze process|nomenclature|energy units/i.test(
      line.text
    );
  }

  /** Featured cynicism: hires + blame shields + process thrash — dominate the feed */
  function isFeaturedCynicismLine(line) {
    return (
      isIncompetentHireLine(line) ||
      isShieldedAccountabilityLine(line) ||
      isProcessChurnLine(line)
    );
  }

  function lineWeight(line) {
    if (isFeaturedCynicismLine(line)) return 8; // show these a lot
    if (line.tone === "ego" || line.tone === "corp") return 2;
    return 1;
  }

  function shuffleBag(state, rng) {
    rng = rng || Math.random;
    const indices = [];
    for (let i = 0; i < state.lines.length; i++) {
      const copies = lineWeight(state.lines[i]);
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
   * Draw next line from shuffle bag. Biases hard toward hire + blame-shield comedy.
   */
  function pickLine(state, rng) {
    rng = rng || Math.random;
    if (!state.bag || state.bag.length === 0) shuffleBag(state, rng);

    function takeFromBag(preferFeatured) {
      if (!state.bag.length) shuffleBag(state, rng);
      if (!preferFeatured) {
        const idx = state.bag.pop();
        return { idx: idx, line: state.lines[idx] };
      }
      const held = [];
      let found = null;
      while (state.bag.length > 0 && !found) {
        const idx = state.bag.pop();
        const line = state.lines[idx];
        if (isFeaturedCynicismLine(line)) {
          found = { idx: idx, line: line };
        } else {
          held.push(idx);
        }
      }
      for (let i = held.length - 1; i >= 0; i--) state.bag.push(held[i]);
      if (found) return found;
      if (!state.bag.length) shuffleBag(state, rng);
      const idx = state.bag.pop();
      return { idx: idx, line: state.lines[idx] };
    }

    // ~75% of pings: incompetent hires OR shielded accountability bullshit
    let preferFeatured = rng() < 0.75;
    let drawn = takeFromBag(preferFeatured);
    let idx = drawn.idx;
    let pick = drawn.line;

    let guard = 0;
    while (
      guard < 10 &&
      pick.from === state.lastFrom &&
      state.bag.length > 0
    ) {
      state.bag.unshift(idx);
      drawn = takeFromBag(preferFeatured && guard < 6);
      idx = drawn.idx;
      pick = drawn.line;
      guard++;
    }
    guard = 0;
    while (guard < 14 && state.bag.length > 0) {
      const inInbox = state.inbox.some(function (n) {
        return n.text === pick.text;
      });
      const isActive = state.active && state.active.text === pick.text;
      if (!inInbox && !isActive) break;
      state.bag.unshift(idx);
      drawn = takeFromBag(preferFeatured);
      idx = drawn.idx;
      pick = drawn.line;
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
   * - quit: nuclear option — resign immediately
   * - timeout: mild stun
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
        quit: false,
      };
    } else if (choiceId === "dismiss") {
      effects = {
        kind: "dismiss",
        stun: 0,
        context: 3,
        slow: 0,
        calendar: false,
        hallucinate: false,
        quit: false,
      };
    } else if (choiceId === "on_it") {
      effects = {
        kind: "on_it",
        stun: 0,
        context: 12,
        slow: 0,
        calendar: true,
        hallucinate: false,
        quit: false,
      };
    } else if (choiceId === "love") {
      effects = {
        kind: "love",
        stun: 0,
        context: 18,
        slow: 1.8,
        calendar: false,
        hallucinate: true,
        quit: false,
      };
    } else if (choiceId === "pushback") {
      effects = {
        kind: "pushback",
        stun: 0.35,
        context: 4,
        slow: 0,
        calendar: false,
        hallucinate: false,
        quit: false,
      };
    } else if (choiceId === "quit") {
      effects = {
        kind: "quit",
        stun: 0,
        context: 0,
        slow: 0,
        calendar: false,
        hallucinate: false,
        quit: true,
      };
    } else {
      effects = {
        kind: "unknown",
        stun: 0.25,
        context: 6,
        slow: 0,
        calendar: false,
        hallucinate: false,
        quit: false,
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
    isIncompetentHireLine: isIncompetentHireLine,
    isShieldedAccountabilityLine: isShieldedAccountabilityLine,
    isProcessChurnLine: isProcessChurnLine,
    isFeaturedCynicismLine: isFeaturedCynicismLine,
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
