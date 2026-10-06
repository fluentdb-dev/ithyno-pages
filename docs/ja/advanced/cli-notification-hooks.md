# CLI 待機通知

ithyno は、CLI ワーカーが処理を完了したとき、または入力待ちになったときにデスクトップ通知を表示できます。通知は **Settings → Prerequisites** で CLI ごとに設定します。

## 通知を押したときの動作

通知は CLI 名とプロジェクト単位でグループ化されます。プロジェクトの絶対パスはハッシュ化してグループ ID に使うため、別プロジェクトの通知が置き換わることはありません。

| OS | 実行環境 | 通知 | クリック時 |
| --- | --- | --- | --- |
| macOS | Electron | `alerter` | ithyno をアクティブ化 |
| macOS | VS Code 拡張 | `alerter` | VS Code をアクティブ化 |
| macOS | CLI 直接実行 | `alerter` または `osascript` | アプリを強制的に開かない |
| Windows | Electron / VS Code | BurntToast または `NotifyIcon` | 判別できる場合は実行元アプリをアクティブ化 |
| Windows | CLI 直接実行 | BurntToast または `NotifyIcon` | アプリを強制的に開かない |
| Linux | Electron / VS Code | `notify-send` | デスクトップ環境に依存。アプリを強制的に開かない |
| Linux | CLI 直接実行 | `notify-send` | アプリを強制的に開かない |

グループ ID は次の形式です。

```text
ithyno:<cli>:<project-id>
```

macOS の既定タイムアウトは 24 時間です。その他の OS は通知プロバイダーの規則に従います。

## インストールと安全性

Settings のベルを有効にすると、プロジェクトローカルの hook と通知スクリプトが登録されます。`init` は hook を自動的に有効化しません。macOS の `alerter` と Windows の BurntToast は任意で、未導入時は標準通知へフォールバックします。
