# Antigravity CLI設定例

Antigravity CLI（`agy`）で、**codeにClaude Sonnet 4.6**、
**reviewにGemini 3.1 Pro（High）**を使用する設定例です。

```text
AGY Manager
    ├── Claude Sonnet 4.6     — code
    └── Gemini 3.1 Pro (High) — review
```

!!! info "事前準備"
    Antigravity CLIをインストールしてログインします。ithynoの
    **Settings → Prerequisites**でAGYが利用可能なことを確認し、
    **Manage skills**からOpenSpecとithynoのSkillをインストールしてください。

!!! warning "AGYのモデルは変わりやすい"
    AGYで利用できるモデルは、CLIの更新によって変わることがあります。以下の
    モデル名は現在の設定例です。置き換える場合は、インストール済みバージョンの
    `agy models`で利用可能なモデルを確認してください。

## Agents画面で設定する

**Agents**を開き、次の3つを設定します。**Prompt**は空欄にします。

| 名前 | Role | Command | Args |
|---|---|---|---|
| `manager` | `manager` | `agy` | 空欄 |
| `agy-sonnet-code` | `code` | `agy` | `--model claude-sonnet-4-6` |
| `agy-gemini-review` | `review` | `agy` | `--model gemini-3.1-pro-high` |

## `agents.yaml`の設定例

プロジェクトルートの`agents.yaml`へ、次の設定を使用することもできます。

```yaml
agents:
  - name: manager
    mode: live-shell
    roles: [manager]
    command: agy
    args: []

  - name: agy-sonnet-code
    mode: single-prompt
    roles: [code]
    command: agy
    args:
      - --model
      - claude-sonnet-4-6

  - name: agy-gemini-review
    mode: single-prompt
    roles: [review]
    command: agy
    args:
      - --model
      - gemini-3.1-pro-high

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
