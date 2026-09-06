/* ============================================================
   Интерфейс: рендиране на секциите и стъпков процес за запазване на час.
   ============================================================ */

(() => {
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const escape = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ================= Тост ================= */
  let toastTimer;
  const toastBox = $('#toast');
  function toast(msg) {
    toastBox.textContent = msg;
    toastBox.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastBox.hidden = true; }, 3600);
  }

  /* ================= Навигация ================= */
  function initNav() {
    const header = $('#siteHeader');
    const nav = $('#primaryNav');
    const toggle = $('#navToggle');

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // подчертаване на активната секция
    const links = $$('#primaryNav a');
    const sections = links
      .map(a => ({ a, sec: document.querySelector(a.getAttribute('href')) }))
      .filter(x => x.sec);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          links.forEach(l => l.classList.remove('is-current'));
          const hit = sections.find(x => x.sec === entry.target);
          if (hit) hit.a.classList.add('is-current');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(x => io.observe(x.sec));
    }
  }

  /* ================= Услуги ================= */
  function initServices() {
    const tabs = $('#serviceTabs');
    const list = $('#serviceList');
    const cats = [{ id: 'all', name: 'Всички' }, ...CATEGORIES];

    cats.forEach((c, i) => {
      const b = el('button', 'tab', escape(c.name));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(i === 0));
      b.dataset.cat = c.id;
      b.addEventListener('click', () => {
        $$('.tab', tabs).forEach(t => t.setAttribute('aria-selected', 'false'));
        b.setAttribute('aria-selected', 'true');
        draw(c.id);
      });
      tabs.appendChild(b);
    });

    function draw(catId) {
      const items = catId === 'all' ? SERVICES : SERVICES.filter(s => s.category === catId);
      list.innerHTML = '';
      items.forEach(s => {
        const card = el('article', 'service-card');
        card.innerHTML = `
          <h3>${escape(s.name)} <span class="price">${Booking.formatPrice(s.price)}</span></h3>
          <p>${escape(s.desc)}</p>
          <div class="service-meta">
            <span class="dur">${Booking.formatDuration(s.duration)}</span>
            <button class="link-btn" type="button" data-book="${s.id}">Запази час</button>
          </div>`;
        list.appendChild(card);
      });
    }

    list.addEventListener('click', e => {
      const btn = e.target.closest('[data-book]');
      if (btn) Wizard.startWith(btn.dataset.book);
    });

    draw('all');
  }

  /* ================= Екип ================= */
  function initTeam() {
    const box = $('#teamList');
    STAFF.forEach(p => {
      const days = Object.keys(p.schedule).length;
      const card = el('article', 'team-card');
      card.innerHTML = `
        <div class="team-photo ${p.tone}" aria-hidden="true">${escape(p.initials)}</div>
        <div class="team-body">
          <p class="team-role">${escape(p.role)}</p>
          <h3>${escape(p.name)}</h3>
          <p>${escape(p.bio)}</p>
          <p class="dur" style="font-size:.8rem;color:var(--ink-3)">Работи ${days} дни в седмицата</p>
          <button class="btn btn-outline btn-sm" type="button" data-staff="${p.id}">Запази при ${escape(p.name.split(' ')[0])}</button>
        </div>`;
      box.appendChild(card);
    });

    box.addEventListener('click', e => {
      const btn = e.target.closest('[data-staff]');
      if (btn) Wizard.startWithStaff(btn.dataset.staff);
    });
  }

  /* ================= Галерия ================= */
  function initGallery() {
    const filters = $('#galleryFilters');
    const grid = $('#galleryGrid');
    const cats = [{ id: 'all', name: 'Всички' }, ...CATEGORIES];

    cats.forEach((c, i) => {
      const b = el('button', 'chip', escape(c.name));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        $$('.chip', filters).forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        $$('.gallery-item', grid).forEach(item => {
          item.classList.toggle('is-hidden', c.id !== 'all' && item.dataset.cat !== c.id);
        });
      });
      filters.appendChild(b);
    });

    GALLERY.forEach(g => {
      const fig = el('figure', 'gallery-item');
      fig.dataset.cat = g.category;
      fig.innerHTML = `<div class="g-art ${g.art}"></div><figcaption>${escape(g.label)}</figcaption>`;
      grid.appendChild(fig);
    });
  }

  /* ================= Отзиви ================= */
  function initReviews() {
    const box = $('#reviewList');
    REVIEWS.forEach(r => {
      const card = el('article', 'review-card');
      card.innerHTML = `
        <div class="stars" aria-label="Оценка 5 от 5">★★★★★</div>
        <blockquote>${escape(r.text)}</blockquote>
        <p class="review-meta"><strong>${escape(r.author)}</strong>${escape(r.service)}</p>`;
      box.appendChild(card);
    });
  }

  /* ================= Контакти и работно време ================= */
  function initContacts() {
    const a = $('#cAddress');
    a.textContent = STUDIO.address;
    a.href = STUDIO.mapUrl;
    const p = $('#cPhone');
    p.textContent = STUDIO.phone;
    p.href = `tel:${STUDIO.phoneHref}`;
    const m = $('#cEmail');
    m.textContent = STUDIO.email;
    m.href = `mailto:${STUDIO.email}`;
    $('#cInsta').href = STUDIO.instagram;
    $('#cFb').href = STUDIO.facebook;
    $('#year').textContent = new Date().getFullYear();

    const list = $('#hoursList');
    const today = new Date().getDay();
    const ordered = [...STUDIO.hours].sort((x, y) => ((x.day + 6) % 7) - ((y.day + 6) % 7));
    ordered.forEach(h => {
      const closed = /почивен/i.test(h.text);
      const li = el('li', h.day === today ? 'is-today' : '');
      li.innerHTML = `<span>${escape(h.label)}${h.day === today ? ' · днес' : ''}</span>
                      <span class="${closed ? 'closed' : ''}">${escape(h.text)}</span>`;
      list.appendChild(li);
    });

    const free = Booking.countFreeSlots(7);
    $('#heroSlots').textContent = free > 0 ? `${free} възможни начални часа` : 'няма свободни часове';
  }

  /* ================= Стъпков процес ================= */
  const Wizard = (() => {
    const state = { step: 1, serviceId: null, staffId: null, dateKey: null, start: null, cursor: new Date() };
    const MAX_STEP = 4;

    const nodes = {
      steps: $('#steps'),
      panels: $$('.panel'),
      catFilters: $('#bookCategoryFilters'),
      serviceList: $('#bookServiceList'),
      staffList: $('#bookStaffList'),
      calTitle: $('#calTitle'),
      calGrid: $('#calGrid'),
      calPrev: $('#calPrev'),
      calNext: $('#calNext'),
      slotList: $('#slotList'),
      slotsTitle: $('#slotsTitle'),
      form: $('#bookingForm'),
      nav: $('#bookingNav'),
      back: $('#backBtn'),
      next: $('#nextBtn'),
      doneCard: $('#doneCard'),
      sum: {
        service: $('#sumService'), staff: $('#sumStaff'), date: $('#sumDate'),
        time: $('#sumTime'), duration: $('#sumDuration'), price: $('#sumPrice')
      }
    };

    let lastBooking = null;
    let activeCat = 'all';

    /* ---- Показване на стъпка ---- */
    function show(step) {
      state.step = step;
      nodes.panels.forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === step));
      $$('.step', nodes.steps).forEach(s => {
        const n = Number(s.dataset.step);
        s.classList.toggle('is-active', n === step);
        s.classList.toggle('is-done', n < step || step > MAX_STEP);
      });
      nodes.nav.hidden = step > MAX_STEP;
      const activeStep = $('.step.is-active', nodes.steps);
      if (activeStep && nodes.steps.scrollWidth > nodes.steps.clientWidth) {
        nodes.steps.scrollTo({ left: activeStep.offsetLeft - 16, behavior: 'smooth' });
      }
      nodes.back.disabled = step === 1;
      nodes.next.textContent = step === MAX_STEP ? 'Потвърди часа' : 'Напред';
      refreshNext();
      if (step === 2) renderStaff();
      if (step === 3) { renderCalendar(); renderSlots(); }
    }

    function refreshNext() {
      const ok = {
        1: () => !!state.serviceId,
        2: () => !!state.staffId,
        3: () => state.dateKey != null && state.start != null,
        4: () => true
      }[state.step];
      nodes.next.disabled = ok ? !ok() : true;
    }

    /* ---- Обобщение ---- */
    function renderSummary() {
      const s = state.serviceId ? Booking.getService(state.serviceId) : null;
      const st = state.staffId ? Booking.getStaff(state.staffId) : null;
      nodes.sum.service.textContent  = s ? s.name : '—';
      nodes.sum.staff.textContent    = st ? st.name : '—';
      nodes.sum.date.textContent     = state.dateKey ? Booking.formatDateLong(state.dateKey) : '—';
      nodes.sum.time.textContent     = state.start != null && s
        ? `${Booking.formatTime(state.start)} – ${Booking.formatTime(state.start + s.duration)}`
        : '—';
      nodes.sum.duration.textContent = s ? Booking.formatDuration(s.duration) : '—';
      nodes.sum.price.textContent    = s ? Booking.formatPrice(s.price) : '—';
    }

    /* ---- Стъпка 1: услуги ---- */
    function renderCategoryFilters() {
      const cats = [{ id: 'all', name: 'Всички' }, ...CATEGORIES];
      nodes.catFilters.innerHTML = '';
      cats.forEach(c => {
        const b = el('button', 'chip', escape(c.name));
        b.type = 'button';
        b.setAttribute('aria-pressed', String(c.id === activeCat));
        b.addEventListener('click', () => {
          activeCat = c.id;
          renderCategoryFilters();
          renderServiceOptions();
        });
        nodes.catFilters.appendChild(b);
      });
    }

    function renderServiceOptions() {
      const items = activeCat === 'all' ? SERVICES : SERVICES.filter(s => s.category === activeCat);
      nodes.serviceList.innerHTML = '';
      items.forEach(s => {
        const cat = Booking.getCategory(s.category);
        const b = el('button', 'option' + (state.serviceId === s.id ? ' is-selected' : ''));
        b.type = 'button';
        b.innerHTML = `
          <div class="option-main">
            <strong>${escape(s.name)}</strong>
            <small>${escape(cat ? cat.name : '')} · ${Booking.formatDuration(s.duration)}</small>
          </div>
          <div class="option-side">
            <b>${Booking.formatPrice(s.price)}</b>
          </div>`;
        b.addEventListener('click', () => selectService(s.id));
        nodes.serviceList.appendChild(b);
      });
    }

    function selectService(id) {
      if (state.serviceId !== id) {
        state.serviceId = id;
        // услугата определя кой може да я направи и колко трае — нулираме надолу
        const staffOk = Booking.staffForService(id).some(s => s.id === state.staffId);
        if (!staffOk) state.staffId = null;
        state.start = null;
      }
      renderServiceOptions();
      renderSummary();
      refreshNext();
    }

    /* ---- Стъпка 2: специалисти ---- */
    function renderStaff() {
      const service = Booking.getService(state.serviceId);
      const people = service ? Booking.staffForService(service.id) : [];
      nodes.staffList.innerHTML = '';

      if (!people.length) {
        nodes.staffList.appendChild(el('p', 'empty-note', 'За тази услуга няма назначен специалист. Моля, обадете се в студиото.'));
        return;
      }

      people.forEach(p => {
        const nextFree = findNextFree(p.id, service.duration);
        const b = el('button', 'option' + (state.staffId === p.id ? ' is-selected' : ''));
        b.type = 'button';
        b.innerHTML = `
          <span class="option-avatar ${p.tone}" aria-hidden="true">${escape(p.initials)}</span>
          <div class="option-main">
            <strong>${escape(p.name)}</strong>
            <small>${escape(p.role)}</small>
          </div>
          <div class="option-side">
            <b>${nextFree ? Booking.formatTime(nextFree.start) : '—'}</b>
            <small>${nextFree ? escape(Booking.formatDateShort(nextFree.dateKey)) : 'няма свободно'}</small>
          </div>`;
        b.addEventListener('click', () => {
          state.staffId = p.id;
          state.start = null;
          renderStaff();
          renderSummary();
          refreshNext();
        });
        nodes.staffList.appendChild(b);
      });
    }

    /** Първият свободен час напред за даден специалист */
    function findNextFree(staffId, duration) {
      const today = Booking.startOfToday();
      for (let i = 0; i <= Booking.maxDaysAhead; i++) {
        const key = Booking.toKey(Booking.addDays(today, i));
        const slots = Booking.slotsFor(staffId, key, duration);
        if (slots.length) return { dateKey: key, start: slots[0] };
      }
      return null;
    }

    /* ---- Стъпка 3: календар ---- */
    function renderCalendar() {
      const service = Booking.getService(state.serviceId);
      if (!service || !state.staffId) return;

      const cur = state.cursor;
      const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      const lead = (first.getDay() + 6) % 7; // понеделник е първи

      const today = Booking.startOfToday();
      const limit = Booking.addDays(today, Booking.maxDaysAhead);

      nodes.calTitle.textContent = Booking.formatMonth(cur);
      nodes.calPrev.disabled = cur.getFullYear() === today.getFullYear() && cur.getMonth() === today.getMonth();
      nodes.calNext.disabled = cur.getFullYear() === limit.getFullYear() && cur.getMonth() === limit.getMonth();

      nodes.calGrid.innerHTML = '';
      for (let i = 0; i < lead; i++) nodes.calGrid.appendChild(el('div', 'day is-empty'));

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(cur.getFullYear(), cur.getMonth(), d);
        const key = Booking.toKey(date);
        const free = date >= today && date <= limit && Booking.dayHasSlots(state.staffId, key, service.duration);

        const b = el('button', 'day', String(d));
        b.type = 'button';
        b.disabled = !free;
        if (Booking.isSameDay(date, new Date())) b.classList.add('is-today');
        if (free) b.classList.add('has-free');
        if (state.dateKey === key) b.classList.add('is-selected');
        b.setAttribute('aria-label', `${Booking.formatDateLong(key)}${free ? '' : ' — няма свободни часове'}`);
        b.addEventListener('click', async () => {
          state.dateKey = key;
          state.start = null;
          renderCalendar();
          renderSummary();
          refreshNext();

          const needsCheck = Calendar.isOn() && Calendar.statusFor(key) !== 'ok';
          renderSlots({ loading: needsCheck });
          if (!needsCheck) return;

          await Calendar.load(key);
          if (state.dateKey !== key) return; // клиентът вече е избрал друг ден
          renderCalendar();
          renderSlots();
        });
        nodes.calGrid.appendChild(b);
      }
    }

    function renderSlots(opts = {}) {
      const service = Booking.getService(state.serviceId);
      nodes.slotList.innerHTML = '';
      // бележките стоят извън скролиращия списък, за да се виждат винаги
      $$('.slots-warn, .slots-legend', nodes.slotList.parentElement).forEach(n => n.remove());

      if (!state.dateKey) {
        nodes.slotsTitle.textContent = 'Свободни часове';
        nodes.slotList.appendChild(el('p', 'empty-note', 'Изберете ден от календара.'));
        return;
      }

      nodes.slotsTitle.textContent = `Свободни часове — ${Booking.formatDateLong(state.dateKey)}`;

      if (opts.loading) {
        nodes.slotList.appendChild(el('p', 'empty-note is-loading', 'Проверявам календара за заети часове…'));
        return;
      }

      // показваме и заетите часове — задраскани, за да се вижда кога е пълно
      const slots = Booking.daySlots(state.staffId, state.dateKey, service.duration)
        .filter(s => s.status !== 'past');

      if (!slots.length) {
        nodes.slotList.appendChild(el('p', 'empty-note', 'За този ден няма свободни часове. Опитайте с друга дата.'));
        renderCalendarNote();
        return;
      }

      const LABELS = { taken: 'зает', break: 'почивка' };

      slots.forEach(({ start: t, status }) => {
        const free = status === 'free';
        const selected = free && state.start === t;
        const b = el('button', `slot${selected ? ' is-selected' : ''}${free ? '' : ' is-' + status}`,
          Booking.formatTime(t));
        b.type = 'button';

        if (!free) {
          b.disabled = true;
          b.title = LABELS[status] || 'не е свободен';
          b.setAttribute('aria-label', `${Booking.formatTime(t)} — ${LABELS[status] || 'не е свободен'}`);
        } else {
          b.setAttribute('aria-pressed', String(selected));
          b.addEventListener('click', () => {
            state.start = t;
            renderSlots();
            renderSummary();
            refreshNext();
          });
        }

        nodes.slotList.appendChild(b);
      });

      if (!slots.some(s => s.status === 'free')) {
        nodes.slotList.after(el('p', 'slots-legend',
          'Всички часове за този ден са заети. Опитайте с друга дата или друг специалист.'));
      } else if (slots.some(s => s.status === 'taken')) {
        nodes.slotList.after(el('p', 'slots-legend', 'Задрасканите часове вече са заети.'));
      }

      renderCalendarNote();
    }

    /** Предупреждение, ако календарът не е отговорил */
    function renderCalendarNote() {
      if (!state.dateKey || Calendar.statusFor(state.dateKey) !== 'fail') return;
      nodes.slotList.before(el('p', 'slots-warn',
        'Календарът на студиото не отговори — възможно е част от тези часове вече да са заети. ' +
        'Ще потвърдим по телефона.'));
    }

    /* ---- Стъпка 4: валидация ---- */
    function setError(id, msg) {
      const field = $(`#${id}`).closest('.field');
      const box = $(`[data-error-for="${id}"]`);
      field.classList.toggle('has-error', !!msg);
      if (box) box.textContent = msg || '';
    }

    function validate() {
      let ok = true;
      const name = $('#fName').value.trim();
      const phone = $('#fPhone').value.trim();
      const email = $('#fEmail').value.trim();
      const consent = $('#fConsent').checked;

      if (name.length < 2) { setError('fName', 'Моля, въведете име.'); ok = false; }
      else setError('fName', '');

      const digits = phone.replace(/[\s\-().]/g, '');
      if (!/^(\+359|0)\d{8,9}$/.test(digits)) { setError('fPhone', 'Въведете валиден телефон, напр. 0888 123 456.'); ok = false; }
      else setError('fPhone', '');

      if (!email) { setError('fEmail', 'Имейлът е нужен, за да ви изпратим потвърждение.'); ok = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('fEmail', 'Проверете имейл адреса.'); ok = false; }
      else setError('fEmail', '');

      if (!consent) { setError('fConsent', 'Необходимо е съгласие, за да запазим часа.'); ok = false; }
      else setError('fConsent', '');

      return ok;
    }

    /* ---- Потвърждение ---- */
    let sending = false;

    async function submit() {
      if (sending) return;
      if (!validate()) {
        const bad = $('.field.has-error input');
        if (bad) bad.focus();
        return;
      }
      const service = Booking.getService(state.serviceId);

      setBusy(true);

      // последна проверка в календара — може някой да е заел часа междувременно
      if (Calendar.isOn()) {
        await Calendar.load(state.dateKey, { force: true });
        const free = Booking.slotsFor(state.staffId, state.dateKey, service.duration);
        if (!free.includes(state.start)) {
          setBusy(false);
          toast('Този час вече е зает в календара на студиото. Моля, изберете друг.');
          state.start = null;
          show(3);
          renderCalendar();
          renderSlots();
          renderSummary();
          return;
        }
      }

      const res = Booking.add({
        serviceId: state.serviceId,
        staffId: state.staffId,
        date: state.dateKey,
        start: state.start,
        duration: service.duration,
        price: service.price,
        name: $('#fName').value.trim(),
        phone: $('#fPhone').value.trim(),
        email: $('#fEmail').value.trim(),
        note: $('#fNote').value.trim()
      });

      if (!res.ok) {
        setBusy(false);
        toast('Този час току-що беше зает. Моля, изберете друг.');
        state.start = null;
        show(3);
        renderSlots();
        renderSummary();
        return;
      }

      // часът вече е запазен — имейлът и календарът само уведомяват
      const [mail, calendar] = await Promise.all([
        Notify.send(res.booking),
        Calendar.push(res.booking)
      ]);
      setBusy(false);
      if (!calendar.ok && !calendar.skipped) {
        console.warn('Часът е запазен локално, но не влезе в Google Календар.');
      }

      lastBooking = res.booking;
      renderDone(res.booking);
      renderMailStatus(res.booking, mail);
      show(5);
      updateBadge();
      $('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (mail.client === 'ok') toast('Готово! Изпратихме потвърждение по имейл.');
      else if (mail.ready) toast('Часът е запазен. Имейлът не тръгна — ще ви потърсим по телефона.');
      else toast('Готово! Часът е запазен.');

      if (!res.stored) console.warn('Браузърът не позволи запазване в „Моите часове“.');
    }

    /** Показва дали потвърждението е тръгнало */
    function renderMailStatus(booking, mail) {
      const sub = $('#doneSub');
      if (!sub) return;
      if (mail.client === 'ok') {
        sub.textContent = `Изпратихме потвърждение на ${booking.email}. Ще ви очакваме!`;
        sub.className = 'done-sub';
      } else if (!mail.ready) {
        sub.textContent = 'Ще ви очакваме! (Изпращането на имейли още не е настроено.)';
        sub.className = 'done-sub';
      } else {
        sub.textContent = 'Часът е запазен, но потвърждението по имейл не тръгна. ' +
          `Ако не получите съобщение, звъннете на ${STUDIO.phone} с код ${booking.code}.`;
        sub.className = 'done-sub is-warn';
      }
    }

    /** Състояние „изпращане“ на бутона за потвърждение */
    function setBusy(on) {
      sending = on;
      nodes.next.disabled = on;
      nodes.back.disabled = on || state.step === 1;
      nodes.next.classList.toggle('is-busy', on);
      nodes.next.textContent = on ? 'Изпращане…' : (state.step === MAX_STEP ? 'Потвърди часа' : 'Напред');
    }

    function renderDone(b) {
      const service = Booking.getService(b.serviceId);
      const staff = Booking.getStaff(b.staffId);
      $('#addToGoogle').href = Notify.googleCalendarUrl(b);
      nodes.doneCard.innerHTML = `
        <dl>
          <div><dt>Услуга</dt><dd>${escape(service.name)}</dd></div>
          <div><dt>Специалист</dt><dd>${escape(staff.name)}</dd></div>
          <div><dt>Дата</dt><dd>${escape(Booking.formatDateLong(b.date))}</dd></div>
          <div><dt>Час</dt><dd>${Booking.formatTime(b.start)} – ${Booking.formatTime(b.start + b.duration)}</dd></div>
          <div><dt>На името на</dt><dd>${escape(b.name)}</dd></div>
          <div><dt>Цена</dt><dd>${Booking.formatPrice(b.price)}</dd></div>
        </dl>
        <div class="done-code"><span>Код за справка</span><code>${escape(b.code)}</code></div>`;
    }

    function reset(keepService = false) {
      if (!keepService) state.serviceId = null;
      state.staffId = null;
      state.dateKey = null;
      state.start = null;
      state.cursor = new Date();
      nodes.form.reset();
      ['fName', 'fPhone', 'fEmail', 'fConsent'].forEach(id => setError(id, ''));
      renderServiceOptions();
      renderSummary();
      show(1);
    }

    /* ---- Навигация между стъпките ---- */
    function next() {
      if (state.step === MAX_STEP) return submit();
      show(Math.min(state.step + 1, MAX_STEP));
      scrollToBooking();
    }
    function back() {
      show(Math.max(state.step - 1, 1));
      scrollToBooking();
    }
    function scrollToBooking() {
      const top = $('#booking').getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top + 260 || window.scrollY < top - 260) {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }

    /* ---- Публични входни точки ---- */
    function startWith(serviceId) {
      selectService(serviceId);
      activeCat = 'all';
      renderCategoryFilters();
      renderServiceOptions();
      show(2);
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    }

    function startWithStaff(staffId) {
      const staff = Booking.getStaff(staffId);
      if (!staff) return;
      state.staffId = staffId;
      if (state.serviceId && !staff.services.includes(state.serviceId)) state.serviceId = null;
      if (!state.serviceId) {
        // показваме само услугите, които този специалист прави
        activeCat = 'all';
        renderCategoryFilters();
        renderServiceOptions();
        show(1);
        toast(`Изберете услуга при ${staff.name.split(' ')[0]}.`);
      } else {
        show(3);
      }
      renderSummary();
      document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    }

    function init() {
      renderCategoryFilters();
      renderServiceOptions();
      renderSummary();
      show(1);

      nodes.next.addEventListener('click', next);
      nodes.back.addEventListener('click', back);
      nodes.calPrev.addEventListener('click', () => {
        state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() - 1, 1);
        renderCalendar();
      });
      nodes.calNext.addEventListener('click', () => {
        state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 1);
        renderCalendar();
      });
      nodes.form.addEventListener('submit', e => { e.preventDefault(); submit(); });
      nodes.form.addEventListener('input', e => {
        if (e.target.closest('.field.has-error')) validateField(e.target.id);
      });

      $('#bookAnother').addEventListener('click', () => reset(false));
      $('#addToCalendar').addEventListener('click', () => downloadIcs(lastBooking));

      // стъпките са и навигация назад
      $$('.step', nodes.steps).forEach(s => {
        s.addEventListener('click', () => {
          const n = Number(s.dataset.step);
          if (n < state.step && state.step <= MAX_STEP) show(n);
        });
      });
    }

    function validateField(id) {
      if (!id) return;
      const map = { fName: 1, fPhone: 1, fEmail: 1, fConsent: 1 };
      if (map[id]) validate();
    }

    return { init, startWith, startWithStaff, reset };
  })();

  /* ================= Изтегляне на .ics ================= */
  function downloadIcs(booking) {
    if (!booking) return;
    const blob = new Blob([Booking.icsFor(booking)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-laurel-${booking.code}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ================= Моите часове ================= */
  const modal = $('#bookingsModal');

  function updateBadge() {
    const n = Booking.upcoming().length;
    const badge = $('#bookingsBadge');
    badge.textContent = String(n);
    badge.hidden = n === 0;
  }

  function renderBookings() {
    const body = $('#bookingsBody');
    const list = Booking.all().sort((a, b) =>
      (b.date + String(b.start).padStart(4, '0')).localeCompare(a.date + String(a.start).padStart(4, '0')));
    body.innerHTML = '';

    if (!list.length) {
      body.appendChild(el('p', 'empty-note', 'Все още нямате запазени часове. Изберете услуга и си запазете час — отнема по-малко от минута.'));
      return;
    }

    list.forEach(b => {
      const service = Booking.getService(b.serviceId);
      const staff = Booking.getStaff(b.staffId);
      const past = Booking.isPast(b);
      const row = el('article', 'booking-row' + (past ? ' is-past' : ''));
      row.innerHTML = `
        <div class="booking-row-top">
          <strong>${escape(service ? service.name : 'Услуга')}</strong>
          <span class="tag ${past ? 'tag-past' : 'tag-ok'}">${past ? 'минал' : 'предстоящ'}</span>
        </div>
        <small>${escape(Booking.formatDateLong(b.date))} · ${Booking.formatTime(b.start)} – ${Booking.formatTime(b.start + b.duration)}</small>
        <small>${escape(staff ? staff.name : '—')} · ${Booking.formatPrice(b.price)} · код <code>${escape(b.code)}</code></small>
        ${past ? '' : `<div class="row-actions">
          <a class="btn btn-outline btn-sm" href="${escape(Notify.googleCalendarUrl(b))}" target="_blank" rel="noopener">Google Календар</a>
          <button class="btn btn-outline btn-sm" type="button" data-ics="${b.id}">.ics</button>
          <button class="btn btn-ghost btn-sm" type="button" data-cancel="${b.id}">Откажи часа</button>
        </div>`}`;
      body.appendChild(row);
    });
  }

  function openModal() {
    renderBookings();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.icon-btn', modal).focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function initModal() {
    $('#myBookingsBtn').addEventListener('click', openModal);
    const mobileBtn = $('#myBookingsBtnMobile');
    if (mobileBtn) mobileBtn.addEventListener('click', () => {
      $('#primaryNav').classList.remove('is-open');
      $('#navToggle').setAttribute('aria-expanded', 'false');
      openModal();
    });
    modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

    $('#bookingsBody').addEventListener('click', e => {
      const cancel = e.target.closest('[data-cancel]');
      const ics = e.target.closest('[data-ics]');
      if (cancel) {
        const b = Booking.all().find(x => x.id === cancel.dataset.cancel);
        if (b && confirm('Сигурни ли сте, че искате да откажете този час?')) {
          Booking.remove(b.id);
          renderBookings();
          updateBadge();
          toast('Часът е отказан. Мястото отново е свободно.');
        }
      }
      if (ics) {
        const b = Booking.all().find(x => x.id === ics.dataset.ics);
        downloadIcs(b);
      }
    });
  }

  /* ================= Старт ================= */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initServices();
    initTeam();
    initGallery();
    initReviews();
    initContacts();
    Wizard.init();
    initModal();
    updateBadge();
  });
})();
