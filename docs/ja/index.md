<div class="ithyno-landing">

<section class="ithyno-hero">
  <div class="ithyno-hero__copy">
    <p class="ithyno-eyebrow">OpenSpec × AI Agentワークフロー</p>
    <h1>仕様から完了までを、見える形に。</h1>
    <p class="ithyno-lead">ithynoは、OpenSpecのChange、役割を持つAI Agent、隔離されたGit worktreeをローカルダッシュボードでつなぎます。</p>
    <div class="ithyno-actions">
      <a class="md-button md-button--primary" href="installation/">インストールして始める</a>
      <a class="md-button" href="project-creation-flow/">最初のプロジェクトを作成</a>
      <a class="ithyno-text-link" href="https://github.com/fluentdb-dev/ithyno">GitHubを見る →</a>
    </div>
  </div>
  <figure class="ithyno-hero__visual">
    <img src="../assets/images/ithyno-overview.png" alt="複数レーンの進行中OpenSpec ChangeとManagerターミナルを並べて表示するithynoダッシュボード">
  </figure>
</section>

<section class="ithyno-pillars" aria-label="ithynoの設計原則">
  <article><strong>OpenSpecを中心に</strong><span>仕様とタスクはプレーンなMarkdownのままです。</span></article>
  <article><strong>役割を持つAgent</strong><span>code・review・verifyを分けて委譲します。</span></article>
  <article><strong>隔離された実行環境</strong><span>異なるChangeを個別のGit worktreeで実行します。</span></article>
  <article><strong>ローカルで確認可能</strong><span>成果物、差分、履歴をリポジトリで確認できます。</span></article>
</section>

<section class="ithyno-section ithyno-section--center">
  <p class="ithyno-eyebrow">ひとつにつながったワークフロー</p>
  <h2>提案から完了したChangeまで</h2>
  <p class="ithyno-section__intro">各段階を明確に保ちます。Managerが作業を委譲し、Agentが確認可能な成果物を作成し、人がマージとアーカイブのタイミングを判断します。</p>
  <div class="ithyno-flow" aria-label="提案、実装、レビュー、検証、マージとアーカイブ">
    <span><b>1</b>Propose</span><i>→</i><span><b>2</b>Code</span><i>→</i><span><b>3</b>Review</span><i>→</i><span><b>4</b>Verify</span><i>→</i><span><b>5</b>Merge &amp; Archive</span>
  </div>
  <div class="ithyno-gallery ithyno-gallery--three">
    <figure><img src="../assets/images/electron-propose-dialog.png" alt="ithynoでOpenSpecのChangeを作成する" loading="lazy"><figcaption>Changeを記述</figcaption></figure>
    <figure><img src="../assets/images/electron-dispatch-running.png" alt="dispatchされたChangeをAgentが処理している画面" loading="lazy"><figcaption>適切なWorkerへ委譲</figcaption></figure>
    <figure><img src="../assets/images/electron-done.png" alt="ithynoダッシュボードに表示された完了済みChange" loading="lazy"><figcaption>結果を確認</figcaption></figure>
  </div>
</section>

<section class="ithyno-feature">
  <div class="ithyno-feature__copy">
    <p class="ithyno-eyebrow">ダッシュボード + Manager</p>
    <h2>動いているワークフローを把握する</h2>
    <p>看板で各Changeを追跡しながら、隣にManagerターミナルを表示できます。カードからChange IDをコピーしてdispatchし、プロジェクト画面を離れず作業を追跡できます。</p>
    <a href="multi-agent-execution-flow/">マルチエージェント実行フローを見る →</a>
  </div>
  <figure><img src="../assets/images/ithyno-agents.png" alt="設定済みWorkerとManagerターミナルを表示するithynoのAgents画面" loading="lazy"></figure>
</section>

<section class="ithyno-feature ithyno-feature--reverse">
  <div class="ithyno-feature__copy">
    <p class="ithyno-eyebrow">OpenSpecが信頼できる情報源</p>
    <h2>仕様は読みやすいまま</h2>
    <p>ithynoはOpenSpecを独自の状態管理へ置き換えません。リポジトリに保存された仕様、タスク、成果、アーカイブ済みChangeをそのまま表示します。</p>
    <a href="architecture/openspec-kanban/">OpenSpecとダッシュボードの連携を見る →</a>
  </div>
  <figure><img src="../assets/images/ithyno-specs.png" alt="ithynoに表示されたOpenSpecの要件" loading="lazy"></figure>
</section>

<section class="ithyno-section ithyno-agents-block">
  <div class="ithyno-section__heading">
    <div><p class="ithyno-eyebrow">制御可能なマルチAgent開発</p><h2>役割ごとに適切なCLIを割り当てる</h2></div>
    <p>Managerと、code・review・verifyのWorkerを分けて設定できます。異なるChangeは並行して進められ、ひとつのChange内の段階は順序と確認可能性を保ちます。</p>
  </div>
  <div class="ithyno-dialogs">
    <figure><img src="../assets/images/agent-manager.png" alt="Manager Agentの設定" loading="lazy"><figcaption>Manager</figcaption></figure>
    <figure><img src="../assets/images/agent-code.png" alt="code Agentの設定" loading="lazy"><figcaption>Code</figcaption></figure>
    <figure><img src="../assets/images/agent-review.png" alt="review Agentの設定" loading="lazy"><figcaption>Review</figcaption></figure>
  </div>
  <p class="ithyno-centered-link"><a href="multi-agent-setup-and-dispatch/">複数Agentの設定と確認済みCLI経路を見る →</a></p>
</section>

<section class="ithyno-section ithyno-section--center">
  <p class="ithyno-eyebrow">作業環境を選択</p>
  <h2>普段の環境でithynoを使う</h2>
  <div class="ithyno-surface-grid">
    <article>
      <img src="../assets/images/vscode-simple-2.png" alt="VS Code内で動作するithyno" loading="lazy">
      <div><h3>VS Code Extension</h3><p>エディタの隣にChangeとManagerを表示します。</p><a href="project-creation-flow/#vs-code">VS Codeではじめる →</a></div>
    </article>
    <article>
      <img src="../assets/images/electron-agent-view.png" alt="ithyno Electronアプリ" loading="lazy">
      <div><h3>Electron App</h3><p>独立したデスクトップ画面でプロジェクトを管理します。</p><a href="project-creation-flow/#electron-app">Electronではじめる →</a></div>
    </article>
  </div>
</section>

<section class="ithyno-section ithyno-advanced">
  <div class="ithyno-section__heading">
    <div><p class="ithyno-eyebrow">シンプルにはじめ、必要に応じて拡張</p><h2>高度な実行環境は任意です</h2></div>
    <p>必要になった段階で、worktreeによる並行実行、tmuxで持続するManagerセッション、agmsg通信、CLIごとのSkillを追加できます。</p>
  </div>
  <div class="ithyno-mini-cards">
    <a href="architecture/openspec-worktree/"><strong>Git worktree</strong><span>同時に動くChangeを隔離します。</span></a>
    <a href="advanced/tmux-and-agmsg/"><strong>tmux &amp; agmsg</strong><span>セッションを維持し、Agentを接続します。</span></a>
    <a href="skill-capabilities/"><strong>Agent Skill</strong><span>各CLIへインストールされる機能を確認します。</span></a>
  </div>
</section>

<section class="ithyno-get-started">
  <p class="ithyno-eyebrow">はじめる</p>
  <h2>3つの手順で最初のChangeを作成</h2>
  <ol><li><b>インストール</b><span>Git、Node.js、ithynoを準備します。</span></li><li><b>初期化</b><span>新規または既存プロジェクトをOpenSpecへ接続します。</span></li><li><b>作成してdispatch</b><span>Changeを定義し、Managerへ渡します。</span></li></ol>
  <div class="ithyno-actions ithyno-actions--center"><a class="md-button md-button--primary" href="installation/">ithynoをインストール</a><a class="md-button" href="project-creation-flow/">シンプルプロジェクトの手順を見る</a></div>
</section>

<section class="ithyno-final-cta">
  <h2>仕様、Agent、Gitの変更をひとつにつなぐ。</h2>
  <p>ローカルから始め、すべての段階を確認可能にします。</p>
  <a class="md-button md-button--primary" href="https://github.com/fluentdb-dev/ithyno/releases">GitHub Releasesからダウンロード</a>
</section>

</div>
