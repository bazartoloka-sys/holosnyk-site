// Голосник — головна: листок відривного календаря.
// Дата за київським часом; схід і захід сонця над Києвом рахуються тут же
// (спрощений астрономічний алгоритм, точність ±1–2 хв, як у друкованих календарях).

(function () {
  var TZ = 'Europe/Kyiv';
  var MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  var MONTHS_NOM = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
  var DAYS = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];

  function tz() {
    try { new Intl.DateTimeFormat('uk', { timeZone: TZ }); return TZ; }
    catch (e) { return 'Europe/Kiev'; }
  }
  var zone = tz();

  // Календарна дата в Києві: {y, m (0..11), d, w (0 = неділя)}
  function kyivDate(when) {
    var parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
      .formatToParts(when).forEach(function (p) { parts[p.type] = p.value; });
    var wmap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { y: +parts.year, m: +parts.month - 1, d: +parts.day, w: wmap[parts.weekday] };
  }

  function hhmm(date) {
    return new Intl.DateTimeFormat('uk', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }

  // Схід і захід сонця (за формулами, які використовує бібліотека SunCalc)
  function sunTimes(date, lat, lng) {
    var rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545;
    var d = date.valueOf() / dayMs - 0.5 + J1970 - J2000;
    var lw = -lng * rad, phi = lat * rad;
    var n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
    var ds = 0.0009 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    var L = M + C + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(L) * Math.sin(rad * 23.4397));
    var Jnoon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var h0 = -0.833 * rad;
    var w = Math.acos((Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var a = 0.0009 + (w + lw) / (2 * Math.PI) + n;
    var Jset = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var Jrise = Jnoon - (Jset - Jnoon);
    function fromJ(j) { return new Date((j + 0.5 - J1970) * dayMs); }
    return { rise: fromJ(Jrise), set: fromJ(Jset) };
  }

  function fill(sheet, when) {
    var k = kyivDate(when);
    var q = function (sel) { return sheet.querySelector(sel); };
    q('.sheet__month').textContent = MONTHS_NOM[k.m];
    q('.sheet__year').textContent = k.y + ' рік';
    q('.sheet__day').textContent = k.d;
    q('.sheet__weekday').textContent = DAYS[k.w];
    sheet.classList.toggle('is-sunday', k.w === 0);
    sheet.setAttribute('aria-label', DAYS[k.w] + ', ' + k.d + ' ' + MONTHS[k.m] + ' ' + k.y + ' року');

    var sun = q('.sheet__sun');
    if (!sun) return;
    var t = sunTimes(when, 50.4501, 30.5234);
    var mins = Math.round((t.set - t.rise) / 60000);
    q('[data-sun="rise"]').textContent = hhmm(t.rise);
    q('[data-sun="set"]').textContent = hhmm(t.set);
    q('[data-sun="len"]').textContent = Math.floor(mins / 60) + ':' + String(mins % 60).padStart(2, '0');
  }

  var today = document.getElementById('sheetToday');
  var gone = document.getElementById('sheetGone');
  if (!today) return;

  try {
    var now = new Date();
    fill(today, now);
    if (gone) {
      fill(gone, new Date(now.valueOf() - 86400000));
      gone.addEventListener('animationend', function () { gone.remove(); });
    }
  } catch (e) {
    // Якщо браузер не вміє часові пояси, лишається дата, вписана в HTML.
    if (gone) gone.remove();
  }
})();
