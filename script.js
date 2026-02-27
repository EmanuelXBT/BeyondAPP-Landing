/* BeyondApp – Navegação, mapa, feed e dashboard */

(function () {
  "use strict";

  // ---------- Tema ----------
  const savedTheme = localStorage.getItem("beyondapp-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "light") document.body.classList.add("light");
  else if (savedTheme === "dark") document.body.classList.remove("light");
  else if (!prefersDark) document.body.classList.add("light");

  const toggleBtn = document.getElementById("toggle-dark");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light");
      toggleBtn.textContent = isLight ? "🌙" : "☀️";
      toggleBtn.setAttribute("aria-label", isLight ? "Ativar modo escuro" : "Ativar modo claro");
      localStorage.setItem("beyondapp-theme", isLight ? "light" : "dark");
    });
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Rolagem suave nos links da landing (Sobre, Funcionalidades, Acesso) ----------
  document.querySelectorAll("#view-landing .nav a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href").slice(1);
      const target = id ? document.getElementById(id) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ---------- Navegação entre views ----------
  const views = {
    landing: document.getElementById("view-landing"),
    consumer: document.getElementById("view-consumer"),
    merchant: document.getElementById("view-merchant"),
  };

  function showView(name) {
    if (!views[name]) return;
    Object.keys(views).forEach((key) => {
      views[key].classList.toggle("view-active", key === name);
    });
    if (name === "consumer") initConsumerView();
    if (name === "merchant") initMerchantView();
  }

  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => showView(el.getAttribute("data-goto")));
  });

  // ---------- Dados mock (simulam Google Places + mídias) ----------
  const MOCK_PLACES = [
    {
      id: "place-1",
      name: "Café do Centro",
      address: "Rua das Flores, 123 — Centro",
      lat: -23.5505,
      lng: -46.6333,
      category: "alimentacao",
      hours: "Seg–Sáb 8h–20h",
      placeId: "ChIJ0_something_1",
    },
    {
      id: "place-2",
      name: "Boutique Moda & Cia",
      address: "Av. Paulista, 500 — Bela Vista",
      lat: -23.5615,
      lng: -46.6559,
      category: "vestuario",
      hours: "Seg–Sex 10h–19h",
      placeId: "ChIJ0_something_2",
    },
    {
      id: "place-3",
      name: "Posto Shell",
      address: "Marginal Pinheiros, km 5",
      lat: -23.5489,
      lng: -46.6988,
      category: "postos",
      hours: "24h",
      placeId: "ChIJ0_something_3",
    },
    {
      id: "place-4",
      name: "Pizzaria Bella",
      address: "Rua Augusta, 2000",
      lat: -23.5555,
      lng: -46.6622,
      category: "alimentacao",
      hours: "Ter–Dom 18h–23h",
      placeId: "ChIJ0_something_4",
    },
  ];

  const MOCK_MEDIA = [
    { id: "m1", placeId: "place-1", type: "video", title: "Reels do Café", thumb: "https://picsum.photos/seed/cafe1/320/240" },
    { id: "m2", placeId: "place-1", type: "photo", title: "Ambiente", thumb: "https://picsum.photos/seed/cafe2/320/240" },
    { id: "m3", placeId: "place-2", type: "video", title: "Novidades", thumb: "https://picsum.photos/seed/mod1/320/240" },
    { id: "m4", placeId: "place-3", type: "photo", title: "Posto", thumb: "https://picsum.photos/seed/post1/320/240" },
    { id: "m5", placeId: "place-4", type: "video", title: "Pizza do dia", thumb: "https://picsum.photos/seed/pizza1/320/240" },
  ];

  let mapInstance = null;
  let mapMarkers = [];

  // ---------- Módulo Consumidor ----------
  function initConsumerView() {
    initMap();
    renderFeed();
    bindPlaceDetail();
    bindFilters();
    if (mapInstance) setTimeout(() => mapInstance.invalidateSize(), 100);
  }

  function initMap() {
    const container = document.getElementById("map");
    if (!container) return;
    if (mapInstance) {
      mapInstance.invalidateSize();
      return;
    }
    const center = [-23.5505, -46.6333];
    mapInstance = L.map(container).setView(center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(mapInstance);

    mapMarkers = MOCK_PLACES.map((p) => {
      const marker = L.marker([p.lat, p.lng]).addTo(mapInstance);
      marker.on("click", () => openPlaceDetail(p));
      marker._place = p;
      return marker;
    });
  }

  function renderFeed() {
    const container = document.getElementById("feed-container");
    if (!container) return;
    const category = document.getElementById("filter-category")?.value || "";
    const radiusSelect = document.getElementById("filter-radius");
    const radius = radiusSelect ? Number(radiusSelect.value) : 5;
    const filtered = MOCK_PLACES.filter((p) => !category || p.category === category);
    const placesById = Object.fromEntries(filtered.map((p) => [p.id, p]));
    let medias = MOCK_MEDIA.filter((m) => placesById[m.placeId]);
    if (medias.length === 0) medias = MOCK_MEDIA;

    container.innerHTML = medias
      .map((m) => {
          const place = MOCK_PLACES.find((p) => p.id === m.placeId) || MOCK_PLACES[0];
          return `
          <article class="feed-card" data-place-id="${place.id}" role="button" tabindex="0">
            <img class="feed-card-thumb" src="${m.thumb}" alt="" loading="lazy" />
            <div class="feed-card-body">
              <h3 class="feed-card-title">${place.name}</h3>
              <p class="feed-card-meta">${m.title}</p>
            </div>
          </article>`;
        }
      )
      .join("");

    container.querySelectorAll(".feed-card").forEach((card) => {
      const placeId = card.getAttribute("data-place-id");
      const place = MOCK_PLACES.find((p) => p.id === placeId);
      if (place) {
        card.addEventListener("click", () => openPlaceDetail(place));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPlaceDetail(place);
          }
        });
      }
    });
  }

  function bindFilters() {
    const cat = document.getElementById("filter-category");
    const rad = document.getElementById("filter-radius");
    [cat, rad].forEach((el) => {
      if (el) el.addEventListener("change", renderFeed);
    });
  }

  function openPlaceDetail(place) {
    const drawer = document.getElementById("place-detail");
    const content = document.getElementById("place-detail-content");
    const link = document.getElementById("place-detail-directions");
    if (!drawer || !content || !link) return;
    content.innerHTML = `
      <h3>${place.name}</h3>
      <p class="place-detail-address">${place.address}</p>
      <p class="place-detail-hours">${place.hours}</p>
    `;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`;
    link.href = url;
    drawer.classList.remove("hidden");
  }

  function bindPlaceDetail() {
    const closeBtn = document.querySelector(".place-detail-close");
    const drawer = document.getElementById("place-detail");
    if (closeBtn && drawer) closeBtn.addEventListener("click", () => drawer.classList.add("hidden"));
  }

  // ---------- Módulo Comerciante ----------
  function initMerchantView() {
    switchMerchantTab("onboarding");
    renderMediaGrid();
    renderMetrics();
    document.querySelectorAll(".merchant-nav-item").forEach((btn) => {
      btn.addEventListener("click", () => switchMerchantTab(btn.getAttribute("data-tab")));
    });
  }

  function switchMerchantTab(tabId) {
    document.querySelectorAll(".merchant-nav-item").forEach((el) => {
      el.classList.toggle("merchant-nav-item-active", el.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".merchant-tab").forEach((el) => {
      el.classList.toggle("merchant-tab-active", el.id === "tab-" + tabId);
    });
  }

  function renderMediaGrid() {
    const grid = document.getElementById("media-grid");
    if (!grid) return;
    grid.innerHTML = MOCK_MEDIA.map(
      (m) => `
      <div class="media-card" data-media-id="${m.id}">
        <img class="media-card-thumb" src="${m.thumb}" alt="" loading="lazy" />
        <div class="media-card-actions">
          <span class="media-card-status">Visível</span>
          <button type="button" class="media-card-hide">Ocultar</button>
        </div>
      </div>
    `
    ).join("");
    grid.querySelectorAll(".media-card-hide").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".media-card");
        if (card) {
          card.querySelector(".media-card-status").textContent = "Oculto";
          btn.textContent = "Exibir";
        }
      });
    });
  }

  function renderMetrics() {
    const viewsEl = document.getElementById("metric-views");
    const dirEl = document.getElementById("metric-directions");
    if (viewsEl) viewsEl.textContent = "1.247";
    if (dirEl) dirEl.textContent = "89";
  }

  // Simular conexão de redes (feedback visual)
  document.querySelectorAll(".btn-connect:not(:disabled)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = btn.textContent;
      if (label.includes("Instagram")) {
        btn.textContent = "Conectando…";
        setTimeout(() => { btn.textContent = "Conectar Instagram"; }, 1500);
      } else if (label.includes("TikTok")) {
        btn.textContent = "Conectando…";
        setTimeout(() => { btn.textContent = "Conectar TikTok"; }, 1500);
      }
    });
  });
})();
