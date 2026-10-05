# CLAUDE.md

This repo follows the Artifact Primer: https://github.com/arfct/ops/tree/main/primer

- Standards (style, commits, branches): https://github.com/arfct/ops/blob/main/primer/standards.md
- Work tracking: GitHub Issues in this repo — https://github.com/arfct/ops/blob/main/primer/issues.md
- Bugs: https://github.com/arfct/ops/blob/main/primer/bugs.md · Deployment: https://github.com/arfct/ops/blob/main/primer/deployment.md
- Agent conventions and boundaries: https://github.com/arfct/ops/blob/main/primer/agents.md

## This repo

`@arfct/agent-connection`: the one place Artifact products describe how an agent host connects to them. `src/hosts.js` is the host table and the per-host setup; `src/guide.js` renders it as markdown and HTML for `/llms.txt` and a browser at `/mcp`; `src/chatgpt.js` builds a ChatGPT app submission from a tool list; `src/element.js` is the `<agent-connection>` web component. Plain ESM with `.d.ts` files, no build step, so products depend on it straight from git. Run `npm test` (node:test) and `npm run lint` (Biome). A product passes a `Product` object (name, origin, endpoints it has) and gets instructions that match what it serves; nothing here names a product. When a host changes how it connects, fix it here once and note the source in `docs/hosts.md`.
