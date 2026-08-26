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

       demo  : live URL.  Leave '' and no "Live Demo" link renders.
       repo  : source URL. Leave '' and no "Code" link renders.
       image : screenshot path e.g. 'img/hospital.png'.
               Leave '' to fall back to the generated gradient cover.

     Empty strings are deliberate — a missing link beats a link
     that goes nowhere.
     ========================================================== */
  var PROJECTS = [
    {
      id: 'movixa',
      title: 'MOVIXA — Movie Discovery Hub',
      tag: 'web',
      emoji: '🎬',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Cinema seats facing a lit screen',
      blurb: 'Film discovery app with trending and top-rated rails, trailer playback, cast and crew pages, a saved watchlist and free public-domain features streamed from the Internet Archive.',
      stack: ['JavaScript', 'TMDB API', 'Internet Archive', 'CSS'],
      problem: 'Deciding what to watch means bouncing between listing sites, trailer searches and whichever service actually carries the film.',
      role: 'Sole developer — API layer, UI, and the watchlist and playback logic.',
      outcome: 'One page covers browsing, search, trailers, watch-provider links and a persisted watchlist, with public-domain titles playable in place.',
      demo: 'https://jeffboss315.github.io/moviehub/',
      repo: 'https://github.com/JeffBoss315/moviehub'
    },
    {
      id: 'hospital',
      title: 'Hospital Management System',
      tag: 'software',
      emoji: '🏥',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Hospital corridor',
      blurb: 'Desktop system for patient records, appointments and billing, built for a clinic front desk with no prior digital records.',
      stack: ['Python', 'Tkinter', 'SQLite'],
      problem: 'Patient files were kept on paper, so retrieving a history took minutes and records were regularly mislaid.',
      role: 'Sole developer — schema design, UI, and the reporting layer.',
      outcome: 'Record lookup dropped from minutes to seconds, with appointment and billing history stored against each patient.',
      demo: '',
      repo: ''
    },
    {
      id: 'diagnosis',
      title: 'Disease Diagnosis Expert System',
      tag: 'ai',
      emoji: '🩺',
      image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Doctor holding a stethoscope',
      blurb: 'Rule-based expert system that narrows a likely diagnosis from reported symptoms and explains the reasoning behind each result.',
      stack: ['Python', 'Expert System', 'Rule Engine'],
      problem: 'Rural clinics have limited access to diagnostic specialists for a first-pass triage.',
      role: 'Designed the rule base and the forward-chaining inference engine.',
      outcome: 'Returns a ranked shortlist with the rules that fired, so the output can be checked rather than blindly trusted.',
      demo: '',
      repo: ''
    },
    {
      id: 'agriculture',
      title: 'Smart Agriculture System',
      tag: 'ai',
      emoji: '🌱',
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Farmland crop rows',
      blurb: 'Advises smallholder farmers on crop selection and irrigation timing from soil and weather inputs.',
      stack: ['Python', 'Machine Learning', 'Data Analysis'],
      problem: 'Planting decisions were made on habit rather than current soil and rainfall conditions.',
      role: 'Data pipeline, model training, and the recommendation interface.',
      outcome: 'Produces a per-season planting and watering recommendation from local conditions.',
      demo: '',
      repo: ''
    },
    {
      id: 'logistics',
      title: 'HeavyLine Logistics VTC',
      tag: 'web',
      emoji: '🚚',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Haulage truck on the road',
      blurb: 'Public site for a virtual trucking company — driver roster, event calendar and application flow for an active member community.',
      stack: ['HTML', 'CSS', 'JavaScript'],
      problem: 'The community coordinated entirely through chat, so new drivers had nowhere to find rules, events or how to join.',
      role: 'Design and front-end build.',
      outcome: 'A single public home for recruitment and events, replacing scattered chat messages.',
      demo: '',
      repo: ''
    },
    {
      id: 'weather',
      title: 'Weather Forecast App',
      tag: 'web',
      emoji: '🌦',
      image: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Clouds gathering in a bright sky',
      blurb: 'Live forecast app with city search, current conditions and a multi-day outlook, consuming the OpenWeather API.',
      stack: ['JavaScript', 'REST API', 'CSS'],
      problem: 'A build to practise consuming a third-party API and handling real-world loading and error states.',
      role: 'Sole developer.',
      outcome: 'Handles network failure, empty search and unknown-city responses without breaking the interface.',
      demo: '',
      repo: ''
    },
    {
      id: 'school',
      title: 'School Management System',
      tag: 'software',
      emoji: '🏫',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=70',
      imageAlt: 'Empty school classroom',
      blurb: 'Desktop application covering student enrolment, class assignment, grade entry and printable report cards.',
      stack: ['Java', 'MySQL'],
      problem: 'Termly report cards were compiled by hand across several spreadsheets.',
      role: 'Sole developer — database design and application build.',
      outcome: 'Report card generation moved from a multi-day manual job to a single print action.',
      demo: '',
      repo: ''
    }
  ];

  var FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'web', label: 'Web' },
    { key: 'software', label: 'Software' },
    { key: 'ai', label: 'AI' }
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

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('nav-open'));
    });
    if (backdrop) backdrop.addEventListener('click', function () { setOpen(false); });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Reset if the viewport grows past the mobile breakpoint.
       addListener is the deprecated fallback for older Safari. */
    var mq = window.matchMedia('(min-width: 861px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
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
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
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

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
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

  function initTilt() {
    if (!finePointer || reduceMotion) return;

    $$('[data-tilt]').forEach(function (el) {
      var max = 6;

      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        /* A running CSS animation outranks an inline style on the same
           property, so the avatar's float would swallow the tilt.
           Suspend it for as long as the pointer is on the element. */
        el.style.animation = 'none';
        el.style.transition = 'transform .12s linear';
        el.style.transform =
          'perspective(900px) rotateX(' + (-py * max).toFixed(2) + 'deg) ' +
          'rotateY(' + (px * max).toFixed(2) + 'deg) translateY(-6px)';
      });

      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
        el.style.transform = '';
        el.style.animation = '';
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
        el.style.transform = 'translate(' + dx * 0.3 + 'px,' + dy * 0.3 + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = '';
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
  function coverMarkup(p) {
    /* With no image the gradient background on .project-cover shows
       through, so the emoji is the fallback rather than a blank box. */
    if (!p.image) {
      return '<span class="cover-emoji" aria-hidden="true">' + p.emoji + '</span>';
    }
    return '<img src="' + p.image + '" alt="' + (p.imageAlt || p.title) +
      '" loading="lazy" width="800" height="450">' +
      '<span class="cover-badge" aria-hidden="true">' + p.emoji + '</span>';
  }

  function stackMarkup(p) {
    return p.stack.map(function (s) { return '<span>' + s + '</span>'; }).join('');
  }

  function linkMarkup(p) {
    var out = '';
    if (p.demo) {
      out += '<a href="' + p.demo + '" target="_blank" rel="noopener noreferrer">' +
        icon('external') + 'Live Demo<span class="sr-only"> for ' + p.title +
        ' (opens in a new tab)</span></a>';
    }
    if (p.repo) {
      out += '<a href="' + p.repo + '" target="_blank" rel="noopener noreferrer">' +
        icon('github') + 'Code<span class="sr-only"> for ' + p.title +
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
      var haystack = (p.title + ' ' + p.blurb + ' ' + p.stack.join(' ')).toLowerCase();
      return '' +
        '<article class="project reveal" data-tag="' + p.tag + '" data-id="' + p.id +
          '" style="--i:' + i + '" data-search="' + esc(haystack) + '">' +
          '<div class="project-cover">' + coverMarkup(p) + '</div>' +
          '<div class="project-body">' +
            '<h3>' + p.title + '</h3>' +
            '<p>' + p.blurb + '</p>' +
            '<div class="stack">' + stackMarkup(p) + '</div>' +
            '<div class="project-actions">' +
              linkMarkup(p) +
              '<button type="button" class="details-btn" data-id="' + p.id + '">' +
                'Details' + icon('arrow-right') +
                '<span class="sr-only"> about ' + p.title + '</span>' +
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
        var byTag = activeFilter === 'all' || card.dataset.tag === activeFilter;
        var byText = !q || card.dataset.search.indexOf(q) !== -1;
        var match = byTag && byText;
        card.classList.toggle('is-hidden', !match);
        if (match) {
          shown++;
          if (!firstPass) card.classList.add('is-visible');
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
      filterBar.innerHTML = FILTERS.map(function (f, i) {
        return '<button type="button" class="filter" data-filter="' + f.key +
          '" aria-pressed="' + (i === 0) + '">' + f.label + '</button>';
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
        if (e.key === '/' && !isTyping()) {
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

    function openModal(id) {
      var p = PROJECTS.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      lastFocused = document.activeElement;

      body.innerHTML =
        '<h3 id="modal-title">' + p.title + '</h3>' +
        '<div class="stack">' + stackMarkup(p) + '</div>' +
        '<dl>' +
          '<div><dt>The problem</dt><dd>' + p.problem + '</dd></div>' +
          '<div><dt>My role</dt><dd>' + p.role + '</dd></div>' +
          '<div><dt>Outcome</dt><dd>' + p.outcome + '</dd></div>' +
        '</dl>' +
        (p.demo || p.repo
          ? '<div class="modal-actions">' +
              (p.demo ? '<a class="btn btn-sm" href="' + p.demo + '" target="_blank" rel="noopener noreferrer">View Live</a>' : '') +
              (p.repo ? '<a class="btn-outline btn-sm" href="' + p.repo + '" target="_blank" rel="noopener noreferrer">View Code</a>' : '') +
            '</div>'
          : '');

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

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.details-btn');
      if (btn) openModal(btn.dataset.id);
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.modal-close')) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeModal(); return; }
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
        /* Africa/Nairobi is UTC+3 and observes no DST. */
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

    function update() {
      var y = window.scrollY;
      var h = hero.offsetHeight;
      if (wantsParallax && y < h) bg.style.transform = 'translate3d(0,' + (y * 0.32) + 'px,0)';
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

    function setTheme(theme, announce) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('jeff-theme', theme); } catch (e) {}
      sync();
      if (announce) toast(theme === 'light' ? 'Light theme' : 'Dark theme', 'sun');
    }

    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
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
      setTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
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
    PROJECTS.forEach(function (p) { domains[p.tag] = true; });

    var stack = {};
    PROJECTS.forEach(function (p) {
      p.stack.forEach(function (s) { stack[s.toLowerCase()] = true; });
    });
    $$('#skills .tag').forEach(function (t) {
      stack[t.textContent.trim().toLowerCase()] = true;
    });

    var STATS = [
      { n: PROJECTS.length,               label: 'Projects shipped' },
      { n: Object.keys(stack).length,     label: 'Tools & languages', plus: true },
      { n: Object.keys(domains).length,   label: 'Domains covered' },
      { n: 24,                            label: 'Typical reply', suffix: 'h' }
    ];

    host.innerHTML = STATS.map(function (s) {
      return '<div class="hero-stat">' +
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
