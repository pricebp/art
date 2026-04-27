---
name: art
description: Analyzes user prompts, matches them against agent-routing-table.md, and switches to the best-suited model for the task. Use when routing prompts to specialized models or when the user invokes /skill:art.
---

# ART (Agent Routing Table)

A routing skill that automatically directs tasks to the best-suited model based on `agent-routing-table.md`.

## Setup

No setup required. ART depends only on the `agent-routing-table.md` file in this directory and the built-in `switch-model` tool.

```
art/
├── SKILL.md              # This file
├── agent-routing-table.md # Model-to-context mapping
```

## Usage

Run the routing workflow:

```bash
/skill:art
```

When invoked, **always execute** the full routing workflow below. Do not skip or bypass any step.

Execute the following steps in order:

1. Check the user's prompt for context clues.
2. Verify the routing table against the detected context.
3. Update the active model if the routing table identifies a better match.
4. Respond to the user's prompt directly using the selected model.

## Workflow

1. **Detect Current Model** — Identify the model you are currently running as. You know this from your own system context — it is the provider/model you were invoked with.

2. **Analyze Context** — Read the user's prompt. Compare it against `agent-routing-table.md`. Output: "Analyzing Message Context".

3. **Decide Model** — Determine which model the routing table recommends for this context. Compare it to your current model:
   - **Same model** — If the recommended model matches your current model, do not switch. Output: "Current Model is Best Suited For This Task" and proceed to step 4.
   - **Different model** — If the recommended model differs, call `switch-model` to switch to that model. Output: "Switching Model". After switching, the new model picks up this conversation. Proceed to step 4.

4. **Respond** — Respond to the user's original prompt directly. Do **not** output "Message Forwarded" or any forwarding notice. The new model (or the current one, if no switch occurred) should simply answer the user's question as if it received the prompt natively, preserving full context from the conversation history.

## Use When

- The user invokes `/skill:art` directly.
- A prompt needs to be routed to a specialized model for better results.
- The current model is not optimal for the task at hand.

## Do Not

- Skip the context analysis step even if the current model seems adequate.
- Switch to a model that is already active — detect the current model first.
- Output "Message Forwarded" or any forwarding announcement — just answer the prompt.
- Override the routing table's decision based on assumptions.

## Reference

- [agent-routing-table.md](agent-routing-table.md) — The authoritative mapping of model names to task contexts. Review this file during context analysis to determine the best model match.
