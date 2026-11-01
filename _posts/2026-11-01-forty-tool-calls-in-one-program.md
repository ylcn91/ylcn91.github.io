---
layout: post
title: "Forty Tool Calls in One Program"
date: 2026-11-01
category: blog
tags: [ai-agents, programmatic-tool-calling, mcp, prompt-caching, measurement, claude-code, engineering-leadership]
description: "Two days of building programmatic tool calling into Alp and measuring it four times: the architecture, the real flow of a run, how we measured, the bugs the measurements found, and why the first headline number was wrong."
---

The first measurement said the new tool made our agent 64% faster and 30% cheaper.

It was wrong. The direct-tool runs we were comparing against were not slow because they called tools one by one. They were slow because one shell command in them waited two minutes for input that never came. Once that was fixed, the same three tasks gave about 15% on both. Measured a third time, with sixty runs and confidence intervals, the answer was 14% cheaper and 9% faster across five tasks, with almost all of the gain in one kind of work.

This post is about that tool, the Script tool in [Alp](/alp/), and about the two days of measuring it. The tool turned out to be the easy part.

## One request per tool call

An agent works in a loop. The model asks for a tool call, the harness runs it, the result goes back into the conversation, and the model is asked again. Every round trip is a new model request, and every request carries the whole conversation so far.

That is fine for a few calls. It is expensive for work shaped like this: list 32 support tickets, read each one, read the customer behind each, filter, add up hours per region. Done with direct tool calls, that is 9 model requests in our measurement. The model emits a batch of calls, waits, reads every ticket in full, emits the next batch. All 32 tickets end up in the context, and every later request pays for them again.

The idea is not new. Several agent teams have published versions of it under the name programmatic tool calling: give the model one tool that takes a program, and let the program call the other tools. Loops, filters and sums happen in code. Only what the program prints goes back to the model.

In Alp the tool is called Script. The model writes JavaScript, and every tool the agent has is a function on `tools`. This is the program the model wrote in one of our measured runs, trimmed for length:

```js
const parse = v => JSON.parse(typeof v === "string" ? v : v.map(b => b.text || "").join(""));
const ids = parse(await tools.helpdesk.list_tickets({}));

const got = await Promise.allSettled(ids.map(id => tools.helpdesk.get_ticket({ id: String(id) })));
const tickets = got.filter(r => r.status === "fulfilled").map(r => parse(r.value));

const cids = [...new Set(tickets.map(t => t.customer_id))];
const cs = await Promise.allSettled(cids.map(id => tools.helpdesk.get_customer({ id: String(id) })));
const cust = Object.fromEntries(cids.map((id, i) => [id, parse(cs[i].value)]));

const sum = { EU: 0, NA: 0, APAC: 0 }; let n = 0;
for (const t of tickets) {
  const c = cust[t.customer_id];
  if (["open", "pending"].includes(t.status) && c.tier === "enterprise") { sum[c.region] += t.hours_open; n++; }
}
text(JSON.stringify({ sum, n }));
```

One tool call, 43 MCP calls inside it, all started together. The model never saw a ticket. It saw `{"sum":{"EU":651,"NA":813,"APAC":0},"n":14}`.

![Two real runs of the same task on one time axis. Direct tools: 9 model requests and 47 seconds, with tool calls arriving in batches between requests. Script: 4 model requests and 30 seconds, with all 43 MCP calls in one burst under a second.](/assets/images/script-tool/timeline.svg)

The figure is two real runs from the measurement, same task, same model, same build, each close to the median of its group. With direct tools, the 32 `get_ticket` calls arrive in two batches of 16, each batch a model round trip. With Script, the second request is the model writing the program, about 11 seconds of output. The program then makes all 43 calls in less than a second, and two more short requests post the answer.

## The architecture

![The Alp server hands a task to the daemon on the agent's machine. The daemon starts Claude Code with an alp-script endpoint. The model's program runs in a Deno sandbox; every tool call in it goes back to a Go dispatcher that applies the same checks as a direct call, then runs the nested tool. Only printed text returns to the model.](/assets/images/script-tool/architecture.svg)

Alp runs agents through a daemon on the machine that does the work: a developer's laptop, a shared worker, a microVM. The server never runs a Script. Everything in the dashed frame happens on that machine.

- **The endpoint.** The daemon serves an MCP endpoint called `alp-script` on loopback, with a secret path per run. Claude Code sees it as one more MCP server with two tools, `Script` and `WaitForScript`.
- **The sandbox.** The program runs in Deno, a version pinned and checked by SHA-256 when it is downloaded. It runs with no permissions at all: no network, no file system, no environment, no imports. A 128 MB heap, a resident memory cap and a CPU time limit stop a runaway loop. The only thing the program can do is call `tools`.
- **The dispatcher.** Every `tools.X(...)` call leaves Deno as a line of JSON on standard output, with a per-run token, and comes back the same way. The Go side decides it exactly as it would decide the direct call it stands for: the agent's deny rules, the workspace tool gate, a person's approval if the gate asks for one, and a check that every path stays inside the run's folder. A refused call is an error inside the program. It never waits silently.
- **The nested tools.** Read, Edit and Write are Go code. Grep is ripgrep with JSON output, so the program gets typed records instead of text to parse. Glob is fd. AstGrep and Outline are ast-grep. Execute runs a shell command inside the same sandbox the run's own shell uses. Every MCP server the agent has, remote or local, becomes `tools.<server>.<tool>()`.
- **The way back.** Only what the program prints with `text()` or `console.log()` goes back to the model, at most 64 KiB per Script. Anything longer is cut in the middle and the full output goes to a log file in the run folder. Every answer ends with a status line, such as `[Script completed · 43 calls]`.

The model sees the bindings as TypeScript declarations in the tool description, generated from each tool's input schema. MCP tools come first, so a client that cuts long descriptions cuts the built-in part, which the model knows anyway.

### Three modes

Each agent has a setting: `off`, `on` or `only`.

- `off`: direct tools only.
- `on`: Script next to the direct tools; the prompt steers any step of more than two calls into a Script.
- `only`: Script replaces the direct tools. Claude Code is started with Read, Edit, Write, Grep, Glob and Bash disallowed, and the MCP servers the Script owns are removed from its own configuration, so a result cannot come back the long way.

`only` works only on Claude Code, because it is the only CLI we run whose direct tools can be switched off from outside. For the other CLIs, `only` falls back to `on`. Private Teams chats and side chats never get Script; their rules are simpler without it.

## The real flow of one run

This is what happens when a person assigns an issue to an agent whose mode is `only`:

1. The server puts a task in the queue. The daemon on the agent's machine claims it, together with the workspace's run settings.
2. The daemon prepares the folder. The agent's stable brief goes into a system prompt file, passed with `--append-system-prompt-file`, so every run of that agent starts with the same cacheable prefix. Run-specific parts go into the folder's `CLAUDE.md`.
3. The daemon decides the mode, checks that Deno can run `text(1 + 1)`, and starts the `alp-script` endpoint. If any of that fails, the run falls back to `off`.
4. Claude Code starts with its direct tools disallowed and one MCP server added. Every shell command it would have run, including Alp's own CLI, now runs as `tools.Execute(...)` inside a Script.
5. The model calls Script. The program runs, every nested call is checked and executed, and the printed result comes back with the status line.
6. A Script that runs longer than five minutes keeps running. The model gets an id and can wait for it, check on it or kill it. When the turn ends, every Script still running is stopped.
7. The run ends. Token usage per model goes to the server, along with prompt cache figures for the run: the share of the first request read from cache, the share of the whole run, and how many times the cache broke. Nested calls appear in the transcript under the Script call that made them.

## How we measured

We did not want a benchmark. We wanted to know what changes for the agents we run every day, so we measured the product itself.

- **The real product.** Runs started the way any run starts: create an issue, assign it to an agent. Each agent was a real Alp agent on a real daemon, with its real folder, tools and sandbox. The only difference between two agents was the Script setting.
- **Tasks with one right answer.** Every task ends in a line such as `ANSWER: EU=651;NA=813;APAC=0;N=14`, or in a check script that runs the tests and compares the files. A run counts only if it is right.
- **Five tasks.** An MCP fan-out over a small helpdesk server (32 tickets, 12 customers). Three counts in a clone of the ripgrep repository. A rename plus a new function in a small Go module. A failing test whose cause is two files away. A signature change across 26 files and 64 call sites, with traps: an import alias, calls split over lines, look-alike functions in other packages, the same text in comments and strings. Every package's test records the arguments of each call, so a careless rewrite fails.
- **Every request recorded twice.** A small proxy between Claude Code and the API wrote down the usage of every request. Alp records the same numbers itself. In 59 of 60 runs they matched to the token; the sixtieth lost its row when we redeployed the backend mid-run, and we took it from the proxy.
- **Cost as list price.** Input, cache reads at 0.1x, cache writes at 1.25x and output, at API list prices. We run on subscriptions, so this is not a bill. It is a measure of how much model work a run takes, which is also what wears down a subscription's limits. Time is the run's start to its end.
- **Intervals, not anecdotes.** Six runs per task and mode, run by two agents in parallel, each in random order. For every comparison we resampled the runs 10,000 times and report the 95% interval of the median's change. If the interval crosses zero, we say there is no measurable difference.
- **Hangs counted.** Any tool call over 60 seconds, or a gap over 120 seconds inside a run, is flagged. That rule is what we did not have the first time.

## Four rounds

![The same question measured three times. Round 1 with 66 runs: cost -30%, time -64%, inflated by the rg hang. Round 2 with 24 runs: cost -13%, time -14%. Round 3 with 60 runs: cost -14%, time -9%.](/assets/images/script-tool/rounds.svg)

**Round 0, a stub server.** The first test used a fake ticket server and two task types. MCP fan-out came out 58 to 61% cheaper; a file-and-shell task came out 7% more expensive. A review the same day found that the metric counted loops as calls and cache reads at full price. We kept the direction and dropped the number.

**Round 1, the real product, three CLIs, 66 runs.** Claude Code, Codex and Grok, each in every mode, on three tasks. For Claude, `only` against `off` said 30% cheaper and 64% faster.

The 64% came from one task. In the Go refactor, the direct-tool runs took 173 seconds against Script's 36. Reading the transcripts showed why: the model had run `rg CalcTotal` with no path. Claude Code gave the shell an open socket as standard input, ripgrep with no path reads standard input, and the call sat there until the two-minute timeout. Four of six direct-tool runs of that task hit it. Two runs hung for good, because while the stuck command lived in the background, the CLI never sent its final result.

Script runs did not hit it, because commands inside a Script never had that socket. So the 64% measured our bug, not the tool. The fix was one line at the top of every run's shell environment: `exec </dev/null`.

The other two CLIs were clearer. Codex, given Script next to its direct tools, did not call it once in eight runs. Given only Script, it got one total wrong (it added up the raw output in its head), made quoting mistakes when it wrapped shell commands in JavaScript, and cost twice as much on the code task. Grok found the tool but could not see the typed declarations, guessed the function names, and spent its first few Scripts on errors; one run wrote a Rust lexer inside a Script, ran for 20 minutes and returned the wrong count. We switched Script on for Claude models only.

**Round 2, Claude, hang fixed, 24 runs.** Same tasks plus the failing-test task. 13% cheaper and 14% faster overall, almost all of it from the MCP task. The refactor that had been 79% faster was now equal.

**Round 3, Claude, 60 runs with intervals.** Five tasks, six runs each per mode. This is the result we use.

![Change in cost and time per task, Script against direct tools, with 95% intervals. MCP fan-out: cost -39%, time -33%. Failing test: cost -10%, time -20%. Signature change: cost -15%, time no difference. Code search and small refactor: no difference. All five tasks: cost -14%, time -9% at the edge of the interval.](/assets/images/script-tool/forest.svg)

| Task | Direct → Script, cost | Direct → Script, time | Model requests |
|---|---|---|---|
| MCP fan-out | $0.390 → $0.239, **-39%** | 48 s → 32 s, **-33%** | 9 → 4.5 |
| Code search | +4%, no difference | -4%, no difference | 7 → 6 |
| Small refactor | -4%, no difference | +5%, no difference | 8 → 6.5 |
| Failing test | **-10%** | 43 s → 34.5 s, **-20%** | 8 → 6 |
| Signature change, 26 files | $0.542 → $0.462, **-15%** | no difference | 11 → 7 |
| All five | $1.819 → $1.564, **-14%** [-20, -9] | 267 s → 244 s, **-9%** [-18, 0] | |

All 60 runs were right. No task got measurably worse. Output tokens were the same in both modes; the whole saving is on the input side, from fewer requests each carrying less. The servers saw the same number of MCP calls either way. Script does not make fewer tool calls; it makes fewer model requests.

A published result from another team's harness put the saving at 15% on the same model. We got 14%.

**Round 4, the language server.** We had installed language servers on every agent machine. Twelve more runs asked whether telling the model to use one helps on the 26-file signature change. It did not: 10% more expensive, inside the noise, same time. Told to use it, the model called `findReferences` once in four of six runs, got the right 65 references, and then wrote its own program with Go's parser anyway and counted with that. Not told, it never opened the language server, in 66 runs. We kept the servers and did not add a line about them to any agent's instructions.

## What the model actually does

The numbers hide a surprise. We gave Script typed Grep, Glob, Outline and AstGrep bindings, and expected the model to use them in code work. In 60 runs, the Grep binding was used zero times. Outline zero. AstGrep in three runs.

What the model did instead was run the same shell tools it uses with direct tools, ripgrep and fd, through `tools.Execute`, several at once. For the structural task it wrote its own `go/ast` program in all twelve runs, and all twelve were right. In code work, Script is mostly a way to put three shell commands into one request. That is worth 10 to 15% on tasks with several steps, and nothing on a search the model can already do with one pipeline.

The wording of the prompt mattered more than any binding. Our first prompt said "one Script per step". The model obeyed, and split each job into two or three Scripts. Changed to "put the whole job in as few Scripts as possible, chain dependent steps", it wrote one Script and finished in two requests. On the MCP tasks that one sentence took the nine-run total from 142 seconds to 93.

## What the measurements found

Measuring the product meant every bug in the product showed up in the numbers. Most of the two days went into these:

- **The shell that waited for input.** Described above. One line, every run.
- **Keep-warm requests that failed.** After a chat turn, Alp sends a tiny request shortly before the prompt cache expires, so the next message does not pay to write the whole conversation again. 16% of them failed: the sandbox could not find the run's temporary folder, because the run had already removed it. They now recreate it for their own lifetime.
- **Keep-warm requests that missed the cache.** A keep-warm request starts a new CLI process, which lists its tools again. After a turn, the Script endpoint was closed or served a default list, so the tool list differed from the turn's and the cache prefix broke. An idle endpoint now keeps answering with the last list.
- **A user's settings inside an agent's run.** On a developer machine, the daemon's runs picked up the developer's own shell aliases, CLI instructions and skills list. In the direct-tool run in the first figure, the model's first attempt to write its reply fails with `command not found: bat`, because the developer has aliased `cat` to it. The skills list alone was 28 KB in every request. Runs can now be isolated from user settings.
- **Usage that disappeared.** A cancelled run wrote no usage at all, although the proxy saw 24 requests. A run open during a backend deploy lost its usage row. The second one we saw in round 3.
- **A cost of zero.** Alp showed every run as free: prices were missing for two models, and one CLI reported its model as "unknown". Every dollar figure in this post comes from the harness, not from the product.

## The prompt cache

![Share of the first request read from the prompt cache: 29% before, 50.5% after moving the agent's brief into the system prompt, 95% for a chat turn after 62 idle minutes with keep-warm.](/assets/images/script-tool/cache.svg)

Script saves requests. The prompt cache decides what each remaining request costs, and on a subscription it decides how long the limits last. Inside a run the cache was already doing its job: 86 to 93% of input read from cache, no breaks in 66 runs. Between runs it was not.

The first request of every run read only 29% from cache, because the agent's brief sat in the first user message under a path that changed every run. Moving the stable part into the system prompt raised that to 50%. The rest is still written fresh: the run's folder path, the issue, and the environment block the CLI builds.

For chats, the subscription writes the cache with a one-hour lifetime. A keep-warm request at 59.4 minutes read 42,000 tokens and wrote 314, and the next message, 62 minutes after the last, read 95% from cache. Without it, that message would have written the whole conversation again at 1.25 times the price.

Every run now reports its own cache figures, and a request that reads less than 80% of the previous request's input is logged as a break. We stopped guessing whether the cache works.

## Where it leaves us

Script is on for Claude agents, in `only` mode, as the workspace default: the workspace's Script model list is `claude-*`. For Codex and Grok it is off.

What to expect from it, from our own numbers: about 40% less model work and a third less time on MCP fan-out, the shape of work our data agents do. Ten to fifteen percent less on code tasks with several steps. Nothing on simple searches and small edits. Across five mixed tasks, 14%.

What we do not know yet:

- **Real work.** These are five tasks. A scan of 4,674 interactive agent sessions on our own machines found that series of API calls were only 3.8% of requests, because developers already batch them into one shell command. The large savings belong to agents that fan out over data, and we have not yet measured them on their real traffic. The usage data to do that is now correct.
- **The unused bindings.** Typed Grep, Outline and AstGrep are not used. Either their descriptions should steer the model, measured in a separate round, or they should go.
- **Other models.** Codex and Grok were measured once, with few runs, in the round that had the bug. Their results may have been different without it.

## Methodology

- Product: Alp test deployment, builds `2b5b27b04` (round 2), `23e1ca727` (round 3) and `69fbec5db` (round 4); daemon on a shared development machine; Claude Code 2.1.3xx.
- Model: `claude-opus-5-5` in every Claude run of rounds 2 to 4, checked from the usage records. Round 1 also used Codex (`gpt-6.1-sol`, reasoning xhigh) and Grok (`grok-4.7`).
- Runs: round 1, 66 (plus a pilot); round 2, 24; round 3, 60; round 4, 12. Two agents per round in parallel on the same subscription account, each running its jobs one at a time in random order.
- Correctness: a fixed answer line or a check script per task. All runs of rounds 2 to 4 were correct.
- Tokens and requests: a recording proxy between the CLI and the API, cross-checked against Alp's own usage records (identical in all completed runs).
- Cost: API list-price equivalent ($4 / $20 per million input / output tokens for Opus 5.5, cache reads 0.1x, cache writes 1.25x). Subscription caches are written with a one-hour lifetime, which the API prices at 2x; with that, absolute numbers rise 15 to 25% and the order between modes does not change.
- Statistics: median per task and mode; bootstrap resampling of runs within each cell, 10,000 repeats; 95% intervals for the ratio of medians; the overall row is the ratio of summed task medians.
- Limits: six runs per cell means a difference under about 20% on code tasks is not measurable. Two arms shared one account, so absolute times depend on load. The backend was redeployed once during round 3; both runs open at that moment completed correctly.
