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
  color: #fff;
  border: 1px solid transparent;
  border-radius: .4rem;
  padding: .55rem .8rem;
}
button:hover, .button:hover, .btn:hover, .nav-primary:hover {
  background: var(--heading);
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
      5: [{file:css, code:focus}]
    },
    interaction: {
      1: [{file:css, code:feedbackCss}, {file:js, code:php?feedbackJs:feedbackJs+'\n\n'+flaskRoomHint}]
    }
  };
}
