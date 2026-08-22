---
title: Troubleshooting
audience: end-user
---

# Troubleshooting

ithyno 使用中に遭遇しやすいエラーとその回避方法をまとめます。

## `claude --resume <uuid>` が `No conversation found with session ID` で失敗する

**症状**

Dashboard を開いた時、埋め込みターミナル (Electron/Browser の xterm、または
VS Code Terminal) に:

```
$ claude --resume 1c79f6ee-689a-4988-a184-3cef5aec7308
No conversation found with session ID: 1c79f6ee-689a-4988-a184-3cef5aec7308
```

と表示され、Claude Code が起動しない。

**原因**

ithyno はプロジェクトごとに `<project>/.ithyno/` に UUID を保存し、

- 初回起動時: `claude --session-id <uuid>` (Claude Code 側にセッションを作成)
- 2 回目以降: `claude --resume <uuid>` (作成済みセッションを再開)

の 2 段構えで Claude Code のセッションを引き継ぎます。
このファイル名は起動チャネルによって異なります。

- **Electron およびブラウザ** (サーバーの PTY 経由) — `.ithyno/session-claude` に保存されます。古いプロジェクトの `.ithyno/session-id` もフォールバックとして読み込まれます。
- **VS Code 拡張** — `.ithyno/session-id` を直接読み書きします。

しかし Claude Code の内部ストレージは **ユーザーが少なくとも 1 通メッセージを
送るまでセッションを永続化しません**。初回に:

- ターミナルに `claude --session-id <uuid>` は流れたが
- ユーザーがまだメッセージを送信していないうちにターミナルを閉じた、
  もしくは VS Code/Electron を落とした

というシーケンスだと、Claude 側にはそのセッション ID の記録が存在しないまま、ディスク上のセッションファイル（Electron/ブラウザの場合は `.ithyno/session-claude`、VS Code の場合は `.ithyno/session-id`）にだけ UUID が残る、という状態になります。次回起動時に
`--resume` するとその UUID は「知らないセッション」と見なされ上記エラーで
落ちます。

**回避方法**

該当プロジェクトのセッションIDファイルを削除して再起動してください。現在のファイル名と古いフォールバックの両方を削除するには以下のコマンドを実行します。

```bash
rm -f <project>/.ithyno/session-claude <project>/.ithyno/session-id
```

Dashboard を開き直すと拡張が新しい UUID を発行して `claude --session-id
<new-uuid>` に戻ります。今度は **ターミナルに 1 通でも何か送信してから閉じる**
ことで Claude 側にセッションが永続化され、以降の `--resume` が成功する状態に
なります。

**恒久的に自動起動を避けたい場合**

VS Code 拡張なら `ithyno.terminalStartup` を明示的に上書きできます:

- `"claude"` — 毎回 fresh の Claude を起動 (セッションを引き継がない)
- `"claude --continue"` — 直前のディレクトリ内セッションを継続 (Claude Code
  の従来挙動)
- `""` (default) — 上記の session-id 自動管理を使う

Electron / Browser の場合は現時点で config フックが無いため、
`.ithyno/session-claude` (および存在する場合は古い `.ithyno/session-id`) の削除で対処してください。

## 埋め込みターミナルに `claude --continue` を送りたい

`ithyno.terminalStartup` (VS Code 拡張の設定) に `claude --continue` を書けば
上書きされます。ただし fresh プロジェクトで `--continue` を実行すると
`No conversation found to continue` で失敗するため、上記 session-id 自動管理
を推奨します。

## ElectronまたはBrowserで埋め込みManagerターミナルが表示されない

Electronと直接Browser modeはサーバーのネイティブPTY backendを使用します。
PTYを利用できない場合でも、ダッシュボード自体は起動を継続します。
`/api/health`を確認し、`terminal.available: false`と表示される場合、埋め込み
Managerターミナルは非表示になりますが、その他の機能は利用できます。

多くの場合、現在のOS、アーキテクチャ、またはNode.js versionに対応する
`@homebridge/node-pty-prebuilt-multiarch`を読み込めていません。対応するNode.js
versionを使用し、アプリケーションまたは依存関係を再インストールしてください。

VS Code Extensionは埋め込みPTYではなくVS Code native Terminalを使用するため、
`terminal.available: false`でもVS Codeのターミナルは利用できます。

## Windowsのターミナルで行った変更がダッシュボードへ反映されない

ithynoサーバー（またはVS Code extension host）とAgent CLIを同じ環境で
実行してください。

- 両方をWindows nativeで実行する、または
- 両方をWSL内で実行する。

片方をWindows、もう片方をWSLで実行しないでください。この境界をまたぐ
ファイル監視は不安定なため、Agentによる編集をダッシュボードが検出できない
場合があります。Windows nativeのターミナルには、ConPTYを利用できる
Windows 10 version 1809以降が必要です。

## VS Code 拡張の Dashboard 起動時に "did not observe launch URL within 20000ms" が出る

ithyno サーバー (`bin/ithyno.js` → `tsx server/index.ts`) のコールドスタートが
タイムアウトを超過しています。View → Output → **ithyno** チャンネルで
サーバー側のログを確認してください。多くは:

- `Cannot find module` — VSIX パッケージング時の依存解決失敗
- `EACCES` — 権限問題

VS Code 拡張はウィンドウごとに新しくランダムなポートを割り当てるため、VS Code ウィンドウ間でのポート競合は発生しません。`port already in use` エラーは、すでにデフォルトポート `4321` で他の ithyno プロセスが起動している状態で、ターミナルから直接 CLI 起動した（CLI モード）場合にのみ発生します。

いずれもログに明示されるので、その内容を issue に貼ってください。

## `ithyno: New Project` で作ったフォルダが空のまま

Onboarding パネルが完了する前に閉じた可能性があります。ithyno 側は
`onboarding-close` を受けてもサブプロセス (`openspec init` の `npx`) を kill
しないため、途中終了だとフォルダが不完全な状態で残ります。フォルダを削除
してやり直してください。

## macOSのElectron AppでAgyが起動しない

macOSでは、Agyの画面を正しく表示するため、Electron AppのManagerターミナルを
tmuxでラップする必要があります。

1. tmuxが未インストールの場合はインストールします。

   ```shell
   brew install tmux
   ```

2. **Settings → Execution**を開きます。
3. **Wrap Manager terminal in tmux**を有効にします。
4. Managerターミナルを再起動します。

## 子エージェントに指定したAgyの処理が終わらない

Agy Workerは、Agy ManagerからAgyネイティブの`invoke_subagent`機構で委譲する
場合にのみ対応しています。現在、Agy以外のManager CLIからAgy Workerを呼び出す
ことはできません。

まれにAgyからAgyへのdispatchでも、`invoke_subagent`ではなくサーバー側の
AgentRunnerを経由してWorkerが起動され、処理がハングすることがあります。
次の点を確認してください。

- ManagerのCommandが`agy`になっている
- Agy Workerが`invoke_subagent`から起動されている
- 対象Workerが`POST /api/agents/run`へルーティングされていない

AgentRunnerが選択されていた場合はそのジョブを停止し、`invoke_subagent`を使用して
再度dispatchしてください。

## macOSにElectron Appをインストールしたが起動しない

macOSにアプリの起動を止められる場合は、最初に公式のithynoリリースから取得した
ファイルであることを確認し、次のコマンドでダウンロードファイルの隔離属性を
解除します。

```shell
xattr -cr /Applications/ithyno.app
```

コマンド完了後、`ithyno.app`をもう一度起動してください。
