---
layout: post
title: "Three Agents on One Devbox"
date: 2026-09-02
category: blog
tags: [ai-agents, code-review, sre, qa, claude-code, engineering-leadership]
description: "Ten weeks of running a PR reviewer, a production scanner and a QA tester as unattended agents at Emlakjet, with the numbers and the failures."
---

On the evening of September 1st the four-hourly production scan came back RED. The next morning's daily recap put one item at the top of the list: top up the OpenAI billing account behind the listing-description enhancer. The feature had been failing since 13:10 UTC. At 16:00 the failure rate was 79.7 percent. At 20:00 it was 99.93 percent. Nothing in the cluster was broken. The fix was a credit card.

An agent wrote that recap. It also wrote the six scans before it, the "still open at day end" list, and the note that the public site had served twelve 5xx responses on 11.2 million requests in the same four-hour window, so this was a product outage and not a platform one. Nobody prompted it that evening. A systemd timer did.

I have three of these running on one virtual machine at Emlakjet: a pull request reviewer, a production scanner, and a QA tester. The first two started on June 29th. The QA one came later in the summer. In May I wrote a long post arguing that verification, not generation, is the bottleneck now, and that verifier agents are how you attack it. This is the field report. Less theory, more logs.

## One shape, three jobs

All three follow the same pattern, and the pattern matters more than any prompt.

Deterministic scripts collect. The agent reads and reasons. The process writes.

The scanner does not query the monitoring or CDN APIs itself. A set of shell collectors pulls every signal into compact digests, and the agent reads the digests. This is cheaper, and it is exact: two runs on the same digest see the same numbers. The reviewer gets a fresh session and a fresh git worktree per pull request. The QA agent gets a folder with the task, a brief, and a proof that the build it is about to measure is the build it thinks it is.

Every write goes through the process, never through the agent, and every write sits behind a switch that defaults to off. One flag lets the reviewer post comments. Another lets the QA job comment on Jira and move the task. A Slack webhook is the only credential the daily recap ever sees. When something goes wrong in a dry run, the blast radius is a folder on disk.

Each agent is a headless Claude Code call: a system-prompt file, a JSON schema for the output, an allow list and a deny list of tools. The model is Opus 5 at high effort. State lives in small JSON files: what was seen, which commit was reviewed, how many attempts a task has had. A guard timer watches the timers and shouts on Slack when one goes quiet.

## The reviewer

The reviewer is the oldest and the busiest. A Bitbucket webhook plus a five-minute poll, up to three pull requests in parallel. Every push gets a re-review, deduplicated by source commit, so an unchanged PR costs five seconds and exits. It reviews inside a worktree, so it can run the code rather than only read the diff. It writes in Turkish; the excerpt below is translated.

The week ending August 31st:

| | |
|---|---|
| Review rounds | 704 |
| Distinct pull requests | 108 |
| Verdicts | 77 approve, 627 request changes |
| Blocking findings tracked | 140, all 140 resolved before merge |
| Flips from request changes to approve | 27 |
| Findings by severity | 57 blocker, 157 major, 429 minor, 306 nit |

Two things in those numbers surprised me.

First, of the 627 request-changes verdicts, 358 were for process reasons and 269 for code. Process means the branch no longer merges cleanly into dev, generated artifacts were regenerated on both sides, or a branch-specific preview URL is still sitting in a Jenkinsfile. More than half of what blocks a merge here is hygiene, not logic. I would not have guessed that before the numbers existed.

Second, the resolution rate. Every blocking finding got fixed, because the reviewer carries unresolved findings forward. The Jenkinsfile URL showed up as a blocker in round after round, each time with the note "unresolved since the previous round", until someone reverted it. An agent that nags with a ledger beats an agent that is clever once.

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

The native approve or request-changes verdict is set under my account, not a bot account. The responsibility for a merge stays with a person.

## The scanner

Every four hours, 845 times so far, plus 65 daily recaps. It is read-only by construction. It holds read tokens for the monitoring and CDN APIs during collection only, never the cache purge token, never repository credentials. A lock makes sure a slow run and the next scheduled run cannot overlap and fight over the same state.

The useful part is memory. Every alert gets a slug and the agent tracks it across runs. Some are known and accepted; the report says so and moves on, with a counter. "129th day blind" for a set of database exporters nobody has fixed. "99th consecutive run at ceiling" for an autoscaler stuck at its maximum. A counter that climbs in a report you read every morning applies a different kind of pressure than a dashboard nobody opens.

It also tells you when to stop worrying. On September 1st the search page's p95 went 603 ms, then 560, then 503, and the recap noted it was back inside the 500 to 550 band the knowledge base defines for that page and closed the alert. The alert count fell from 38 at noon to 11 at 20:00, and the day still ended RED, because the recap ranks by severity and not by volume.

I did not expect the scanner to be the one that finds billing problems. It was.

## The QA tester

This is the one I built last and the one I am most careful with, because it writes to Jira and it can move a task backward in someone's sprint.

The flow, per task in the Test column:

1. Find the pull request and its head commit.
2. Prove that the head is what is actually running in the preview environment. The Jenkins build's revision, the PR head, the image tag on the running pod and the build number all have to agree, and the rollout has to be complete. If they disagree there is no measurement. The job may trigger a build, at most twice per head and thirty minutes apart, then it gives up and tells Slack.
3. A manager pass writes a brief: which files the PR touches, which other tasks in Test touch the same files, and the lessons file described below.
4. The QA agent logs into the preview with a test account, opens the same pages on the preview host and on a control host that runs the current dev image, and measures both with Playwright. Screenshots, DOM checks, HTTP codes, byte counts, timings in repeated runs.
5. It writes a comment, screenshots and a verdict as files. Nothing else.
6. The process validates the files. Every screenshot referenced in the comment exists, every file is referenced, no two screenshots share a checksum, and the verdict cannot be PASS or FAIL if the gate in step 2 was not open.
7. Only then does the process post the comment with the screenshots embedded and move the task: PASS to UAT, FAIL to BugFix, unmeasurable stays where it is.

Step 6 is there because a comment that references a screenshot that was never taken, or attaches the same screenshot twice under two names, would look like fraud to the developer reading it. The checks are cheap and I would rather not learn how often they fire.

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

### Does headless match a human-driven round?

Before letting this near a timer I ran the same three tasks both ways: once as a manual round where I drive subagents and post the results myself, once headless. Same model, same brief.

| | Manual | Headless |
|---|---|---|
| Verdict | FAIL, FAIL, FAIL | FAIL, FAIL, FAIL |
| Primary reason | | same on all three |
| Root cause | | same on all three |
| Screenshots per task | 18 to 23 | 12 to 17 |
| Minutes per task | 33 to 81 | 34 to 75 |

One of the three was a layout task. Both runs found the page's scrollHeight changing nineteen times inside a single frame and the scroll position drifting by 44 pixels, and both traced it to a 200 millisecond padding transition. Another was a frontend fix whose own new test passed on the branch and failed on dev because of class ordering, and both runs noticed that CI does not run Jest at all, so the green check meant nothing. The differences were secondary. The manual round sometimes splits one finding across two criteria, and it takes more screenshots.

An hour per task is long, and most of it is measurement. One reflow criterion alone was 21 runs per side, because the box is shared with the reviewer and the numbers are noisy. Verdicts are made on counts, bytes, hashes and HTTP codes, with milliseconds as supporting evidence only.

Today's round was five tasks. Two went to UAT with evidence attached. Three went back to BugFix with a comment that names the file and the line.

## What went wrong

These are the parts I would want to read in someone else's post.

**A dry run triggered a real build.** The dispatcher's dry-run mode correctly skipped every Jira write, but the helper it calls to start a Jenkins build had no dry-run flag of its own. The build ran and the helper posted its usual "build started" notes to the PR and the task. Nobody was harmed, and a developer got a build they did not ask for. The helper has a dry flag now and the child passes it whenever posting is off.

**A pkill killed the wrong thing.** While replacing a watcher script I ran pkill with the script's name as the pattern. The pattern matched the shell I ran it from, which died. The old watcher survived and two minutes later started a dry dispatcher run on the two tasks then in Test, while a manual run on one of them was already in progress in the same folder. I noticed because two agents were writing screenshots into the same directory. I killed the duplicate, kept the manual one, and added the folder-per-head rotation that should have been there from the start.

**Structured output is not guaranteed.** One replay came back with the verdict as prose in the result field and no structured object at all. The child treated it as a parse failure and exited. Extraction now tries three sources in order: the structured output, JSON inside the result text, and a verdict file the agent writes to disk. The file is the one that has never failed.

**I edited a running script.** The fix above went in while a child process was mid-run. Bash reads scripts incrementally, so editing one in place can corrupt the running job. It did not, by luck. I already had a rule for this, write to a temp file and mv it into place, and I skipped it because I was in a hurry. Rules you skip under time pressure are the ones that matter.

## The lessons file

The agents do not learn between runs. Every session starts blank. What carries over is a text file, fourteen entries as of today, each in the form "which task, what happened, what the rule is". The manager pass hands it to every QA agent. A few, translated:

- "Code not found in any repository" is not a FAIL reason. Scan wider first. If it is still not found, the verdict is unmeasurable.
- The developer's own "PASS, verified, byte-identical" table is not evidence. Every number gets reproduced. "Could not reproduce" and "fixed" are not the same thing.
- On a backend task, a pod running an image built after the fix was merged can still contain an older core jar bundled inside it. Pull the jar from the pod and check the bytecode before measuring behaviour.
- The control host can be behind the tip of dev. Separate the effect of the fix from an intervening merge with git merge-base before calling an A/B difference a regression.
- The test cluster cannot reach the CRM. Corporate-member updates return 500 there with a connect timeout. Known environment limit, not a finding. Measure the personal-member path instead.

Each of those cost at least one wrong verdict before it was written down. The last one sent a task back to BugFix for nothing. That is the ratchet. The agent is not getting smarter, the file is getting longer, and the file is the thing I would keep if I had to throw everything else away.

## Where it stands

The reviewer and the scanner have run unattended for ten weeks. The QA timer is still disabled. The dry runs match the manual rounds, the safety is structural, and the posting path has been exercised through the manual finalizer five times without incident. What remains is me deciding to let it move tasks on a sprint board while I am asleep. I have not done that yet. When I do, the first week will be supervised and the manual rounds stop, because two testers on one task is how you get two verdicts.
