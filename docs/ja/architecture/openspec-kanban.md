# OpenSpec とかんばんボードの関係

Ithyno における OpenSpec ワークフローと、それを可視化するかんばんボード（Kanban Board）のアーキテクチャおよび関係性について説明します。

---

## Phase ボード（フェーズかんばん / 旧 Classic かんばん）の構成

Ithyno の Phase ボード（旧 Classic かんばんボード）は、OpenSpec の変更（Changes）のライフサイクルを可視化するための **ステータスモニター（State Monitor）** です。クラシックな 3 カラム構成で設計されており、各変更の進行状況（タスク完了率など）を直感的に把握できます。

### TODO
* **意味**: 提案（Propose）された段階で、まだエージェントによる実装や検証が開始されていない変更。
* **ユーザーアクション**:
  * `+ New Change`：新規の提案ドキュメントの作成。
  * `Start` / `Apply`：変更に対してエージェント（実装担当者）を起動して処理を開始する。

### IN-PROGRESS (PROCESS)
* **意味**: エージェントによる実装（コーディング）、レビュー、またはテスト検証が実際に進行している状態の変更。
* **表示と特徴**:
  * カード上にタスクの進捗率（`tasks.md` 内の完了数に基づくパーセンテージ）が表示されます。
  * エージェントが裏で処理を実行中であること、またはレビュー中の段階であることを示します。
  * エージェントが処理中に判断に迷い、人手による回答待ち（`needs-human`）のステータスになっているカードもこのカラムに留まります。

### DONE
* **意味**: エージェントによる実装と検証のすべてが完了した変更。
* **ユーザーアクション**:
  * `Merge`：実装内容をメインブランチにマージする（作業ツリーのクリーンアップを伴う）。
  * `Archive`：完了した変更をアーカイブする。
  * `Discard`：変更を取り下げる（廃棄する）。

## かんばんボードと指示レイヤー（OpenSpec）の基本対応

かんばんボード（TODO / IN-PROGRESS / DONE）のカラムと、ユーザーが実行する OpenSpec 指示コマンド（アクション）の直接的な対応関係は以下の通りです。

```mermaid
graph TD
    subgraph UI ["ユーザー操作"]
        C_NewChange["+ New Change<br>(新規作成ボタン)"]
    end

    subgraph OpenSpec ["指示レイヤー (OpenSpec)"]
        C_Propose["propose<br>(提案)"]
        C_Start["apply / Start<br>(実行)"]
        C_Post["merge / archive / discard<br>(事後処理)"]
    end

    subgraph Kanban ["かんばんボード"]
        Col_Todo["TODO<br>(着手待ち)"]
        Col_Inprogress["IN-PROGRESS (PROCESS)<br>(進行中)"]
        Col_Done["DONE<br>(完了済)"]
    end

    C_NewChange --> C_Propose
    C_Propose --> |新規作成| Col_Todo
    Col_Todo --> |Start 押下| C_Start
    C_Start --> |進捗率の更新| Col_Inprogress
    Col_Inprogress --> |全検証合格| Col_Done
    Col_Done --> |事後処理アクション| C_Post
```

---

## ライフサイクルと詳細な状態変化マップ

エージェントの内部的な状態管理（`proposed`, `coded`, `reviewed`, `done` および `needs-human` による一時停止と対話ループ）を含む、詳細なライフサイクルは以下の通りです。

```mermaid
graph TD
    %% 指示レイヤー (OpenSpec)
    subgraph Instruction ["指示レイヤー (OpenSpec Commands / Actions)"]
        style Instruction fill:#e1f5fe,stroke:#01579b,stroke-width:2px
        C_Propose["/opsx:propose<br>(提案ドキュメントの作成)"]
        C_Start["Start / Apply ボタン<br>(エージェント起動・実行)"]
        C_Post["事後処理コマンド<br>(Merge / Archive / Discard)"]
    end

    %% エージェント状態管理
    subgraph AgentState ["エージェント状態管理 (Agent Phase / State)"]
        style AgentState fill:#efebe9,stroke:#3e2723,stroke-width:2px
        S_Proposed["proposed<br>(提案済)"]
        S_Coded["coded<br>(実装完了)"]
        S_Reviewed["reviewed<br>(レビュー合格)"]
        S_Done["done<br>(全検証完了)"]
        S_NeedsHuman["needs-human<br>(人手による介入待ち)"]
    end

    %% かんばんボード
    subgraph Kanban ["かんばんボード (Kanban Columns)"]
        style Kanban fill:#f1f8e9,stroke:#33691e,stroke-width:2px
        Col_Todo["TODO<br>(着手待ち)"]
        Col_Inprogress["IN-PROGRESS (PROCESS)<br>(進行中)"]
        Col_Done["DONE<br>(完了済)"]
    end

    %% ライフサイクルとマッピングの接続
    C_Propose -.-> S_Proposed
    S_Proposed --> Col_Todo

    C_Start -.-> S_Coded
    S_Coded --> S_Reviewed
    S_Reviewed --> S_Done

    %% 状態とカラムの連動
    S_Coded ===> Col_Inprogress
    S_Reviewed ===> Col_Inprogress
    S_NeedsHuman ===> Col_Inprogress

    %% needs-human のエスカレーションループ
    S_Coded -. エラー / 疑問 .-> S_NeedsHuman
    S_Reviewed -. エラー / 疑問 .-> S_NeedsHuman
    S_NeedsHuman -. ターミナルで対話回答 .-> S_Coded

    S_Done --> Col_Done
    Col_Done -.-> C_Post
```
