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
    { day: 0, label: 'Неделя', text: 'Почивен ден' },
    { day: 1, label: 'Понеделник', text: '09:00 – 19:00' },
    { day: 2, label: 'Вторник', text: '09:00 – 19:00' },
    { day: 3, label: 'Сряда', text: '09:00 – 19:00' },
    { day: 4, label: 'Четвъртък', text: '09:00 – 20:00' },
    { day: 5, label: 'Петък', text: '09:00 – 20:00' },
    { day: 6, label: 'Събота', text: '10:00 – 16:00' }
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

/* --- Специалисти.
   works: работни дни с начало/край в минути от полунощ
   break: почивка (по избор)
   services: списък с id на услуги, които прави --- */
const STAFF = [
  {
    id: 'mila',
    name: 'Мила Тодорова',
    role: 'Стилист, основател',
    bio: 'Работи с цвят вече 12 години. Обича меките, естествени преходи и прически, които се поддържат лесно вкъщи.',
    initials: 'МТ',
    tone: 'tone-rose',
    services: ['cut-women', 'cut-men', 'color', 'balayage', 'styling', 'keratin'],
    schedule: {
      1: { start: 9 * 60,  end: 19 * 60 },
      2: { start: 9 * 60,  end: 19 * 60 },
      4: { start: 9 * 60,  end: 20 * 60 },
      5: { start: 9 * 60,  end: 20 * 60 },
      6: { start: 10 * 60, end: 16 * 60 }
    },
    breakTime: { start: 13 * 60, end: 13 * 60 + 45 }
  },
  {
    id: 'ivan',
    name: 'Иван Петков',
    role: 'Барбер и стилист',
    bio: 'Прецизен в класическите мъжки линии, но също така прави и дамски къси форми с характер.',
    initials: 'ИП',
    tone: 'tone-sage',
    services: ['cut-men', 'cut-women', 'styling'],
    schedule: {
      1: { start: 10 * 60, end: 19 * 60 },
      2: { start: 10 * 60, end: 19 * 60 },
      3: { start: 10 * 60, end: 19 * 60 },
      5: { start: 11 * 60, end: 20 * 60 },
      6: { start: 10 * 60, end: 16 * 60 }
    },
    breakTime: { start: 14 * 60, end: 14 * 60 + 30 }
  },
  {
    id: 'rada',
    name: 'Рада Ганева',
    role: 'Маникюрист',
    bio: 'Здравето на ноктите преди всичко. Специалист по изграждане и чист, минималистичен дизайн.',
    initials: 'РГ',
    tone: 'tone-sand',
    services: ['mani-classic', 'mani-build', 'pedi', 'nail-art'],
    schedule: {
      1: { start: 9 * 60,  end: 18 * 60 },
      3: { start: 9 * 60,  end: 18 * 60 },
      4: { start: 9 * 60,  end: 20 * 60 },
      5: { start: 9 * 60,  end: 19 * 60 },
      6: { start: 10 * 60, end: 16 * 60 }
    },
    breakTime: { start: 13 * 60, end: 13 * 60 + 30 }
  },
  {
    id: 'elena',
    name: 'Елена Стоева',
    role: 'Козметик',
    bio: 'Дерматологично образование и лек подход към кожата. Работи с протоколи, съобразени с всеки тип лице.',
    initials: 'ЕС',
    tone: 'tone-lilac',
    services: ['facial-deep', 'facial-hydra', 'facial-anti', 'brow-shape', 'brow-laminate', 'lash-ext'],
    schedule: {
      2: { start: 9 * 60,  end: 19 * 60 },
      3: { start: 9 * 60,  end: 19 * 60 },
      4: { start: 11 * 60, end: 20 * 60 },
      5: { start: 9 * 60,  end: 19 * 60 }
    },
    breakTime: { start: 13 * 60, end: 14 * 60 }
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
  slotStep: 15,          // на колко минути се предлагат начални часове
  minLeadMinutes: 90,    // най-рано колко време напред може да се запази час
  maxDaysAhead: 45,      // докъде напред е отворен календарът
  storageKey: 'laurel.bookings.v1'
};
