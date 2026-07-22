(() => {
  "use strict";

  const dataNode = document.getElementById("portal-data");
  const main = document.getElementById("portal-main");
  const context = document.getElementById("page-context");
  const sidebar = document.getElementById("portal-sidebar");
  const menuButton = document.getElementById("menu-button");
  const scrim = document.getElementById("scrim");
  const themeToggle = document.getElementById("theme-toggle");
  const themeStorageKey = "bkwatch-theme";

  function syncThemeToggle() {
    if (!themeToggle) return;
    const darkMode = document.documentElement.dataset.theme === "dark";
    themeToggle.setAttribute("aria-checked", String(darkMode));
    themeToggle.title = darkMode ? "Switch to light mode" : "Switch to dark mode";
  }

  function setTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Device preference is optional and never stores portal credentials.
    }
    syncThemeToggle();
  }

  themeToggle?.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  syncThemeToggle();

  if (!dataNode || !main) return;

  let data;
  try {
    data = JSON.parse(dataNode.textContent);
  } catch {
    main.innerHTML = '<section class="card"><h1>Workspace unavailable</h1><p>The client-safe content manifest could not be loaded. No data was displayed.</p></section>';
    return;
  }

  const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  const e = escapeHtml;
  const route = data.client.route;
  const source = (value) => `<small class="source">Source: ${e(value)}</small>`;
  const pageHead = (eyebrow, title, description, actions = "") => `<header class="page-head"><div><p class="eyebrow">${e(eyebrow)}</p><h1>${e(title)}</h1><p>${e(description)}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</header>`;
  const routeLink = (href, label, className = "") => `<a class="${className}" data-route href="${e(href)}">${e(label)}</a>`;

  const stateLabel = {
    confirmed: "Confirmed",
    locked: "Locked",
    derived: "Sourced count",
    ready: "Ready",
    "not-started": "Not started",
    current: "Current",
    "awaiting-approval": "Awaiting approval",
    "needs-confirmation": "Needs confirmation",
  };

  const statusLabel = {
    active: ["status-active", "Active / Confirmed"],
    partial: ["status-partial", "Partial / In Progress"],
    not: ["status-not", "Not In Use"],
    unknown: ["status-unknown", "Needs Confirmation"],
  };

  function metricCard(metric) {
    return `<article class="metric-card"><span class="metric-state">${e(stateLabel[metric.state] || metric.state)}</span><strong class="metric-value">${e(metric.value)}</strong><span class="metric-unit">${e(metric.unit)}</span><span class="metric-label">${e(metric.label)} · as of ${e(metric.asOf)}</span>${source(metric.source)}</article>`;
  }

  function timeline(items) {
    return `<ol class="timeline">${items.map((item) => `<li class="${e(item.state)}"><strong>${e(item.title)}</strong><span>${e(item.detail)}</span></li>`).join("")}</ol>`;
  }

  function list(items, className = "fact-list") {
    return `<ul class="${className}">${items.map((item) => `<li>${e(item)}</li>`).join("")}</ul>`;
  }

  function status(kind) {
    const config = statusLabel[kind] || statusLabel.unknown;
    return `<span class="status ${config[0]}">${config[1]}</span>`;
  }

  function productCard(product) {
    return `<a class="product-card" data-route href="${route}/products/${e(product.slug)}"><div class="card-index"><span>${e(product.category)}</span><span aria-hidden="true">↗</span></div><h2>${e(product.name)}</h2><p>${e(product.businessValue)}</p><div class="card-footer"><span>${e(product.status)}</span><span>View record →</span></div></a>`;
  }

  function ideaCard(idea) {
    const recommended = idea.number === "FINAL" ? " recommended" : "";
    return `<a class="idea-card${recommended}" data-route href="${route}/films/${e(data.film.slug)}/ideas/${e(idea.slug)}"><div class="card-index"><span>Direction ${e(idea.number)}</span><span>${e(idea.status)}</span></div><h3>${e(idea.title)}</h3><p>${e(idea.concept)}</p><div class="idea-meta"><span>${e(idea.runtime)}</span><span>${e(idea.sceneCount)} scenes</span><span>0 generated frames</span></div><div class="card-footer"><span>${e(idea.recommendation)}</span><span>Present →</span></div></a>`;
  }

  function renderHome() {
    context.textContent = "Overview";
    const hero = `<section class="hero-panel"><p class="eyebrow">Relationship mission / Third i</p><h2>Turn bkWatch's operational authority into clear, approved product proof.</h2><p>Third i can support the relationship from sourced strategy and acquisition systems through film, web, analytics, communications, and workflow automation—while preserving bkWatch's credibility, privacy boundaries, and human approval gates.</p><div class="hero-flags"><span><strong>Current focus</strong> Final Demo approval</span><span><strong>Client system</strong> Rules-based automation baseline</span><span><strong>Next gate</strong> UI assets + keyframes</span></div></section>`;

    const stats = `<section class="section"><div class="section-head"><div><h2>Operational and creative statistics</h2><p>Every number includes its state, date, and source. Unavailable baselines remain unavailable.</p></div></div><div class="grid-4">${data.metrics.map(metricCard).join("")}</div></section>`;

    const brand = `<section class="section"><div class="section-head"><div><h2>Brand and market posture</h2><p>Confirmed identity and evidence-based communication direction.</p></div></div><div class="split-card"><div><p class="eyebrow">Brand foundation</p><h2>${e(data.brand.mission)}</h2><div class="grid-2"><div class="card"><h3>Audience</h3><p>${e(data.brand.audience)}</p></div><div class="card"><h3>Voice</h3><p>${e(data.brand.voice)}</p></div></div><div class="section"><h3>Differentiators</h3>${list(data.brand.differentiators)}</div>${source(data.brand.source)}</div><div><h3>How bkWatch prefers to communicate</h3><p>${e(data.brand.communication.confirmed)}</p><h3 class="section">Current acquisition</h3><p>${e(data.brand.communication.currentAcquisition)}</p><h3 class="section">Recommended acquisition</h3><p>${e(data.brand.communication.recommendedAcquisition)}</p></div></div></section>`;

    const products = `<section class="section"><div class="section-head"><div><h2>Product and integration surfaces</h2><p>Confirmed capabilities remain separate from roadmap and opportunities.</p></div>${routeLink(`${route}/products`, "View all products")}</div><div class="grid-3">${data.products.slice(0, 3).map(productCard).join("")}</div></section>`;

    const work = `<section class="section"><div class="section-head"><div><h2>Current work and approval health</h2><p>Film 1 is fully inspectable at the storyboard level; media has not started.</p></div>${routeLink(`${route}/current-work`, "Open work area")}</div><div class="grid-2"><article class="card card-accent"><h3>${e(data.film.name)}</h3><p>${e(data.film.objective)}</p><div class="card-footer"><span>${e(data.film.phase)}</span>${routeLink(`${route}/films/${data.film.slug}`, "Open film →")}</div></article><article class="card"><h3>Next milestone</h3><p>${e(data.currentWork.milestone)}</p>${source(data.currentWork.source)}</article></div></section>`;

    main.innerHTML = pageHead("Client operations", "bkWatch workspace", "A sourced operating view of brand, products, Film 1, approvals, and practical AI opportunities.") + hero + stats + brand + products + work;
  }

  function renderProducts() {
    context.textContent = "Products";
    main.innerHTML = pageHead("Capability map", "Products and integration", "Each record separates confirmed facts, current state, open decisions, and Third i opportunities.") + `<section class="grid-3">${data.products.map(productCard).join("")}</section>`;
  }

  function renderProduct(product) {
    context.textContent = product.name;
    const actions = routeLink(`${route}/products`, "← All products", "button-secondary");
    main.innerHTML = pageHead(product.category, product.name, product.mission, actions) +
      `<section class="split-card"><div><p class="eyebrow">Business value</p><h2>${e(product.businessValue)}</h2><div class="section"><h3>Confirmed facts and audience</h3><p>${e(product.audience)}</p>${list(product.facts)}${source(product.source)}</div></div><div><h3>Current state</h3><p>${e(product.state)}</p><div class="section">${timeline(product.timeline)}</div></div></section>` +
      `<section class="section grid-2"><article class="card"><h3>Decisions and blockers</h3>${list(product.decisions, "decision-list")}</article><article class="card card-accent"><h3>Tailored Third i opportunities</h3>${list(product.opportunities)}<p class="section unknown">Opportunities are proposals, not claims of current client adoption.</p></article></section>`;
  }

  function renderFilm() {
    context.textContent = "Film 1";
    const film = data.film;
    const hero = `<section class="film-hero"><div><p class="eyebrow">Film project / current state</p><h1>${e(film.displayName)}</h1><p>${e(film.objective)}</p><div class="film-kpis"><div><strong>${e(film.runtime)}</strong><span>Runtime</span></div><div><strong>${e(film.ideas.length)}</strong><span>Directions</span></div><div><strong>${e(film.sceneCount)}</strong><span>Scene presentations</span></div><div><strong>${e(film.approvedMedia)}</strong><span>Generated media</span></div></div></div><div class="film-side">${status("partial")}<h2>${e(film.phase)}</h2><p>${e(film.approval)}</p></div></section>`;
    const playable = `<section class="section"><div class="section-head"><div><h2>Playable work</h2><p>Presented before the scene breakdown when approved media exists.</p></div></div><div class="media-empty"><span class="media-icon" aria-hidden="true">▶</span><strong>No current animatic, rough cut, or final video</strong><p>Media generation has not started. The next milestone is Final Demo plan, wording, asset, and keyframe approval.</p></div></section>`;
    const overview = `<section class="section split-card"><div><p class="eyebrow">Creative thesis</p><h2>${e(film.creativeThesis)}</h2><h3 class="section">Audience</h3><p>${e(film.audience)}</p><h3 class="section">Core message</h3><p>${e(film.coreMessage)}</p>${source(film.source)}</div><div><h3>Milestone timeline</h3>${timeline(film.timeline)}</div></section>`;
    const script = `<section class="section"><div class="section-head"><div><h2>Locked voiceover</h2><p>Exact 45-word Film 1 script. Copy changes require Justin approval.</p></div></div><div class="script-block"><blockquote>“${e(film.script)}”</blockquote>${source(film.scriptSource)}</div></section>`;
    const ideas = `<section class="section"><div class="section-head"><div><h2>Complete idea slate</h2><p>Select any direction for its full scene-by-scene presentation.</p></div></div><div class="recommendation"><strong>Creative recommendation — Third i guidance</strong>${e(film.recommendation)}</div><div class="idea-grid section">${film.ideas.map(ideaCard).join("")}</div></section>`;
    const compare = `<section class="section"><div class="section-head"><div><h2>Idea comparison</h2><p>Confirmed production attributes; formal scoring is awaiting client review.</p></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Direction</th><th>Message clarity / strength</th><th>Emotional impact</th><th>Production complexity</th><th>Distinctiveness</th><th>Current guidance</th></tr></thead><tbody>${film.ideas.map((idea) => `<tr><td><strong>${e(idea.number)} · ${e(idea.title)}</strong></td><td>${e(idea.strength)}</td><td>${e(idea.number === "FINAL" ? "Controlled power" : idea.number === "06" ? "Protected attention" : idea.number === "04" ? "Controlled confidence" : "Needs scored review")}</td><td>${e(idea.complexity)}</td><td>${e(idea.distinctiveness)}</td><td>${e(idea.recommendation)}</td></tr>`).join("")}</tbody></table></div></section>`;
    const approvals = `<section class="section grid-2"><article class="card"><h3>Approval needs</h3>${list(film.approvals, "decision-list")}</article><article class="card card-accent"><h3>Related product system</h3><p>Film 1 is confirmed to support the Shaw Systems Spectrum integration story. No other product integration is inferred.</p><div class="card-footer"><span>Confirmed relationship</span>${routeLink(`${route}/products/spectrum-integration`, "View integration →")}</div></article></section>`;
    main.innerHTML = hero + playable + overview + script + ideas + compare + approvals;
  }

  function renderIdea(idea) {
    context.textContent = `Film 1 / ${idea.title}`;
    const ideas = data.film.ideas;
    const index = ideas.findIndex((entry) => entry.slug === idea.slug);
    const previous = ideas[(index - 1 + ideas.length) % ideas.length];
    const next = ideas[(index + 1) % ideas.length];
    const ideaBase = `${route}/films/${data.film.slug}/ideas`;
    const actions = routeLink(`${route}/films/${data.film.slug}`, "← Film overview", "button-secondary");
    const header = pageHead(`Direction ${idea.number} / ${idea.status}`, idea.title, idea.concept, actions);
    const controls = `<div class="presentation-bar" aria-label="Presentation controls">${routeLink(`${ideaBase}/${previous.slug}`, `← ${previous.number}`, "button-secondary")}<div class="scene-index">${idea.scenes.map((scene, sceneIndex) => `<a href="#scene-${e(scene.id)}" aria-label="Jump to scene ${sceneIndex + 1}">${sceneIndex + 1}</a>`).join("")}</div><span class="spacer"></span><button class="button-secondary" type="button" data-action="fullscreen">Full screen</button><button class="button-secondary" type="button" data-action="print">Print / PDF</button>${routeLink(`${ideaBase}/${next.slug}`, `${next.number} →`, "button-secondary")}</div>`;
    const overview = `<section class="split-card"><div><p class="eyebrow">Direction thesis</p><h2>${e(idea.strength)}</h2><p>${e(idea.concept)}</p><div class="idea-meta"><span>${e(idea.runtime)}</span><span>${e(idea.sceneCount)} scenes</span><span>${e(idea.distinctiveness)}</span><span>${e(idea.complexity)} production complexity</span></div></div><div><h3>Review state</h3><p>${e(idea.approval)}</p><h3 class="section">Demo state</h3><p>${e(idea.demoState)}</p><h3 class="section">Guidance</h3><p>${e(idea.recommendation)}</p></div></section>`;
    const playable = `<section class="section"><div class="media-empty"><span class="media-icon" aria-hidden="true">▣</span><strong>Hero still and playable demo not yet generated</strong><p>This is an intentional empty state. Planning and prompts are ready; D3 media begins only after the required approvals for this direction.</p></div></section>`;
    const scenes = idea.scenes.map((scene, sceneIndex) => `<article class="scene-card" id="scene-${e(scene.id)}"><div class="scene-media media-empty"><span class="media-icon" aria-hidden="true">${sceneIndex + 1}</span><strong>Scene ${sceneIndex + 1} media not yet generated</strong><p>Selected frame: unavailable · Approved alternatives: 0 · Production status: ${e(scene.status)}</p></div><div class="scene-copy"><div class="scene-title-line"><div><p>Scene ${sceneIndex + 1} · ${e(scene.id)}</p><h2>${e(scene.title)}</h2></div><span class="scene-timing">${e(scene.time)} · ${e(scene.duration || "5 seconds")}</span></div><div class="scene-details"><div class="storyboard-copy"><h3>Storyboard and visual / camera / action direction</h3><p>${e(scene.description)} ${e(scene.direction)}</p></div><div class="scene-facts"><div class="scene-fact"><span>Transition</span><strong>${e(scene.transition)}</strong></div><div class="scene-fact"><span>Product / message purpose</span><strong>${e(scene.purpose)}</strong></div><div class="scene-fact"><span>Production status</span><strong>${e(scene.status)}</strong></div></div></div><div class="voiceover"><h3>Exact voiceover for this scene</h3><blockquote>“${e(scene.script)}”</blockquote></div></div></article>`).join("");
    main.innerHTML = header + controls + overview + playable + `<section class="section"><div class="section-head"><div><h2>Scene-by-scene presentation</h2><p>Story order is complete. Media, direction, and exact voiceover remain together for inspection.</p></div></div>${scenes}${source(data.film.source)}</section>`;
  }

  function renderAiMatrix() {
    context.textContent = "AI matrix";
    const categories = [...new Set(data.aiCapabilities.map((item) => item.category))];
    const legend = `<div class="page-actions">${status("active")}${status("partial")}${status("not")}${status("unknown")}</div>`;
    const sections = categories.map((category) => `<section class="section"><div class="section-head"><div><h2>${e(category)}</h2><p>Client adoption status remains distinct from Third i opportunity guidance.</p></div></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Capability</th><th>Status</th><th>Evidence and interpretation</th><th>Provenance</th></tr></thead><tbody>${data.aiCapabilities.filter((item) => item.category === category).map((item) => `<tr><td><strong>${e(item.name)}</strong></td><td>${status(item.status)}</td><td>${e(item.detail)}</td><td>${source(item.source)}</td></tr>`).join("")}</tbody></table></div></section>`).join("");
    main.innerHTML = pageHead("Practical capability map", "AI Capability Matrix", "A categorized audit across operations, acquisition, service, analytics, compliance, film, web, communications, and workflow automation. Color is always paired with icon and text.", legend) + `<div class="recommendation"><strong>Current adoption baseline</strong>None-to-little generative AI use is confirmed. Current product workflows are primarily strict API calls, predefined rules, custom scrapers, and regex parsing.</div>` + sections;
  }

  function renderCurrentWork() {
    context.textContent = "Current work";
    const work = data.currentWork;
    main.innerHTML = pageHead("Demos and delivery", "Current work", work.summary, routeLink(`${route}/films/${data.film.slug}`, "Open Film 1", "button")) +
      `<section class="grid-4">${data.metrics.slice(4, 10).map(metricCard).join("")}</section>` +
      `<section class="section split-card"><div><p class="eyebrow">Next milestone</p><h2>${e(work.milestone)}</h2><h3 class="section">Prepared deliverables</h3>${list(work.deliverables)}${source(work.source)}</div><div><h3>Open blockers and approvals</h3>${list(work.blockers, "decision-list")}</div></section>` +
      `<section class="section"><div class="media-empty"><span class="media-icon" aria-hidden="true">▶</span><strong>No current client-review video is available</strong><p>${e(work.legacy)}</p></div></section>`;
  }

  function renderNotFound() {
    context.textContent = "Not found";
    main.innerHTML = pageHead("Workspace route", "This record is not available", "The requested client-safe view does not exist or has not been published.", routeLink(route, "Return to overview", "button"));
  }

  function closeMenu() {
    sidebar.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    scrim.hidden = true;
  }

  function currentPath() {
    return window.location.pathname.replace(/\/+$/, "") || route;
  }

  function render() {
    const path = currentPath();
    const productPrefix = `${route}/products/`;
    const ideaPrefix = `${route}/films/${data.film.slug}/ideas/`;
    const isFilm1Route = path === `${route}/films/${data.film.slug}` || path === `${route}/films` || path.startsWith(ideaPrefix);
    main.dataset.pageSpacing = isFilm1Route ? "film1" : "compact";

    if (path === route) renderHome();
    else if (path === `${route}/products`) renderProducts();
    else if (path.startsWith(productPrefix)) {
      const product = data.products.find((item) => item.slug === path.slice(productPrefix.length));
      product ? renderProduct(product) : renderNotFound();
    } else if (path === `${route}/films/${data.film.slug}` || path === `${route}/films`) renderFilm();
    else if (path.startsWith(ideaPrefix)) {
      const idea = data.film.ideas.find((item) => item.slug === path.slice(ideaPrefix.length));
      idea ? renderIdea(idea) : renderNotFound();
    } else if (path === `${route}/ai-capability-matrix`) renderAiMatrix();
    else if (path === `${route}/current-work`) renderCurrentWork();
    else renderNotFound();

    const section = path === route ? "home" : path.includes("/products") ? "products" : path.includes("/films") ? "films" : path.includes("/ai-capability") ? "ai" : path.includes("/current-work") ? "work" : "";
    document.querySelectorAll("[data-section]").forEach((link) => {
      if (link.dataset.section === section) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.title = `${context.textContent} | bkWatch Client Workspace`;
    closeMenu();
  }

  document.addEventListener("click", (event) => {
    const routeAnchor = event.target.closest("a[data-route]");
    if (routeAnchor && routeAnchor.origin === window.location.origin) {
      event.preventDefault();
      window.history.pushState({}, "", routeAnchor.href);
      render();
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "print") window.print();
    if (action === "fullscreen") {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    }
  });

  menuButton.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    scrim.hidden = !open;
  });
  scrim.addEventListener("click", closeMenu);
  window.addEventListener("popstate", render);
  window.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  render();
})();
