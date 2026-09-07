# Two-minute demonstration

This is a presenter script. Show actual application behavior; do not animate fictional outcomes. Use **Live agents** with a configured provider. If the provider is unavailable, show **Review real-agent run** and explicitly say it is a recording, then use labeled Rehearsal for interaction.

## 0:00–0:15 — Start with the problem

“The food is ready. The pantry has room. Then the driver cancels. That's the moment I built Second Serve for.”

Show the dispatch desk, five donations, three volunteers, and the simulated-neighborhood label.

“This is an illustrative neighborhood. The agents are real; the food and volunteers are demo data.”

## 0:15–0:40 — Show the team working

Choose Start dispatch in Live agents mode. Show Scout, Bridge, and Relay becoming active.

“Scout watches donation deadlines. Bridge checks who can accept the food. Relay turns that into reservations. They run independently in Mozaik, so a specialist can share a finding while another agent is still working.”

Open Agent activity briefly to show overlapping request intervals and published findings. Do not call a simulated run live.

## 0:40–1:15 — Change the situation

After two reservations appear, make an assigned driver unavailable. In the dispatch desk this is a scenario control; the network view has the same action.

“Now this driver can't make it. Their pickups are released immediately. The agents get that update, but a model request may still be finishing against the old board.”

If the current live run produces a stale rejection, show it. Otherwise describe the captured run accurately: “In the captured run, that exact race happened. The stale reservation was rejected.” Do not promise every nondeterministic run will produce the same event ordering.

“The reservation tool checks the current revision, capacity, refrigeration, recipient rules, and timing. The model can explain its choice, but it can't bypass those checks.”

## 1:15–1:40 — Inspect the revised plan

Show the revised plan. Open one donation's detail panel and its supporting findings.

“Here's the new plan and why the agent chose it. These are planned portions, not a claim that food has already been delivered.”

## 1:40–2:00 — Leave evidence

Choose Finish & save. Open Run history, then Agent activity, and export JSON.

“This isn't just a chat transcript. The backend saves the plan, requests, findings, and rejected actions. A reviewer can see the actual overlap and the decision that changed. Second Serve is about keeping a useful plan intact when the world interrupts it.”

## Reviewer fallback

The bundled captured run contains 17 real local-Codex model calls, peak concurrency of three, one stale rejection, and a final plan for 114 portions across four pickups. Open it from the fresh desk. It is a recorded result, not a live call or a performance benchmark. The local API can reproduce the workflow when a provider is configured.
