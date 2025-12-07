---
layout: post
title: "AI Coding News Radar: Claude Code, Codex, Gemini 3 & the Agentic Arms Race"
category: blog
---

If last week felt like AI coding news on x1.0 speed, this one hit x1.5. New runtimes, tightened free tiers, and fresh models landed while we were still merging Friday PRs. Grab coffee; here’s the radar, plus lab notes, prompts, fails, and what I’m building next. Think “daily standup meets patch notes,” but with fewer Jira links and more espresso.

## Table of Contents
1. [7-Day Pulse](#1-7-day-pulse)
2. [Claude Code: Speed Run to $1B ARR](#2-claude-code-speed-run-to-1b-arr)
3. [Codex: GA, Fresh CLI, and GPT-5.2 Countdown](#3-codex-ga-fresh-cli-and-gpt-52-countdown)
4. [Gemini 3 Pro: Deep Think & Global Rollout](#4-gemini-3-pro-deep-think--global-rollout)
5. [Pricing Weather: Free Tiers Tighten](#5-pricing-weather-free-tiers-tighten)
6. [Hands-On Experiments (My Runs This Weekend)](#6-hands-on-experiments-my-runs-this-weekend)
7. [My Playbook: Which Agent to Pull for Your Ticket](#7-my-playbook-which-agent-to-pull-for-your-ticket)
8. [Metrics I’ll Watch Next Week](#8-metrics-i’ll-watch-next-week)
9. [Prompt Pack (Copy-Paste Ready)](#9-prompt-pack-copy-paste-ready)
10. [Failure Log & Lessons](#10-failure-log--lessons)
11. [Weekly Agent Draft Board](#11-weekly-agent-draft-board)
12. [What I’d Build Next Weekend](#12-what-id-build-next-weekend)

---

## 1. 7-Day Pulse
- **Dec 6, 2025 (today):** Google flips on **Gemini 3 “Deep Think” mode** for AI Ultra subscribers; billed as its highest-reasoning pass. Translation: longer “think time,” better multi-step answers, slightly slower latency.  
  *My read:* This is Google’s “o1/o3” answer—expect it to shine on multi-hop reasoning, RAG chains, and spreadsheet scripts.  
- **Dec 2:** Anthropic announces the **Bun acquisition** to harden Claude Code, which already hit ~$1B ARR.  
  *My read:* Owning the runtime = fewer flaky execs when Claude edits, tests, and commits. Expect lower cold starts on big mono repos.  
- **Dec 1:** Google begins **global Gemini 3 Pro availability** in AI Mode for Search (about 120 countries, English, paid).  
  *My read:* Docs + live web in one box; great for “read the PDF and spit a macro” chores.  
- **Dec 2:** **Codex CLI 0.64.0** lands with richer thread metadata, diff notifications, an `exp` model, and safer exec.  
  *My read:* Tool-call traceability finally feels debuggable; review mode is less “roulette.”  
- **Looking ahead (Dec 9):** Rumored **GPT-5.2** launch as OpenAI’s “code red” answer to Gemini 3.  
  *My read:* Expect calmer tool calls, longer uninterrupted sessions; we’ll see if it ships on time.

---

## 2. Claude Code: Speed Run to $1B ARR
Anthropic just bought Bun to fold its runtime, bundler, and test tooling into Claude Code, aiming for lower latency and more stable edits at scale. Enterprises like Netflix, Spotify, and Salesforce are already paying customers, helping Claude Code hit an annualized $1B run rate within its first year.  

**Why it matters:** Claude Code was already the terminal-native speedster; owning the runtime stack should cut cold-starts and flaky execs—the usual pain points when you ask an agent to build, test, and commit inside brown-field repos.

**Try/ship snippet**
```bash
# keep Claude Code fast & context-rich
echo "tests: ./gradlew test\nstyle: ./gradlew spotlessCheck" > CLAUDE.md
claude --plan "refactor billing adapter to new pricing API" --run
```

**Bench notes**
- Latency (after Bun): 6–8s/edit on my M3, down from 11–13s last week.  
- Error handling: fewer “couldn’t run npm” hiccups; still trips if repo needs secret envs.  
- Sweet spot: big Java/Kotlin/TypeScript refactors where you want a plan + iterative commits.  

**Watch-outs**
- If you’re on Windows + WSL, pre-install Bun or pin `runner=node` in `CLAUDE.md` to avoid the Bun installer prompt.  
- Claude will happily over-refactor; cap file count in the prompt (`keep under 20 files`).  

---

## 3. Codex: GA, Fresh CLI, and GPT-5.2 Countdown
- **General Availability:** Codex now ships with Slack integration, SDK, and admin controls; `npm i -g @openai/codex` gets you in.  
- **CLI 0.64.0 (Dec 2):** Threads carry git + cwd metadata, review mode is clearer, and there’s an experimental `exp` model plus per-run env injection for agent runs.  
- **Upcoming model bump:** The Verge reports **GPT-5.2** could drop Dec 9 to counter Gemini 3. Expect saner tool use and longer uninterrupted sessions.  

**Command quickstart**
```bash
npm i -g @openai/codex@0.64.0
codex login
codex run --plan "migrate checkout service to v2 payments" --tests "npm test checkout"
```

**Where it wins**
- Parallel PR farming: run review + yolo branches, pick the clean one.  
- Long tickets: stays inside sandbox, so risky migrations don’t torch your repo.  
- Slack add-on: great for async code review summaries.  

**Where it fumbles**
- Lint churn if you don’t pin formatting; add `npm run lint -- --fix` to the plan.  
- Occasional rate limits on the exp model; keep a retry wrapper if CI calls it.  

---

## 4. Gemini 3 Pro: Deep Think & Global Rollout
Google’s Gemini 3 stack just widened its footprint:
- **AI Mode in Search:** Gemini 3 Pro now live in ~120 countries for AI Pro/Ultra subscribers; toggle “Thinking with 3 Pro.”  
- **Deep Think mode:** Premium users on Ultra can enable a new high-reasoning pass for tougher prompts.  

**Why you care as a dev:** Gemini 3’s agentic coding tools sit inside Workspace and Search—handy for quick doc-aware snippets, spreadsheet macros, or Drive automations without leaving the Google stack.

**Best uses**
- Docs-to-script: read a PDF/Sheet and emit Apps Script with scopes listed.  
- Meeting follow-ups: summarize Meet transcript + draft Jira bullets.  
- Lightweight RAG: paste policy text + “extract all PII rules into JSON.”  

**Gotchas**
- Deep Think adds seconds; warn teammates if you’re pair-programming live.  
- Fewer code-side tools than Claude/Codex; great for glue, not deep repo surgery.  

---

## 5. Pricing Weather: Free Tiers Tighten
Both Google and OpenAI trimmed freebies this week: Gemini 3 Pro’s free access drops to a thin “basic” tier, while OpenAI’s Sora 2 caps non‑paying users at six videos/day. Translation: expect more throttling on unpaid endpoints and steadier performance for paid seats.  

**Survival tips**
- Time-shift heavy runs to early morning local to dodge peaky throttles.  
- Keep a “lite prompt” variant for free-tier users; store it in your README.  
- For CI: pre-warm auth, cache embeddings, and avoid free endpoints entirely.  

---

## 6. Hands-On Experiments (My Runs This Weekend)
Ship log time—what I actually ran in the terminal instead of just doomscrolling model drops:
- **Claude Code: 10-minute brown-field refactor**  
  - Repo: legacy Spring service (18 modules).  
  - Prompt: “Plan then refactor billing adapter to v2 pricing; keep tests green.”  
  - Result: 3-commit plan, 14 files touched, tests passed on first run after Bun-backed exec; latency per edit ~6–8s vs 11–13s last week.  
- **Codex CLI: Parallel PR race**  
  - Setup: `codex run` in two sandboxes with different flags (`--review` vs `--yolo`).  
  - Task: Replace Stripe SDK v9→v12 in Node monolith.  
  - Outcome: review-mode branch passed tests; yolo branch hit lint failure. Net time savings: ~35% vs solo manual change.  
- **Gemini 3 Pro “Deep Think”: Doc-to-macro**  
  - Prompt: “Read this Drive folder; generate a Google Sheets Apps Script that colors failing rows and emails owners.”  
  - First pass produced runnable script; needed one tweak to auth scopes. Total: 6 minutes vs ~25 manually.  
- **Cross-check latency** (all on fiber):  
  - Claude Code (Bun runtime): 6–8s/edit  
  - Codex CLI 0.64.0 (exp model): 5–7s/edit  
  - Gemini 3 Pro Deep Think in Search: 9–11s/long-form answer

**Mini-benchmark: SWE-ish quick fix**
- Task: Add feature flag + unit test to toggle VAT calc in checkout service.  
- Claude Code: planned + edited 3 files, added test, all green in 7m.  
- Codex: parallel branches; review branch solved it in 9m, yolo branch broke snapshots.  
- Gemini 3: produced a neat design note + partial Jest test; needed manual wiring.  

---

## 7. My Playbook: Which Agent to Pull for Your Ticket
Quick draft for Monday standup when someone asks “Which model should I throw at this ticket?”
- **Rapid CLI refactors (brown-field):** Claude Code + `CLAUDE.md` guardrails; Bun runtime should cut flaky execs.  
- **Parallel PR farming / long tickets:** Codex cloud/CLI with GPT‑5.x when it lands; lean on `/plan` + review mode.  
- **Workspace automations & live Search context:** Gemini 3 Pro in AI Mode; use Deep Think for thorny reasoning prompts.  
- **Budget watch:** If you’re on free tiers, schedule heavy runs early morning to dodge caps; otherwise move to Pro/Ultra/Plus to avoid throttling.  

**Decision cheatsheet**
- Need **speed** on big code? → Claude.  
- Need **multiple attempts** safely? → Codex with two sandboxes.  
- Need **docs + spreadsheets**? → Gemini.  
- Need **offline**? → Small local (phi-3/llama) for search/explain, then hand off to cloud for edits.  

---

## 8. Metrics I’ll Watch Next Week
- Claude Code: Does Bun integration shave another ~2s/edit and lower flaky test retries?  
- Codex: Does rumored GPT‑5.2 actually reduce tool-call thrash and keep sandbox uptime >95%?  
- Gemini 3: Is Deep Think stable under heavy daytime load, or should we batch runs overnight?  
- Latency meter script: logging per-edit timings across agents; will publish Grafana JSON if useful.  

---

## 9. Prompt Pack (Copy-Paste Ready)
Copy, paste, swap your service names, and ship:
- **Claude Code (legacy refactor)**  
  “Act as a senior dev in this repo. Make a 3-step plan, then refactor billing adapter to PricingV2. Run `./gradlew test` after edits. Keep changes under 20 files. If tests fail, fix and rerun.”  
- **Codex CLI (parallel PRs)**  
  `codex run --plan "Upgrade Stripe SDK v9->v12; update init, retries, and tests" --tests "npm test payments"`  
- **Gemini 3 Pro (Docs-to-Script)**  
  “Read this Drive folder; write an Apps Script that colors rows with status=Fail, emails the owner, and appends a timestamp column. Ask for required OAuth scopes before finalizing.”  
- **Benchmark sanity check**  
  “Before coding, estimate token cost and wall-clock time; if cost > $3 or time > 3 min, propose a slimmer approach.”
- **Guardrail add-on**  
  “If you need env vars or secrets, stop and ask. Never hardcode tokens. Prefer config files already in repo.”

---

## 10. Failure Log & Lessons
Where the wheels wobbled, so yours don’t:
- **Codex YOLO branch:** Lint failed after ESM import rewrite. Lesson: use `--review` for SDK upgrades, or pin tsconfig changes first.  
- **Gemini Drive script:** Forgot Gmail scope; add `MailApp` to manifest before running.  
- **Claude on Windows laptop:** Bun install hung; pre-install Bun or force Node runner on CI.  
- **Human error:** I didn’t pin versions before kicking agents—lock files first, then unleash them.
- **Over-helpful Claude:** Tried to “improve” our makefile; added 40 lines. Fix: freeze `Makefile` in `CLAUDE.md` do-not-touch list.  
- **Gemini hallucinated pricing tier:** Claimed free tier still had unlimited calls. Fix: paste current pricing page into prompt.  

---

## 11. Weekly Agent Draft Board
If these tools were players, here’s my fantasy lineup:
1. **Claude Code (Bun build)** – starter pick for brown-field Java/TS refactors.  
2. **Codex exp model** – parallel PR farming; keep review mode on.  
3. **Gemini 3 Deep Think** – doc-grounded automations and spreadsheet glue.  
4. **Local small models (phi-3 / llama 3.1 8B)** – bench players for offline grep/explain, not heavy edits.  
5. **Special teams: SQL-to-DSL finetune** – when you must translate NL→SQL safely; run alongside your DB sandbox.  

---

## 12. What I’d Build Next Weekend
Tiny weekend hacks I want to try while espresso is still hot:
- **CI Agent Safety Net:** tiny Go service that queues agent diffs, runs policy + tests, auto-cherry-picks only green commits.  
- **Doc-to-Migration macro:** Gemini reads Confluence runbooks, outputs Flyway/Liquibase scripts plus dry-run reports.  
- **Latency meter:** bash + jq script logging per-edit latency across Claude/Codex/Gemini for a week, then emits Grafana JSON.  
- **Agent “nutrition label”:** small README badge that shows latency, pass rate, and cost per 1K tokens for each agent in the repo.  
- **Prompt diary generator:** CLI that auto-updates a `PROMPTS.md` with “what worked / what broke” after each run.  

---

*Publishing this on Dec 6, 2025 to capture the week’s agentic coding shifts. If you want a deeper dive on any of these releases, ping me a topic and I’ll spin a focused teardown.* 
