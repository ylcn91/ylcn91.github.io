---
layout: post
category: blog
---

---

## Table of Contents
1. [A Quick Hello (Why Am I Doing This?)](#1-a-quick-hello-why-am-i-doing-this)
2. [My Magical Toolkit: From Ollama to LangChain (and More!)](#2-my-magical-toolkit-from-ollama-to-langchain-and-more)
3. [Greenfield Adventures With Aider Architect + o1/o3: Planning First, Coding Later](#3-greenfield-adventures-with-aider-architect--o1o3-planning-first-coding-later)
   - [3.1 Planning & Brainstorming With o1 or o3](#31-planning--brainstorming-with-o1-or-o3)
   - [3.2 Code Generation With Claude](#32-code-generation-with-claude)
   - [3.3 Review & Refinement With GPT-4o (and More Claude!)](#33-review--refinement-with-gpt-4o-and-more-claude)
4. [Legacy Code Gone Right: Refactoring With ASTs, JavaParser, and TDD](#4-legacy-code-gone-right-refactoring-with-asts-javaparser-and-tdd)
   - [4.1 Repomix & Qdrant: Bundling, Token Counting, and Advanced Searches](#41-repomix--qdrant-bundling-token-counting-and-advanced-searches)
   - [4.2 Small Steps With Aider Architect: The One-File-at-a-Time Trick](#42-small-steps-with-aider-architect-the-one-file-at-a-time-trick)
   - [4.3 Testing Everything (and Forcing AI to Generate Tests)](#43-testing-everything-and-forcing-ai-to-generate-tests)
5. [Mini Stories: When AI Went Completely Off the Rails](#5-mini-stories-when-ai-went-completely-off-the-rails)
6. [Prompt Engineering: Embeddings, Dependencies, and "Please Don't Invent New Microservices"](#6-prompt-engineering-embeddings-dependencies-and-please-dont-invent-new-microservices)
   - [6.1 LangChain as the Glue: Agentic Workflow in Action](#61-langchain-as-the-glue-agentic-workflow-in-action)
   - [6.2 Java Snippet: Example Prompt & Code Refinement](#62-java-snippet-example-prompt--code-refinement)
7. [Cliffs, Llamas, and the Final TDD Flow: A Real-World Example](#7-cliffs-llamas-and-the-final-tdd-flow-a-real-world-example)
8. [Comparing the Cast: Claude, GPT-4o, Aider, DeepSeek, and More](#8-comparing-the-cast-claude-gpt-4o-aider-deepseek-and-more)
9. [Wrapping Up: Embrace the Madness and Have Fun](#9-wrapping-up-embrace-the-madness-and-have-fun)

---

## 1. A Quick Hello (Why Am I Doing This?)

If you've ever wanted an **army of AI interns** to handle your repetitive tasks, find hidden references, or refactor messy code, you're in the right place. Over the past few months, I've built (and broken) enough projects with LLMs to fill a small library. I've used everything from **AST transformations and JavaParser** to the **Qdrant** vector database for advanced code searches—plus a handful of AI models that all think they know best.

In the following sections, I'll show you:

- How I **plan** new features using **Aider Architect** + **o1/o3** reasoning models (since planning is half the battle).  
- How I **generate code** using **Claude** but also keep it from going on a microservices rampage.  
- Why I sometimes **loop in GPT-4o** to review code and do final touches.  
- The wonders of **LangChain** to coordinate all these steps, so you can have an "agentic workflow" that orchestrates planning, coding, testing, and more.

---

## 2. My Magical Toolkit: From Ollama to LangChain

I rely on a **constellation** of tools to keep me sane:

- **Aider**: Works in two modes—`/chat-mode architect` for planning, `/chat-mode code` for generation.  
- **Claude**: Prone to over-excitement, but brilliant for big rewrites or architectural leaps.  
- **GPT-4o**: My final reviewer. Tends to be verbose but offers thorough checks.  
- **Ollama**: Local embeddings and smaller models to quickly index or query code without slamming external APIs.  
- **DeepSeek**: Another local tool for "deep" reasoning over code. Slower but thorough.  
- **Repomix**: Open-source CLI that **bundles** your repo, counts tokens, and respects `.gitignore`.  
  - **AI-Optimized**, **Token Counting**, **Customizable**, **Git-Aware**, **Security-Focused**—it's basically your code's personal travel agent.  
- **Qdrant**: A vector DB for storing embeddings from the entire codebase. "Where do we parse JSON in `PaymentService`?" becomes trivial to answer.  
- **LangChain**: The "Orchestra Conductor" that ties multiple LLMs and steps together (embedding, searching, chaining prompts, etc.).

No single tool does everything perfectly. I tend to let them **tag-team** each task like an unstoppable pro-wrestling faction.

---
## 3. Greenfield Adventures With Aider Architect + O1/O3: Planning First, Coding Later

### 3.1 Planning & Brainstorming With O1 or O3

1. **Craft a Brainstorm Prompt**:
   ```plaintext
   "We want to build a real-time 'Stock Ticker' that aggregates data from 5 external APIs. 
   Please ask me one question at a time so we can form a detailed specification. 
   Include data architecture, error handling, and test strategy in the final plan."
   ```

2. **Iterate**: The model asks clarifying questions. Answer thoroughly.
3. **Consolidate**: End by requesting a final spec compiled from the conversation. Save it as spec.md.

### 3.2 Code Generation With Claude

Now that we have a sane plan, let's do incremental coding:

1. **Create a Step-by-Step Plan**:
   ```plaintext
   "Based on spec.md, break down the implementation into 5 small tasks, 
   each with test instructions."
   ```

2. **Task 1**: "Fetch data from 2/5 APIs." Generate minimal code with Claude.
   - If Claude tries to add new APIs, politely say:
     ```plaintext
     "Claude, only fetch from the Alpha and Beta APIs. Do not add more. 
     Keep it in a single `StockFetcher` class for now."
     ```

3. **Test**: Do a quick run or let the AI generate JUnit tests.

### 3.3 Review & Refinement With GPT-4o (and More Claude!)

1. **Review**: Have GPT-4o check for potential logic issues or style conventions:
   ```plaintext
   "Here is `StockFetcher.java`. 
   Identify potential concurrency issues and edge cases. 
   Suggest improvements using Java best practices."
   ```

2. **Refine**: If GPT-4o finds something, feed that feedback back into Claude or do it manually.
3. **Commit**: Once everything checks out, you move on to the next task. Rinse and repeat until your MVP is up and running.

---

## 4. Legacy Code Gone Right: Refactoring With ASTs, JavaParser, and TDD

### 4.1 Repomix & Qdrant: Bundling, Token Counting, and Advanced Searches

When dealing with a gnarly old codebase—like a 300-file monolith—the first step is clarity:

1. **repomix**:
   - `brew install repomix` (if on macOS)
   - `repomix generate --include src/legacy/` to create a .txt or .md bundle
   - It also includes Secretlint checks, so you don't accidentally share credentials

2. **Qdrant**:
   - Feed the bundled data in: "Here's 300 files worth of code."
   - Create embeddings so you can do fuzzy queries. E.g., "Which class references PaymentGateway but never handles refunds?"

### 4.2 Small Steps With Aider Architect: The One-File-at-a-Time Trick

Instead of "Refactor the entire OrderService," you say:

```plaintext
"Aider Architect, let's just extract the discount logic from `OrderService.java` 
into a new `DiscountHandler.java`. 
Keep everything else intact."
```

- Aider + O1 ensures the plan is small. Then you:
  - Generate code in small PRs
  - AST + JavaParser can help you detect references and dependencies
  - AI can suggest, "By the way, DiscountHandler also affects InvoiceGenerator."

### 4.3 Testing Everything (and Forcing AI to Generate Tests)

TDD is essential here. You can even force the AI:

```plaintext
"Generate JUnit tests for `DiscountHandler.java` with boundary cases:
 - Negative discount
 - Discount > total
 - Zero discount"
```

Once tests pass locally, you can trust the changes a bit more. (Still do a manual review, because AI might skip important corner cases.)

---
## 5. When AI Went Completely Off the Rails

AI-generated code isn't always perfect. One time, I asked Claude to refactor a simple checkout flow.

Here was my (seemingly) harmless request:
Claude responded with extreme enthusiasm and:
- Created three brand-new services that didn't exist before
- Wired up a RabbitMQ queue that I never asked for
- Generated unit tests in Python…for a Java application

Time lost: about half a day reverting changes.
Lesson learned: Always specify exactly how big a refactor you want. Avoid vague terms like "improve" or "make it scalable."

---

## 6. Prompt Engineering: Embeddings, Dependencies, and "Please Don't Invent New Microservices"

### 6.1 LangChain as the Glue: Agentic Workflow in Action

I chain multiple steps together with LangChain. Here's the flow:

1. LangChain receives your plan from Aider Architect + O1
2. LangChain calls Claude to generate code (with your "Do not create new services" instruction)
3. LangChain calls GPT-4o to do a quick code review
4. If GPT-4o sees issues, LangChain triggers another Claude pass
5. All the while you're storing code embeddings in Qdrant, letting you do quick semantic searches for references or potential side-effects

Agentic workflow means the system can "decide" to do an extra pass if needed, all while you sip coffee and watch your TDD pipeline run.

### 6.2 Java Snippet: Example Prompt & Code Refinement

Prompt to Claude (through LangChain):

```plaintext
"Create a `PaymentHandler.java` that processes payments via Stripe.
 Only change PaymentHandler. 
 Reuse existing logging framework from PaymentLogger.java. 
 No new microservices, no queue connections."
```

AI-Generated Code (excerpt):

```java
public class PaymentHandler {
    
    private final PaymentLogger logger = new PaymentLogger();

    public String processPayment(Order order) {
        logger.info("Processing payment for order: " + order.getId());
        // ... Stripe integration code here
        return "Payment Successful";
    }
}
```

Then we might show GPT-4o the snippet and say:

```plaintext
"Review PaymentHandler.java for error handling or concurrency issues. 
 Suggest improvements or test scenarios."
```

GPT-4o might respond with:

"Consider adding more robust exception handling, especially for Stripe API timeouts. 
Add a second test scenario simulating an API failure."

---

## 7. Cliffs, Llamas, and the Final TDD Flow: A Real-World Example

Sometimes, everything is going so smoothly—it's like skiing on fresh powder. Suddenly, you realize you're at the edge of a cliff. The AI decides to rename variables or restructure entire modules. Don't panic. Just revert, break tasks into smaller steps, and try again.

Here's a simplified final TDD flow I often use:

1. Write a High-Level Test or acceptance criteria
2. Prompt Aider or Claude: "Implement code that satisfies this test. Minimal changes."
3. Run tests. If they fail, have GPT-4o or Claude debug
4. Iterate until tests pass
5. Manual Review: Do a final pass yourself
6. Merge
7. Repeat for the next feature or refactor

Yes, occasionally it adds ASCII llamas in the file headers (true story). Embrace the whimsy or remove it—your call.

---
## 8. Comparing the Cast: Claude, GPT-4o, Aider, DeepSeek, and More

| Tool/Model | What It Rocks At | Common Pitfalls |
|------------|------------------|-----------------|
| Claude | Large-scale changes, rewriting entire modules with clarity | Sometimes decides you need 3 new microservices and a queue |
| GPT-4o | Thorough reviews, final checks, deeper logic analysis | Can be verbose; might suggest design patterns you don't need |
| Aider | Step-by-step TDD, structured incremental changes | Needs super-clear prompts or it'll do exactly what you say |
| o1/o3 | Reasoning about tasks, planning and specs | Doesn't generate code directly—just sets up a plan |
| Ollama | Local usage for embeddings or smaller model codegen | Might run out of capacity for huge refactors |
| DeepSeek | Thorough local code reasoning, finds deep references | Slower, heavier on system resources |
| LangChain | Orchestrates multiple LLM calls, chain-of-thought flows, agentic workflows | Setup can be tricky if you're new to chaining concepts |
| Repomix | Bundles entire repo, token counts, respects .gitignore, security checks | If your repo is massive, the generated file might be huge, risking token limit issues |
| Qdrant | Vector-based code searching for "where is X used?" queries | Additional overhead & indexing steps needed |

--- 

## 9. Wrapping Up: Embrace the Madness and Have Fun

Building software with AI codegen is like riding a roller coaster that randomly decides to do an extra loop mid-ride. Scary? Sometimes. Exhilarating? Definitely.

- Plan first with Aider Architect + o1/o3
- Generate code in small, test-driven increments (Claude is your buddy, but keep it on a leash)
- Review everything with GPT-4o or your own eyes (or both!)
- Refactor legacy code piece by piece using Repomix, Qdrant, and AST-based checks so you know exactly what you're messing with
- Laugh when it tries to add Python tests to a Java repo, then calmly revert and try again

---

## 10. Managing Costs and Resources

When juggling multiple AI models, costs can add up quickly. Here's how I optimize:

- Use local models (Ollama, DeepSeek) for initial code analysis and simple generations
- Reserve Claude and GPT-4 for complex architectural decisions or thorough code reviews
- Batch similar tasks together to minimize API calls
- Use token counting in Repomix to stay within model context limits

Pro tip: Start with smaller, cheaper models and only escalate to more expensive ones when needed. Your wallet will thank you!

> **Author's Note:** I'm still refining this workflow daily. Some days, it feels unstoppable. Other days, I'm frantically reverting commits. But that's the joy of pioneering an evolving technology. Let's keep exploring together!