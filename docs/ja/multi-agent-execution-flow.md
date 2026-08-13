# マルチエージェント設定での実行フロー

リポジトリ直下の `agents.yaml` で、役割（ロール）ごとに異なるエージェント（Code / Review / Verify）が設定されている場合、「Start」ボタンをトリガーに以下の自動連携パイプラインが走ります。

1. **実装フェーズ (Code エージェントの起動)**:
   まず Code ロールのエージェントが隔離された作業エリア（Worktree）で起動し、タスクリスト（`tasks.md`）に従ってソースコードの実装・コミットを行います。
2. **レビューフェーズ (Review エージェントの起動)**:
   実装コミットが完了すると、自動的に Review ロールのエージェントが起動してコミット差分をレビューします。指摘点（差し戻し）があった場合は自動的に Code エージェントへフィードバックが渡され、再実装が実行されます。
3. **検証フェーズ (Verify エージェントの起動)**:
   レビューをパスすると、Verify ロールのエージェントが起動してビルドや自動テスト（`npm test` など）を実行します。すべてのテストに合格すると、ステータスは自動的に `done`（完了）状態になります。

---

## エージェントの設定方法 (`agents.yaml`)

この自動連携フローを動作させるには、プロジェクトのルートディレクトリに **`agents.yaml`** ファイルを作成し、役割（ロール）ごとにエージェントを設定します。

### 設定例 (`agents.yaml`)

以下は、Code (実装)、Review (レビュー)、Verify (検証) の各ロールにエージェントを割り当てる設定のサンプルです。

```yaml
# 実装を担当するエージェントの設定
- name: Claude Coder
  mode: single-prompt
  roles: [code]
  command: claude
  args:
    - "-p"

# レビューを担当するエージェントの設定
- name: Claude Reviewer
  mode: single-prompt
  roles: [review]
  command: claude
  args:
    - "-p"

# ビルド・テスト検証を担当するエージェントの設定
- name: Local Verifier
  mode: single-prompt
  roles: [verify]
  command: npm
  args:
    - "run"
    - "test"
```

### 設定のポイント

* **`roles`**: それぞれ `code` (実装)、`review` (レビュー)、`verify` (検証) を指定します。Ithyno はこの指定に基づいて適切なステップで各エージェントを自動起動します。
* 詳細な引数やプロンプト設定、その他の対応エージェントについては、[エージェント設定の詳細マニュアル](../user-manual/multi-agent-cli.md) を参照してください。
