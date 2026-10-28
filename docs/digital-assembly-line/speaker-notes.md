# The digital assembly line — speaker notes

Designing AI agents that work like Ford's factory · Zelda Ailine Luconi · Google AI Community 2026.

Speaker notes for the animated slides in [`slides/`](./slides/). Each section is shown in the notes panel (N) of the slide linked by its 🎬 line.
Source: the original Google Slides deck (47 slides); the notes below come from its speaker notes, where present.

### 01 · Cover

🎬 **SLIDE**: [`slides/01-cover.html`](./slides/01-cover.html)

_(no speaker notes in the original deck)_

### 02 · What are we gonna do?

🎬 **SLIDE**: [`slides/02-what-we-do.html`](./slides/02-what-we-do.html)

_(no speaker notes in the original deck)_

### 03 · How are we going to do it?

🎬 **SLIDE**: [`slides/03-how.html`](./slides/03-how.html)

_Module 1 • Icebreaker #1 (00:04)_

> Before I give you my definition, let's break the ice. Shout it out or raise your hand: when you hear 'Google ADK', what is it to you? Is it just another wrapper around Gemini? Or is it solving something deeper about how we structure, state-manage, and test multi-agent software?

### 04 · Who am I

🎬 **SLIDE**: [`slides/04-who-am-i.html`](./slides/04-who-am-i.html)

_(no speaker notes in the original deck)_

### 05 · Icebreaker #1: what is ADK?

🎬 **SLIDE**: [`slides/05-icebreaker-1.html`](./slides/05-icebreaker-1.html)

_Module 1 • Icebreaker #1 (00:04)_

> Before I give you my definition, let's break the ice. Shout it out or raise your hand: when you hear 'Google ADK', what is it to you? Is it just another wrapper around Gemini? Or is it solving something deeper about how we structure, state-manage, and test multi-agent software?

### 06 · Agent Developer Kit: what and why

🎬 **SLIDE**: [`slides/06-adk.html`](./slides/06-adk.html)

_(no speaker notes in the original deck)_

### 07 · Icebreaker #2: have you ever…

🎬 **SLIDE**: [`slides/07-icebreaker-2.html`](./slides/07-icebreaker-2.html)

_(no speaker notes in the original deck)_

### 08 · This was not a test

🎬 **SLIDE**: [`slides/08-not-a-test.html`](./slides/08-not-a-test.html)

_(no speaker notes in the original deck)_

### 09 · LLM, agents and agentic AI bring to the table

🎬 **SLIDE**: [`slides/09-bring-to-table.html`](./slides/09-bring-to-table.html)

_(no speaker notes in the original deck)_

### 10 · AI project graveyard

🎬 **SLIDE**: [`slides/10-graveyard.html`](./slides/10-graveyard.html)

_(no speaker notes in the original deck)_

### 11 · How to avoid all of this?

🎬 **SLIDE**: [`slides/11-avoid-all-this.html`](./slides/11-avoid-all-this.html)

_(no speaker notes in the original deck)_

### 12 · The assembly line

🎬 **SLIDE**: [`slides/12-assembly-line.html`](./slides/12-assembly-line.html)

_(no speaker notes in the original deck)_

### 13 · Let's take an example

🎬 **SLIDE**: [`slides/13-example.html`](./slides/13-example.html)

_(no speaker notes in the original deck)_

### 14 · Requirements & UX

🎬 **SLIDE**: [`slides/14-requirements.html`](./slides/14-requirements.html)

_(no speaker notes in the original deck)_

### 15 · The worst scenario when designing

🎬 **SLIDE**: [`slides/15-worst-scenario.html`](./slides/15-worst-scenario.html)

_(no speaker notes in the original deck)_

### 16 · Hellish single agent pattern

🎬 **SLIDE**: [`slides/16-single-agent.html`](./slides/16-single-agent.html)

_(no speaker notes in the original deck)_

### 17 · Structured workflow

🎬 **SLIDE**: [`slides/17-structured-workflow.html`](./slides/17-structured-workflow.html)

_(no speaker notes in the original deck)_

### 18 · One task, one agent

🎬 **SLIDE**: [`slides/18-one-task-one-agent.html`](./slides/18-one-task-one-agent.html)

_(no speaker notes in the original deck)_

### 19 · Concept 1: LlmAgent

🎬 **SLIDE**: [`slides/19-llmagent.html`](./slides/19-llmagent.html)

_Module 2 • Core Concepts Visual Guide (00:13)_

> Let's look at Concept #1: the LlmAgent. Notice the three properties highlighted here: `name` and `description` define its identity, `model` selects the brain, and `instruction` sets its guardrails. Crucial tip: never treat `description` as a comment for humans—in ADK, other agents read `description` at runtime to route conversations!

### 20 · Concept 2: Tool

🎬 **SLIDE**: [`slides/20-tool.html`](./slides/20-tool.html)

_Module 2 • Core Concepts Visual Guide (00:15)_

> Concept #2 is the Tool. Look at `is_registered_user` on the right. First, notice the type hint `user_id: str` and the Google-style docstring—ADK parses those to build the JSON schema for Gemini. Second, look at `tool_context: ToolContext`. Gemini never has to generate `tool_context`; ADK injects it under the hood so your Python code can immediately write the user's profile into `tool_context.state`!

### 21 · Concept 3: sub-agents & MAS

🎬 **SLIDE**: [`slides/21-sub-agents.html`](./slides/21-sub-agents.html)

_Module 2 • Core Concepts Visual Guide (00:17)_

> Concept #3: When do you use `sub_agents` versus `AgentTool` versus a `Workflow` graph? Use `sub_agents` when the child agent needs to take over the microphone and talk directly to the user—like `Registratore` interviewing a new traveler. Use `AgentTool` when a supervisor like `Suggeritore` needs to call three internal worker agents in sequence and synthesize their answers without losing control of the turn.

### 22 · Demo time: multi-agent workflow

🎬 **SLIDE**: [`slides/22-demo-1.html`](./slides/22-demo-1.html)

_(no speaker notes in the original deck)_

### 23 · Stuff everything into the context?

🎬 **SLIDE**: [`slides/23-context-question.html`](./slides/23-context-question.html)

_(no speaker notes in the original deck)_

### 24 · The naive approach to agent memory

🎬 **SLIDE**: [`slides/24-naive-memory.html`](./slides/24-naive-memory.html)

_(no speaker notes in the original deck)_

### 25 · Structured handoffs

🎬 **SLIDE**: [`slides/25-structured-handoffs.html`](./slides/25-structured-handoffs.html)

_(no speaker notes in the original deck)_

### 26 · Session and state

🎬 **SLIDE**: [`slides/26-session-state.html`](./slides/26-session-state.html)

_(no speaker notes in the original deck)_

### 27 · Concept 4: the 4 state layers

🎬 **SLIDE**: [`slides/27-state-layers.html`](./slides/27-state-layers.html)

_Module 2 • Core Concepts Visual Guide (00:21)_

> Concept #5 is the Blackboard Pattern. Look at the four scopes: unprefixed session state, `user:` state, `app:` state, and `temp:` state. And look at the code on the right: by putting `{user:vehicle_fuel_type?}` with a question mark inside `instruction`, ADK automatically injects the live value from `session.state` into the system prompt on every turn—and if the key isn't set yet, the `?` prevents a KeyError!

### 28 · Concept 5: typed contracts

🎬 **SLIDE**: [`slides/28-typed-contracts.html`](./slides/28-typed-contracts.html)

_Module 2 • Core Concepts Visual Guide (00:19)_

> Concept #4 is one of the biggest cost and reliability savers in ADK: `input_schema` and `output_schema`. By defining Pydantic models, `RoutePlannerAgent` receives a compact JSON object and is mathematically constrained at the token-decoding level to output valid `RouteCandidateStopsOutput` JSON—which `output_key` immediately stores into `session.state['planned_route']`.

### 29 · Demo time: session state

🎬 **SLIDE**: [`slides/29-demo-2.html`](./slides/29-demo-2.html)

_(no speaker notes in the original deck)_

### 30 · Why decouple?

🎬 **SLIDE**: [`slides/30-decouple-question.html`](./slides/30-decouple-question.html)

_(no speaker notes in the original deck)_

### 31 · Sub-agents vs tools

🎬 **SLIDE**: [`slides/31-subagents-vs-tools.html`](./slides/31-subagents-vs-tools.html)

_(no speaker notes in the original deck)_

### 32 · Technological heterogeneity

🎬 **SLIDE**: [`slides/32-heterogeneity.html`](./slides/32-heterogeneity.html)

_(no speaker notes in the original deck)_

### 33 · Expanding to MCP and A2A

🎬 **SLIDE**: [`slides/33-mcp-and-a2a.html`](./slides/33-mcp-and-a2a.html)

_(no speaker notes in the original deck)_

### 34 · Model Context Protocol

🎬 **SLIDE**: [`slides/34-mcp.html`](./slides/34-mcp.html)

_(no speaker notes in the original deck)_

### 35 · Agent to Agent (A2A)

🎬 **SLIDE**: [`slides/35-a2a.html`](./slides/35-a2a.html)

_(no speaker notes in the original deck)_

### 36 · Concept 6: MCP, server side

🎬 **SLIDE**: [`slides/36-mcp-server.html`](./slides/36-mcp-server.html)

_Module 2 • Core Concepts Visual Guide (00:23)_

> Concept #6: Model Context Protocol (MCP). Think of MCP as USB-C between your AI agents and external data sources. Instead of hardcoding BigQuery SQL inside `SosteSearchAgent`, we expose `query_highway_stops_bq` through a `FastMCP` server. If the external DB team renames a column tomorrow, only the MCP server changes—zero agent code changes required.

### 37 · Concept 6: MCP, client side

🎬 **SLIDE**: [`slides/37-mcp-client.html`](./slides/37-mcp-client.html)

_Module 2 • Core Concepts Visual Guide (00:23)_

> Concept #6: Model Context Protocol (MCP). Think of MCP as USB-C between your AI agents and external data sources. Instead of hardcoding BigQuery SQL inside `SosteSearchAgent`, we expose `query_highway_stops_bq` through a `FastMCP` server. If the external DB team renames a column tomorrow, only the MCP server changes—zero agent code changes required.

### 38 · Concept 7: A2A protocol

🎬 **SLIDE**: [`slides/38-a2a-code.html`](./slides/38-a2a-code.html)

_Module 2 • Core Concepts Visual Guide (00:26)_

> And Concept #8 brings us to the culmination of branch 05d: the Agent-to-Agent (A2A) protocol paired with `adk eval`. With one function call—`to_a2a(agent, port=8001)`—`Suggeritore` becomes a standalone microservice with its own `/.well-known/agent-card.json`. And with `adk eval`, we verify the entire distributed trajectory automatically.

### 39 · Demo time: from sub-agent to A2A

🎬 **SLIDE**: [`slides/39-demo-3.html`](./slides/39-demo-3.html)

_(no speaker notes in the original deck)_

### 40 · Testing, testing… evaluating

🎬 **SLIDE**: [`slides/40-evaluating.html`](./slides/40-evaluating.html)

_(no speaker notes in the original deck)_

### 41 · Evaluation metrics

🎬 **SLIDE**: [`slides/41-eval-metrics.html`](./slides/41-eval-metrics.html)

_(no speaker notes in the original deck)_

### 42 · Evaluation best practice

🎬 **SLIDE**: [`slides/42-eval-best-practice.html`](./slides/42-eval-best-practice.html)

_(no speaker notes in the original deck)_

### 43 · Concept 8: adk eval

🎬 **SLIDE**: [`slides/43-adk-eval.html`](./slides/43-adk-eval.html)

_(no speaker notes in the original deck)_

### 44 · And in the end…

🎬 **SLIDE**: [`slides/44-in-the-end.html`](./slides/44-in-the-end.html)

_(no speaker notes in the original deck)_

### 45 · The final architecture

🎬 **SLIDE**: [`slides/45-final-architecture.html`](./slides/45-final-architecture.html)

_(no speaker notes in the original deck)_

### 46 · Final thought: AI is not the answer to everything

🎬 **SLIDE**: [`slides/46-final-thought.html`](./slides/46-final-thought.html)

_(no speaker notes in the original deck)_

### 47 · Q&A

🎬 **SLIDE**: [`slides/47-qa.html`](./slides/47-qa.html)

_(no speaker notes in the original deck)_
