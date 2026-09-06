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

  /**
   * Връща свободните начални часове (в минути от полунощ) за
   * специалист + ден + продължителност на услугата.
   */
  const slotsFor = (staffId, dateKey, duration) => {
    const staff = getStaff(staffId);
    if (!staff || !duration) return [];

    const date = fromKey(dateKey);
    const today = startOfToday();
    const limit = addDays(today, maxDaysAhead);
    if (date < today || date > limit) return [];

    const shift = staff.schedule[date.getDay()];
    if (!shift) return [];

    const taken = forStaffDay(staffId, dateKey);
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
      if (t < earliest) continue;
      if (brk && overlaps(t, duration, brk.start, brk.end - brk.start)) continue;
      if (taken.some(b => overlaps(t, duration, b.start, b.duration))) continue;
      out.push(t);
    }
    return out;
  };

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
    slotsFor, dayHasSlots, countFreeSlots, icsFor,
    maxDaysAhead
  };
})();
