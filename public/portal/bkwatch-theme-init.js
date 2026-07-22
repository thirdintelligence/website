(() => {
  "use strict";

  const storageKey = "bkwatch-theme";
  let theme = "light";

  try {
    if (window.localStorage.getItem(storageKey) === "dark") theme = "dark";
  } catch {
    // Theme persistence is optional; the protected session does not depend on browser storage.
  }

  document.documentElement.dataset.theme = theme;
})();
