---
layout: post
title: "Too Good to Be True"
date: 2026-10-19
category: blog
tags: [ai-agents, qa, web-performance, core-web-vitals, inp, verification, release-engineering, engineering-leadership]
description: "Four days, nine pre-production releases and one performance package at Emlakjet with a coding agent as release engineer, QA lead and performance analyst: what it measured, what it fixed, and the numbers I had to stop believing."
---

On Sunday afternoon the agent reported that the photo gallery on our listing page now opened in 0.84 seconds instead of 4.2.

The gallery is the worst interaction we have. In the field data, a tap on the main listing photo is the slowest thing a phone user does on Emlakjet. A five-fold improvement from a change that was not even aimed at the gallery was the best number of the week. It was also wrong. The real gallery, measured the way the user sees it, had become almost three times slower, and the change was reverted before it reached anyone.

That number is the reason for this post's title. The rest of the post is the four days around it: a release that had to be tested from scratch, a performance package that had to beat the previous one by ten points, and a working loop where the agent did the measuring, fixing and deploying, and I did the believing.

[In September](https://doksanbir.blog/three-agents-on-one-devbox.html) the agents worked queues. [In October](https://doksanbir.blog/the-agents-joined-the-chat.html) they joined the chat. This one is a single long session: one coding agent, a few dozen subagents under it, and me, through a release.

## The starting point

On October 16th I found out that production was not where I thought it was.

The deploy repository said v2.2.10. The pods said v2.2.4. Our continuous delivery tool had the production apps out of sync, and if anyone had pressed sync, somewhere between 600 and 730 commits would have gone live at once. The crawl agent noticed first. The release agent confirmed it three ways: the running image tags, the chart values and the sync status.

So the job became: take everything that had piled up on the dev branch since v2.2.4, test it as if nothing had been tested, fix what was broken, and make it faster while we were at it. The product is a real-estate marketplace. The pages that matter most are the listing pages: a category, a city, a district, a neighbourhood, filters on top, page two. Trabzon had to be in every measurement next to Istanbul, Ankara and Izmir, because a city with a smaller listing pool is where cache misses and slow backends show.

The targets for the performance part:

- PageSpeed Insights mobile score ten points above v2.2.14.
- Interaction to Next Paint (INP) under 200 ms at the 75th percentile on mobile, ideally under 50.
- Nothing visibly broken.

The field data at the start: INP at p75 was 233 ms across the origin, 333 on the home page, 341 on the main listing page and 238 to 282 on city pages. In July and August it had been 811. Real PageSpeed scores on mobile were 74 for the home page, 39 to 53 for listing pages, and 48 for a listing detail.

## Who did what

The agent ran in one terminal session on the devbox. It had the repository, a browser farm, the CI server, read access to the clusters, write access to pre-production deploys, and the issue tracker. It spawned subagents for anything that could run in parallel: test groups, measurement lanes, root-cause investigations.

What it did: wrote and ran tests, triaged failures, wrote fixes in separate worktrees, opened pull requests, built previews, cut release tags, started CI builds, waited for the rollout, banned the pre-production cache, measured, and wrote everything into one living report page.

What I did: merged every pull request, decided what went into a release, tested on my own phone, and asked "are you sure?" more often than I expected to.

In four days that loop produced nine pre-production releases, v2.2.10 to v2.2.18, and one production hotfix. Production stayed on v2.2.4.1 the whole time, deliberately, because the frontend has to go live together with a backend-for-frontend version that was not ready.

## Testing a release nobody trusted

The first day was about breadth. The agent split the release into layers, each meant to catch what the previous one could not.

**A deterministic end-to-end suite.** 67 Playwright tests across three browser engines and three device sizes, written two weeks earlier against an older dev branch, plus 79 new scenarios added that week. Before running anything, a subagent compared every test with the current code and fixed 14 test files that were testing the old behaviour. On the first full run against pre-production, 846 runs passed and 143 failed. Triage sorted the failures: roughly 60 were tests that did not know about a deliberate change in the mobile filter drawer, about 40 were known product bugs, 13 were real regressions, and about 18 were new product bugs. On v2.2.13 the same suite ran 1,058 times with 995 passes and no product bug among the five failures.

**Agentic journeys.** A second model was given goals, not steps: find a flat in a district with three rooms under a price, open it, come back. It chose its own path on seven device profiles. Every claim it made was re-run as a plain Playwright script before it counted. Sixteen claims did not reproduce and were dropped.

**A sweep with refuters.** Eleven areas, each tested visually and functionally by its own agent, with a second agent trying to refute every new finding against production. Only 22 of 89 agents returned before the session limit stopped the rest. I count it as a partial run, not a pass.

**SEO and page source.** 95 URLs, each fetched from three hosts (pre-production, the SEO pods, production) with three user agents (a browser and two Googlebots). Googlebot and the browser get the same HTML. The raw HTML of a listing page went from 1,153 KB to 560 KB.

**User flows with screenshots.** On v2.2.14, 71 flows, 130 runs, 869 steps, each step a screenshot in a storyboard, including publishing three real test listings on pre-production and editing one.

Two findings from that week explain why all of this was needed.

**A fix that fixed nothing.** One of the first fixes for the mobile drawer was "verified" by unit tests, type checks and lint. No preview was opened. (Another branch for the same bug, `LMS-4930-device-back`, had a build of its own that day: our CI matched the "dev" in "device" and overwrote the shared test environment instead of creating a preview.) The end-to-end run on pre-production showed the bug still there. The fix had wired its logic into two navigation paths, and the drawer applied filters through a third one. The unit tests tested the paths the fix touched, which is exactly why they passed.

**404s nobody crawled.** On landing pages, all 81 links in the city list pointed at URLs that returned 404. It had been like that since v2.2.10. The crawl on day one did not catch it. The SEO pass on day two did, reading the page source of every page type.

Every fix for the first batch of bugs went into one branch and one commit, with a preview build that ran the whole regression set before it was merged. Nearly 30 fixes, 6,671 unit tests passing, and a preview checked by the same suites that had found the bugs.

## Measuring performance in a way I could argue with

The performance part needed a measuring setup I would trust before I trusted any result from it.

**Lighthouse lanes.** 23 URLs covering every page type, mobile and desktop, with third-party scripts blocked and allowed, alternating between production and pre-production so both sides see the same network and the same machine load. No load gate: an earlier version of the harness waited for the machine to be idle and spent more time waiting than measuring.

**INP scenarios.** Lighthouse does not measure interactions. 46 scripted taps: open the filter drawer, pick "3+1", tap a listing card, open the gallery, "read more" on a description.

**The field's own library.** Later in the week we injected Google's `web-vitals` library, the attribution build, into every page in Playwright. It is the same code our analytics uses in the field. It splits INP into input delay, processing time and presentation delay, and with the Long Animation Frames API it names the script that held the main thread.

All of it on an emulated Pixel 7 with the CPU throttled four times and a slow mobile network.

Then the package:

| Change | What it does | Lab result |
|---|---|---|
| Filter interactions | Filter picks and the mobile drawer paint first, then do the work | Drawer open 340 → 176 ms, filter pick 208 → 72 ms |
| Tag manager stub | The data layer and its start event are inline in the head | Tag manager start 1.8-2.8 s → 0.4-0.5 s, analytics events unchanged on 7 page types |
| Mobile ads | Ad slots initialise when they are a quarter of a viewport away, not one and a half | Listing pages +5-6 Lighthouse points, Speed Index 6.8 → 2.9 s |
| Backend for listing search | Project and trend calls in parallel, deadlines on slow insight blocks | Listing search faster on the backend, no frontend change |
| Top-loader bar | One line, explained below | Card tap INP 140 → 124 ms and 144 → 116 ms |

And the result on pre-production v2.2.17 against production, with the field library, all third parties allowed, three runs each, median:

| Page | LCP (ms) | INP (ms) |
|---|---|---|
| Listing, all of Turkey | 2312 → 1860 | 520 → 160 |
| City: Istanbul | 2468 → 1756 | 592 → 200 |
| City: Trabzon | 3084 → 2012 | 400 → 280 |
| District: Trabzon Ortahisar | 3804 → 1880 | 496 → 336 |
| District: Izmir Karşıyaka | 3168 → 1780 | 560 → 168 |
| Neighbourhood: Ankara Çankaya 100. Yıl | 2572 → 1968 | 392 → 160 |
| Filtered: Trabzon, under 5M, 3+1 | 2848 → 1812 | 496 → 208 |
| Page 2: Trabzon | 3252 → 1920 | 608 → 176 |

Largest Contentful Paint went from 2.3-3.8 seconds to 1.7-2.0 seconds on every listing page; all of them are now under the 2.5-second threshold. The one regression is a project detail page, +116 ms. Whether the PageSpeed target was met I will know from the field, not from this table.

## One line

The interaction I understood least was the listing card. Tap a card, and the page starts navigating to the listing. Every navigation shows a thin progress bar at the top, and the bar was added to `<body>` and removed at the end.

Our stylesheet has a handful of `body:has(...)` rules. They let the page change its layout when something is open: a modal, a drawer, a sheet. `:has()` is a selector that looks down into the element's descendants. When a node is added anywhere under `<body>`, the browser has to check again whether `body` still matches, and on a listing page that check is not small. The agent measured 7 to 9 ms of style recalculation per navigation on a throttled phone, just for the bar coming and going.

The fix mounts the bar on `<html>` instead. A fixed-position bar looks the same from either parent, and nothing under `<body>` changes. Style recalculation dropped to 1 to 3 ms. A separate test agent of mine, run on the preview from another account, measured the card tap at 140 → 124 ms and 144 → 116 ms, with a pixel diff of zero apart from one floating button.

I asked whether we should then remove the `body:has()` rules entirely. A second agent got twenty minutes and two flows, home to listing and card to detail, to find out. With the bar off `<body>`, the remaining rules cost nothing measurable: 4.5 ms of style work with them, 4.6 without. Removing the GPU layers on the cards would save 1 to 2.5 ms and break swiping through photos. We did neither. Sometimes the answer from a measurement is "leave it".

## Too good to be true

Back to the gallery.

The change behind it moved some state updates so that the browser paints the tap first and does the rest of the work afterwards. For the filter drawer that was the whole win. For the gallery the agent tried something stronger: render the gallery synchronously, inside the tap.

The measurement defined several outcomes per interaction. For the gallery: the moment the dialog is visible, and separately the moment a loading veil appears. The summary I was given took the earliest outcome that became true. The veil, a grey placeholder, now appeared much sooner. The gallery itself did not. The gallery component is loaded lazily, and a lazy component suspends on a synchronous render every time, so the placeholder painted first and the real gallery came one render later. With third parties blocked, the actual gallery went from 375 ms to 1,070.

I did not find that by reading code. I found it because 4.2 seconds to 0.84 was too large a jump for a change that was not about the gallery, and the next table had a column where the "fix" was worse than the base. I asked the agent to explain the numbers instead of summarising them. The change was reverted. The final code leaves the gallery exactly as it was, confirmed over 20 runs per side. The gallery still needs real work: the lightbox has to stop being lazily loaded, and that is its own task.

In the same table the gallery's INP had gone from 460 to 572 ms, and the agent had called it "noise". It was not noise; it was the same regression seen from another angle.

A third version of the same mistake came from the opposite direction. The first run with the field library showed INP above 200 ms on Ankara, Izmir and Trabzon. Was the package not working on the smaller cities? Every one of those runs had the same shape: almost all of the time was input delay, the gap before the browser even starts handling the tap. The test machine was busy with another measurement. Re-run on a quieter machine with Long Animation Frames attribution, all 24 runs on city and district pages were between 96 and 192 ms, and there was no difference between cities.

Three different errors, one pattern. An agent produces numbers faster than I can doubt them, and a summary is the most dangerous place for a number. The rule I now apply: any improvement larger than the change could plausibly cause gets its raw data and its definition read before it is reported, and any result driven by input delay is re-run before it is believed.

## What headless browsers cannot see

On Sunday evening, after v2.2.16 was on pre-production, I opened the filter drawer on my phone. Half of the rows were empty. Price, Rooms, Size, Building Age: the divider lines were there, the content was not. Scrolling the drawer by one pixel drew them.

Every test of the drawer had passed. The visual test compared the final frame pixel by pixel, on a filmstrip, four recordings out of four. All of it headless.

The cause was two changes, three days apart, that were each fine alone. On October 15th a change added `content-visibility: auto` to the drawer rows, a CSS hint that lets the browser skip rendering elements that are off screen. It saved about 8 ms when the drawer opened. In this package, the drawer became a fixed overlay that slides in from off screen. On a real phone the slide runs on the compositor, outside the main thread, and when it ends the browser does not go back to check whether the skipped rows are now visible. In headless Chromium the animation runs on the main thread, everything is re-evaluated each frame, and the rows render. The agent could not reproduce it in headless Chromium, headless WebKit or Chromium with a real compositor.

The fix was to delete the rule and add a test that fails if it comes back. I checked the preview on my phone before it was merged, and v2.2.17 took the fix to pre-production the same evening.

The rule since then: any change to a drawer, a modal or an overlay is looked at on a real phone before it is merged. Headless is the regression net. It is not the eye.

## The 500 milliseconds after a tap

The field library showed one new number on pre-production: Cumulative Layout Shift between 0.044 and 0.088 on some listing pages, where production was 0. Below the 0.1 threshold, but new.

The agent first said the shift happened when the drawer closed. A per-step probe showed it happens when the drawer opens. After the slide-in animation ends, the drawer takes over the document scroll, and the list behind it moves down by 80 pixels. Nobody sees it; it is under the drawer. But the Layout Instability API excludes shifts within 500 ms of a user input, and the takeover now happens after the animation, more than 500 ms after the tap. In v2.2.14 the same takeover happened inside the tap and was excluded. The same shift, a few hundred milliseconds later, became a metric.

The fix is to hide the list before the takeover. It has to be in before production.

## Who is holding the main thread

With the package on pre-production, our own code is a small part of what a tap waits for. Long Animation Frame attribution, summed over the 24 quiet runs:

| Script | Main-thread time |
|---|---|
| Tag manager click listener | 295 ms (8-22 ms per tap) |
| An ad network's conversion pixel, click listener | 131 ms (7-9 ms per tap) |
| Push notification SDK | 91 ms (one task) |
| Two more ad and recommendation scripts | 31 ms |
| Our code | 7 ms |

The way to 50 ms INP goes through the tag manager's click triggers and the vendor tags behind it. In the field the gallery is worse: of an 1,824 ms interaction, 1,734 ms was input delay, most of it third-party scripts. Delaying vendor tags gave +6 to +10 PageSpeed points on listing pages in our measurements, with analytics still in place. That is not an engineering decision. It belongs to marketing and to whoever owns the tag manager, and the report says so instead of quietly changing a trigger.

## The release as a script

The release mechanics are the least interesting part of this post, and the part that took the most of my attention before it was automated.

A release is a pull request from dev to master. After I merge it, the agent puts three tags on the merge commit (web, SEO pods, panel), triggers a scan and a build on two CI jobs, waits, staggers the third build by four minutes because two builds pushing to the chart repository at the same time make one of them fail, waits for the deploy tool to roll out the three pre-production deployments, bans the pre-production cache, and opens three pages to see they answer. Today that is a script that starts waiting the moment the pull request is open and does everything after my merge on its own: v2.2.18 went from merge to banned cache in 27 minutes without anyone touching it.

Getting there had its own errors. The agent once waited for the SEO pods to roll out before starting a measurement that only needed the web pods. It once set a git hook path in a worktree, which wrote into the configuration of the shared clone, and the next tag push failed on a missing tool. A commit header came out at 101 characters against a limit of 100, because the hooks that would have caught it were not running in that worktree. Each of these cost minutes, and each one was a release step that was correct in the agent's model of the repository and wrong in the repository.

## What went wrong

**The best number of the week was a definition error.** The gallery result took the earliest outcome of an interaction as its headline, and the earliest outcome was a placeholder. I caught it because it was implausible, not because a check flagged it.

**A visual bug passed every visual test.** The drawer rows were empty on every real phone and on no headless browser. It reached pre-production twice before I opened the drawer on my phone.

**Risks were reported in a way that hid what they meant.** On one pull request the agent listed "the ad box is clipped at 280 pixels" as a risk. It is the design: the box was deliberately fixed at 280 pixels and tested many times, and only creatives taller than that are cut. On another, the agent noted in the pull request that the drawer's footer button now slides in with the drawer, but did not say it to me before I merged. A filmstrip later showed the final frame is pixel-identical. Both were true. Neither was said in a way that let me act on it at the right time.

**A summary is not a measurement.** "Noise", "machine load", "after back" instead of "at open": each was a sentence written ahead of the data. Each was corrected by going back to the data.

## Where it stands

Pre-production runs v2.2.18. Listing pages load their largest element in under two seconds on a throttled phone with every third-party script running, and the tap that used to wait half a second now waits 100 to 200 ms. The work left before production: the layout shift fix, a lazily loaded Street View on the listing detail (backend and frontend pull requests open), and the backend version that has to go live with the frontend. The page-type measurement against v2.2.14 is still running, and the field will have the last word.

What I do by hand: merge, decide what goes into a release, look at the phone, and read the raw numbers behind any result that makes me happy.

What is not solved: 50 ms INP is a third-party question we have not asked yet. The gallery is still our slowest interaction. And the measurement layer, the part I trusted to tell me the truth, needed the same doubt as the code it measured.

The agent made this week possible. A person doing it alone would have run a fraction of the tests and shipped a fraction of the releases. But the week's most useful sentence was the one I said most often: that looks too good, show me where it comes from.
