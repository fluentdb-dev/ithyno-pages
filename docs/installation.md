# Installation

Choose your operating system and how you want to use ithyno. The page keeps
your choices in this browser and shows only the relevant instructions.

<div class="install-selector" data-install-selector markdown>
  <label>
    Operating system
    <select data-install-choice="os">
      <option value="macos">macOS</option>
      <option value="windows">Windows</option>
      <option value="linux">Linux</option>
    </select>
  </label>

  <label>
    Product
    <select data-install-choice="surface">
      <option value="electron">Electron app</option>
      <option value="vscode">VS Code extension</option>
    </select>
  </label>

  <label data-install-option-for="electron">
    Architecture
    <select data-install-choice="arch">
      <option value="arm64">ARM64 / Apple silicon</option>
      <option value="x64">x64 / Intel</option>
    </select>
  </label>

  <div data-install-panel data-os="macos" markdown>
## macOS prerequisites

- [Homebrew](https://brew.sh/)
- Git
- Node.js 20.19.0 or later (Node.js 22 LTS recommended)

Check the tools already installed:

```sh
brew --version
git --version
node --version
```

If Homebrew is missing, install it from the
[official Homebrew site](https://brew.sh/). Then install only the missing or
outdated tools:

```sh
brew install git
brew install node@22
```

Open a new terminal and run `git --version` and `node --version` again to
confirm the commands are available.

### Permissions

If macOS blocks a downloaded application, clear its extended attributes:

```sh
xattr -cr /Applications/ithyno.app
```

Only run this command for an ithyno application you obtained from the official
release page.
  </div>

  <div data-install-panel data-os="windows" markdown>
## Windows prerequisites

- [Download Git for Windows](https://git-scm.com/install/windows)
- [Download Node.js](https://nodejs.org/en/download) — Node.js 20.19.0 or
  later; use a current LTS release for a new installation

After installation, open a new PowerShell window and verify both commands:

```powershell
git --version
node --version
```

### Permissions

!!! note "Installation guide scaffold"
    Document the tested Windows Security, SmartScreen, terminal, and automation
    permission steps here. Do not disable system-wide security controls.
  </div>

  <div data-install-panel data-os="linux" markdown>
## Linux prerequisites

- Git
- Node.js 20.19.0 or later (Node.js 22 LTS recommended)

Install Git with your distribution's package manager:

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

For other distributions, use the
[official Git for Linux instructions](https://git-scm.com/install/linux).

Install Node.js for your user with
[nvm](https://github.com/nvm-sh/nvm#installing-and-updating), then install a
supported version that satisfies ithyno's minimum:

```sh
nvm install 22
nvm alias default 22
node --version
```

### Permissions and packages

AppImage normally needs no system-wide installation. If startup reports a
FUSE error, follow the
[official AppImage FUSE troubleshooting guide](https://docs.appimage.org/user-guide/troubleshooting/fuse.html)
for your distribution rather than disabling the sandbox or system security.
  </div>

  <div data-install-panel data-os="macos" data-surface="electron" data-arch="arm64" markdown>
## Electron for macOS — Apple silicon

[Download the latest Apple silicon DMG](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-mac-arm64.dmg" }

Open the DMG and copy `ithyno.app` to `/Applications`.
  </div>

  <div data-install-panel data-os="macos" data-surface="electron" data-arch="x64" markdown>
## Electron for macOS — Intel

[Download the latest Intel DMG](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-mac-x64.dmg" }

Open the DMG and copy `ithyno.app` to `/Applications`.
  </div>

  <div data-install-panel data-os="windows" data-surface="electron" data-arch="arm64" markdown>
## Electron for Windows — ARM64

[Download the latest ARM64 installer](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-win-arm64-installer.exe" }

Run the downloaded installer.
  </div>

  <div data-install-panel data-os="windows" data-surface="electron" data-arch="x64" markdown>
## Electron for Windows — x64

[Download the latest x64 installer](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-win-x64-installer.exe" }

Run the downloaded installer.
  </div>

  <div data-install-panel data-os="linux" data-surface="electron" data-arch="arm64" markdown>
## Electron for Linux — ARM64

[Download the latest ARM64 AppImage](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-linux-arm64.AppImage" }

Make the AppImage executable, then run it:

```sh
chmod +x ithyno-*-linux-arm64.AppImage
./ithyno-*-linux-arm64.AppImage
```
  </div>

  <div data-install-panel data-os="linux" data-surface="electron" data-arch="x64" markdown>
## Electron for Linux — x64

[Download the latest x86_64 AppImage](https://github.com/fluentdb-dev/ithyno/releases){ .md-button .md-button--primary data-release-asset="-linux-x86_64.AppImage" }

Make the AppImage executable, then run it:

```sh
chmod +x ithyno-*-linux-x86_64.AppImage
./ithyno-*-linux-x86_64.AppImage
```
  </div>

  <div data-install-panel data-surface="vscode" markdown>
## VS Code extension

1. Install [Visual Studio Code](https://code.visualstudio.com/).
2. [Download the latest VSIX](https://github.com/fluentdb-dev/ithyno/releases){ data-release-asset=".vsix" }.
3. In VS Code, run **Extensions: Install from VSIX…** and select the file.

!!! note "Installation guide scaffold"
    Add Marketplace installation and first-launch verification here when they
    are available.
  </div>
</div>

## Version source

The Node.js minimum above follows the `engines.node` requirement of the
OpenSpec version pinned by ithyno. Update this page when that dependency is
upgraded.
