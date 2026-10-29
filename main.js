// Header: show the small logo once the big one has scrolled away.
(function () {
  var bar = document.getElementById('bar');
  var hero = document.querySelector('.front__logo');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-stuck', !entries[0].isIntersecting);
    }, { rootMargin: '-60px 0px 0px 0px' }).observe(hero);
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Estimate form: no server needed. Builds an email with the details filled in.
  var form = document.getElementById('estimate-form');
  var note = document.getElementById('form-note');
  if (!form) return;
  var noteDefault = note.innerHTML;
  var f = form.elements;

  var nameEl = f.namedItem('name'), phoneEl = f.namedItem('phone');
  var phoneOk = function (v) { return v.replace(/\D/g, '').length >= 10; };
  var problem = function () {
    var name = nameEl.value.trim(), phone = phoneEl.value.trim();
    if (!name && !phone) return 'Add your name and phone number so Vinson can get back to you.';
    if (!name) return 'Add your name so Vinson can get back to you.';
    if (!phone) return 'Add your phone number so Vinson can get back to you.';
    if (!phoneOk(phone)) return 'That phone number looks short. Include the area code so Vinson can call back.';
    return '';
  };
  var markFields = function () {
    nameEl.setAttribute('aria-invalid', nameEl.value.trim() ? 'false' : 'true');
    phoneEl.setAttribute('aria-invalid', phoneOk(phoneEl.value) ? 'false' : 'true');
  };

  // Once an error is showing, clear it as soon as the fields are fixed.
  [nameEl, phoneEl].forEach(function (el) {
    el.addEventListener('input', function () {
      if (!note.classList.contains('is-error')) return;
      markFields();
      var msg = problem();
      // the note is a live region: only touch it when the message actually changes
      if (msg) { if (note.textContent !== msg) note.textContent = msg; return; }
      note.classList.remove('is-error');
      note.innerHTML = noteDefault;
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    [nameEl, phoneEl].forEach(function (el) { el.classList.add('touched'); });
    markFields();
    var msg = problem();
    if (msg) {
      note.classList.remove('is-sent');
      note.classList.add('is-error');
      note.textContent = msg;
      (nameEl.value.trim() ? phoneEl : nameEl).focus();
      return;
    }
    note.classList.remove('is-error');

    var name = nameEl.value.trim();
    var services = Array.prototype.slice.call(form.querySelectorAll('input[name="svc"]:checked'))
      .map(function (el) { return el.value; });
    var lines = [
      'Name: ' + name,
      'Phone: ' + phoneEl.value.trim(),
      'Location: ' + (f.namedItem('where').value.trim() || '-'),
      'Services: ' + (services.length ? services.join(', ') : '-'),
      '',
      f.namedItem('notes').value.trim()
    ];
    var subject = 'Free estimate request: ' + name;
    window.location.href = 'mailto:sochircavinson@gmail.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));

    // mailto gives no signal back, so say what should have happened and offer the fallback.
    note.classList.add('is-sent');
    note.innerHTML = '<strong>Your email app should be opening</strong> with everything filled in. Just press send. ' +
      'Nothing opened? Call or text <a href="tel:+15097705633">509-770-5633</a>.';
  });
})();

// Round 25 visual pass: rotator, scroll reveals, stacking steps.
// Everything here is gated so reduced-motion and no-IntersectionObserver users
// simply get the static site.
(function () {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* --- rotating serving city (homepage) */
  var rotator = document.querySelector('.rotator');
  if (rotator && !reduced) {
    var words = Array.prototype.slice.call(rotator.querySelectorAll('.rotator__word'));
    if (words.length > 1) {
      var idx = 0, timer = null;
      var show = function (n) {
        words.forEach(function (w, i) {
          w.classList.toggle('is-leaving', w.classList.contains('is-active') && i !== n);
          w.classList.toggle('is-active', i === n);
        });
      };
      var start = function () {
        if (timer || document.hidden) return;
        timer = window.setInterval(function () { idx = (idx + 1) % words.length; show(idx); }, 2600);
      };
      var stop = function () { window.clearInterval(timer); timer = null; };
      var host = rotator.closest('.front__serving') || rotator;
      host.addEventListener('mouseenter', stop);
      host.addEventListener('mouseleave', start);
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
      start();
    }
  }

  /* --- scroll reveals */
  if (hasIO && !reduced) {
    var baseSel = '.svc__row, .block, .faq__item, .glance, .tile, .cardback, .other, .cities li';
    var candidates = Array.prototype.slice.call(document.querySelectorAll(baseSel));
    Array.prototype.forEach.call(document.querySelectorAll('.eyebrow, h2'), function (el) {
      if (el.closest('.front, .phero, .split__head, .block, .tile, .cardback, .glance, .faq__item, .svc__row, .other, .steps--stack')) return;
      if (candidates.indexOf(el) === -1) candidates.push(el);
    });
    candidates = candidates.filter(function (el) {
      return !el.closest('.front') && !el.closest('.steps--stack') &&
        !el.classList.contains('split') && !el.classList.contains('split__head');
    });
    var parents = [], counts = [];
    candidates.forEach(function (el) {
      var p = parents.indexOf(el.parentNode);
      if (p === -1) { p = parents.push(el.parentNode) - 1; counts[p] = 0; }
      el.style.setProperty('--rv-delay', Math.min(counts[p] * 70, 280) + 'ms');
      counts[p]++;
      el.classList.add('rv');
    });
    var rvObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          rvObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    candidates.forEach(function (el) { rvObserver.observe(el); });
  }

  /* --- stacking steps: scale + dim covered cards (homepage) */
  var stackCards = Array.prototype.slice.call(document.querySelectorAll('.steps--stack li'));
  if (stackCards.length > 1 && !reduced) {
    var ticking = false;
    var updateStack = function () {
      ticking = false;
      for (var i = 0; i < stackCards.length - 1; i++) {
        var card = stackCards[i], next = stackCards[i + 1];
        var rect = card.getBoundingClientRect();
        var overlap = rect.bottom - next.getBoundingClientRect().top;
        var progress = Math.max(0, Math.min(overlap / Math.max(rect.height, 1), 1));
        card.style.transform = 'scale(' + (1 - 0.03 * progress) + ')';
        card.style.filter = 'brightness(' + (1 - 0.25 * progress) + ')';
      }
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateStack); }
    };
    var listening = false;
    var listen = function (on) {
      if (on === listening) return;
      listening = on;
      window[on ? 'addEventListener' : 'removeEventListener']('scroll', onScroll, { passive: true });
      window[on ? 'addEventListener' : 'removeEventListener']('resize', onScroll);
      if (on) onScroll();
    };
    if (hasIO) {
      new IntersectionObserver(function (entries) { listen(entries[0].isIntersecting); })
        .observe(stackCards[0].parentNode);
    } else {
      listen(true);
    }
  }
})();

// Squeegee glass: drag a real squeegee across a hazy window and the glass comes clean
// under the blade. The grime is a canvas painted once; every move erases the strip the
// blade swept, a tiny coverage canvas tracks progress, and a second canvas carries the
// water drips. Nothing animates while the window is idle.
(function () {
  var roots = document.querySelectorAll('[data-squeegee]');
  if (!roots.length) return;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // Small seeded random, so the grime looks the same after a resize or reset.
  function rng(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  // The squeegee: rubber blade on the right (its centre is the pivot), metal channel, blue grip.
  var TOOL_SVG =
    '<svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="ID-chan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c8792"/><stop offset=".3" stop-color="#eef2f5"/><stop offset=".55" stop-color="#a7b2bd"/><stop offset=".8" stop-color="#f7f9fb"/><stop offset="1" stop-color="#8a95a0"/></linearGradient>' +
    '<linearGradient id="ID-grip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38b0ff"/><stop offset="1" stop-color="#0069c9"/></linearGradient>' +
    '<linearGradient id="ID-handle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a414b"/><stop offset=".5" stop-color="#14171b"/><stop offset="1" stop-color="#0b0d10"/></linearGradient>' +
    '</defs>' +
    '<path d="M14 100 Q14 88 26 88 L150 91 L150 109 L26 112 Q14 112 14 100 Z" fill="url(#ID-handle)"/>' +
    '<rect x="44" y="88.6" width="70" height="22.8" rx="6" fill="url(#ID-grip)"/>' +
    '<g stroke="#0b5aa8" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M56 92 V108"/><path d="M68 92 V108"/><path d="M80 92 V108"/><path d="M92 92 V108"/><path d="M104 92 V108"/></g>' +
    '<path d="M48 92 H110" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".45"/>' +
    '<rect x="140" y="80" width="34" height="40" rx="7" fill="#1b1f25"/>' +
    '<rect x="146" y="86" width="22" height="4" rx="2" fill="#3a414b"/>' +
    '<rect x="166" y="4" width="22" height="192" rx="5" fill="url(#ID-chan)"/>' +
    '<rect x="165" y="2" width="24" height="10" rx="4" fill="#1b1f25"/>' +
    '<rect x="165" y="188" width="24" height="10" rx="4" fill="#1b1f25"/>' +
    '<rect x="187" y="8" width="7" height="184" rx="3" fill="#0e1013"/>' +
    '<rect x="189" y="10" width="1.6" height="180" rx=".8" fill="#ffffff" opacity=".28"/>' +
    '</svg>';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }

  function initSqueegee(root, reduced, coarse, n) {
    var stage = root.querySelector('.sq__stage');
    var scene = root.querySelector('.sq__scene');
    var frameEl = root.querySelector('.sq__frame');
    var probe = document.createElement('canvas');
    if (!stage || !scene || !frameEl || !probe.getContext || !probe.getContext('2d')) return;

    // Everything below only means something with JavaScript, so it is built here.
    var grime = el('canvas', 'sq__grime');
    var fx = el('canvas', 'sq__fx');
    var tool = el('div', 'sq__tool', '<span class="sq__rot">' + TOOL_SVG.replace(/ID-/g, 'sq' + n + '-') + '</span>');
    var hint = el('p', 'sq__hint', '<span class="sq__hint-dot"></span>' + (coarse ? 'Swipe across the glass' : 'Drag the squeegee'));
    [grime, fx, tool, hint].forEach(function (node) { node.setAttribute('aria-hidden', 'true'); stage.appendChild(node); });
    var rot = tool.firstChild;
    var bar = el('div', 'sq__bar',
      '<div class="sq__meter">' +
        '<p class="sq__status"><span class="sq__pct">0%</span> <span class="sq__label">clean</span></p>' +
        '<p class="sr-only sq__live" aria-live="polite"></p>' +
        '<span class="sq__track" aria-hidden="true"><span class="sq__fill"></span></span>' +
      '</div>' +
      '<div class="sq__actions">' +
        '<button class="sq__btn sq__btn--auto" type="button">Squeegee it for me</button>' +
        '<button class="sq__btn sq__btn--reset" type="button" hidden>Reset</button>' +
        '<a class="sq__cta" hidden>Get a free estimate <span aria-hidden="true">&rarr;</span></a>' +
      '</div>');
    frameEl.parentNode.insertBefore(bar, frameEl.nextSibling);
    var pctEl = bar.querySelector('.sq__pct');
    var labelEl = bar.querySelector('.sq__label');
    var live = bar.querySelector('.sq__live');
    var autoBtn = bar.querySelector('.sq__btn--auto');
    var resetBtn = bar.querySelector('.sq__btn--reset');
    var cta = bar.querySelector('.sq__cta');
    cta.href = root.getAttribute('data-cta') || '#estimate';

    var g = grime.getContext('2d');
    var fxc = fx.getContext('2d');
    var mask = document.createElement('canvas');
    var m = mask.getContext('2d', { willReadFrequently: true });
    var DONE_AT = 0.94;       // share of the glass that counts as "spotless"
    var MASK_W = 96;          // coverage is tracked on a 96px-wide copy of the glass

    var W = 0, H = 0, DPR = 1, blade = 0, ox = 0, oy = 0;
    var x = 0, y = 0, a = 0, tx = 0, ty = 0, ta = 0, shownA = null;
    var follow = 1;           // 1 = stick to the finger, < 1 = glide
    var down = false, dragging = false, hovering = false, pending = null, grabDX = 0, grabDY = 0;
    var pointerId = null;
    var touched = false, done = false, dirtySinceCheck = false, lastCheck = 0, progress = 0;
    var auto = null, raf = 0, last = 0;
    var drops = [], trail = [], sparkles = [];
    var sceneImg = null;


    /* ---------- sizing */
    function layout() {
      var r = stage.getBoundingClientRect();
      var w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h || (w === W && h === H)) return;
      var sx = W ? w / W : 1, sy = H ? h / H : 1;
      var snap = touched ? snapshot() : null;
      W = w; H = h;
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      grime.width = fx.width = Math.round(W * DPR);
      grime.height = fx.height = Math.round(H * DPR);

      // keep what has been cleaned when the window changes shape
      var mh = Math.max(1, Math.round(MASK_W * H / W));
      if (mask.width !== MASK_W || mask.height !== mh) {
        var prev = null;
        if (mask.width && touched) {
          prev = document.createElement('canvas');
          prev.width = mask.width; prev.height = mask.height;
          prev.getContext('2d').drawImage(mask, 0, 0);
        }
        mask.width = MASK_W; mask.height = mh;
        m.fillStyle = '#000';
        m.fillRect(0, 0, MASK_W, mh);
        if (prev) {
          m.globalCompositeOperation = 'copy';
          m.drawImage(prev, 0, 0, MASK_W, mh);
          m.globalCompositeOperation = 'source-over';
        }
      }

      blade = Math.round(H * (W < 600 ? 0.44 : 0.36));
      var toolH = blade / 0.92, toolW = toolH * 1.1;
      root.style.setProperty('--sq-w', toolW.toFixed(1) + 'px');
      ox = toolW * (192 / 220); oy = toolH / 2;

      if (!touched) { place(restX(), restY(), 0); tx = x; ty = y; ta = 0; }
      else { place(x * sx, y * sy, a); tx = x; ty = y; }
      paintGrime(snap);
    }
    function restX() { return Math.min(W * 0.5, blade * 1.25 + W * 0.04); }
    function restY() { return H * 0.56; }

    /* ---------- grime */
    // A full-resolution copy of the grime as it is now, so a repaint can keep crisp wiped edges.
    function snapshot() {
      if (!grime.width) return null;
      var c = document.createElement('canvas');
      c.width = grime.width; c.height = grime.height;
      c.getContext('2d').drawImage(grime, 0, 0);
      return c;
    }

    function paintGrime(keep) {
      var rand = rng(20251029);
      var area = W * H;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.clearRect(0, 0, grime.width, grime.height);
      g.setTransform(DPR, 0, 0, DPR, 0, 0);

      // a soft, washed-out copy of the view: glass you can barely see through
      if (sceneImg) {
        var s = Math.max(W / 800, H / 400), sw = W / s, sh = H / s;
        var tw = Math.max(8, Math.round(W / 6)), th = Math.max(4, Math.round(H / 6));
        var t = document.createElement('canvas');
        t.width = tw; t.height = th;
        t.getContext('2d').drawImage(sceneImg, (800 - sw) / 2, (400 - sh) / 2, sw, sh, 0, 0, tw, th);
        g.imageSmoothingEnabled = true;
        g.drawImage(t, 0, 0, W, H);
      } else {
        g.fillStyle = '#b9d4e6';   // until the view has loaded; keeps the grime fully opaque
        g.fillRect(0, 0, W, H);
      }
      g.fillStyle = 'rgba(232,228,214,0.58)';
      g.fillRect(0, 0, W, H);

      var i, cx, cy, r, grad;
      // cloudy blotches, lighter and dustier
      for (i = 0; i < 22; i++) {
        cx = rand() * W; cy = rand() * H; r = (0.08 + rand() * 0.2) * W;
        grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        var dusty = i % 3 === 0;
        grad.addColorStop(0, dusty ? 'rgba(160,148,120,0.16)' : 'rgba(255,255,250,0.30)');
        grad.addColorStop(1, dusty ? 'rgba(160,148,120,0)' : 'rgba(255,255,250,0)');
        g.fillStyle = grad;
        g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      // dried rain runs from the top of the glass
      g.lineCap = 'round';
      for (i = 0; i < Math.round(W / 34); i++) {
        cx = rand() * W; var len = (0.25 + rand() * 0.6) * H, wob = (rand() - 0.5) * 14;
        grad = g.createLinearGradient(0, 0, 0, len);
        grad.addColorStop(0, 'rgba(255,255,255,0.42)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.strokeStyle = grad;
        g.lineWidth = 1 + rand() * 3;
        g.beginPath();
        g.moveTo(cx, -4);
        g.quadraticCurveTo(cx + wob, len * 0.5, cx + wob * 0.4, len);
        g.stroke();
        // the bead of minerals where the run stopped
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.beginPath(); g.arc(cx + wob * 0.4, len, g.lineWidth * 0.9, 0, Math.PI * 2); g.fill();
      }
      // hard water spots: bright rims, cloudy middles
      var spots = Math.min(420, Math.round(area / 1500));
      for (i = 0; i < spots; i++) {
        cx = rand() * W; cy = rand() * H; r = 1 + Math.pow(rand(), 2.2) * 9;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
        if (rand() < 0.7) {
          g.fillStyle = 'rgba(255,255,255,' + (0.12 + rand() * 0.18).toFixed(3) + ')';
          g.fill();
          g.strokeStyle = 'rgba(255,255,255,' + (0.45 + rand() * 0.35).toFixed(3) + ')';
          g.lineWidth = 0.7 + rand() * 0.8;
          g.stroke();
        } else {
          g.fillStyle = 'rgba(206,198,176,' + (0.3 + rand() * 0.3).toFixed(3) + ')';
          g.fill();
        }
      }
      // dust
      g.fillStyle = 'rgba(92,82,64,0.28)';
      for (i = 0; i < Math.round(area / 2600); i++) {
        g.beginPath(); g.arc(rand() * W, rand() * H, 0.4 + rand() * 0.8, 0, Math.PI * 2); g.fill();
      }

      // keep whatever has already been cleaned
      if (touched) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'destination-in';
        g.imageSmoothingEnabled = true;
        g.drawImage(keep || mask, 0, 0, grime.width, grime.height);
        g.globalCompositeOperation = 'source-over';
        g.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }

    // The view behind the glass, rasterised once so the grime can carry a blurred copy of it.
    try {
      var clone = scene.cloneNode(true);
      clone.setAttribute('width', '800');
      clone.setAttribute('height', '400');
      var img = new Image();
      img.onload = function () { sceneImg = img; if (W) paintGrime(touched ? snapshot() : null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    } catch (err) { /* plain haze still works */ }

    /* ---------- the squeegee */
    function place(nx, ny, na) {
      x = nx; y = ny; a = na;
      tool.style.transform = 'translate3d(' + (x - ox).toFixed(1) + 'px,' + (y - oy).toFixed(1) + 'px,0)';
      if (shownA === null || Math.abs(a - shownA) > 0.002) {
        rot.style.transform = 'rotate(' + a.toFixed(4) + 'rad)';
        shownA = a;
      }
    }
    function bladeEnds(px, py, pa) {
      var h = blade / 2, bx = -Math.sin(pa) * h, by = Math.cos(pa) * h;
      return [px + bx, py + by, px - bx, py - by];
    }
    // Erase the strip the blade swept between two positions, on screen and on the coverage mask.
    function sweep(x0, y0, a0, x1, y1, a1) {
      var p = bladeEnds(x0, y0, a0), q = bladeEnds(x1, y1, a1);
      var k = MASK_W / W;
      [[g, 1], [m, k]].forEach(function (c) {
        var ctx = c[0], s = c[1];
        if (ctx === m) ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(p[0] * s, p[1] * s);
        ctx.lineTo(p[2] * s, p[3] * s);
        ctx.lineTo(q[2] * s, q[3] * s);
        ctx.lineTo(q[0] * s, q[1] * s);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 3 * s;
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(q[0] * s, q[1] * s);
        ctx.lineTo(q[2] * s, q[3] * s);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      });
      dirtySinceCheck = true;
      return q;
    }

    function measure() {
      dirtySinceCheck = false;
      var d = m.getImageData(0, 0, mask.width, mask.height).data, clean = 0, n = d.length / 4;
      for (var i = 3; i < d.length; i += 4) if (d[i] < 128) clean++;
      progress = clean / n;
      if (!done && progress >= DONE_AT) { finish(); return; }
      if (!done) {
        pctEl.textContent = Math.min(99, Math.floor(progress * 100)) + '%';
        root.style.setProperty('--sq-p', progress.toFixed(3));
        if (progress > 0.01) resetBtn.hidden = false;
      }
    }

    function finish() {
      done = true;
      root.classList.add('is-done');
      root.style.setProperty('--sq-p', 1);
      pctEl.textContent = '100%';
      labelEl.textContent = 'spotless';
      live.textContent = 'The glass is spotless.';
      grime.style.opacity = '0';
      var hadFocus = document.activeElement === autoBtn;
      autoBtn.hidden = true;
      resetBtn.hidden = false;
      if (hadFocus) resetBtn.focus({ preventScroll: true });
      cta.hidden = false;
      if (!reduced) {
        var rand = rng(Math.round(performance.now()) + 1);
        for (var i = 0; i < 9; i++) {
          sparkles.push({ x: (0.08 + rand() * 0.84) * W, y: (0.08 + rand() * 0.7) * H, s: 6 + rand() * 9, t: 250 + i * 110 + rand() * 120 });
        }
        sparkles.start = performance.now();
        kick();
      }
    }

    function reset() {
      stopAuto();
      done = false; touched = false; progress = 0;
      root.classList.remove('is-done', 'is-touched');
      m.setTransform(1, 0, 0, 1, 0, 0);
      m.globalCompositeOperation = 'source-over';
      m.fillStyle = '#000';
      m.fillRect(0, 0, mask.width, mask.height);
      paintGrime();
      grime.style.opacity = '';
      pctEl.textContent = '0%';
      labelEl.textContent = 'clean';
      live.textContent = '';
      root.style.setProperty('--sq-p', 0);
      autoBtn.hidden = false;
      resetBtn.hidden = true;
      cta.hidden = true;
      sparkles.length = drops.length = trail.length = 0;
      fxc.setTransform(1, 0, 0, 1, 0, 0);
      fxc.clearRect(0, 0, fx.width, fx.height);
      glideTo(restX(), restY(), 0);
    }

    function glideTo(nx, ny, na) {
      tx = nx; ty = ny; ta = na; follow = 0.14;
      kick();
    }

    /* ---------- autopilot: the pro's S-stroke, row by row */
    function buildPath(rows) {
      var n = rows || Math.max(2, Math.ceil(H / (blade * 0.8)));
      var pad = blade * 0.2, pts = [], step = 5;
      var top = blade * 0.45, bottom = H - blade * 0.45;
      var gap = n > 1 ? (bottom - top) / (n - 1) : 0;
      for (var r = 0; r < n; r++) {
        var ry = top + gap * r, ltr = r % 2 === 0;
        var x0 = ltr ? -pad : W + pad, x1 = ltr ? W + pad : -pad;
        var len = Math.abs(x1 - x0);
        for (var d = 0; d <= len; d += step) pts.push([x0 + (ltr ? d : -d), ry]);
        if (r < n - 1) {
          // swing round outside the glass to the next row
          var cx = x1, cy = ry + gap / 2, rad = gap / 2;
          var arcSteps = Math.max(4, Math.round(Math.PI * rad / step));
          for (var j = 1; j < arcSteps; j++) {
            var t = -Math.PI / 2 + Math.PI * j / arcSteps;
            pts.push([cx + (ltr ? 1 : -1) * Math.cos(t) * rad * 0.6, cy + Math.sin(t) * rad]);
          }
        }
      }
      return pts;
    }
    function startAuto(rows, then) {
      stopAuto();
      hovering = false;
      root.classList.remove('is-hovering');
      var pts = buildPath(rows);
      auto = { pts: pts, i: 0, phase: 'approach', speed: W / 620, then: then, t: 0 };
      down = false;
      root.classList.add('is-lifted');
      tx = pts[0][0]; ty = pts[0][1]; ta = 0; follow = 0.16;
      kick();
    }
    function stopAuto() {
      if (!auto) return;
      auto = null;
      down = false;
      root.classList.remove('is-lifted');
      root.classList.add('is-ready');
    }
    function stepAuto(dt) {
      if (auto.phase === 'approach') {
        if (Math.abs(tx - x) + Math.abs(ty - y) < 3) {
          auto.phase = 'run'; down = true; follow = 1;
          root.classList.remove('is-lifted');
        }
        return;
      }
      // ease in over the first ~250ms of the stroke
      auto.t += dt;
      var v = auto.speed * Math.min(1, 0.25 + auto.t / 330);
      auto.i += (v * dt) / 5;
      var i = Math.floor(auto.i);
      if (i >= auto.pts.length - 1) {
        var then = auto.then;
        stopAuto();
        measure();
        if (then) then();
        else glideTo(restX(), restY(), 0);
        return;
      }
      tx = auto.pts[i][0]; ty = auto.pts[i][1];
    }

    /* ---------- frame loop: runs only while something is moving */
    function kick() { if (!raf) raf = window.requestAnimationFrame(frame); }
    function frame(now) {
      raf = 0;
      var dt = last && now - last < 100 ? now - last : 16.7;
      last = now;
      if (auto) stepAuto(dt);

      var k = follow >= 1 ? 1 : 1 - Math.pow(1 - follow, dt / 16.7);
      var nx = x + (tx - x) * k, ny = y + (ty - y) * k;
      var dx = nx - x, dy = ny - y, dist = Math.sqrt(dx * dx + dy * dy);
      // the blade turns to face the way it is travelling, the way a wrist does
      if (dist > 1.2 && (down || hovering)) ta = Math.atan2(dy, dx);
      var da = Math.atan2(Math.sin(ta - a), Math.cos(ta - a));
      var na = a + da * (1 - Math.pow(1 - 0.22, dt / 16.7));
      if (Math.abs(da) < 0.001) na = ta;

      var moved = dist > 0.05 || Math.abs(na - a) > 0.0005;
      if (moved) {
        var ox0 = x, oy0 = y, oa0 = a;
        if (down && !done) {
          var q = sweep(ox0, oy0, oa0, nx, ny, na);
          if (!reduced) {
            trail.push({ x1: q[0], y1: q[1], x2: q[2], y2: q[3], t: now });
            var speed = dist / dt;
            if (speed > 0.2 && drops.length < 46 && Math.random() < Math.min(0.55, speed * 0.4)) {
              var end = Math.random() < 0.5 ? 0 : 2;
              drops.push({ x: q[end] - Math.cos(na) * 6, y: q[end + 1], y0: q[end + 1], r: 1.6 + Math.random() * 2.4, vy: 0, age: 0, life: 1100 + Math.random() * 1100, ph: Math.random() * 6 });
            }
          }
        }
        place(nx, ny, na);
      }
      if (dirtySinceCheck && now - lastCheck > 140) { lastCheck = now; measure(); }

      var fxBusy = drawFx(now, dt);
      var settling = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 || Math.abs(ta - a) > 0.002;
      if (auto || dragging || settling || fxBusy) kick();
      else if (dirtySinceCheck) measure();
    }

    function drawFx(now, dt) {
      if (!drops.length && !trail.length && !sparkles.length) return false;
      fxc.setTransform(1, 0, 0, 1, 0, 0);
      fxc.clearRect(0, 0, fx.width, fx.height);
      fxc.setTransform(DPR, 0, 0, DPR, 0, 0);
      var i;
      // a wet sheen right behind the blade
      fxc.lineCap = 'round';
      for (i = trail.length - 1; i >= 0; i--) {
        var tr = trail[i], age = now - tr.t;
        if (age > 320) { trail.splice(0, i + 1); break; }
        fxc.strokeStyle = 'rgba(255,255,255,' + (0.3 * (1 - age / 320)).toFixed(3) + ')';
        fxc.lineWidth = 5;
        fxc.beginPath(); fxc.moveTo(tr.x1, tr.y1); fxc.lineTo(tr.x2, tr.y2); fxc.stroke();
      }
      // drips off the ends of the blade
      for (i = drops.length - 1; i >= 0; i--) {
        var d = drops[i];
        d.age += dt;
        if (d.age > d.life || d.y > H + 10) { drops.splice(i, 1); continue; }
        d.vy = Math.min(d.vy + 0.00009 * dt * (1 + d.r / 3), 0.07 + d.r * 0.012);
        d.y += d.vy * dt;
        d.x += Math.sin(d.age / 140 + d.ph) * 0.04;
        var fade = Math.min(1, (d.life - d.age) / 350);
        fxc.strokeStyle = 'rgba(255,255,255,' + (0.22 * fade).toFixed(3) + ')';
        fxc.lineWidth = d.r * 0.7;
        fxc.beginPath(); fxc.moveTo(d.x, d.y0); fxc.lineTo(d.x, d.y); fxc.stroke();
        fxc.fillStyle = 'rgba(255,255,255,' + (0.38 * fade).toFixed(3) + ')';
        fxc.beginPath(); fxc.ellipse(d.x, d.y, d.r * 0.85, d.r, 0, 0, Math.PI * 2); fxc.fill();
        fxc.strokeStyle = 'rgba(14,40,64,' + (0.22 * fade).toFixed(3) + ')';
        fxc.lineWidth = 0.8;
        fxc.stroke();
        fxc.fillStyle = 'rgba(255,255,255,' + (0.9 * fade).toFixed(3) + ')';
        fxc.beginPath(); fxc.arc(d.x - d.r * 0.3, d.y - d.r * 0.35, d.r * 0.3, 0, Math.PI * 2); fxc.fill();
      }
      // the "spotless" glints
      if (sparkles.length) {
        var t0 = sparkles.start, alive = false;
        for (i = 0; i < sparkles.length; i++) {
          var sp = sparkles[i], p = (now - t0 - sp.t) / 900;
          if (p < 0) { alive = true; continue; }
          if (p > 1) continue;
          alive = true;
          var s = sp.s * Math.sin(p * Math.PI), w = s * 0.18;
          fxc.save();
          fxc.translate(sp.x, sp.y);
          fxc.rotate(p * 0.8);
          fxc.fillStyle = 'rgba(255,255,255,0.95)';
          fxc.beginPath();
          fxc.moveTo(0, -s); fxc.quadraticCurveTo(w, -w, s, 0); fxc.quadraticCurveTo(w, w, 0, s);
          fxc.quadraticCurveTo(-w, w, -s, 0); fxc.quadraticCurveTo(-w, -w, 0, -s);
          fxc.fill();
          fxc.fillStyle = 'rgba(10,149,247,0.35)';
          fxc.beginPath(); fxc.arc(0, 0, s * 0.45, 0, Math.PI * 2); fxc.fill();
          fxc.restore();
        }
        if (!alive) sparkles.length = 0;
      }
      return drops.length > 0 || trail.length > 0 || sparkles.length > 0;
    }

    /* ---------- input */
    function local(e) {
      var r = stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function begin(p, onTool) {
      stopAuto();
      dragging = true; down = true; touched = true; follow = 1;
      root.classList.add('is-dragging', 'is-touched');
      root.classList.remove('is-lifted');
      // grabbing the squeegee keeps it under the finger; tapping the glass brings it there
      if (onTool) { grabDX = x - p.x; grabDY = y - p.y; }
      else { grabDX = grabDY = 0; place(p.x, p.y, a); }
      tx = x; ty = y;
      try { stage.setPointerCapture(pointerId); } catch (err) { /* already released */ }
      kick();
    }
    function end(e) {
      if ((!dragging && !pending) || (e && e.pointerId !== pointerId)) return;
      dragging = false; down = false; pending = null; pointerId = null;
      root.classList.remove('is-dragging');
      if (hovering) root.classList.add('is-lifted');
      kick();
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || pointerId !== null) return;
      pointerId = e.pointerId;
      var p = local(e), onTool = !!(e.target.closest && e.target.closest('.sq__tool'));
      if (e.pointerType === 'mouse' || onTool) {
        e.preventDefault();
        begin(p, onTool);
      } else {
        // a touch on the glass might be the start of a page scroll: wait for it to move sideways
        pending = p;
      }
    });
    stage.addEventListener('pointermove', function (e) {
      var p;
      if (pending && e.pointerId === pointerId) {
        // only a sideways move is ours; anything else is left for the page to scroll
        p = local(e);
        var mx = Math.abs(p.x - pending.x), my = Math.abs(p.y - pending.y);
        if (mx < 6 || mx < my) return;
        var start = pending; pending = null;
        begin(start, false);
      }
      if (dragging && e.pointerId === pointerId) {
        p = local(e);
        tx = p.x + grabDX; ty = p.y + grabDY;
        kick();
      } else if (e.pointerType === 'mouse' && !dragging && !auto) {
        p = local(e);
        if (!hovering) { hovering = true; root.classList.add('is-hovering', 'is-lifted'); }
        tx = p.x; ty = p.y; follow = 0.35;
        kick();
      }
    });
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    // touch starts captured to whichever layer was hit; moving capture to the stage fires
    // lostpointercapture on that layer first, which must not end the stroke
    stage.addEventListener('lostpointercapture', function (e) { if (e.target === stage) end(e); });
    stage.addEventListener('pointerleave', function (e) {
      if (e.pointerType !== 'mouse') return;
      hovering = false;
      root.classList.remove('is-hovering', 'is-lifted');
    });

    autoBtn.addEventListener('click', function () {
      touched = true;
      root.classList.add('is-touched');
      if (reduced) {
        m.setTransform(1, 0, 0, 1, 0, 0);
        m.clearRect(0, 0, mask.width, mask.height);
        finish();
        return;
      }
      startAuto(0, function () {
        if (!done) {
          m.setTransform(1, 0, 0, 1, 0, 0);
          m.clearRect(0, 0, mask.width, mask.height);
          finish();
        }
        glideTo(restX(), restY(), 0);
      });
    });
    resetBtn.addEventListener('click', reset);

    /* ---------- start */
    layout();
    root.classList.add('is-live');
    var resizeQueued = false;
    var queueLayout = function () {
      if (resizeQueued) return;
      resizeQueued = true;
      window.requestAnimationFrame(function () { resizeQueued = false; layout(); });
    };
    if ('ResizeObserver' in window) new ResizeObserver(queueLayout).observe(stage);
    else window.addEventListener('resize', queueLayout);

    // First time the window scrolls into view, do one top stroke to show how it works.
    if (!reduced && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        window.setTimeout(function () {
          if (touched) { root.classList.add('is-ready'); return; }
          touched = true;
          startAuto(1, function () {
            root.classList.add('is-ready');
            glideTo(restX(), restY(), 0);
          });
          root.classList.remove('is-touched');
        }, 350);
      }, { threshold: 0.55 });
      io.observe(stage);
    } else {
      root.classList.add('is-ready');
    }
  }

  Array.prototype.forEach.call(roots, function (root, i) { initSqueegee(root, reduced, coarse, i); });
})();
