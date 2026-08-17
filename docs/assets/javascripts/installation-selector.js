(() => {
  const STORAGE_KEY = "ithyno-installation-preferences";
  const RELEASES_URL = "https://github.com/fluentdb-dev/ithyno/releases";
  const RELEASES_API_URL =
    "https://api.github.com/repos/fluentdb-dev/ithyno/releases?per_page=10";
  let releaseAssetsPromise;

  function loadLatestReleaseAssets() {
    if (!releaseAssetsPromise) {
      releaseAssetsPromise = fetch(RELEASES_API_URL, {
        headers: { Accept: "application/vnd.github+json" },
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`GitHub Releases API returned ${response.status}`);
        }

        const releases = await response.json();
        const release = releases.find((candidate) => !candidate.draft);
        if (!release) {
          throw new Error("No published ithyno release was found");
        }
        return release.assets || [];
      });
    }
    return releaseAssetsPromise;
  }

  async function initializeDownloads(root) {
    const links = [...root.querySelectorAll("[data-release-asset]")];
    if (links.length === 0) return;

    links.forEach((link) => {
      link.href = RELEASES_URL;
    });

    try {
      const assets = await loadLatestReleaseAssets();
      links.forEach((link) => {
        const suffix = link.dataset.releaseAsset;
        const asset = assets.find((candidate) => candidate.name.endsWith(suffix));
        if (asset) {
          link.href = asset.browser_download_url;
          link.title = asset.name;
        }
      });
    } catch {
      // Keep the release-list fallback when GitHub cannot be reached.
    }
  }

  function loadPreferences() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function savePreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Storage may be disabled. The selector still works for this page view.
    }
  }

  function applySelection(root) {
    const preferences = Object.fromEntries(
      [...root.querySelectorAll("[data-install-choice]")].map((choice) => [
        choice.dataset.installChoice,
        choice.value,
      ]),
    );

    root.querySelectorAll("[data-install-panel]").forEach((panel) => {
      panel.hidden = !Object.entries(preferences).every(
        ([key, value]) => !panel.dataset[key] || panel.dataset[key] === value,
      );
    });

    root.querySelectorAll("[data-install-option-for]").forEach((option) => {
      option.hidden = option.dataset.installOptionFor !== preferences.surface;
    });

    savePreferences(preferences);
  }

  function initialize(root) {
    const preferences = loadPreferences();

    root.querySelectorAll("[data-install-choice]").forEach((choice) => {
      const savedValue = preferences[choice.dataset.installChoice];
      if ([...choice.options].some((option) => option.value === savedValue)) {
        choice.value = savedValue;
      }
      choice.addEventListener("change", () => applySelection(root));
    });

    applySelection(root);
    initializeDownloads(root);
  }

  function initializeAll() {
    document
      .querySelectorAll("[data-install-selector]")
      .forEach(initialize);
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(initializeAll);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAll);
  } else {
    initializeAll();
  }
})();
