---
layout: post
title: "Algorithm Pokémon: How AlphaEvolve, Codex, Claude Code & AZR Leveled-Up My Dev Party"
category: blog
---

## Table of Contents
1. [Welcome to the Evolution Arena](#1-welcome-to-the-evolution-arena)
2. [Meet the Squad](#2-meet-the-squad)
3. [Training Montage: How Each Agent "Grinds XP"](#3-training-montage-how-each-agent-grinds-xp)
4. [Gym Battles: Benchmarks & Real-World Quests](#4-gym-battles-benchmarks--real-world-quests)
5. [Badge Collection: Shipping Wins](#5-badge-collection-shipping-wins)
6. [Cautionary Tales (Team-Kill Moves)](#6-cautionary-tales-team-kill-moves)
7. [The Evolution Continues: What's Next?](#7-the-evolution-continues-whats-next)
8. [Resources & Prompt Cheat Sheet](#8-resources--prompt-cheat-sheet)

---

## 1. Welcome to the Evolution Arena

*A wild agent appears!*

Remember when autocomplete felt magical? Meet agents that write whole algorithms while you make coffee.

From pair-programming Pikachu to self-evolving Mewtwo, AI agents now design algorithms, file PRs, and refactor legacy monoliths while we AFK. In just the last month we've seen a dramatic evolution in AI coding agents, jumping from simple sidekicks to full-blown algorithmic designers.

If you've been following my "Chaos-to-Code" series, you know I'm obsessed with harnessing AI to reduce dev chaos. Today, we're taking a Pokémon-themed journey through the most powerful coding agents that just landed.

*VS Code lights up; four agent Pokéballs roll across the status bar. You sip espresso; they pop open.*

## 2. Meet the Squad

Let's register our new AI coding agents in the Pokédex:

| Agent | Type | Signature Move | Real-World Feat |
|-------|------|---------------|-----------------|
| AlphaEvolve | Strategy/Compute | Evo-Heuristic ⚡ | Recovers 0.7% of worldwide compute by redesigning Borg scheduling |
| Codex Cloud | Multi-Task/PR | Fork Storm 🌪 | Opens parallel pull-requests; Plus users get free credits |
| Claude Code | Speed/CLI | Commit Dance 💃 | Terminal agent patches legacy monoliths at $3 in / $15 out per MTok |
| AZR | Mythic/Self-Play | Zero-Shot Self-Train ❄️ | SOTA coding/math with no human data |

### 2.1 Gemini + AlphaEvolve (the Strategy Guru)

Google DeepMind's newest system combines Gemini's coding capabilities with an evolutionary approach to discover novel algorithms. AlphaEvolve has already reclaimed ≈0.7% of Google's global datacenter capacity by inventing a new Borg-scheduler heuristic. 

What makes this so different? Unlike previous systems that were specialized for one task (like AlphaTensor for matrix multiplication), AlphaEvolve is a general-purpose agent that can evolve entire codebases across wildly different domains.

### 2.2 OpenAI Codex Cloud (the Multitask Tank)

OpenAI's cloud-first Codex CLI spawns parallel PR "clones" in sandboxed repositories. The system creates isolated environments where it can test multiple approaches simultaneously without risking your main codebase. Plus/Pro users even get $5-$50 in bonus credits to try it.

Think of it as having multiple junior devs working on your ticket at once, but only the best solution gets approved.

### 2.3 Claude Code (the Agile Speedster)

Anthropic's Claude Code lives directly in your terminal, committing changes on command. At $3 / $15 per million tokens with Claude 3.7 Sonnet, it excels at real-time pair programming through your CLI.

What sets Claude Code apart is its terminal-native approach - no context switching between editor and assistant. Just type your instruction and it edits, tests, and commits with impressive speed.

### 2.4 Absolute Zero Reasoner (the Self-Training Mythic)

The academic newcomer AZR (Absolute Zero Reasoner) trains itself with zero human data yet tops coding & math leaderboards. Unlike other models trained on massive datasets of human code, AZR proposes its own coding puzzles, solves them, and judges itself.

This self-play approach means it can continuously improve without relying on more human data - potentially reducing both costs and scalability bottlenecks.

## 3. Training Montage: How Each Agent "Grinds XP"

### AlphaEvolve's Genetic Loop

Gemini Flash generates thousands of candidate programs; Gemini Pro critiques; automated tests score them; the best survive and re-spawn. Each new generation inches toward better runtime or fewer FLOPs.

The genetic algorithm approach is absolutely key here - Gemini models propose mutations to code, then automated evaluators determine which variants perform best. The process continues iteratively, evolving increasingly efficient solutions that might never occur to human developers.

### AZR's Reinforced Self-Play

AZR proposes its own coding puzzles, solves them, and grades itself with a built-in code executor—no curated data needed.

It's like watching a Pokémon train itself in the tall grass. By generating increasingly difficult challenges and solving them, AZR creates a continuous training loop that doesn't rely on human examples.

### Codex's Hyperbolic Time-Chamber

Every CLI session spins up a network-disabled sandbox. In Full Auto mode the agent edits, tests, and commits while you grab coffee—until a 429 head-butts the process.

The sandbox approach is brilliant because it allows Codex to try risky operations without fear. Multiple parallel sandboxes mean it can explore different solution paths simultaneously, bringing only the best one back to your repo.

### Claude Code's Incremental Commit Rhythm

```bash
/edit utils.py → tests pass → /commit "refactor: remove N+1" → repeat
```

Small changes, fast reviews—perfect for brown-field horror repos.

Claude's approach mimics the ideal human workflow: incremental improvements with clear commit messages. It's particularly effective for legacy codebase cleanup where small, targeted changes are safer than massive refactors.

## 4. Gym Battles: Benchmarks & Real-World Quests

These agents aren't just theoretical - they're already winning battles in the real world:

- **SWE-Bench Verified**: Gemini 2.5 Pro hits 63.8% with a custom agent setup—the current champ.
- **Matrix Showdown**: AlphaEvolve beats the 56-year-old Strassen algorithm for certain matrix sizes.
- **Codex Sprint**: Internal test—three open Jira bugs closed in 14 min via Full Auto.
- **AZR vs. LeetCoder**: AZR edges human grandmaster on Codeforces 1746D (800 rating bump).

What's impressive is how quickly these systems solve problems that would take humans hours or days. AlphaEvolve discovered a matrix multiplication algorithm for 4x4 complex-valued matrices using 48 scalar multiplications, improving upon Strassen's 1969 algorithm that was previously considered optimal.

## 5. Badge Collection: Shipping Wins

Our AI squad has earned some impressive badges:

| Badge | Who Earned It | Impact |
|-------|---------------|--------|
| Global Eco Boost | AlphaEvolve | +0.7% compute capacity saved; that's ~1 small datacenter worth of power/electricity each month |
| Credit Bounty | Codex | $5/$50 promo packs for Plus/Pro to encourage sandbox tinkering |
| Terminal Whisperer | Claude Code | Native CLI workflows = zero context-switch cost for devs |
| Data-Free Prodigy | AZR | SOTA with no external dataset—opens path to cheaper, scalable training |

The sustainability angle with AlphaEvolve is particularly notable. By recovering 0.7% of Google's worldwide compute through a more efficient scheduler, it's having a real-world impact on energy usage at scale. This isn't just algorithmic improvement for its own sake - it translates to meaningful resource savings.

## 6. Cautionary Tales (Team-Kill Moves)

Not all is perfect in AI coding land. Here are some team-kill moves to watch for:

- **AlphaEvolve Obfuscation**: The fastest matrix kernel it produced was unreadable; took three PhDs and ChatGPT Vision to translate.
- **Codex Rate-Limit Wipe**: A second 429 crashes the CLI and nukes session state—issue #157 is still open.
- **Claude's Over-eager Delete**: In Full Auto it once removed an entire __tests__ folder. Keep Git hooks on!
- **AZR Hallucinated Tasks**: Self-proposed puzzle bricked the judge; sandbox before prod.

The most concerning pattern is when AI agents optimize *too well* - creating code that's hyper-efficient but completely incomprehensible to humans. There's a delicate balance between performance and maintainability that these systems are still learning to respect.

## 7. The Evolution Continues: What's Next?

The evolution isn't stopping anytime soon:

- **Gemini 2.5 Flash**—on-device reasoning toggle for edge dev-boards.
- **Rumored Codex Plugin Marketplace** (PyCharm & VS Code extensions spotted on Reddit).
- **RLVR for Science**: Absolute Zero framework might spill into theorem proving and drug design next.

Perhaps most exciting is the potential for these techniques to expand beyond programming into other domains like scientific research. The self-play approach pioneered by AZR could theoretically work for any field where solutions can be automatically verified.

## 8. Resources & Prompt Cheat Sheet

Here's your starter deck of prompts:

| Agent | One-Liner Prompt |
|-------|------------------|
| AlphaEvolve | // evolve heuristic for 100k-task Borg schedule |
| Codex | $ codex --full-auto "migrate codebase to Java 17" |
| Claude Code | /edit OrderService.java --explain |
| AZR | solve_task("MinCostFlow", size=512) |

Couple these with exponential back-off wrappers for Codex per OpenAI cookbook.

### References

1. [DeepMind AlphaEvolve blog](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/)
2. [Wired coverage of AlphaEvolve](https://www.wired.com/story/google-deepminds-ai-agent-dreams-up-algorithms-beyond-human-expertise)
3. [OpenAI "Introducing Codex" post](https://openai.com/index/introducing-codex/)
4. [GitHub issue #157 on Codex 429 crash](https://github.com/openai/codex/issues/157)
5. [Anthropic Claude docs](https://docs.anthropic.com/en/docs/get-started)
6. [Anthropic pricing page](https://www.anthropic.com/pricing)
7. [Google Keyword blog on Gemini 2.5 & SWE-Bench score](https://blog.google/technology/google-deepmind/gemini-model-thinking-updates-march-2025/)
8. [Google Dev Blog on Gemini 2.5 Flash](https://developers.googleblog.com/en/start-building-with-gemini-25-flash/)
9. [AZR arXiv paper (2505.03335)](https://arxiv.org/abs/2505.03335)
10. [AZR GitHub repo](https://github.com/LeapLabTHU/Absolute-Zero-Reasoner)
11. [AZR Medium explainer](https://medium.com/@jenray1986/absolute-zero-this-ai-teaches-itself-reasoning-from-scratch-no-human-data-needed-8d32bb9b9bbb)
12. [Reddit thread on Codex plugins](https://www.reddit.com/r/OpenAI/comments/szudp4/openai_codex_plugin/)
13. [OpenAI Cookbook rate-limit patterns](https://cookbook.openai.com/examples/how_to_handle_rate_limits) 