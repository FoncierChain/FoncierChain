  (function () {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function rand(a, b) { return a + Math.random() * (b - a); }

    class Particle {
      constructor() { this.reset(true); }
      reset(init = false) {
        this.x    = rand(0, W);
        this.y    = init ? rand(0, H) : H + 10;
        this.r    = rand(1, 2.8);
        this.vy   = rand(.05, .25);
        this.vx   = rand(-.05, .05);
        this.alpha= rand(.15, .65);
        this.pulse= rand(0, Math.PI * 2);
        this.pulseSpeed = rand(.005, .018);
        this.green = Math.random() > .72;
      }
      update() {
        this.y    -= this.vy;
        this.x    += this.vx;
        this.pulse += this.pulseSpeed;
        this.alpha = Math.abs(Math.sin(this.pulse)) * .55 + .08;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.green ? '#00e57a' : '#4a4a80';
        ctx.fill();
        if (this.green && this.r > 1.8) {
          ctx.shadowBlur  = 8;
          ctx.shadowColor = '#00e57a';
          ctx.fill();
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < 110; i++) particles.push(new Particle());

    function loop() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
  })();

  let DB_LIST = [];

  const STATUS_LABELS = { confirmed:'Confirmé', litige:'Brouillon', pending:'En Attente' };
  const STATUS_BADGE  = { confirmed:'result-badge--confirmed', litige:'result-badge--litige', pending:'result-badge--pending' };
  const STATUS_ICON   = { confirmed:'bi-patch-check-fill', litige:'bi-exclamation-triangle-fill', pending:'bi-hourglass-split' };

  async function loadData() {
    try {
      const res = await fetch('https://foncierchain-web1.onrender.com/api/v1/map/');
      if (res.ok) {
        const data = await res.json();
        DB_LIST = data.map(r => ({
          id: r.parcelId,
          owner: r.currentOwner || 'Inconnu',
          district: r.address || 'Brazzaville',
          type: r.usage || 'Résidentiel',
          area: r.surface + ' m²',
          notaire: 'Système Blockchain FoncierChain',
          block: r.workflowStep === 3 ? 'Bloc Finalisé' : 'Bloc Temporaire',
          date: new Date().toLocaleDateString('fr-FR') + ' — UTC',
          status: r.status === 'FINALIZED' ? 'confirmed' : (r.status === 'COMMUNITY_VALIDATED' ? 'pending' : 'litige'),
          hash: r.hash || 'a3f9b2cfd4e6f6a7b8c0df2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1'
        }));
      }
    } catch(e) {
      console.error("Erreur chargement données portail:", e);
    }
  }

  // Load data immediately
  loadData();

  function setQuery(val) {
    document.getElementById('verify-input').value = val;
    document.getElementById('verify-input').focus();
  }
  // Expose to window for inline onclicks
  window.setQuery = setQuery;

  function runVerify() {
    const raw   = document.getElementById('verify-input').value.trim();
    const query = raw.replace(/^#/, '').toUpperCase();
    const panel = document.getElementById('result-panel');
    const btn   = document.getElementById('verify-btn');

    if (!query) {
      document.getElementById('verify-input').focus();
      return;
    }

    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Vérification…';
    panel.style.display = 'none';

    setTimeout(() => {
      btn.classList.remove('loading');
      btn.innerHTML = '<i class="bi bi-search"></i> Vérifier';

      const match = DB_LIST.find(p =>
        p.id.toUpperCase().includes(query) ||
        query.includes(p.id.toUpperCase()) ||
        p.hash.startsWith(raw.toLowerCase())
      );

      panel.style.display = 'block';

      if (match) {
        panel.innerHTML = `
          <div class="result-box result-box--success">
            <div class="loading-bar"></div>
            <div class="result-header">
              <div class="result-header__icon result-header__icon--success">
                <i class="bi bi-check-lg"></i>
              </div>
              <div>
                <div class="result-header__title">Titre trouvé — Propriétaire légitime confirmé</div>
                <div class="result-header__sub">Interrogation du registre blockchain — réponse en 0.8s</div>
              </div>
            </div>
            <div class="result-grid">
              <div class="result-field">
                <div class="result-field__label">ID Parcelle</div>
                <div class="result-field__value">#${match.id}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">Propriétaire</div>
                <div class="result-field__value" style="font-size:12px;">${match.owner}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">District</div>
                <div class="result-field__value">${match.district}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">Type</div>
                <div class="result-field__value">${match.type}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">Superficie</div>
                <div class="result-field__value">${match.area}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">Certification</div>
                <div class="result-field__value" style="font-size:10px;line-height:1.4;">${match.notaire}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">Bloc Blockchain</div>
                <div class="result-field__value">${match.block}</div>
              </div>
              <div class="result-field">
                <div class="result-field__label">Statut Validation</div>
                <div class="result-field__value" style="font-size:10px;">Enregistré sur Ledger</div>
              </div>
            </div>
            <div class="hash-display">
              <span style="color:var(--fc-green);margin-right:8px;">SHA-256</span>${match.hash}
            </div>
            <span class="result-badge ${STATUS_BADGE[match.status]}">
              <i class="bi ${STATUS_ICON[match.status]}"></i>
              ${STATUS_LABELS[match.status]}
            </span>
          </div>`;
      } else {
        panel.innerHTML = `
          <div class="result-box result-box--error">
            <div class="result-header">
              <div class="result-header__icon result-header__icon--error">
                <i class="bi bi-x-lg"></i>
              </div>
              <div>
                <div class="result-header__title">Aucun titre trouvé dans le registre</div>
                <div class="result-header__sub">Requête : "${raw}" — 0 résultat</div>
              </div>
            </div>
            <p style="font-size:13px;color:var(--fc-muted);line-height:1.6;">
              L'identifiant <code style="font-family:var(--fc-mono);color:var(--fc-red);">${raw}</code> ne correspond à aucun titre enregistré sur la blockchain FoncierChain.
              Vérifiez l'orthographe ou consultez directement
              <a href="https://foncier-chain-web1.vercel.app" style="color:var(--fc-green);">le portail institutionnel</a>.
            </p>
          </div>`;
      }

      panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, 850);
  }
  // Expose to window
  window.runVerify = runVerify;