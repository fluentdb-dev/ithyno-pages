# 複数エージェントを設定してDispatchする

ithynoでは、常駐する1つの**Manager**と、必要なときだけ起動する複数の
**Worker**を使用します。Managerはdispatchコマンドを受け取り、`agents.yaml`を
読み、各ステージを対応するロールのWorkerへ委譲します。

```text
Start / dispatch
      ↓
Manager ──→ code worker ──→ review worker ──→ verify worker
```

1つのChangeでは各ステージを順番に実行します。Parallel executionを有効にすると、
別々のChangeを並行して実行できます。

## 1. 各CLIを準備する

使用するすべてのエージェントCLIをインストールし、認証を済ませてください。
スキルファイルのインストールでは、CLI本体のインストールやログインは行われません。

ithynoで次の操作を行います。

1. **Settings → Prerequisites**を開きます。
2. 使用する各CLIが検出されていることを確認します。
3. Managerと各Workerの**Manage skills**を選択します。
4. 対応している場合は**OpenSpec**と**ithyno skills**の両方をインストールします。

Managerだけでなく、命令を受け取るWorker側にも必要です。WorkerはOpenSpecのapplyや
ithynoのreviewなど、受け取ったワークフローを解決できなければなりません。

## 2. ロールを割り当てる

**Agents**を開いて**+ Add agent**からWorkerを追加します。標準ロールは次の
とおりです。

| ロール | 担当 | 組み込みワークフロー |
|---|---|---|
| `manager` | Change全体を制御し、作業を委譲する | ithyno dispatch |
| `code` | OpenSpecの未完了タスクを実装する | OpenSpec apply |
| `review` | 実装をレビューし、`review.md`を書く | ithyno review |
| `verify` | 適用可能な検証を実行し、`review.md`を書く | ithyno verify |

CLIに対応した組み込みワークフローを変更したい場合だけ、カスタムPromptを
設定します。

<figure class="dialog-screenshot" markdown="span">
  ![Agyと組み込みdispatch Promptを使用するManagerの編集画面。](../assets/images/agent-manager.png){ loading=lazy }
  <figcaption>Managerの設定例です。Promptを空欄にすると、CLIに対応した組み込みdispatchワークフローを使用します。</figcaption>
</figure>

### 例：各Workerステージで異なるCLIを使用する

次の例では、ManagerをClaude、実装をCodex、レビューをCopilot、検証をClaudeへ
割り当てます。

**Agents**画面で次の行を設定します。

| エントリ | ロール | Command | Args |
|---|---|---|---|
| Manager | `manager` | `claude` | 空欄 |
| 実装Worker | `code` | `codex` | `--dangerously-bypass-approvals-and-sandbox` |
| Review Worker | `review` | `copilot` | `--yolo -s` |
| Verify Worker | `verify` | `claude` | `--dangerously-skip-permissions` |

組み込みPromptは、受信するCLIに合った形式へ変換されます。たとえばCodexは
`codex exec <prompt>`、ClaudeとCopilotは`-p <prompt>`で起動されます。この例では
`exec`、`-p`、ワークフロー名を自分で記述する必要はありません。

エージェント名は表示用のラベルです。実際に起動するCLIは**Command**欄の値で
決まります。

<figure class="dialog-screenshot" markdown="span">
  ![codeロールと組み込みOpenSpec apply Promptを選択したWorkerの編集画面。](../assets/images/agent-code.png){ loading=lazy }
  <figcaption>code Workerの設定例です。codeロールを選択し、Promptを空欄にすると組み込みOpenSpec applyワークフローを使用します。</figcaption>
</figure>

<figure class="dialog-screenshot" markdown="span">
  ![reviewロールとカスタムithyno review Promptを設定したWorkerの編集画面。](../assets/images/agent-review.png){ loading=lazy }
  <figcaption>ロール別のカスタムPromptを設定したreview Workerの例です。</figcaption>
</figure>

!!! warning "異種CLI Workerの自動承認フラグを確認してください"
    上記の設定例には、`--dangerously-bypass-approvals-and-sandbox`、`--yolo -s`、
    `--dangerously-skip-permissions`が含まれています。これらのフラグは、Workerに
    確認を求めずファイル編集やコマンド実行を許可します。

    これらが関係するのは、Managerが異なるCLIを独立したサブプロセスとして起動し、
    そのCLIが承認待ちになる場合です。同じCLIの親から子をネイティブなAgent/Tool
    機構で委譲するだけなら、この目的で自動承認フラグを追加する必要はありません。
    サブプロセスWorkerでは、信頼できるリポジトリとアカウントでのみunattended実行を
    許可し、例示したフラグを環境に適したapprovalまたはsandbox設定へ置き換えてください。

1つのWorkerに`review`と`verify`など、複数のロールチップを選択することもできます。

<figure markdown="span">
  ![Agents画面にAgyのManager、Codexのcode Worker、Copilotのreview Workerが表示されています。](../assets/images/ithyno-agents.png){ loading=lazy }
  <figcaption>Managerとロール別Workerを設定したAgents画面の例です。</figcaption>
</figure>

### 確認済みのManagerとWorkerの組み合わせ

次の組み合わせは、ithynoのdispatcherで手動確認済みです。この表は
[ithynoのREADME](https://github.com/fluentdb-dev/ithyno#agent-dispatch-compatibility)にも
残しています。

| Manager | Claude Worker | Agy Worker | Copilot Worker | Codex Worker | `dispatch-multi` |
|---|---:|---:|---:|---:|---:|
| Claude | ✅ | ❌ | ✅ | ✅ | ✅ |
| Codex | ✅ | ❌ | ✅ | ✅ | ✅ |
| Agy | ✅ | ✅ | ✅ | ✅ | ✅ |

✅は確認済み、❌は現在動作しない組み合わせです。

## 3. 設定を確認する

保存後、次を確認します。

1. **Agents**を開き、ManagerとすべてのWorkerが表示されることを確認します。
2. 画面上部に`agents.yaml`のparse errorがある場合は修正します。
3. **Settings → Prerequisites**へ戻り、すべてのCLIとスキルが最新であることを
   確認します。
4. `.worktrees/<change-id>/`へ作業を分離する場合は、
   **Settings → Execution → Parallel execution**を有効にします。Dispatchでは
   有効化を推奨し、複数Changeを安全に同時実行する場合は必須です。

`maxParallel`は同時に動作できるChange数を制限します。同じChangeのcode、review、
verifyを同時に実行する設定ではありません。

<figure markdown="span">
  ![展開したManager欄に解決済みの起動コマンドが表示され、Managerターミナルが動作しています。](../assets/images/ithyno-agents-2.png){ loading=lazy }
  <figcaption>Managerの起動コマンドを確認するときは、Manager欄を展開します。</figcaption>
</figure>

## 4. ダッシュボードからDispatchする

1. **+ New Change**でChangeを作るか、既存のproposed Changeを開きます。
2. proposal、requirements、design、task listを確認します。
3. ChangeカードまたはChange Detailの**Start**を選択します。
4. **Dispatch this change**ダイアログに表示されたコマンドを確認します。
5. Managerターミナルを起動したまま、Changeカードまたは**Agents**で進捗を
   確認します。

Managerは最初に`code` Workerを選択します。codeが成功すると`review`、reviewが
成功すると`verify`へ進みます。reworkの指摘はcodeへ戻され、判断が必要な質問は
**Needs human**として表示されます。

## 5. ManagerターミナルからDispatchする

Managerターミナルへ同じコマンドを直接入力することもできます。Changeカードの
コピーボタンを使用するとChange IDをコピーできます。コピーしたIDを、以下の
dispatchコマンドの後ろへ貼り付けてください。

=== "Claude / Agy / スラッシュコマンド対応クライアント"

    ```shell
    /ithy-opsx:dispatch add-health-endpoint
    ```

=== "Codex"

    ```shell
    ithy-opsx-dispatch add-health-endpoint
    ```

複数の独立したChangeを並行実行する場合は、各proposalを作成してから
dispatch-multiを使用します。

=== "Claude / Agy / スラッシュコマンド対応クライアント"

    ```shell
    /ithy-opsx:dispatch-multi change-one change-two change-three
    ```

=== "Codex"

    ```shell
    ithy-opsx-dispatch-multi change-one change-two change-three
    ```

dispatch-multiは待機する前に複数Changeを起動しますが、各Change内では引き続き
`code → review → verify`の順に処理します。

## トラブルシューティング

| 症状 | 確認すること |
|---|---|
| Worker commandが見つからない | CLIをインストールし、更新された`PATH`をManagerへ渡すためithynoを再起動します。 |
| Workerがワークフローを認識しない | そのCLIの**Settings → Prerequisites → Manage skills**を実行します。 |
| `review returned no artifact` | review Workerにithyno skillsがあり、dispatchで指定された正確なパスへ`review.md`を書けることを確認します。 |
| Startダイアログの後に何も動かない | Managerターミナルが起動し、Manager CLIが認証済みであることを確認します。 |
| main treeで作業が進む | Dispatch前に**Parallel execution**を有効にします。 |
| 2つ目のChangeが起動しない | `maxParallel`、Agents画面、非parallel実行が保持するproject lockを確認します。 |

ステージの流れは[Multi-agent execution flow](multi-agent-execution-flow.md)、CLI固有の
追加設定は[エージェント設定（`agents.yaml`）](user-manual/multi-agent-cli.md)を参照してください。
Managerターミナルの維持とlive-shell Workerのメッセージについては、別ページの
[Advanced：tmuxとagmsg](advanced/tmux-and-agmsg.md)にまとめています。
