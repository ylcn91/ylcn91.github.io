---
layout: post
title: "The Great Flattening"
date: 2026-03-07
category: blog
tags: [ai, great-flattening, engineering-leadership, future-of-work]
description: "Cheap AI assistance is compressing both the skill curve and the org chart, which reshapes teams, careers, and where talent still pays off."
---

## Table of Contents

1. [The Great Flattening: What Is It?](#section-1)
2. [The Skill Curve Before and After AI](#section-2)
3. [Knowledge Access Goes to Zero](#section-3)
4. [Organizational Flattening](#section-4)
5. [Average Becomes Dangerous](#section-5)
6. [The Talent Premium Shift](#section-6)
7. [The Solo Builder Economy](#section-7)
8. [What AI Does NOT Flatten](#section-8)
9. [A Developer World Example](#section-9)
10. [Enterprise Impact](#section-10)
11. [The Paradox](#section-11)
12. [Impact on CTO/Engineering Leadership](#section-12)

---

<a id="section-1"></a>
## 1. The Great Flattening: What Is It?

Two scenes, four years apart.

In 2022, a junior engineer hit a weird deadlock, opened twelve tabs, found three contradictory blog posts, pinged a senior, and lost half a day. In 2026, that same engineer asks an agent to explain the lock graph, point at the likely transaction boundary, draft the patch, generate tests, and summarize the tradeoffs.

The junior did not become Staff overnight.

But the old distance between junior and senior just got kneecapped.

What we are watching is a compression of the performance distribution in knowledge work, and **The Great Flattening** is as good a name for it as any. The floor rises hard. The middle rises a lot. The ceiling rises a little, or sometimes barely at all. At the same time, the org chart flattens too, because once research, first drafts, status synthesis, and routine coordination get cheap, companies need fewer humans whose main job is moving information around. That combined pattern is what the recent productivity studies and org-structure forecasts are pointing toward.

As far as I can tell, there is no single sacred tablet where this phrase was first carved. It looks more like a meme that escaped containment during 2025. Korn Ferry ran with "The Great Flattening Experiment" in March 2025, Betterworks described the movement in June 2025, TechTarget framed it as a broad workplace trend in October 2025, and SHRM was still using the term in February 2026. Gartner then put harder numbers behind the idea, predicting that through 2026, **20% of organizations will use AI to flatten their structures and eliminate more than half of current middle-management positions**.

**Why now?**

Because three curves crossed at once. Model capability jumped. Model cost collapsed. Enterprise adoption stopped being a pilot program with a slide deck and became operating reality. Stanford's 2025 AI Index found GPT-3.5-level query costs fell from $20 per million tokens in November 2022 to $0.07 by October 2024, a drop of more than 280x. The same report found organizational AI use rose from 55% in 2023 to 78% in 2024, while generative AI use in at least one business function jumped from 33% to 71%. Microsoft's 2025 Work Trend Index, based on 31,000 workers across 31 countries, says 82% of leaders see this as a pivotal year to rethink strategy and operations, and 81% expect agents to be integrated into their AI strategy within 12 to 18 months.

> AI is flattening two curves at once: the org chart and the skill curve.

This is less a story about AI replacing every developer and more a story about AI turning competence into cheap infrastructure. The second one has much bigger consequences.

---

<a id="section-2"></a>
## 2. The Skill Curve Before and After AI

I have been watching this in the papers, product launches, and rollout reports for months. The old productivity curve in software felt like an RPG with a brutal level grind. The weakest developer struggled to ship. The average developer shipped eventually. The top developer looked supernatural.

Think of the old and new curves like this:

| Era | Worst dev | Average dev | Top dev | Gap (top to bottom) |
|-----|-----------|-------------|---------|---------------------|
| Before AI | 1x | 3x | 10x | 10x |
| After AI | 5x | 7x | 10x | 2x |

This is a cartoon, not a universal benchmark. The exact ratios vary by task. **The direction is the point.** Lower and mid performers are getting disproportionately larger gains from AI assistance, while top performers often gain less and sometimes not at all.

The cleanest explicit evidence comes from Shakked Noy and Whitney Zhang. In a preregistered experiment with 453 college-educated professionals doing realistic writing tasks, ChatGPT reduced time by 0.8 standard deviations and increased output quality by 0.4 standard deviations. Their most important sentence is the one people skip: **inequality between workers decreased because the tool benefited lower-ability workers more and compressed the productivity distribution.** That is flattening in plain English.

Brynjolfsson, Li, and Raymond found the same pattern in a live workplace. They studied 5,172 customer-support agents at a Fortune 500 company and found AI assistance increased productivity by 15% overall. Less skilled and less experienced workers improved by 30%. Agents with only two months of tenure, when assisted by AI, performed as well as unassisted agents with more than six months of tenure. Lower-skill agents also began communicating more like high-skill agents. The tool did not just speed them up. **It transferred behavior.**

The BCG-Harvard field experiment with 758 consultants told the same story from another angle. On tasks inside AI's capability frontier, consultants with GPT-4 completed 12.2% more tasks, finished 25.1% faster, and produced results more than 40% higher in quality. The biggest gains went to people below the average performance threshold, whose scores rose 43%, versus 17% for those above average. Microsoft's three field experiments with 4,867 software developers also found less experienced developers adopted AI coding assistants more and got larger productivity gains.

So yes, the bottom rises dramatically. The top often moves less because there was less waste to remove in the first place.

The basement is getting filled with concrete.

---

<a id="section-3"></a>
## 3. Knowledge Access Goes to Zero

The key economic move here is simple. **The marginal cost of expertise is falling toward zero.** Karim Lakhani put it bluntly: we now have individuals working with AI who can be as effective as entire teams without it, and the real question is whether AI is pushing the marginal cost of expertise down toward zero. Microsoft's Work Trend Index makes the same point with the phrase "intelligence on tap" and describes it as abundant, affordable, and available on demand.

That phrase matters because the economics changed faster than most org charts did. Stanford found the cost of GPT-3.5-level capability dropped more than 280x in roughly 18 months. It also found that models got dramatically smaller for the same general benchmark performance, with the smallest model above 60% on MMLU shrinking from 540 billion parameters in 2022 to 3.8 billion in 2024, a 142-fold reduction. Capability is spreading while cost is melting. That is what "access goes to zero" looks like in practice. Not literally free, but close enough to change behavior.

For developers, that means the old tax on knowing things is collapsing: research, debugging, code generation, documentation spelunking, migration strategy, test scaffolding, first-pass system design. AWS says Amazon Q is already used for testing, debugging, understanding existing code, finding vulnerabilities, and implementing features, while the Stack Overflow 2025 survey found 84% of respondents are using or planning to use AI tools in development and 50.6% of professional developers report using them daily. Early-career developers were even more likely to use them every day, at 55.5%.

A junior engineer can now ask for the kinds of checklists, pattern libraries, and failure-mode reminders that used to live in the heads of people with 10 or 15 years of scar tissue. Not the scar tissue itself. The mental tools.

The mechanism is unglamorous: best-practices distribution. Brynjolfsson and colleagues found low-skill support agents began communicating more like high-skill agents after AI assistance. The P&G "cybernetic teammate" work found employees less familiar with product-development tasks reached performance comparable to more experienced colleagues when AI joined the workflow. In other words, AI is increasingly acting like an always-available memory layer for good patterns.

> Knowledge access going to zero does not mean judgment goes to zero. That bill still comes due.

---

<a id="section-4"></a>
## 4. Organizational Flattening

The skill curve is flattening, so the org chart follows.

```
Old: VP → Director → Staff → Senior → Mid → Junior
New: 1 tech lead + 4-6 AI-augmented engineers + AI agents
```

That sketch is not universal, but the directional move is already public. Gartner predicts that through 2026, 20% of organizations will use AI to flatten their structures, eliminating more than half of current middle-management positions. Amazon told each s-team organization to increase the ratio of individual contributors to managers by at least 15% and said explicitly that fewer managers would remove layers and flatten the org.

Why does this happen? Because a lot of management work is really **information logistics**: status rollups, scheduling, work tracking, first-pass reporting, performance monitoring, routine oversight. Gartner says AI can automate and schedule tasks, reporting, and performance monitoring, increasing remaining managers' span of control. Betterworks describes the same trend as AI taking over more routine oversight, making flatter structures easier to justify.

You can already see the span widening. Gallup reports that the average number of people reporting to managers in the U.S. increased from 10.9 in 2024 to 12.1 in 2025, a nearly 50% increase since Gallup first measured in 2013. That is not just a chart moving; it is a managerial metabolism changing.

There is a catch, and it is not a small one. When you flatten too hard, you can accidentally rip out the apprenticeship layer. Gartner explicitly warns that eliminating middle managers can leave remaining managers overwhelmed and can break mentoring and learning pathways, with junior workers suffering from the loss of development opportunities. **This is the dirty secret of AI flattening: it can improve throughput today while poisoning the senior pipeline you need tomorrow.**

---

<a id="section-5"></a>
## 5. Average Becomes Dangerous

My hot take is that the scariest person in the next five years is not always the top 0.1% engineer.

It is the dead-average operator with solid judgment, decent taste, and an AI stack wired into daily work.

**That person can move with absurd force.**

The BCG-Harvard study on consultants is the cleanest snapshot of this. On realistic consulting tasks that were inside AI's capability frontier, GPT-4 users completed 12.2% more tasks, worked 25.1% faster, and produced results that were more than 40% higher in quality. The below-average performers got the biggest jump, improving 43% versus 17% for above-average peers. That is not a small bump; it is the middle of the bell curve turning into a problem for everyone still operating like it is 2022.

The software data points rhyme. Microsoft's field experiments across Microsoft, Accenture, and a Fortune 100 company found a 26.08% increase in completed tasks among 4,867 developers using an AI coding assistant, with less experienced developers adopting more and gaining more. The UK government's 2024 to 2025 trial of AI coding assistants found average self-reported time savings of 56 minutes per working day. Sixty-seven percent reported spending less time searching for information or examples, 65% reported faster task completion, and 56% reported more efficient problem solving.

Then you get the examples that sound fake until you read the source material. AWS says Amazon has already migrated tens of thousands of production applications from Java 8 or 11 to Java 17 with Amazon Q assistance, saving over **4,500 years of development work** and about $260 million in annual cost savings. Google's Sundar Pichai said in April 2025 that well over 30% of Google's checked-in code involved accepted AI-suggested solutions. Satya Nadella said roughly 20% to 30% of Microsoft code in repos was written by software, though even TechCrunch noted those percentages should be taken with caution because measurement is fuzzy.

This is why small teams suddenly look enormous. When research, scaffolding, boilerplate, and first-pass debugging get cheaper, the average employee with AI becomes operationally dangerous, and not because they became a genius. The old tax on being merely competent got slashed.

---

<a id="section-6"></a>
## 6. The Talent Premium Shift

I am going to say something controversial: the old 10x engineer story is not dead, but it is leaking.

On a lot of bounded execution tasks, the effective premium of the top person over the average person is compressing. In many day-to-day tasks, it now feels more like **2x or 3x** than 10x. Elite people did not get worse. AI standardized the middle.

The research keeps pointing the same way. Noy and Zhang found ChatGPT compressed the productivity distribution by helping lower-ability workers more. Brynjolfsson and colleagues found lower-skill and less experienced agents got the biggest boost, while higher-skill and more experienced workers saw little productivity change and even a small quality decrease among the most skilled. BCG found below-average consultants improved 43% versus 17% for above-average consultants. Microsoft's developer experiments found less experienced developers both adopted more and gained more.

But the premium did not vanish. **It moved.** The remaining giant gaps are in problem framing, system architecture, product intuition, tradeoff selection, sequencing, and scaling decisions. Stanford's AI Index says complex logical reasoning and planning remain unreliable for LLMs. The same report says AI agents can dominate humans on short-horizon tasks with a two-hour budget, yet humans beat them two-to-one when the horizon stretches to 32 hours. METR's 2025 study of experienced open-source developers on their own repositories found AI tools made them **19% slower**, which is a brutal reminder that dense context and real ownership are still hard problems.

So the talent premium is shifting from raw execution to **leverage design**. It is less about who can hand-write the cleanest boilerplate under fluorescent lights and more about who can choose the right problem, define the right boundary, kill the wrong project, and orchestrate humans plus agents without creating a distributed garbage fire.

There is also a market consequence. SignalFire's 2025 State of Tech Talent report found that new graduates now make up just 7% of Big Tech hires, with new-grad hiring down 25% from 2023 and more than 50% from pre-pandemic 2019 levels. Firms are quietly deciding that many apprenticeship tasks can be done by AI or by smaller senior-heavy teams. That makes the market harsher for juniors even while AI makes each individual junior more capable. Brutal, but coherent.

---

<a id="section-7"></a>
## 7. The Solo Builder Economy

One person plus AI is not literally a ten-person team in every situation, but as a direction of travel it is real enough to bet a career on.

Microsoft's interview with Karim Lakhani summarizes the emerging pattern cleanly: individuals working with AI can be as effective as entire teams working without it. The related P&G research found individuals with AI produced ideas equal in quality to a two-person human team without AI, while full teams with AI produced the best results.

That is why the solo builder economy is exploding. Replit said in September 2025 that its annualized revenue went from $2.8 million to $150 million in less than a year, alongside a user base of more than 40 million. Lovable said in December 2025 that more than 100,000 new projects are being built on the platform every day, that it crossed 25 million total projects in its first year, and that Lovable-built sites and apps saw half a billion visits in the prior six months. These are company-reported numbers, not neutral census data, but the scale is still hard to ignore.

Small headcount, huge output is no longer rare theater. Bloomberg reported that Cursor, with about 60 employees, hit $100 million in annualized revenue by January 2025, and CNBC reported that Windsurf reached $50 million in annualized revenue within months of launching its code-generation product. Microsoft's 2025 Work Trend Index also surfaced examples of a solo founder targeting $2 million in annual revenue and a five-person startup called ICG using AI across its workflow to improve margins by 20%.

The enterprise examples are just as telling. Lovable says one ERP-related project that had required four weeks and 20 people became a four-day sprint with four people, and that 75% of the front end was generated directly through the tool. Another customer example cut design concept testing from six weeks to five days, with one product manager building a prototype in 30 minutes that would previously have taken three months. Deutsche Telekom says the platform reduced some development cycles from weeks or months to days. These are vendor and customer claims, not pristine lab results. But they line up with everything else we are seeing.

The bottleneck for a new software business is moving fast, away from the ability to produce code and toward the ability to find demand, shape a useful product, and get distribution.

**Code is getting cheap.**

**Attention is not.**

---

<a id="section-8"></a>
## 8. What AI Does NOT Flatten

> AI does not remove expertise. It removes the cost of incompetence.

That line is the cleanest way I know to say it. AI is very good at erasing certain kinds of obvious weakness: blank-page paralysis, boilerplate generation, first-pass research, syntax recall, test scaffolding, documentation lookup, and common debugging patterns. It is much less good at choosing the right market, defining the right system boundary, deciding where *not* to abstract, or knowing which ugly compromise your company can live with for the next three years.

The evidence for the limit is strong. Stanford's AI Index says complex reasoning and planning remain unreliable, especially when problems get larger than the distributions models were trained on. The same report says AI agents can outperform human experts in short time-horizon settings, but humans pull ahead decisively on longer horizons. BCG's consulting study found that on tasks *outside* AI's frontier, AI users were 19 percentage points less likely to produce correct solutions. METR found experienced open-source developers were 19% slower with AI on their own repos. That is the jagged edge of reality.

On long-horizon projects, many agents still have the attention span of a golden retriever at a squirrel convention. Nobody should stop using them. The trap is mistaking speed for comprehension.

This is also why taste and product sense keep their premium. AI can generate ten onboarding flows before lunch. It still cannot reliably tell you which one users will trust, which one your brand can sustain, and which one will explode support volume three weeks after launch. Strategy, distribution, and judgment remain stubbornly human problems in any serious company today.

---

<a id="section-9"></a>
## 9. A Developer World Example

Let me make this painfully concrete. Take one medium-sized feature in a real product team. Not moon-landing stuff. Just a feature with annoying edge cases, existing code, tests, and a few haunted abstractions from 2019.

```
Before AI
- Research / codebase discovery: 3 days
- Implementation:                2 days
- Debugging / cleanup:           1 day
= 6 days

After AI
- Research / codebase discovery: 30 minutes
- Implementation:                1 day
- Debugging / cleanup:           1 day
= ~2 days
```

That is illustrative, not a universal stopwatch. But the shape matches the data. The UK government trial found 67% of users spent less time searching for information or examples, with average self-reported savings of 56 minutes per day. GitHub's controlled Copilot experiment found developers completed an HTTP server task 55.8% faster. Microsoft's larger field experiments found a 26.08% lift in completed tasks. The part that compresses least is debugging and verification, which is exactly where METR's study reminds us experts can even get slower when the codebase is deep and familiar.

Now comes the subtle point. This time compression applies to almost everyone. The senior engineer still has better instincts about failure modes, cleaner abstraction choices, and a better sense of when the agent is lying with confidence. But if both the junior and the senior get the same collapse in research time and first-draft time, the visible delivery gap between them narrows. **The skill gap does not vanish. The speed gap compresses.**

A 2026 terminal session now looks more like this:

```bash
$ agent "Trace the checkout flow. Find likely race conditions around coupon
refresh, propose the smallest safe fix, update tests, and summarize risks."
```

There is nothing magic about it. It is a new default interface to accumulated knowledge. The developer still needs to verify the answer. The expensive part is that they no longer need to start from ignorance.

---

<a id="section-10"></a>
## 10. Enterprise Impact

Take a classic big-tech product team from the last decade. Call it twelve humans in 2015. Now project forward and make the sketch deliberately blunt:

```
Amazon team 2015 → 12 people
Amazon team 2030 → 4 people + AI
```

That is not a leaked Amazon org chart. It is a model of where enterprise execution is going. Amazon publicly told major groups to raise the ratio of individual contributors to managers by at least 15%. Gartner predicts 20% of organizations will use AI to flatten their structures through 2026 and eliminate more than half of current middle-management roles. Gallup's data show spans of control are already widening. Meanwhile, Amazon says AI-assisted code transformation helped migrate tens of thousands of production applications and saved over 4,500 years of developer work.

The enterprise implication is straightforward. Fewer layers. Smaller execution pods. More AI doing the research, first drafts, migrations, status synthesis, and low-level coordination. Faster product cycles follow almost mechanically when the slowest stages of the loop get compressed. Google's CEO said well over 30% of Google's checked-in code now involves accepted AI suggestions, and Microsoft's CEO has said roughly 20% to 30% of Microsoft code in repos is AI-generated, with caveats on measurement. Those are not side experiments. Those are operating signals.

The danger is that leaders read this and think the answer is merely "less people."

**That is lazy thinking.**

The real shift is toward smaller teams with much higher leverage and much higher blast radius. When one team can ship four times faster, bad architecture also compounds four times faster. Enterprise speed without architectural discipline is just a more efficient way to create very expensive nonsense.

---

<a id="section-11"></a>
## 11. The Paradox

The weirdest part of this whole moment is that AI is doing two things at once.

**First**, it is flattening the distribution. Noy and Zhang found explicit compression of worker productivity variance. Brynjolfsson and colleagues found lower-skill workers benefited more and started behaving more like higher-skill workers. The P&G research found less familiar employees could perform at levels comparable to experienced colleagues when AI joined the workflow.

**Second**, it is feeding a superstar economy. The same P&G work found teams with AI were three times more likely to produce ideas in the top 10% than individuals without AI, and Lakhani's broader framing is that individuals with AI can rival teams without it. Microsoft's Work Trend Index also surfaced examples of a solo founder targeting $2 million in annual revenue and a five-person startup using AI across the business to improve margins by 20%.

So both statements are true. Average people become much more productive. The best people become violently more leveraged. **Competence gets commoditized. Ambition gets amplified.**

> AI is a variance compressor for execution and a leverage multiplier for ambition.

That is the paradox. One person with AI can now plausibly build things that once demanded a department. At the same time, lots of ordinary employees can now do work that used to require a stronger bench. Flattening and superstar dynamics are not opposites.

They are roommates.

---

<a id="section-12"></a>
## 12. Impact on CTO/Engineering Leadership

The old staffing model looked something like this:

```
Old model: 30 engineers + 3 EMs + 1 director
New model: 10 engineers + 1 staff engineer + AI agents
```

Again, that is a sketch. But the shape is real. Gartner says AI-driven flattening will remove large chunks of middle management in a meaningful share of organizations. Amazon is already pushing for higher IC-to-manager ratios. Microsoft says "every employee becomes an agent boss," and reports that 28% of managers are considering hiring AI workforce managers while 32% plan to hire AI agent specialists within the next 12 to 18 months.

The mistake is to read that and think engineering leadership matters less.

**It matters more. A lot more.**

AI still does not reliably choose the right architecture, the right abstraction boundary, the right sequence of migrations, or the right tradeoff between speed, resilience, and organizational cognition. Stanford's AI Index is explicit that complex reasoning and planning remain weak points. BCG showed people can become less correct outside AI's frontier. METR showed expert developers on their own codebases can become slower, not faster.

So the CTO job shifts away from headcount accounting and toward leverage design. The question stops being "how many engineers do we need to throw at this?" and becomes "what is the right human-agent ratio, where do we need hard review gates, what knowledge must remain institutional, and which decisions are too dangerous to delegate?" Agents are superb at chewing through bounded, well-specified work and reckless the moment you let them redesign the payment architecture unsupervised.

Leadership also has to defend the learning pipeline. Gartner warns that flattening can break mentoring pathways for junior workers, while hiring data already show firms pulling back on entry-level roles. If companies stop funding apprenticeship because AI makes juniors look instantly productive, they may wake up in five years with plenty of copilots and not enough captains. **Seniors do not spawn in the wild.**

---

My conclusion is simple. The floor is rising fast, and the ceiling still matters. The engineering org that wins is the one that understands the new shape of leverage: compressed execution, scarce judgment, fewer layers, stronger architects, faster loops. Blindly swapping people for agents does not get you there, and neither does ignoring AI out of professional nostalgia.

**The Great Flattening is real.**

The companies that grasp both halves of it will ship circles around the ones that only see cheaper labor.

---

## References & Sources

1. **Noy & Zhang (2023)**. "Experimental evidence on the productivity effects of generative artificial intelligence." *Science* 381(6654), 187-192. Preregistered experiment with 453 professionals; time fell 0.8 SD, quality rose 0.4 SD, and inequality between workers decreased. [[Science]](https://www.science.org/doi/10.1126/science.adh2586) [[SSRN preprint]](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4375283)

2. **Brynjolfsson, Li & Raymond (2025)**. "Generative AI at Work." *The Quarterly Journal of Economics* 140(2), 889-942. Study of 5,172 customer-support agents at a Fortune 500 company; productivity up 15% on average and 30% for the least skilled and least experienced. [[Oxford Academic]](https://academic.oup.com/qje/article/140/2/889/7990658)

3. **Dell'Acqua et al. (2023)**. "Navigating the Jagged Technological Frontier: Field Experimental Evidence of the Effects of AI on Knowledge Worker Productivity and Quality." *Harvard Business School Working Paper 24-013.* BCG-Harvard field experiment with 758 consultants; below-average performers improved 43% vs 17% for above-average. [[SSRN]](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4573321) [[HBS]](https://www.hbs.edu/faculty/Pages/item.aspx?num=64700)

4. **Cui et al. (2025)**. "The Effects of Generative AI on High-Skilled Work: Evidence from Three Field Experiments with Software Developers." *Management Science.* 4,867 developers across Microsoft, Accenture, and a Fortune 100 company; 26.08% increase in completed tasks. [[INFORMS]](https://pubsonline.informs.org/doi/10.1287/mnsc.2025.00535) [[SSRN]](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4945566)

5. **METR (2025)**. "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity." Experienced developers took 19% longer to complete issues on their own repos when allowed to use AI tools. [[METR]](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)

6. **Stanford HAI (2025)**. "Artificial Intelligence Index Report 2025." GPT-3.5-level query costs dropped more than 280x; organizational AI use rose from 55% to 78%; model size for equivalent MMLU performance shrank 142-fold. [[Stanford HAI]](https://hai.stanford.edu/ai-index/2025-ai-index-report)

7. **Microsoft (2025)**. "2025: The Year the Frontier Firm Is Born," Work Trend Index Annual Report. 31,000 workers across 31 countries; 82% of leaders see a pivotal year; 81% expect agents within 12 to 18 months. [[Microsoft WorkLab]](https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born)

8. **Gartner (2024)**. "Gartner Unveils Top Predictions for IT Organizations and Users in 2025 and Beyond." 20% of organizations will use AI to flatten structures, eliminating more than half of middle-management positions through 2026; same release warns about overloaded managers and broken mentoring pathways. [[Gartner Newsroom]](https://www.gartner.com/en/newsroom/press-releases/2024-10-22-gartner-unveils-top-predictions-for-it-organizations-and-users-in-2025-and-beyond)

9. **Gallup (2026)**. "Span of Control: What's the Optimal Team Size for Managers?" Average U.S. manager span of control rose from 10.9 in 2024 to 12.1 in 2025, a nearly 50% increase since 2013. [[Gallup]](https://www.gallup.com/workplace/700718/span-control-optimal-team-size-managers.aspx)

10. **AWS (2024)**. "Amazon Q Developer just reached a $260 million dollar milestone." Tens of thousands of production applications moved from Java 8/11 to Java 17, saving over 4,500 years of development work and about $260M annually. [[AWS DevOps Blog]](https://aws.amazon.com/blogs/devops/amazon-q-developer-just-reached-a-260-million-dollar-milestone/) Amazon's IC-to-manager ratio directive: [[About Amazon]](https://www.aboutamazon.com/news/company-news/ceo-andy-jassy-latest-update-on-amazon-return-to-office-manager-team-ratio)

11. **UK Government (2025)**. "AI coding assistant trial: UK public sector findings report." Average self-reported saving of 56 minutes per working day; 67% spent less time searching for information; 65% completed tasks faster; 56% reported more efficient problem solving. [[GOV.UK]](https://www.gov.uk/government/publications/ai-coding-assistant-trial/ai-coding-assistant-trial-uk-public-sector-findings-report)

12. **Stack Overflow (2025)**. Developer Survey, AI section: 84% using or planning to use AI tools; 50.6% of professional developers use them daily; 55.5% among early-career developers. [[Stack Overflow]](https://survey.stackoverflow.co/2025/ai)

13. **SignalFire (2025)**. "The SignalFire State of Tech Talent Report - 2025." New grads are 7% of Big Tech hires, down 25% from 2023 and over 50% from pre-pandemic 2019 levels. [[SignalFire]](https://www.signalfire.com/blog/signalfire-state-of-talent-report-2025) [[TechCrunch]](https://techcrunch.com/2025/05/27/ai-may-already-be-shrinking-entry-level-jobs-in-tech-new-research-suggests/)

14. **Korn Ferry (2025)**. "The Great Flattening Experiment," *Briefings* issue 68, March 2025. [[Korn Ferry]](https://www.kornferry.com/insights/briefings-magazine/issue-68/the-great-flattening-experiment)

15. **Betterworks (2025)**. "The Great Flattening: Middle Management's Shifting Role," June 2025. [[Betterworks]](https://www.betterworks.com/magazine/the-great-flattening)

16. **Alphabet / Sundar Pichai (2025)**. Q1 2025 earnings call, 24 April 2025: "well over 30%" of Google's checked-in code now involves accepted AI-suggested solutions. [[Alphabet IR]](https://abc.xyz/investor/events/event-details/2025/2025-Q1-Earnings-Call/) [[Transcript PDF]](https://s206.q4cdn.com/479360582/files/doc_financials/2025/q1/2025-q1-earnings-transcript.pdf)

17. **Dell'Acqua, Ayoubi, Lakhani et al. (2025)**. "The Cybernetic Teammate: A Field Experiment on Generative AI Reshaping Teamwork and Expertise." *HBS Working Paper 25-043.* Individuals with AI matched two-person human teams; teams with AI were three times more likely to produce top-10% ideas. [[SSRN]](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5188231) [[NBER w33641]](https://www.nber.org/papers/w33641) [[Lakhani interview]](https://www.microsoft.com/en-us/worklab/harvard-karim-lakhani-on-how-ai-is-shifting-from-tool-to-teammate)
