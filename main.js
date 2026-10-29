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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = f.namedItem('name').value.trim();
    var phone = f.namedItem('phone').value.trim();
    [f.namedItem('name'), f.namedItem('phone')].forEach(function (el) { el.classList.add('touched'); });
    var nameEl = f.namedItem('name'), phoneEl = f.namedItem('phone');
    nameEl.setAttribute('aria-invalid', name ? 'false' : 'true');
    phoneEl.setAttribute('aria-invalid', phone ? 'false' : 'true');
    if (!name || !phone) {
      note.classList.add('is-error');
      note.textContent = !name && !phone
        ? 'Add your name and phone number so Vinson can get back to you.'
        : (!name ? 'Add your name so Vinson can get back to you.'
                 : 'Add your phone number so Vinson can get back to you.');
      (name ? phoneEl : nameEl).focus();
      return;
    }
    note.classList.remove('is-error');
    note.innerHTML = noteDefault;

    var services = Array.prototype.slice.call(form.querySelectorAll('input[name="svc"]:checked'))
      .map(function (el) { return el.value; });
    var lines = [
      'Name: ' + name,
      'Phone: ' + phone,
      'Location: ' + (f.namedItem('where').value.trim() || '-'),
      'Services: ' + (services.length ? services.join(', ') : '-'),
      '',
      f.namedItem('notes').value.trim()
    ];
    var subject = 'Free estimate request: ' + name;
    window.location.href = 'mailto:sochircavinson@gmail.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  });
})();

// Round 25 visual pass: rotator, scroll reveals, clean-glass wipe, stacking steps.
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
        words.forEach(function (w, i) { w.classList.toggle('is-active', i === n); });
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
    var perParent = {};
    candidates.forEach(function (el) {
      var parent = el.parentNode;
      perParent[parent] = perParent[parent] || 0;
      el.style.setProperty('--rv-delay', Math.min(perParent[parent] * 70, 280) + 'ms');
      perParent[parent]++;
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

  /* --- clean-glass wipe */
  Array.prototype.forEach.call(document.querySelectorAll('.wipe'), function (wipe) {
    var input = wipe.querySelector('.wipe__range');
    if (!input) return;
    var interacted = false, rafId = null;
    var setWipe = function (v) {
      wipe.style.setProperty('--wipe', v + '%');
    };
    var cancelSweep = function () { if (rafId) window.cancelAnimationFrame(rafId); rafId = null; };
    input.addEventListener('input', function () {
      interacted = true; cancelSweep(); setWipe(input.value);
    });
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
      input.addEventListener(evt, function () { interacted = true; cancelSweep(); }, { passive: true });
    });
    if (!hasIO || reduced) return;
    var sweepObserver = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      sweepObserver.disconnect();
      if (interacted) return;
      var start = null;
      var step = function (ts) {
        if (interacted) return;
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var v = Math.round((20 + 42 * eased) * 10) / 10;
        setWipe(v); input.value = v;
        if (p < 1) rafId = window.requestAnimationFrame(step);
      };
      rafId = window.requestAnimationFrame(step);
    }, { threshold: 0.35 });
    sweepObserver.observe(wipe);
  });

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
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateStack();
  }
})();
