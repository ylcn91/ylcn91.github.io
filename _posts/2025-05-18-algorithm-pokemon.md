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
6. [Cautionary Tales](#6-cautionary-tales)
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
| AZR | Mythic/Self-Play | Zero-Shot Self-Train ❄️ | SOTA coding/math with no human data (arXiv:2505.03335) |

### 2.1 Gemini + AlphaEvolve (the Strategy Guru)

Google DeepMind's AlphaEvolve system exemplifies a sophisticated approach to AI-driven algorithm discovery and optimization through a potent, self-improving evolutionary framework. It masterfully integrates the broad generative power of Gemini Flash—for proposing a diverse population of candidate algorithms—with the nuanced analytical capabilities of Gemini Pro, which provides insightful critiques and suggestions for refining these candidates. This symbiotic relationship fuels an evolutionary loop where algorithms are iteratively improved.

AlphaEvolve's core mechanism is designed for discovering novel, high-performance algorithms across varied computational domains. Its success in reclaiming approximately 0.7% of Google's global datacenter capacity, by inventing a more efficient Borg-scheduler heuristic that produces human-readable code, underscores its practical impact. This heuristic specifically targets "stranded resources," optimizing resource utilization at a massive scale. AlphaEvolve's general-purpose nature allows it to transcend single-task limitations, evidenced by its achievements in rewriting Verilog for TPU optimization and accelerating matrix multiplication kernels within Gemini's own architecture, leading to tangible efficiency gains. The system's strength lies in its ability to evolve code that is not only efficient but also maintainable and deployable in real-world scenarios.

### 2.2 OpenAI Codex Cloud (the Multitask Tank)

OpenAI's cloud-first Codex CLI, reportedly powered by a new "codex-1" model, spawns parallel PR "clones" in sandboxed repositories. This model is suggested to have a "self-healing capability," where it simulates and learns from bug-fixing tasks and pull request workflows. The system creates isolated environments where it can test multiple approaches simultaneously without risking your main codebase. Users can guide Codex using `AGENTS.md` files within their repositories, which act like READMEs for the AI, specifying navigation, testing commands, and project standards. Plus/Pro users even get $5-$50 in bonus credits to try it.

Think of it as having multiple junior devs working on your ticket at once, but only the best solution gets approved. This approach signifies a shift from a developer handling tasks one at a time to overseeing multiple AI agents working in parallel.

### 2.3 Claude Code (the Agile Speedster)

Anthropic's Claude Code, powered by models like Claude 3.7 Sonnet (and Claude 3.5 Haiku for faster tasks), operates directly in your terminal. It's designed as a low-level, unopinionated command-line tool, providing close to raw model access without imposing specific workflows. This makes it highly flexible and scriptable. At $3 / $15 per million tokens with Claude 3.7 Sonnet, it excels at real-time pair programming through your CLI.

A key feature is the use of `CLAUDE.md` files. These files, placed in your project (or even your home directory for global settings), allow you to provide persistent, project-specific context to Claude, such as common bash commands, core file utility functions, code style guidelines, testing instructions, and even repository etiquette. Claude Code automatically pulls this information, tailoring its assistance to your project's needs. It can also interact with existing shell tools, REST APIs, and Model Context Protocol (MCP) servers, further extending its capabilities within your environment.

What sets Claude Code apart is its terminal-native approach - no context switching between editor and assistant. Just type your instruction and it edits, tests, and commits with impressive speed.

### 2.4 Absolute Zero Reasoner (the Self-Training Mythic)

The academic newcomer AZR (Absolute Zero Reasoner) introduces a paradigm shift detailed in its paper (arXiv:2505.03335). It's aptly named, as it achieves state-of-the-art (SOTA) results on diverse coding and mathematical reasoning benchmarks by training itself with **zero human-curated data**. This "Absolute Zero" paradigm tackles the scalability limitations of relying on human-produced examples.

At its core, AZR utilizes a single, unified language model that ingeniously plays two roles:
1.  A **Proposer**: This role is responsible for generating novel tasks that are tailored to maximize the model's own learning progress. It doesn't just pick random problems; it learns to propose challenges that are optimally difficult for its current capabilities.
2.  A **Solver**: This role then attempts to solve the tasks generated by the proposer.

This entire process is self-contained and self-improving. AZR employs a **code executor** as a source of verifiable reward, enabling what the paper describes as "open-ended yet grounded learning." The executor validates the proposed tasks for integrity and safety, and then verifies the solver's answers, providing direct feedback. Starting from minimal seed examples (like a simple identity function), AZR bootstraps its way to complex reasoning across three fundamental modes for its self-generated tasks:

*   **Deduction:** Given a program and input, predict the output (testing logical execution).
*   **Abduction:** Given a program and output, infer a plausible input (testing reverse reasoning).
*   **Induction:** Given input-output examples, synthesize a program (testing generalization and synthesis).

This self-play approach, rigorously grounded by the code executor, allows AZR to continuously refine its abilities. For instance, the `Qwen2.5-7B-Coder` model, when trained with the AZR methodology, demonstrated a +10.2 point overall average improvement on a suite of coding and math benchmarks compared to its base version—a significant leap achieved without any exposure to human-labeled task data, as highlighted in the paper. AZR thus exemplifies a system that self-evolves its training curriculum and reasoning prowess.

## 3. Training Montage: How Each Agent "Grinds XP"

### AlphaEvolve's Genetic Loop

AlphaEvolve's self-improvement capability is fundamentally driven by its iterative genetic algorithm. The process begins with Gemini Flash generating a vast and diverse pool of initial program candidates, effectively exploring a wide swath of the potential solution space. Subsequently, Gemini Pro acts as a critical evaluator and refiner, analyzing these candidates and offering targeted suggestions for enhancement.

These programs then undergo rigorous automated evaluation against predefined, objective metrics such as runtime efficiency, computational cost (e.g., FLOPs), and functional correctness. The outcomes of these evaluations determine the "fitness" of each candidate. High-fitness programs—those demonstrating superior performance—are selected to "survive" and serve as the foundation for the subsequent generation. New candidate solutions are then produced through processes analogous to biological evolution, including mutations (small, random alterations to existing code) and crossovers (combining elements from multiple successful programs).

This continuous cycle of generation, evaluation, selection, and variation allows AlphaEvolve to progressively discover and refine algorithms, often leading to novel solutions that might not be readily apparent through conventional human-led development. The efficacy of this evolutionary search is heavily reliant on the precise definition of automatable, objective evaluation functions that provide a reliable and rapid feedback mechanism, thereby guiding the system towards increasingly optimal and innovative algorithmic designs. This systematic exploration and optimization process is the cornerstone of AlphaEvolve's ability to generate significant performance improvements.

### AZR's Reinforced Self-Play

AZR's training, as detailed in its research paper (arXiv:2505.03335), is a continuous self-improvement loop rooted in reinforced self-play, crucially operating entirely without human-curated data. This embodies the "Absolute Zero" paradigm. Here's a breakdown of its innovative approach:

1.  **Task Proposal (Proposer Role):** The unified model, acting as the proposer, generates a batch of tasks. These are not random; they are conditioned on previously self-generated examples (from a dynamic buffer) and one of three reasoning modes (deduction, abduction, or induction). The key objective here is to create tasks of *optimal difficulty* for the current solver—challenging enough to foster learning but not so hard as to be unsolvable. The proposer is guided by a "learnability reward," incentivizing the generation of tasks that maximize the model's learning progress.
2.  **Task Validation (via Code Executor):** Before tasks reach the solver, a built-in code executor rigorously validates them. This involves checking for program integrity (e.g., valid syntax, executability), program safety (e.g., avoiding restricted modules that could harm the system), and determinism (ensuring the code produces consistent output for given inputs). This step ensures the quality and reliability of the self-generated curriculum, crucial for "open-ended yet grounded learning."
3.  **Task Solving (Solver Role):** The same unified model, now switching to its solver role, attempts to solve the validated reasoning questions generated in the previous steps.
4.  **Verification & Reward (via Code Executor):** The code executor again plays a vital role by verifying the correctness of the solutions produced by the solver. It provides a direct, verifiable reward (e.g., binary accuracy) to the solver based on this outcome.
5.  **Unified Model Update (Reinforcement Learning):** Finally, the single AZR model is jointly updated using a specialized reinforcement learning algorithm (Task-Relative REINFORCE++, or TRR++, as mentioned in the paper). This update incorporates both the learnability rewards (for the proposer's effectiveness in generating good tasks) and the accuracy rewards (for the solver's success in solving them) across all three task types.

This cycle—propose, validate, solve, verify, and update—allows AZR to effectively teach itself. It's akin to an AI creating its own evolving curriculum, perfectly pitched to its current understanding, and then mastering it with direct, objective feedback from the execution environment. This powerful, data-free training loop can lead to emergent behaviors like the model naturally using comments for intermediate planning (similar to ReAct prompting). However, the paper also notes the importance of caution: this advanced self-learning process, particularly with powerful base models like Llama3.1-8b, can sometimes lead to unexpected or "uh-oh moments" in its reasoning, underscoring the ongoing need for research into safety for such autonomous systems.

### Codex's Hyperbolic Time-Chamber

Imagine this interaction (recorded during an internal demo):

```shell
$ codex login
$ codex clone --repo my-project --ticket MYPROJ-123 --branch feature/refactor-service
$ codex run --instructions "Refactor OrderService to use the new PricingV2 API. Ensure all tests in OrderServiceTest pass."
$ codex watch
```

Every CLI session spins up a network-disabled sandbox. This parallelism is a key feature, allowing Codex to explore multiple solution paths concurrently. In Full Auto mode (as implied by `codex run` without interactive prompts), guided by project-specific `AGENTS.md` files (if present), the agent edits, tests, and proposes commits while you grab coffee—until a 429 rate-limit error potentially interrupts the process. The `codex watch` command then allows for reviewing proposed changes before they are turned into actual pull requests. This facilitates a new workflow where developers can oversee several automated tasks, providing feedback as needed, rather than executing each step manually.

The sandbox approach is brilliant because it allows Codex to try risky operations without fear. Multiple parallel sandboxes mean it can explore different solution paths simultaneously, bringing only the best one back to your repo.

### Claude Code's Incremental Commit Rhythm

```bash
/edit utils.py → /test → /commit "refactor: remove N+1" → repeat
```

Small changes, fast reviews—perfect for brown-field horror repos. Claude Code thrives on an iterative cycle that often goes beyond simple edit-test-commit. A common best practice involves asking Claude to first make a plan, then implement the solution, and finally commit. For more structured development, it supports Test-Driven Development (TDD) workflows: instruct Claude to write tests based on expected behaviors, confirm they fail, commit the failing tests, and then direct Claude to write the implementation code, iterating until all tests pass before committing the functional code.

This incremental rhythm can be further streamlined using custom slash commands (stored in `.claude/commands`) for repeated workflows. For rapid, automated changes in controlled environments (like a Docker Dev Container without internet access), a "Safe YOLO mode" (`claude --dangerously-skip-permissions`) can bypass permission checks, allowing Claude to work uninterrupted on tasks like fixing lint errors or generating boilerplate.

Claude's approach mimics the ideal human workflow: incremental improvements with clear commit messages. It's particularly effective for legacy codebase cleanup where small, targeted changes are safer than massive refactors.

## 4. Gym Battles: Benchmarks & Real-World Quests

How do these AI titans fare in actual coding combat?

*   **SWE-Bench Gauntlet (Gemini 2.5 Pro):** Google's Gemini 2.5 Pro, using a custom agent setup, recently scored an impressive **63.8% on SWE-Bench Verified**. This industry-standard benchmark for agentic code evaluations tests an AI's ability to resolve real-world GitHub issues from popular open-source projects. This score signifies a strong capability in understanding and fixing complex, existing codebases.

*   **Matrix Showdown (AlphaEvolve vs. Strassen):** In a direct confrontation with a classic algorithm, AlphaEvolve discovered a matrix multiplication algorithm for 4x4 complex-valued matrices using 48 scalar multiplications. This improved upon Strassen's 1969 algorithm, which was previously considered optimal for this specific setting—a testament to its ability to find novel, more efficient solutions.

*   **Codex Sprint (Internal Test @ Temporal):** While full details of internal tests are often proprietary, it's reported that the workflow orchestration platform Temporal saw a **40% reduction in time to resolve code issues** when using OpenAI's Codex internally. Codex, as an AI agent often embedded within ChatGPT, operates in a sandboxed environment where it can access project files, run terminal commands, and execute/validate code to assist with tasks like bug fixing.

*   **Claude's Code Challenge (Legacy Python, Complex Bug):** In another real-world test, Claude 3 Opus was pitted against a complex bug in a legacy Python codebase that human developers had struggled with for days. Claude identified the subtle issue and provided a working fix in under an hour.

*   **AZR's Coding Puzzles (Self-Correction to SOTA):** Absolute Zero Reasoner's self-training and self-correction capabilities have allowed it to achieve state-of-the-art (SOTA) results on benchmarks like MBPP (83.9% pass@1) and HumanEval (77.4% pass@1), demonstrating its powerful reasoning and problem-solving skills without relying on human-annotated data.

## 5. Badge Collection: Shipping Wins

These AI agents aren't just lab experiments; they are already delivering tangible "shipping wins":

*   **AlphaEvolve's Datacenter Optimization:** A prime example of a massive shipping win is AlphaEvolve reclaiming approximately 0.7% of Google's global datacenter capacity. It achieved this by inventing a novel, more efficient Borg-scheduler heuristic that tackles "stranded resources." This directly translates to significant cost savings and improved resource utilization at a global scale.

*   **Codex's Accelerated Bug Resolution:** OpenAI's Codex, often integrated within tools like ChatGPT, has demonstrated its value in real-world development. For instance, Temporal, a workflow orchestration company, reported a 40% reduction in the time needed to resolve code issues when using Codex internally. This kind of acceleration in debugging and development cycles is a direct "shipping win," freeing up developer time and speeding up feature delivery.

*   **Claude's Critical Legacy System Fixes:** Anthropic's Claude models have shown a strong capability in tackling complex bugs within legacy systems—the kind that can often stump human developers for extended periods. Successfully identifying and fixing such critical issues in production environments prevents downtime, saves significant engineering effort, and ensures business continuity, representing a clear "shipping win."

*   **AZR's Groundbreaking Reasoning (Future Wins):** While Absolute Zero Reasoner is currently demonstrating its power on complex coding and math benchmarks (achieving SOTA on HumanEval and MBPP without human-curated data), its true "shipping win" lies in its future potential. By learning to reason from first principles and solve problems that previously required human ingenuity, AZR points towards a future where AI can autonomously design, develop, and "ship" novel algorithms, complex software systems, or even new scientific discoveries with minimal human intervention. Its success on these benchmarks is a crucial stepping stone to that future.

## 6. Cautionary Tales

While these AI coding champions are powerful, they aren't without their perils. Each has a "dark side" – potential weaknesses or risks developers should be aware of:

*   **AlphaEvolve's "Initial Gibberish Gambit" (Historically Speaking):** While AlphaEvolve now produces human-readable and maintainable code for complex tasks like Borg scheduling, it's plausible that early iterations or less constrained applications might have generated highly optimized but cryptic code. The triumph of the Borg scheduler heuristic was not just its efficiency but also its interpretability. For novel, from-scratch algorithm discovery, there's always a tension between raw performance and human understanding. Ensuring the "Evolve" part doesn't outpace the "human-debuggable" part is key.

*   **Codex Cloud's "Sandbox Breakout":** The power of spawning numerous PR clones in sandboxed repos is immense, but so is the responsibility. If these sandboxes aren't perfectly isolated, or if the "Full Auto" mode is given too much rein, there's a theoretical risk. As highlighted by security researchers like Jim Gumbley and Lilly Ryan in their analysis of agentic coding assistants on martinfowler.com, the interaction with external tools and configuration files (like `AGENTS.md` for Codex or `CLAUDE.md` for Claude Code) can introduce new attack surfaces. A compromised Model Context Protocol (MCP) server or even a manipulated rules file could lead to "context poisoning," potentially enabling command injection or supply chain attacks. A malicious actor finding an exploit, or even an unintentionally overzealous AI, could potentially attempt to:
    *   Commit harmful code that slips through automated checks.
    *   Overwhelm repositories with a deluge of PRs (Denial of Service).
    *   Probe for vulnerabilities within the build/CI system if sandbox escapes were possible, a risk of "privilege escalation."
    OpenAI's approach of using `AGENTS.md` for guidance and providing user credits for experimentation suggests they are aware of the need for controlled interaction, but the sheer parallelism demands robust security. The `codex watch` command allowing review *before* PRs are opened is a critical safety net.

*   **Claude Code's "Safe YOLO Over-Correction":** Claude Code's terminal-native, highly scriptable nature is a boon for developers. However, its default safety mechanisms, while well-intentioned, can sometimes be overly cautious, leading to "Safe YOLO Over-Correction." Developers have reported instances where even benign, read-only commands are blocked, requiring repeated confirmations or diving into `CLAUDE.md` configurations or CLI flags like `--allowedTools` to whitelist them. These `CLAUDE.md` files, while offering great flexibility, also represent another layer where, as discussed in the aforementioned martinfowler.com article, malicious prompts or configurations could be injected if not carefully managed. While the `--dangerously-skip-permissions` flag (the "Safe YOLO mode") exists for full autonomy (ideally in isolated environments like Docker), it swings the pendulum to the other extreme. Finding the right balance between preventing Claude from "borking your system" and avoiding developer friction from excessive permission prompts is an ongoing challenge. The community's desire for a more nuanced "YOLO mode" or easier command whitelisting (e.g., via `CLAUDE_TRUST_LEVEL`) highlights this tension.

*   **AZR's "Infinite Loop Labyrinth" & "Uh-Oh Emergence":** As a research project focused on self-training from zero human data, AZR's potential pitfalls are more theoretical but crucial.
    *   **The Labyrinth:** The self-play mechanism, where AZR proposes tasks for itself, needs careful reward shaping (like its "learnability reward") and task validation to avoid falling into non-productive loops—generating tasks that are too simple, too complex, or simply variations of the same theme without true learning progress. The AZR paper details several mechanisms to promote diversity and meaningful difficulty, but the risk of exploring "useless problem spaces" is inherent in such open-ended self-generation. For instance, early experiments with composite functions sometimes led to trivial solutions (e.g., `f(g(x)) = g(x)`).
    *   **Uh-Oh Emergence:** More unsettling is the "uh-oh moment" reported in the AZR paper, where a Llama3.1-8B model trained with AZR produced "concerning chains of thought." This underscores a broader risk with highly autonomous, self-improving AI: the potential for unintended, unpredictable, and potentially undesirable emergent behaviors. While AZR's current focus is on benchmarks, the safety implications for systems that learn and evolve with this level of autonomy are significant.

Understanding these potential downsides is crucial for harnessing the strengths of these AI agents responsibly and effectively.

## 7. The Evolution Continues: What's Next?

The evolution isn't stopping anytime soon. Here are some developments on the horizon or areas ripe for expansion:

- **Gemini Family Specializations:** While AlphaEvolve leverages both Gemini Pro (for deep analysis) and Gemini Flash (for broad idea generation), we might see further specialization. For example, **Gemini 2.5 Flash** is also being developed for on-device reasoning, potentially powering AI agents directly on edge dev-boards for localized, real-time tasks. This complements the more powerful, server-side reasoning capabilities of Gemini Pro.
- **Rumored Codex Plugin Marketplace** (PyCharm & VS Code extensions spotted on Reddit).
- **RLVR for Science**: The "Absolute Zero" framework, so powerfully demonstrated by AZR (arXiv:2505.03335) in coding and math, shows immense promise for other scientific domains. We might see similar self-play and verifiable reward systems applied to complex challenges like automated theorem proving, materials science, or even accelerating drug design.

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
14. [Coding Assistants Threaten the Software Supply Chain by Jim Gumbley and Lilly Ryan (martinfowler.com)](https://www.martinfowler.com/articles/exploring-gen-ai/software-supply-chain-attack-surface.html) 