# Relationship Between OpenSpec and Kanban Board

This document describes the relationship and architecture between the OpenSpec workflow and the Kanban Board visualizer in Ithyno.

---

## Phase Board (Phase Kanban / Former Classic Kanban) Structure

The Phase board (former Classic Kanban board) in Ithyno is a **state monitor** that visualizes the lifecycle of OpenSpec changes. It is designed with a classic three-column layout (TODO, IN-PROGRESS, DONE) to help users easily track the completion status of their changes.

### TODO
* **Meaning**: Changes that have been proposed (Propose step) but have not yet started implementation or verification by an agent.
* **User Actions**:
  * `+ New Change`: Create a new proposal document.
  * `Start` / `Apply`: Spawn an agent (implementer) to begin processing the change.

### IN-PROGRESS (PROCESS)
* **Meaning**: Changes that are currently undergoing implementation (coding), review, or automated test verification.
* **Key Features**:
  * Displays the task completion rate (percentage based on completed checkboxes in `tasks.md`).
  * Indicates that an agent is actively running or that a human review/verification step is underway.
  * Changes escalated to `needs-human` (awaiting input/feedback from a human) remain in this column.

### DONE
* **Meaning**: Changes where all implementation, review, and verification steps have completed successfully.
* **User Actions**:
  * `Merge`: Merge the change into the main branch (cleans up the worktree).
  * `Archive`: Archive the completed change.
  * `Discard`: Withdraw and discard the change.

## Basic Mapping: Kanban Board and Instruction Layer (OpenSpec)

The diagram below shows the direct relationship between the Kanban board columns (TODO / IN-PROGRESS / DONE) and the OpenSpec instruction commands (actions) executed by the user.

```mermaid
graph TD
    subgraph UI ["User Action"]
        C_NewChange["+ New Change<br>(New Change Button)"]
    end

    subgraph OpenSpec ["Instruction Layer (OpenSpec)"]
        C_Propose["propose<br>(Propose)"]
        C_Start["apply / Start<br>(Execute)"]
        C_Post["merge / archive / discard<br>(Post-actions)"]
    end

    subgraph Kanban ["Kanban Board"]
        Col_Todo["TODO<br>(To Do)"]
        Col_Inprogress["IN-PROGRESS (PROCESS)<br>(In Progress)"]
        Col_Done["DONE<br>(Done)"]
    end

    C_NewChange --> C_Propose
    C_Propose --> |Create new change| Col_Todo
    Col_Todo --> |Click Start| C_Start
    C_Start --> |Update completion rate| Col_Inprogress
    Col_Inprogress --> |All verification passes| Col_Done
    Col_Done --> |Trigger post-actions| C_Post
```

---

## Lifecycle and Detailed State Transitions Map

The detailed lifecycle, including internal agent states (`proposed`, `coded`, `reviewed`, `done`) and interactive escalation loops (`needs-human`), is mapped below.

```mermaid
graph TD
    %% Instruction Layer (OpenSpec)
    subgraph Instruction ["Instruction Layer (OpenSpec Commands / Actions)"]
        style Instruction fill:#e1f5fe,stroke:#01579b,stroke-width:2px
        C_Propose["/opsx:propose<br>(Create Proposal)"]
        C_Start["Start / Apply Button<br>(Run Agent)"]
        C_Post["Post-actions<br>(Merge / Archive / Discard)"]
    end

    %% Agent State Management
    subgraph AgentState ["Agent State Management (Agent Phase / State)"]
        style AgentState fill:#efebe9,stroke:#3e2723,stroke-width:2px
        S_Proposed["proposed<br>(Proposed)"]
        S_Coded["coded<br>(Coded)"]
        S_Reviewed["reviewed<br>(Reviewed)"]
        S_Done["done<br>(All Verified)"]
        S_NeedsHuman["needs-human<br>(Escalated / Awaiting Human)"]
    end

    %% Kanban Board
    subgraph Kanban ["Kanban Board (Kanban Columns)"]
        style Kanban fill:#f1f8e9,stroke:#33691e,stroke-width:2px
        Col_Todo["TODO<br>(To Do)"]
        Col_Inprogress["IN-PROGRESS (PROCESS)<br>(In Progress)"]
        Col_Done["DONE<br>(Done)"]
    end

    %% Lifecycle and Mapping Connections
    C_Propose -.-> S_Proposed
    S_Proposed --> Col_Todo

    C_Start -.-> S_Coded
    S_Coded --> S_Reviewed
    S_Reviewed --> S_Done

    %% State and Column Mappings
    S_Coded ===> Col_Inprogress
    S_Reviewed ===> Col_Inprogress
    S_NeedsHuman ===> Col_Inprogress

    %% needs-human Escalation Loop
    S_Coded -. Error / Inquiry .-> S_NeedsHuman
    S_Reviewed -. Error / Inquiry .-> S_NeedsHuman
    S_NeedsHuman -. Answer in Terminal .-> S_Coded

    S_Done --> Col_Done
    Col_Done -.-> C_Post
```
