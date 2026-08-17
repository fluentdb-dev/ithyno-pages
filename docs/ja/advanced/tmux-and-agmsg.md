# Advanced：tmuxとagmsg

tmuxとagmsgはオプションです。通常のマルチエージェントDispatchではどちらも必須
ではありません。ithynoは、隔離されたGit worktreeでWorkerをワンショットの
プロセスとして実行できます。

| 機能 | 使用する場面 | 変わるもの |
|---|---|---|
| **Parallel execution** | worktreeへ分離する、または複数Changeを並行実行する | 各Changeを編集する場所 |
| **tmux** | Dashboardの再読み込みや一時切断後もManagerターミナルを維持する | Managerターミナルだけを永続セッションで包む |
| **agmsg** | Workerに永続Shellとエージェント間の明示的なメッセージが必要 | tmux paneとagmsg teamでWorkerを実行する。tmuxも暗黙に有効になる |

最初はParallel executionだけを使用し、以下の動作が必要になった場合にtmuxまたは
agmsgを追加してください。

## Managerターミナルでtmuxを使用する

tmuxはManager CLIをプロジェクト単位のターミナルセッション内で維持します。
Dashboardの再読み込みやターミナルの再接続時には、2つ目のManagerを起動せず、
既存セッションへ接続します。

tmuxだけではWorkerロールの設定、複数ChangeのDispatch、エージェント間メッセージ
は有効になりません。

### tmuxをインストールする

=== "macOS"

    ```sh
    brew install tmux
    tmux -V
    ```

=== "Debian / Ubuntu"

    ```sh
    sudo apt update
    sudo apt install tmux
    tmux -V
    ```

=== "Fedora / RHEL"

    ```sh
    sudo dnf install tmux
    tmux -V
    ```

=== "Arch Linux"

    ```sh
    sudo pacman -S tmux
    tmux -V
    ```

=== "Windows"

    Windowsにはtmuxが含まれず、ithynoからWindows向け代替実装を自動インストール
    することもできません。そのためPrerequisitesの**Install**は自動導入を行わず、
    手動導入の案内を表示します。`tmux.exe`互換コマンドを提供する最新版の
    [psmux](https://github.com/psmux/psmux)を使用します。

    WinGetでインストールできます。

    ```powershell
    winget install marlocarlo.psmux
    ```

    または[psmux Releases](https://github.com/psmux/psmux/releases)から、
    インストーラーかアーキテクチャに合うportable archiveを取得します。portable
    版では展開後、`tmux.exe`があるフォルダを**ユーザー環境変数のPATH**へ追加します。

    新しいPowerShellを開いて確認します。

    ```powershell
    where.exe tmux
    tmux -V
    ```

    `PATH`を変更した後はElectronアプリを完全に再起動するか、VS CodeのWindowを
    Reloadします。ithyno serverも再起動してからManagerターミナルを開き直します。
    起動済みプロセスには後から変更した環境変数が渡らず、ithynoは最初のtmux検出
    結果をプロセス内でキャッシュします。

### 有効にする

1. **Settings → Prerequisites**を開き、tmuxが検出されていることを確認します。
2. **Settings → Execution**を開きます。
3. **Wrap Manager terminal in tmux**を有効にします。
4. Managerターミナルを再起動または開き直し、tmux内で起動させます。

次のトップレベル設定が書き込まれます。

```yaml
tmux: true
```

各プロジェクトには別々のtmuxセッション名が自動的に割り当てられます。ithynoは
セッションの作成・再接続時に、現在のDashboard endpointとsession credentialも
渡すため、復帰したManagerは現在のプロジェクトコンテキストを使用します。

tmuxを使用しない場合はトグルを無効にし、Managerターミナルを再起動します。
tmuxが有効でも`PATH`から見つからない場合、ithynoは警告を表示し、Managerを
起動しません。tmuxをインストールするか設定を無効にしてithynoを再起動した後、
Managerターミナルを開き直します。

## 永続Workerとメッセージにagmsgを使用する

agmsgはローカルの共有team inboxを追加し、Workerをtmux paneで起動します。
Managerは各Workerから明示的なstage完了メッセージを受け取ってから、成果物を判定し
次のステージへ進みます。

次のいずれかが必要な場合にagmsgを使用します。

- Workerをlive shellとして維持する。
- WorkerからManagerへ明示的な完了メッセージを送る。
- 複数のエージェントCLIでローカルのメッセージ経路を共有する。

複数Changeを実行するためだけにagmsgを有効にする必要はありません。
**Parallel execution**と`dispatch-multi`だけで並行実行できます。

### agmsgの前提ツールをインストールする

- tmuxが必要です。agmsgを有効にするとtmuxも暗黙に有効になります。
- 各エージェントCLIのインストールと認証を先に完了します。
- agmsg本体はBash scriptで構成され、`sqlite3` commandを使用します。

=== "macOS"

    macOSでは通常`sqlite3`を利用できます。agmsgのインストール前に確認します。

    ```sh
    sqlite3 --version
    ```

    存在しない場合はHomebrewからインストールします。

    ```sh
    brew install sqlite
    ```

=== "Debian / Ubuntu"

    ```sh
    sudo apt update
    sudo apt install sqlite3
    ```

=== "Fedora / RHEL"

    ```sh
    sudo dnf install sqlite
    ```

=== "Arch Linux"

    ```sh
    sudo pacman -S sqlite
    ```

=== "Windows"

    Windowsでは、ithynoからagmsgをインストールする前に3つの前提ツールが必要です。

    1. [Git for Windows](https://gitforwindows.org/)をインストールします。agmsgの
       `.sh`ファイルは、ここに含まれる実際のGit Bashで実行されます。Windowsの
       `bash.exe`というWSL launcherでは代用できません。
    2. [SQLite公式ダウンロードページ](https://www.sqlite.org/download.html)から、
       アーキテクチャに合う**sqlite-tools for Windows**をダウンロードします。
       展開後、`sqlite3.exe`があるフォルダをユーザー環境変数の`PATH`へ追加します。
    3. 上のtmux手順に従ってpsmuxをインストールします。`tmux.exe`は、手動設定した
       Git Bash内だけでなく、通常のPowerShellからも見える必要があります。

    新しいPowerShellを開いて、3つのコマンドを確認します。

    ```powershell
    where.exe git
    where.exe sqlite3
    where.exe tmux
    sqlite3 --version
    tmux -V
    & 'C:\Program Files\Git\bin\bash.exe' -lc 'sqlite3 --version'
    ```

    Git for Windowsのインストール先を変更している場合は、最後のパスを合わせます。
    ithynoは`git --exec-path`からGit Bashの場所を求めます。WSLへつながる可能性が
    あるため、単なる`bash` commandは使用しません。標準以外の場所へインストール
    した場合は、Windowsのユーザー環境変数`GIT_BASH`にGit Bashの絶対パス
    （例：`D:\\Apps\\Git\\bin\\bash.exe`）を設定し、ithynoを再起動します。
    agmsgのCodex delivery hookでは`AGMSG_BASH`も使用できます。

    `PATH`の変更後はithynoを完全に終了して再起動し、
    **Settings → Prerequisites → Refresh**を実行します。Git Bashと`sqlite3`の
    両方が検出されるまで、agmsgのInstallは実行されません。tmuxはターミナルを
    wrapする前に別途検査されます。

### agmsgをインストールする

1. **Settings → Prerequisites**を開きます。
2. **agmsg**が未インストールの場合は**Install**を選択します。
3. インストール完了後に**Refresh**を選択し、agmsgがinstalledと表示されることを
   確認します。
4. 新しくインストールしたagmsg commandとskillを認識させるため、Manager
   ターミナルを再起動します。

ithynoのインストーラーは、アプリに同梱された互換性のあるagmsgを
`~/.agents/skills/agmsg/`へコピーします。後から更新してもローカルDBは維持されます。
パッケージ内にagmsgがないと表示された場合は、
[agmsgプロジェクト](https://github.com/fujibee/agmsg)から`npx agmsg`で
インストールし、ithynoを再起動してPrerequisitesを更新します。

### プロジェクトでagmsgを設定する

1. **Settings → Agmsg (multi-agent messaging)**で**Configure**を選択します。
2. agmsgを有効にし、`my-project`などプロジェクト固有のteam名を入力します。
3. すべての参加プロセスで同じカスタムパスを設定する場合を除き、
   **Storage path**は空欄にしてagmsg標準のローカルSQLite DBを使用します。
4. 設定を保存します。
5. **Agents**を開き、agmsgで使用する各Workerを編集して、もう一度保存します。
   これにより、画面がWorkerをagmsg用の実行方式へ更新します。
6. Dispatchの前にManagerターミナルを再起動します。

プロジェクト設定は`agents.yaml`へ保存されます。

```yaml
agmsg:
  team: my-project
```

agmsgはtmuxを暗黙に有効化するため、agmsg設定を削除した後もtmuxを使い続けたい
場合を除き、`tmux: true`を重ねて設定する必要はありません。

### 対応するWorker command

現在、ithynoは次のWorker commandをagmsg agent typeへ変換します。

| Worker command | agmsg type |
|---|---|
| `claude` | `claude-code` |
| `codex` | `codex` |
| `copilot` | `copilot` |
| `gemini` | `gemini` |
| `antigravity` | `antigravity` |
| `opencode` | `opencode` |
| `cursor` | `cursor` |

未対応のcommandはagmsgから起動できません。表にあるcommandを使用するか、その
Workerではagmsgを使用しない設定にしてください。

agmsg用Workerを保存すると、ithynoは対応する長形式CLI optionを
`~/.agmsg/config/spawn_options.yaml`へ同期します。model指定はDispatch開始時に
別途渡されます。生成された設定を直接管理せず、ithynoのWorker設定を編集して
ください。

### agmsgを無効にする

1. **Settings → Agmsg (multi-agent messaging) → Configure**を開きます。
2. **Enable**をオフにして保存します。
3. **Agents**で各Workerを編集・保存し、通常のワンショット実行へ戻します。
4. Managerのセッション維持も不要なら、**Wrap Manager terminal in tmux**を
   別途無効にします。
5. Managerターミナルを再起動します。

プロジェクト連携を無効にしても、agmsg本体やローカルのメッセージDBは削除されません。

## トラブルシューティング

| 症状 | 確認すること |
|---|---|
| tmuxを有効にしてもManagerが起動しない | ithynoを起動した環境で`tmux -V`が成功することを確認し、ithynoを再起動します。tmuxを使わない場合は先に設定を無効にします。 |
| 以前のManagerが古いDashboard endpointを使用する | 有効なDashboardからManagerを再起動し、tmuxセッションへ現在の`ITHYNO_BASE`とsession tokenを渡します。 |
| agmsg有効後もWorkerがワンショットで起動する | **Agents**から対象Workerを編集・保存し、もう一度Dispatchします。 |
| Dispatchがunknown agmsg typeを報告する | 上の表にあるcommandを使用します。 |
| Worker完了後もManagerが待ち続ける | team名とWorker paneを確認します。Workerは同じteamへstage完了メッセージを送る必要があります。 |
| WindowsでagmsgがinstalledでもWorkerを起動できない | agmsgの検出にはtmuxが含まれません。Git Bashと`sqlite3`を確認し、`tmux.exe`を別途確認してアプリを再起動します。 |

標準の手順へ戻る場合は
[複数エージェントを設定してDispatchする](../multi-agent-setup-and-dispatch.md)を
参照してください。
