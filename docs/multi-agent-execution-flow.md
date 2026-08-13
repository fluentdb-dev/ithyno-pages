# Multi-Agent Execution Flow

If `agents.yaml` at the repository root is configured with different agents for each role (**Code**, **Review**, and **Verify**), clicking the "Start" button triggers the following automated multi-agent pipeline:

1. **Implementation Phase (Spawning Code Agent)**:
   First, the Code agent spawns in the isolated working directory (Worktree) to implement and commit modifications according to the task list (`tasks.md`).
2. **Review Phase (Spawning Review Agent)**:
   Once the implementation commit completes, the Review agent automatically spawns to inspect the diff. If issues (reworks) are found, they are piped back to the Code agent to address.
3. **Verification Phase (Spawning Verify Agent)**:
   When the review passes, the Verify agent runs builds and automated tests (such as `npm test`). If all checks exit successfully, the status automatically advances to the `done` state.

---

## Agent Configuration (`agents.yaml`)

To enable this automated pipeline, create an **`agents.yaml`** file at the root of your project directory and configure the agents for each role.

### Sample Configuration (`agents.yaml`)

Below is a basic configuration sample assigning agents to the Code, Review, and Verify roles:

```yaml
# Agent configured for Code role
- name: Claude Coder
  mode: single-prompt
  roles: [code]
  command: claude
  args:
    - "-p"

# Agent configured for Review role
- name: Claude Reviewer
  mode: single-prompt
  roles: [review]
  command: claude
  args:
    - "-p"

# Agent configured for Verify role
- name: Local Verifier
  mode: single-prompt
  roles: [verify]
  command: npm
  args:
    - "run"
    - "test"
```

### Key Configuration Points

* **`roles`**: Make sure to specify `code`, `review`, and `verify` respectively. Ithyno uses these roles to determine which agent to spawn at each step of the pipeline.
* For details on flags, prompts, or using other CLIs, refer to the [detailed Agent Configuration manual](user-manual/multi-agent-cli.md).
