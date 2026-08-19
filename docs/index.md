<div class="ithyno-landing">

<section class="ithyno-hero">
  <div class="ithyno-hero__copy">
    <p class="ithyno-eyebrow">OpenSpec × AI agent workflows</p>
    <h1>Make spec-driven development visible.</h1>
    <p class="ithyno-lead">ithyno connects OpenSpec changes with role-based AI agents, isolated Git worktrees, and a local dashboard—from proposal to completion.</p>
    <div class="ithyno-actions">
      <a class="md-button md-button--primary" href="installation/">Install and get started</a>
      <a class="md-button" href="project-creation-flow/">Create your first project</a>
      <a class="ithyno-text-link" href="https://github.com/fluentdb-dev/ithyno">View on GitHub →</a>
    </div>
  </div>
  <figure class="ithyno-hero__visual">
    <img src="assets/images/ithyno-overview.png" alt="ithyno dashboard showing active OpenSpec changes across lanes beside the Manager terminal">
  </figure>
</section>

<section class="ithyno-pillars" aria-label="ithyno principles">
  <article><strong>OpenSpec first</strong><span>Specifications and tasks remain plain Markdown.</span></article>
  <article><strong>Role-based agents</strong><span>Delegate code, review, and verify separately.</span></article>
  <article><strong>Isolated execution</strong><span>Run different changes in independent Git worktrees.</span></article>
  <article><strong>Local and inspectable</strong><span>Review artifacts, diffs, and history in your repository.</span></article>
</section>

<section class="ithyno-section ithyno-section--center">
  <p class="ithyno-eyebrow">One controlled workflow</p>
  <h2>From proposal to completed change</h2>
  <p class="ithyno-section__intro">Keep each stage explicit. The Manager delegates work, agents produce inspectable artifacts, and you decide when a change is ready to merge and archive.</p>
  <div class="ithyno-flow" aria-label="Propose, code, review, verify, merge and archive">
    <span><b>1</b>Propose</span><i>→</i><span><b>2</b>Code</span><i>→</i><span><b>3</b>Review</span><i>→</i><span><b>4</b>Verify</span><i>→</i><span><b>5</b>Merge &amp; archive</span>
  </div>
  <div class="ithyno-gallery ithyno-gallery--three">
    <figure><img src="assets/images/electron-propose-dialog.png" alt="Create an OpenSpec change in ithyno" loading="lazy"><figcaption>Describe the change</figcaption></figure>
    <figure><img src="assets/images/electron-dispatch-running.png" alt="An agent working on a dispatched change" loading="lazy"><figcaption>Dispatch the right worker</figcaption></figure>
    <figure><img src="assets/images/electron-done.png" alt="Completed changes in the ithyno dashboard" loading="lazy"><figcaption>Inspect the result</figcaption></figure>
  </div>
</section>

<section class="ithyno-feature">
  <div class="ithyno-feature__copy">
    <p class="ithyno-eyebrow">Dashboard + Manager</p>
    <h2>See the workflow while it runs</h2>
    <p>Track every Change on the board while keeping the Manager terminal beside it. Copy a Change ID from its card, dispatch it, and follow the work without leaving the project view.</p>
    <a href="multi-agent-execution-flow/">See the multi-agent execution flow →</a>
  </div>
  <figure><img src="assets/images/ithyno-agents.png" alt="ithyno Agents view with configured workers and Manager terminal" loading="lazy"></figure>
</section>

<section class="ithyno-feature ithyno-feature--reverse">
  <div class="ithyno-feature__copy">
    <p class="ithyno-eyebrow">OpenSpec remains the source of truth</p>
    <h2>Your specifications stay readable</h2>
    <p>ithyno does not replace OpenSpec with a private state store. It presents the specifications, tasks, outcomes, and archived changes already stored in your repository.</p>
    <a href="architecture/openspec-kanban/">How OpenSpec connects to the dashboard →</a>
  </div>
  <figure><img src="assets/images/ithyno-specs.png" alt="OpenSpec requirements displayed in ithyno" loading="lazy"></figure>
</section>

<section class="ithyno-section ithyno-agents-block">
  <div class="ithyno-section__heading">
    <div><p class="ithyno-eyebrow">Controlled multi-agent work</p><h2>Assign the right CLI to each role</h2></div>
    <p>Configure a Manager and separate code, review, and verify workers. Different changes can run in parallel; the stages of one change remain ordered and reviewable.</p>
  </div>
  <div class="ithyno-dialogs">
    <figure><img src="assets/images/agent-manager.png" alt="Manager agent configuration" loading="lazy"><figcaption>Manager</figcaption></figure>
    <figure><img src="assets/images/agent-code.png" alt="Code agent configuration" loading="lazy"><figcaption>Code</figcaption></figure>
    <figure><img src="assets/images/agent-review.png" alt="Review agent configuration" loading="lazy"><figcaption>Review</figcaption></figure>
  </div>
  <p class="ithyno-centered-link"><a href="multi-agent-setup-and-dispatch/">Configure multiple agents and check verified CLI routes →</a></p>
</section>

<section class="ithyno-section ithyno-section--center">
  <p class="ithyno-eyebrow">Choose your workspace</p>
  <h2>Use ithyno where you work</h2>
  <div class="ithyno-surface-grid">
    <article>
      <img src="assets/images/vscode-simple-2.png" alt="ithyno running inside VS Code" loading="lazy">
      <div><h3>VS Code Extension</h3><p>Keep changes and the Manager alongside your editor.</p><a href="project-creation-flow/#vs-code">Start with VS Code →</a></div>
    </article>
    <article>
      <img src="assets/images/electron-agent-view.png" alt="ithyno Electron application" loading="lazy">
      <div><h3>Electron App</h3><p>Manage a project from a dedicated desktop window.</p><a href="project-creation-flow/#electron-app">Start with Electron →</a></div>
    </article>
  </div>
</section>

<section class="ithyno-section ithyno-advanced">
  <div class="ithyno-section__heading">
    <div><p class="ithyno-eyebrow">Start simple, extend when needed</p><h2>Advanced execution is optional</h2></div>
    <p>Add worktree parallelism, a persistent tmux Manager session, agmsg communication, and per-CLI skills when your workflow needs them.</p>
  </div>
  <div class="ithyno-mini-cards">
    <a href="architecture/openspec-worktree/"><strong>Git worktrees</strong><span>Isolate concurrently active changes.</span></a>
    <a href="advanced/tmux-and-agmsg/"><strong>tmux &amp; agmsg</strong><span>Keep sessions alive and connect agents.</span></a>
    <a href="skill-capabilities/"><strong>Agent skills</strong><span>Understand the capabilities installed for each CLI.</span></a>
  </div>
</section>

<section class="ithyno-get-started">
  <p class="ithyno-eyebrow">Get started</p>
  <h2>Your first Change in three steps</h2>
  <ol><li><b>Install</b><span>Prepare Git, Node.js, and ithyno.</span></li><li><b>Initialize</b><span>Connect a new or existing project to OpenSpec.</span></li><li><b>Create and dispatch</b><span>Define a Change, then hand it to the Manager.</span></li></ol>
  <div class="ithyno-actions ithyno-actions--center"><a class="md-button md-button--primary" href="installation/">Install ithyno</a><a class="md-button" href="project-creation-flow/">Follow the simple project guide</a></div>
</section>

<section class="ithyno-final-cta">
  <h2>Keep specifications, agents, and Git changes connected.</h2>
  <p>Start locally and keep every step inspectable.</p>
  <a class="md-button md-button--primary" href="https://github.com/fluentdb-dev/ithyno/releases">Download from GitHub Releases</a>
</section>

</div>
