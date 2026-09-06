/* ============================================================
   Логика на резервациите: съхранение, свободни часове, формати.
   Данните се пазят в localStorage на браузъра (демо режим).
   При реален проект този слой се сменя с извиквания към API.
   ============================================================ */

const Booking = (() => {
  const { slotStep, minLeadMinutes, maxDaysAhead, storageKey } = BOOKING_CONFIG;

  /* ---------- Помощни: дати ---------- */
  const pad = n => String(n).padStart(2, '0');

  /** Дата → 'YYYY-MM-DD' (в местно време, без UTC изместване) */
  const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  /** 'YYYY-MM-DD' → Date в 00:00 местно време */
  const fromKey = key => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  };

  const isSameDay = (a, b) => toKey(a) === toKey(b);

  const MONTHS = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
  const DAYS = ['неделя','понеделник','вторник','сряда','четвъртък','петък','събота'];

  const formatTime = mins => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

  const formatDateLong = key => {
    const d = fromKey(key);
    return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };

  const formatDateShort = key => {
    const d = fromKey(key);
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  };

  const formatMonth = date => `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  const formatDuration = mins => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h} ч. ${m} мин.`;
    if (h) return `${h} ${h === 1 ? 'час' : 'часа'}`;
    return `${m} мин.`;
  };

  const formatPrice = lv => `${lv} лв.`;

  /* ---------- Търсене по id ---------- */
  const getService = id => SERVICES.find(s => s.id === id) || null;
  const getStaff = id => STAFF.find(s => s.id === id) || null;
  const getCategory = id => CATEGORIES.find(c => c.id === id) || null;
  const staffForService = serviceId => STAFF.filter(s => s.services.includes(serviceId));

  /* ---------- Съхранение ---------- */
  const load = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  };

  const save = list => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
      return true;
    } catch (e) {
      return false; // напр. частен режим без достъп до storage
    }
  };

  const all = () => load();

  /** Резервации за даден специалист и ден */
  const forStaffDay = (staffId, dateKey) =>
    load().filter(b => b.staffId === staffId && b.date === dateKey);

  /** Часове, които вече са минали, се смятат за архив */
  const isPast = b => {
    const d = fromKey(b.date);
    d.setMinutes(b.start + b.duration);
    return d.getTime() < Date.now();
  };

  const upcoming = () =>
    load().filter(b => !isPast(b)).sort((a, b) => (a.date + pad(a.start)).localeCompare(b.date + pad(b.start)));

  const makeCode = () => {
    const chars = 'ACDEFHJKLMNPRTUVWXY3456789';
    let out = '';
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return `L-${out}`;
  };

  const add = data => {
    const list = load();
    // защита от двойна резервация на същия час
    const clash = list.some(b =>
      b.staffId === data.staffId && b.date === data.date &&
      overlaps(data.start, data.duration, b.start, b.duration)
    );
    if (clash) return { ok: false, reason: 'taken' };

    const booking = {
      id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      code: makeCode(),
      createdAt: new Date().toISOString(),
      ...data
    };
    list.push(booking);
    const stored = save(list);
    return { ok: true, booking, stored };
  };

  const remove = id => {
    const list = load().filter(b => b.id !== id);
    save(list);
    return list;
  };

  /* ---------- Свободни часове ---------- */
  const overlaps = (startA, durA, startB, durB) => startA < startB + durB && startB < startA + durA;

  /* Външен източник на заети часове (Google Календар).
     Регистрира се от модула Calendar по-долу и се чете синхронно —
     показваме само това, което вече е изтеглено за деня. */
  let busyProvider = null;
  const setBusyProvider = fn => { busyProvider = fn; };
  const externalBusy = (dateKey, staffId) => {
    if (!busyProvider) return [];
    try {
      return busyProvider(dateKey, staffId) || [];
    } catch (e) {
      return [];
    }
  };

  /**
   * Всички начални часове за деня със статуса на всеки:
   *   'free'  — свободен
   *   'taken' — зает (локална резервация или събитие в календара)
   *   'break' — пада в почивката на специалиста
   *   'past'  — вече е минал или е твърде скоро за днес
   */
  const daySlots = (staffId, dateKey, duration) => {
    const staff = getStaff(staffId);
    if (!staff || !duration) return [];

    const date = fromKey(dateKey);
    const today = startOfToday();
    const limit = addDays(today, maxDaysAhead);
    if (date < today || date > limit) return [];

    const shift = staff.schedule[date.getDay()];
    if (!shift) return [];

    const taken = forStaffDay(staffId, dateKey).concat(externalBusy(dateKey, staffId));
    const brk = staff.breakTime;

    // най-ранен допустим час, ако денят е днешният
    let earliest = shift.start;
    if (isSameDay(date, new Date())) {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes() + minLeadMinutes;
      earliest = Math.max(earliest, Math.ceil(nowMins / slotStep) * slotStep);
    }

    const out = [];
    for (let t = shift.start; t + duration <= shift.end; t += slotStep) {
      let status = 'free';
      if (t < earliest) status = 'past';
      else if (brk && overlaps(t, duration, brk.start, brk.end - brk.start)) status = 'break';
      else if (taken.some(b => overlaps(t, duration, b.start, b.duration))) status = 'taken';
      out.push({ start: t, status });
    }
    return out;
  };

  /** Само свободните начални часове (в минути от полунощ) */
  const slotsFor = (staffId, dateKey, duration) =>
    daySlots(staffId, dateKey, duration)
      .filter(s => s.status === 'free')
      .map(s => s.start);

  /** Има ли изобщо свободно място този ден при този специалист */
  const dayHasSlots = (staffId, dateKey, duration) => slotsFor(staffId, dateKey, duration).length > 0;

  /** Брой свободни часове в следващите N дни — за индикатора в hero секцията */
  const countFreeSlots = (days = 7) => {
    const today = startOfToday();
    let n = 0;
    for (let i = 0; i < days; i++) {
      const key = toKey(addDays(today, i));
      STAFF.forEach(s => {
        const dur = 60; // ориентировъчно, за среден час
        n += slotsFor(s.id, key, dur).length;
      });
    }
    return n;
  };

  /* ---------- Експорт в календар (.ics) ---------- */
  const icsFor = booking => {
    const service = getService(booking.serviceId);
    const staff = getStaff(booking.staffId);
    const start = fromKey(booking.date);
    start.setMinutes(booking.start);
    const end = new Date(start.getTime() + booking.duration * 60000);

    const stamp = d =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const esc = s => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Studio Laurel//BG',
      'BEGIN:VEVENT',
      `UID:${booking.id}@studiolaurel.bg`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(`${service ? service.name : 'Час'} — ${STUDIO.name}`)}`,
      `DESCRIPTION:${esc(`Специалист: ${staff ? staff.name : '—'}\nКод: ${booking.code}\nТелефон: ${STUDIO.phone}`)}`,
      `LOCATION:${esc(STUDIO.address)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  };

  return {
    toKey, fromKey, addDays, startOfToday, isSameDay,
    formatTime, formatDateLong, formatDateShort, formatMonth, formatDuration, formatPrice,
    getService, getStaff, getCategory, staffForService,
    all, upcoming, add, remove, isPast,
    daySlots, slotsFor, dayHasSlots, countFreeSlots, icsFor,
    setBusyProvider, overlaps,
    maxDaysAhead
  };
})();

/* ============================================================
   Изпращане на имейли през EmailJS.
   При потвърдена резервация тръгват два имейла:
   един до клиента (потвърждение) и един до салона (известие).
   Ключовете са в js/config.js.
   ============================================================ */

const Notify = (() => {
  const cfg = typeof EMAIL_CONFIG !== 'undefined' ? EMAIL_CONFIG : { enabled: false };
  let ready = false;

  /** Инициализира SDK-то, ако е зареден и има ключ */
  function init() {
    if (ready) return true;
    if (!cfg.enabled || !cfg.publicKey || cfg.publicKey.startsWith('YOUR_')) return false;
    if (typeof window === 'undefined' || !window.emailjs) return false;
    try {
      window.emailjs.init(cfg.publicKey);
      ready = true;
    } catch (e) {
      console.warn('EmailJS не можа да се инициализира:', e);
      ready = false;
    }
    return ready;
  }

  const isReady = () => ready || init();

  /* --- Дата и час във формат за календар --- */
  const pad = n => String(n).padStart(2, '0');

  /** UTC печат за Google Calendar / .ics, напр. 20260908T063000Z */
  function calStamp(booking, offsetMinutes = 0) {
    const d = Booking.fromKey(booking.date);
    d.setMinutes(booking.start + offsetMinutes);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
           `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  }

  /** Линк „Добави в Google Календар“ */
  function googleCalendarUrl(booking) {
    const service = Booking.getService(booking.serviceId);
    const staff = Booking.getStaff(booking.staffId);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${service ? service.name : 'Час'} — ${STUDIO.name}`,
      dates: `${calStamp(booking)}/${calStamp(booking, booking.duration)}`,
      details: `Резервация в ${STUDIO.name}\nСпециалист: ${staff ? staff.name : '—'}\n` +
               `Код: ${booking.code}\nТелефон на студиото: ${STUDIO.phone}`,
      location: STUDIO.address
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /* --- Параметрите, които получават шаблоните в EmailJS --- */
  function params(booking) {
    const service = Booking.getService(booking.serviceId);
    const staff = Booking.getStaff(booking.staffId);
    const category = service ? Booking.getCategory(service.category) : null;

    const start = calStamp(booking);
    const end = calStamp(booking, booking.duration);
    const serviceLine = staff && service
      ? `${service.name} (при ${staff.name})`
      : (service ? service.name : '');

    const shared = {
      client_name: booking.name,
      client_phone: booking.phone,
      category: category ? category.name : '',
      service: serviceLine,
      specialist: staff ? staff.name : '',
      date: Booking.formatDateLong(booking.date),
      time: Booking.formatTime(booking.start),
      end_time: Booking.formatTime(booking.start + booking.duration),
      duration: Booking.formatDuration(booking.duration),
      price: `${booking.price} лв.`,
      notes: booking.note || '—',
      booking_code: booking.code,
      studio_name: STUDIO.name,
      studio_phone: STUDIO.phone,
      studio_address: STUDIO.address
    };

    return {
      client: { ...shared, to_email: booking.email },
      business: {
        ...shared,
        to_email: cfg.salonEmail,
        client_email: booking.email || '—',
        gcal_start: start,
        gcal_end: end,
        service_encoded: encodeURIComponent(`${serviceLine} — ${STUDIO.name}`),
        client_name_encoded: encodeURIComponent(booking.name),
        notes_encoded: encodeURIComponent(booking.note || 'Няма бележки'),
        studio_address_encoded: encodeURIComponent(STUDIO.address)
      }
    };
  }

  /**
   * Изпраща двата имейла. Никога не хвърля грешка —
   * резервацията вече е запазена и не бива да се губи заради имейл.
   * Връща { client, business, ready } със стойности 'ok' | 'skip' | 'fail'.
   */
  async function send(booking) {
    if (!isReady()) return { ready: false, client: 'skip', business: 'skip' };

    const p = params(booking);
    const jobs = [];

    // до клиента — само ако е оставил имейл
    jobs.push(booking.email && cfg.clientTemplateId
      ? window.emailjs.send(cfg.serviceId, cfg.clientTemplateId, p.client)
      : Promise.reject(new Error('skip')));

    // до салона — винаги
    jobs.push(cfg.businessTemplateId
      ? window.emailjs.send(cfg.serviceId, cfg.businessTemplateId, p.business)
      : Promise.reject(new Error('skip')));

    const [client, business] = await Promise.allSettled(jobs);
    const mark = (res, skipped) =>
      res.status === 'fulfilled' ? 'ok' : (skipped ? 'skip' : 'fail');

    if (client.status === 'rejected' && client.reason && client.reason.message !== 'skip') {
      console.warn('Имейлът до клиента не тръгна:', client.reason);
    }
    if (business.status === 'rejected' && business.reason && business.reason.message !== 'skip') {
      console.warn('Имейлът до салона не тръгна:', business.reason);
    }

    return {
      ready: true,
      client: mark(client, !booking.email || !cfg.clientTemplateId),
      business: mark(business, !cfg.businessTemplateId)
    };
  }

  return { init, isReady, send, googleCalendarUrl, salonEmail: cfg.salonEmail };
})();

/* ============================================================
   Google Календар през Apps Script.

   Заетите часове се теглят за конкретния ден чак когато клиентът
   го избере — така календарът на месеца не прави 30 заявки.
   Ако услугата не отговори, сайтът продължава да работи само с
   локално запазените часове.
   ============================================================ */

const Calendar = (() => {
  const cfg = typeof CALENDAR_CONFIG !== 'undefined' ? CALENDAR_CONFIG : { enabled: false };

  const busy = new Map();     // 'YYYY-MM-DD' → [{ start, duration, staffId }]
  const state = new Map();    // 'YYYY-MM-DD' → 'ok' | 'fail' | 'off'
  const inflight = new Map(); // 'YYYY-MM-DD' → Promise

  const isOn = () => !!(cfg.enabled && cfg.webAppUrl && !cfg.webAppUrl.startsWith('YOUR_'));

  /* ---------- Разчитане на часове ---------- */

  /** '09:30' | 570 | '2026-09-07T09:30:00' → минути от полунощ */
  function toMinutes(value) {
    if (value == null) return null;
    if (typeof value === 'number' && isFinite(value)) return value;

    const text = String(value).trim();
    const hhmm = text.match(/^(\d{1,2}):(\d{2})/);
    if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);

    const iso = text.match(/T(\d{2}):(\d{2})/);
    if (iso) return Number(iso[1]) * 60 + Number(iso[2]);

    const parsed = new Date(text);
    if (!isNaN(parsed)) return parsed.getHours() * 60 + parsed.getMinutes();
    return null;
  }

  /** Привежда отговора на Apps Script към [{ start, duration, staffId }] */
  function parseBusy(list) {
    if (!Array.isArray(list)) return [];
    const fallback = Number(cfg.defaultBusyMinutes) || 60;

    return list.map(entry => {
      // прост запис: само начален час
      if (typeof entry === 'string' || typeof entry === 'number') {
        const start = toMinutes(entry);
        return start == null ? null : { start, duration: fallback, staffId: null };
      }
      if (!entry || typeof entry !== 'object') return null;

      const start = toMinutes(entry.start ?? entry.time ?? entry.from ?? entry.startTime);
      if (start == null) return null;

      const end = toMinutes(entry.end ?? entry.to ?? entry.endTime);
      const duration = Number(entry.duration) > 0
        ? Number(entry.duration)
        : (end != null && end > start ? end - start : fallback);

      return { start, duration, staffId: entry.staff || entry.staffId || null };
    }).filter(Boolean);
  }

  /* ---------- Четене ---------- */

  /** Синхронно: какво вече знаем за деня. Празно, ако още не е теглено. */
  function cachedBusy(dateKey, staffId) {
    const list = busy.get(dateKey);
    if (!list || !list.length) return [];
    // общ календар за студиото → зает час блокира всички специалисти
    return list.filter(b => !b.staffId || b.staffId === staffId || cfg.sharedCalendar);
  }

  /** Тегли заетите часове за деня (веднъж на ден, с кеш) */
  function load(dateKey, { force = false } = {}) {
    if (!isOn()) {
      state.set(dateKey, 'off');
      return Promise.resolve('off');
    }
    if (!force && state.has(dateKey) && state.get(dateKey) === 'ok') {
      return Promise.resolve('ok');
    }
    if (inflight.has(dateKey)) return inflight.get(dateKey);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (cfg.timeoutSeconds || 8) * 1000);

    const job = fetch(`${cfg.webAppUrl}?date=${encodeURIComponent(dateKey)}`, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(data => {
        const list = (data && (data.busySlots || data.busy || data.slots)) || [];
        busy.set(dateKey, parseBusy(list));
        state.set(dateKey, 'ok');
        return 'ok';
      })
      .catch(err => {
        console.warn('Заетите часове не се заредиха от календара:', err && err.message);
        if (!busy.has(dateKey)) busy.set(dateKey, []);
        state.set(dateKey, 'fail');
        return 'fail';
      })
      .finally(() => {
        clearTimeout(timer);
        inflight.delete(dateKey);
      });

    inflight.set(dateKey, job);
    return job;
  }

  const statusFor = dateKey => state.get(dateKey) || (isOn() ? 'unknown' : 'off');

  /* ---------- Записване ---------- */

  /**
   * Изпраща резервацията към Apps Script, който я вписва в календара.
   * Имената на полетата са същите като в оригиналния скрипт.
   */
  async function push(booking) {
    if (!isOn() || !cfg.sendBookings) return { ok: false, skipped: true };

    const service = Booking.getService(booking.serviceId);
    const staff = Booking.getStaff(booking.staffId);
    const category = service ? Booking.getCategory(service.category) : null;

    const payload = {
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      notes: booking.note || '',
      categoryLabel: category ? category.name : '',
      serviceName: service ? `${service.name} (при ${staff ? staff.name : '—'})` : '',
      specialist: staff ? staff.name : '',
      specialistId: booking.staffId,
      dateFormatted: Booking.formatDateLong(booking.date),
      time: Booking.formatTime(booking.start),
      rawDate: booking.date,
      rawTime: Booking.formatTime(booking.start),
      duration: booking.duration,
      price: booking.price,
      code: booking.code
    };

    try {
      // text/plain пести CORS preflight заявката към Apps Script
      await fetch(cfg.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      // часът вече е зает и за следващия посетител
      busy.set(booking.date, (busy.get(booking.date) || []).concat({
        start: booking.start, duration: booking.duration, staffId: booking.staffId
      }));
      return { ok: true };
    } catch (err) {
      console.warn('Резервацията не стигна до календара:', err && err.message);
      return { ok: false, error: err };
    }
  }

  Booking.setBusyProvider(cachedBusy);

  return { isOn, load, cachedBusy, statusFor, push, parseBusy, toMinutes };
})();
