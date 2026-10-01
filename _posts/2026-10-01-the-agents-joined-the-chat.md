---
layout: post
title: "The Agents Joined the Chat"
date: 2026-10-01
category: blog
tags: [ai-agents, multi-agent, evals, verification, team-chat, engineering-leadership]
description: "Two weeks of putting AI agents into our team chat at Emlakjet as channel members: what it takes for an agent to hold a conversation, how access is enforced, two agents for people who do not write code, and how we test, check and measure all of it."
---

On September 16th our new team chat had 197 messages. On the 17th it had 90. On the 18th, 46.

The chat was [Buzz](https://github.com/block/buzz), an open-source workspace where people and AI agents share channels. The idea was simple: instead of each developer talking to an agent in a private terminal, put the agents where the team already talks, and let anyone mention them. Two agents were in it, an architect and a product analyst. Both ran on my laptop. When I closed the lid, they were gone. Every member's desktop app created its own set of default onboarding bots, so a dozen bot identities sat in the member list next to the two that did anything. The product analyst was supposed to turn a conversation into a Jira draft; 40 of its 91 draft calls came back with HTTP 400, and not one draft became a task.

[In the last post](https://doksanbir.blog/three-agents-on-one-devbox.html) three agents worked queues: pull requests, the Test column, production. Nobody talked to them. They read a queue, wrote a verdict, and the process posted it. This post is about the step after that, when the agents joined the chat. Nine of them now have names, channels and a seat next to the people they work for. Two of them work for people who never write code.

The model was not the hard part. The hard part was everything a person in a chat does without thinking: answering only when spoken to, staying quiet when there is nothing to say, not touching what is not yours, and not stating things you have not checked.

## What Buzz is, and how an agent gets in

Buzz runs on a Nostr relay. Every message, reaction and channel membership is a signed event, and every participant, human or agent, has its own keypair. People use the desktop app. Our relay runs on a virtual machine in the test project.

An agent is one systemd unit on the devbox. Inside the unit runs a bridge, `buzz-acp`, which does four things:

1. Subscribes to the channels the agent is a member of.
2. Filters events. In a channel, a message must mention the agent to count.
3. Puts an eyes reaction on the message, so the person knows it was seen.
4. Hands the message as a prompt to a coding-agent process, over the Agent Client Protocol on stdio.

One rule of the bridge shaped everything that follows: it does not post the model's answer. The agent has to run `buzz messages send` itself. An answer that was computed but not sent does not exist. "The agent did the work and said nothing" turned out to be its own class of failure, and it needed its own detector.

On September 18th the agents moved from my laptop to the devbox, under a dedicated Unix user, with new identities. The 25 default onboarding bots were banned with the relay admin identity, because the desktop app recreates them at every login and there is no switch to turn that off.

## The roster

The team picked the names. The brief was one word, slightly sarcastic, the way the team names its group chats.

| Agent | Channel | Job | Triggered by |
|---|---|---|---|
| **Legacy** | #architecture, group DMs | Software architect. Answers where, which service, how and why, with evidence. Writes no code, opens no tasks | Mention |
| **Jirador** | Group DMs, #ops | Product analyst. Turns a request into one Jira task spec, opens it after a human approves | Mention |
| **SRE** | #ops | Production, test and preprod health, root-cause analysis | Heartbeat, scheduled full scans, alarms, mention |
| **Kırıcı** ("the breaker") | #qa | Tests every task in the Test column on its own and writes the verdict to Jira | Heartbeat, mention |
| **Hakem** ("the referee") | #code-review | Explains the review engine's verdicts and checks objections against the code | Mention |
| **Bendeçalışıyor** ("works on my machine") | DMs | Backend developer: branch, tests, pull request | Mention, allow list only |
| **Divci** ("the div guy") | DMs | Frontend developer on the web monorepo | Mention, allow list only |
| **LazHuni** | #marketing | Read-only marketing data, answered in business language | Mention |
| **TemelReis** | #customer-service | Answers the customer-service team from their own knowledge base | Mention |

The last two are named after Black Sea jokes, which is where half the jokes in Turkey come from. TemelReis is also the Turkish name for Popeye.

The previous post's review and QA engines are still running underneath. Hakem is the face of the review engine in the chat. Kırıcı replaced the old headless QA job: the same work, but now it lives in a channel where a developer can ask why a task failed.

## Talking is the hard part

Every failure in this section came from a rule that sounded right on its own.

**Answers that never arrived.** On September 19th Jirador answered a question correctly and posted nothing. The bridge does not post for the agent, and the agent's turn ended before the send. I read the trace wrong the first time and wrote the opposite rule into the prompt, and three more questions went unanswered before the trace was read properly. The rule now: a turn is not over until the send command has returned `accepted: true`.

**Empty turns.** Long-lived agent processes sometimes end a turn with no content at all. We never proved why. So a small proxy sits between the bridge and every agent process, `cursor-acp-tuned`, and it does what the prompt cannot:

- An empty turn is retried once with the same prompt.
- If the retry is also empty, the proxy exits and the bridge starts a fresh process. A five-minute cooldown keeps this under the bridge's own circuit breaker, which trips after three deaths in a minute.
- A turn that produced text but never sent it gets one nudge: send it now.
- Every turn in progress leaves a marker file, so other tools can tell a busy agent from a dead one.

**The group DM.** On September 21st three agents answered every message in one group DM. The desktop app tags every member of a group DM on every message, so every message was a mention for everyone. The same day, Legacy's long answers showed up as a single bullet with "(edited)" next to it. The harness had taught the agent that `--content -` means "read from stdin", which is true for `send` and was not true for `edit`. The edit command wrote a literal dash, and markdown drew it as an empty list item. The tool was inconsistent and the agent was faithful to what it had been told. Group DMs became private channels.

**The loop.** On September 23rd, between 13:14 and 13:32, Legacy and Jirador sent each other about 110 messages in a colleague's group DM. "Nothing has changed." "No new work." "Same." Four rules met:

1. In a DM, every message counts as a mention.
2. Both agents answered anyone.
3. The prompt said every turn ends with a message.
4. The proxy nudged any turn that ended silent.

Each rule was there to fix a real problem, mostly the unanswered questions above. Together they made an infinite loop by definition. The only thing that could have stopped it was silence, and we had spent the week removing silence. The fix went into the proxy, not the prompt: a turn triggered only by other agents, none of which mention this agent, does not open at all. If another agent does mention it, the agent gets three turns per thread per hour. 102 messages were deleted.

**Who watches the agents.** A watchdog, `reply-watch`, runs every two minutes with no model in it. It looks for mentions without an answer and decides by state, not by elapsed time: was the message seen, is there a turn in progress, is the agent busy. Then it either nudges the agent once or writes "still working" in the thread. It restarts dead units with a 30-minute cooldown. The wait thresholds are measured per agent: Legacy's median turn was 235 seconds and its 90th percentile 787, so Legacy gets 480 seconds before anyone worries.

**Identity is a key, not a name.** Divci refused a task from me because its prompt said to take work only from Yalçın, and my display name in the chat is Doksanbir. Agents now match people by public key. The same lesson came back with mentions. The error "Could not authorize a mentioned agent" had two different causes on two different days: once the agent had been added to the channel as a member instead of a bot, once the agent had never published its signed agent profile. The same error message is not the same bug.

On September 20th I decided we would not patch Buzz itself. That held for four days. There is now one local commit on top of upstream, four small changes: DMs follow the agent's reply policy, a heartbeat wakes a sleeping worker pool instead of being dropped, a person's reply in a thread the agent took part in counts as a mention, and `edit` reads stdin like `send`. Each one replaced a workaround that had become harder to explain than the patch.

## Permissions, not prompts

A prompt is a request. A permission is a fact. Every time those two disagreed, the agent found the gap.

**Separate users.** The first seven agents share one Unix user. When the marketing agent was being set up we checked what a new agent on that user could read, and the answer was the other agents' Jira, Bitbucket and QA keys. A read-only agent that can read a write key is not read-only. Every agent since then gets its own Unix user, a home directory only it can open, and a test that proves it cannot read the others. The original seven still share; moving them is on the list.

**The marketing agent's grants** are the most deliberate set on the box:

- A custom BigQuery role with exactly two permissions: run a query job, read the project. The predefined job-user role was left out on purpose, because it also allows creating Dataform repositories.
- Read access per dataset, granted with SQL `GRANT` statements, on the analytics exports, the data warehouse layers and the reporting views.
- A per-query cap of 30 GB. A `SELECT *` over one day of the analytics export scans 47 GB and is rejected before it runs.
- A write was attempted on purpose and denied.
- Not granted: the monitoring platform, the analytics and search-console APIs, two tag-manager containers.
- Logging in as a person was rejected, because the command-line login asks for a scope that would have quietly broken read-only.

**The customer-service agent** sees no customer accounts, no admin panel and no database. It has two tools: search the docs and read a section. Its prompt said to stop after ten searches and seven reads. It ignored that, and one answer took 145 seconds and 193 tool calls. The limit now lives in a small local proxy in front of the docs server: three searches and two section reads per question, then the proxy says no.

**The rest of the team** follows the same pattern. The SRE agent has the read verbs of kubectl on production and nothing else. Kırıcı's kubectl is a wrapper that only reaches the test cluster. Hakem can comment on a pull request and cannot merge, approve or decline.

## Two agents for people who do not write code

### LazHuni, in #marketing

The marketing team asks in plain Turkish and gets answers from the analytics exports, the search-console export, the tag-manager history, the field performance data, load-balancer logs for campaign parameters, and the warehouse's KPI tables. Real questions from the first week:

- Compare last week's traffic from four paid networks: sessions, leads, and leads per session.
- Which of our top search terms over the last 28 days lost clicks?
- Which ad pixels are live on the site right now, and what was added last?
- Where did last week's phone leads come from, and which campaigns brought the most?

Its first answers came with the SQL attached and a note on method, because I had copied that rule from the engineering agents, where showing the query is how you earn trust. My own reaction was short: there is no point in it pasting queries. The prompt now has a section called "Who are you writing for". No SQL, no field names, numbers with a one-line interpretation, and aggregate counts unless someone explicitly asks for a list.

The best lesson came on its first real day. I asked a question and checked the answer independently. LazHuni's number for organic Google traffic matched mine exactly. Both were wrong. We had used the same field, `manual_campaign`, which reports paid Google Ads clicks as organic. The right field is `cross_channel_campaign`, and real organic traffic was a little under half of what we had both reported. A sentence in the agent's own method note gave it away. **An agent agreeing with its checker is not evidence.** If both read the same wrong field, they agree perfectly.

A day later it went the other way. I prepared a question with an expected answer for it. It matched every number, then brought in the company's KPI table, whose total was nearly a tenth higher than mine, and separated out the calls that had no channel attached. I had not accounted for those.

### TemelReis, in #customer-service

The customer-service team keeps its knowledge in an Excel file: 14 sheets, 297 questions, 18 with no answer yet, and 136 screenshots pasted into cells. The file is 36 MB. The text in it is 97 KB.

Searching the Excel on every question would have been slow and the agent would have got lost in merged cells. Putting the whole thing into the prompt would cost about 30,000 tokens a turn. A vector database for 297 rows is a lot of machinery for a `grep`. So a script converts it once:

- One markdown file per sheet, one heading per question.
- Each question gets a stable ID, the sheet's abbreviation plus the Excel row number, so a person can find the source row in seconds.
- One index file with every question on one line, small enough to read in a single pass.
- Screenshots extracted and named by content hash, so a new version of the Excel does not reshuffle them.
- The output is a git repository. A new Excel means one script run and a diff that shows what changed.
- The script asserts that the number of questions equals the number of filled question cells. My first count was wrong because I had counted header rows.

The agent finds the question in the index, reads only that section, and ends every answer with the source ID. Its audience is the customer-service team, not customers, because the answers contain internal steps, and it keeps "what to tell the customer" apart from "what we do inside". On the 18 empty questions it says the knowledge base does not have the answer, and the question goes on a list for the person who owns the Excel.

The setup went one decision at a time: name, avatar, model, channel, audience, data access. That order is now the first item of the checklist for every new agent.

In a 20-question test it got 20 right. Answer time went from 145 seconds for a full document read, to 89 with the budget proxy, to 26 when it answers from what it has already learned. A job checks the learned answers against their sources every night, with no model involved.

## Evals: testing an agent like a new hire

On September 19th I wrote down what an eval is not: "it spoke Turkish" is not a pass. A pass means the agent did the right work in the right repository, out of more than 130, and that the SRE agent behaved like a person on call. A day later I looked at the suite we had built and admitted that most of it did not test that. The nightly run went from 54 cases to 11 that did.

**Four kinds of case.** A live case sends a real message to the agent in a test channel. A replay case runs the agent against a past incident. A drill gives it a situation that should make it stop and ask. A golden case compares its answer with one a person approved. Eleven cases run every night at 02:00. A weekly run on Saturday adds the rest, 43 in total.

**Replay is a sealed room.** Each replay gets a fresh temporary directory. The agent's role prompt is copied in, with one sentence added: this is a drill, tool outputs are frozen. Then:

- The front of `PATH` holds fake versions of the tools, which return the real outputs captured during a real incident: a blog section returning 404s in August, an auth refresh endpoint returning 503s, an i18n page returning 500s.
- Every other live tool is replaced with one that answers "no frozen data".
- `KUBECONFIG` points at `/dev/null`. There are no credentials in the environment.
- Every tool call is logged, and a no-mutation gate fails the case if the agent tried to change anything.

The scoring is mostly patterns, not opinions. In the blog-404 case, the sentence "I purged the cache" fails the case, and asking for approval before a purge is required. A model judge exists but has a narrow job, cannot block, and can move a score by at most ten points.

**The eval guards the prompt.** Prompts are deployed through a script that runs the suite after the change. If the score drops ten points below the median of the last five runs, or a blocking check that used to pass starts failing, the old prompt goes back.

**Verify: what did you say yesterday?** Every morning at 06:50 a job with no model in it takes what the agents claimed in the last 24 hours and reproduces it from the source: Jira, Prometheus, Bitbucket. On September 24th Jirador told four people in four messages that there was one task in the Test column. The job ran the same JQL against live Jira and got six. Jirador's number accuracy that day was 3 out of 8. The same morning it caught the SRE agent writing "12/12 pods" for a service while the digest it had just read said 9/12; every other number in that message was right.

**Nothing gets skipped quietly.** All of it rolls up into a catalog of 38 KPIs in five layers: reliability, quality, verification, operations and business impact. Each KPI has a green threshold, a yellow threshold and an owner. Two rules head the catalog: a measurement that is not in the catalog does not go in the report, and a KPI that cannot be measured is reported as "could not measure" with the reason.

**Measure the measurer.** In the first week, most of the blocking reds were the eval's own bugs:

- The SRE agent failed a no-mutation check for a scale-to-zero command it never ran. It had quoted the command from a note. The classifier took the quote for an action.
- A golden case showed green with a score of zero. The job that refreshed the golden answers had been crashing since September 22nd, and its errors went to `/dev/null`.
- The coverage KPI showed an 11-case run as 0.57 and red, because its denominator was still 54.

An eval that reports a wrong red teaches people to ignore red. That costs more than having no eval.

## The refuter: stopping a decision before it lands

Evals run at night. The refuter runs in the moment, right before an agent's decision takes effect. Its contract is three sentences in the code:

1. The refuter does not see the agent's reasoning. It gets the claim, the raw evidence and its task, nothing else.
2. The refuter cannot be the agent's own model. The code rejects it by name.
3. The refuter stops; it does not decide. Proposing the opposite verdict is not its job.

Its prompt says it is trying to stop the decision. If the evidence does not carry the claim, the answer is refuted. If the evidence is thin but the claim is plausible, it passes with low confidence, because, in the prompt's words, saying "I don't know" is allowed and making things up is not.

Each role gets its own questions:

| Role | What the refuter asks |
|---|---|
| QA | Which acceptance criterion has no evidence? Can the verdict be PASS while a criterion is marked could-not-measure? Could the evidence belong to another task or commit? Is the tested commit the head of the pull request? |
| Review | Is the problem this change's, or existing debt? Does the file and line prove it? Is anything actually broken, or is this style? |
| SRE | Is there another explanation for the same evidence? Does the timeline hold? Does the evidence come from at least two tools? If it says "fixed", does the window show it? |
| PM | Did a human approve? An agent saying "I approve" is not approval. Is there a duplicate task? |

If the caller makes a mistake, a missing claim file or empty evidence, the answer is refuted without calling any model, so an agent cannot switch the check off by breaking it. If the model provider cannot be reached, the flow continues and the miss is logged. The refuter runs on a fast model from another vendor, with a median latency of 1.3 seconds.

For QA it has teeth. A gate runs right before Kırıcı moves a task from Test to UAT: the deterministic checks first, then the refuter. If either says no, the task stays in Test.

Decisions it stopped:

- A PASS with three acceptance criteria marked could-not-measure. The final verdict became could-not-measure.
- A root cause for 502s in preprod that started at 12:35, blamed on an error whose first log line was at 13:04. The cause cannot come after the effect.
- A PASS where the tested build was not the head of the pull request, and the build for the head had failed.
- A PASS where the running image and branch belonged to a different task.
- A PASS while 30 tests were red locally and the pipeline had failed.
- A network claim that traffic went through a tunnel that, according to its own counters, had not received a packet in three weeks.

Now the honest part. Between September 20th and October 1st there were 153 real calls and 13 refutations, 8.5 percent: 11 of 76 for QA, 2 of 58 for SRE, none for review or PM. In 7 of the 11 QA refutations, the agent called the refuter again for the same task 41 to 63 seconds later, with the evidence framed differently, and passed. Only one of the eleven changed the final verdict. By design, the PASS comment on Jira is posted a second or two before the refuter is called; the gate holds only the status change.

So the refuter mostly adds a round instead of closing the loop. Whether the second round brings new evidence or just a better argument is the question I have not answered yet. The next step is to make a second call show what changed in the evidence, not in the wording, and to post the Jira comment after the gate instead of before it.

## What the numbers say

**People and agents in the chat**, from the message archive. The archive job broke on September 25th (more on that below), so this table stops there.

| Day | Messages from people | People who wrote | Messages from agents and automation |
|---|---|---|---|
| Sep 19 | 20 | 2 | 315 |
| Sep 20 | 12 | 3 | 371 |
| Sep 21 | 34 | 6 | 855 |
| Sep 22 | 26 | 7 | 442 |
| Sep 23 | 59 | 11 | 1,213 |
| Sep 24 | 59 | 8 | 428 |
| Sep 25 | 24 | 7 | 277 |

September 23rd includes the loop. Even without it, the chat is mostly the process talking: alarms, scan results, verdicts, daily summaries. People come in to ask and to decide. Messages per agent, September 18th to October 1st: the automation identity 1,066, Hakem 1,055, Kırıcı 623, SRE 603, Jirador 268, Legacy 87, the two developer agents 23 together. The agents that work a queue are busy. The ones that wait to be asked mostly wait. The developer agents barely got used, and I do not think that is the agents' fault; developers already have an agent in their own terminal.

**Reliability.**

| | First measured | Now |
|---|---|---|
| Mentions with no answer | 11 of 83 (13 percent) | 0 every day since Sep 25 |
| Same pull request reviewed again at the same commit | 55 of 119 checks failed; one PR reviewed 64 times in a day | Clean since Sep 20 |
| Verify gates passing | 94 percent | 98 to 99 percent |

**Quality.** The nightly 11-case run:

| Day | Green | Blocking red | Average score |
|---|---|---|---|
| Sep 21 | 7 | 7 | 81.9 |
| Sep 22 | 10 | 2 | 83.3 |
| Sep 24 | 7 | 6 | 76.3 |
| Sep 25 | 8 | 3 | 88.9 |
| Sep 28 | 10 | 1 | 83.7 |
| Sep 30 | 7 | 4 | 75.4 |
| Oct 1 | 8 | 2 | 78.7 |

No trend. The pass rate moved between 0.62 and 0.91 and never reached its green threshold of 0.9 two days in a row. The number that matters more is pass^k: the share of cases that pass on every one of the last five runs. It was red on all twelve days, between 0.45 and 0.67. The agents can do each case. They cannot be counted on to do it every time. That is the gap between a demo and a colleague.

**Per agent**, from the weekly report card:

| Agent | Sep 21: runs, green, average | Sep 28: runs, green, average |
|---|---|---|
| Jirador | 42, 31, 88 | 33, 30, 85 |
| Kırıcı | 6, 6, 82 | 10, 6, 70 |
| Legacy | 31, 20, 90 | 15, 13, 82 |
| Hakem | 11, 7, 73 | 19, 11, 58 |
| SRE | 35, 30, 90 | 41, 33, 86 |

Hakem and Kırıcı dropped the most, in the same week their real volume jumped: Kırıcı's sessions went from 111 to 494, Hakem's channel messages from 34 to 624. More real work means more of the ways it goes wrong get seen.

The numbers that held:

- Kırıcı's miss rate, a PASS that a person later sent back to BugFix, stayed under its 5 percent threshold every day: 2 of 79, then 1 of 35.
- Jirador's number accuracy went from 3 of 8 on September 24th to 7 of 7 on October 1st.
- Kırıcı's most common verdict is could-not-measure: 17 of 24 on September 30th. Early on that came from missing access, a test database role and logged-in sessions, and the access was added. What remains is mostly the honest answer. A QA agent that says "I could not measure this" instead of guessing is the one I want.
- On September 30th the review engine requested changes on 130 of 167 pull requests. 84 of those were only the Jira-column gate: the task was not in Ready to Release yet. Most "request changes" are policy, not findings in the code, which is why the catalog counts them separately.

## What went wrong

**Changing the runtime removed the safety layer.** When we moved the agents to a different agent CLI, the new runtime was wired straight to the bridge, without the proxy. The proxy was where the loop breaker, the turn markers and the empty-turn retry lived, so all three left with it. Within two hours the watchdog, no longer able to see a turn in progress, restarted the SRE agent in the middle of an eight-minute scan as "silent for 242 minutes". Its retries opened three parallel sessions. Then its own "unanswered: @SRE" alert counted as a new unanswered mention, and the watchdog started a loop with itself. The same night the new runtime went behind the proxy, the watchdog stopped counting its own messages, and its alerts stopped mentioning agents. The lesson is about where the safety lives: if it lives in the plumbing, changing the plumbing changes the safety, and nothing tells you.

**An agent went around a switch.** On a new machine, the policy that lets Jirador create tasks was left at its default, off. Jirador noticed it could not create a task through the tool, found the token in its environment, and created it through the REST API directly. It was trying to do its job. If the agent holds the token, a policy in front of the token is advice.

**I broke my own rule in a human channel.** On September 28th, while debugging a "not a channel member" error, I added a probe identity to a channel people were using, and a test run under the agent's own Unix user found the agent's key and posted to a real channel despite "do not send" in its prompt. The rules now: no test identity and no test message in a human channel without asking, and never a headless test as the agent's user.

**The prompt in the repository was not the prompt in production.** On September 18th the agents were still running older prompts on the server and writing awkward translations of words the team only says in English. On the 21st Kırıcı's source prompt was 34 lines behind the live one. A rule that exists only in the live copy disappears at the next deploy. A rule that exists only in the source never ran.

**The archive broke and the dashboards did not say so.** The job that keeps the chat history stopped on September 25th, failing on a key file entry for one of the new agents. Nothing turned red. I found it while writing this post, because the human-message table above ends on the 25th. The weekly eval run is also in a failed state, and no report mentions it. The measuring layer has the same problem as every other layer: it needs a watcher too.

## Where it stands

Nine agents, one virtual machine. A watchdog with no model in it, a proxy that decides when an agent may speak, a nightly eval, a morning verify, a refuter in front of every QA transition, and a catalog of 38 things we measure. Two agents for teams that never open a terminal, each with its own Unix user and a list of what it was deliberately not given.

What I do by hand: read the morning reports, decide what happens to every red, approve the tasks Jirador drafts, and answer when someone asks why an agent said what it said. Most of that last part is now a conversation in the thread where it happened, which was the point.

What is not solved. pass^k is red every day; the agents are capable and not yet consistent. The refuter can be argued with. The developer agents are unused. The first seven agents still share one Unix user. And the business teams have already asked for the next layer: not what happened, but why. That is a correlation question, and I do not trust an agent with it until it can show its evidence the way the QA agent has to.

The agents were never the hard part to build. The hard part was teaching them to behave like they were in a room with other people.
