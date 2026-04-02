(() => {
  const canvas = document.getElementById("particle-canvas");

  if (canvas) {
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, t = 0;
    const mx = { x: -9999, y: -9999 };

    /* ═══════ MORPHING GRADIENT BLOBS ═══════ */
    const blobs = [
      { x: 0.25, y: 0.3, r: 0.35, hue: 165, sat: 80, speed: 0.0003, phase: 0 },
      { x: 0.75, y: 0.6, r: 0.30, hue: 220, sat: 70, speed: 0.00025, phase: 2 },
      { x: 0.5,  y: 0.8, r: 0.28, hue: 270, sat: 60, speed: 0.00035, phase: 4 },
      { x: 0.3,  y: 0.7, r: 0.22, hue: 190, sat: 75, speed: 0.0004, phase: 1.5 },
      { x: 0.8,  y: 0.25, r: 0.25, hue: 250, sat: 65, speed: 0.0002, phase: 3 },
    ];

    function drawBlobs() {
      blobs.forEach(b => {
        const bx = (b.x + Math.sin(t * b.speed * 600 + b.phase) * 0.08) * W;
        const by = (b.y + Math.cos(t * b.speed * 500 + b.phase + 1) * 0.06) * H;
        const br = b.r * Math.min(W, H);

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, `hsla(${b.hue},${b.sat}%,50%,0.06)`);
        g.addColorStop(0.4, `hsla(${b.hue},${b.sat}%,40%,0.03)`);
        g.addColorStop(1, `hsla(${b.hue},${b.sat}%,30%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });
    }

    /* ═══════ FLOATING MESH NODES ═══════ */
    const NODE_COUNT = reduced ? 40 : 90;
    const CONNECT_DIST = 180;
    let nodes = [];

    function makeNode() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        hue: [165, 200, 240, 270][Math.floor(Math.random() * 4)],
        alpha: Math.random() * 0.3 + 0.15,
      };
    }

    function updateNodes() {
      nodes.forEach(n => {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
        }

        /* mouse attraction — gentle pull */
        if (mx.x > 0) {
          const dx = mx.x - n.x, dy = mx.y - n.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 250 && d > 1) {
            n.vx += (dx / d) * 0.012;
            n.vy += (dy / d) * 0.012;
          }
        }

        /* friction */
        n.vx *= 0.998;
        n.vy *= 0.998;

        /* wrap edges */
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      });
    }

    function drawMesh() {
      /* connections first */
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const alpha = (1 - d / CONNECT_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `hsla(200,60%,60%,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      /* mouse connections — brighter */
      if (mx.x > 0) {
        nodes.forEach(n => {
          const dx = mx.x - n.x, dy = mx.y - n.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 200) {
            const alpha = (1 - d / 200) * 0.25;
            ctx.beginPath();
            ctx.moveTo(mx.x, mx.y);
            ctx.lineTo(n.x, n.y);
            ctx.strokeStyle = `hsla(165,80%,65%,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      }

      /* draw nodes */
      nodes.forEach(n => {
        /* outer glow */
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 8);
        g.addColorStop(0, `hsla(${n.hue},70%,65%,${n.alpha * 0.3})`);
        g.addColorStop(1, `hsla(${n.hue},70%,65%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 8, 0, Math.PI * 2);
        ctx.fill();

        /* core */
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue},70%,75%,${n.alpha})`;
        ctx.fill();
      });
    }

    /* ═══════ SUBTLE GRID OVERLAY ═══════ */
    function drawGrid() {
      const spacing = 60;
      ctx.strokeStyle = "rgba(125,249,198,0.018)";
      ctx.lineWidth = 0.5;

      for (let x = 0; x < W; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      /* mouse glow on grid intersections */
      if (mx.x > 0) {
        const nearX = Math.round(mx.x / spacing) * spacing;
        const nearY = Math.round(mx.y / spacing) * spacing;
        for (let ox = -2; ox <= 2; ox++) {
          for (let oy = -2; oy <= 2; oy++) {
            const gx = nearX + ox * spacing;
            const gy = nearY + oy * spacing;
            const dx = gx - mx.x, dy = gy - mx.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < 180) {
              const alpha = (1 - d / 180) * 0.35;
              ctx.beginPath();
              ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(165,80%,65%,${alpha})`;
              ctx.fill();
            }
          }
        }
      }
    }

    /* ═══════ AMBIENT FLOATING PARTICLES ═══════ */
    const PARTICLE_COUNT = reduced ? 15 : 35;
    let particles = [];

    function makeParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vy: -(Math.random() * 0.15 + 0.05),
        size: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.2 + 0.05,
        hue: [165, 200, 250][Math.floor(Math.random() * 3)],
      };
    }

    function drawParticles() {
      particles.forEach(p => {
        if (!reduced) {
          p.y += p.vy;
          p.x += Math.sin(t * 0.5 + p.y * 0.005) * 0.15;
        }
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},60%,70%,${p.alpha})`;
        ctx.fill();
      });
    }

    /* ═══════ RESIZE & LOOP ═══════ */
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      nodes = Array.from({ length: NODE_COUNT }, () => makeNode());
      particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle());
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      if (!reduced) t += 0.016;

      drawBlobs();
      drawGrid();
      updateNodes();
      drawMesh();
      drawParticles();

      requestAnimationFrame(frame);
    }

    resize();
    frame();

    window.addEventListener("mousemove", e => { mx.x = e.clientX; mx.y = e.clientY; });
    window.addEventListener("mouseleave", () => { mx.x = -9999; mx.y = -9999; });
    window.addEventListener("resize", resize);
  }

  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("backToTop");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.querySelector(".nav-links");

  function updateScrollState() {
    const scrolled = window.scrollY > 24;
    navbar?.classList.toggle("scrolled", scrolled);
    backToTop?.classList.toggle("visible", window.scrollY > 420);
  }

  window.addEventListener("scroll", updateScrollState);
  updateScrollState();

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const fadeTargets = document.querySelectorAll(".section-heading, .glass-card, .metric-card, .scroll-cue");
  fadeTargets.forEach((element) => element.classList.add("fade-in"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  fadeTargets.forEach((element) => observer.observe(element));

  const sections = document.querySelectorAll("main section[id]");
  const navAnchors = document.querySelectorAll(".nav-links a");

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeId = `#${entry.target.id}`;
        navAnchors.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === activeId);
        });
      });
    },
    { threshold: 0.45 }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  const scoreObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".score-bar span").forEach((bar) => {
          const finalWidth = bar.style.width;
          bar.style.width = "0";
          requestAnimationFrame(() => {
            bar.style.transition = "width 900ms ease";
            bar.style.width = finalWidth;
          });
        });
        scoreObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll(".education-card").forEach((card) => scoreObserver.observe(card));

  const contactForm = document.getElementById("contactForm");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const mailSubject = encodeURIComponent(subject || "Portfolio inquiry");
    const mailBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

    window.location.href = `mailto:sandeep001sharma121@gmail.com?subject=${mailSubject}&body=${mailBody}`;
  });
})();

// ── Photo Upload ──
(() => {
  const wrap = document.getElementById('photoFrameWrap');
  const input = document.getElementById('photoInput');
  const img = document.getElementById('profilePhoto');
  const placeholder = document.getElementById('photoPlaceholder');
  const defaultPhoto = 'profile-photo.jpeg';

  if (!wrap) return;

  // Restore saved photo (only if user explicitly uploaded one)
  const saved = localStorage.getItem('ss_profile_photo');
  if (saved) {
    img.src = saved;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.src = defaultPhoto;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }

  img.addEventListener('error', () => {
    img.removeAttribute('src');
    img.style.display = 'none';
    placeholder.style.display = 'flex';
  });

  wrap.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
      img.style.display = 'block';
      placeholder.style.display = 'none';
      try { localStorage.setItem('ss_profile_photo', e.target.result); } catch (_) {}
    };
    reader.readAsDataURL(file);
  });
})();

// Interactive project previews
(() => {
  const modal = document.getElementById("projectModal");
  const title = document.getElementById("projectModalTitle");
  const subtitle = document.getElementById("projectModalSubtitle");
  const label = document.getElementById("projectModalLabel");
  const toolbar = document.getElementById("projectModalToolbar");
  const body = document.getElementById("projectModalBody");
  const closeButton = document.getElementById("projectModalClose");
  const previewButtons = document.querySelectorAll("[data-project-preview]");

  if (!modal || !title || !subtitle || !toolbar || !body || !previewButtons.length) return;

  const state = {
    projectId: null,
    activeView: null,
    fintrackCell: "Week 3 / Thursday",
    diabetesModel: "Random Forest",
    diabetesSegment: "Balanced glucose profile",
    airMetric: "PM2.5",
    airView: "Peak week",
  };

  const fintrackHeat = [
    ["Week 1 / Mon", 1], ["Week 1 / Tue", 3], ["Week 1 / Wed", 2], ["Week 1 / Thu", 4], ["Week 1 / Fri", 3], ["Week 1 / Sat", 2], ["Week 1 / Sun", 5],
    ["Week 2 / Mon", 2], ["Week 2 / Tue", 4], ["Week 2 / Wed", 1], ["Week 2 / Thu", 5], ["Week 2 / Fri", 3], ["Week 2 / Sat", 2], ["Week 2 / Sun", 4],
    ["Week 3 / Mon", 1], ["Week 3 / Tue", 2], ["Week 3 / Wed", 4], ["Week 3 / Thursday", 5], ["Week 3 / Fri", 3], ["Week 3 / Sat", 4], ["Week 3 / Sun", 2],
    ["Week 4 / Mon", 3], ["Week 4 / Tue", 2], ["Week 4 / Wed", 4], ["Week 4 / Thu", 5], ["Week 4 / Fri", 2], ["Week 4 / Sat", 3], ["Week 4 / Sun", 4],
  ];

  const fintrackDetails = {
    "Week 3 / Thursday": "Highest activity window with stronger transaction density, category summary requests, and end-of-week budget checks.",
    "Week 1 / Thu": "Authentication and transaction creation requests peak here, which matches first-week budgeting behavior.",
    "Week 2 / Sun": "Summary endpoints and grouped SQL reports surface more often when users review weekly spending.",
  };

  const diabetesModels = {
    "Logistic Regression": {
      accuracy: "81%",
      precision: "0.79",
      recall: "0.76",
      note: "Strong baseline with interpretable linear decision boundaries and dependable stability after feature scaling.",
      bars: [58, 66, 71, 64, 68],
    },
    "Random Forest": {
      accuracy: "85%",
      precision: "0.84",
      recall: "0.82",
      note: "Best overall balance in the project, capturing non-linear patterns and producing the strongest ROC-AUC result.",
      bars: [72, 81, 88, 77, 84],
    },
    "SVM": {
      accuracy: "83%",
      precision: "0.82",
      recall: "0.79",
      note: "Competitive performance with cleaner margins after scaling, especially useful for a tighter separation boundary.",
      bars: [64, 74, 79, 69, 76],
    },
  };

  const diabetesSegments = {
    "Balanced glucose profile": "Low-to-moderate risk profile where multiple health indicators remain within manageable ranges.",
    "Elevated glucose trend": "Rising diabetes probability driven primarily by fasting glucose and BMI movement above the safer band.",
    "High BMI and glucose": "Higher-risk cluster where combined BMI pressure and glucose levels materially increase positive prediction likelihood.",
  };

  const airMetrics = {
    "PM2.5": {
      note: "Primary target variable for the project, showing sharper urban spikes and stronger sensitivity to weather-linked variation.",
      bars: [42, 58, 51, 72, 84, 63, 78],
    },
    "NO2": {
      note: "Traffic-linked changes are visible here, but the pattern is slightly smoother than PM2.5 during the same period.",
      bars: [38, 43, 49, 57, 62, 54, 59],
    },
    "SO2": {
      note: "Lower amplitude compared with other pollutants, but still useful for identifying industrial pockets in the data.",
      bars: [24, 29, 27, 35, 41, 33, 36],
    },
    "O3": {
      note: "More daytime and seasonal behavior, with a wider spread in later intervals of the observed cycle.",
      bars: [31, 36, 42, 47, 44, 53, 57],
    },
  };

  const projects = {
    fintrack: {
      title: "FinTrack REST API",
      subtitle: "Interactive backend dashboard concept aligned with secure finance tracking, SQL summaries, and endpoint usage.",
      views: [
        { id: "heatmap", label: "Traffic Heatmap" },
        { id: "categories", label: "Category Mix" },
      ],
    },
    diabetes: {
      title: "Diabetes Prediction using Machine Learning",
      subtitle: "Interactive model-readout view based on preprocessing, classification comparison, and evaluation metrics.",
      views: [
        { id: "models", label: "Model Scores" },
        { id: "segments", label: "Risk Segments" },
      ],
    },
    air: {
      title: "Air Quality Monitoring & Pollution Level Prediction",
      subtitle: "Interactive pollution analysis preview focused on PM2.5 forecasting, pollutant behavior, and tuned model output.",
      views: [
        { id: "trends", label: "Trend Window" },
        { id: "pollutants", label: "Pollutant Mix" },
      ],
    },
  };

  function openModal(projectId) {
    state.projectId = projectId;
    state.activeView = projects[projectId].views[0].id;
    renderModal();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  function renderToolbar(project) {
    toolbar.innerHTML = project.views
      .map(
        (view) => `
          <button type="button" class="project-modal-tab ${state.activeView === view.id ? "active" : ""}" data-project-view="${view.id}">
            ${view.label}
          </button>
        `
      )
      .join("");
  }

  function renderFintrack(viewId) {
    if (viewId === "categories") {
      return `
        <div class="modal-grid-two">
          <section class="modal-panel">
            <h4>Spending category response layer</h4>
            <div class="modal-inline-chart warm">
              <span style="height: 76%"></span>
              <span style="height: 54%"></span>
              <span style="height: 82%"></span>
              <span style="height: 61%"></span>
              <span style="height: 47%"></span>
            </div>
            <p class="modal-detail-note">The API summary endpoint is designed to make monthly category comparisons readable and recruiter-friendly, not just technically correct.</p>
          </section>
          <aside class="modal-panel">
            <h4>What this preview represents</h4>
            <div class="modal-kpi-row">
              <div class="modal-stat"><strong>JWT</strong><span>Authentication flow</span></div>
              <div class="modal-stat"><strong>SUM</strong><span>SQL aggregations</span></div>
              <div class="modal-stat"><strong>6</strong><span>Tested endpoints</span></div>
            </div>
            <p class="modal-detail-note">This larger view reflects how the project combines transaction management, category-level reporting, and financial summaries through relational design and grouped SQL logic.</p>
          </aside>
        </div>
      `;
    }

    const activeDetail = fintrackDetails[state.fintrackCell] || "Steady request density with stronger traffic around reporting and transaction review endpoints.";
    return `
      <div class="modal-grid-two">
        <section class="modal-panel">
          <h4>Monthly interaction heatmap</h4>
          <div class="modal-heatmap">
            ${fintrackHeat
              .map(([labelText, level]) => {
                const active = state.fintrackCell === labelText ? "active" : "";
                return `<button type="button" class="${active}" data-fintrack-cell="${labelText}" style="background: rgba(125, 249, 198, ${0.1 + level * 0.14})">${labelText}</button>`;
              })
              .join("")}
          </div>
        </section>
        <aside class="modal-panel">
          <h4>${state.fintrackCell}</h4>
          <div class="modal-kpi-row">
            <div class="modal-stat"><strong>24</strong><span>Tracked requests</span></div>
            <div class="modal-stat"><strong>3</strong><span>Summary groups</span></div>
            <div class="modal-stat"><strong>PostgreSQL</strong><span>Source layer</span></div>
          </div>
          <p class="modal-detail-note">${activeDetail}</p>
        </aside>
      </div>
    `;
  }

  function renderDiabetes(viewId) {
    if (viewId === "segments") {
      return `
        <div class="modal-grid-two">
          <section class="modal-panel">
            <h4>Risk segment explorer</h4>
            <div class="modal-selector-row">
              ${Object.keys(diabetesSegments)
                .map(
                  (segment) => `
                    <button type="button" class="modal-option ${state.diabetesSegment === segment ? "active" : ""}" data-diabetes-segment="${segment}">
                      <strong>${segment}</strong>
                      <span>Predicted profile</span>
                    </button>
                  `
                )
                .join("")}
            </div>
          </section>
          <aside class="modal-panel">
            <h4>${state.diabetesSegment}</h4>
            <p class="modal-detail-note">${diabetesSegments[state.diabetesSegment]}</p>
            <div class="modal-kpi-row">
              <div class="modal-stat"><strong>Scaled</strong><span>Input features</span></div>
              <div class="modal-stat"><strong>Cleaned</strong><span>Missing values handled</span></div>
              <div class="modal-stat"><strong>Binary</strong><span>Outcome target</span></div>
            </div>
          </aside>
        </div>
      `;
    }

    const model = diabetesModels[state.diabetesModel];
    return `
      <div class="modal-grid-two">
        <section class="modal-panel">
          <h4>Model comparison</h4>
          <div class="modal-selector-row">
            ${Object.keys(diabetesModels)
              .map(
                (name) => `
                  <button type="button" class="modal-option ${state.diabetesModel === name ? "active" : ""}" data-diabetes-model="${name}">
                    <strong>${name}</strong>
                    <span>Classification model</span>
                  </button>
                `
              )
              .join("")}
          </div>
          <div class="modal-inline-chart warm">
            ${model.bars.map((bar) => `<span style="height: ${bar}%"></span>`).join("")}
          </div>
        </section>
        <aside class="modal-panel">
          <h4>${state.diabetesModel}</h4>
          <div class="modal-kpi-row">
            <div class="modal-stat"><strong>${model.accuracy}</strong><span>Accuracy</span></div>
            <div class="modal-stat"><strong>${model.precision}</strong><span>Precision</span></div>
            <div class="modal-stat"><strong>${model.recall}</strong><span>Recall</span></div>
          </div>
          <p class="modal-detail-note">${model.note}</p>
        </aside>
      </div>
    `;
  }

  function renderAir(viewId) {
    if (viewId === "pollutants") {
      const metric = airMetrics[state.airMetric];
      return `
        <div class="modal-grid-two">
          <section class="modal-panel">
            <h4>Pollutant comparison</h4>
            <div class="modal-pollutant-row">
              ${Object.keys(airMetrics)
                .map(
                  (metricName) => `
                    <button type="button" class="modal-option ${state.airMetric === metricName ? "active" : ""}" data-air-metric="${metricName}">
                      <strong>${metricName}</strong>
                      <span>Observed signal</span>
                    </button>
                  `
                )
                .join("")}
            </div>
            <div class="modal-inline-chart">
              ${metric.bars.map((bar) => `<span style="height: ${bar}%"></span>`).join("")}
            </div>
          </section>
          <aside class="modal-panel">
            <h4>${state.airMetric} signal</h4>
            <p class="modal-detail-note">${metric.note}</p>
            <div class="modal-kpi-row">
              <div class="modal-stat"><strong>0.86</strong><span>R2 score</span></div>
              <div class="modal-stat"><strong>XGBoost</strong><span>Tuned model</span></div>
              <div class="modal-stat"><strong>EDA</strong><span>Trend study</span></div>
            </div>
          </aside>
        </div>
      `;
    }

    return `
      <div class="modal-grid-two">
        <section class="modal-panel">
          <h4>Forecast window</h4>
          <div class="modal-selector-row">
            ${["Early week", "Peak week", "Post-rain shift"]
              .map(
                (windowLabel) => `
                  <button type="button" class="modal-option ${state.airView === windowLabel ? "active" : ""}" data-air-view="${windowLabel}">
                    <strong>${windowLabel}</strong>
                    <span>Trend snapshot</span>
                  </button>
                `
              )
              .join("")}
          </div>
          <div class="modal-inline-chart">
            ${(
              {
                "Early week": [32, 44, 49, 58, 55, 47, 52],
                "Peak week": [41, 57, 52, 72, 81, 67, 76],
                "Post-rain shift": [24, 33, 29, 38, 42, 35, 31],
              }[state.airView]
            )
              .map((bar) => `<span style="height: ${bar}%"></span>`)
              .join("")}
          </div>
        </section>
        <aside class="modal-panel">
          <h4>${state.airView}</h4>
          <p class="modal-detail-note">This view reflects how the project studies pollutant trend changes across time, then uses engineered features and tuned models to improve PM2.5 prediction quality.</p>
          <div class="modal-kpi-row">
            <div class="modal-stat"><strong>Temporal</strong><span>Trend analysis</span></div>
            <div class="modal-stat"><strong>Correlated</strong><span>Feature review</span></div>
            <div class="modal-stat"><strong>12%</strong><span>Approx. lift</span></div>
          </div>
        </aside>
      </div>
    `;
  }

  function renderModal() {
    const project = projects[state.projectId];
    if (!project) return;

    label.textContent = "Interactive Preview";
    title.textContent = project.title;
    subtitle.textContent = project.subtitle;
    renderToolbar(project);

    if (state.projectId === "fintrack") body.innerHTML = renderFintrack(state.activeView);
    if (state.projectId === "diabetes") body.innerHTML = renderDiabetes(state.activeView);
    if (state.projectId === "air") body.innerHTML = renderAir(state.activeView);
  }

  previewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.dataset.projectPreview);
    });
  });

  toolbar.addEventListener("click", (event) => {
    const nextView = event.target.closest("[data-project-view]");
    if (!nextView) return;
    state.activeView = nextView.dataset.projectView;
    renderModal();
  });

  body.addEventListener("click", (event) => {
    const fintrackCell = event.target.closest("[data-fintrack-cell]");
    const diabetesModel = event.target.closest("[data-diabetes-model]");
    const diabetesSegment = event.target.closest("[data-diabetes-segment]");
    const airMetric = event.target.closest("[data-air-metric]");
    const airView = event.target.closest("[data-air-view]");

    if (fintrackCell) {
      state.fintrackCell = fintrackCell.dataset.fintrackCell;
      renderModal();
    }
    if (diabetesModel) {
      state.diabetesModel = diabetesModel.dataset.diabetesModel;
      renderModal();
    }
    if (diabetesSegment) {
      state.diabetesSegment = diabetesSegment.dataset.diabetesSegment;
      renderModal();
    }
    if (airMetric) {
      state.airMetric = airMetric.dataset.airMetric;
      renderModal();
    }
    if (airView) {
      state.airView = airView.dataset.airView;
      renderModal();
    }
  });

  closeButton?.addEventListener("click", closeModal);
  modal.querySelector("[data-close-project-modal]")?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });
})();
