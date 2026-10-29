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
