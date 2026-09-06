/* ============================================================
   Настройки за изпращане на имейли (EmailJS)

   Тук се въвеждат ключовете от акаунта в https://emailjs.com.
   publicKey е предназначен за браузъра и не е таен, но всеки,
   който отвори сайта, го вижда — затова в EmailJS ограничете
   позволените домейни (Account → Security → Allowed origins).
   ============================================================ */

const EMAIL_CONFIG = {
  enabled: true,

  publicKey: 'B2YPA4yp6vwMWlh7w',
  serviceId: 'service_8it0oal',

  // шаблон за клиента (потвърждение) и за салона (известие)
  clientTemplateId: 'template_m6a6lwo',
  businessTemplateId: 'template_o2z5dfi',

  // на този адрес идват известията за нови резервации
  salonEmail: 'ilievdilyan@gmail.com'
};
