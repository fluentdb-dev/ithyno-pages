# Codex設定例

**codeにGPT-5.6-Sol**、**reviewにGPT-5.6-Terra**を使用する設定例です。

```text
Codex Manager
    ├── GPT-5.6-Sol   — code
    └── GPT-5.6-Terra — review
```

!!! info "事前準備"
    Codexをインストールしてログインします。ithynoの
    **Settings → Prerequisites**でCodexが利用可能なことを確認し、
    **Manage skills**からOpenSpecとithynoのSkillをインストールしてください。

!!! warning "Codexの設定は変わりやすい"
    Codex CLIの引数や利用可能なモデルは、リリースによって変わることがあります。
    以下のモデル名は現在の設定例です。インストール済みのCodexで新しいモデルや
    異なるモデルが提供されている場合は置き換えてください。

## Agents画面で設定する

**Agents**を開き、次の3つを設定します。**Prompt**は空欄にします。

| 名前 | Role | Command | Args |
|---|---|---|---|
| `manager` | `manager` | `codex` | 空欄 |
| `codex-sol-code` | `code` | `codex` | `-m gpt-5.6-sol` |
| `codex-terra-review` | `review` | `codex` | `-m gpt-5.6-terra` |

## `agents.yaml`の設定例

プロジェクトルートの`agents.yaml`へ、次の設定を使用することもできます。

```yaml
agents:
  - name: manager
    mode: live-shell
    roles: [manager]
    command: codex
    args: []

  - name: codex-sol-code
    mode: single-prompt
    roles: [code]
    command: codex
    args:
      - -m
      - gpt-5.6-sol

  - name: codex-terra-review
    mode: single-prompt
    roles: [review]
    command: codex
    args:
      - -m
      - gpt-5.6-terra

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
