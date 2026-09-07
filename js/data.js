/* ============================================================
   Студио Лорел — данни за сайта
   Тук се сменят услуги, цени, специалисти и работно време.
   ============================================================ */

const STUDIO = {
  name: 'Студио Лорел',
  tagline: 'Салон за красота',
  phone: '+359 88 123 4567',
  phoneHref: '+359881234567',
  email: 'hello@studiolaurel.bg',
  address: 'ул. „Цар Иван Шишман“ 24, София 1000',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=ул.+Цар+Иван+Шишман+24+София',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  // 0 = неделя … 6 = събота
  hours: [
    { day: 0, label: 'Неделя', text: '09:00 – 20:00' },
    { day: 1, label: 'Понеделник', text: '09:00 – 20:00' },
    { day: 2, label: 'Вторник', text: '09:00 – 20:00' },
    { day: 3, label: 'Сряда', text: '09:00 – 20:00' },
    { day: 4, label: 'Четвъртък', text: '09:00 – 20:00' },
    { day: 5, label: 'Петък', text: '09:00 – 20:00' },
    { day: 6, label: 'Събота', text: '09:00 – 20:00' }
  ]
};

/* --- Категории услуги --- */
const CATEGORIES = [
  { id: 'hair', name: 'Коса', note: 'Подстригване, цвят, стайлинг' },
  { id: 'nails', name: 'Маникюр', note: 'Ръце, крака, дизайн' },
  { id: 'face', name: 'Лице', note: 'Терапии и грижа за кожата' },
  { id: 'brows', name: 'Вежди и мигли', note: 'Оформяне и удължаване' }
];

/* --- Услуги. duration е в минути, price в лева --- */
const SERVICES = [
  { id: 'cut-women',    category: 'hair',  name: 'Дамско подстригване',        desc: 'Консултация, измиване, подстригване и сешоар.',            duration: 60,  price: 55 },
  { id: 'cut-men',      category: 'hair',  name: 'Мъжко подстригване',         desc: 'Машинка и ножица, оформяне на контури.',                   duration: 45,  price: 35 },
  { id: 'color',        category: 'hair',  name: 'Боядисване на коса',         desc: 'Цвят по избор, грижа след боя и оформяне.',                duration: 120, price: 120 },
  { id: 'balayage',     category: 'hair',  name: 'Балеаж / кичури',            desc: 'Свободна техника с плавен преход и тониране.',             duration: 180, price: 190 },
  { id: 'styling',      category: 'hair',  name: 'Официален стайлинг',         desc: 'Прическа за повод — коктейл, сватба, снимки.',             duration: 75,  price: 70 },
  { id: 'keratin',      category: 'hair',  name: 'Кератинова терапия',         desc: 'Изглаждане и възстановяване на структурата.',              duration: 150, price: 210 },

  { id: 'mani-classic', category: 'nails', name: 'Класически маникюр',         desc: 'Оформяне, кожички, лак или гел лак.',                      duration: 60,  price: 45 },
  { id: 'mani-build',   category: 'nails', name: 'Ноктопластика',              desc: 'Изграждане с гел, форма и цвят по избор.',                 duration: 105, price: 85 },
  { id: 'pedi',         category: 'nails', name: 'СПА педикюр',                desc: 'Вана, ексфолиация, оформяне и гел лак.',                   duration: 75,  price: 60 },
  { id: 'nail-art',     category: 'nails', name: 'Нейл арт декорация',         desc: 'Ръчна рисунка или дизайн върху готов маникюр.',            duration: 30,  price: 25 },

  { id: 'facial-deep',  category: 'face',  name: 'Дълбоко почистване',         desc: 'Диагностика, ексфолиация, екстракция, маска.',             duration: 90,  price: 95 },
  { id: 'facial-hydra', category: 'face',  name: 'Хидратираща терапия',        desc: 'Хиалуронов концентрат и масаж на лице.',                   duration: 60,  price: 80 },
  { id: 'facial-anti',  category: 'face',  name: 'Анти-ейдж протокол',         desc: 'Пилинг и активни серуми за стегната кожа.',                duration: 75,  price: 130 },

  { id: 'brow-shape',   category: 'brows', name: 'Оформяне на вежди',          desc: 'Архитектура с конец и пинсета.',                           duration: 30,  price: 30 },
  { id: 'brow-laminate',category: 'brows', name: 'Ламиниране на вежди',        desc: 'Фиксиране на посоката, боядисване и грижа.',               duration: 60,  price: 70 },
  { id: 'lash-ext',     category: 'brows', name: 'Удължаване на мигли',        desc: 'Косъм по косъм, класика или обем 2D–4D.',                  duration: 120, price: 110 }
];

/* Помощник за график: еднакво работно време през цялата седмица.
   Засега няма почивни дни. За да въведете почивен ден, подайте дните
   изрично, напр. week(9, 20, [1, 2, 4, 5, 6]) — 0 е неделя, 6 е събота. */
const week = (startHour, endHour, days = [0, 1, 2, 3, 4, 5, 6]) =>
  days.reduce((acc, d) => {
    acc[d] = { start: startHour * 60, end: endHour * 60 };
    return acc;
  }, {});

/* --- Специалисти.
   Засега работи един човек, който прави всички услуги. Когато дойде
   втори, добавете още един обект тук: сайтът сам показва стъпката
   „Специалист“ в резервацията, щом хората станат повече от един.

   services  — кои услуги прави (SERVICES.map(...) значи всички)
   schedule  — работни дни и часове
   breakTime — почивка; махнете реда, за да няма почивка (по избор) --- */
const STAFF = [
  {
    id: 'mila',
    name: 'Мила Тодорова',
    role: 'Основател и специалист',
    bio: 'Дванадесет години зад стола — коса, нокти, грижа за лице и вежди. ' +
         'Работи с по един клиент наведнъж, без бързане и без чакане на ред.',
    initials: 'МТ',
    tone: 'tone-rose',
    services: SERVICES.map(s => s.id),
    schedule: week(9, 20),
    breakTime: { start: 12 * 60 + 30, end: 13 * 60 + 30 }
  }
];

/* --- Отзиви --- */
const REVIEWS = [
  { text: 'Първият салон, в който излизам с точно това, което съм си представяла. Мила слуша, преди да вземе ножицата.', author: 'Виктория Д.', service: 'Балеаж' },
  { text: 'Записах се онлайн за 40 секунди и получих напомняне. Дребно нещо, но променя цялото усещане.', author: 'Стефан К.', service: 'Мъжко подстригване' },
  { text: 'Рада ми спаси ноктите след лоша ноктопластика другаде. Три месеца по-късно са в перфектно състояние.', author: 'Ния П.', service: 'Ноктопластика' },
  { text: 'Терапията при Елена е най-спокойният час от месеца ми. И кожата наистина се вижда различна.', author: 'Мария Г.', service: 'Дълбоко почистване' }
];

/* --- Галерия (CSS композиции вместо снимки — сменете с реални изображения) --- */
const GALLERY = [
  { id: 'g1', category: 'hair',  label: 'Меден балеаж',      art: 'art-1' },
  { id: 'g2', category: 'nails', label: 'Мляко и злато',     art: 'art-2' },
  { id: 'g3', category: 'face',  label: 'Сияйна кожа',       art: 'art-3' },
  { id: 'g4', category: 'hair',  label: 'Къса форма',        art: 'art-4' },
  { id: 'g5', category: 'brows', label: 'Ламинирани вежди',  art: 'art-5' },
  { id: 'g6', category: 'nails', label: 'Френски маникюр',   art: 'art-6' },
  { id: 'g7', category: 'hair',  label: 'Официална прическа',art: 'art-7' },
  { id: 'g8', category: 'face',  label: 'Анти-ейдж ритуал',  art: 'art-8' }
];

/* --- Настройки на резервациите --- */
const BOOKING_CONFIG = {
  slotStep: 30,          // на колко минути се предлагат начални часове
  minLeadMinutes: 90,    // най-рано колко време напред може да се запази час
  maxDaysAhead: 45,      // докъде напред е отворен календарът
  storageKey: 'laurel.bookings.v2'
};
