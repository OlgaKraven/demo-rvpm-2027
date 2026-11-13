import {databaseCheckpoints,backendCheckpoints} from './data-checkpoints.mjs';

export const starterCss = `* { box-sizing: border-box; }
body { margin: 0; font: 1rem/1.5 system-ui, sans-serif; }
main, header, footer { padding: 1rem; }
img { max-width: 100%; height: auto; }
input, select, textarea, button { font: inherit; }
input, select, textarea { max-width: 100%; }
.site-nav, header nav { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
.nav-toggle, [data-password-toggle] { display: none; }
.skip, .skip-link { position: absolute; inset-inline-start: -100vw; }
.skip:focus, .skip-link:focus { inset-inline-start: 1rem; }
`;

const palette = `:root {
  --primary: #007bff;
  --heading: #0d47a1;
  --muted: #6c757d;
  --background: #f8f9fa;
  --surface: #fff;
}
body { background: var(--background); color: #172033; }
h1, h2, h3 { color: var(--heading); }
h1 { font-size: 36px; }
h2 { font-size: 24px; }
h3 { font-size: 18px; }
.muted, .form-hint { color: var(--muted); }
.card, .room-card, .form-card, .application-card {
  background: var(--surface);
  border: 1px solid #d4dce8;
  padding: 1rem;
  border-radius: .75rem;
}
button, .button, .btn, .nav-primary {
  background: var(--primary);
  color: #061729;
  border: 1px solid transparent;
  border-radius: .4rem;
  padding: .55rem .8rem;
}
button:hover, .button:hover, .btn:hover, .nav-primary:hover {
  background: var(--heading);
  color: #fff;
}`;

const font = prefix => `@font-face {
  font-family: "PT Sans";
  src: url("${prefix}fonts/PTSans-Regular.ttf") format("truetype");
  font-display: swap;
}
@font-face {
  font-family: "PT Sans";
  src: url("${prefix}fonts/PTSans-Bold.ttf") format("truetype");
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: "PT Sans";
  src: url("${prefix}fonts/PTSans-Italic.ttf") format("truetype");
  font-style: italic;
  font-display: swap;
}
body { font-family: "PT Sans", sans-serif; font-size: 16px; }
.form-hint, .muted { font-size: 12px; font-style: italic; }`;

const adaptive = `.container, main { width: min(100%, 72rem); margin-inline: auto; }
.grid, .room-grid, .applications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr));
  gap: 1rem;
}
.grid > *, .room-grid > *, .applications-grid > *, .form-card { min-width: 0; }
form :is(input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), select, textarea) {
  display: block;
  width: 100%;
  min-width: 0;
  padding: .5rem;
}
form label, form legend { overflow-wrap: anywhere; }
.form-card { max-width: 42rem; margin-inline: auto; }
.error, .field-error, .flash-error { color: #9c1d3d; overflow-wrap: anywhere; }
@media (max-width: 600px) {
  .form-row, .form-grid { display: block; }
}`;

const focus = `:focus-visible { outline: 3px solid #0d47a1; outline-offset: 3px; }
button:focus-visible, .button:focus-visible, .btn:focus-visible {
  outline: 3px solid #0d47a1;
  outline-offset: 3px;
}`;

const feedbackCss = `button { transition: background-color .15s, transform .15s; }
button:active { transform: translateY(1px); }
button:disabled { opacity: .7; cursor: wait; }
@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
  button:active { transform: none; }
}`;

const feedbackJs = `document.querySelectorAll("form[method=post]").forEach(form => {
  form.addEventListener("submit", event => {
    const button = event.submitter;
    if (!button) return;
    button.dataset.originalLabel = button.textContent;
    button.textContent = "Отправка…";
    setTimeout(() => { button.disabled = true; }, 0);
  });
});
window.addEventListener("pageshow", () => {
  document.querySelectorAll("button[data-original-label]").forEach(button => {
    button.textContent = button.dataset.originalLabel;
    button.disabled = false;
    delete button.dataset.originalLabel;
  });
});`;

const flaskRoomHint = `const room = document.querySelector("[data-room-select]");
const hint = document.querySelector("[data-room-hint]");
if (room && hint) {
  const update = () => {
    const option = room.selectedOptions[0];
    hint.textContent = option?.dataset.capacity
      ? "Вместимость до " + option.dataset.capacity + " чел."
      : "Выберите помещение.";
  };
  room.addEventListener("change", update);
  update();
}`;

const imageStyle = `.card img, .room-card img, .room-detail img {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  display: block;
}`;

const choiceStyle = `#room_id, #payment_method, form[method="get"] select {
  color: var(--heading);
  background: var(--surface);
  border: 1px solid var(--muted);
  border-radius: .4rem;
  min-height: 44px;
}
#room_id, #payment_method { margin-block-end: .75rem; }`;

export function studentEdits(stack) {
  const php = stack === 'php';
  const css = php ? 'static/style.css' : 'static/css/style.css';
  const js = php ? 'static/app.js' : 'static/js/app.js';
  return {
    design: {
      0: [{file:css, code:palette}],
      1: [{file:css, code:font(php?'':'../')}],
      2: [{file:css, code:imageStyle}],
      3: [{file:css, code:adaptive}],
      4: [{file:css, code:choiceStyle}],
      5: [{file:css, code:focus}]
    },
    interaction: {
      1: [{file:css, code:feedbackCss}, {file:js, code:php?feedbackJs:feedbackJs+'\n\n'+flaskRoomHint}]
    }
  };
}

const applicationCheck = `SELECT r.name AS room, a.payment_method, a.status
FROM applications AS a
JOIN rooms AS r ON r.id = a.room_id
WHERE a.conference_name = 'Проверка списка'
ORDER BY a.id DESC LIMIT 1;`;

const countApplications = `SELECT COUNT(*) AS applications_found
FROM applications
WHERE conference_name = 'Проверка перенаправления';`;

const countReviews = `SELECT a.id, a.status, COUNT(r.id) AS reviews_found
FROM applications AS a
LEFT JOIN reviews AS r ON r.application_id = a.id
WHERE a.conference_name = 'Проверка отзыва'
GROUP BY a.id, a.status
ORDER BY a.id DESC LIMIT 1;`;

const inspectIndexes = `SELECT id, username FROM users WHERE username = 'student27';

EXPLAIN SELECT * FROM applications
WHERE user_id = (SELECT id FROM users WHERE username = 'student27');

SHOW INDEX FROM applications
WHERE Column_name IN ('user_id', 'status', 'event_date', 'room_id');`;

const inspectResources = `const external = performance.getEntriesByType("resource")
  .map(entry => new URL(entry.name))
  .filter(url => ["http:", "https:"].includes(url.protocol) && url.origin !== location.origin)
  .map(url => url.href);
console.log(external);`;

const qaNotes = `# Проверка задания 3

| Действие | Ожидаемый результат | Фактический результат |
| --- | --- | --- |
| Отправить заявку и дважды обновить кабинет | Добавилась одна запись | Заполнить после проверки |
| Проверить отзыв до и после завершения | До завершения формы нет, после сохраняется один отзыв | Заполнить после проверки |
| Обновить каталог без интернета | Загружаются локальные стили, шрифт и фото | Заполнить после проверки |`;

const sql = (instruction,code)=>({target:'phpMyAdmin → SQL',instruction,code});
const terminal = (instruction,code)=>({target:'PowerShell в папке проекта',instruction,code});

export function studentChecks(stack) {
  const php=stack==='php';
  return {
    database:databaseCheckpoints(stack),
    backend:backendCheckpoints(stack),
    design:{
      4:[sql('Выберите свою учебную базу и выполните запрос после отправки заявки «Проверка списка».',applicationCheck)],
      5:[terminal('Сохраните снимки в docs. После git diff проверьте список подготовленных файлов, затем выполните последнюю команду.',`git status
git add static docs
git diff --cached --stat
git commit -m "Задание 2: стиль и адаптация проверены"`)]
    },
    interaction:{
      0:[
        {
          target:php?'index.php · ветка new':'app.py · функция new_application',
          instruction:'Найдите переход сразу после успешного сохранения заявки. Сверьте эту строку с фрагментом. Если её нет, восстановите обработчик по карточке форм.',
          code:php?"go('dashboard');":'return redirect(url_for("portal.dashboard"))',
          backendStep:php?4:6
        },
        sql('Выполните запрос до отправки заявки «Проверка перенаправления» и ещё раз после двух обновлений кабинета. Запишите оба числа.',countApplications)
      ],
      2:[
        {
          target:php?'index.php · ветка review':'app.py · функция add_review',
          instruction:'Найдите выборку по id заявки и id владельца, затем проверку статуса completed перед INSERT INTO reviews. Сверьте строку ниже. Если обработчик отсутствует, восстановите его по карточке форм.',
          code:php
            ?"if($a['status']!=='completed')fail(403,'Отзыв доступен после завершения мероприятия.');"
            :'    if application["status"] != "completed":\n        flash("Отзыв можно оставить только после завершения мероприятия.", "error")',
          backendStep:php?5:8
        },
        sql('Выполните запрос для заявки «Проверка отзыва» до публикации и после неё. Сверьте значение reviews_found.',countReviews)
      ],
      3:[sql('Выполните три запроса в рабочей базе. Если первая выборка пуста, зарегистрируйте student27 по карточке форм и повторите проверку.',inspectIndexes)],
      4:[{
        target:'F12 → Console в открытом портале',
        instruction:'После обновления каталога дождитесь загрузки фото. Выполните код в консоли этой страницы и проверьте список внешних HTTP-запросов.',
        code:inspectResources
      }],
      5:[
        {
          target:'docs/QA.md · создайте файл',
          instruction:'Вставьте шаблон в пустой файл. Заполните третий столбец своими результатами и сохраните.',
          code:qaNotes
        },
        terminal('Выполните команды после проверки. Просмотрите список подготовленных файлов перед коммитом.',`git status
git add .
git diff --cached --stat
git commit -m "Задание 3: интерактивность и целостность проверены"`)
      ]
    }
  };
}
