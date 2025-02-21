---
layout: post
category: blog
---

---

## Table of Contents
1. [Welcome to the AI Coding Circus: A Developer's Tale 🎪](#1-welcome-to-the-ai-coding-circus-a-developers-tale)
2. [Meet the AI Dream Team: Your New Quirky Coding Companions 🤖](#2-meet-the-ai-dream-team-your-new-quirky-coding-companions)
3. [Starting Fresh: How to Keep AI Models From Going Rogue 🚀](#3-starting-fresh-how-to-keep-ai-models-from-going-rogue)
4. [Taming Legacy Code: When AI Meets Your Ancient Codebase 🏺](#4-taming-legacy-code-when-ai-meets-your-ancient-codebase)
5. [AI Gone Wild: Tales From the Code Generation Trenches 😅](#5-ai-gone-wild-tales-from-the-code-generation-trenches)
6. [Speaking AI's Language: How to Stop Getting Unexpected Microservices 🗣️](#6-speaking-ais-language-how-to-stop-getting-unexpected-microservices)
7. [The Daily AI Dance: A Day in the Life of Modern Development 💃](#7-the-daily-ai-dance-a-day-in-the-life-of-modern-development)
8. [AI Personality Types: Choosing the Right Tool for the Job 🎭](#8-ai-personality-types-choosing-the-right-tool-for-the-job)
9. [Survival Guide: Embracing the Beautiful Chaos of AI Development 🌪️](#9-survival-guide-embracing-the-beautiful-chaos-of-ai-development)
10. [Resources & Cheat Sheet: Your AI Coding Emergency Kit 🧰](#10-resources--cheat-sheet-your-ai-coding-emergency-kit)

---

## 1. Welcome to the AI Coding Circus: A Developer's Tale 🎪

If you've ever wanted an **army of AI interns** to handle your repetitive tasks, find hidden references, or refactor messy code, you're in the right place. Over the past few months, I've built (and broken) enough projects with LLMs to fill a small library. I've used everything from **AST transformations and JavaParser** to the **Qdrant** vector database for advanced code searches—plus a handful of AI models that all think they know best.

In the following sections, I'll show you:

- How I **plan** new features using **Aider Architect** + **o1/o3** reasoning models (since planning is half the battle).  
- How I **generate code** using **Claude** but also keep it from going on a microservices rampage.  
- Why I sometimes **loop in GPT-4o** to review code and do final touches.  
- The wonders of **LangChain** to coordinate all these steps, so you can have an "agentic workflow" that orchestrates planning, coding, testing, and more.

Think of these tools like a team of developers with very different personalities:
- Claude is the enthusiastic architect who just discovered microservices
- GPT-4o is the thorough but verbose senior dev
- Aider is the practical programmer who just wants to ship code
- DeepSeek is the archeologist who knows where all the bodies are buried
- Ollama is the fast but sometimes forgetful junior dev
- Qdrant is the team member with photographic memory
- LangChain is the project manager keeping everyone in sync

The key is knowing when to use each one. Sometimes you need Claude's creativity, other times you need GPT-4o's thoroughness, and occasionally you just need Aider to tell everyone to calm down and write a simple function.


---

## 2. Meet the AI Dream Team: Your New Quirky Coding Companions 🤖

I rely on a **constellation** of tools to keep me sane:

- **Aider**: Works in two modes—`/chat-mode architect` for planning, `/chat-mode code` for generation.  
- **Claude**: Your brilliant but overenthusiastic architect. 
  - Pros: Incredible at understanding complex systems
  - Cons: Thinks every bug fix needs a microservice
  ```plaintext
  Me: "This button is misaligned"
  Claude: "Let's implement a distributed CSS grid system!"
  Me: "...or we could just fix the margin?"
  ``` 
- **GPT-4o**: My final reviewer. Tends to be verbose but offers thorough checks.  
- **Ollama**: Local embeddings and smaller models to quickly index or query code without slamming external APIs.  
- **DeepSeek**: Another local tool for "deep" reasoning over code. Slower but thorough.  
- **Repomix**: Your code's personal travel agent.
  - Bundles repos like a pro
  - Counts tokens so Claude doesn't have a meltdown
  - Respects `.gitignore` (more than some team members do)
  ```bash
  # When you run repomix and realize your codebase is...large
  $ repomix bundle
  "Sir, that's 500K tokens of technical debt"
  ```
- **Qdrant**: The team member with photographic memory.
  - "Where's that JSON parsing logic?"
  - "Which files touch the payment system?"
  - "Who wrote this comment and why were they so angry?"
- **LangChain**: The "Orchestra Conductor" that ties multiple LLMs and steps together (embedding, searching, chaining prompts, etc.).

No single tool does everything perfectly. I tend to let them **tag-team** each task like an unstoppable pro-wrestling faction.

---

## 3. Starting Fresh: How to Keep AI Models From Going Rogue 🚀

### 3.1 Planning & Brainstorming With o1 or o3

Let me share a real planning session:

1. **Craft a Brainstorm Prompt**:
   ```plaintext
   "We want to build a real-time 'Stock Ticker' that aggregates data from 5 external APIs. 
   Please ask me one question at a time so we can form a detailed specification. 
   Include data architecture, error handling, and test strategy in the final plan."
   ```

2. **The AI Interview Dance**:
   ```plaintext
   AI: "Which 5 APIs are we integrating with?"
   Me: "Alpha, Beta, Gamma, Delta, and Epsilon APIs"
   AI: "What if we added 10 more APIs and—"
   Me: "No. Just these 5."
   AI: "But what about blockchain integration?"
   Me: "NO. JUST. STOCKS."
   ```

3. **Consolidate**: End by requesting a final spec compiled from the conversation. Save it as spec.md.

### 3.2 Code Generation With Claude

Now that we have a sane plan (and convinced the AI we don't need blockchain), let's do incremental coding:

1. **Create a Step-by-Step Plan**:
   ```plaintext
   "Based on spec.md, break down the implementation into 5 small tasks, 
   each with test instructions."
   ```

2. **Task 1**: "Fetch data from 2/5 APIs." Generate minimal code with Claude.
   - If Claude tries to add new APIs, politely say:
     ```plaintext
     "Claude, only fetch from the Alpha and Beta APIs. Do not add more. 
     Keep it in a single `StockFetcher` class for now.
     No, we don't need Kubernetes for this."
     ```

3. **Test**: Do a quick run or let the AI generate JUnit tests.
   ```plaintext
   Me: "Generate tests for StockFetcher"
   Claude: "Here's a test suite with 147 edge cases—"
   Me: "Just the critical paths for now"
   Claude: "Oh, right. Here are the 5 essential tests..."
   ```

### 3.3 Review & Refinement With GPT-4o (and More Claude!)

1. **The Review Dance**:
   ```plaintext
   Me: "Review StockFetcher.java"
   GPT-4o: "Let me write a thesis on stock market data patterns..."
   Me: "Just check for bugs please"
   GPT-4o: "Oh! You're missing error handling here and here"
   ```

2. **The Refinement Tango**:
   - Feed GPT-4o's feedback to Claude
   - Watch Claude try to rewrite everything
   - Gently guide it back to just fixing the specific issues
   - Repeat until code actually works

3. **The Final Waltz**:
   ```plaintext
   Me: "One last review before commit?"
   Claude: "What if we added WebSocket support?"
   Me: "NO"
   Claude: "...fine, the code looks good as is."
   ```

> Pro Tip: Keep a "prompt diary" of successful interactions. When Claude suggests adding Redis to a Hello World program, you'll know exactly how to talk it down.

Real Story: During one planning session, I accidentally let the AI brainstorm without boundaries. It designed a system that would:
- Predict stock prices using machine learning
- Mine cryptocurrency in the background
- Generate memes based on market trends
- Feed the memes to a neural network
- ...all to display five stock prices on a webpage

Lesson learned: Always set clear boundaries before the AI gets too creative! 

---

## 4. Taming Legacy Code: When AI Meets Your Ancient Codebase 🏺

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

- Aider + o1 ensures the plan is small. Then you:
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
## 5. AI Gone Wild: Tales From the Code Generation Trenches 😅

AI-generated code isn't always perfect. One time, I asked Claude to refactor a simple checkout flow.

Here was my (seemingly) harmless request:
Claude responded with extreme enthusiasm and:
- Created three brand-new services that didn't exist before
- Wired up a RabbitMQ queue that I never asked for
- Generated unit tests in Python…for a Java application

Time lost: about half a day reverting changes.
Lesson learned: Always specify exactly how big a refactor you want. Avoid vague terms like "improve" or "make it scalable."


### The Variable Naming Revolution
Claude went through a phase where it believed every variable needed to tell a story. A simple counter `i` became `currentIterationIndexInTheMainLoopOfTheUserAuthenticationProcess`. My code review tool crashed trying to display the diff.

These mishaps taught me valuable lessons about working with AI:
- Be specific in your requests
- Set clear boundaries
- Review changes before committing
- Keep a sense of humor
- Sometimes the AI's "mistakes" lead to interesting innovations

And yes, some teams still use themed ASCII art in their codebases. Who am I to judge? 🦙


---

## 6. Speaking AI's Language: How to Stop Getting Unexpected Microservices 🗣️

### 6.1 LangChain as the Glue: Agentic Workflow in Action

I chain multiple steps together with LangChain. Here's the flow:

1. LangChain receives your plan from Aider Architect + o1
2. LangChain calls Claude to generate code (with your "Do not create new services" instruction)
3. LangChain calls GPT-4o to do a quick code review
4. If GPT-4o sees issues, LangChain triggers another Claude pass
5. All the while you're storing code embeddings in Qdrant, letting you do quick semantic searches for references or potential side-effects

Agentic workflow means the system can "decide" to do an extra pass if needed, all while you sip coffee and watch your TDD pipeline run.

### 6.2 Java Snippet: Example Prompt & Code Refinement

Let me walk you through a typical conversation:

Me: "Create a PaymentHandler that processes payments via Stripe."

Claude: "OH! Let's create a distributed payment system with—"

Me: "NO! Just a simple PaymentHandler. One file."

Claude: "But what about scalability and—"

Me: "ONE. FILE."

The secret is being specific. Here's the actual prompt that worked:

```plaintext
"Create a `PaymentHandler.java` that processes payments via Stripe.
 Only change PaymentHandler. 
 Reuse existing logging framework from PaymentLogger.java. 
 No new microservices, no queue connections.
 I repeat: NO new services. If you suggest a message queue, you lose cookie privileges."
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

Then we show it to GPT-4o:

Me: "Review this for issues?"

GPT-4o: "Well, actually..." *writes doctoral thesis on payment processing*

Me: "Just the important parts?"

GPT-4o: "Oh! Add timeout handling and test the API failure case."

Much better! 

### 6.3 Real-World Prompt Patterns That Actually Work

Here are my battle-tested prompt patterns:

1. **The Boundary Setting Pattern**:
```plaintext
"You will ONLY modify files I explicitly mention.
 If you need to change anything else, ASK FIRST.
 Current scope: ONLY PaymentHandler.java"
```

2. **The "No Scope Creep" Pattern**:
```plaintext
"Complete this specific task:
 - Add phone number validation
 - DO NOT add:
   - New services
   - New dependencies
   - Authentication changes
   - Database migrations"
```

3. **The "Keep It Simple" Pattern**:
```plaintext
"Implement the simplest solution that works.
 If you think it needs to be complex, explain why BEFORE coding.
 Prefer readable code over clever optimizations."
```

> Pro Tip: I keep these patterns in a "prompt cookbook" file. When Claude gets excited about adding blockchain to a todo list, I just copy-paste the boundary setting pattern! 

Remember: AI models are like overenthusiastic junior developers who just binged every software architecture video on YouTube. They have the knowledge but need guidance on when (and when not) to apply it.



### 6.1 LangChain as the Glue: Agentic Workflow in Action

I chain multiple steps together with LangChain. Here's the flow:

1. LangChain receives your plan from Aider Architect + o1
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

## 7. The Daily AI Dance: A Day in the Life of Modern Development 💃

Sometimes, everything is going so smoothly—it's like skiing on fresh powder. Suddenly, you realize you're at the edge of a cliff. The AI decides to rename variables or restructure entire modules. Don't panic. Just revert, break tasks into smaller steps, and try again.

Let me walk you through a typical day in my AI-powered development life:

**9:00 AM**: Start with a simple task - "Update the user profile page"
- Me: "Let's add a new field for phone numbers"
- Claude: "HERE'S A COMPLETE REWRITE OF THE AUTHENTICATION SYSTEM"
- Me: "No, Claude, just the phone number"
- Claude: "Oh, right. Sorry about that microservices proposal..."

**10:30 AM**: Debugging session
- Me: "Why isn't this test passing?"
- GPT-4o: *writes a 2000-word essay about test methodology*
- DeepSeek: "There's a semicolon missing"
- Me: 🤦‍♂️

**2:00 PM**: Refactoring time
```plaintext
Me: "Can you help optimize this loop?"
AI: "Sure! First, let's add some ASCII art..."
Me: "No, just the loop—"
AI: "TOO LATE! Here's a llama wearing sunglasses!"
```

**4:30 PM**: The final review
- GPT-4o: "This code is perfect except for these 47 minor improvements..."
- Claude: "What if we added GraphQL?"
- Me: "STOP! Ship it!"

Here's a simplified final TDD flow I often use (when everyone behaves):

1. Write a High-Level Test or acceptance criteria
2. Prompt Aider or Claude: "Implement code that satisfies this test. Minimal changes."
3. Run tests. If they fail, have GPT-4o or Claude debug
4. Iterate until tests pass
5. Manual Review: Do a final pass yourself
6. Merge
7. Repeat for the next feature or refactor

Yes, occasionally it adds ASCII llamas in the file headers (true story). Embrace the whimsy or remove it—your call.

Pro Tips From the Trenches:
- Keep a "prompt diary" of what worked and what caused chaos
- Set up git aliases for quick reverts (trust me, you'll need them)
- When an AI suggests adding Kubernetes to fix a CSS bug, it's probably time for a coffee break
- Remember: The AI is like an enthusiastic puppy - lots of energy, means well, needs training

> Real Story: Once, I left Claude and GPT-4o debating the best way to implement a caching system while I went to lunch. Came back to find they had written a plenty of page specification document and somehow convinced DeepSeek to be the tie-breaker. The solution was actually pretty good, but now I always set a token limit before leaving them unsupervised.


---
## 8. AI Personality Types: Choosing the Right Tool for the Job 🎭

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

My Favorite Combinations:
1. **The Planning Dream Team**: o1/o3 + Aider
   - o1/o3 plans the architecture
   - Aider breaks it into manageable chunks
   - Result: Actually realistic sprint plans!

2. **The Code Review Squad**: Claude + GPT-4o
   - Claude generates the initial code
   - GPT-4o nitpicks every detail
   - Result: Surprisingly robust code (after you convince them to stop arguing)

3. **The Legacy Code Heroes**: Repomix + Qdrant + DeepSeek
   - Repomix bundles the mess
   - Qdrant finds all the connections
   - DeepSeek explains what the code from 2010 actually does
   - Result: Legacy code that finally makes sense

> Pro Tip: When Claude and GPT-4o disagree on an implementation, sometimes I just let them debate it out.

--- 

## 9. Survival Guide: Embracing the Beautiful Chaos of AI Development 🌪️

Building software with AI codegen is like riding a roller coaster that randomly decides to do an extra loop mid-ride. Scary? Sometimes. Exhilarating? Definitely.

- Plan first with Aider Architect + o1/o3
- Generate code in small, test-driven increments (Claude is your buddy, but keep it on a leash)
- Review everything with GPT-4o or your own eyes (or both!)
- Refactor legacy code piece by piece using Repomix, Qdrant, and AST-based checks so you know exactly what you're messing with
- Laugh when it tries to add Python tests to a Java repo, then calmly revert and try again

I remember my first week trying this workflow. I ended up with:
- 3 different implementations of the same feature (thanks to different AI models disagreeing)
- A codebase that temporarily spoke three human languages (English, Python docstrings in Spanish, and somehow Japanese comments)
- A pull request so large our CI pipeline took a coffee break and left a "brb" message


---

## 10. Resources & Cheat Sheet: Your AI Coding Emergency Kit 🧰

When juggling multiple AI models, costs can add up quickly. Here's how I optimize:

- Use local models (Ollama, DeepSeek) for initial code analysis and simple generations
- Reserve Claude and GPT-4 for complex architectural decisions or thorough code reviews
- Batch similar tasks together to minimize API calls
- Use token counting in Repomix to stay within model context limits

Pro tip: Start with smaller, cheaper models and only escalate to more expensive ones when needed. Your wallet will thank you!

> **Author's Note:** I'm still refining this workflow daily. Some days, it feels unstoppable. Other days, I'm frantically reverting commits. But that's the joy of pioneering an evolving technology. Let's keep exploring!