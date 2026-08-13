---
status: settled
tags: [feature/git, area/server, area/web]
---

# ダッシュボードにおける Git アイデンティティ

ダッシュボードはワークスペースの Git 状態を確認・管理するための第一級クライアントです。プロジェクトが Git リポジトリであるかの検出、コミット時に使用されるアイデンティティの表示、ローカルの `user.name` / `user.email` の編集をサポートします。また、ワークスペースがまだリポジトリでない場合は、UIから `git init` を実行できます。

## 機能の境界

- **ローカルスコープのみ制限。** ダッシュボードから `--global` 設定が書き込まれることはありません。グローバルなフォールバック用のアイデンティティを設定したいユーザーは、アプリ外で設定する必要があります。
- **コミットは作成しません。** `git init` は最初のコミットを作成しません。ブランチ名、gitignore、および最初のコンテンツはユーザーの判断に委ねられます。
- **適用値のアイデンティティ表示は読み取り専用。** ヘッダーチップとモーダルには、解決された設定チェーン（`local > global > system`）が表示されますが、ダッシュボードから書き換えられるのはローカルスコープ（`local`）のみです。

## エンドポイント

| メソッド | パス | 用途 | 認証 |
|---|---|---|---|
| GET | `/api/git/status` | `{ isRepo, root?, headBranch?, hasCommits?, reason? }` | ローカル |
| GET | `/api/git/config` | `{ effective, local }` — `isRepo` が必要 | ローカル |
| POST | `/api/git/config` | ローカルの `user.name` / `user.email` の書き込み。空文字は設定解除 | ローカル + CSRF |
| POST | `/api/git/init` | プロジェクトルートでの `git init` の実行（冪等） | ローカル + CSRF |

`hasCommits` は、`git rev-parse --verify HEAD` が成功した（最初のコミットが存在する）場合にのみ `true` になります。モーダルでは、エラーになるはずのワークツリーモードでの起動（ブランチを切るための HEAD が必要）の前に警告を表示するためにこの値を使用します。

WebSocket: 変更処理が成功すると、`{ type: "git-status-updated", gitStatus }` イベントが送信されます。

## シェルスコープでの適用

ヘッダーチップとアイデンティティモーダルは、**local-server**（ブラウザ起動）および **Electron** シェルにのみマウントされます。**VS Code 拡張機能** シェルでは、VS Code 独自のソース管理パネルにこの処理を委ねるため、表示されません。検出は `web/src/runtime/shell.ts` 内で、`typeof window.acquireVsCodeApi === "function"`（最上位ウェブビューのチェック）と `?vscode=1` URL フラグ（React アプリが実際に動作しているネストされた iframe において、`acquireVsCodeApi` が注入されない場合のチェック）を組み合わせて行われます。

## エージェントランナー（ワークツリー）との連携

`git worktree add` を実行するには、Git リポジトリが必要です。Start フロー自体は、事前に `gitStatus.isRepo` で完全にブロックすることはしません。ディスパッチャースキルが埋め込みターミナルで `git worktree add` を実行し、そこで発生した失敗を表示します。UI が事前に検知して表示するシグナルは以下の通りです：

- `!isRepo` の場合の、チップ上の警告ドット。
- `!hasCommits` の場合の、モーダルの警告バナー（"Worktree-mode Start needs a HEAD to branch from" — `web/src/components/GitIdentityModal.tsx` 参照）。
- 非リポジトリのワークスペースを救済するための、モーダルでのワンクリック `git init` の提供。

## ソースのレイアウト

| パス | 役割 |
|---|---|
| `server/git/status.ts` | `.git` ディレクトリ存在チェックの高速パス ＋ `git rev-parse` 検出 |
| `server/git/config.ts` | `--show-scope --get` 解析と、シリアライズされたローカル書き込み |
| `server/git/init.ts` | 冪等な `git init` 実行と、その後のステータス再読み込み |
| `server/index.ts` | 4つのエンドポイント定義 ＋ WebSocket での `git-status-updated` 通知 |
| `web/src/runtime/shell.ts` | `isVsCodeShell()` による VS Code 環境かどうかの判定 |
| `web/src/components/GitIdentityChip.tsx` | ヘッダーチップコンポーネント |
| `web/src/components/GitIdentityModal.tsx` | モーダルコンポーネント（2つの状態） |
