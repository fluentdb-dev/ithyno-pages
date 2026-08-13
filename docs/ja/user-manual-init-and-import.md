# ithyno ユーザーマニュアル — 初期化と Import

対象読者: 新しく ithyno を触るユーザー、既存プロジェクトを openspec 化したいユーザー。
最終更新: 2026-07-24。

---

## 目次

1. [前提: プロジェクトの状態](#prerequisites-state)
2. [フロー A: 新規 / 未初期化プロジェクトを初期化する](#flow-a-initialize)
3. [フロー B: 既存プロジェクトを Import する (LLM 生成)](#flow-b-import)
4. [トラブルシューティング](#troubleshooting)

---

## 前提: プロジェクトの状態 {: #prerequisites-state }

ithyno がフォルダを開いたときの分岐は 2 パターン:

| フォルダの状態 | 表示 |
|---|---|
| `openspec/changes/` が存在 | 通常の Kanban ダッシュボードに遷移 |
| `openspec/` が無い | `NoProjectDecisionPanel` (2-branch decision) が表示 |

`NoProjectDecisionPanel` の 2 ボタン:

- **Initialize openspec here** — このフォルダを openspec プロジェクトに初期化する ([フロー A へ](#flow-a-initialize))
- **Open dashboard anyway** — 初期化せず、空の Kanban ダッシュボードを開く (中身は空)

Import は上記いずれの状態からでも起動可能 ([フロー B](#flow-b-import))。

---

## フロー A: 新規 / 未初期化プロジェクトを初期化する {: #flow-a-initialize }

### 前提となるツール

必須:
- 少なくとも 1 つのエージェント CLI (`claude` / `codex` / `agy` / `copilot` / `gemini` / `opencode` / `cursor`)

オプション (dashboard から自動 install 可):
- `tmux` — 埋め込みターミナルを tmux で包むためのマルチペイン対応
- `agmsg` — 複数エージェント dispatch のクロス通信

### 手順

**1. フォルダを開く**

Electron 版: `File → Open Project…` から対象フォルダを選択、または起動時に `--dir <path>` を指定。

**2. NoProjectDecisionPanel が表示される**

- ヘッダに folder path
- 2 ボタン: `Initialize openspec here` / `Open dashboard anyway`

**3. `Initialize openspec here` をクリック**

Onboarding page (`/onboarding?target=<path>`) に遷移。カード内の 2 セクションが表示される:

**Prerequisites** — CLI の存在チェック
- ✓ = installed / ○ = missing
- エージェント CLI (7種) と `tmux`, `agmsg (optional)` を列挙
- missing の `agmsg` には `[Install]` ボタンが表示されます。また、インストール実行セクションは Onboarding ページの `Continue` を押した後の Agmsg 構成セクション内に限定されています。tmux はステータス表示のみです。プラットフォームのパッケージマネージャ（brewやapt-getなど）から手動でインストールしてリロードしてください。
- エージェント CLI が 1 つも無い場合 → `Continue` は disabled、Settings > Prerequisites への link を表示

**Manager CLI** — Manager として使う CLI を選択
- インストール済みで、かつ Manager 役に対応している CLI のみが列挙されます。現在は `claude`, `agy`, `opencode`（`opencode` には `(unverified)` のラベルが表示）が対象です。他のインストール済み CLI（`codex`, `copilot`, `gemini`, `cursor`, `antigravity`）は Prerequisites リストには表示されますが、この選択項目には表示されません。
- 初期選択は Settings の `Default Manager` に従います（未設定なら、Manager 対応 CLI の中から `claude > agy > opencode` の優先順位でデフォルト選択されます。その他の場所で使われる全 CLI の優先順位 `CLI_PRIORITY` は `claude > codex > agy > copilot > gemini > opencode > cursor` です）。
- ラジオで選択、選択されたものは accent color でハイライト

**4. `Continue` をクリック**

`Setting up ithyno project` 画面 (同カード) に切り替わり、4 ステップの progression が表示される:

1. **Check prerequisites** — doctor 再確認
2. **Scaffold ithyno files** — `templates/` 配下のすべてのファイルをプロジェクトにコピーします。これには `CLAUDE.md`, `LICENSE`, `agents.yaml.example`, `agents.yaml.tmpl`, `docs/ideas/`、そして `/ithy-opsx:*` コマンドの実態となる `.claude/skills/ithy-opsx-*` や `.claude/skills/openspec-flow`、スラッシュコマンドファイル `.claude/commands/ithy-opsx/*` が含まれます。また、`.gitignore` に `.worktrees/` と `.ithyno/` が追加されていることを保証します。
3. **Install OpenSpec** — `@fission-ai/openspec` を開発依存関係 (`npm install --save-dev @fission-ai/openspec@latest`) としてプロジェクトに追加し、選択した Manager CLI に基づいて `npx openspec init <target> --tools <tool>` を実行します（`<tool>` は `claude`, `codex`, `gemini`, `opencode`, `cursor`, `agy → antigravity`, `copilot → github-copilot` にマッピングされます）。これにより、`openspec/config.yaml`, `openspec/specs/`, `openspec/changes/` が作成されます。
4. **Write agents.yaml** — 選択した Manager CLI を書き込んだ `agents.yaml` をルートに配置

各ステップの状態: ○ pending → ⏵ in-progress (accent color, pulse) → ✓ done (緑塗り) / ✗ failed (赤塗り)。
下部の terminal-style log pane にサブプロセスの stdout/stderr が live 表示。

**5. 完了後**

- `Open Project` ボタンが有効化 → クリックでダッシュボードに遷移、Kanban 表示
- 遷移後、`agents.yaml` があるので埋め込み terminal が Manager を auto-launch

### 途中でやり直す

`← Back` ボタン (Setting up 画面の左下) で Prerequisites / Manager picker に戻れる。実行中は disabled。

---

## フロー B: 既存プロジェクトを Import する (LLM 生成) {: #flow-b-import }

### 何をするか

既存の (openspec を持たない) プロジェクトの `README.md`, `CLAUDE.md`, `docs/`, ソースコードを **LLM sub-agent が読み込み**、first-draft の `openspec/specs/<capability>/spec.md` セットを生成する。

生成された仕様は編集可能な draft であり、ユーザーが review + commit する。

### 前提

- ithyno を **agents.yaml を持つ** project で起動中 (Manager PTY が動いていること)
- Manager が Task tool を呼べるエージェントであること（現在検証済み：`claude`。`agy` も選択可能であり Task をサポート予定ですが、Import のエンドツーエンド検証は未完了です。`opencode` も選択可能ですが `(unverified)` です）。

### 手順

**1. Electron menu / VS Code から起動**

- Electron: `File → Import Existing Project…`
- VS Code: `ithyno.importProject` command

Folder picker が開くので、Import 対象のフォルダを選択。

**2. `ImportConfirmModal` — 事前確認**

- Target path, scan 予定の code + docs サイズ、想定 token 量が表示
- Preflight チェック:
  - 対象に既に `openspec/` があっても上書きインポートが可能です。子エージェントの `openspec init` は冪等であり、各ケーパビリティごとの `spec.md` ファイルのみが（上書き）作成されます。
  - サイズが 50 MB を超えれば **400 reject**
  - Path が unauthorized (システムディレクトリなど) なら **403 reject**
  - Doctor が readyForManager: false なら **409 reject**
  - ithyno 側 Manager PTY が動いていなければ **503 reject**

**3. `Confirm` をクリック**

- 対象パスが **Pattern B** (現 project と同一) or **Pattern A** (別 project) に分類
- Server が `/ithy-opsx:import <target>` を Manager PTY に inject
- Manager は `/ithy-opsx:import` skill を実行 → Task tool で子エージェント spawn
- 子エージェントは以下を行う:
  1. `<target>` を `cd`
  2. README, CLAUDE.md, docs, ソースツリー sample を read
  3. `openspec init` を実行
  4. capability ごとに `openspec/specs/<capability>/spec.md` を書く
  5. `openspec/GENERATED.md` を書く (完了マーカー)
  6. commit はしない

**4. 進捗と完了通知**

- **Pattern B** (in-place): dashboard は現 project を watch、`openspec/GENERATED.md` 検知で Kanban 遷移 + LLM-generated banner 表示
- **Pattern A** (external target): 右上にタイトル `Import complete` とその下にターゲットパス、そして `[Open imported project]` / `[Dismiss]` ボタンが表示されます（ブラウザでの起動時は `[Copy path]` ボタンになります）。
  - Open クリックで Electron ブリッジ `window.ithyno.openProject(targetPath)` が呼び出され、`POST /api/project/switch` 経由で ithyno のアクティブプロジェクトが切り替わります。

**5. 生成物の確認**

- Target project の `git status`: `openspec/` + `openspec/GENERATED.md` が untracked として現れる
- Auto-commit は絶対に発生しない — ユーザーが review + commit
- banner に「Specs are LLM-generated drafts — review before relying on them」

### 制約

- 同時 Import は **最大 20 job** (超過は 429)
- Job TTL 1 時間 (途中放置は自動 cleanup)
- 子エージェントは Manager の CLI セクションの中で Task tool 経由で実行されるため、そのセッションの制限に依存します。ithyno 側で独自の SIGTERM/SIGKILL タイムアウトは適用されません。

---

## トラブルシューティング {: #troubleshooting }

### `Prerequisites: Could not check prerequisites: GET /api/doctor failed: 401`

Session token が送られていない古い build。`npm run build` してから Electron 再起動。

### `Setting up ithyno project` が Scaffold で失敗

- `git init` されていない project → dialog の `autoGitInit: true` が渡っているので通常は自動 init するが、失敗時は log pane を確認
- Templates が読めない → ithyno 自体のインストールを疑う (`npm install` 再実行)

### `Install OpenSpec` で失敗

- ネットワーク切断 → `npx` が package を fetch できない
- npm registry proxy の設定
- Node.js version 不整合 (`node --version` で確認、v22+ 想定)

### Import が 503 (Manager PTY not running)

ithyno を開いている project に `agents.yaml` が無い、または terminal auto-launch が抑止されている状態。以下いずれかで解決:
- ithyno を **agents.yaml のある別 project** で開き直す
- 現 project に `agents.yaml` を追加してから Import 再試行

### Terminal 領域が表示されない

対象 project に `agents.yaml` が無い場合、`guard-terminal-autolaunch-on-agents-yaml` の仕様により terminal aside は非表示。`agents.yaml` を追加 → ithyno 再起動 で表示。

### Kanban が空のまま (Initialize が反映されない)

- `openspec init` が実際に走っていない可能性 → devtools console の error + server ログを確認
- 対象フォルダに `openspec/config.yaml` が実在するか `ls <target>/openspec/config.yaml` で確認
- 存在するのに反映されない場合は WS 接続を疑う (dashboard 右上の Live / Offline インジケータ)

### `Manager CLI` picker に何も表示されない

エージェント CLI が 1 つも installed になっていない。Settings > Prerequisites で確認 + 各 CLI ベンダーの docs に沿って install (Claude Code: `npm i -g @anthropic-ai/claude-code`)。

---

## 関連ドキュメント

- `docs/architecture.md` — ithyno のアーキテクチャ全体
- `docs/roadmap.md` — 今後の予定
- `openspec/specs/dashboard/spec.md` — ダッシュボードの詳細仕様
- `openspec/changes/archive/2026-07-22-unify-open-project-3-branch/` — 決定パネルの初期実装
- `openspec/changes/archive/2026-07-23-refactor-import-to-task-tool-subagent/` — Import の現行実装
