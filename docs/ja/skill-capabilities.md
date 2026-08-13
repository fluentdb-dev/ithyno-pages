# Skill capability tokens (v1)

`ithyno/skills/<name>/SKILL.md` に記述されるスキルは、CLIネイティブな構文ではなく、CLIに依存しないプリミティブとして **ケーパビリティトークン (capability tokens)** を表現します。レンダラーはインストール時に、各トークンをターゲットCLIの起動コマンドに変換します。

`generalize-skills-cross-cli` により導入されました。

## v1 ボキャブラリー

v1のボキャブラリーは意図的に最小限に抑えられており、現在のすべての ithyno スキルが必要とするプリミティブをカバーする3つのトークンのみで構成されています。必要に応じて拡張し、事前に過剰な仕様を定義するよりもイテレーションを繰り返すことを優先します。

### `<capability:subagent_spawn>`

> 起動プロンプトを指定して子ワーカーを起動し、その完了を待ちます。

現在、7つすべてのレンダラーが `server/skill-renderer/renderers/` 下に実装されています。各レンダラーは、展開されたスキル本体において `<capability:subagent_spawn>` をCLIネイティブな表現に展開します。

- **Claude レンダラー** → Task ツールの呼び出し。展開後の本体内にライブシェル用の代替手段として `/ithy-opsx:dispatch` を提示します（`server/skill-renderer/renderers/claude.ts` 参照）。
- **Codex レンダラー** → サブプロセスによる呼び出し（ネストされた実行のための `codex exec ...`）（`server/skill-renderer/renderers/codex.ts` 参照）。
- **Antigravity レンダラー** → ネストされた実行のための `agy exec`（`server/skill-renderer/renderers/antigravity.ts` 参照）。
- **Cursor レンダラー** → 「Cursorのエージェントツールを介した呼び出し」として `.cursor/commands/<namespace>-<command>.md` を出力します（`server/skill-renderer/renderers/cursor.ts` 参照）。
- **Gemini レンダラー** → サブプロセスによる `gemini` の呼び出し（`server/skill-renderer/renderers/gemini.ts` 参照）。
- **Copilot レンダラー** → `.github/prompts/<namespace>-<command>.prompt.md` を出力します。`subagent_spawn` トークンはサブプロセスとしての呼び出し文脈で表現され、Copilot にはサブエージェントを起動するツールが欠けている旨の注記が添えられます。ケーパビリティによるインストールのスキップ機能は仕様上の目標（`openspec/specs/cross-cli-skill-installer/spec.md`）であり、現在は実装されていません。レンダラーは常にファイルを生成し、本文中に警告を表示します（`server/skill-renderer/renderers/copilot.ts` 参照）。
- **OpenCode レンダラー** → ネストされた実行のための `opencode run`（`server/skill-renderer/renderers/opencode.ts` 参照）。

このトークンを使用するスキルは、`capabilities_required` に `subagent_spawn` を指定しなければなりません。

### `<capability:file_write>`

> 指定されたパスのプロジェクトファイルを変更します。

- すべてのCLIがファイルの書き込みをサポートしています（そうでなければエージェントとして実行する意味がありません）。レンダラーは、展開後の本体における標準的な参照方法に従い、各CLIが使用するツール（Edit / Write / str_replace_editor など）に変換します。

レンダラーがCLIのツール名規約を挿入できるようにケーパビリティとして命名されています。厳密な制限（ゲート）を設けることは意図していません。

### `<capability:bash>`

> シェルを起動してコマンドを実行します。

- `file_write` と同様です。ユニバーサルにサポートされていますが、レンダラーがCLIのシェル起動規約を挿入できるように命名されています。

## 新しいトークンの追加方法

1. このドキュメントにトークン名、1行の説明、および各レンダラーがそれをどのように変換すべきかを追記します。
2. `schemas/skill-manifest.schema.json` の `capabilities_required.items.enum` を更新します。
3. `scripts/lint-skill-tokens.mjs` の既知トークンセットを更新します。
4. 各レンダラーを更新し、新しいトークンを処理できるようにします（または、明確なメッセージとともにソフトエラー（警告）を出すようにフォールバックを実装します）。

## Linter

`scripts/lint-skill-tokens.mjs` は、すべての `ithyno/skills/**/SKILL.md` 内の `<capability:*>` トークンをスキャンし、v1のボキャブラリーに含まれないものを拒否します。これは `npm test` の一部として実行されます。

## 設計理由

スキル本文の95％はワークフローの散文です。残りの5％が「子ワーカーを起動する」「ファイルを変更する」「コマンドを実行する」といった操作です。これら3つに名前を付けて定義しておくことで、本文の散文は汎用的な状態に保ちつつ、レンダラーがCLIネイティブな構文に置換できるようになります。
