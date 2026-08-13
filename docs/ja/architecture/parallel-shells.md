---
tags: [feature/electron, feature/vscode-extension, area/server]
---

# 並行シェル: Electron ＋ VS Code 拡張機能

ithyno の究極の目標は、**隔離された Git ワークツリーにおける UI 駆動型の並行エージェント実行**です。2つのシェルパッケージング変更（`add-electron-shell`、`add-vscode-extension`）はそのワークフローの最初の現実的なテストです。両者は独立したスコープを持ち、かつ `add-agent-runner` によってそれぞれ別個のワークツリー内で独立したエージェントとして並行して実行できます。

このドキュメントでは、そのための可動部品と関連するコードの位置について説明します。

## 3つの変更点

| 変更 | 役割 |
|---|---|
| `prep-parallel-shells` | **この準備段階の変更。** ルートの `package.json` で競合しないよう、ワークスペース設定、`build:server` スクリプト、および gitignore エントリを整理します。 |
| `add-electron-shell` | `electron/` ディレクトリを追加します。デスクトップアプリのシェルであり、既存のサーバーを起動し、BrowserWindow でそれを読み込みます。埋め込みターミナルはそのまま残ります。 |
| `add-vscode-extension` | `vscode-extension/` ディレクトリを追加します。VS Code の拡張機能であり、サーバーを起動してウェブビューで読み込みます。ターミナルは VS Code 独自のターミナルパネルに委譲されます。 |

## 共通の基盤 (すでに実装済み)

- `bin/ithyno.js` — 両方のシェルがこのスクリプトを生成・起動します。
- `add-csrf-protection` — 両方のシェルが、セッショントークン付きの起動用 URL を処理します。
- `add-agent-runner` — 両方のシェル自体が、`.worktrees/add-electron-shell/` および `.worktrees/add-vscode-extension/` で実行されるエージェントによって実装される予定です。

## この準備が行われる理由

この変更が行われる前は、両方のシェル提案がそれぞれ自分だけが `workspaces` 配列に `electron/`（または `vscode-extension/`）を追加することを想定していました。最初にマージされた方が勝ち、もう片方はマージ時に 1 行のコンフリクトを起こしてしまいます。あらかじめ両方のエントリを追加しておくことで、このコンフリクトを回避します。

## エージェントの起動と PTY

`node-pty` によるバインディングは、埋め込みのマネージャー用ターミナル（Manager PTY）には引き続き使用されますが、エージェントのジョブ実行には使用されなくなりました。

## サーバー起動時の孤立ワークツリーの救済

サーバーを再起動しても、`.worktrees/` がディスク上に置き去りになることはありません。起動時にランナーは `git worktree list --porcelain` を実行し、`agent/<change-id>` ブランチを持つ `.worktrees/<change-id>/` 配下のエントリを検出して、それぞれ `status: "orphaned"`（孤立状態）の疑似ジョブとして登録します。カンバンカードには `orphaned` バッジが表示され、マージ（Merge）または破棄（Discard）のアクションを実行できます（シグナルを送信するプロセスが存在しないため、キャンセル（Cancel）アクションは非表示になります）。

## ワークツリーからのリアルタイムな進捗同期

Claude Code の `-p`（プリント）モードで実行されるエージェントは、終了するまで PTY 出力を生成しないため、実行中のログは静止したままになります。エージェントの実行中もカンバンカードの進捗バーを正確に更新するため、ランナーはジョブごとにワークツリー内の `openspec/changes/<id>/tasks.md` ファイルを監視（Watch）します。`[x]` のチェックが入るたびに `worktree-progress-updated` WebSocket イベントが送信され、PTY の出力有無に関わらず、カード上のタスク完了数 `N/M` がリアルタイムに更新されます。

## エージェントへの最初のタスクの投入

`agents.yaml` で定義されるエージェントは、ロールごとに `prompts:` 下でプロンプトを定義します。ランナーは解決されたプロンプトを、以下の2つのディスパックモードのいずれかで渡します：

- **`cli-arg`** — プロンプトは `[promptFlag, initialInput]`（例: Claude Code の `-p "<prompt>"`、Aider の `--message "<prompt>"`）として `args` に追加されます。ワンショットの実行フラグを持つほとんどの CLI におけるデフォルトの動作です。
- **`stdin`** — プリント用フラグを持たない REPL スタイルのランタイム向けに、プロンプトをプロセスの標準入力（`child.stdin`）に書き込みます。

どちらのモードが使用されるかは、ランタイムの `promptStyle` とエージェントの `mode` によって決定されます。マネージャーエージェント（`mode: live-shell`）は第3の経路であり、子プロセスを起動するのではなく、埋め込みターミナル（PTY）へキー入力をエミュレートしてプロンプトをインジェクションします。これは [reshape-agents-yaml-mode-roles](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-14-reshape-agents-yaml-mode-roles/proposal.md) および [add-runtime-abstraction](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-07-add-runtime-abstraction/proposal.md) によって管理されます。以前の標準入力のみを用いた `initialInput` の仕組みはリバートされました（[revert-add-agent-initial-input](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-19-revert-add-agent-initial-input/proposal.md) 参照）。

## UI からのエージェント出力の閲覧

実行中の各ジョブの出力は、ANSI カラーエスケープが `<span>` 要素に変換された、シンプルなスクロールログとしてレンダリングされます（`web/src/components/AgentOutputView.tsx` 参照）。サーバー側から公開されるジョブごとのアクションは、`GET /api/agents/jobs/:id/diff` と `POST /api/agents/jobs/:id/cancel` の2つだけです。

対話型の TTY プロンプトはサポートされていません。エージェントは `-p` モードまたは `--yolo` などの自動承認フラグを指定して実行されることを前提としています。このドキュメントの以前のバージョンで説明されていた xterm.js ターミナルとキー入力の転送エンドポイント（`POST /api/agents/jobs/:id/input`）はリバートされました（[revert-agent-pty-layers](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-04-revert-agent-pty-layers/proposal.md) 参照）。`args` に指定された自動承認（YOLO）フラグの安全性は、ワークツリーによる環境の隔離によって担保されます。

## UI からの並行ワークスペースの起動

この機能をローカルテストする場合は、`npm run dev` ではなく **`npm run dev:test`** を使用してください。`dev` はサーバーを `tsx watch` で起動するため、サーバー側のファイルを保存するたびにサーバーが再起動し、実行中のすべての子エージェントに SIGTERM が送信されてしまいます。`dev:test` はサーバープロセスを固定したまま、フロントエンドの HMR（ホットモジュールリプレースメント）を維持します。

Kanban の TODO 列には、列ヘッダーの `+ New Change` の横に **`Start ▾ (N)`** という一括起動用ランチャーが表示されます（[add-parallel-start-launcher](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-02-add-parallel-start-launcher/proposal.md) 参照）。IN-PROGRESS 列や DONE 列にはこのヘッダーランチャーはありません（[hide-start-in-progress-column](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/2026-07-21-hide-start-in-progress-column/proposal.md) 参照）。TODO から IN-PROGRESS に一括遷移させることのみが意味のあるセマンティクスだからです。このランチャーには、起動可能なすべての変更（検証以外のタスクがあり、未実行で、エージェントが使用可能な状態のもの）が表示され、実行中のジョブと並行して2つ目、3つ目のエージェントを実行できます。

- 候補の判定ロジック: `web/src/util/changeState.ts` 内の `startableCandidates()`。カード単位の Start アクションとロジックを共有しています。
- ディスパッチ処理: `useStartFlow().startImplementation` を再利用します。カード単位の Start と同じく、ExecutionPicker およびワークツリー / ターミナルの分岐を処理します。
- 多重実行: キューイングはありません。ユーザーが3つ選択すれば、3つのエージェントが同時に起動します。

## Claude デフォルトエージェントによる apply 完了時の自動コミット

現在、`agents.yaml` にバンドルされている Claude エントリは `/opsx:apply ${change_id}` を実行します。これは自動コミットを行わないアップストリームの適用フローです。[add-ithy-opsx-apply](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/add-ithy-opsx-apply/proposal.md) がマージされ、`agents.yaml` が `/ithy-opsx:apply ${change_id}` に切り替わると、ラッピングスキル（`.claude/skills/ithy-opsx-apply/SKILL.md`）がアップストリームのフローを呼び出した後、最後に `git commit` を実行します。これにより、エージェントのブランチに変更内容がコミットされた状態で保存され、アーカイブスキルの安全ネットに頼ることなく実装履歴が記録されます。これにより、1つの変更が完了するまでに、実装用（マージによる）とアーカイブ移動用の計2つのコミットが作成されます。

## 単一の Git コミットとしてのアーカイブ処理

Kanban の DONE 列にある「Archive」ボタンをクリックすると、Claude モードでは **`/ithy-opsx:archive <id>`** コマンドがインジェクションされます（CLI モードの場合は引き続き `npx openspec archive <id>` を使用します）。この Claude コマンドは、[`ithy-opsx-archive`](https://github.com/fluentdb-dev/ithyno/blob/main/.claude/skills/ithy-opsx-archive/SKILL.md) スキルに従います。このスキルは、事前チェック、オプションとしてのワークツリーのマージ（`git merge --no-ff agent/<id>`）、`openspec archive` の実行、そしてユーザーが確定前にレビューできる自動生成されたコミットの作成までの一連のフローを処理します。

## ダッシュボードからのワークツリーのプレビュー

エージェントのジョブ実行中、その変更はディスク上の2つの場所に存在します。メインツリーの `openspec/changes/<id>/`（凍結されたプロポーザル）と、ワークツリーの `.worktrees/<id>/openspec/changes/<id>/`（エージェントによる変更中の中間ファイル）です。ダッシュボードは、URL に基づいてどちらのバージョンを読み出すかを判定します。変更の URL に **`?tree=worktree`** を付加すると（例: `/change/add-vscode-extension?tree=worktree`）、サーバーはワークツリー側のファイルを返します。また、Change Detail 画面のヘッダーには「ワークツリーを表示中 · メインに戻る」というピル（切替表示）が表示されます。実行中のジョブに対応する Kanban カードは自動的にワークツリー側の URL へリンクするため、カードの進捗状況と Change Detail ページの表示内容が常に同期します。ワークツリーが消滅（ジョブが破棄、またはワークツリーが手動で削除）すると、`?tree=worktree` 付きの URL はメインツリーの表示へ自動的にフォールバックされ、小さな通知が表示されます。

## N個の変更にまたがる並行ディスパッチ

`/ithy-opsx:dispatch <id>`（`add-manager-loop-skill` によって導入）は、1つの変更を `code → review → verify` フェーズに沿って処理します。複数の変更を並行して実行する準備ができている場合は、`/ithy-opsx:dispatch-multi <id1> [id2] ...` を使用して並行して管理します：

- **並行数の上限**: `agents.yaml.maxParallel`（デフォルト値 `3`、設定可能範囲 `[1, 10]`）。上限を超えるジョブはキューに入り、実行中のジョブが終了するのを待ちます。
- **メッセージのルーティング**: 各ワーカーはレポートトークンに変更IDを追加して送信します（`stage:$S status:done change:<id>`）。これにより、マネージャーは1つのインボックスで複数の進行中の変更メッセージを正しく識別できます。既存の単一ディスパッチスキルもこの拡張フォーマットで送信し、マネージャーのパーサーは新規およびレガシーの両方のフォーマットに対応します。
- **変更ごとの独立性**: 1つの変更でエラーが発生してエスカレーション（例: `MAX_REWORK_ROUNDS = 5` （`agents.yaml.maxReworkRounds` で設定。設定範囲 `[1, 10]`）の上限に達して停止）しても、他の変更の処理には影響しません。それぞれの変更は独自のスケジュールで進行します。
- **レポート**: 終了時に、変更ごとに最終フェーズ、実行回数、および経過時間（またはエスカレーションされた理由）のサマリーを出力します。

準備完了した変更が2つ以上ある場合は `dispatch-multi` を推奨します。全体の所要時間は `sum(各ジョブの時間)` から `max(最も遅いジョブの時間) ＋ キューの消化時間` に大幅に短縮されます。1つずつ処理する通常のケースでは、従来の単一 dispatch も引き続き動作します。

## 関連ドキュメントの推奨読取順序

初めて並行シェルの仕組みを追う場合は、以下の順序で読み進めることを推奨します：

1. [Electron のフォルダ構成に関する提案](https://github.com/fluentdb-dev/ithyno/blob/main/docs/ideas/2026-06-29-electron-shell-folder-layout.md)
2. [add-electron-shell プロポーザル](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/add-electron-shell/proposal.md)
3. [add-vscode-extension プロポーザル](https://github.com/fluentdb-dev/ithyno/blob/main/openspec/changes/archive/add-vscode-extension/proposal.md)
4. アーカイブ済みの場合は `add-agent-runner` の仕様、実行中の場合は `add-agent-runner` の提案
5. UI 上のランチャーに関する `add-parallel-start-launcher`
