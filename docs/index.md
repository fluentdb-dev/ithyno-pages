# ithyno

> **Bridge the gap between specifications and progress tracking.**
> Let AI agents work on tasks driven by spec files, while humans orchestrate development in a clean visual dashboard.
> Empowering human-AI collaboration for modern software engineering.

**ithyno** uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) specification files as the single source of truth, allowing you to run commands (**Skills**) that instruct AI agents (propose, implement, review, verify) while visually managing their progress in a local dashboard.

- **No new state store.** Progress lives in `tasks.md` — `- [ ]`
  becomes `- [x]` — and the UI just visualizes and edits that. Break
  the tool and you can still edit in any text editor.
- **Human + AI both first-class.** Agents read and write plain `.md`;
  humans navigate a Kanban / progress tree to see the whole picture.
- **Git is the audit log.** "Who checked off which task, when" shows
  up as a normal markdown commit diff. (TODO: task allocation to agents, integration with Co-Authored / Co-Authorized commits)

## Who is it for?

- **Vibe coders looking to adopt Spec-Driven Development (SDD)**: Developers who want to move beyond "coding by vibe/prompts" and learn to reliably control AI agents using structured markdown specs and task checklists (`tasks.md`).
- **Developers seeking hands-on skills in Parallel Agent workflows**: Engineers looking to implement and master advanced workflows where multiple AI worker processes resolve different features concurrently in isolated Git worktrees.
- **Teams searching for the best multi-agent orchestrations**: Projects looking to combine different specialized agents (e.g. Code, Review, Verify roles using Copilot or Claude) to discover the best collaborative workflows and configurations.
- **Teams wanting workflows with clearly specified agent roles (e.g. Coder, Reviewer, Verifier)**: Organizations looking to build safer, higher-quality autonomous development pipelines by separating agent responsibilities into defined roles (Code / Review / Verify) rather than relying on a single all-in-one assistant process.
- **Developers practicing SDD**: Teams that want to keep specification documents as the single source of truth, with Git as the audit log, avoiding heavy database-backed management systems.
- **Technical Leaders**: Leaders who want a clear, readable visual indicator of what specs are being changed, what is currently being worked on, and where agents are stuck.

## Key Concepts

- **Spec-Driven Development (SDD) & OpenSpec**: All development is driven by specification files inside the `openspec/` directory. Specification modifications drive the lifecycle of each change proposal.
- **Git Worktree Parallel Execution**: Every change is checked out in its own isolated Git worktree (`.worktrees/<change-id>`). Multiple AI agents and human workers can write code, run tests, and commit in parallel without conflicts.
- **Kanban Board**: A visual local dashboard that lets you manage proposed, in-progress, reviewed, and completed changes at a glance, with embedded PTY terminal monitoring.

## Where to start

<div class="grid cards" markdown>

- :material-rocket-launch: **New to ithyno?**

    Follow [Start Simple Project](project-creation-flow.md), then use the [Init & Import](user-manual-init-and-import.md) guide when you need the detailed setup flow.

- :material-book-open: **Using it every day?**

    The [User Manual](user-manual/README.md) walks through Kanban,
    Phase, and Cards views, dispatch, and troubleshooting.

- :material-sitemap: **Building on it?**

    Read the [Architecture](architecture.md) doc for data model,
    two-way sync, and skill dispatch.

- :material-map-marker-path: **Curious what's next?**

    The [Roadmap](roadmap.md) and [Release process](release.md)
    describe the shipped work and cadence.

</div>

---

Full repo: [`ithyno/openspec-ui`](https://github.com/fluentdb-dev/ithyno).
Downloads (per-platform installers + VS Code extension) live on
[GitHub Releases](https://github.com/fluentdb-dev/ithyno/releases).
