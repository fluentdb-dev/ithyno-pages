(() => {
  const STORAGE_KEY = "ithyno-docs-sidebar";
  const COLLAPSED = "collapsed";

  function isJapanese() {
    return document.documentElement.lang.toLowerCase().startsWith("ja");
  }

  function readPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY) === COLLAPSED;
    } catch {
      return false;
    }
  }

  function writePreference(collapsed) {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? COLLAPSED : "expanded");
    } catch {
      // The toggle still works for the current page when storage is disabled.
    }
  }

  function applyState(button, collapsed) {
    document.documentElement.dataset.ithynoSidebar = collapsed
      ? COLLAPSED
      : "expanded";
    button.textContent = collapsed ? "›" : "‹";
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute(
      "aria-label",
      isJapanese()
        ? collapsed
          ? "左メニューを開く"
          : "左メニューを閉じる"
        : collapsed
          ? "Open navigation"
          : "Close navigation",
    );
    button.title = button.getAttribute("aria-label");
  }

  function initialize() {
    let button = document.querySelector(".ithyno-sidebar-toggle");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "ithyno-sidebar-toggle";
      button.addEventListener("click", () => {
        const collapsed =
          document.documentElement.dataset.ithynoSidebar !== COLLAPSED;
        applyState(button, collapsed);
        writePreference(collapsed);
      });
      document.body.append(button);
    }

    applyState(button, readPreference());
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(initialize);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
