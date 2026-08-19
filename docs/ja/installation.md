# インストール

利用するOSとithynoの利用形態を選択してください。このページは選択内容をブラウザに保存し、
該当する手順だけを表示します。

<div class="install-selector" data-install-selector markdown>
  <label>
    OS
    <select data-install-choice="os">
      <option value="macos">macOS</option>
      <option value="windows">Windows</option>
      <option value="linux">Linux</option>
    </select>
  </label>

  <label>
    利用形態
    <select data-install-choice="surface">
      <option value="electron">Electronアプリ</option>
      <option value="vscode">VS Code拡張機能</option>
    </select>
  </label>

  <label data-install-option-for="electron">
    アーキテクチャ
    <select data-install-choice="arch">
      <option value="arm64">ARM64 / Apple Silicon</option>
      <option value="x64">x64 / Intel</option>
    </select>
  </label>

  <div data-install-panel data-os="macos" markdown>
## macOSの前提条件

- [Homebrew](https://brew.sh/)
- Git
- Node.js 20.19.0以降（新規インストールではNode.js 22 LTSを推奨）

現在インストールされているツールを確認します。

```sh
brew --version
git --version
node --version
```

Homebrewがない場合は、[Homebrew公式サイト](https://brew.sh/)からインストールします。
その後、不足している、または古いツールだけをインストールします。

```sh
brew install git
brew install node@22
```

新しいターミナルを開き、`git --version`と`node --version`をもう一度実行して確認します。

### 権限設定

ダウンロードしたアプリがmacOSによりブロックされる場合は、拡張属性を削除します。

```sh
xattr -cr /Applications/ithyno.app
```

このコマンドは、公式リリースページから取得したithynoアプリに対してのみ実行してください。
  </div>

  <div data-install-panel data-os="windows" markdown>
## Windowsの前提条件

- [Git for Windowsをダウンロード](https://git-scm.com/install/windows)
- [Node.jsをダウンロード](https://nodejs.org/en/download) — Node.js 20.19.0以降。
  新規インストールでは現在のLTS版を使用してください。

インストール後、新しいPowerShellを開いて両方のコマンドを確認します。

```powershell
git --version
node --version
```

### SmartScreenが表示された場合にインストーラーを実行する

まだ広く認識されていないインストーラーは、Microsoft Defender SmartScreenにより
停止されることがあります。SmartScreen自体は無効にしないでください。最初に
[ithyno公式Releasesページ](https://github.com/fluentdb-dev/ithyno/releases)から
ダウンロードしたファイルであることを確認し、次の手順で今回だけ実行を許可します。

1. SmartScreen画面の**詳細情報**を選択します。

<figure markdown="span">
  ![Microsoft Defender SmartScreenの最初の画面に、実行しないボタンと詳細情報リンクが表示される。](assets/images/win-install-1.png){ loading=lazy }
  <figcaption><strong>詳細情報</strong>を選択し、アプリ情報と追加の操作を表示します。</figcaption>
</figure>

2. アプリ欄がダウンロードしたithynoインストーラーのファイル名であることを確認し、
   **実行**を選択します。

<figure markdown="span">
  ![詳細情報を開くとithynoインストーラーのファイル名と実行ボタンが表示される。](assets/images/win-install-2.png){ loading=lazy }
  <figcaption>入手元とファイル名を確認できた場合に限り、<strong>実行</strong>を選択します。</figcaption>
</figure>

  </div>

  <div data-install-panel data-os="linux" markdown>
## Linuxの前提条件

- Git
- Node.js 20.19.0以降（新規インストールではNode.js 22 LTSを推奨）

ディストリビューションのpackage managerでGitをインストールします。

=== "Debian / Ubuntu"

    ```sh
    sudo apt update
    sudo apt install git curl
    ```

=== "Fedora / RHEL"

    ```sh
    sudo dnf install git curl
    ```

=== "Arch Linux"

    ```sh
    sudo pacman -S git curl
    ```

その他のディストリビューションは、
[Git公式のLinux向け手順](https://git-scm.com/install/linux)を参照してください。

[nvmの公式手順](https://github.com/nvm-sh/nvm#installing-and-updating)でユーザー単位に
Node.jsを管理できるようにし、ithynoの最小要件を満たすサポート対象版をインストールします。

```sh
nvm install 22
nvm alias default 22
node --version
```

### 権限とパッケージ

AppImageは通常、システム全体へのインストールを必要としません。起動時にFUSEエラーが
表示された場合は、sandboxやシステムのセキュリティを無効化せず、
[AppImage公式のFUSEトラブルシューティング](https://docs.appimage.org/user-guide/troubleshooting/fuse.html)から
利用しているディストリビューションの手順を確認してください。
  </div>

  <div data-install-panel data-os="macos" data-surface="electron" data-arch="arm64" markdown>
## macOS用Electron — Apple Silicon

[最新のApple Silicon用DMGをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-mac-arm64.dmg" }

DMGを開き、`ithyno.app`を`/Applications`へコピーします。
  </div>

  <div data-install-panel data-os="macos" data-surface="electron" data-arch="x64" markdown>
## macOS用Electron — Intel

[最新のIntel用DMGをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-mac-x64.dmg" }

DMGを開き、`ithyno.app`を`/Applications`へコピーします。
  </div>

  <div data-install-panel data-os="windows" data-surface="electron" data-arch="arm64" markdown>
## Windows用Electron — ARM64

[最新のARM64インストーラーをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-win-arm64-installer.exe" }

ダウンロードしたインストーラーを実行します。
  </div>

  <div data-install-panel data-os="windows" data-surface="electron" data-arch="x64" markdown>
## Windows用Electron — x64

[最新のx64インストーラーをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-win-x64-installer.exe" }

ダウンロードしたインストーラーを実行します。
  </div>

  <div data-install-panel data-os="linux" data-surface="electron" data-arch="arm64" markdown>
## Linux用Electron — ARM64

[最新のARM64 AppImageをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-linux-arm64.AppImage" }

AppImageへ実行権限を付与して起動します。

```sh
chmod +x ithyno-*-linux-arm64.AppImage
./ithyno-*-linux-arm64.AppImage
```
  </div>

  <div data-install-panel data-os="linux" data-surface="electron" data-arch="x64" markdown>
## Linux用Electron — x64

[最新のx86_64 AppImageをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-linux-x86_64.AppImage" }

AppImageへ実行権限を付与して起動します。

```sh
chmod +x ithyno-*-linux-x86_64.AppImage
./ithyno-*-linux-x86_64.AppImage
```
  </div>

  <div data-install-panel data-surface="vscode" markdown>
## VS Code拡張機能

1. [Visual Studio Code](https://code.visualstudio.com/)をインストールします。
2. [最新のVSIXをダウンロード](https://github.com/fluentdb-dev/ithyno/releases){ data-release-asset=".vsix" }します。
3. VS Codeで **Extensions: Install from VSIX…** を実行し、ファイルを選択します。

  </div>
</div>

## バージョンの根拠

上記のNode.js最小バージョンは、ithynoが固定しているOpenSpecバージョンの
`engines.node`要件に従います。OpenSpecを更新した場合は、このページも更新します。
