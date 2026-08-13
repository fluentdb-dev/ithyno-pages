---
tags: [feature/migration, area/docs]
---

# 既存プロジェクトの ithyno への移行

既存のプロジェクトに OpenSpec とこのダッシュボードを導入するためのステップバイステップガイドです。

## クイックパス — `ithyno init`

プロジェクトにまだ OpenSpec や ithyno のプロジェクト側ファイルがない場合、一括で初期化するコマンドは以下の通りです：

```bash
cd /path/to/your-project
git init                    # プロジェクトがまだ git リポジトリでない場合
npx ithyno init .           # ithyno 側のファイルを生成 (詳細は後述)
npx -y -p @fission-ai/openspec@latest openspec init . --tools claude
npx ithyno                  # http://localhost:4321 でダッシュボードを起動
```

`ithyno init` は、プロジェクトのルートに以下のファイルを生成します：

- `CLAUDE.md` — 汎用的なプロジェクトルール（プレースホルダー経由でプロジェクトの検証コマンドを使用します。必要に応じて `# Replace with your project's verification commands` の行を編集してください）。
- `.claude/skills/openspec-flow/SKILL.md` — スペック駆動のワークフロースキル。ithyno リポジトリ内のコピーから同期されます。
- `agents.yaml.example` — エージェント設定のサンプル。
- `docs/`, `docs/ideas/` — ステージ 1 / 2 のドキュメント用プレースホルダーディレクトリ。
- `.gitignore` — `.worktrees/` や `.ithyno/` が無ければ追記します。

デフォルトで冪等（すでに存在するファイルはスキップ）です。上書きするには `--force`、`.gitignore` を編集しない場合は `--no-gitignore`、出力を最小限にするには `--quiet` を指定します。非 Git ディレクトリに対して実行しようとすると、事前チェックで拒否されます（エラーコード 2 を返して終了します）。

ダッシュボードが開くと、埋め込みターミナルが **プロジェクトごとの Claude Code セッション** を自動管理します。初回起動時、ithyno は UUID を生成して `.ithyno/session-claude`（または VS Code では `.ithyno/session-id`）に書き込み、`claude --session-id <uuid>` を実行してその UUID に紐づく新しいセッションを開始します。2回目以降の起動時は、同じファイルを読み取って `claude --resume <uuid>` を実行し、会話履歴を引き継いでセッションを再開します。`.ithyno/` はローカルのプロジェクト状態であり、ソース管理の対象外とするため、自動的に `.gitignore` に追加されます。セッションをリセットする（新しい会話を始める）には、`.ithyno/session-claude`（または `.ithyno/session-id`）を削除してターミナルを開き直してください。特定のマネージャーを指定したい、特定の `--resume <fixed-id>` を使いたい、または毎回新しく `claude` を起動したいなど、異なるフローを好むユーザーは、`agents.yaml` の `roles: [manager]` エントリか `ITHYNO_TERMINAL_STARTUP` 環境変数でこれをオーバーライドできます。

手動で OpenSpec やエージェントランナーをインストールしたい場合（ワークフロースキルをカスタマイズしたい、プロジェクトが非標準のレイアウトになっているなど）は、以下のセクションを参照してください。

## 前提条件

- ローカル環境に **Node 18+** がインストールされていること。
- **git 2.5+** (ワークツリーのサポート)。
- 対象プロジェクトが **Git リポジトリであること（推奨）**。ダッシュボードを開く時点では Git リポジトリでなくても構いません。ヘッダーの Git チップからワンクリックで `git init` を実行できます。ただし、ワークツリーモードでの `Start` を実行するには最初のコミット（HEAD）が必要です。コミットが存在しない場合、Git アイデンティティモーダル内にインラインで警告が表示されます（"No commits yet. Worktree-mode Start needs a HEAD to branch from…"）。なお、エージェントを実行しない機能（スペック、変更、タスク、ドキュメントの閲覧・編集）は、Git がなくても動作します。

## ステージ 1 — 対象プロジェクトでの OpenSpec の初期化

公式 CLI を使用して、ディレクトリ構成を作成し、Claude Code スキルをインストールします。

```bash
cd /path/to/your-project

npx -y -p @fission-ai/openspec@latest openspec init . --tools claude
```

生成されるファイル構成：

```
your-project/
  openspec/
    config.yaml
    specs/         # システムの現在の振る舞い（仕様）
    changes/       # 進行中の提案
  .claude/
    commands/opsx/ # /opsx:propose などのコマンド定義
    skills/        # openspec-propose / apply / archive スキル定義
```

## ステージ 2 — 対象プロジェクトに対して ithyno を実行する

現在の作業スタイルに合った実行方法を選択してください。

| 方法 | コマンド | 用途 |
|---|---|---|
| **直接実行** | `node /path/to/ithyno/bin/ithyno.js --dir /path/to/your-project` | クイック試用 |
| **開発依存 (devDep) インストール** | `cd your-project && npm install --save-dev /path/to/ithyno` | プロジェクトへのピン留め |
| **グローバルリンク** | `cd ithyno && npm link` → `cd your-project && ithyno` | どこからでも呼び出し可能に |
| **Electron アプリ** | DMG / NSIS インストーラー / AppImage をダウンロードして起動。初回起動時に対象プロジェクトフォルダを選択 | エディタを使用しない / VS Code 以外のエディタを使用 / ネイティブウィンドウを優先 |
| **VS Code 拡張機能** | build `vscode-extension/ithyno.vsix` → **Install from VSIX…** → run `ithyno: Show Dashboard` | VS Code ユーザー向け。ワークスペースフォルダが自動的に OpenSpec のルートになります |

```bash
# 直接実行: ブラウザで http://localhost:4321 を開きます
node /path/to/ithyno/bin/ithyno.js --dir . --port 4321
```

> **URLのブックマークについて:** 起動用 URL にはプロセスごとのセッション トークン（`?token=<hex>`）が付与されます。トークンが無い状態（`http://localhost:<port>/`）でアクセスすると、CSRF 防御の観点からセッション期限切れ of バナーが表示されます。起動時に出力されるトークン付きのフル URL をピン留めするか、CLI / Electron / VS Code 経由で再起動して URL を生成してください。

Electron および VS Code チャンネルも、内部的には同じ `bin/ithyno.js` を生成します。違いは UI の表示方法（ネイティブウィンドウ、ブラウザ、VS Code ウェブビュー）だけです。ビルド手順については [`electron/README.md`](https://github.com/fluentdb-dev/ithyno/blob/main/electron/README.md)、VSIX パイプラインについては [`vscode-extension/README.md`](https://github.com/fluentdb-dev/ithyno/blob/main/vscode-extension/README.md) を参照してください。

### VS Code 拡張機能からのインストール

スタンドアロンの CLI を実行する代わりに、VS Code ユーザーはパッケージ化された拡張機能をインストールし、エディタ内でウェブビューパネルとしてダッシュボードを開くことができます。

```bash
# ithyno のチェックアウト先で実行
npm install
npm --workspace=vscode-extension run package
# → vscode-extension/ithyno.vsix が生成されます
```

VS Code での操作: **Extensions (拡張機能)** ビュー → `⋯` メニュー → **Install from VSIX…** → 生成されたファイルを選択します。対象プロジェクトフォルダを VS Code のワークスペースとして開き、コマンドパレットから **ithyno: Show Dashboard** を実行します。ダッシュボードがエディタの横に開きます。Apply / Archive / Merge / Start コマンドは、VS Code 独自のターミナルパネル（「ithyno」という名前の永続ターミナル）に入力され、初回使用時にプロジェクトごとの Claude セッション（初回は `claude --session-id <uuid>`、次回以降は `claude --resume <uuid>`）を自動起動します。これは `ithyno.terminalStartup` で設定可能です。`--dir` や `--port` フラグを指定する必要はなく、ワークスペースフォルダがプロジェクトルートになり、ポートも自動的に選択されます。

## ステージ 3 — プロジェクトレベルの設定の追加

これらはオプションですが、強く推奨されます。

### ステージ 1（アイデア）とステージ 2（ドキュメント）のための `docs/`

```bash
mkdir -p docs/ideas
# 必要に応じて、既存の README や ADR を docs/ にコピーまたは移動します
```

### エージェントランナー用の `agents.yaml`

```bash
cp /path/to/ithyno/agents.yaml.example agents.yaml
# 公開したいエージェントを定義するために編集します
echo ".worktrees/" >> .gitignore
```

### `CLAUDE.md` と openspec-flow スキル

このリポジトリからこれらをコピーすることで、プロジェクト内で動作する Claude Code に対し、同じワークフローのルール（提案優先、アイデアのキャプチャ、進行中のピボットガイドなど）を提供できます。

```bash
cp /path/to/ithyno/CLAUDE.md /path/to/your-project/CLAUDE.md
cp -r /path/to/ithyno/.claude/skills/openspec-flow \
      /path/to/your-project/.claude/skills/
```

コピーした `CLAUDE.md` を編集して、リポジトリ固有のコマンドライン（`npm test` など）を削除し、プロジェクトの検証コマンドに置き換えます。

## 既存アセットの整理

| 既存のファイル・状態 | OpenSpec での配置先 |
|---|---|
| README / ARCHITECTURE.md | `docs/architecture.md` |
| ADR (アーキテクチャ意思決定記録) | `docs/adr/` |
| 散らばった TODO や課題 | `/opsx:propose` を使用して重要なものを提案に昇格させる |
| 過去の設計に関する議論 | `docs/ideas/<date>-<topic>.md` (`status: promoted` を設定) |
| 現在のシステムの振る舞い | `openspec/specs/<capability>/spec.md` |
| 過去の変更履歴 | `openspec/changes/archive/<YYYY-MM-DD>-<id>/` (`outcome.md` を含む) |

## 移行後の最初のループ

1. ダッシュボードを `http://localhost:4321` で開きます。最初は空のカンバンが表示されます。
2. **+ New Change** をクリック → 作成したい内容を記述 → ダッシュボードが `/opsx:propose "..."` を埋め込みターミナルに入力し、Claude Code が 4 つのアーティファクトを生成します。
3. 新しい変更が TODO に表示されます。**Start** をクリックすると `.worktrees/<change-id>/` にエージェントが生成され、`/agents` ページで進捗を監視できます。
4. エージェントの実行が完了したら、**Merge** ボタンまたはコマンドによってターミナルに `/ithy-opsx:merge <id>`（CLI モードの場合は `git merge --no-ff <branch>`）を送信します。差分を確認して承認すると、ファイル監視経由で `tasks.md` の更新内容がカンバンに反映されます。
5. すべてのタスクが完了し `outcome.md` が書き込まれたら、**Archive** をクリックします。変更は `/archive` に移動し、履歴が保存されます。

## トラブルシューティング

| 症状 | 考えられる原因 |
|---|---|
| Start ボタンが表示されない | `agents.yaml` が見つからないか、空になっています。解析エラーがある場合は `/agents` ページで確認してください。 |
| ターミナルでの編集内容がカンバンに反映されない | ダッシュボードサーバーと Claude Code は**同じ環境**（どちらも WSL、またはどちらも Windows ネイティブ）で動作している必要があります。詳細は `add-embedded-terminal` 成果物ノートを参照してください。 |
| 埋め込みターミナルが開かない | PTY バックエンドの読み込みに失敗しました。`/api/health` で `terminal.available: false` になっています。ダッシュボード自体は動作しますが、ドラッグやボタンによるコマンド挿入は行えません。 |
| `npx openspec` で異なるバージョンが解決される | プロジェクトの `node_modules` にローカルの `@fission-ai/openspec` 開発依存（devDep）がインストールされています。移行後に `npm install` を実行してください。 |

## 今後の改善予定（未リリース）

- `ithyno` を npm にパブリッシュし、ローカルへのチェックアウトなしで `npx ithyno ...` で実行できるようにすること（現在は `package.json` で `0.0.1-alpha.0` とマークされており、未公開です）。
