# Claude設定例：codeにSonnet、reviewにFable

Claudeを使用し、**SonnetがChangeを実装**、**Fableがその結果をレビュー**する
設定例です。

```text
Claude Manager
    ├── Sonnet — code
    └── Fable  — review
```

!!! info "事前準備"
    Claude Codeをインストールしてログインします。ithynoの
    **Settings → Prerequisites**でClaudeが利用可能なことを確認し、
    **Manage skills**からOpenSpecとithynoのSkillをインストールしてください。

Argsへモデル名を設定する前に、
[各Agent CLIで利用可能なモデルを確認する](model-availability.md)を参照し、
ログイン済みClaude Codeに表示される選択肢を確認してください。

## Agents画面で設定する

**Agents**を開き、次の3つを設定します。**Prompt**は空欄にします。

| 名前 | Role | Command | Args |
|---|---|---|---|
| `manager` | `manager` | `claude` | 空欄 |
| `claude-sonnet-code` | `code` | `claude` | `--model sonnet` |
| `claude-fable-review` | `review` | `claude` | `--model fable` |

## `agents.yaml`の設定例

プロジェクトルートの`agents.yaml`へ、次の設定を使用することもできます。

```yaml
agents:
  - name: manager
    mode: live-shell
    roles: [manager]
    command: claude
    args: []

  - name: claude-sonnet-code
    mode: single-prompt
    roles: [code]
    command: claude
    args:
      - --model
      - sonnet

  - name: claude-fable-review
    mode: single-prompt
    roles: [review]
    command: claude
    args:
      - --model
      - fable

parallelExecution: true
```

## Changeを開始する

1. 設定を保存したら、Managerターミナルをリフレッシュします。
2. Changeを作成するか、既存のproposed Changeを開きます。
3. **Start**を選択します。
4. Changeカードまたは**Agents**で、codeとreviewの進行状況を確認します。

この例で設定するのはcodeとreviewです。検証も分けたい場合は、`verify`ロールの
Workerを追加してください。

異なるCLIを組み合わせる設定は、
[複数エージェントを設定してDispatchする](multi-agent-setup-and-dispatch.md)を
参照してください。
