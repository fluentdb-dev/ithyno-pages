# 実装ロードマップ

> **注記:** これは設計初期のロードマップです。フェーズ 0〜4 はすでにリリースされており、現在のバックログは `openspec/changes/` で管理されています。完了済みの変更は `openspec/changes/archive/` を参照してください。

ithyno を設計から実装へと進めるための段階的な計画です。各フェーズは、独立してテスト可能なマイルストーンとして定義されています。

---

## フェーズ 0 — プロジェクトの基盤設定

ゴール: `npx ithyno` を実行すると、空のサーバーが起動し、自動的にブラウザが開くこと。

- [x] リポジトリの初期化 (Vite ＋ React フロントエンド、Node サーバー、bin CLI 構成の単一リポジトリ。のちに npm workspaces として `electron/` および `vscode-extension/` が追加されました)
- [x] TypeScript の構成 (ESLint および Prettier は未導入)
- [x] Fastify サーバーの基盤設定 (ヘルスチェック `GET /api/health` の実装)
- [x] フロントエンド（`web`）の基盤設定 (Vite ＋ React ＋ プレーン CSS。CSS 変数と、`<html>` に付与した `data-theme` に連動したテーマ管理を実装)
- [x] CLI (`commander`): ポート解決、サーバー起動、およびブラウザの自動起動 (`open` パッケージ)
- [x] 開発用スクリプト (Vite 開発サーバーと Fastify サーバーの並行実行、プロキシ構成)

**完了基準 (Definition of Done)**: ローカルでダッシュボードが起動し、空の画面が正常にレンダリングされること。

---

## フェーズ 1 — 読み取り専用の進捗可視化

ゴール: `openspec/` を解析し、開発の進捗を**閲覧**できること。

- [x] ドメインモデルの定義 (`model.ts`)
- [x] Parser: `tasks.md` (remark AST の `position` 情報を利用した行番号の取得)
- [x] Parser: `proposal.md`, `design.md`, 差分 `spec.md`, および `specs/`
- [x] ワークスペーススキャナー (`changes/` を優先的に読み込み、`archive/` は遅延読み込み)
- [x] `GET /api/state` エンドポイントの実装
- [x] 概要（Overview）画面の実装 (変更カード、進捗バー、およびワークスペース全体のサマリー)
- [x] 変更詳細（Change Details）画面の実装 (Tasks, Proposal, Design, Delta タブ。閲覧専用)
- [x] 仕様ブラウザ (Given-When-Then 形式のシナリオの整形レンダリング)
- [x] パースに失敗したファイルに対するプレーンテキスト表示フォールバックの提供

**完了基準 (Definition of Done)**: 実際の OpenSpec プロジェクトがダッシュボード上で読み込まれ、正確な進捗状況がビジュアル表示されること。

---

## フェーズ 2 — 局所的編集 (Surgical Edits) と双方向同期

ゴール: UI 上でチェックボックスを切り替えるとファイルが書き換わり、外部での編集結果が UI に自動プッシュされること。

- [x] `surgicalEdit.ts`: チェックボックスの1文字のみを置換する厳密な正規表現 (`/^(\s*[-*]\s*\[)[ xX](\]\s+)/`)
- [x] `surgicalEdit.ts` のユニットテスト (複数行タスク、タブインデント、`*` マーカー、大文字の `X` を網羅)
- [x] 楽観的ロック (`baseHash` 検証) ＋ `expectedText` フォールバックによる行のずれ（シフト）補正と 409 競合の局所化
- [x] `POST /api/tasks/toggle` の実装 (`baseHash` ＋ `expectedText` を含むペイロード)
- [x] chokidar 監視の設定 (`awaitWriteFinish` の有効化)
- [x] 自己発火（エコー）ループの抑制 (書き込み後のハッシュ記録による、自身の書き込み起因イベントの無視)
- [x] 外部編集用の差分パーサー ＋ WebSocket プッシュ送信の実装
- [x] クライアント: Zustand ストア ＋ WebSocket イベントハンドラー (`state-replaced`, `change-updated`)
- [x] UI: 楽観的更新 ＋ 局所的な競合リカバリー（インラインでの「もう一度確認」表示） ＋ 外部からの変更受信時の行の点滅エフェクト

**完了基準 (Definition of Done)**: UI の操作によって最小限 of Markdown 差分が書き込まれること。AI による編集が UI に即座に同期されること。競合が安全に処理されること。

---

## フェーズ 3 — 管理機能と UI の磨き上げ

ゴール: 視覚的な進捗管理の操作性を向上させること。

- [x] `agents.yaml` のロールから導出されるフェーズ状態マシンに基づいた、3列の変更 Kanban ボード (Backlog / In Progress / Done)
- [x] 変更単位の検索フィルター (`add-kanban-search-filter` にて実装)
- [ ] 「AIが書き込み中...」状態を通知する WebSocket イベントおよびバッジ表示 (アーキテクチャ 6.5 に準拠) — `add-writing-status` にて進行中
- [x] アーカイブ（Archive）一覧の表示 (遅延読み込み)
- [x] キーボードナビゲーションとアクセシビリティ対応
- [x] ダークテーマ / ライトテーマのサポート

**完了基準 (Definition of Done)**: 日常の進捗管理フローが、UI 上で快適に完結すること。

---

## フェーズ 4 — パッケージングとクリーンアップ

ゴール: `npx ithyno` を介して一般利用できる状態にすること。

- [x] サーバープロセスから `web` ビルドのアセットを静的に配信 (単一のプロセスとして実行可能に)
- [x] SPA フォールバック: `/api/*` 以外のすべての GET リクエストを `index.html` へ転送 (直接 `/change/:id` にアクセスしたり、リロードした際の 404 エラーを防止)
- [x] npm パッケージング構成 (package.json での `bin` 定義、および `files` ブロックのフィルタリング)
- [x] README などの使用ガイドの更新、スクリーンショットの追加
- [x] エラーハンドリングの強化 (例: `openspec/` が見つからない場合の案内など)
- [x] ライセンスの確定 (GPL-3.0-or-later。`LICENSE` および `LICENSE-NOTICE.md` を参照)

**完了基準 (Definition of Done)**: パブリッシュ可能な npm パッケージとしてローカルで正常に起動すること。なお、配布手段は npm 以外にも拡張されています（自動リリースビルド ＋ GitHub Releases パイプラインについては `.github/workflows/release.yml`, `scripts/release-*.mjs`, `docs/release.md` を、Electron パッケージングについては `npm run electron:package:*` を参照）。
