---
layout: post
title: "Three Agents on One Devbox"
date: 2026-09-02
category: blog
tags: [ai-agents, sdlc, code-review, qa, sre, rca, claude-code, engineering-leadership]
description: "The right half of our development loop at Emlakjet: agents in the review queue, the Test column and production, the job that closes the loop, and what the Jira board says changed."
---

A pull request at Emlakjet used to wait three times.

First it waited for a reviewer to find an hour. Then, after the merge, the task sat in the Test column until someone picked it up. Then it shipped and waited a third time, for a person to notice if it had broken anything. Writing the code took hours. The waiting took days, and it was almost never the code that was slow.

In May I wrote that generation had become cheap and verification had become the bottleneck. The lifecycle we run is a loop, not a line: plan, build, review, test, deploy, watch, and back to the plan. The build step got fast. The bottleneck moved to the steps on either side of it, and those steps are where I put the agents, with people above the loop controlling the gates.

This is a field report on the right half of that loop, Deploy, Test and Maintain, in the order our code actually passes through them, plus the arrow that closes it, plus what the board says.

## One shape, three jobs

All three agents follow the same pattern, and the pattern matters more than any prompt.

Deterministic scripts collect. The agent reads and reasons. The process writes.

The production scanner does not query the monitoring or CDN APIs itself. Shell collectors pull every signal into compact digests, and the agent reads the digests. This is cheaper, and it is exact: two runs on the same digest see the same numbers. The reviewer gets a fresh session and a fresh git worktree per pull request. The QA agent gets a folder with the task, a brief, and a proof that the build it is about to measure is the build it thinks it is.

Every write goes through the process, never through the agent, and every write sits behind a switch that defaults to off. One flag lets the reviewer post comments. Another lets the QA job comment on Jira and move the task. A Slack webhook is the only credential the daily recap ever sees. When something goes wrong in a dry run, the blast radius is a folder on disk.

Each agent is a headless Claude Code call: a system-prompt file, a JSON schema for the output, an allow list and a deny list of tools. The model is Opus 5 at high effort. State lives in small JSON files: what was seen, which commit was reviewed, how many attempts a task has had. A guard timer watches the timers and shouts on Slack when one goes quiet.

## The harness

The agents are the visible part. Most of the work on the box is the harness around them: what they are allowed to see, what they are allowed to run, and which keys sit where.

### What the agents can see

The reviewer does not start from the diff. It starts from a map. Every hour a job checks out the tip of dev into a throwaway worktree and regenerates a symbol-level map of the monorepo, skipping the rebuild when dev has not moved. This morning's map:

| | |
|---|---|
| Files in the program | 7,619 |
| Components | 3,298 |
| Routes | 254 |
| Import edges | 22,492 |
| Resolved JSX call sites | 21,249 |
| Dead props found | 1,830 |

The map answers eight canned questions with a one-line jq program each: who imports this file, what it imports, whether it is client or server including transitive "use client" contamination, which routes it serves or sits in the layout chain of, the full route record with rendering mode and ISR settings, a component's prop contract, its inventory record, and the runtime assertions attached to a route. The reviewer's system prompt lists a strict reference order and the map is first; it is told to grep for the callers of everything the change touched and trace the blast radius before it judges a line.

The production side has its own memory: a curated knowledge base of accepted issues and baselines that the scanner reads and never edits, a suggestions file where it proposes additions and a person promotes them, topology and observability playbooks, and the digest collectors. Those pull from Instana, Cloudflare's GraphQL analytics, Varnish through Cloud Monitoring, GKE through kubectl, and the in-cluster Prometheus for Redis, Postgres, Elasticsearch, Kafka and RabbitMQ, plus a login census from the auth service's own logs.

### What the agents can run

Each agent gets an allow list and a deny list, and the lists are different.

The reviewer can read, grep and glob inside its worktree, run the read-only git verbs, and jq. It cannot curl, wget, fetch, write, push, commit, check out, or touch worktrees. It reads untrusted diff text all day, so it is the most locked down of the three.

The QA agent has the widest set because measuring a preview needs kubectl, Playwright and git. Its kubectl points at a kubeconfig that only contains the test cluster. Push is rewired to nowhere. Every helper that could write to Jira or start a build is on its deny list.

The scanner and the root-cause job get kubectl get, describe, top and logs against production, the Prometheus API through the kube-apiserver proxy, gcloud logging read, and git log and show on the local clones. No exec, no cp, no apply, no rollout, no ssh.

Around them sits tooling people use too. A read-only ops CLI with fourteen commands: is production okay right now, 5xx split by edge and origin, what rolled out, traffic and cache per host, latency, incidents, top erroring endpoints, slow endpoints, Varnish tiers, cache status, pod restarts, queue depths, product counters, and a trace from DNS through the load balancer to the pod. Zero language model in it, every query a GET, tokens never printed. A visual regression harness that keeps pixel baselines of the key page templates captured from production and fails a local branch build when a template moves. And a web-vitals lab bench: Playwright probes for INP, the CrUX and PageSpeed APIs, an inventory of the GTM containers, and real-user data from GA4 in BigQuery, used for the performance investigations and, optionally, by the gate's live lane.

### The quality gate

Before the reviewer sees a pull request, a deterministic gate runs on it. It merges the PR head into the base with no commit, analyses that merge result rather than the branch alone, and aborts the merge afterwards. It uses the map in reverse to find what the change affects, then runs its lanes. T0: lint, the trusted catalog of tools pinned by lock file, contract checks, owners, a self-audit. T1: affected build, typecheck and tests through the monorepo's task graph, coverage of the changed lines, mock integrity, snapshots. T2, off by default: behaviour, performance, runtime, SEO and visual checks against a live pair of URLs. Every lane writes evidence as JSON lines, the evidence becomes a verdict, the verdict becomes a comment and a build status on the commit.

The reviewer is required to adjudicate the gate's evidence fail-closed. It cannot approve over a red gate. A person can, by writing a break-glass comment with a reason, but the list of people who may do that is fixed and the PR's own author is never on it.

Builds are the other write. A developer comments a build command on the PR and the process builds that branch on Jenkins, picking targets from the diffstat, waits for the result, verifies the Argo CD rollout with kubectl, and posts the preview URL to the task. There is no build on open and no build per commit; both were tried and the first filled the test cluster's service range while the second filled the agents' disks. One explicit request, one build, deduplicated by commit.

### Who holds which key

| Key | Scope | Who holds it |
|---|---|---|
| Bitbucket | Write: comments, verdict, build status | The process, never an agent |
| Jira | Write: comments, transitions | The process, never an agent |
| Jenkins | Write: start a build | The process, on an explicit command or the QA gate, allowlisted repositories, at most two builds per head |
| Cloudflare | Read: analytics | Collectors and the CLI; the purge token is never loaded |
| Instana, CrUX, PageSpeed | Read | Collectors, the CLI, the lab bench |
| Kubernetes | Read verbs only | Per-agent kubeconfig: test cluster for QA, production for the scanner and the root-cause job |
| Slack | Post-only webhook | The only secret an agent process keeps |
| Datastore admin | Write | Never reaches an agent |

The webhook that turns a push into a review sits behind a firewall open to Atlassian's addresses and verifies a signature on every request. The rule under the table: an agent's verdict can cause a write, but the agent never holds the pen.

### The harness tests itself

The reviewer's brakes have their own shell tests, five of them, and each tests the direction of failure that matters. The skip decision fails closed: when in doubt, review. The fork filter fails open: never forget a PR. The diff budget drops generated and lock segments but lists every file it dropped, so the reviewer knows its own blind spots. The evidence brake demotes a blocker that arrives without evidence to a minor, and leaves one with evidence alone. The break-glass filter checks who opened the gate. There is a benchmark runner too, same prompt, same schema, same tools, no Jira and no gate context, that measures the reviewer on its own: stay quiet when nothing is wrong, and catch what is. And a guard timer watches every other timer's heartbeat and shouts when one goes quiet.

## Deploy: the review queue

The rule for this stage is simple. Every pull request gets the same set of review passes, findings ranked by severity, and the human decision moves up a level: does the change do what the task intended, and is the risk acceptable.

The reviewer is the oldest and the busiest of the three. A Bitbucket webhook plus a five-minute poll, up to three pull requests in parallel. Every push gets a re-review, deduplicated by source commit, so an unchanged PR costs five seconds and exits. It reviews inside a worktree, so it can run the code rather than only read the diff. It writes in Turkish; the excerpts below are translated.

This morning's first review, at 08:25 UTC, was a performance change on the listing detail page: lazy-load the map section, warm the map library while the browser is idle, and push the navigation to the full map view until after the tap has painted. The reviewer checked in the worktree that the preload function the change leans on actually exists and dedupes against the map adapter's own initialisation, confirmed the new test asserts what the commit message claims, and approved with four non-blocking notes. One of them: the "show on map" link at the top of the page now scrolls to a skeleton instead of a live map, because the section is no longer eager in page mode. The developer had not noticed. Nobody waited for anyone.

Ten weeks, June 29th to today:

| | |
|---|---|
| Pull requests reviewed | 696 |
| Review rounds (one per push) | 4,440 |
| Verdicts | 1,012 approve, 3,423 request changes |
| Security findings raised | 82 |

Five weeks to August 31st, where the weekly metrics track each finding across rounds by file and title:

| | |
|---|---|
| Blocking findings tracked (blocker or major) | 799 |
| Resolved before merge | 774, or 97 percent |
| PRs that flipped from request changes to approve | 168 |

Two things in those numbers surprised me.

First, in the last week of August, of 627 request-changes verdicts, 358 were for process reasons and 269 for code. Process means the branch no longer merges cleanly into dev, generated artifacts were regenerated on both sides, or a branch-specific preview URL is still sitting in a Jenkinsfile. More than half of what blocks a merge here is hygiene, not logic. I would not have guessed that before the numbers existed.

Second, the resolution rate. Blocking findings get fixed, because the reviewer carries unresolved findings forward. The Jenkinsfile URL showed up as a blocker in round after round, each time with the note "unresolved since the previous round", until someone reverted it. An agent that nags with a ledger beats an agent that is clever once. The same idea runs the QA side as a lessons file, described further down.

A finding looks like this, with paths trimmed:

```
[MINOR/edge-case] PropertyDetailModal.tsx:1117
The "Show on map" link no longer makes the POI section eager; in page
mode it now scrolls to a skeleton.
Evidence: onClick at 1115-1119 only calls scrollIntoView and never
requestDetailSectionScroll, so line 883 leaves isPoiSectionEager=false.
Suggestion: call requestDetailSectionScroll('poi'), the same path the
sticky nav already uses. No extra code.
```

Claim, evidence with line numbers, suggestion. When the evidence is wrong the developer can say so in one sentence, and they do. The other class it catches well is the accidental one: an import of a module that does not exist and fails the build, found minutes after the push instead of at the end of a CI run.

The native approve or request-changes verdict is set under my account, not a bot account. That is the "human attention moves up a level" part. The responsibility for a merge stays with a person.

## Test: the Test column

One thing to be precise about. Most of our code is still written by people, and CI here runs lint and build, not the test suite. So the Test agent verifies someone else's work, on the deployed preview, against the task's acceptance criteria. It is the independent check, not a self-check.

It is also the one I am most careful with, because it writes to Jira and it can move a task backward in someone's sprint.

The flow, per task that lands in the Test column:

1. Find the pull request and its head commit.
2. Prove that the head is what is actually running in the preview environment. The Jenkins build's revision, the PR head, the image tag on the running pod and the build number all have to agree, and the rollout has to be complete. If they disagree there is no measurement. The job may trigger a build, at most twice per head and thirty minutes apart, then it gives up and tells Slack.
3. A manager pass writes a brief: which files the PR touches, which other tasks in Test touch the same files, and the lessons file described below.
4. The QA agent logs into the preview with a test account, opens the same pages on the preview host and on a control host that runs the current dev image, and measures both with Playwright. Screenshots, DOM checks, HTTP codes, byte counts, timings in repeated runs.
5. It writes a comment, screenshots and a verdict as files. Nothing else.
6. The process validates the files. Every screenshot referenced in the comment exists, every file is referenced, no two screenshots share a checksum, and the verdict cannot be PASS or FAIL if the gate in step 2 was not open.
7. Only then does the process post the comment with the screenshots embedded and move the task: PASS to UAT, FAIL to BugFix, unmeasurable stays where it is.

Step 6 is there because a comment that references a screenshot that was never taken, or attaches the same screenshot twice under two names, would look like fraud to the developer reading it. The checks are cheap and I would rather not learn how often they fire.

Since August 21st: 20 rounds, 125 tasks, 150 verdicts. 110 PASS with evidence attached. 38 FAIL on 30 distinct tasks, each sent back to BugFix with a comment that names the file and the line. Twelve of those thirty came back in a later round and passed.

One of the FAILs was a layout task. The agent found the page's scrollHeight changing nineteen times inside a single frame and the scroll position drifting by 44 pixels, and traced it to a 200 millisecond padding transition. Another was a frontend fix whose own new test passed on the branch and failed on dev because of class ordering, and the agent noticed that CI does not run Jest at all, so the green check meant nothing. Before it was allowed to write to Jira, its verdicts were checked against rounds a person ran on the same tasks: same verdicts, same root causes, fewer screenshots.

An hour per task is typical, and most of it is measurement. One reflow criterion alone was 21 runs per side, because the box is shared with the reviewer and the numbers are noisy. Verdicts are made on counts, bytes, hashes and HTTP codes, with milliseconds as supporting evidence only.

### Safety is structural, not verbal

The QA agent has the widest tool access of the three, because measuring a preview means running kubectl, Playwright and git. I did not want to rely on telling it what not to do.

- Its kubeconfig is a file that contains only the test cluster context. There is no production context to pick by accident.
- Git push is rewired at the config level. Every push URL, https or ssh, is rewritten to a host that does not exist:

```
url.https://push-disabled.invalid/.pushInsteadOf=https://
url.https://push-disabled.invalid/.pushInsteadOf=git@
```

- Production secrets and the Slack, Cloudflare and Bitbucket tokens are removed from the environment before the agent starts.
- A deny list covers kubectl mutations, gcloud, sudo, anything that touches routes or VPNs, git commit and checkout, and every helper script that writes to Jira or triggers a build.

The rewrite exists because the first version of the deny list matched commands that start with "git push". A smoke test with git -C somedir push walked straight past it. I ran a push with the agent's environment afterwards and it failed with a DNS error. That is the outcome I want. "Please do not push" is a request. A URL that resolves to nothing is a fact.

### The lessons file

The agents do not learn between runs. Every session starts blank. What carries over is a text file, thirteen entries as of today, each in the form "which task, what happened, what the rule is". The manager pass hands it to every QA agent. A few, translated:

- "Code not found in any repository" is not a FAIL reason. Scan wider first. If it is still not found, the verdict is unmeasurable.
- The developer's own "PASS, verified, byte-identical" table is not evidence. Every number gets reproduced. "Could not reproduce" and "fixed" are not the same thing.
- On a backend task, a pod running an image built after the fix was merged can still contain an older core jar bundled inside it. Pull the jar from the pod and check the bytecode before measuring behaviour.
- The control host can be behind the tip of dev. Separate the effect of the fix from an intervening merge with git merge-base before calling an A/B difference a regression.

Each of those cost at least one wrong verdict before it was written down. One of them sent a task back to BugFix for nothing. That is the ratchet. The agent is not getting smarter, the file is getting longer, and the file is the thing I would keep if I had to throw everything else away.

## Maintain: after the deploy

The third queue is the quietest and the easiest to forget: something is wrong in production and nobody is looking at the right panel. For scale, the zone behind this serves about 111 million requests a day through Cloudflare, 117 million on the last day of August, from roughly a million unique visitors, 56 percent of it from cache, a little over 3 terabytes a day.

This stage has two layers, and both are read-only on purpose. The agent that watches and the agent that diagnoses can look at anything and change nothing.

The first layer is the scanner. Every four hours, 845 times so far, plus 65 daily recaps. It is read-only by construction. It holds read tokens for the monitoring and CDN APIs during collection only, never the cache purge token, never repository credentials. A lock makes sure a slow run and the next scheduled run cannot overlap and fight over the same state. The control bands live in a curated knowledge base the agent reads and never edits; it proposes additions in a separate file and a person promotes them.

The useful part is memory. Every alert gets a slug and the agent tracks it across runs. Some are known and accepted; the report says so and moves on, with a counter. "129th day blind" for a set of database exporters nobody has fixed. "99th consecutive run at ceiling" for an autoscaler stuck at its maximum. "31 hours, 8th consecutive scan" for an image editor pod stuck in ImagePullBackOff. A counter that climbs in a report you read every morning applies a different kind of pressure than an alert that fired once and was acknowledged.

It also separates the platform from the product. On September 1st a backend-for-frontend deployment rolled to a new image whose pod could not start its Spring context, and the recap ranked that as the top open item. In the same four-hour window it noted the public site had served twelve 5xx responses on 11.2 million requests, so this was a service problem and not a customer-facing one yet. The search page's p95 went 603 ms, then 560, then 503, and the recap said it was back inside the 500 to 550 band the knowledge base defines for that page and closed the alert. The alert count fell from 38 at noon to 11 at 20:00, and the day still ended RED, because the recap ranks by severity and not by volume.

None of this is new information. All of it was in dashboards. The difference is that at 06:30 there is a page that has already read the dashboards and put the two things that matter at the top.

### Closing the loop: the root-cause job

The second layer is the newest thing on the box, and its rule is the one I kept coming back to while building it: a breach in the watch layer invokes the diagnosis without a person in the path, and the diagnosis lands in the planning queue like any other task, where a person decides. Fix now, schedule, or dismiss.

It has two triggers, a slow one and a fast one.

The slow trigger is the scan. When the scanner finishes a run, it looks at every red slug in the report. If the slug is new, meaning absent from the previous 24 hours of state, or if it has been red for exactly three consecutive runs, and it is not on the knowledge base's accepted list, the scanner starts a detached job for it. At most two per scan, one per slug at a time, and a week of cooldown per slug so the same incident does not get diagnosed every four hours.

The fast trigger is a watcher that polls five control bands every two minutes from the cluster's own Prometheus, with no agent involved: containers in CrashLoopBackOff, image pulls that fail, a deployment whose Progressing condition has been false for sixteen minutes, a restart whose last exit was OOMKilled, and a namespace whose 5xx share is above five percent on real traffic. A band breached on consecutive checks writes an event file with the rule, the query, the first breach time and the offending series, and starts the same root-cause job with that file in place of the scan paragraph. Same protections: one job per service within six hours, two per hour at most, the knowledge base's accepted list skipped.

Replayed against yesterday: the crash-loop band went above zero at 17:30. The watcher would have fired at 17:34. The scan saw it at 20:00. Two and a half hours, on an incident that happened to be harmless. The next one may not be.

Its first live catch came within minutes of being switched on: a legacy search service whose 5xx share had climbed to 77 percent, caught at 09:54, event file written, root-cause job started, one line in Slack.

The job follows the same shape as everything else. The process assembles the inputs: the report lines for that slug, the last twelve scan states, the first time the slug appeared, the knowledge-base lines for that service, the digest snapshot the report was built from, and the local clones whose names match the slug, fetched fresh while the credentials are still in the environment. Then the credentials go away and the agent gets a read-only view of production: kubectl get, describe, logs and the in-cluster Prometheus proxy, gcloud logging read, git log and show in the clones. Push is rewired to nowhere, as with the QA agent. It writes nothing. It returns one JSON object against a schema: a one-line title, impact, a timeline where every row names the command it came from, a root-cause class out of eight, evidence as command plus finding, the change correlation, the hypotheses it eliminated and why, actions with priority and a likely owner, a confidence number, and what would raise it. The process renders that into a Jira-ready task in Turkish and posts a summary to Slack. The Jira write sits behind a switch, like every other write in this setup.

The first real run was this morning, on the crash loop from the previous section. Ten minutes, 47 tool calls, 2.71 dollars. What it produced, translated and trimmed:

The deployment had moved to a new image at 17:26 UTC on September 1st. The new pod never became ready. Because the rollout strategy was zero max-unavailable with surge, the old replica set kept serving two of two the whole time, availability stayed at exactly two replicas across 71 samples, and the incident was invisible to every traffic digest. Only the restart counter and the ready ratio showed it. The scanner flagged it at 20:00.

The root cause was in the previous container's log: application failed to start, one parameter "required a single bean, but 2 were found." The agent pulled the diff of the commit behind the image tag. A CORS configuration had been moved from an MVC mapping into a filter, and along the way the configuration source was published as a bean and injected by type. Spring's own MVC auto-configuration already publishes a bean of that interface. Two candidates, no qualifier, no context. The unit tests did not catch it because they instantiated the class by hand and never booted a context.

Then the part I did not expect. The commit was tagged on August 20th and deployed on September 1st, twelve days later, so a git log around the onset returns nothing, and the report says so: the trigger was the deploy, not the commit. Between the previous revision and the broken one, the configmap hash, the resource limits, the probes and the environment were identical. The only variable was the image tag.

It eliminated five alternatives with a line of evidence each. Memory was at 24 percent of the limit and the exit reason was an error code, not OOMKilled. The configmap was 76 days old. The failing phase is bean resolution, which makes no network calls. A Kafka error in the logs was also present in the healthy pods, so it was noise, and a separate finding. The image was already on the node and the container did start, then exited on its own.

It also noticed the incident was over. A fix commit had landed at 08:18 that morning, the fixed image rolled at 08:36, the crash loop ended 17 minutes later, and the only 5xx responses in the whole 16-hour window, ten of them, fell inside the fix rollout, because the old pods were terminated without a drain. Confidence 0.95, with a list of what it could not get: the crash log itself, gone with the pod, because that namespace has no log sink; and the reason for the twelve-day gap between tag and deploy, because the deployment tool's API was not in its allow list.

Six actions came out, two of them P1. Make a context-boot smoke test a required check in that repository's CI. And add a Prometheus rule on the deployment's Progressing condition being false for fifteen minutes, with a sentence I would frame: the metric sat at one for fourteen and a half hours and no rule consumed it.

The second run, on a different slug, classified its cause as an external service, took twelve minutes, and its first action belonged to finance rather than engineering. I will take a root-cause analysis that knows which department to send the ticket to.

One more thing it did without being asked. Every number in that report has a command next to it. An engineer who doubts the analysis can rerun the command. That is the property I care about most, more than the confidence score.

## What the board says

Numbers from Jira, not from the agents. Every task that entered the Test column, how long it stayed, and where it went next. I split the ten weeks at August 21st, the day the QA agent started moving tasks. The weeks before that had the reviewer only.

| | Jun 29 to Aug 20 | Aug 21 to Sep 2 |
|---|---|---|
| Tasks entering Test, per week | 118 | 98 |
| Median time in Test | 8.2 hours | 2.2 hours |
| 75th percentile | 37 hours | 6 hours |
| Left Test within 24 hours | 68 percent | 99 percent |
| Sent back to BugFix from Test | 19.4 percent | 19.9 percent |
| Bugs found after Test, in UAT or live, per task tested | 4.8 percent | 4.4 percent |

Three things I read from that table.

The Test column got four times faster at the median and six times faster at the tail, on a volume that is roughly the same. This is the number I care about most, because it is the queue that used to hold a finished feature for days.

The send-back rate did not move. One task in five still goes back to BugFix. The agent is exactly as strict as the people were, which is what you want; a QA step that suddenly passes everything is a QA step that stopped looking.

The escape rate after Test is flat at around one task in twenty-two. Thirteen days is not enough to claim it dropped, and I am not going to.

The other number is bug tickets opened in the project, per day, by period:

| Period | Bug tickets per day |
|---|---|
| July | 6.4 |
| August 1 to 20 | 3.2 |
| August 21 to September 2 | 1.9 |

That is a two-thirds drop in ten weeks. The first half of it happened before the QA agent existed, with the reviewer running and the Test volume unchanged. I cannot separate the reviewer's effect from everything else that happened in August, and this post would be worth less if I pretended I could. The numbers are what they are; the trend is in the direction the review numbers predict.

## What went wrong

These are the parts I would want to read in someone else's post: not the setup mistakes, the places where the agents themselves were wrong.

**The reviewer promised an approve it never gave.** On August 28th it blocked a pull request on Jira status alone, with the code review clean, and wrote in its own comment that approval would be automatic once the task reached Ready to Release. The task got there. The gate badge went green. The verdict stayed red. The PR had fallen into a third path nobody had drawn: it kept merging dev into its branch, so it never counted as unchanged, and the round that ran was a silent one that neither posted a verdict nor checked whether the block should lift. Underneath that, the record saying "we owe this PR an approve" was deleted in the same round that lifted the block, before any approve was set, and with the record gone the dispatcher stopped picking the PR up at all. The developer typed the gate command at 11:15. Two rounds ran with the verdict approve and wrote nothing. I approved by hand at 13:24. The wait was not two hours. It was infinite. Two hours is how long it took a person to notice. Fixed on September 1st: the silent path posts and checks, and the record is deleted only after the approve is on the PR.

**The scanner watched the wrong cluster.** Its live-verification step ran with the machine's default kube context, which was the test cluster. Nothing broke, because the model kept adding the production context flag on its own, every time. That is the worst kind of working, right answers for the wrong reason, and it went unnoticed until a comment in the code made me check. The kubeconfig is pinned now.

**The scanner inflated its own alerts.** It fed itself the previous twelve runs' alert slugs as known and carried every one of them forward; alerts per run climbed from five in June to 37 on September 1st. It now sees 24 hours of history. A second self-inflicted one: comparing the 08:00 to 12:00 window against the adjacent overnight window manufactured growth alarms of 150 percent for defects whose true day-over-day change was 8 percent. Counters that scale with traffic need a same-hour baseline, not the previous one.

**A four-hour cadence is not a monitor.** On August 2nd the snapshot closed at 12:01, the report said an attack was still running, the attack peaked at 12:30 and ran until 14:18, and the next scheduled scan would have marked it resolved without ever seeing the worst of it. Two hours and seventeen minutes with nobody looking. The first fix was small: if the report says something is still in progress, a follow-up scan is armed for an hour later. The real fix is the two-minute watcher above.

**The QA agent failed tasks that were not broken.** Two tasks got FAIL because the agent could not find the change in the repositories it searched; the code lived in a repository outside its short list. A backend task was failed twice with "the fix is not deployed anywhere" because the agent trusted the pod's image timestamp, while the library jar bundled inside that image was older than the fix; on the third round it pulled the jar out of the pod and checked the bytecode. One task went back to BugFix for a 500 that was a limitation of the test environment, not of the change. Each of those is a line in the lessons file now, and each line exists because a developer had to argue with a robot and win.

**Structured output is not guaranteed.** One run came back with the verdict as prose in the result field and no structured object at all, and the process treated it as a parse failure and exited. Extraction now tries three sources in order: the structured output, JSON inside the result text, and a verdict file the agent writes to disk. The file is the one that has never failed.

## Where it stands

Three queues, three agents, one virtual machine. Review within minutes of a push. A finished feature out of the Test column in two hours, at the same strictness. A production recap at 06:30 that has already read the dashboards, and a root-cause draft in the queue minutes after a control band breaks.

What I still do by hand, every day: read the recap, promote or reject the knowledge-base suggestions, decide what happens to each root-cause draft, and put my name on every merge verdict. That is the job now. Reading what the agents flagged and deciding, instead of reviewing diffs, clicking through previews and watching dashboards.

What is not solved. The escape rate after Test has not moved, and thirteen days of data will not settle whether it can. The three agents share one machine, so timings are noisy and every verdict leans on counts and hashes rather than milliseconds. The lessons file grows by one entry per wrong verdict and nobody prunes it yet. And the left half of the loop, the part where a task gets written before anyone builds it, is still people typing into Jira. That is the next queue, and it is the one where the waiting is hardest to see, because nothing turns red while it happens.

The code was never the slow part. The queues were.
