/* ============================================================
   Jeff Portfolio — behaviour

   1 data · 2 form endpoint · 3 preloader · 4 accent · 5 nav
   6 scroll · 7 typing · 8 reveal · 9 pointer · 10 projects
   11 clipboard · 12 form · 13 greeting/clock · 14 hero
   15 year · 16 light-dark theme · 17 counters · 18 palette

   Every module is booted inside its own try/catch, so one failure
   never takes the page down with it.
   ============================================================ */
(function () {
  'use strict';

  /* Mark that JS is alive. Reveal animations only hide content once
     this class exists, so a script failure never blanks the page. */
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* Icons are sprite references, built here so JS-rendered markup
     uses the same icon system as the HTML. */
  function icon(id) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + id + '"></use></svg>';
  }

  /* Anything interpolated into markup goes through here. Most of it is
     Jeff's own copy, but the palette also echoes the visitor's own
     search text back at them — that string is not ours to trust. */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* True while the caret is in a text field, so single-key shortcuts
     never eat a character someone is typing. */
  function isTyping() {
    var el = document.activeElement;
    return !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
  }

  /* True while a dialog covers the page. Page-level shortcuts must not
     reach through it — "/" used to move focus to the project search
     sitting behind an open project modal. */
  function overlayOpen() {
    return !!document.querySelector('.modal.is-open, .palette.is-open, body.nav-open');
  }

  /* ---------- toasts ----------
     Small, transient confirmations. The container is aria-live, so the
     text is announced once and the visual is pure decoration on top. */
  function toast(message, iconId, kind) {
    var host = $('#toasts');
    if (!host) return;

    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' is-' + kind : '');
    el.innerHTML = icon(iconId || 'check') + '<span>' + esc(message) + '</span>';
    host.appendChild(el);

    /* Two frames: one to attach, one to let the browser register the
       start state before the transition to .is-in. */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { el.classList.add('is-in'); });
    });

    /* Never let toasts stack into a wall. */
    while (host.children.length > 3) host.removeChild(host.firstChild);

    setTimeout(function () {
      el.classList.remove('is-in');
      setTimeout(function () { el.remove(); }, 320);
    }, 2600);
  }

  /* ---------- clipboard ----------
     One implementation, used by both the copy buttons and the palette.

     Two paths, and the legacy one is not dead weight: the async API is
     missing on file:// and plain http, AND it rejects on a document
     the browser does not consider focused. So a rejection falls
     through to execCommand rather than straight to an error — the
     visitor is told it failed only once both have actually failed. */
  function copyText(value, message, onDone) {
    var ok = function () {
      if (onDone) onDone();
      if (message) toast(message, 'check');
    };

    function legacy() {
      var ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (err) { done = false; }
      document.body.removeChild(ta);
      if (done) ok();
      else toast('Could not copy — it is ' + value, 'alert', 'error');
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(ok).catch(legacy);
      return;
    }
    legacy();
  }

  /* ==========================================================
     1. PROJECT DATA
     ----------------------------------------------------------
     The only block you need to edit to update projects.

       tags     : filter keys (see FILTERS). A project can sit in
                  several — CHAMAA is both fintech and desktop.
       platforms: where it runs; shown on the cover and in the modal.
       features : bullet list shown in the detail modal.
       featured : true pins a "Featured" ribbon on the card.
       demo     : live URL.  Leave '' and no "Live Demo" link renders.
       repo     : source URL. Kept for reference only — source links
                  are deliberately not shown on the site.
       image    : cover photo. Leave '' to fall back to the gradient
                  cover with the emoji.

     Empty strings are deliberate — a missing link beats a link
     that goes nowhere.
     ========================================================== */
  var UNSPLASH = function (id) {
    return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=800&q=70';
  };

  var PROJECTS = [
    {
      id: 'gaming-nation',
      title: 'Gaming Nation — VTC Fleet Platform',
      tags: ['web', 'media', 'desktop'],
      platforms: ['Web', 'Windows', 'Android'],
      featured: true,
      emoji: '🚛',
      image: UNSPLASH('1542751371-adc38448a05e'),
      imageAlt: 'Gamer at a multi-monitor racing setup',
      blurb: 'Real-time management platform for a virtual trucking company. A driver client reads Euro Truck Simulator 2 telemetry, records every delivery and syncs it to a live admin console.',
      stack: ['JavaScript', 'Electron', 'Capacitor', 'Supabase', 'Node.js'],
      features: [
        'Live truck position plotted on an ETS2 / ATS world map from the SCS telemetry SDK',
        'Runs start and finish automatically when a job is taken and delivered in game',
        'Distance, time at the wheel and earnings recorded against each driver',
        'Admin console showing who is online, on a job and how far along',
        'Ships as a web app, installable PWA, Windows .exe and Android .apk from one codebase'
      ],
      problem: 'Virtual trucking companies tracked deliveries by screenshot and spreadsheet, so dispatchers never knew who was actually driving.',
      role: 'Sole developer — telemetry bridge, driver client, real-time sync and the management console.',
      outcome: 'Drivers just play; the fleet, runs and earnings update on every screen in real time with no manual logging.',
      demo: '',
      repo: 'https://github.com/JeffBoss315/Gaming-Nation'
    },
    {
      id: 'chamaa',
      title: 'CHAMAA — SACCO & Chama Manager',
      tags: ['fintech', 'web', 'desktop'],
      platforms: ['Web', 'Windows', 'Offline HTML'],
      featured: true,
      emoji: '💰',
      image: UNSPLASH('1579621970563-ebec7560ff3e'),
      imageAlt: 'Seedling growing out of a pile of coins',
      blurb: 'Digital SACCO and chama management for Kenyan savings groups — members, contributions, loans, repayments and expenses, with a full audit trail.',
      stack: ['Python', 'Flask', 'SQLAlchemy', 'MySQL', 'PyInstaller'],
      features: [
        'Dashboard with KPIs, 6-month cash-flow chart and top savers',
        'Contributions per fund via M-Pesa, bank or cash with auto references',
        'Loan calculator, approve / reject flow and balance-aware repayments',
        'Every change written to an audit trail; CSV export everywhere',
        'Three editions from one design: Flask web app, Windows .exe and a zero-install offline HTML file'
      ],
      problem: 'Chama treasurers kept contributions and loans in exercise books, which made balances slow to check and easy to dispute.',
      role: 'Sole developer — data model, Flask app, desktop launcher and the standalone offline build.',
      outcome: 'Every member balance, loan and shilling is traceable in seconds, and the group can run it on a hosted server, a single PC or a browser file.',
      demo: '',
      repo: ''
    },
    {
      id: 'pos',
      title: 'KashFlow — Multi-Shop POS',
      tags: ['fintech', 'web'],
      platforms: ['Web'],
      featured: true,
      emoji: '🧾',
      image: UNSPLASH('1556742049-0cfed4f6a45d'),
      imageAlt: 'Customer paying at a shop counter',
      blurb: 'Point-of-sale and back office for retail shops: sales, stock, suppliers, returns, expenses and profit & loss, with M-Pesa payments and a separate database per shop.',
      stack: ['Python', 'Flask', 'SQLite', 'M-Pesa Daraja'],
      features: [
        'Fast till screen with printable receipts and returns handling',
        'Inventory with stock movements, suppliers and low-stock tracking',
        'Customers, expenses and a profit & loss report by period',
        'Staff accounts with granular permissions and an activity log',
        'Multi-tenant: every shop gets its own isolated SQLite database'
      ],
      problem: 'Small shops sold from memory and a notebook, so stock losses and real profit were invisible until month end.',
      role: 'Sole developer — schema, tenancy model, till UI, M-Pesa integration and reporting.',
      outcome: 'Owners see today’s takings, stock and profit live, and one install can host many shops without any shop seeing another’s data.',
      demo: '',
      repo: ''
    },
    {
      id: 'wifi',
      title: 'KAA ONLINE — WiFi Hotspot Billing',
      tags: ['fintech', 'web'],
      platforms: ['Web'],
      emoji: '📶',
      image: UNSPLASH('1544197150-b99a580bb7a8'),
      imageAlt: 'Network switch with patch cables',
      blurb: 'Captive portal for a WiFi hotspot: customers pick a plan, pay by M-Pesa STK push and are provisioned on the MikroTik router automatically.',
      stack: ['Node.js', 'Express', 'M-Pesa Daraja', 'MikroTik', 'MySQL'],
      features: [
        'Plan picker with M-Pesa STK push and live payment polling',
        'Automatic hotspot provisioning through the RouterOS REST API',
        'Crypto-random, unambiguous voucher codes with a session countdown',
        'Demo mode runs the full payment flow without moving real money',
        'Rate limiting, hardened headers and a node:test smoke suite'
      ],
      problem: 'Hotspot operators sold access by hand — collecting cash, typing vouchers and forgetting to disconnect expired users.',
      role: 'Sole developer — Express API, Daraja integration, MikroTik provisioning and the portal UI.',
      outcome: 'Pay-and-connect is fully self-service: payment confirmed, voucher issued and router updated in one flow.',
      demo: '',
      repo: ''
    },
    {
      id: 'utility-billing',
      title: 'Tenant Utility Billing System',
      tags: ['fintech', 'web', 'desktop'],
      platforms: ['Web', 'Windows', 'Offline HTML'],
      emoji: '⚡',
      image: UNSPLASH('1545324418-cc1a3fa10c00'),
      imageAlt: 'Modern apartment building',
      blurb: 'Bills tenants from electricity and water sub-meter readings using tiered tariffs, service charge and tax, then issues PDF invoices by email or SMS.',
      stack: ['Python', 'Flask', 'SQLAlchemy', 'ReportLab', 'SQLite'],
      features: [
        'Live bill preview while a meter reading is typed, validated against the last one',
        'Tariff builder with contiguous tiers and a bill simulator',
        'PDF invoices with email / SMS delivery, paid and overdue tracking',
        'Dashboard of billed, outstanding, overdue and collected totals',
        'Ships as a Flask app, Windows desktop app and single offline HTML file'
      ],
      problem: 'Landlords split utility bills by estimate, which caused disputes and left arrears untracked.',
      role: 'Sole developer — billing engine, invoicing, notifications and packaging.',
      outcome: 'Every tenant gets an itemised, tier-accurate invoice and the landlord sees exactly who owes what.',
      demo: '',
      repo: ''
    },
    {
      id: 'ecommerce',
      title: 'Lizzie Collections — Online Store',
      tags: ['web', 'fintech'],
      platforms: ['Web'],
      emoji: '🛍️',
      image: UNSPLASH('1441986300917-64674bd600d8'),
      imageAlt: 'Clothing boutique with shelves and racks',
      blurb: 'Full storefront for a fashion boutique — catalogue, search, cart, wishlist, coupons, M-Pesa checkout, customer accounts and an admin control centre.',
      stack: ['HTML', 'CSS', 'JavaScript', 'localStorage'],
      features: [
        'Filterable catalogue with product quick-view, recently viewed and recommendations',
        'Persistent cart and wishlist with coupon codes',
        'Checkout flow with M-Pesa and order confirmation',
        'Customer account dashboard with order history',
        'Admin centre to add, edit and remove products'
      ],
      problem: 'The boutique sold only through WhatsApp photos, with no catalogue, prices or order record.',
      role: 'Design and full front-end build.',
      outcome: 'A complete shop experience in the browser that the owner can manage without touching code.',
      demo: '',
      repo: ''
    },
    {
      id: 'portal',
      title: 'Kageraini TTI — Student Portal',
      tags: ['web'],
      platforms: ['Web'],
      emoji: '🎓',
      image: UNSPLASH('1541339907198-e08756dedf3f'),
      imageAlt: 'Graduates throwing their caps in the air',
      blurb: 'Public website and private portal for a technical training institute: trainee records, unit registration, fees, attendance, results, attachment and hostel booking.',
      stack: ['JavaScript', 'Chart.js', 'Node.js', 'Express', 'CSS'],
      features: [
        'Public marketing site with programmes, events and news',
        'Role-based sign-in routing staff and trainees to separate portals',
        'Staff console: dashboard, trainees, fees, attendance and reports',
        'Trainee self-service: fees, results, units, timetable and exam card',
        'Shared design system with theme-aware charts'
      ],
      problem: 'Fee balances, results and registration lived in separate office files, so every trainee query meant a queue at the office.',
      role: 'Sole developer — design system, public site and both portals.',
      outcome: 'Trainees check fees and results themselves, and staff manage the institution from one console.',
      demo: '',
      repo: ''
    },
    {
      id: 'sports',
      title: 'FreeStream Hub — Live Sports & TV',
      tags: ['web', 'media'],
      platforms: ['Web', 'Cloudflare'],
      emoji: '⚽',
      image: UNSPLASH('1574629810360-7efbbe195018'),
      imageAlt: 'Football on a pitch at a player’s feet',
      blurb: 'Free and legal live sports fixtures, Kenyan and world TV channels and public films in one place, backed by a server that keeps every API key private.',
      stack: ['Node.js', 'Cloudflare Workers', 'TheSportsDB', 'TMDB'],
      features: [
        'Live and upcoming fixtures browsable by league',
        'Kenyan TV, news and favourite channels with continue-watching',
        'Free HD films with subtitles',
        'Admin page to manage API keys, stored AES-256-GCM encrypted',
        'Zero-dependency Node server, deployable to Cloudflare Workers'
      ],
      problem: 'Finding a legal stream or even a fixture time meant hopping between ad-heavy sites.',
      role: 'Sole developer — server, key vault, data proxy and front end.',
      outcome: 'One clean hub for sports, TV and films where no key or secret ever reaches the browser.',
      demo: '',
      repo: ''
    },
    {
      id: 'movixa',
      title: 'MOVIXA — Movie Discovery Hub',
      tags: ['web', 'media'],
      platforms: ['Web'],
      emoji: '🎬',
      image: UNSPLASH('1489599849927-2ee91cede3ba'),
      imageAlt: 'Cinema seats facing a lit screen',
      blurb: 'Film discovery app with trending and top-rated rails, trailer playback, cast and crew pages, a saved watchlist and free public-domain features streamed from the Internet Archive.',
      stack: ['JavaScript', 'TMDB API', 'Internet Archive', 'CSS'],
      features: [
        'Trending, top-rated and genre rails with instant search',
        'Trailer playback and cast & crew pages',
        'Watch-provider links showing where a film is streaming',
        'Watchlist persisted between visits',
        'Public-domain films playable in place'
      ],
      problem: 'Deciding what to watch means bouncing between listing sites, trailer searches and whichever service actually carries the film.',
      role: 'Sole developer — API layer, UI, and the watchlist and playback logic.',
      outcome: 'One page covers browsing, search, trailers, watch-provider links and a persisted watchlist, with public-domain titles playable in place.',
      demo: 'https://jeffboss315.github.io/moviehub/',
      repo: 'https://github.com/JeffBoss315/moviehub'
    },
    {
      id: 'weather',
      title: 'WeatherX — Photographic Forecast',
      tags: ['web'],
      platforms: ['Web', 'Cloudflare'],
      emoji: '🌦️',
      image: UNSPLASH('1501630834273-4b5604d2ee31'),
      imageAlt: 'Clouds gathering in a bright sky',
      blurb: 'Weather told through photographs: live conditions, air quality, an hourly trend and a five-day filmstrip, with an interface accent that follows the sky.',
      stack: ['JavaScript', 'OpenWeather API', 'Cloudflare Workers', 'CSS'],
      features: [
        'Day and night photo for each condition drives the hero and 5-day filmstrip',
        'City autocomplete with full keyboard navigation',
        'Air quality, sun arc, wind compass and a 24-hour temperature trend',
        'Instant °C / °F switching with no extra API calls',
        'API key hidden behind a Cloudflare Worker proxy; shareable ?city= links'
      ],
      problem: 'Most weather apps are a wall of icons and numbers; the forecast is hard to feel at a glance.',
      role: 'Sole developer — design, front end and the Worker proxy.',
      outcome: 'A forecast you read in a second, with the API key never exposed to visitors.',
      demo: 'https://jeffboss315.github.io/WeatherX/',
      repo: 'https://github.com/JeffBoss315/WeatherX'
    },
    {
      id: 'hospital',
      title: 'Hospital Diagnosis Expert System',
      tags: ['ai', 'desktop'],
      platforms: ['Windows'],
      emoji: '🏥',
      image: UNSPLASH('1584982751601-97dcc096659c'),
      imageAlt: 'Doctor holding a stethoscope',
      blurb: 'Desktop clinical decision-support tool: capture symptoms, get a ranked differential with confidence scores, keep patient records and export reports.',
      stack: ['Python', 'Tkinter', 'SQLite', 'scikit-learn', 'ReportLab'],
      features: [
        'Symptom matcher covering 48 conditions, with fuzzy matching of everyday phrases',
        'Optional machine-learning model path, chosen automatically when trained',
        'Ranked differential with confidence meters and a live probability chart',
        'Patient directory with per-patient diagnosis history',
        'One-click PDF reports, Excel / CSV export, user roles and a sign-in audit trail'
      ],
      problem: 'Rural clinics have limited access to specialists for first-pass triage, and patient files were kept on paper.',
      role: 'Sole developer — inference engine, database, Tkinter UI and the packaged Windows build.',
      outcome: 'A single offline .exe that returns an explainable shortlist in seconds and keeps each patient’s history on record.',
      demo: '',
      repo: ''
    },
    {
      id: 'agriculture',
      title: 'Smart Agriculture Dashboard',
      tags: ['ai', 'web'],
      platforms: ['Web', 'Windows'],
      emoji: '🌱',
      image: UNSPLASH('1560493676-04071c5f467b'),
      imageAlt: 'Farmland crop rows',
      blurb: 'Smart-farming dashboard with live field telemetry, crop tracking, soil and nutrient panels, irrigation scheduling and photo-based crop disease screening.',
      stack: ['Python', 'Flask', 'Pillow', 'ReportLab'],
      features: [
        'Field telemetry panels and charts from a custom SVG chart renderer',
        'Soil, nutrient and weather panels with irrigation scheduling',
        'Photo-based disease screening with a confidence score',
        'Exportable PDF and CSV reports',
        'Runs fully offline — no CDN — and ships as a bundled executable'
      ],
      problem: 'Planting and watering decisions were made on habit rather than current soil and weather conditions.',
      role: 'Sole developer — Flask app, telemetry model, image screener and reports.',
      outcome: 'Farm conditions, schedules and crop health in one dashboard that works without internet.',
      demo: '',
      repo: ''
    }
  ];

  var FILTERS = [
    { key: 'all',     label: 'All' },
    { key: 'web',     label: 'Web apps' },
    { key: 'fintech', label: 'Fintech & business' },
    { key: 'desktop', label: 'Desktop' },
    { key: 'ai',      label: 'AI & data' },
    { key: 'media',   label: 'Media & gaming' }
  ];

  var ACCENTS = [
    { name: 'Cyan',   rgb: '0 212 255' },
    { name: 'Violet', rgb: '167 139 250' },
    { name: 'Green',  rgb: '74 222 128' },
    { name: 'Amber',  rgb: '251 191 36' },
    { name: 'Rose',   rgb: '251 113 133' }
  ];

  /* ==========================================================
     2. FORM ENDPOINT
     ----------------------------------------------------------
     Paste a Formspree (or Web3Forms) endpoint here to receive
     messages by email. While it is empty the form validates and
     then opens the visitor's mail client with the message
     pre-filled — it still works, it just does not pretend to
     have a backend it does not have.

     Formspree: create a form at formspree.io, then set
     FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxxx';
     ========================================================== */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'jeffboss730@gmail.com';

  /* ==========================================================
     3. PRELOADER
     ========================================================== */
  function initPreloader() {
    var pre = $('#preloader');
    if (!pre) return;
    var hidden = false;
    var hide = function () {
      if (hidden) return;
      hidden = true;
      pre.classList.add('is-done');
      setTimeout(function () { pre.remove(); }, 600);
    };
    if (document.readyState === 'complete') setTimeout(hide, 250);
    else window.addEventListener('load', function () { setTimeout(hide, 250); });
    /* Never let a stalled asset trap the page behind the loader. */
    setTimeout(hide, 3500);
  }

  /* ==========================================================
     4. ACCENT PICKER  (persisted)
     ========================================================== */
  /* Module-level so the command palette can set the accent too. The
     rgb triplet is stored alongside the name because the <head>
     bootstrap has to restore the accent before this file is parsed. */
  function applyAccent(accent) {
    document.documentElement.style.setProperty('--main-rgb', accent.rgb);
    $$('.swatch').forEach(function (s) {
      s.setAttribute('aria-pressed', String(s.dataset.name === accent.name));
    });
    try {
      localStorage.setItem('jeff-accent', accent.name);
      localStorage.setItem('jeff-accent-rgb', accent.rgb);
    } catch (e) {}
  }

  function initTheme() {
    var btn = $('#theme-btn');
    var menu = $('#theme-menu');
    if (!btn || !menu) return;

    var apply = applyAccent;

    menu.innerHTML = ACCENTS.map(function (a) {
      return '<button type="button" class="swatch" data-name="' + a.name + '" ' +
        'style="background:rgb(' + a.rgb + ')" aria-pressed="false" ' +
        'aria-label="' + a.name + ' accent" title="' + a.name + '"></button>';
    }).join('');

    var saved = null;
    try { saved = localStorage.getItem('jeff-accent'); } catch (e) {}
    var start = ACCENTS.filter(function (a) { return a.name === saved; })[0] || ACCENTS[0];
    apply(start);

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains('is-open'));
    });

    menu.addEventListener('click', function (e) {
      var sw = e.target.closest('.swatch');
      if (!sw) return;
      var picked = ACCENTS.filter(function (a) { return a.name === sw.dataset.name; })[0];
      if (picked) apply(picked);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.theme-picker')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* ==========================================================
     5. MOBILE NAVIGATION
     ========================================================== */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#primary-nav');
    var backdrop = $('.nav-backdrop');
    if (!toggle || !nav) return;

    /* Below the breakpoint the drawer is a panel parked off-screen with
       a transform. A transform hides nothing from the keyboard or from
       a screen reader, so while it is closed its seven links were still
       in the tab order, sitting between the logo and the page. `inert`
       is what actually takes them out — and it has to come off again
       above the breakpoint, where the same element is the desktop
       navigation bar. */
    var mobile = window.matchMedia('(max-width: 860px)');
    var isOpen = function () { return document.body.classList.contains('nav-open'); };

    function syncInert() {
      var drawer = mobile.matches;
      if (drawer && !isOpen()) nav.setAttribute('inert', '');
      else nav.removeAttribute('inert');
    }

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      syncInert();
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });
    if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;

      if (e.key === 'Escape') {
        setOpen(false);
        toggle.focus();
        return;
      }

      /* The drawer covers the page, so tabbing has to stay in it —
         otherwise focus walks off into content sitting behind a scrim.
         The toggle is part of the loop because it is the way out. */
      if (e.key !== 'Tab' || !mobile.matches) return;
      var stops = $$('a[href], button', nav).concat([toggle])
        .filter(function (el) { return el.offsetParent !== null; });
      if (!stops.length) return;
      var first = stops[0];
      var last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* Reset if the viewport grows past the mobile breakpoint.
       addListener is the deprecated fallback for older Safari. */
    var onChange = function () {
      if (!mobile.matches) setOpen(false);
      else syncInert();
    };
    if (mobile.addEventListener) mobile.addEventListener('change', onChange);
    else if (mobile.addListener) mobile.addListener(onChange);

    syncInert();
  }

  /* ==========================================================
     6. SCROLL: header state, progress bar, back-to-top, spy
     ========================================================== */
  function initScroll() {
    var header = $('.header');
    var topBtn = $('#topBtn');
    var bar = $('#progress-bar');
    var ticking = false;

    function update() {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 20);
      if (topBtn) topBtn.classList.toggle('is-visible', y > 400);
      if (bar) {
        /* scaleX rather than width: width relays out the bar (and its
           box shadow) on every frame of every scroll. Browsers that
           support scroll() drive this from CSS and never reach here. */
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();

    if (topBtn) {
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    /* Highlight the nav link for whichever section is in view. */
    var links = $$('#primary-nav a[href^="#"]');
    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ==========================================================
     7. TYPING EFFECT
     ========================================================== */
  function initTyping() {
    var el = $('#typing');
    if (!el) return;

    var words = [
      'Computer Scientist',
      'Web Developer',
      'Software Developer',
      'AI Developer',
      'Graphics Designer',
      'ICT Support Specialist'
    ];

    /* An endless loop is a problem for anyone who asked for reduced
       motion — show the first role and stop. */
    if (reduceMotion) { el.textContent = words[0]; return; }

    var word = 0, chars = 0, deleting = false;

    (function tick() {
      var current = words[word];
      chars += deleting ? -1 : 1;
      el.textContent = current.slice(0, chars);

      var delay = deleting ? 55 : 110;
      if (!deleting && chars === current.length) { deleting = true; delay = 1400; }
      else if (deleting && chars === 0) {
        deleting = false;
        word = (word + 1) % words.length;
        delay = 350;
      }
      setTimeout(tick, delay);
    })();
  }

  /* ==========================================================
     8. SCROLL REVEAL
     ========================================================== */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    /* One listener for the whole page rather than one per element.
       Marking an entrance as spent is what stops it replaying: see the
       .has-revealed note in the stylesheet. */
    document.addEventListener('animationend', function (e) {
      if (e.animationName !== 'reveal-in' && e.animationName !== 'card-in') return;
      e.target.classList.add('has-revealed');
      e.target.classList.remove('is-entering');
    });

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    /* The stagger goes into --reveal-delay, which only the reveal
       keyframes read. Setting `transition-delay` here (as this used to)
       left up to 350ms of lag on the element permanently, so every
       later hover on that card answered a third of a second late. */
    items.forEach(function (el, i) {
      el.style.setProperty('--reveal-delay', Math.min(i % 6, 5) * 70 + 'ms');
      io.observe(el);
    });
  }

  /* ==========================================================
     9. POINTER EFFECTS: spotlight, tilt, magnetic, ripple
     ========================================================== */
  function initSpotlight() {
    var el = $('#spotlight');
    if (!el || !finePointer || reduceMotion) return;

    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var cx = x, cy = y, raf = null;

    document.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      document.body.classList.add('has-pointer');
      if (!raf) raf = window.requestAnimationFrame(loop);
    });

    function loop() {
      /* Ease toward the pointer so the glow trails rather than snaps. */
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      el.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      if (Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) {
        raf = window.requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
  }

  /* Tilt and the pointer glow both answer the same event, so they are
     read once and written once per element.

     Everything is written as CUSTOM PROPERTIES rather than as an inline
     `transform` / `transition`. Writing `transition` from here replaced
     whatever list the component had declared for itself — after the
     first hover a card had lost its border and shadow easing for good.
     And an inline transform could never win against the avatar's float
     keyframes, which is why this used to blank the animation on hover
     and put it back on the way out. The float now rides on `translate`
     (see the stylesheet), so both simply compose. */
  function initTilt() {
    if (!finePointer || reduceMotion) return;

    var MAX = 6;
    var tilters = $$('[data-tilt]');
    var glowers = $$('.card, .project, .hero-stat');

    tilters.forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        el.classList.add('is-tilting');
      });

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--tilt-x', (-py * MAX).toFixed(2) + 'deg');
        el.style.setProperty('--tilt-y', (px * MAX).toFixed(2) + 'deg');
        el.style.setProperty('--tilt-lift', '-6px');
      });

      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-tilting');
        el.style.removeProperty('--tilt-x');
        el.style.removeProperty('--tilt-y');
        el.style.removeProperty('--tilt-lift');
      });
    });

    /* The glow is a percentage position inside the element, so it
       survives the card being resized or reflowed mid-hover. */
    glowers.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--gx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    });
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) return;

    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        /* `translate`, not `transform`: the link's hover state is free
           to use transform without the two overwriting each other. */
        el.classList.add('is-magnetic');
        el.style.setProperty('--mag-x', (dx * 0.3).toFixed(1) + 'px');
        el.style.setProperty('--mag-y', (dy * 0.3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.classList.remove('is-magnetic');
        el.style.removeProperty('--mag-x');
        el.style.removeProperty('--mag-y');
      });
    });
  }

  function initRipple() {
    if (reduceMotion) return;

    document.addEventListener('pointerdown', function (e) {
      var host = e.target.closest('[data-ripple]');
      if (!host) return;
      var r = host.getBoundingClientRect();
      var size = Math.max(r.width, r.height);
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - r.left - size / 2) + 'px';
      span.style.top = (e.clientY - r.top - size / 2) + 'px';
      host.appendChild(span);
      setTimeout(function () { span.remove(); }, 600);
    });
  }

  /* ==========================================================
     10. PROJECTS — render, filter, search, detail modal
     ========================================================== */
  /* Everything below is Jeff's own copy, but it still goes through
     esc(): the Unsplash URLs carry raw ampersands, which are an entity
     start inside an attribute, and a future project title with an
     apostrophe or an ampersand in it should not be able to break the
     card it is written into. */
  function coverMarkup(p) {
    /* With no image the gradient background on .project-cover shows
       through, so the emoji is the fallback rather than a blank box. */
    var extras =
      (p.featured ? '<span class="cover-ribbon">Featured</span>' : '') +
      (p.platforms && p.platforms.length
        ? '<span class="cover-platforms">' + p.platforms.map(esc).join(' · ') + '</span>'
        : '');
    if (!p.image) {
      return '<span class="cover-emoji" aria-hidden="true">' + esc(p.emoji) + '</span>' + extras;
    }
    return '<img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt || p.title) +
      '" loading="lazy" decoding="async" width="800" height="450">' +
      '<span class="cover-badge" aria-hidden="true">' + esc(p.emoji) + '</span>' + extras;
  }

  function tagsOf(p) { return p.tags || (p.tag ? [p.tag] : []); }

  function stackMarkup(p) {
    return p.stack.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
  }

  function linkMarkup(p) {
    var out = '';
    if (p.demo) {
      out += '<a href="' + esc(p.demo) + '" target="_blank" rel="noopener noreferrer">' +
        icon('external') + 'Live Demo<span class="sr-only"> for ' + esc(p.title) +
        ' (opens in a new tab)</span></a>';
    }
    return out;
  }

  function initProjects() {
    var grid = $('#projects-grid');
    if (!grid) return;
    var filterBar = $('#project-filters');
    var search = $('#project-search');
    var count = $('#result-count');

    /* --- render ---
       The cover tint lives in CSS and keys off --i, so it follows the
       accent picker instead of being frozen at render time. */
    grid.innerHTML = PROJECTS.map(function (p, i) {
      var haystack = (p.title + ' ' + p.blurb + ' ' + p.stack.join(' ') + ' ' +
        (p.platforms || []).join(' ') + ' ' + (p.features || []).join(' ')).toLowerCase();
      return '' +
        '<article class="project reveal' + (p.featured ? ' is-featured' : '') +
          '" data-tags="' + esc(tagsOf(p).join(' ')) + '" data-id="' + esc(p.id) +
          '" style="--i:' + i + '" data-search="' + esc(haystack) + '">' +
          '<div class="project-cover">' + coverMarkup(p) + '</div>' +
          '<div class="project-body">' +
            '<h3>' + esc(p.title) + '</h3>' +
            '<p>' + esc(p.blurb) + '</p>' +
            '<div class="stack">' + stackMarkup(p) + '</div>' +
            '<div class="project-actions">' +
              linkMarkup(p) +
              '<button type="button" class="details-btn" data-id="' + esc(p.id) + '">' +
                'Details' + icon('arrow-right') +
                '<span class="sr-only"> about ' + esc(p.title) + '</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</article>';
    }).join('') + '<p class="empty-state" hidden>No projects match that search.</p>';

    var cards = $$('.project', grid);
    var empty = $('.empty-state', grid);
    var activeFilter = 'all';
    /* The first pass runs before initReveal observes the cards, so it
       must not mark them visible — that would skip the reveal entirely.
       Every later pass does, because a card re-shown by a filter change
       has already been unobserved and will never be revealed again. */
    var firstPass = true;

    function applyFilters() {
      var q = (search ? search.value : '').trim().toLowerCase();
      var shown = 0;

      cards.forEach(function (card) {
        var byTag = activeFilter === 'all' ||
          (' ' + card.dataset.tags + ' ').indexOf(' ' + activeFilter + ' ') !== -1;
        var byText = !q || card.dataset.search.indexOf(q) !== -1;
        var match = byTag && byText;
        var was = !card.classList.contains('is-hidden');

        card.classList.toggle('is-hidden', !match);
        if (!match) return;

        shown++;
        if (firstPass) return;
        card.classList.add('is-visible');

        /* A card arriving back into the grid gets its own short entrance,
           so a filter change reads as the set rearranging rather than as
           the page redrawing. Cards that were already there stay put —
           re-animating them would be motion with nothing behind it. */
        if (!was && !reduceMotion) {
          card.classList.remove('is-entering');
          /* Reading offsetWidth restarts the animation; without it the
             class goes back on in the same frame it came off and the
             browser never sees a change. */
          void card.offsetWidth;
          card.classList.add('is-entering');
        }
      });
      firstPass = false;

      if (empty) empty.hidden = shown > 0;
      if (count) {
        count.textContent = shown === cards.length
          ? 'Showing all ' + cards.length + ' projects'
          : 'Showing ' + shown + ' of ' + cards.length + ' projects';
      }
    }

    /* --- filters --- */
    if (filterBar) {
      /* Each chip carries its own count, so the visitor can see the
         shape of the work before clicking anything. Categories with no
         projects are dropped rather than offered as a dead end. */
      filterBar.innerHTML = FILTERS.map(function (f) {
        var n = f.key === 'all' ? PROJECTS.length : PROJECTS.filter(function (p) {
          return tagsOf(p).indexOf(f.key) !== -1;
        }).length;
        if (!n) return '';
        return '<button type="button" class="filter" data-filter="' + f.key +
          '" aria-pressed="' + (f.key === 'all') + '">' + esc(f.label) +
          '<span class="filter-count" aria-hidden="true">' + n + '</span></button>';
      }).join('');

      filterBar.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter');
        if (!btn) return;
        $$('.filter', filterBar).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        activeFilter = btn.dataset.filter;
        applyFilters();
      });
    }

    /* --- search, with "/" as a shortcut --- */
    if (search) {
      search.addEventListener('input', applyFilters);
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { search.value = ''; applyFilters(); search.blur(); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === '/' && !isTyping() && !overlayOpen()) {
          e.preventDefault();
          search.focus();
        }
      });
    }

    applyFilters();

    /* --- detail modal --- */
    var modal = $('#project-modal');
    if (!modal) return;
    var panel = $('.modal-panel', modal);
    var body = $('#modal-body');
    var lastFocused = null;

    var currentId = null;

    /* Prev / next walk the cards the visitor can currently see, so
       paging inside "Fintech" stays inside Fintech. A project opened
       from the command palette can be one the active filter hides; then
       the walk covers every project, or the counter would read "0 / 2"
       and paging would start from nowhere. */
    function visibleIds() {
      var ids = cards
        .filter(function (c) { return !c.classList.contains('is-hidden'); })
        .map(function (c) { return c.dataset.id; });
      if (currentId && ids.indexOf(currentId) === -1) {
        ids = PROJECTS.map(function (p) { return p.id; });
      }
      return ids;
    }

    function step(dir) {
      var ids = visibleIds();
      if (ids.length < 2) return;
      var at = ids.indexOf(currentId);
      renderModal(ids[(at + dir + ids.length) % ids.length]);
    }

    function renderModal(id) {
      var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
      if (!p) return false;
      currentId = id;

      var ids = visibleIds();
      var at = ids.indexOf(id);
      var labels = {};
      FILTERS.forEach(function (f) { labels[f.key] = f.label; });

      body.innerHTML =
        (p.image
          ? '<div class="modal-cover"><img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt || p.title) +
            '" width="800" height="450"><span class="cover-badge" aria-hidden="true">' + esc(p.emoji) + '</span></div>'
          : '') +
        '<div class="modal-meta">' +
          tagsOf(p).map(function (t) { return '<span>' + esc(labels[t] || t) + '</span>'; }).join('') +
          (p.platforms || []).map(function (t) { return '<span class="is-platform">' + esc(t) + '</span>'; }).join('') +
        '</div>' +
        '<h3 id="modal-title">' + esc(p.title) + '</h3>' +
        '<p class="modal-blurb">' + esc(p.blurb) + '</p>' +
        '<div class="stack">' + stackMarkup(p) + '</div>' +
        (p.features && p.features.length
          ? '<h4 class="modal-sub">Key features</h4><ul class="feature-list">' +
              p.features.map(function (f) { return '<li>' + icon('check') + '<span>' + esc(f) + '</span></li>'; }).join('') +
            '</ul>'
          : '') +
        '<dl>' +
          '<div><dt>The problem</dt><dd>' + esc(p.problem) + '</dd></div>' +
          '<div><dt>My role</dt><dd>' + esc(p.role) + '</dd></div>' +
          '<div><dt>Outcome</dt><dd>' + esc(p.outcome) + '</dd></div>' +
        '</dl>' +
        '<div class="modal-actions">' +
          (p.demo ? '<a class="btn btn-sm" data-ripple href="' + esc(p.demo) + '" target="_blank" rel="noopener noreferrer">' + icon('external') + 'View Live</a>' : '') +
          '<a class="btn btn-sm" data-ripple href="#contact" data-close-modal>' + icon('message') + 'Ask me for a demo</a>' +
        '</div>' +
        (ids.length > 1
          ? '<nav class="modal-nav" aria-label="Other projects">' +
              '<button type="button" data-step="-1">' + icon('arrow-right') + 'Previous</button>' +
              '<span>' + (at + 1) + ' / ' + ids.length + '</span>' +
              '<button type="button" data-step="1">Next' + icon('arrow-right') + '</button>' +
            '</nav>'
          : '');

      panel.scrollTop = 0;
      return true;
    }

    function openModal(id) {
      if (!renderModal(id)) return;
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      modal.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      $('.modal-close', modal).focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      /* Focus has to leave before aria-hidden goes on, or the element
         holding focus is one a screen reader has been told to ignore. */
      if (lastFocused && lastFocused.focus) lastFocused.focus();
      modal.setAttribute('aria-hidden', 'true');
    }

    /* The whole card opens the story, not just the small Details link —
       except when the click was on a real link inside it. */
    grid.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var card = e.target.closest('.project');
      if (card) openModal(card.dataset.id);
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.modal-close')) { closeModal(); return; }
      var stepBtn = e.target.closest('[data-step]');
      if (stepBtn) {
        step(+stepBtn.dataset.step);
        var again = $('[data-step="' + stepBtn.dataset.step + '"]', modal);
        /* Keep the new project's cover in view rather than letting
           focus drag the panel down to the button. */
        if (again) again.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest('[data-close-modal]')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      /* The palette can be opened on top of the modal; its keys are its own. */
      if (document.querySelector('.palette.is-open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        step(e.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (e.key !== 'Tab') return;

      /* Keep tab focus inside the dialog while it is open. */
      var focusable = $$('a[href], button, input, textarea, [tabindex]:not([tabindex="-1"])', panel)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ==========================================================
     11. COPY-TO-CLIPBOARD
     ========================================================== */
  function initCopy() {
    $$('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var use = btn.querySelector('use');

        /* The button flips to a tick AND a toast fires: the tick says
           which button worked, the toast says what landed on the
           clipboard. Neither alone answers both questions. */
        copyText(btn.dataset.copy || '', btn.dataset.toast || 'Copied', function () {
          btn.classList.add('is-done');
          if (use) use.setAttribute('href', '#i-check');
          btn.setAttribute('aria-label', 'Copied');
          setTimeout(function () {
            btn.classList.remove('is-done');
            if (use) use.setAttribute('href', '#i-copy');
            btn.setAttribute('aria-label', btn.dataset.label || 'Copy');
          }, 1800);
        });
      });
    });
  }

  /* ==========================================================
     12. CONTACT FORM
     ========================================================== */
  function initForm() {
    var form = $('#contactForm');
    if (!form) return;
    var status = $('#form-status');
    var submit = $('button[type="submit"]', form);
    var counter = $('#msg-counter');

    var RULES = {
      name: function (v) {
        if (!v.trim()) return 'Please enter your name.';
        if (v.trim().length < 2) return 'That name looks too short.';
        return '';
      },
      email: function (v) {
        if (!v.trim()) return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Please enter a valid email address.';
        return '';
      },
      message: function (v) {
        if (!v.trim()) return 'Please write a message.';
        if (v.trim().length < 10) return 'Please add a little more detail (10+ characters).';
        return '';
      }
    };

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input, show) {
      var rule = RULES[input.name];
      if (!rule) return true;
      var msg = rule(input.value);
      var wrap = fieldOf(input);
      var err = $('.error-msg', wrap);

      if (msg && show) {
        wrap.classList.add('has-error');
        wrap.classList.remove('is-valid');
        input.setAttribute('aria-invalid', 'true');
        if (err) err.textContent = msg;
      } else {
        wrap.classList.remove('has-error');
        wrap.classList.toggle('is-valid', !msg && input.value.length > 0);
        input.removeAttribute('aria-invalid');
        if (err) err.textContent = '';
      }
      return !msg;
    }

    var inputs = $$('input, textarea', form).filter(function (i) { return RULES[i.name]; });

    inputs.forEach(function (input) {
      /* Validate on blur, then live-correct once the field has errored,
         so nobody is scolded mid-word on their first pass. */
      input.addEventListener('blur', function () { validate(input, true); });
      input.addEventListener('input', function () {
        if (fieldOf(input).classList.contains('has-error')) validate(input, true);
        else validate(input, false);
      });
    });

    /* live character counter */
    var message = form.elements.message;
    if (counter && message) {
      var max = parseInt(message.getAttribute('maxlength'), 10) || 600;
      var updateCount = function () {
        counter.textContent = message.value.length + ' / ' + max;
        counter.classList.toggle('is-near', message.value.length > max * 0.9);
      };
      message.addEventListener('input', updateCount);
      updateCount();
    }

    function setStatus(text, kind, announce) {
      status.textContent = text;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
      /* The inline status is the record; the toast is the notification.
         Only outcomes get one — not the "please fix this" nudge, which
         is already sitting next to the field it is about. */
      if (announce) toast(text, kind === 'bad' ? 'alert' : 'check', kind === 'bad' ? 'error' : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var ok = true, firstBad = null;
      inputs.forEach(function (input) {
        var valid = validate(input, true);
        if (!valid && !firstBad) firstBad = input;
        ok = ok && valid;
      });

      if (!ok) {
        setStatus('Please fix the highlighted fields.', 'bad');
        if (firstBad) firstBad.focus();
        return;
      }

      /* form.elements, not form.name — HTMLFormElement already has a
         .name property, which would shadow the input. */
      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        message: form.elements.message.value.trim()
      };

      if (!FORM_ENDPOINT) {
        /* No backend configured — hand the message to the visitor's
           mail client rather than pretending it was sent. */
        var subject = encodeURIComponent('Portfolio enquiry from ' + data.name);
        var mailBody = encodeURIComponent(data.message + '\n\n—\n' + data.name + '\n' + data.email);
        window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + mailBody;
        setStatus('Opening your email app with the message ready to send…');
        return;
      }

      submit.disabled = true;
      var label = submit.innerHTML;
      submit.textContent = 'Sending…';
      setStatus('');

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Bad response');
          form.reset();
          $$('.field', form).forEach(function (f) { f.classList.remove('is-valid', 'has-error'); });
          setStatus('Thanks — your message is on its way. I usually reply within a day.', 'ok', true);
        })
        .catch(function () {
          setStatus('Sorry, that did not send. Please email ' + CONTACT_EMAIL + ' directly.', 'bad', true);
        })
        .then(function () {
          submit.disabled = false;
          submit.innerHTML = label;
        });
    });
  }

  /* ==========================================================
     13. HUMAN TOUCHES — greeting, Jeff's local clock
     ========================================================== */
  function initGreeting() {
    var el = $('#greeting');
    if (!el) return;
    /* Greets by the VISITOR's clock, so it reads right wherever
       they are. Jeff's own time is shown separately below. */
    var h = new Date().getHours();
    var word = h < 5 ? 'Still up' :
               h < 12 ? 'Good morning' :
               h < 17 ? 'Good afternoon' :
               h < 22 ? 'Good evening' : 'Working late';
    el.textContent = word;
  }

  function initLocalClock() {
    var el = $('#local-clock');
    if (!el) return;

    function tick() {
      var now;
      try {
        /* Africa/Nairobi is the IANA zone for all of Kenya (Thika
           included): UTC+3, no DST. */
        now = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit', minute: '2-digit', hour12: true,
          timeZone: 'Africa/Nairobi'
        }).format(new Date());
      } catch (e) {
        /* Fallback if the runtime has no tz database. */
        var d = new Date();
        var nbo = new Date(d.getTime() + (d.getTimezoneOffset() + 180) * 60000);
        var hh = nbo.getHours(), mm = String(nbo.getMinutes()).padStart(2, '0');
        var ap = hh >= 12 ? 'pm' : 'am';
        now = ((hh % 12) || 12) + ':' + mm + ' ' + ap;
      }
      el.textContent = now;
      /* <time> without a datetime attribute has to contain a valid time
         string, and "10:24 pm" is not one — so supply it explicitly. */
      if (el.tagName === 'TIME') {
        var utc = new Date();
        var nboMin = utc.getUTCHours() * 60 + utc.getUTCMinutes() + 180;
        var h24 = Math.floor(nboMin / 60) % 24;
        el.setAttribute('datetime',
          String(h24).padStart(2, '0') + ':' + String(nboMin % 60).padStart(2, '0') + '+03:00');
      }
    }
    tick();
    setInterval(tick, 30000);
  }

  /* ==========================================================
     14. HERO PARALLAX + SCROLL CUE
     ========================================================== */
  function initHero() {
    var bg = $('#hero-bg');
    var cue = $('#scroll-cue');
    var hero = $('.hero');
    if (!hero) return;

    /* Parallax is a pointer-era flourish; skip it when motion is
       reduced, and skip on touch where it costs more than it gives. */
    var wantsParallax = bg && !reduceMotion && finePointer;
    var ticking = false;

    /* .hero-bg is inset by -6% top and bottom, so 6% of the hero's
       height is all the travel there is. The old factor of 0.32
       exhausted that within the first 200px of scroll and then kept
       going, dragging the photo's top edge down into the frame and
       leaving a band of bare page above it. */
    var HEADROOM = 0.06;

    function update() {
      var y = window.scrollY;
      var h = hero.offsetHeight;
      if (wantsParallax && y < h) {
        var shift = Math.min(y * 0.32, h * HEADROOM);
        bg.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
      }
      if (cue) {
        var fade = Math.max(0, 1 - y / 260);
        cue.style.opacity = fade;
        cue.style.pointerEvents = fade < 0.1 ? 'none' : '';
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ==========================================================
     15. FOOTER YEAR
     ========================================================== */
  function initYear() {
    var el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ==========================================================
     16. LIGHT / DARK THEME
     ----------------------------------------------------------
     The theme is already applied by the inline bootstrap in <head>
     before first paint — this module only owns the toggle, the
     persistence, and the browser-chrome colour. If the visitor has
     never chosen, we follow the OS and keep following it.
     ========================================================== */
  var THEME_CHROME = { dark: '#080b14', light: '#f4f7fc' };

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function paintChrome() {
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_CHROME[currentTheme()]);
  }

  function initThemeToggle() {
    var btn = $('#theme-toggle');
    paintChrome();
    if (!btn) return;

    function sync() {
      var light = currentTheme() === 'light';
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      paintChrome();
    }
    sync();

    function commit(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('jeff-theme', theme); } catch (e) {}
      sync();
    }

    /* Where the browser has the View Transitions API, the swap is a
       single circular wipe growing out of whatever was pressed, rather
       than a dozen background-colour transitions crossing at slightly
       different speeds. `origin` is the element the gesture came from;
       without one the wipe starts from the middle of the screen. */
    function setTheme(theme, announce, origin) {
      var root = document.documentElement;

      var run = function () { commit(theme); };

      if (!reduceMotion && typeof document.startViewTransition === 'function') {
        var box = origin && origin.getBoundingClientRect
          ? origin.getBoundingClientRect()
          : null;
        var x = box ? box.left + box.width / 2 : window.innerWidth / 2;
        var y = box ? box.top + box.height / 2 : window.innerHeight / 2;

        /* Radius to the furthest corner, so the circle always finishes
           by covering the viewport rather than stopping short of it. */
        var r = Math.hypot(Math.max(x, window.innerWidth - x),
                           Math.max(y, window.innerHeight - y));

        root.style.setProperty('--vt-x', x + 'px');
        root.style.setProperty('--vt-y', y + 'px');
        root.style.setProperty('--vt-r', Math.ceil(r) + 'px');
        root.classList.add('is-vt');

        var vt = document.startViewTransition(run);
        vt.finished
          .catch(function () {})
          .then(function () { root.classList.remove('is-vt'); });
      } else {
        run();
      }

      if (announce) toast(theme === 'light' ? 'Light theme' : 'Dark theme', 'sun');
    }

    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'light' ? 'dark' : 'light', true, btn);
    });

    /* Keep following the OS until the visitor states a preference. */
    var os = window.matchMedia('(prefers-color-scheme: light)');
    var follow = function (e) {
      var chosen = null;
      try { chosen = localStorage.getItem('jeff-theme'); } catch (err) {}
      if (chosen) return;
      document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
      sync();
    };
    if (os.addEventListener) os.addEventListener('change', follow);
    else if (os.addListener) os.addListener(follow);

    /* Shift+D anywhere outside a text field. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'D' || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping()) return;
      e.preventDefault();
      setTheme(currentTheme() === 'light' ? 'dark' : 'light', true, btn);
    });

    THEME_SET = setTheme;
  }

  /* Set once initThemeToggle runs, so the palette can drive the theme
     without either module reaching into the other's DOM. */
  var THEME_SET = function (theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('jeff-theme', theme); } catch (e) {}
  };

  /* ==========================================================
     17. AT-A-GLANCE COUNTERS
     ----------------------------------------------------------
     Every figure is counted from what is actually on the page, so a
     new project or a new skill tag updates the number by itself and
     none of them can quietly become a claim the page cannot back up.
     ========================================================== */
  function initStats() {
    var host = $('#hero-stats');
    if (!host) return;

    var domains = {};
    PROJECTS.forEach(function (p) {
      tagsOf(p).forEach(function (t) { domains[t] = true; });
    });

    /* Prose elsewhere on the page that quotes the project count. */
    $$('[data-project-count]').forEach(function (el) { el.textContent = PROJECTS.length; });

    /* One key per tool, however it is spelled: the skills list says
       "HTML5" and "MikroTik RouterOS" where a project says "HTML" and
       "MikroTik", and counting both would inflate the figure. */
    function toolKey(name) {
      return name.toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/\b(api|routeros|basics)\b/g, '')
        .replace(/[^a-z0-9+#]/g, '')
        .replace(/(html|css)\d+$/, '$1');
    }
    var stack = {};
    PROJECTS.forEach(function (p) {
      p.stack.forEach(function (s) { stack[toolKey(s)] = true; });
    });
    $$('#skills .tag').forEach(function (t) {
      stack[toolKey(t.textContent.trim())] = true;
    });

    var STATS = [
      { n: PROJECTS.length,               label: 'Projects shipped' },
      { n: Object.keys(stack).length,     label: 'Tools & languages', plus: true },
      { n: Object.keys(domains).length,   label: 'Domains covered' },
      { n: 24,                            label: 'Typical reply', suffix: 'h' }
    ];

    host.innerHTML = STATS.map(function (s) {
      return '<div class="hero-stat" role="listitem">' +
        '<b data-to="' + s.n + '"' +
          (s.plus ? ' data-suffix="+"' : '') +
          (s.suffix ? ' data-suffix="' + s.suffix + '"' : '') +
        '>0</b>' +
        '<span>' + s.label + '</span>' +
      '</div>';
    }).join('');

    var nums = $$('b[data-to]', host);

    function paint(el, value) {
      el.textContent = value + (el.dataset.suffix || '');
    }

    /* Counting up is the whole point of the component, but it is also
       pure decoration — anyone who asked for less motion just gets the
       final number. */
    if (reduceMotion || !('IntersectionObserver' in window)) {
      nums.forEach(function (el) { paint(el, +el.dataset.to); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);

        var el = entry.target;
        var target = +el.dataset.to;
        var start = null;
        var DURATION = 1100;

        (function step(now) {
          if (start === null) start = now;
          var t = Math.min((now - start) / DURATION, 1);
          /* ease-out: fast off the mark, settling on the number */
          paint(el, Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) window.requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     18. COMMAND PALETTE  (Ctrl / Cmd + K)
     ----------------------------------------------------------
     One searchable list over every section, every project and the
     handful of actions worth a shortcut. Built from the same data
     the page renders from, so it can never list something that is
     not there.
     ========================================================== */
  function initPalette() {
    var root = $('#palette');
    var input = $('#palette-input');
    var list = $('#palette-list');
    var opener = $('#palette-btn');
    if (!root || !input || !list) return;

    var lastFocused = null;
    var active = 0;
    var visible = [];

    function go(hash) {
      return function () {
        var el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        /* Chrome refuses replaceState on a file:// document (origin
           'null'), so the scroll must not depend on the URL update. */
        try { history.replaceState(null, '', hash); } catch (e) {}
      };
    }

    var COMMANDS = [];

    $$('#primary-nav a[href^="#"]').forEach(function (a) {
      var hash = a.getAttribute('href');
      COMMANDS.push({
        group: 'Go to',
        icon: 'arrow-right',
        label: a.textContent.trim(),
        hint: hash,
        run: go(hash)
      });
    });

    PROJECTS.forEach(function (p) {
      COMMANDS.push({
        group: 'Projects',
        icon: 'layers',
        label: p.title,
        hint: p.stack.join(' · '),
        keywords: p.stack.join(' ') + ' ' + p.blurb,
        run: function () {
          /* If the active filter or search hides this card, clear them so
             the visitor lands on a grid that actually contains it. */
          var card = document.querySelector('.project[data-id="' + p.id + '"]');
          if (card && card.classList.contains('is-hidden')) {
            var all = document.querySelector('.filter[data-filter="all"]');
            var search = document.getElementById('project-search');
            if (search && search.value) {
              search.value = '';
              search.dispatchEvent(new Event('input'));
            }
            if (all) all.click();
          }
          go('#projects')();
          /* Let the scroll start before the dialog takes focus back. */
          setTimeout(function () {
            var btn = document.querySelector('.details-btn[data-id="' + p.id + '"]');
            if (btn) btn.click();
          }, reduceMotion ? 0 : 420);
        }
      });
    });

    COMMANDS.push(
      {
        group: 'Actions', icon: 'mail', label: 'Email Jeff',
        hint: CONTACT_EMAIL,
        run: function () { window.location.href = 'mailto:' + CONTACT_EMAIL; }
      },
      {
        group: 'Actions', icon: 'copy', label: 'Copy email address',
        hint: CONTACT_EMAIL, keywords: 'clipboard address',
        run: function () { copyText(CONTACT_EMAIL, 'Email address copied'); }
      },
      {
        group: 'Actions', icon: 'copy', label: 'Copy phone number',
        hint: '+254 707 739 557', keywords: 'clipboard tel',
        run: function () { copyText('+254707739557', 'Phone number copied'); }
      },
      {
        group: 'Actions', icon: 'download', label: 'Download CV',
        hint: 'DOCX', keywords: 'resume curriculum vitae',
        run: function () {
          var a = document.createElement('a');
          a.href = 'Jeff%20CV.docx';
          a.download = '';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      },
      {
        group: 'Actions', icon: 'github', label: 'Open GitHub',
        hint: 'New tab', keywords: 'code source repository',
        run: function () { window.open('https://github.com/JeffBoss315', '_blank', 'noopener'); }
      },
      {
        group: 'Actions', icon: 'linkedin', label: 'Open LinkedIn',
        hint: 'New tab', keywords: 'profile hire cv',
        run: function () { window.open('https://www.linkedin.com/in/jeff-boss-301366264/', '_blank', 'noopener'); }
      },
      {
        group: 'Appearance', icon: 'sun', label: 'Switch theme',
        hint: 'Shift D', keywords: 'light dark mode toggle',
        run: function () {
          var next = currentTheme() === 'light' ? 'dark' : 'light';
          THEME_SET(next);
          toast(next === 'light' ? 'Light theme' : 'Dark theme', 'sun');
        }
      }
    );

    ACCENTS.forEach(function (a) {
      COMMANDS.push({
        group: 'Appearance', icon: 'palette', label: 'Accent — ' + a.name,
        hint: 'Colour', keywords: 'theme colour accent',
        run: function () { applyAccent(a); toast(a.name + ' accent', 'palette'); }
      });
    });

    COMMANDS.forEach(function (c) {
      c.haystack = (c.label + ' ' + (c.hint || '') + ' ' + (c.keywords || '') + ' ' + c.group).toLowerCase();
    });

    function render(q) {
      q = q.trim().toLowerCase();
      visible = q ? COMMANDS.filter(function (c) { return c.haystack.indexOf(q) !== -1; }) : COMMANDS.slice();

      if (!visible.length) {
        list.innerHTML = '<p class="palette-empty">Nothing matches “' + esc(q) + '”.</p>';
        return;
      }

      var html = '', group = null;
      visible.forEach(function (c, i) {
        if (c.group !== group) {
          group = c.group;
          html += '<p class="palette-group">' + esc(group) + '</p>';
        }
        html += '<button type="button" class="palette-item" role="option" ' +
          'aria-selected="false" data-i="' + i + '" id="pal-' + i + '">' +
          icon(c.icon) + '<span>' + esc(c.label) + '</span>' +
          (c.hint ? '<small>' + esc(c.hint) + '</small>' : '') +
        '</button>';
      });
      list.innerHTML = html;
      setActive(0);
    }

    function setActive(i) {
      if (!visible.length) return;
      active = (i + visible.length) % visible.length;
      $$('.palette-item', list).forEach(function (el) {
        var on = +el.dataset.i === active;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', String(on));
        if (on) {
          el.scrollIntoView({ block: 'nearest' });
          input.setAttribute('aria-activedescendant', el.id);
        }
      });
    }

    function open() {
      lastFocused = document.activeElement;
      root.classList.add('is-open');
      root.removeAttribute('aria-hidden');
      document.body.style.overflow = 'hidden';
      input.value = '';
      render('');
      input.focus();
    }

    function close() {
      root.classList.remove('is-open');
      document.body.style.overflow = '';
      input.removeAttribute('aria-activedescendant');
      /* Same ordering as the project modal: move focus, then hide. */
      if (lastFocused && lastFocused.focus) lastFocused.focus();
      root.setAttribute('aria-hidden', 'true');
    }

    function runActive() {
      var c = visible[active];
      if (!c) return;
      close();
      c.run();
    }

    if (opener) opener.addEventListener('click', open);

    input.addEventListener('input', function () { render(input.value); });

    list.addEventListener('click', function (e) {
      var item = e.target.closest('.palette-item');
      if (!item) return;
      setActive(+item.dataset.i);
      runActive();
    });
    list.addEventListener('pointermove', function (e) {
      var item = e.target.closest('.palette-item');
      if (item && +item.dataset.i !== active) setActive(+item.dataset.i);
    });

    document.addEventListener('keydown', function (e) {
      var isOpen = root.classList.contains('is-open');
      var k = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && k === 'k') {
        e.preventDefault();
        isOpen ? close() : open();
        return;
      }
      if (!isOpen) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); return; }
      if (e.key === 'Home') { e.preventDefault(); setActive(0); return; }
      if (e.key === 'End') { e.preventDefault(); setActive(visible.length - 1); return; }
      if (e.key === 'Enter') { e.preventDefault(); runActive(); return; }
      /* Focus never leaves the input, so Tab has nowhere useful to go. */
      if (e.key === 'Tab') e.preventDefault();
    });

    root.addEventListener('pointerdown', function (e) {
      if (e.target === root) close();
    });
  }

  /* ---------- boot ----------
     Each module is isolated: if one throws, the rest still run and
     the failure is reported instead of silently killing the page. */
  function init() {
    var modules = [
      ['preloader', initPreloader],
      ['theme', initTheme],
      ['theme-toggle', initThemeToggle],
      ['palette', initPalette],
      ['nav', initNav],
      ['scroll', initScroll],
      ['greeting', initGreeting],
      ['clock', initLocalClock],
      ['hero', initHero],
      ['typing', initTyping],
      ['projects', initProjects],
      ['stats', initStats],         /* after projects, so it can count them */
      ['reveal', initReveal],       /* after projects, so cards get observed */
      ['spotlight', initSpotlight],
      ['tilt', initTilt],
      ['magnetic', initMagnetic],
      ['ripple', initRipple],
      ['copy', initCopy],
      ['form', initForm],
      ['year', initYear]
    ];

    modules.forEach(function (m) {
      try {
        m[1]();
      } catch (err) {
        console.error('[portfolio] "' + m[0] + '" failed to start:', err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
