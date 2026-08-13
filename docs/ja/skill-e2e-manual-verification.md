# 手動検証: `/ithy-opsx:*` スキルのエンドツーエンド検証

`scripts/skill-e2e.mjs` は **構造的なカバレッジのみ** を検証します（ファイルの配置状況、コマンド定義の読み込み、およびサーバーが 4321 ポートで正常に起動するかどうかなど）。
各スキルが Claude Code から起動された際に正しく機能するかどうかという「セマンティックな検証」は、手動で行う必要があります。

**テスト対象: Electron アプリ（.app）または VS Code 拡張機能**（CLI ではありません）。実際のユーザーは `bin/ithyno` を直接実行するのではなく、パッケージ化された Electron アプリや VSIX ファイルをインストールして使用します。そのため、手動検証はパッケージング、プリロード、IPC、オンボーディング UI などの境界部分におけるバグをスキルの挙動と合わせて検出できるよう、実際の利用形態に即した環境で実行します。

これは、過去の検証ラウンド `verify-dispatch-e2e-N`（ラウンド 1〜6、`openspec/changes/archive/` にアーカイブ済み）で用いられたパターンを踏襲しています。

## 実行するタイミング

- リリース前（Electron のビルド、および VSIX パッケージの作成時）。
- `.claude/commands/ithy-opsx/*.md` または `.claude/skills/ithy-opsx-*/SKILL.md`（開発用コピー）に変更を加えた後。
- Electron のメインプロセス、プリロードサンドボックス、VS Code 拡張機能、オンボーディングウィンドウ、または初期化（Init）エンドポイントに変更を加えた後。
- サーバー側の `/api/changes/:id/{phase,needs-human,needs-human/answer}` または `/api/init` に変更を加えた後。

## 2つの検証パス

リリース前に **両方のパス** を実行してください：

- **パス A — Electron アプリ**（macOS を優先とし、Windows / Linux でも適宜確認）
- **パス B — VS Code 拡張機能**（VS Code に VSIX をインストール）

構造的にはどちらも同じサーバーとスキルを呼び出しますが、オンボーディング UI、PTY のインターフェース、およびパッケージングの境界がそれぞれ異なります。

## パス A — Electron アプリ

### A1. ビルドと起動

```bash
cd /path/to/openspec-ui
npm run electron:package:mac    # または :win / :linux
# 出力: electron/dist/mac-*/ithyno.app (または .exe / .AppImage)
```

`electron/dist/` から `.app`（または各OSのアプリ）を起動します。初回起動時には、新規プロジェクト作成（New Project）画面が開きます。

### A2. オンボーディング (パス A)

1. **Doctor 診断** — Doctor パネルがエージェント CLI（claude / codex / copilot / …）のステータスを確認します。少なくとも1つのエージェントがインストール済みで緑色（正常）である必要があります。ここで失敗する場合は、Doctor またはインストール手順自体に不具合があります（`add-doctor-and-installer` のスコープに起因）。
2. **Manager の選択** — インストールされている CLI のラジオグループから選択します。このテストランでは `Claude` を選択します。
3. **ターゲットディレクトリの選択** — 「Browse」をクリックし、`$HOME/Documents` 配下に新しく作成した空のディレクトリを選択します（例: `~/Documents/ithyno-verify-2026-07-27`）。
4. **初期化の確認** — 「Create」をクリックします。以下の挙動を確認します：
   - 成功のトースト通知が表示されること。
   - ウィンドウがメインダッシュボード画面に遷移すること。
   - ターゲットディレクトリ内に `~/Documents/ithyno-verify-<date>/.claude/commands/{opsx,ithy-opsx}/` が作成されていること（Finder 等で確認）。
   - ターゲット内に `openspec/` ディレクトリが存在すること。
   - ターゲット内に `agents.yaml` が作成され、マネージャーとして `claude` が設定されていること。

**失敗パターン:** Doctor パネルで進行が止まる、マネージャーの選択肢が表示されない、Browse ボタンを押してもネイティブのディレクトリ選択ダイアログが開かない、初期化完了が表示されるがファイル群が作成されていない、初期化後のダッシュボード読み込みで 500 エラーが発生する。

### A3. マネージャー PTY

オンボーディング完了後、メインダッシュボードが開きます。左ナビゲーションの下部またはヘッダーにある **Terminal** タブをクリックします。

マネージャーの PTY が自動起動し、`claude` のプロンプトが表示されるはずです。これがマネージャーエージェントです。すべての `/ithy-opsx:*` スキルはここから入力されて実行されます。

**失敗パターン:** Terminal タブが空のまま、PTY プロセスは起動したが `claude` が開始されない、PTY のカレントディレクトリから `.claude/commands/ithy-opsx/` が見えているがスラッシュコマンドが認識されない（PTY の起動ディレクトリがターゲットルートではなく、Electron のインストール先など間違ったパスになっていることを示します）。

### A4. スキルごとの確認 (マネージャー PTY)

各スキルについて、Terminal タブにコマンドを入力し、ダッシュボードの各タブ（Kanban / Change Detail / Docs）およびターゲットのファイルシステムへの反映結果を観察します。

検証する11個のスキルはパス B と共通です。詳細は後述の **スキル検証チェックリスト** を参照してください。

## パス B — VS Code 拡張機能

### B1. パッケージングとインストール

```bash
cd /path/to/openspec-ui
npm run --workspace vscode-extension package
# 出力: vscode-extension/ithyno-vscode-*.vsix
```

VS Code へのインストール: `Extensions` → `…` → `Install from VSIX…` から生成された `.vsix` を選択します。インストール後、VS Code をリロードします。

### B2. オンボーディング (パス B)

1. コマンドパレット（`Cmd+Shift+P`） → `openspec-ui: New Project` を実行。
2. Electron と同様の3ステップを進めます（Doctor 診断 → マネージャー選択 → ターゲットディレクトリ指定）。
3. ダッシュボードが VS Code のウェブビューパネルとして開きます。

**失敗パターン（パス固有）:** コマンドが登録されていない（VSIX のビルド不具合）、ウェブビューが真っ白になる、または CSP エラーが表示される（`add-preload-sandbox-import-guard` 関連のデグレード）、ネイティブのディレクトリ選択ダイアログが開かない（VS Code のバージョンによって Electron のシェル API が異なるため）。

### B3. マネージャー PTY

VS Code 独自のターミナルパネルが開き、マネージャーの Claude PTY が起動します。これは `add-vscode-dashboard-terminal-autostart` に従って自動起動するはずです。

**失敗パターン:** 自動起動しない（自動起動処理のバグ）、PTY が間違ったディレクトリで開いている、PTY が VS Code の外（システムターミナル）で起動してしまう。

### B4. スキルごとの確認

パス A と同様の11個のスキルについて、以下のチェックリストに沿って検証します。

## スキル検証チェックリスト (A + B 共通)

11個の各 `/ithy-opsx:*` スキルについて、以下の手順で実行します：
1. 事前状態を準備します（Kanban から「+ New Change」で作成するか、各項目に記載の通り）。
2. マネージャー PTY にスラッシュコマンドを入力します。
3. ダッシュボードの UI とターゲットファイルシステムの結果を観察します。
4. 結果をテンプレートに従って記録（`v` または `x`）します。

### 1. `/ithy-opsx:apply <change-id>`

**事前準備:** Kanban → 「+ New Change」 → 名前を `smoke-apply` に設定。ダッシュボードにより `openspec/changes/smoke-apply/` の下に proposal/tasks/spec が生成されます。Docs タブから `tasks.md` を編集し、未チェックのタスクを1つ残します（例: `- [ ] Add docs/note.md with the text 'smoke test'`）。

**入力:** `/ithy-opsx:apply smoke-apply`

**期待される挙動:**
- ターミナル上で Claude がファイルを読み込み、Edit / Bash ツールを呼び出す様子が表示されます（対話モードでの承認UIが表示されたら、すべて承認します）。
- 最後に「commit OK?」とプロンプトが表示されるので、承認します。
- Kanban 上の `smoke-apply` カードに緑色のチェックマークが表示される（またはレーンが移動する）こと。
- Docs タブで `tasks.md` のチェックボックスが `[x]` に更新されること。
- ファイルシステムにおいて、ターゲット内に `docs/note.md` が作成されること。
- ターゲットの Git ログに、新しく `impl: smoke-apply` コマンドによるコミットが追加されていること。

**失敗パターン:** 反応がなく何も実行されない、コミットの確認プロンプトが表示されない、間違ったブランチに変更が適用される。

### 2. `/ithy-opsx:review <change-id>`

**事前準備:** apply 実行後の状態（変更が `agent/smoke-apply` ブランチまたは現在のブランチにコミットされている状態）。

**入力:** `/ithy-opsx:review smoke-apply`

**期待される挙動:**
- `openspec/changes/smoke-apply/review.md` が生成されること。
- ダッシュボードの Change Detail タブにレビューの判定結果が表示されること。
- フロントマターが正常であること（`verdict: pass|needs-rework`, `summary`, `findings` が含まれていること）。

**失敗パターン:** 成果物ファイルが生成されない、フロントマターのフォーマットがおかしい。

### 3. `/ithy-opsx:verify <change-id>`

**事前準備:** review 実行時と同様。

**入力:** `/ithy-opsx:verify smoke-apply`

**期待される挙動:**
- ターミナル上で `npm test`、`npm run typecheck`、`npm run build` が順次実行されること。
- `review.md` が検証（verify）結果で上書きされること。
- Change Detail タブに更新された判定結果が反映されること。

**失敗パターン:** 途中で失敗したにもかかわらずすべてのコマンドが実行され続ける（fail-fast していない）、間違ったパスに成果物が作成される。

### 4. `/ithy-opsx:merge <change-id>`

**事前準備:** コミットが存在する `agent/smoke-apply` ブランチ（ワークツリーモードで apply を実行した場合は自動で作成されています）。

**入力:** `/ithy-opsx:merge smoke-apply`（または Kanban カード上の「Merge」ボタンをクリック）。

**期待される挙動:**
- ターゲットの `main` ブランチに対して `git merge --no-ff agent/smoke-apply` が実行されること。
- 作業ツリーが汚れている場合は、自動でスタッシュおよびポップ（stash & pop）が行われること。
- Kanban カードのレーンが移動し、「Archive」ボタンが表示されること。
- プロンプトで「Remove worktree + delete branch?」と聞かれたら承認すること。

**失敗パターン:** スタッシュが消失する、マージコミットが作成されない、プロンプトなしで勝手にクリーアップ処理が走る。

### 5. `/ithy-opsx:archive <change-id>` (または Kanban の Archive ボタン)

**事前準備:** マージ済みの状態で、かつ `outcome.md` が書き込まれていること（不足している場合はダッシュボードで警告されます）。

**入力:** `/ithy-opsx:archive smoke-apply` または「Archive」ボタンをクリック。

**期待される挙動:**
- コミットメッセージの確認プロンプトが表示されるので、承認すること。
- `openspec/changes/smoke-apply/` が `openspec/changes/archive/<date>-smoke-apply/` に移動すること。
- Kanban からカードが消えること。
- Docs タブでアーカイブディレクトリが表示されること。
- Git ログに `archive: smoke-apply` コマンドによるコミットが追加されること。

**失敗パターン:** バリデーションエラーによって処理がブロックされる（CLI の場合は `--no-validate` を指定して回避可能）、確認プロンプトが出ない、Kanban カードが残ったままになる。

### 6. `/ithy-opsx:revert <scope>`

**事前準備:** アーカイブされた変更が少なくとも1つ存在すること（ステップ 5 などで作成したもの）。

**入力:** `/ithy-opsx:revert smoke-apply`（アーカイブされた変更を対象に実行）。

**期待される挙動:**
- 対象の要件が曖昧な場合、ターミナルで確認のプロンプトが表示されること。
- 新しい `openspec/changes/revert-smoke-apply/` ディレクトリが生成され、proposal/tasks/spec-delta が作成されること。
- 現在のスペックに `PENDING` アノテーションが挿入されること。
- （Case alpha）アーカイブ済みのプロポーザルに対して `REVERTED` アノテーションが追加されること。
- Kanban に新しい revert 変更が表示されること。

**失敗パターン:** `PENDING` が挿入されない、想定外のアノテーション状態になる、バリデーションで落ちる。

### 7. `/ithy-opsx:import <target-path>`

**事前準備:** `openspec/` ディレクトリを含まない、テスト用の markdown やコードが置かれたディレクトリを別途作成します。

**入力:** `/ithy-opsx:import /path/to/other/project`

**期待される挙動:**
- ターミナル上に Task ツールの呼び出し（子エージェントの起動）が表示されること。
- 子エージェントがターゲットのファイルを読み込むこと。
- ターゲット内に `<target>/openspec/specs/` が作成され、最初のスペックの下書きが生成されること。
- ターゲット内に `openspec/GENERATED.md` というマーカーファイルが書き込まれること。
- ダッシュボードの Browse タブ（ある場合）に、インポートされたプロジェクトが表示されること。

**失敗パターン:** 子エージェントが起動しない、スペックが空のまま、`GENERATED.md` が生成されない。

### 8. `/ithy-opsx:escalate <change-id> "<question>"`

**事前準備:** `coded` または `reviewed` フェーズにある進行中の変更（ステップ1で作成したもの、または Kanban から作成したもの）。

**入力:** `/ithy-opsx:escalate smoke-apply "Should we skip step X?"`

**期待される挙動:**
- ターミナルに Bash ツールによるリクエスト（curl POST）が表示されるので、承認します。
- Kanban 上でカードが `needs-human` レーンに移動する（または警告の ⚠️ バッジが付与される）こと。
- `openspec/changes/smoke-apply/needs-human.md` が生成されること。
- Change Detail タブでエスカレーションの状態が表示されること。

**失敗パターン:** エスカレーション状態でないのに 409 エラーが出る、フェーズが切り替わらない、バッジが表示されない。

### 9. `/ithy-opsx:answer <change-id> "<answer>"`

**事前準備:** `needs-human` 状態にある変更（ステップ8で作成したもの）。

**入力:** `/ithy-opsx:answer smoke-apply "Yes, skip step X"`

**期待される挙動:**
- ターミナルに Bash ツールによる `.../needs-human/answer` への POST が表示されるので、承認します。
- 変更フェーズが元のフェーズ（`priorPhase`）に復帰すること。
- 回答内容が `needs-human.md` に追記されること。
- Kanban 上の警告バッジが消え、カードが元のレーンに戻ること。

**失敗パターン:** `needs-human` 状態でないのに 409 エラーが出る、元のフェーズに復帰しない。

### 10. `/ithy-opsx:dispatch <change-id>` (または Kanban の Start ボタン)

**事前準備:** `proposed` フェーズにある変更。`agents.yaml` でマネージャーおよび `code` ロールとして `claude` が登録されていること。

**入力:** `/ithy-opsx:dispatch smoke-apply` または Kanban カード上の「Start」をクリック。

**期待される挙動:**
- ターミナル上でワークツリーが作成され、ワーカーが起動されてフェーズが遷移（code → review → verify）する様子が表示されること。
- Kanban カードが WebSocket を経由してリアルタイムに次のフェーズへ進むこと。
- ターミナル（または agmsg で設定された tmux ペイン）で各ワーカーのログが表示されること。
- 最終的に `done` または `needs-human` フェーズに到達して終了すること。

**失敗パターン:** ワーカーが不正なプロンプトで起動する、レビューをスキップする、リワーク上限（`maxReworkRounds`）を超えてループし続ける、終了状態になってもエスカレーションされる。

### 11. `/ithy-opsx:dispatch-multi <id-1> <id-2> [<id-N>]`

**事前準備:** `proposed` フェーズにある変更が2つ以上あること。

**入力:** `/ithy-opsx:dispatch-multi smoke-a smoke-b`

**期待される挙動:**
- 両方の変更が同時に実行されること（最大 `maxParallel` の数まで並列実行されます）。
- ターミナル上で、変更ごとに並行してワーカーが動作する様子が表示されること。
- 片方の変更がエスカレーション（例: `MAX_ITERATIONS = 5` などで中断）されても、もう片方の実行は停止しないこと。

**失敗パターン:** 直列に実行される（一方の完了を待ってから次が始まる）、状態データが混ざりあって壊れる、片方がエラーになると全体が強制終了する。

## 報告用テンプレート

リリースの起票チケットに以下を貼り付けます：

```markdown
## Skill e2e manual verification — Path A (Electron) / Path B (VSCode)

Environment:
- OS: macOS 14.5 / Windows 11 / Ubuntu 22.04
- Node: 20.x
- Claude Code: X.Y.Z
- Ithyno: <commit sha>

| # | Skill | Path A | Path B | Note |
|---|---|---|---|---|
| 1 | apply | v | v | |
| 2 | review | v | v | |
| 3 | verify | v | v | |
| 4 | merge | v | v | |
| 5 | archive | v | v | --no-validate (pre-existing PENDING format) |
| 6 | revert | v | v | |
| 7 | import | v | v | Second target: /tmp/import-target |
| 8 | escalate | v | v | |
| 9 | answer | v | v | |
| 10 | dispatch | v | v | agents.yaml: claude + code, verify manager-fallback |
| 11 | dispatch-multi | v | v | 2 changes parallel |

Bugs found: <link to issues / PRs>
```

失敗した項目がある場合は、バグチケットを起票するか、既知の問題としてドキュメントに明記してリリースを進行します。

## 所要時間

| セットアップ | 各パスあたり約10分 (ビルド・パッケージング、オンボーディング) |
| スキル検証 | 3〜15分 (dispatch および dispatch-multi が最も長いです) |
| 両パス合計 | 約2〜3時間 |

ツールの挙動を理解しているメンテナンス担当者が集中して実行した場合の想定時間です。

## 関連ドキュメント

- **構造テスト:** `E2E=1 npm run e2e:skills` — スキルの自動配置およびサーバー起動確認。所要時間約15秒。
- **ファイル整合性テスト:** `npm test` — 開発用コピーとテンプレートの内容が一致しているかの検証。所要時間2秒以下。
- **バンドル形状検証:** `npm run release:verify-bundle` — パッケージングされたアセット内のファイル配置確認。所要時間約5秒。
- **過去の実行ログ:** `openspec/changes/archive/*-verify-dispatch-e2e-*` — 以前実行された手動テストの履歴です。
