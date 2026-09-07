/**
 * Студио Лорел — Google Apps Script Web App
 * =========================================
 * Свързва сайта с Google Календар:
 *
 *   GET  ?date=YYYY-MM-DD → { status: "success", date, busySlots: [{ start, end }] }
 *   POST { резервация }    → създава събитие в календара (и ред в таблица, по избор)
 *
 * Важно: busySlots връща и НАЧАЛО, и КРАЙ на всяко събитие. Ако се върне само
 * начален час, сайтът няма как да разбере колко трае събитието и приема 60
 * минути — тогава двучасов час в календара запушва само първия час.
 */

/* ---------- Настройки ---------- */

// 'primary' е основният календар на акаунта. За друг сложете неговото id
// (Календар → Настройки → Интеграция на календара → ID на календара).
const CALENDAR_ID = 'primary';

// По избор: id на Google Sheet, в който да се трупат резервациите.
// Оставете празно, ако не искате таблица.
const SHEET_ID = '';
const SHEET_NAME = 'Резервации';

// Часовата зона на студиото. Задайте същата и в Project Settings → Time zone.
const TIMEZONE = 'Europe/Sofia';

// Заглавие на събитието в календара
function eventTitle(data) {
  return `${data.serviceName || 'Час'} — ${data.name || 'клиент'}`;
}

/* ---------- GET: заетите часове за един ден ---------- */

function doGet(e) {
  try {
    const dateStr = (e && e.parameter && e.parameter.date) || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return json({ status: 'error', message: 'Липсва или е сгрешен параметър date (очаква се YYYY-MM-DD)' });
    }

    const parts = dateStr.split('-').map(Number);
    const dayStart = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    const dayEnd = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59);

    const events = calendar().getEvents(dayStart, dayEnd);

    const busySlots = events.map(function (ev) {
      // целодневно събитие → целият ден е зает
      if (ev.isAllDayEvent()) {
        return { start: '00:00', end: '23:59', title: ev.getTitle() };
      }
      // събитие, започнало предния ден или свършващо на следващия — отрязваме
      const from = ev.getStartTime() < dayStart ? dayStart : ev.getStartTime();
      const to = ev.getEndTime() > dayEnd ? dayEnd : ev.getEndTime();
      return { start: hhmm(from), end: hhmm(to), title: ev.getTitle() };
    });

    return json({ status: 'success', date: dateStr, busySlots: busySlots });
  } catch (err) {
    return json({ status: 'error', message: String(err) });
  }
}

/* ---------- POST: нова резервация ---------- */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const dateStr = data.rawDate;                 // 'YYYY-MM-DD'
    const timeStr = data.rawTime || data.time;    // 'HH:MM'
    const duration = Number(data.duration) > 0 ? Number(data.duration) : 60;

    if (!dateStr || !timeStr) {
      return json({ status: 'error', message: 'Липсва дата или час' });
    }

    const d = dateStr.split('-').map(Number);
    const t = String(timeStr).split(':').map(Number);
    const start = new Date(d[0], d[1] - 1, d[2], t[0], t[1], 0);
    const end = new Date(start.getTime() + duration * 60000);

    const description = [
      'Клиент: ' + (data.name || '—'),
      'Телефон: ' + (data.phone || '—'),
      'Имейл: ' + (data.email || '—'),
      'Услуга: ' + (data.serviceName || '—'),
      'Специалист: ' + (data.specialist || '—'),
      'Цена: ' + (data.price != null ? data.price + ' лв.' : '—'),
      'Код: ' + (data.code || '—'),
      'Бележка: ' + (data.notes || '—')
    ].join('\n');

    const event = calendar().createEvent(eventTitle(data), start, end, { description: description });

    appendToSheet(data, start, end);

    return json({
      status: 'success',
      eventId: event.getId(),
      start: hhmm(start),
      end: hhmm(end)
    });
  } catch (err) {
    return json({ status: 'error', message: String(err) });
  }
}

/* ---------- Помощни ---------- */

function calendar() {
  return CALENDAR_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CALENDAR_ID);
}

function hhmm(date) {
  return Utilities.formatDate(date, TIMEZONE, 'HH:mm');
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendToSheet(data, start, end) {
  if (!SHEET_ID) return;
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Запазено на', 'Дата', 'От', 'До', 'Услуга', 'Специалист',
                       'Клиент', 'Телефон', 'Имейл', 'Цена', 'Код', 'Бележка']);
    }
    sheet.appendRow([
      new Date(), data.rawDate, hhmm(start), hhmm(end),
      data.serviceName || '', data.specialist || '',
      data.name || '', data.phone || '', data.email || '',
      data.price || '', data.code || '', data.notes || ''
    ]);
  } catch (err) {
    console.warn('Редът не влезе в таблицата: ' + err);
  }
}

/* ---------- Проверка от редактора ---------- */

/** Пуснете това от Apps Script редактора, за да видите какво връща GET за днес. */
function testDoGet() {
  const today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const res = doGet({ parameter: { date: today } });
  console.log(res.getContent());
}
