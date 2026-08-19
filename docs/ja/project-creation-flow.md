# シンプルなプロジェクトを始める

空のフォルダまたは既存のコードベースから開始できます。ithynoは選択した
フォルダをその場で初期化するため、専用の作業場所へソースコードをコピーする
必要はありません。

## 1. セットアップを開く

利用するithynoの形態を選んで手順を進めてください。

=== "VS Code Extension"

    1. VS Codeでコマンドパレットを開きます。
    2. **ithyno: New Project**を実行します。
    3. 親フォルダを選択します。
    4. 新しいサブディレクトリ名を入力します。選択したフォルダ自体を初期化する
       場合は空欄のまま進めます。
    5. オンボーディングパネルでセットアップを完了し、**Open Project**を選択
       します。VS Codeが新しいフォルダをワークスペースとして再読み込みします。
    6. **ithyno: Show Dashboard**を実行し、エディタの横にダッシュボードを
       開きます。

    #### VS Codeでプロジェクトを作成する

    <figure markdown="span">
      ![VS Codeのコマンドパレットからithyno: New Projectを実行する。](assets/images/vscode-new-proj.png){ loading=lazy }
      <figcaption>コマンドパレットから<strong>ithyno: New Project</strong>を実行します。</figcaption>
    </figure>

    #### VS Codeでダッシュボードを開く

    <figure markdown="span">
      ![VS Codeのコマンドパレットからithyno: Show Dashboardを実行する。](assets/images/vscode-show-dashboard.png){ loading=lazy }
      <figcaption>コマンドパレットから<strong>ithyno: Show Dashboard</strong>を実行します。</figcaption>
    </figure>

=== "Electron App"

    1. ithynoアプリを起動します。
    2. Welcome画面で**Open Folder**を選び、使用するフォルダを指定します。
       すでに別のプロジェクトを開いている場合は、代わりに
       **File → New Project…**を使用できます。
    3. OpenSpecがないフォルダでは、**Initialize openspec here**を選択します。
    4. オンボーディングウィンドウでセットアップを完了し、**Open Project**を
       選択します。アプリが初期化済みプロジェクトへ切り替わり、ダッシュボードを
       開きます。

    最近使用したプロジェクトは**File → Open Recent**から開き直せます。

    #### Electron Appでプロジェクトを選択する

    <figure markdown="span">
      ![ithyno ElectronのWelcome画面にOpen Folderと最近使用したプロジェクトが表示される。](assets/images/electron-welcome.png){ loading=lazy }
      <figcaption>Welcome画面で<strong>Open Folder</strong>を選択します。</figcaption>
    </figure>

    <figure markdown="span">
      ![Electron Appが選択したフォルダにOpenSpecプロジェクトがないことを表示する。](assets/images/electron-no-openspec.png){ loading=lazy }
      <figcaption>OpenSpecがないフォルダでは<strong>Initialize openspec here</strong>を選択します。</figcaption>
    </figure>

## 2. プロジェクトを初期化する

オンボーディング画面は必要なツールを確認し、インストール済みでManagerに対応
するエージェントCLIだけをManager選択欄へ表示します。

1. Git、Node.js、対応するエージェントCLIが1つ以上利用可能であることを確認
   します。不足しているCLIはインストールと認証を済ませてください。
2. **Manager**として使用するCLIを選択します。
3. **Continue**を選択し、すべてのセットアップ項目が完了するまで待ちます。

=== "VS Code Extension"

    <figure markdown="span">
      ![VS CodeのInitialize Project画面に前提ツールとManager CLIの選択肢が表示される。](assets/images/vscode-initialize.png){ loading=lazy }
      <figcaption>前提ツールを確認し、Manager CLIを選択してから<strong>Continue</strong>を選びます。</figcaption>
    </figure>

    初期化が完了すると、選択したManagerがVS Codeのターミナルで動作します。
    エージェントの作業中はそのターミナルを閉じないでください。

    <figure markdown="span">
      ![初期化後、VS Code内でithynoダッシュボードとManagerターミナルを開いた状態。](assets/images/vscode-simple-1.png){ loading=lazy }
      <figcaption>Managerを選択して初期化が完了した後、ダッシュボードとManagerターミナルをエディタの横で開いたままにします。</figcaption>
    </figure>

=== "Electron App"

    <figure markdown="span">
      ![ElectronのInitialize Project画面に前提ツールとManager CLIの選択肢が表示される。](assets/images/electron-initialize.png){ loading=lazy }
      <figcaption>検出されたツールを確認し、Manager CLIを選択します。</figcaption>
    </figure>

    <figure markdown="span">
      ![Electronのオンボーディング画面でOpenSpecのインストールが進行している。](assets/images/electron-initialize-progress.png){ loading=lazy }
      <figcaption><strong>Continue</strong>を選択し、すべての初期化ステップが完了するまで待ちます。</figcaption>
    </figure>

    初期化が完了すると、選択したManagerがithyno内蔵ターミナルで動作します。
    エージェントの作業中はそのターミナルを閉じないでください。

    <figure markdown="span">
      ![初期化済みプロジェクトがElectron Appで開き、空のダッシュボードとManagerターミナルが表示される。](assets/images/electron-dashboard.png){ loading=lazy }
      <figcaption>初期化後、Electron Appがダッシュボードを開き、選択したManagerを内蔵ターミナルで起動します。</figcaption>
    </figure>

初期化では、OpenSpecディレクトリ、`agents.yaml`、エージェント向けスキル、
ithynoのローカルファイルに対するignore設定を準備します。まだGitリポジトリで
ないフォルダでは、Gitの初期化も行います。

## 3. 最初のChangeを作る

1. ダッシュボードから**+ New Change**を選択します。
2. まずは小さな成果を1つ記述します。例：

   > `{ "status": "ok" }`を返すヘルスチェックエンドポイントを追加する。

3. Managerがproposal、requirements、design、task listを作成するまで待ちます。
4. 作業を開始する前にChangeを開き、生成されたドキュメントを確認します。
   **Needs human**が表示された場合は質問へ回答します。

最初のChangeを小さくすると、選択したエージェント、権限、開発ツールが正しく
動作することを確認しやすくなります。

=== "VS Code Extension"

    <figure markdown="span">
      ![Propose a new changeダイアログへ最初のChangeを入力する。](assets/images/vscode-simple-2.png){ loading=lazy }
      <figcaption><strong>+ New Change</strong>を選択し、小さな成果を記述してManagerへ送信します。</figcaption>
    </figure>

    <figure markdown="span">
      ![proposalコマンドがVS CodeのManagerターミナルへ送信された状態。](assets/images/vscode-simple-3.png){ loading=lazy }
      <figcaption>proposalコマンドがManagerターミナルへ送信されます。</figcaption>
    </figure>

    <figure markdown="span">
      ![作成されたChangeがTODOレーンのカードとして表示される。](assets/images/vscode-simple-4.png){ loading=lazy }
      <figcaption>proposalの生成が終わると、Changeが<strong>TODO</strong>レーンへ表示されます。</figcaption>
    </figure>

=== "Electron App"

    <figure markdown="span">
      ![ElectronのPropose a new changeダイアログに最初のChangeの説明を入力した状態。](assets/images/electron-propose-dialog.png){ loading=lazy }
      <figcaption><strong>+ New Change</strong>を選び、最初の成果を入力してproposalコマンドを送信します。</figcaption>
    </figure>

    <figure markdown="span">
      ![ElectronのManagerターミナルでOpenSpec proposalを生成している。](assets/images/electron-propose-running.png){ loading=lazy }
      <figcaption>Managerがproposalの成果物を生成・検証している間はアプリを開いたままにします。</figcaption>
    </figure>

## 4. 作業を開始して確認する

1. Changeカードの**Start**を選択します。
2. ダッシュボードで進捗を確認します。ロール別のエージェントを設定している場合、
   ithynoはcode、review、verifyの順で処理を進めます。
3. **Needs human**またはreworkへ戻った場合は、指摘内容を確認して回答し、
   Changeを再開します。
4. mergeまたはarchiveする前に、完了したdiffとテスト結果を確認します。

=== "VS Code Extension"

    <figure markdown="span">
      ![Dispatch this changeダイアログで実行を確認する。](assets/images/vscode-simple-5.png){ loading=lazy }
      <figcaption><strong>Start</strong>を選択し、Dispatchコマンドを確認します。</figcaption>
    </figure>

    <figure markdown="span">
      ![ManagerターミナルでWorkerがChangeを実装している状態。](assets/images/vscode-simple-6.png){ loading=lazy }
      <figcaption>ターミナルでWorkerを確認しながら、カード上の進捗を追います。</figcaption>
    </figure>

=== "Electron App"

    <figure markdown="span">
      ![ElectronのDispatch this changeダイアログにdispatchコマンドが表示される。](assets/images/electron-dispatch-dialog.png){ loading=lazy }
      <figcaption><strong>Start</strong>を選択し、コマンドを確認してManagerへ送信します。</figcaption>
    </figure>

    <figure markdown="span">
      ![ElectronのManagerターミナルがChangeのdispatchワークフローを開始している。](assets/images/electron-dispatch-running.png){ loading=lazy }
      <figcaption>Changeカードを表示したまま、Managerがdispatchを開始します。</figcaption>
    </figure>

    <figure markdown="span">
      ![ElectronのAgentレーンにcodingステージが表示され、Managerターミナルが動作している。](assets/images/electron-agent-view.png){ loading=lazy }
      <figcaption>Agentレーン表示で、動作中のロールと対象Changeを確認できます。</figcaption>
    </figure>

    <figure markdown="span">
      ![完了したChangeがElectron AppのDoneレーンに表示される。](assets/images/electron-done.png){ loading=lazy }
      <figcaption>すべてのタスクが完了したら、<strong>Done</strong>レーンで結果を確認します。</figcaption>
    </figure>

    <figure markdown="span">
      ![ElectronのArchive this changeダイアログにarchiveコマンドが表示される。](assets/images/electron-archive-dialog.png){ loading=lazy }
      <figcaption>完了した作業を確認後、<strong>Archive</strong>を選び、archiveコマンドを確認します。</figcaption>
    </figure>

初期化と既存コードベースのImportについては
[Init & Import](user-manual-init-and-import.md)を参照してください。code、review、
verifyを別々のWorkerへ割り当てる場合は、
[複数エージェントを設定してDispatchする](multi-agent-setup-and-dispatch.md)へ進んでください。
