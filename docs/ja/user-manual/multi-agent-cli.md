---
title: エージェント設定 — 対応 CLI と agents.yaml
audience: end-user
---

# エージェント設定 — 対応 CLI と agents.yaml

このページでは ithyno の Kanban から dispatch される「ワーカーエージェント」を
`agents.yaml` にどう書くかを、CLI 別 (claude / copilot / agy / codex) にまとめます。

対象 CLI:

- **claude** — Anthropic Claude Code
- **copilot** — GitHub Copilot CLI
- **agy** — Antigravity CLI
- **codex** — OpenAI Codex CLI

## Quick start

1. リポジトリ直下 `agents.yaml` を開く (無ければ Agents タブから作成)
2. 使いたい CLI が `which <cli>` で解決できることを確認
3. 下記「CLI 別テンプレート」から該当ブロックをコピペ
4. 保存すると Agents タブに即反映される (リロード不要)

## 対応早見表

| CLI | non-interactive 実行 | session-id | 権限 auto-approve | そのまま動くか |
|---|---|---|---|---|
| claude | `-p, --print <prompt>` | `--session-id <uuid>` (UUID 必須) | `--dangerously-skip-permissions` | ✅ |
| copilot | `-p, --prompt <text>` | `--session-id <id>` (UUID 想定) | `--yolo` (`--allow-all` alias) | ✅ |
| agy | `-p` / `--prompt` | `--conversation <id>` (`-c`/`--continue` で最新) | `--dangerously-skip-permissions` | ✅ |
| codex | `codex exec [PROMPT]` (サブコマンド+位置引数) | `codex exec resume <ID> [PROMPT]` | `--dangerously-bypass-approvals-and-sandbox` | ⚠️ workaround あり |

## agents.yaml の基本形

```yaml
- name: <任意の識別名>          # UI に表示される
  mode: single-prompt          # ヘッドレスで 1 プロンプト実行
  roles: [code]                # このエージェントが受け付ける role
  command: <CLI 実行ファイル名>
  args:
    - <CLI 固有 flag>
  prompts:
    code: <role=code 時に渡される prompt>
```

`prompts.<role>` に書いた文字列がある場合、かつ `args` に `-p` フラグが含まれていない場合に限り、runner が自動で `-p <prompt>` を args 末尾に append します。`prompts:` ブロックを持たないエージェントは `args` の指定通りに起動されます。組み込みの `/opsx:apply` / `/ithy-opsx:review` / `/ithy-opsx:verify` などのデフォルト動作では auto-append は行われません。CLI 側が `-p` を持たない場合は「codex (要 workaround) 節」を参照してください。

`args` および `prompts` の値の中で置換されるテンプレート変数は `${change_id}`, `${worktree_path}`, `${branch}` のみです（`server/agents/registry.ts` の `resolve()` 参照）。他の変数は認識されません。

## CLI 別テンプレート

### claude (code role)

```yaml
- name: claude
  mode: single-prompt
  roles: [code]
  command: claude
  args:
    - --dangerously-skip-permissions
    - --model
    - sonnet
  prompts:
    code: /opsx:apply ${change_id}
```

- `--model sonnet` を外すと Claude Code のデフォルトモデルが使われる
- ディスパッチ間でセッションを引き継ぎたい場合は、`args` に手動で `--session-id <uuid>` などを直書きしてください。ithyno 側で自動設定は行われません。

### copilot (review role)

```yaml
- name: copilot-review
  mode: single-prompt
  roles: [review]
  command: copilot
  args:
    - --yolo         # 権限確認スキップ
    - -s             # silent: agent 応答のみ出力
  prompts:
    review: /ithy-opsx:review ${change_id}
```

プロンプト `/ithy-opsx:review`（`/opsx:review` ではなく）は、ithyno のレビューフローが想定しているコマンドです。これは phase API が読み戻す `review.md` 成果物を生成します。`/opsx:review` も実行は可能ですが、この連携処理はスキップされます。

### agy (code role)

```yaml
- name: agy-worker
  mode: single-prompt
  roles: [code]
  command: agy
  args:
    - --dangerously-skip-permissions
  prompts:
    code: /opsx:apply ${change_id}
```

特定のモデルに固定したい場合は、agy 独自のドキュメントで指定されているフラグを `args` に追記してください。このリポジトリでは agy のモデル指定フラグのチェックは行っていないため、インストール済みの agy バージョンで確認してください。

### codex (要 workaround)

codex は他 CLI と違い **`-p` フラグを持たず**、`codex exec [PROMPT]` の
サブコマンド + 位置引数で prompt を渡します。ithyno runner の auto-append は
`-p <prompt>` を末尾に付ける仕様なので、そのままだと codex は unknown flag として
はじきます。

回避策は以下の通りです。

**ワークアラウンド: prompt を args に埋め込み、`prompts:` を設定しない**。`prompts.<role>` が設定されている場合のみ auto-append が実行されるため、未定義のままにしておけばインジェクション自体をスキップできます。

```yaml
- name: codex-worker
  mode: single-prompt
  roles: [code]
  command: codex
  args:
    - exec
    - --dangerously-bypass-approvals-and-sandbox
    - /opsx:apply ${change_id}   # ← 位置引数として prompt を埋め込む
```

`${change_id}` は `args` テンプレート内でも置換されます。

> **codex + session resume は未対応**: `codex exec resume <SESSION_ID>` を使うフローは、現在 ithyno 側でワーカー向けのセッション追跡機能を提供していないためサポート外です。

## セッションの扱い

`${session_id}` は「同じ change に対して発行される固定 UUID」です。

- 同じ change を何度 dispatch しても同じ UUID
- サーバー再起動を跨いでも保持
- **CLI ごとの session store は独立** — 同じ UUID を claude と copilot 両方に渡しても
  会話が共有されるわけではなく、単に同じ ID 空間を指すだけ

つまり同じ change での複数 dispatch は claude なら resume され、
copilot なら copilot 内で resume される、というだけの話です。

## multi-role 設定

1 つのエージェントに複数 role を持たせるパターンと、role ごとに CLI を分けるパターン
の 2 通りがあります。

### パターン 1: 1 CLI が全 role を担当

```yaml
- name: claude-all
  mode: single-prompt
  roles: [code, review, verify]
  command: claude
  args:
    - --dangerously-skip-permissions
  prompts:
    code: /opsx:apply ${change_id}
    review: /ithy-opsx:review ${change_id}
    verify: /ithy-opsx:verify ${change_id}
```

Kanban から順次 dispatch (code → review → verify)。各ディスパッチは Claude Code の新しい起動プロセスとなるため、デフォルトではロール間で会話のコンテキストは共有されません。連続性が必要な場合は `args` に `--session-id <your-uuid>` などを直書きしてください。

### パターン 2: role ごとに違う CLI

```yaml
- name: claude
  mode: single-prompt
  roles: [code]
  command: claude
  args: [--dangerously-skip-permissions]
  prompts: { code: /opsx:apply ${change_id} }

- name: copilot-review
  mode: single-prompt
  roles: [review]
  command: copilot
  args: [--yolo, -s]
  prompts: { review: /ithy-opsx:review ${change_id} }
```

dispatcher が role に応じて自動選択します。

## 制約と注意点

- **同一 change の同時 dispatch は不可**: change ごとに同時に実行できるジョブは1つだけです。重複して dispatch しようとすると runner は HTTP 409 を返します。たとえば code が走っている最中に review を開始しようとすると、code の完了まで失敗します。
- **CLI が PATH に無いと dispatch 失敗**: 起動ダイアログ内の前提条件（Prerequisites）セクション、または 設定（Settings）› 前提条件（Prerequisites）でインストール状況を確認できます。

## 関連ページ

- [複数エージェントを設定してDispatchする](../multi-agent-setup-and-dispatch.md) — ManagerとWorkerの役割、および標準的な設定手順。
- [OpenSpecとエージェント](../architecture/openspec-agent.md) — Code、Review、Verifyの実行と状態遷移。
