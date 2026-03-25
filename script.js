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

  if (!wrap) return;

  // Restore saved photo (only if user explicitly uploaded one)
  const saved = localStorage.getItem('ss_profile_photo');
  if (saved) {
    img.src = saved;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    placeholder.style.display = 'flex';
  }

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
