---
title: PENDING アノテーションの配置位置 (SHALL/MUST 記述の後、手前は不可)
date: 2026-07-28
status: accepted
related_change: fix-pending-annotation-parser-compat
---

# PENDING アノテーションの配置位置

## 背景

プロジェクトでは、進行中の変更が既存の要件を「変更（MODIFY）」または「削除（REMOVE）」しようとしていることを読者に警告するため、`openspec/specs/<capability>/spec.md` 内で `> ⚠️ **PENDING ...**` の引用ブロックを使用しています。このアノテーションは提案（propose）時に挿入され、対象の変更がアーカイブされると自動的に消滅します。

このようなアノテーションを配置する自然な場所は、**`### Requirement:` 見出しの直下**（読者が要件をスキャンする際に最初に目に入る位置）です。CLAUDE.md の元の「Format」ブロックも、まさにその位置を指定していました。

## 制約

openspec CLI（`@fission-ai/openspec` v1.4.x）は、各要件を `text` フィールドに解析する際、`### Requirement:` ヘッダーの後の最初の空行でなく、かつメタデータでもない行（`node_modules/@fission-ai/openspec/dist/core/parsers/markdown-parser.js` 内の `parseRequirements`）からテキストを抽出します。その Zod スキーマ（`node_modules/@fission-ai/openspec/dist/core/schemas/base.schema.js` 内の `RequirementSchema`）は、この `text` に `SHALL` または `MUST` というキーワードが含まれていることを要求します。

アノテーションが見出しの直下に置かれると、その `> ⚠️ **PENDING ...**` 引用行が最初のコンテンツ行として解釈されますが、ここには `SHALL` や `MUST` は含まれていません。そのため、その時点以降に別の変更をアーカイブしようとすると、差分適用後にスペック全体が再検証され、以下のバリデーションエラーで失敗します：

```
x Requirement must contain SHALL or MUST keyword
```

これは、アノテーションを所有している変更だけに影響するものではありません。同じスペックファイルを触る無関係な他のすべての変更に対しても、`openspec archive` の実行がこのエラーで失敗します。実際に、`openspec/specs/dashboard/spec.md` 内に配置された4つの進行中アノテーションが原因で、競合しない無関係な4つの変更のアーカイブ処理がブロックされました。当時の回避策として `--no-validate` を使用していましたが、検証を回避することをチームのデフォルトルールとするのは安全性の観点から望ましくありません。そのため、根本的な原因に対処します。

## 決定

PENDING アノテーションは、要件の SHALL/MUST が含まれる本文段落の**直後**、かつ `#### Scenario:` ヘッダーの手前に配置します：

```md
### Requirement: <要件名>

<既存の SHALL/MUST 本文 — 最初の非空行として維持される>

> ⚠️ **PENDING <ADDED|MODIFIED|REMOVED>** by [<change-id>](../../changes/<change-id>/): <一行理由>.

<残りの本文 / #### Scenario: ブロック>
```

アノテーションは依然として要件のブロック内に存在し、スペックをスキャンする読者から視認可能な状態に保たれます。一方で、最初のコンテンツ行（スロット）は SHALL/MUST 本文のために保護されます。

CI は `server/openspec-annotation.test.ts` を通じてこのルールを強制します。このテストは、すべての `openspec/specs/**/spec.md` を走査し、各要件の最初のコンテンツ行に `SHALL` または `MUST` が含まれているかを検証します。

## 検討された代替案

1. **openspec CLI パーサーをフォークする**: `text` 抽出時に引用ブロックを無視するようにパーサーを変更する。却下：プロジェクト固有の規約のためにツールをフォークすると、バージョン管理の乖離（drift）コストが発生するため。
2. **引用ブロックの代わりに HTML コメント `<!-- PENDING ... -->` を使用する**: 却下：スペックをスキャンする読者から見えなくなってしまい、進行中の変更について警告するというアノテーション本来の目的を果たせなくなるため。
3. **アノテーションをファイルの最上部にある `## In-Flight Annotations` などの独立したセクションに移動する**: 却下：アノテーションの対象となる要件から切り離されてしまうため、要件のブロックをスキャンしている読者が変更に気付けなくなります。
4. **アーカイブ実行時に `--no-validate` に依存し続ける**: 却下：本物のバリデーションエラーを隠蔽してしまい、チームに悪い習慣を定着させてしまうため。

## 影響

- CLAUDE.md のハードルールセクションがこの新しい形式に更新され、この ADR への参照ポインタが追加されました。
- `.claude/skills/opsx-revert/SKILL.md` のステップ 8 が更新され、この新しい位置にアノテーションを挿入するようになりました。
- `.claude/skills/openspec-flow/SKILL.md` の「PENDING annotation」セクションが整合性を取るために更新されました。
- `openspec/specs/dashboard/spec.md` 内の既存の4つのアノテーションがすべてこの新しい位置に再配置されました（`fix-pending-annotation-parser-compat` 差分参照）。
- 今後の `openspec archive` 実行時に、この原因による `--no-validate` の使用が不要になり、再構築バリデーターの信頼性が回復します。
- CI の回帰テスト `server/openspec-annotation.test.ts` によって、今後のプルリクエスト（PR）レビュー時に同様のデグレードを検出できるようになります。

## エスケープハッチ (例外処理)

将来的に要件の SHALL/MUST 本文がどうしても複数段落になる場合は（稀なケースですが）、最後の SHALL/MUST を含む段落の直後、かつ最初の `#### Scenario:` ヘッダーの手前にアノテーションを配置してください。パーサーは最初のコンテンツ行のみを検証するため、それ以降の行であれば安全です。
