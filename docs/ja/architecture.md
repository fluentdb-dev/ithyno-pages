# 技術アーキテクチャ

ithyno の技術設計書です。**ローカルブラウザベースのダッシュボード**モデル、および **OpenSpec** への厳密な準拠を前提としています。

---

## 1. ゴールと非ゴール (Goals and Non-Goals)

### ゴール
- OpenSpec の `openspec/` ディレクトリを唯一の真実のソース（Source of Truth）として扱い、進捗を**視覚化**します。
- ダッシュボード UI からの、`tasks.md` 内のチェックボックスの**双方向編集**（UI <-> ファイル）をサポートします。
- AI エージェントなどの外部プロセスによって行われた編集を、**即座に UI に反映**します。
- Markdown の記述をクリーンに保ちます（カスタム HTML コメントや独自の方言を埋め込みません）。

### 非ゴール (v1 のスコープ対象外)
- 複数リポジトリの厳密な排他制御、リモート同期、または複数ユーザーによる共同編集。
- OpenSpec 自体の CLI 機能（例: `openspec change`）の置き換え。
- 仕様書コンテンツ（要件/シナリオ）の高度な WYSIWYG 編集。その他の書き込み経路（実行モード、フェーズ遷移、needs-human への回答、エージェントのディスパッチ、`agents.yaml`, `.openspec.yaml`）は、専用の API によって処理されます（§7 参照）。

---

## 2. 対象となる OpenSpec ディレクトリ構成

```
openspec/
  specs/
    [domain]/
      spec.md              # アクティブな仕様 (真実のソース)
  changes/
    [change-name]/
      proposal.md          # 変更の理由と内容 (## Intent / ## Scope / ## Approach)
      design.md            # 技術的なアプローチ
      tasks.md             # 実装タスクのチェックリスト (進捗管理のコア)
      .openspec.yaml       # メタデータのサイドカー
      specs/
        [domain]/
          spec.md      # 差分仕様 (## ADDED/MODIFIED/REMOVED)
    archive/
      [YYYY-MM-DD-change-name]/   # 完了した変更（アーカイブ）
```

### 解析対象のフォーマット

**tasks.md (進捗管理のコア)**
```markdown
# Tasks

## 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state
- [x] 1.2 Add CSS custom properties for colors

## 2. UI Components
- [ ] 2.1 Create ThemeToggle component
```
- `## N. <section>` を用いて論理的にグループ化します。
- 個々のタスクは `- [ ] N.M <text>` または `- [x] N.M <text>` として定義され、階層的なナンバリング（例: 1, 1.1, 1.2）を使用します。

**spec.md / 差分仕様**
```markdown
## Purpose
...
### Requirement: User Authentication
The system SHALL ...
#### Scenario: Valid credentials
- GIVEN ...
- WHEN ...
- THEN ...
```
差分仕様では `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` を使用します。

**proposal.md** — `## Intent` / `## Scope` / `## Approach` を含みます。

---

## 3. システムアーキテクチャ

ローカル環境で完全に自己完結する 3 層アーキテクチャです。

| レイヤー | 役割 | 主要テクノロジー |
|---|---|---|
| **クライアント** | ダッシュボードのレンダリングとインタラクション | Vite + React + TypeScript |
| **サーバー** | パース、局所的な編集（Surgical Edits）、およびファイル監視 | Node.js + Fastify + chokidar |
| **ストア** | 真実のソース | `openspec/` 配下の `.md` ファイル群 |

開発時は Vite 開発サーバー ＋ プロキシ設定、本番・パッケージ時は Fastify が静的アセットを配信することで、クライアントとサーバーが単一のプロセスとして実行できるように設計されています。

### データフロー

1. **初回ロード** — サーバーが `openspec/` を再帰的にスキャン → ドメインモデルにパース → REST API `GET /api/state` 経由で返却。
2. **UI からファイルへ (Toggle)** — チェックボックスがクリックされる → `POST /api/tasks/toggle` を送信 → サーバーが `tasks.md` 内の**対象行のみを書き換え** → 保存。
3. **ファイルから UI へ (外部編集の反映)** — chokidar が変更を検出 → 差分を解析 → WebSockets 経由で全クライアントに即座にプッシュ。

---

## 4. テクノロジースタックと選定理由

| 領域 | テクノロジー | 選定理由 / 代替案 |
|---|---|---|
| フロントエンド | **React + TypeScript + Vite** | 型の安全性、HMR（ホットモジュールリプレースメント）、豊富なエコシステム。代替案: Svelte (軽量だが、開発者の習熟度を優先)。 |
| サーバー | **Node.js + Fastify** | フロントエンドとの言語統一、軽量、高速。代替案: Express (成熟しているが低速)、Vite 独立プラグイン (監視ロジックが複雑化するため却下)。 |
| Markdown パーサー | **unified / remark + remark-gfm** | AST 経由で GFM タスクリストを安全に処理可能。行の位置情報（`position`）を取得できるため、正確な行の特定が可能。代替案: 独自の実装（正規表現など。壊れやすいため却下）。 |
| ファイル監視 | **chokidar** | 安定しており、クロスプラットフォームで動作。`awaitWriteFinish` により、書き込み途中の不完全なファイル検出を回避。 |
| リアルタイム同期 | **WebSocket (`ws`)** | 双方向で低遅延。代替案: SSE (サーバーからクライアントへの片方向で十分な場合は有力だが、シンプルさのために WebSocket を採用)。 |
| クライアント状態管理 | **Zustand** | 軽量。WebSocket イベント受信時に状態全体を簡単に置き換え可能。代替案: Redux (オーバーキル)。 |
| UI デザイン | **Vanilla CSS ＋ カスタムプロパティによるテーマ設定** | `[data-theme=light\|dark]` の下でセマンティックな `--bg-*` / `--fg-*` 変数を使用（`web/src/styles.css` 参照）。Tailwind は不使用、ドラッグ＆ドロップ用ライブラリも使用しません。 |
| CLI コマンド | **Node bin ＋ `commander`** | `npx ithyno` で起動可能。また `ithyno init` / `ithyno doctor` サブコマンドも提供。 |
| 配布方法 | **npm パッケージ** | `npx ithyno` ですぐに実行可能。 |

---

## 5. ドメインモデル (サーバー内部表現)

パースされた結果は、正規化された読み取り専用モデルとして表現されます。後述の同期ポリシーにより、**このモデルから Markdown 全体を再シリアライズして書き戻すことはしません**。

厳密な型定義は [`server/model.ts`](https://github.com/fluentdb-dev/ithyno/blob/main/server/model.ts) に存在します。フェーズ状態遷移、ワークツリー、needs-human、doctor、git status、エージェントランナーなど、機能の進化に伴って型定義も拡張されていますが、以下は **§6（双方向同期）において重要なフィールドのみを抜粋したもの**です：

```ts
// 抜粋 — 完全な定義は server/model.ts を参照してください。
type WorkspaceState = {
  root: string;                 // openspec/ への絶対パス
  specs: SpecDomain[];          // アクティブな仕様書
  changes: Change[];            // アクティブな変更
  archive: ChangeSummary[];     // 完了した変更 (一覧のみ)
  // ...その他: exists, gitStatus, lock, hasClaudeMd, hasAgentsYaml, generatedMarkerPresent
};

type Change = {
  id: string;                   // ディレクトリ名 = change-name
  proposal: ProposalDoc | null; // Intent/Scope/Approach
  design: RawDoc | null;
  tasks: TaskList;
  deltaSpecs: SpecDomain[];
  progress: { done: number; total: number };
  // ...その他: hasOutcome, phase, priorPhase, escalatedAt, needsHumanQuestion,
  //          worktree: { path, branch, tasksProgress }
};

type TaskList = {
  filePath: string;
  sections: TaskSection[];
  baseHash: string;             // パース時に確認したファイルハッシュ — トグル時に送り返される
  // ...その他: parseError, raw
};

type TaskSection = { title: string; tasks: Task[] };

type Task = {
  id: string;        // 例: "1.2"
  text: string;
  checked: boolean;
  line: number;      // tasks.md 内の0から始まる行番号 (編集ターゲットの特定に使用)
  filePath: string;
  raw: string;       // 元の行の完全なテキスト — 行ずれ時のフォールバック用 expectedText (6.2) として使用
};
```

`line` 行番号（および期待される行テキストとしての `raw`、ファイルバージョンとしての `baseHash`）を保持することが、双方向同期の鍵です。UI からトグルされると、「ファイルパス ＋ 行番号 ＋ 期待される行テキスト ＋ 確認したファイルハッシュ」が送信され、サーバーはその特定の行のみを編集します。

---

## 6. 双方向同期設計 (プロジェクトのコア)

このセクションでは、`idea.md` で提起された主要なトレードオフである「編集競合」と「Markdown の方言（スタイルの破壊）」に対処する方法を説明します。

### 6.1 基本原則: 全体シリアライズを避け「局所的な編集 (Surgical Edits)」を行う

UI の更新時に、モデルから `tasks.md` 全体を**再生成して上書きすることはしません**。その理由は以下の通りです：
- 全体の再シリアライズを行うと、AI エージェントが記述したカスタムコメント、空行、フォーマットの細かなニュアンスが破壊され、無駄な Git 差分（diff）が発生してしまいます。
- これは「Markdown の可読性を維持する」という設計ゴールに反します。

代わりに、私たちは**対象行の単一のチェックボックス文字のみを置換**します。

```
変更前: - [ ] 1.2 Add CSS custom properties for colors
変更後: - [x] 1.2 Add CSS custom properties for colors
        ↑ この1文字だけを変更します。他のバイトには一切触れません。
```

実装方法: 対象ファイルを開き、**厳密な正規表現**を使用して、指定された `line` 内の `- [ ]` <-> `- [x]` を正確に1回だけ置換して書き戻します。インデント、タスク番号、本文のテキストは一切変更されません。

**正規表現は、チェックボックスのマーカー部分のみを厳密にキャプチャする必要があります**。行全体を再構築しようとすると、複数行にわたるタスク（インデントされた継続行）を破壊するリスクがあります。

```markdown
- [ ] 1.2 Add CSS custom properties for colors
      (Note: Use OKLCH color space)        ← 継続行。変更してはならない。
```

採用されているパターン（チェックボックスの状態文字のみを置換し、後方参照によってテキストを維持する）：
```
/^([ \t]*[-*][ \t]*\[)[ xX](\][ \t]+)/
-> 置換後の状態文字 (' ' または 'x') のみを挿入します
```
文字クラスには、`\s` ではなく意図的に `[ \t]` を使用しています。`\s` は改行コード `\n` にもマッチしてしまい、複数行の入力に対して予期しない動作をするためです。現在のソースコードは [`server/sync/surgicalEdit.ts`](https://github.com/fluentdb-dev/ithyno/blob/main/server/sync/surgicalEdit.ts) を参照してください。
- 行頭の空白、リストマーカー（`-`/`*`）、および `[` と `]` の後の空白をキャプチャし、その間の1文字のみを上書きします。
- 読み込み時には、大文字の `X` もチェックされた状態として受け入れます（書き込み時には小文字の `x` に正規化されます）。
- 継続行、タスクの本文テキスト、および行末のコメントには一切影響しません。
- この厳密性は、`surgicalEdit.ts` に対する**必須のユニットテスト**（複数行タスク、タブインデント、`*` マーカー、大文字の `X` を網羅）によって保証されています。

### 6.2 競合検出 (楽観的ロック)

トグル（チェックボックス切り替え）リクエストには、UI が最後に確認したファイルの**ハッシュ（または変更日時 mtime）**と、**元の行テキスト (`expectedText`)** が含まれます。

```
POST /api/tasks/toggle
{ filePath, line, desiredChecked: true, baseHash: "sha1:...", expectedText: "- [ ] 1.2 Add CSS custom properties for colors" }
```

書き込みを実行する前に、サーバーはファイルを再読み込みし、**2段階**で検証します：

1. **ハッシュの一致**: 局所的な編集（Surgical Edit）を直接実行します（高速パス）。
2. **ハッシュの不一致**（操作の間に外部で編集が行われたことを意味します）: 即座に処理を拒否するのではなく、**行のずれ（シフト）を吸収するためのフォールバック処理**を試みます：
   - 指定された行番号 `line` のテキストが `expectedText` と完全に一致する場合: その行をそのまま編集します（行番号と内容が一致しているため）。
   - 一致しない場合、ファイル全体をスキャンして、**`expectedText` と完全に一致する行が1行だけ存在するか**を確認します。見つかった場合は、その行を編集します（**行のずれを自動的に補正**します）。
   - 一致する行が0行、または2行以上存在する場合（曖昧な状態）: 書き込みを中止し、最新の状態データとともに **409 Conflict** を返します。

設計意図: AI エージェントがドキュメントの上部に単に行を挿入した場合（対象のタスク行の内容自体は変更されていない場合）、ファイルハッシュは変化しますが、対象行は `expectedText` によって依然として識別可能です。この場合、**409 エラーを発生させることなく操作は成功します**。これにより、誰かがファイルを編集するたびにすべてのクリックが拒否されるといったストレスが排除されます。本物の 409 競合が発生するのは、**クリックされた特定のタスク行そのものが AI によって編集された**という稀なケースのみに制限されます。

これにより、更新情報の紛失を防ぎます。OS レベルのファイルロックには依存しないため、堅牢性と移植性に優れています。

### 6.3 エコー抑制 (自己書き込みループの防止)

サーバー自身による書き込みが chokidar 監視をトリガーすると、無駄な再パースやプッシュ送信のループが発生します。これに対する対策は以下の通りです：
- **サーバーの書き込み直後に新しいハッシュを記録**し、そのハッシュと一致する監視イベントは無視します（自己発火の抑制）。
- chokidar の `awaitWriteFinish` を有効にして、書き込み途中の不完全なファイルが処理されないようにします。

### 6.4 外部編集の反映フロー

```
AI が tasks.md を編集
  -> chokidar の変更イベントを検知 (awaitWriteFinish の経過後)
  -> ハッシュの比較: 自己発火であれば無視、外部からの編集であれば処理を継続
  -> 変更されたファイルのみを再パース (全体スキャンは行わない)
  -> WebSocket 経由で全クライアントに { type: "change-updated", changeId, ... } をプッシュ送信
  -> UI が対応するコンポーネントを更新 (進捗バーとチェック状態が即座に同期)
```

### 6.5 AI のストリーミング書き込みとライブワーカー状態

`awaitWriteFinish` (6.3) は書き込みが安定するまでパースを遅延させるために正しいアプローチですが、副作用があります。**Cursor や Claude Code は、ファイルを一瞬で上書きするのではなく、数秒から数十秒かけてストリーミング形式で書き込むことが多い**ため、その間 `tasks.md` 自体は書き込み開始からフラッシュが安定するまで沈黙します。

- **ファイルレベルのバッチ処理 (`change-updated`)**: これは許容されます。データの整合性は維持され、`awaitWriteFinish` がトリガーされた時点で最終的な状態が反映されます。
- **ライブワーカーの状態はファイル監視からではなく、別のルートで提供されます。** 現在ダッシュボードは、`agent-job-started` / `agent-job-output` / `agent-job-finished` イベント、および `WorkerStateIndicator` でレンダリングされる変更ごとのワーカー状態シグナルや `manager-activity-updated` イベントを WebSocket 経由でブロードキャストします（§7）。これらによって状態が可視化されるため、以前提案されていた「AIが書き込み中...」状態の（安定化前の chokidar イベントをストリーミングする）仕組みは不要となり、実装されておらず、今後の予定もありません。

### 6.6 パーサーの堅牢性

- `remark` の AST が提供する `position` 情報を利用して、タスクの行番号を取得します。これは正規表現によるスキャンよりも堅牢であり、ネストされたリストやコードブロック内での誤検出を防ぎます。
- パースに失敗した場合（Markdown が不正な場合）、`parseError` プロパティを付与してデータを返します。UI はプレーンテキスト表示にフォールバックするため、**UI アプリケーション全体がクラッシュすることはありません**。

---

## 7. REST ＆ WebSocket API

API の実態は [`server/index.ts`](https://github.com/fluentdb-dev/ithyno/blob/main/server/index.ts) に記述されています（約30本のエンドポイントと2本の WebSocket アップグレード）。以下のリストは**全容を示すものではなく、ナビゲーションのための要約**です。ソースコードを真実のソースとして扱ってください。

### REST API — 同期のコア (v1 スコープ)

| メソッド | パス | 用途 |
|---|---|---|
| `GET` | `/api/state` | 正規化されたワークスペースの状態を取得 |
| `GET` | `/api/changes/:id` | 単一の変更の詳細（本文コンテンツを含む）を取得 |
| `POST` | `/api/tasks/toggle` | チェックボックスの局所的編集（楽観的ロック ＋ 行ずれ補正、6.2参照） |
| `GET` | `/api/file?path=` | Markdown ファイルの生テキストを取得（フォールバック表示用） |

### REST API — その他すべて

- **Doctor 診断とインストール**: `/api/doctor`, `/api/doctor/install` (SSE) — 前提条件のチェックと、インストーラーのストリーミング出力。
- **初期化とインポート**: `/api/init`, `/api/init/stream` (SSE) — プロジェクトの構成作成と仕様のインポート。
- **Git 連携**: `/api/git/status`, `/api/git/config` (GET/POST), `/api/git/init` — アイデンティティ設定、ステータス、リポジトリ初期化。
- **マネージャー状態**: `/api/manager/activity` (GET/POST), `/api/manager/status` — 誰が何のタスクを実行しているかを表示。
- **フェーズ状態遷移**: `/api/changes/:id/phase` (GET/POST), `/api/changes/:id/needs-human`, `/api/changes/:id/needs-human/answer`。
- **エージェントランナー**: `/api/agents/config` (GET/POST), `/api/config/parallel-execution`, `/api/config/agmsg`, `/api/agents/jobs`, `/api/agents/jobs/:id`, `/api/agents/run`。
- **プロポーザル編集**: `/api/changes/:id/proposal/execution`, `/api/changes/:id/git-state`, `/api/changes/:id/commit-proposal`。
- **ドキュメント閲覧**: `/api/browse/markdown-tree`, `/api/browse/markdown`。
- **メタ情報**: `/api/health`, `/api/about`, `/api/auth/check`。

### WebSocket (サーバーからクライアントへのプッシュ)

2本のアップグレード接続があります: ダッシュボードイベント用の `/ws` と、埋め込み Terminal コンポーネント用の専用 PTY WebSocket です。

```ts
// server/index.ts から再生成されたイベント定義（こちらが真実のソースです）
type ServerEvent =
  | { type: "state-replaced" }                              // ペイロードなし。クライアントは /api/state を再取得します
  | { type: "change-updated"; changeId: string; change: Change }
  | { type: "worktree-change-updated"; changeId: string; change: Change }
  | { type: "spec-updated"; domain: string; spec: SpecDomain }
  | { type: "doc-updated"; path: string }
  | { type: "tags-updated" }
  | { type: "agent-job-started"; jobId: string; ... }
  | { type: "agent-job-output"; jobId: string; chunk: string; ... }
  | { type: "agent-job-finished"; jobId: string; ... }
  | { type: "agent-job-removed"; jobId: string }
  | { type: "worktree-progress-updated"; changeId: string; ... }
  | { type: "git-status-updated" }
  | { type: "import-completed"; ... }
  | { type: "agents-updated" }
  | { type: "doctor-updated" }
  | { type: "manager-activity-updated" };
```

競合処理は WebSocket イベントとしては送信されません。トグル用の REST エンドポイントがレスポンス内で直接 `409 Conflict` を返し（6.2参照）、クライアントはその応答に基づいて画面状態を整合させます。

---

## 8. UI 設計

### 画面レイアウト

1. **概要 (Dashboard 上部)**
   - アクティブな変更をカード形式でレンダリングします。各カードには、**進捗バー (done/total)**、タイトル、および Intent の概要が表示されます。
   - ワークスペース全体のサマリー（総タスク数、完了率）が表示されます。
2. **変更の詳細 (Change Details)**
   - `Tasks`, `Proposal`, `Design`, `Delta Specs` のタブ。
   - `Tasks` タブには、セクションとタスクの階層を示す **進捗ツリー** が表示されます。
   - チェックボックスをクリックすると即座に切り替わります。競合が発生した場合はトースト通知が表示されます。
3. **Kanban (概要)**
   - **TODO / IN-PROGRESS / DONE** の3レーンからなる静的なボードです。レーンへの配置は**フォルダの状態によって自動決定**されます（`.worktrees/<id>/` が存在すれば IN-PROGRESS、すべてのタスクが完了していれば DONE、それ以外は TODO）。`web/src/components/Kanban.tsx` を参照。
   - ドラッグ＆ドロップ機能はありません。Kanban はあくまで*状態モニター*であり、ユーザーが操作するインターフェースはカード単位のアクションボタン（`Start` / `Apply` / `Archive` / `Merge` / `Discard`）に限定されています。
   - オプションとして、同じカードをフェーズ状態マシンのフェーズごとに再グループ化して表示する **フェーズレーン表示切り替え**（`PhaseLaneBoard` 参照）が提供されています。
4. **仕様ブラウザ (Specs Browser)**
   - `openspec/specs/` 配下のドメイン一覧。要件とシナリオ（Given-When-Then 形式）を表示します（**閲覧専用**）。
5. **アーカイブ (Archive)**
   - 完了した変更の一覧を表示します。

### 同期 UX の原則

- 外部から変更が反映される際、現在ユーザーが操作していない箇所は**滑らかに更新**されます（変更された行が一時的に点滅して通知されます）。
- 競合（409）が発生しても、データを破壊的に上書きすることはありません。状態を再取得する前に、必ずユーザーに警告を表示します。

### 競合発生時のリカバリー UX (409)

前提として、`expectedText` によるフォールバック（6.2）があるため、**409 エラーが発生するのは、クリックした特定のタスク行そのものが AI によって編集されたという極めて稀なケースのみ**です。そのため、画面全体を暗転させたり強制リロードを要求するような**破壊的なグローバル操作は行いません**（これらは低頻度で局所的な問題に対して大げさであり、ユーザーの集中を妨げるためです）。

代わりに、私たちは **「楽観的更新 ＋ バックグラウンド調整 ＋ 局所的な確認プロンプト」** という3層モデルを採用しています：

1. **楽観的更新**: クリックされた瞬間、UI のチェック状態を即座に切り替えます（ユーザーが感じる遅延はゼロです）。
2. **バックグラウンド調整**: 409 エラーが発生した場合、UI はレスポンスとして返された最新の状態へ**静かに画面を書き換えます**。トーストは表示せず、変更があった箇所を点滅させるのみです。これにより、自分以外のタスクの変更内容がシームレスに同期されます。
3. **局所的な確認**: ユーザーが操作した**まさにそのタスク行**が競合していた場合に限り、楽観的更新をロールバックし、その行の直下に直接インラインメッセージを表示します：
   - 「この項目は AI によって更新されました」というメッセージと、**更新後の新しいテキスト**。
   - ワンクリックで再実行できる **「もう一度確認」** ボタン（新しい `expectedText`/`baseHash` を用いて再送信します）。
   - 目立たない自動消滅型のトーストが添えられます。**モーダルや画面全体のロックは一切使用しません。**

デザインの哲学: **ユーザーの意図を尊重し、エラーの影響を局所化し、画面全体をジャックすることなく最小限の摩擦でユーザーが変更を再適用できるように支援します。**

---

## 9. ディレクトリ構成 (実装)

ディスク上のリポジトリディレクトリは `openspec-ui/`、npm パッケージおよび CLI 名は `ithyno` です。以下のツリーは、**同期処理のコアとなる部分を意図的に部分抜粋したオリエンテーションマップ**です。エージェント、Git、スキルレンダラー、診断関連、各エンドポイントの実装コード、約35個の Web コンポーネント、および Electron / VS Code 拡張機能の各ワークスペースは省略しています。全体のレイアウトについてはリポジトリルートを参照してください。

```
ithyno/                # パッケージ/CLI名 (ディスク上のリポジトリ: openspec-ui/)
  package.json
  bin/
    ithyno.js          # CLIエントリー (commander): デフォルトはダッシュボード起動、`init` / `doctor` サブコマンドを含む
  server/
    index.ts                # Fastify サーバー、静的アセット配信、WebSocket ハンドラー
    parser/                 # remark をベースとしたパースモジュール
      tasks.ts
      spec.ts
      proposal.ts
    sync/
      watcher.ts          # エコー抑制機能付きの chokidar 監視モジュール
      surgicalEdit.ts     # 楽観的ロックを伴うチェックボックス行の局所的編集処理
    model.ts                # ドメインモデルの型定義
  web/                        # Vite + React クライアント
    src/
      store.ts            # Zustand ストア ＆ WebSocket イベントハンドラー
      pages/{Overview,ChangeDetail,Specs}.tsx
      components/{ProgressBar,Kanban,TaskTree}.tsx
    index.html
  docs/
    architecture.md
    roadmap.md
  README.md
```

---

## 10. リスクと対策

| リスク | 対策 |
|---|---|
| **並行編集による競合（更新の紛失）** | 楽観的ロック（`baseHash` 検証）と、409 発生時の状態再取得。Markdown 全体の再シリアライズは行わない。 |
| **行ずれによる 409 の頻発** | `expectedText` によるフォールバックによって、テキスト内容の一致から行のずれを自動補正。本物の 409 警告は影響を受けた局所的なタスク行のみに限定（6.2 / セクション8）。 |
| **複数行タスクやインデント、`*` マーカーの破壊** | 厳密な正規表現と堅牢なユニットテストによって、チェックマークの状態を表す1文字のみを上書き（6.1）。 |
| **ストリーミング書き込み中の UI の沈黙** | v1 ではバッチ処理による更新を受け入れます。並行エージェントのログやライブ状態（出力、開始、終了、マネージャー活動）を WebSocket 経由でリアルタイムに通知（6.5 / セクション7）。 |
| **エコーループ（自己発火）** | 書き込み後のファイルハッシュを記録し、自己発火した監視イベントを無視する。chokidar の `awaitWriteFinish` を利用する。 |
| **Markdown の方言** | Markdown ファイル内に UI 用のメタデータを埋め込まない。標準的な OpenSpec GFM（GitHub Flavored Markdown）からすべてを処理する。 |
| **パースエラー** | 失敗時は `parseError` メタデータを返してプレーンテキスト表示にフォールバック。1つのファイルのパースエラーによってアプリ全体がクラッシュするのを防ぐ。 |
| **大規模リポジトリでのスケール問題** | 起動時は `changes/` 配下のアクティブな変更を優先的に読み込みます。`archive/` の読み込みは遅延評価（Lazy-load）します。 |
