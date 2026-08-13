# リリースプロセス

このドキュメントでは、管理者が新しい ithyno のリリースを作成するために実行する手動ステップについて説明します。このワークフローは意図的に限定されており、ローカルでの再現可能なビルドと Git タグの設定のみを行います。タグがプッシュされると、CI で 3OS 向けの自動ビルドが走り、ビルドされたインストーラーアセットが添付された GitHub Release が自動作成されます。署名、公証、およびマーケットプレイスへの公開は、このワークフローの**対象外**です。詳細については、以下の[対象外](#out-of-scope)を参照してください。

## 管理者の手順

1. **バージョンのバンプ**: 管理している3つの `package.json` ファイル（`package.json`, `electron/package.json`, `vscode-extension/package.json`）のバージョンを更新します（`vscode-extension/host/package.json` は `prepack.mjs` によって再生成されるビルド成果物であるため、ここではバンプしません）。

   ```sh
   npm run release:version -- <next-version>
   # 例: npm run release:version -- 0.0.2-alpha.0
   ```

   スクリプトは引数を `semver.valid()` で検証し、有効な semver 2.0.0 でない場合はゼロ以外のコードで終了します。失敗した場合、ファイルは変更されません。

2. **`CHANGELOG.md` の更新**: `## [<next-version>] - YYYY-MM-DD` セクションを追加し、このリリースでの変更点をまとめます。

3. **リリースビルドの実行**:

   ```sh
   npm run release:build
   ```

   このコマンドは、以下の順序で実行されます：
   - `npm run typecheck`
   - `npm test`
   - `npm run build` (ウェブ)
   - `npm run --workspace ithyno-electron build` (Electron シェルの TypeScript コンパイル)
   - `npm run --workspace ithyno-vscode package` → `vscode-extension/ithyno-<version>.vsix`
   - `npm run --workspace ithyno-electron package:<platform>` → `electron/dist/ithyno-<version>-<arch>.<ext>`
   - `node scripts/verify-bundle.mjs` — バンドル形状の確認および `templates/.claude/` に対するバイト比較
   - `node scripts/release-summary.mjs` — 生成されたアセット（パスとサイズ）の概要を出力

   いずれかのステップがゼロ以外のコードで終了した場合、処理は即座に終了します（fail-fast）。`verify-bundle` の段階で失敗した場合、サマリーの出力前に中断されます。ビルド全体を実行せずに検証部分のみをイテレーションしたい場合は、個別に `npm run release:verify-bundle` を実行できます。

4. **生成されたアセットの動作確認 (Smoke-test)**:
   - インストーラー（DMG / NSIS / AppImage）から Electron アプリをインストールして起動します。
   - VS Code に VSIX をインストール（`Extensions: Install from VSIX…`）し、ダッシュボードを開きます。
   - 表示されるバージョンがリリースバージョンと一致していることを確認します。

5. **Git タグの作成**:

   ```sh
   git tag v<version>
   git push origin v<version>
   ```

   `v<version>` タグをプッシュすると、自動的に `.github/workflows/release.yml` がトリガーされ、以下の処理が実行されます：
   - `package.json` のバージョンがタグ名と一致しているかを検証します（一致しない場合はエラーになります）。
   - macOS、Windows、Linux の各プラットフォーム向けに並列で `release:build` を実行します。
   - 変更のプッシュをトリガーとした `publish` ジョブが走り、`softprops/action-gh-release@v2` を使って `.vsix`, `.dmg`, `.exe`, `.AppImage` アセットを添付した GitHub Release を自動的に作成します。

   ブランチのプッシュ（`main` を含む）ではこのワークフローはトリガーされません。タグのプッシュのみが公式ビルドのトリガーとなるため、同じコミットが二度ビルドされることはありません。

## 対象外 {: #out-of-scope }

以下の項目は、このワークフローでは**処理されません**。今後の課題として追跡されています：

| トピック | 備考 |
|---|---|
| コード署名 (macOS / Windows) | Apple Developer / EV 証明書と、安全なシークレット情報の保管場所が必要です。 |
| 公証 (macOS) | 公証権限を持つ Apple ID と Xcode ツールが必要です。 |
| VS Code Marketplace への公開 | パブリッシャーアカウントの個人アクセストークン（`VSCE_PAT`）が必要です。 |
| npm レジストリへの公開 | npm アクセストークンと、パッケージスコープの決定が必要です。 |
| 自動アップデートの実装 | 署名付きアップデートマニフェストと、配布用のサーバー（S3、GitHub Releases など）が必要です。 |

これらの課題が実装されたら、このドキュメントを更新して新しい手順を反映し、対応する項目を「対象外」テーブルから移動してください。
