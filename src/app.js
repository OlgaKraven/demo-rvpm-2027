(()=>{'use strict';
const D=COURSE,C=ExamCore,E=C.escape,root=document.getElementById('app');
const params = new URLSearchParams(location.search);
let memory={},storageOK=true;const prefix='rvpm-2027-basic-v1:';
function get(k,f=null){try{return JSON.parse(localStorage.getItem(prefix+k))??f;}catch{storageOK=false;return memory[k]??f;}}
function set(k,v){memory[k]=v;try{localStorage.setItem(prefix+k,JSON.stringify(v));}catch{storageOK=false;}}
let mode=get('mode','overview'),stage=get('stage','documents'),task=0,db=get('db','mysql'),dark=get('dark',false),returnTask=false;
const modes=[['overview','Обзор'],['learn','Обучение'],['training','Тренировка'],['mock','Пробный экзамен'],['examples','Примеры'],['teacher','Преподавателю']];
db=db==='php'?'php':'mysql';
function lessonProgressKey(kind, id) {
  return id==='backend' ? `${kind}:${db}:${id}` : `${kind}:${id}`;
}
for(const kind of ['step','done']) {
  const legacyKey = kind+':backend';
  const saved = get(legacyKey);
  if(saved===null)continue;
  const key = lessonProgressKey(kind,'backend');
  if(get(key)===null)set(key,saved);
  set(legacyKey,null);
}
function currentStepIndex(lesson) {
  const saved = get(lessonProgressKey('step',lesson.id),0);
  return Number.isInteger(saved)?Math.min(Math.max(0,saved),lesson.steps.length-1):0;
}

function readRoute(query) {
  mode = query.get('mode') || mode;
  if(mode==='criteria' || !modes.some(([id])=>id===mode))mode='overview';
  const stack = query.get('stack');
  if(mode==='learn' && (stack==='php'||stack==='mysql'))db=stack;
  const deckStack=query.get('deckStack');
  if(mode==='teacher' && ['php','mysql'].includes(deckStack))set('teacher-db',deckStack);
  stage = query.get('stage') || stage;
  if(!S().some(lesson=>lesson.id===stage))stage='documents';
  const step = query.get('step');
  if(mode!=='learn' || !step || !/^\d+$/.test(step))return;
  const index = Number(step)-1;
  const lesson = S().find(item=>item.id===stage);
  if(index>=0 && index<lesson.steps.length)set(lessonProgressKey('step',stage),index);
}

function pagePath() {
  const query = new URLSearchParams({mode,stage});
  if(mode==='learn') {
    query.set('stack',db);
    query.set('step',currentStepIndex(S().find(item=>item.id===stage))+1);
  }
  const criteriaAnchor = mode==='overview' && (location.hash==='#criteria' || new URLSearchParams(location.search).get('mode')==='criteria');
  return '?'+query+(criteriaAnchor?'#criteria':'');
}

readRoute(params);

function S(stack=db){return stack==='php'?D.phpStages:D.stages;}function codes(){return db==='php'?D.phpCode:D.code;}
let coach=null,marked=null,restoreFocus=null;const btn=(text,attrs='',primary=false)=>`<button class="btn${primary?' primary':''}" ${attrs}>${text}</button>`;
const link=(text,path)=>`<a class="btn" href="${path}" target="_blank" rel="noopener">${text}</a>`;
const sources=()=>'';
function closeTour(){coach?.remove();marked?.classList.remove('tour-mark');coach=null;marked=null;restoreFocus?.isConnected&&restoreFocus.focus();}
function tour(kind='site'){
 closeTour();restoreFocus=document.activeElement;const routes={site:[['.site-nav','Выберите режим','Обучение объясняет шаги, тренировка позволяет остановить время, пробный экзамен идёт 3 часа 30 минут без паузы.'],['#db','Выберите стек','Выберите PHP + MySQL для Apache/XAMPP либо Flask с MySQL. Уроки и исходники изменятся вместе со стеком.'],['.route-sidebar','Двигайтесь по маршруту','Учебные этапы помогают выполнить три официальных задания. Это не дополнительные задания экзамена.'],['.variant-panel, #training-sample','Ваше условие','В тренировке — образец КИМ. В пробном экзамене выберите один из 30 учебных вариантов.'],['.timer-card','Время','Гид не запускает таймер. Начинайте работу своей кнопкой.'],['#materials-open','Материалы внутри сайта','Читайте условие, смотрите изображения и руководство по стилю без скачивания. Архивы доступны отдельно.']],lesson:[['.route-heading','Цель этапа','Прочитайте цель и ожидаемый результат.'],['.study-step','Одно действие за раз','Выполняйте шаг в своём редакторе и СУБД. Источник указан под объяснением.'],['.study-controls','Следующее действие','Листайте шаги или выберите нужный по номеру. Положение сохраняется.'],['.route-check','Самопроверка','Отмечайте результат после проверки своей работы.']],training:[['.variant-panel, #training-sample','Условие задания','Тренировка содержит образец КИМ; пробный экзамен — 30 учебных вариантов.'],['.timer-card','Таймер','В тренировке есть отдельная «Пауза», в экзамене паузы нет.'],['.training-stage-list','Три задания','Переключайте задание, сохраняя общий отсчёт и свои отметки.'],['.training-task','Условие и самопроверка','Читайте полный КИМ; краткое описание на экране помогает ориентироваться.']],er:[['.er-sequence','Построение по этапам','Добавляйте таблицы, затем проверяйте их связи.'],['.schema-grid','Поля и происхождение','У каждого поля сразу указаны источник и причина выбора: условие, форма, сессия, каталог или служебная логика.'],['.er-pinned','Связи','Связь FK → PK не заменяет проверку прав владельца на сервере.']],files:[['.file-picker','Выберите файл','Это исходники именно скачиваемого примера.'],['.code-preview','Читайте полный код','Найдите указанные в уроке функцию, маршрут или шаблон. Код можно скопировать.']],deck:[['#teacher-db','Выберите стек','Карточки, демонстрации и PDF соответствуют выбранному стеку.'],['#deck-open','Откройте презентацию','В оглавлении можно перейти к этапу. Режим показа открывает окно аудитории и сценарий преподавателя.']]};
 const items=(routes[kind]||routes.site).filter(([q])=>document.querySelector(q)?.getClientRects().length);if(!items.length)return;let n=0;coach=document.createElement('section');coach.className='tour-coach';coach.setAttribute('role','region');coach.setAttribute('aria-label','Гид');(document.activeElement?.closest('dialog')||document.body).append(coach);
 function draw(){marked?.classList.remove('tour-mark');const [q,t,b]=items[n];marked=document.querySelector(q);marked.classList.add('tour-mark');marked.scrollIntoView({block:'center'});coach.innerHTML=`<small>ГИД · ${n+1} / ${items.length}</small><h3>${t}</h3><p>${b}</p><div class="button-row">${btn('Назад','data-back '+(!n?'disabled':''))}${btn(n===items.length-1?'Завершить':'Далее','data-next',true)}${btn('Закрыть гид','data-close')}</div>`;coach.querySelector('[data-back]').onclick=()=>{n--;draw();};coach.querySelector('[data-next]').onclick=()=>{if(++n===items.length)closeTour();else draw();};coach.querySelector('[data-close]').onclick=closeTour;coach.querySelector('[data-next]').focus();}draw();
}
const modeIcons = {
  overview: 'M12 2.5 2 11h3v9a1 1 0 0 0 1 1h3.5v-6h5v6H18a1 1 0 0 0 1-1v-9h3z',
  learn: 'M6 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm3.5 2h6a4 4 0 0 1 0 8H9a2 2 0 1 0 0 4h7.2l-2-2 1.4-1.4L20 19l-4.4 4.4-1.4-1.4 2-2H9a4 4 0 1 1 0-8h6.5a2 2 0 0 0 0-4h-6z',
  training: 'M9 1h6v3H9zM11 4h2v1h-2zM19 7l1.8-1.8 1.4 1.4-1.8 1.8zM21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-10-5h2v4.5l2.2 2.2-1.4 1.4-2.8-2.8z',
  mock: 'M9 3a3 3 0 0 1 6 0h3a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 1.2v2h4v-2zm-2 9.1 3.1 3.1 5.5-5.5-1.4-1.4-4.1 4.1-1.7-1.7z',
  examples: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 2h16V7H4zm5.4 2.6L6 14l3.4 3.4 1.2-1.2L8.4 14l2.2-2.2zm5.2 0-1.2 1.2 2.2 2.2-2.2 2.2 1.2 1.2L18 14z',
  teacher: 'M2 3h20v14h-9v2h4v2H7v-2h4v-2H2zm4.2 9 1.3 1.3 3-3 3 1.5 4.3-4.3-1.3-1.3-3.3 3.3-3-1.5z'
};
const toolIcons = {
  moon: 'M20.8 15.2A9 9 0 0 1 8.8 3.2a9.2 9.2 0 1 0 12 12Z',
  sun: 'M17.5 12a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0ZM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM3.5 4.9l1.4-1.4L7 5.6 5.6 7zm13.5 13.5 1.4-1.4 2.1 2.1-1.4 1.4zm0-12.8 2.1-2.1 1.4 1.4L18.4 7zM3.5 19.1 5.6 17 7 18.4l-2.1 2.1z',
  tour: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm4.7 5.3-7 2.4-2.4 7 7-2.4z'
};

function iconButton(title,path,attributes) {
  return btn(
    `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="${path}"/></svg><span class="icon-tooltip" aria-hidden="true">${E(title)}</span>`,
    `type="button" data-icon-button aria-label="${E(title)}" ${attributes}`
  );
}
function siteNavigation() {
  return `<nav class="site-nav" aria-label="Основные разделы">${modes.map(([id,title])=>
    iconButton(title,modeIcons[id],`data-mode="${id}" ${id==='examples'?'data-nav-secondary':''} ${mode===id?'aria-current="page"':''}`)
  ).join('')}</nav>`;
}
function siteHeader() {
  const themeLabel = dark?'Включить светлую тему':'Включить тёмную тему';
  return `<header class="top">
    <a class="brand" href="?mode=overview"><span class="brand-emblem">ДЭ</span><span>
      <strong>09.02.07 · Информационные системы и программирование</strong>
      <small>Разработчик веб и мультимедийных приложений · 2027</small>
    </span></a>
    <div class="top-tools">
      ${['overview','teacher'].includes(mode)?'':`<fieldset id="db" class="stack-choice"><legend>Мой стек</legend>
        <label><input type="radio" name="stack" value="php" ${db==='php'?'checked':''}><span>PHP + MySQL <small>(XAMPP)</small></span></label>
        <label><input type="radio" name="stack" value="mysql" ${db==='mysql'?'checked':''}><span>Flask + MySQL / MariaDB</span></label>
      </fieldset>`}
      <div class="utility-group">
        ${iconButton(themeLabel,dark?toolIcons.sun:toolIcons.moon,'id="theme"')}
        ${iconButton('Тур по сайту',toolIcons.tour,'data-guide="site" aria-haspopup="dialog"')}
      </div>
    </div>
  </header>`;
}

function overviewBanner() {
  const hours = Math.floor((D.official.seconds/60) / 60);
  const minutes = (D.official.seconds/60) % 60;
  return `<section class="hero study-intro">
    <div class="banner-copy">
      <h1>Демонстрационный экзамен</h1>
      <ul class="banner-facts" aria-label="Параметры экзамена">
        <li>Базовый уровень</li>
        <li><span>Время экзамена</span> <time datetime="PT${hours}H${minutes}M">${hours} ч ${minutes} мин</time></li>
      </ul>
      <p class="lead">В трёх практических заданиях вы спроектируете базу данных, разработаете портал «Конференции.РФ» и проверите его работу.</p>
    </div>
    <div class="banner-mascot"><img src="mascot-exam.png" alt="Носорог-студент увидел в календаре «Демка завтра»"></div>
    <div class="button-row">
      ${btn('Открыть маршрут обучения →','data-mode="learn"',true)}
      ${btn('Материалы задания','id="materials-open"')}
    </div>
  </section>`;
}

function siteBanner() {
  if(mode==='overview')return overviewBanner();
  return `<section class="hero study-intro banner-compact" aria-label="Демонстрационный экзамен">
    <div class="banner-copy"><p class="banner-title">Демонстрационный экзамен</p></div>
    <div class="banner-actions">${btn('Материалы задания','id="materials-open" aria-haspopup="dialog"',true)}</div>
  </section>`;
}

function stageNode({number,title,detail,short,action,current,done=false}) {
  const marker = done?'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>':number;
  const label = `${number}. ${title} · ${detail}${done?' · Выполнено':''}`;
  return `<li><button class="stage-nav-node" type="button" ${action} aria-label="${E(label)}" ${current?'aria-current="step"':''} ${done?'data-completed':''}>
    <span class="stage-nav-marker" aria-hidden="true">${marker}</span>
    <span class="stage-nav-label" aria-hidden="true">${E(title)}<small>${E(detail)}</small></span>
    <span class="stage-nav-short" aria-hidden="true">${E(short)}</span>
  </button></li>`;
}

function learningNavigation() {
  const shortLabels = ['Документы','ER','База','Формы','Дизайн','Интерактив','Проверка'];
  return `<nav class="route-sidebar stage-nav" aria-label="Этапы обучения">
    <h2 class="stage-nav-caption">Мой веб-проект</h2>
    <ol class="stage-nav-list" role="list">${S().map((item,i)=>stageNode({
      number:i+1, title:item.title, detail:item.module, short:shortLabels[i],
      action:`data-stage="${item.id}"`, current:stage===item.id, done:get(lessonProgressKey('done',item.id),false)
    })).join('')}</ol>
  </nav>`;
}

function practiceNavigation(tasks) {
  const shortLabels = ['Приложение','Дизайн','Интерактив'];
  return `<nav class="training-stage-list stage-nav" aria-label="Задания на выполнение">
    <h2 class="stage-nav-caption">Задания</h2>
    <ol class="stage-nav-list" role="list">${tasks.map((item,i)=>stageNode({
      number:i+1, title:item.title, detail:`${item.minutes} мин`, short:shortLabels[i],
      action:`data-task="${i}"`, current:i===task
    })).join('')}</ol>
  </nav>`;
}

function header(title,goal,guide='lesson',heading='h1'){return `<header class="route-heading"><span class="section-code">ДЭ 2027 · БАЗОВЫЙ УРОВЕНЬ</span><${heading}>${title}</${heading}>${guide?btn('Гид по разбору',`data-guide="${guide}"`):''}<p>${goal}</p></header>`;}
function phpBuildLesson(i) {
  const lesson = D.phpAssembly[i];
  const setup = i===0 ? `<a class="btn primary" href="downloads/conference-portal-php-starter.zip" download>Скачать учебный каркас PHP</a>
    <p>Распакуйте архив в отдельную папку и откройте START-HERE.md. Подключите базу с предыдущего этапа, если в ней уже есть пять таблиц и данные из seed-php.sql. При запуске с нуля создайте отдельную пустую базу и выполните setup.php по инструкции.</p>` : '';
  return `<section class="build-lesson"><h3>Соберите этот шаг в каркасе</h3>${setup}
    ${lesson.blocks.map((block,j)=>`<section class="php-lesson-block">
      <h4>${E(block.file)} · ${E(block.first.match(/BEGIN ([\w-]+)/)[1])}</h4>
      <p>Замените участок от <code>${E(block.first)}</code> до <code>${E(block.last)}</code> включительно. Вставьте фрагмент целиком на место этого участка.</p>
      ${btn('Копировать фрагмент',`data-copy-block="${i}:${j}"`)}
      <pre class="lesson-code" tabindex="0" aria-label="Код ${E(block.file)}">${E(block.text)}</pre>
    </section>`).join('')}
    <div class="build-check"><strong>Проверка после шага</strong><p>${E(lesson.check)}</p></div>
  </section>`;
}
function buildLesson(i){if(db==='php')return phpBuildLesson(i);const x=D.assembly[i];if(!x)return '';return `<section class="build-lesson"><h3>Что сделать в проекте</h3>${i===0?'<p>Распакуйте каркас в отдельную папку. Подключение базы, сессия и CSRF уже подготовлены; маршруты пока возвращают текстовые заглушки. Если база уже создана на предыдущем этапе, запускайте каркас с DB_BACKEND=mysql и MYSQL_DATABASE, указывающей на эту базу. На следующих шагах вы замените заглушки рабочим кодом.</p><a class="btn primary" href="downloads/conference-portal-flask-starter.zip" download>Скачать учебный каркас Flask</a>':''}${x.map?`<p class="data-flow"><strong>От условия к данным:</strong> ${E(x.map)}</p>`:''}${x.blocks.map((b,j)=>`<details class="build-block" ${j===0?'open':''}><summary>${j+1}. ${E(b.file)} · ${b.file==='app.py'?'обработчик на сервере':'содержимое файла'}</summary><p>${E(b.where)}</p><p class="small">Строки ${b.start}–${b.start+b.text.split('\n').length-1} в готовом примере. В вашем каркасе ориентируйтесь на имена файлов и маркеры.</p><button class="btn" data-copy-block="${i}:${j}">Копировать фрагмент</button><pre class="lesson-code" tabindex="0" aria-label="Код ${E(b.file)}">${E(b.text)}</pre></details>`).join('')}<div class="build-check"><strong>Проверка после шага</strong><p>${E(x.check)}</p></div></section>`;}
function lessonLinks(id,index) {
  const files=(D.lessonFiles[id]?.[index]??[]).filter(([, , stack])=>!stack||stack===db);
  if(!files.length)return '';
  return `<div class="button-row lesson-resources">${files.map(([name,url])=>
    /\.(zip|sql)$/.test(url)?`<a class="btn" href="${E(url)}" download>${E(name)}</a>`:link(E(name),E(url))
  ).join('')}</div>`;
}
function databaseLesson(i) {
  const [file,caption]=D.databaseIllustrations[i];
  const extras={2:[['03-fields.png','Поля, типы и ограничения'],['04-users-structure.png','Структура таблицы users']],3:[['06-all-tables.png','Пять таблиц после импорта']]};
  return `<section class="database-lesson">${[[file,caption],...(extras[i]??[])].map(([f,title])=>
    `<figure><a href="materials/database/${E(f)}" target="_blank" rel="noopener"><img src="materials/database/${E(f)}" alt="${E(title)}" loading="lazy"></a><figcaption>${E(title)} · нажмите для увеличения</figcaption></figure>`
  ).join('')}</section>`;
}
function stepCheck(id,index) {
  const check=D.stepChecks[id]?.[index];
  return check?`<div class="build-check"><strong>Проверьте себя</strong><p>${E(check)}</p></div>`:'';
}
function learn(){const s=S().find(s=>s.id===stage),i=currentStepIndex(s),step=s.steps[i];return `${header('Обучение','От условия к самостоятельному решению: читайте объяснение, выполняйте действие и проверяйте результат.')}<div class="route-layout">${learningNavigation()}<section class="route-content">${returnTask?btn('← Вернуться к тренировке','id="return-task"'):''}${header(s.title,s.goal,null,'h2')}<p class="stage-input"><strong>Перед началом</strong> ${E(D.stageChecks[stage][0])}</p>${stage==='documents'?`<div class="facts"><span>3 задания</span><span>3 ч 30 мин</span><span>75 баллов</span></div>${sources()}`:''}<article class="route-panel study-step"><p class="section-code">${s.module} · ШАГ ${i+1} ИЗ ${s.steps.length}</p><h3 id="study-step-title" tabindex="-1">${E(step[0])}</h3><p>${E(step[1])}</p><p class="source-note">Источник: ${E(step[2])}</p>${stage==='er'?'<div id="er-workspace"></div>':guidanceHTML(stage,i)}${lessonLinks(stage,i)}${beginnerHTML(stage,i)}${stage==='database'?databaseLesson(i):stage==='backend'?buildLesson(i):''}${stepCheck(stage,i)}${stage==='design'&&i<2?styleSamples(null):''}${['backend','design'].includes(stage)?resultPreview(stage,i):''}<div class="study-controls">${btn('← Назад',`data-step="${i-1}" ${i===0?'disabled':''}`)}<label>Шаг <select id="step-select">${s.steps.map((x,n)=>`<option value="${n}" ${n===i?'selected':''}>${n+1}. ${x[0]}</option>`).join('')}</select></label>${btn('Далее →',`data-step="${i+1}" ${i===s.steps.length-1?'disabled':''}`,true)}</div></article><div class="route-check"><strong>Что сохранить: ${E(s.output)}</strong><p>${E(D.stageChecks[stage][1])}</p><label><input type="checkbox" id="done" ${get(lessonProgressKey('done',stage),false)?'checked':''}>Я могу повторить этап самостоятельно и проверил результат.</label></div><div class="route-bottom">${sources()}${btn('Перейти к тренировке →','data-mode="training"')}</div></section></div>`;}
let mockId=get('mock-id','V01');if(!D.mockVariants.some(v=>v.id===mockId))mockId='V01';
function examVariant(){return D.mockVariants.find(v=>v.id===mockId);}
function activeTasks(){return mode==='mock'?D.tasks.map((t,i)=>({...t,...examVariant().tasks[i]})):D.tasks;}

function practiceKey(){return mode==='mock'?'mock:'+mockId:'training:sample';}
const timerMode = () => mode==='mock'?'mock':'practice';
const isPractice = () => mode==='training'||mode==='mock';

function timer() {
  const key = 'timer:'+practiceKey();
  const saved = C.restoreTimer(JSON.stringify(get(key)),D.official.seconds,timerMode());
  const current = C.checkpoint(saved);
  if(current.status==='running' || current.status!==saved.status || current.elapsedMs!==saved.elapsedMs) {
    set(key,current);
  }
  return current;
}

function timerBox(state) {
  const mock = mode==='mock';
  const running = state.status==='running';
  const finished = state.status==='finished';
  const canFinish = running || state.status==='paused';
  const view = C.timerView(state,state.lastSeenMs);
  const status = finished && view.expired?'Время истекло':{
    idle:'Готов к началу', running:'Идёт отсчёт', paused:'На паузе', finished:'Завершено'
  }[state.status];
  return `<aside class="assignment-tools timer-card" aria-label="${mock?'Время пробного экзамена':'Время тренировки'}">
    <div class="training-timer-top">
      <span class="eyebrow">${mock?'ТАЙМЕР ПРОБНОГО ЭКЗАМЕНА':'ТАЙМЕР ТРЕНИРОВКИ'}</span>
      <output class="training-clock" id="clock" role="timer" aria-live="off" data-status="${state.status}">${C.format(view.left)}</output>
      <span id="timer-status" role="status">${status}</span>
      <progress id="timer-progress" max="1" value="${view.progress}" aria-label="Использованное время"></progress>
    </div>
    <div class="training-timer-controls">
      <div class="button-row">
        ${finished?btn('Сбросить таймер','data-timer="reset"',true):''}
        ${!finished&&!running?btn(state.status==='paused'?'Продолжить':'Начать','data-timer="start"',true):''}
        ${!mock&&running?btn('Пауза','data-timer="pause"',true):''}
        ${canFinish?btn('Завершить','data-timer="finish"'):''}
      </div>
      <span id="elapsed" class="small">Прошло: ${C.format(view.used)}</span>
      ${mock?'<p class="small">Время идёт непрерывно, даже если закрыть страницу.</p>':''}
    </div>
  </aside>`;
}

function attemptNotice(state) {
  if(state.status==='paused') return `<section class="route-panel attempt-notice" tabindex="-1">
    <h2>Тренировка на паузе</h2><p>Продолжите отсчёт, чтобы вернуться к заданиям и отметкам.</p>
  </section>`;
  if(state.status==='finished') return `<section class="route-panel attempt-notice" tabindex="-1">
    <h2>${C.timerView(state).expired?'Время вышло':'Попытка завершена'}</h2>
    <p>Условия, отметки и заметки доступны для просмотра. Сбросьте таймер, чтобы начать новый отсчёт.</p>
  </section>`;
  return '';
}

function sampleText(){const parts=[];let paragraph=[];const flush=()=>{if(paragraph.length){parts.push('<p>'+E(paragraph.join(' '))+'</p>');paragraph=[];}};for(const raw of D.official.text.split('\n')){const line=raw.trim();if(!line){flush();continue;}if(/^(Задание \d+\.|Образец задания)/.test(line)){flush();parts.push('<h3>'+E(line)+'</h3>');continue;}if(/^\d+\.\s|^[•–—]\s/.test(line))flush();paragraph.push(line);if(/[.!?:;]$/.test(line))flush();}flush();return parts.join('');}

function practice() {
  const list = activeTasks();
  const selected = list[task];
  const key = practiceKey();
  const v = mode==='mock'?examVariant():null;
  const state = timer();
  const paused = state.status==='paused';
  const finished = state.status==='finished';
  const checked = index => get('check:'+key+':'+selected.id+':'+index,false);
  return `<section class="training-page practice-page">
    ${header(v?'Пробный экзамен':'Тренировка по образцу КИМ',v?'30 авторских вариантов · 3 задания · 210 минут · 75 баллов.':'Официальный образец «Конференции.РФ», страницы 33–37 КИМ.','training')}
    <div class="attempt-layout">
      ${timerBox(state)}
      <div class="attempt-content">
        ${attemptNotice(state)}
        ${paused?'':`
          ${v?`<section class="route-panel variant-panel">
            <label for="mock-variant">Вариант пробного экзамена</label>
            <select id="mock-variant" ${state.status==='running'?'disabled':''}>${D.mockVariants.map(x=>`<option value="${x.id}" ${x.id===mockId?'selected':''}>${x.number}. ${E(x.brand)} · ${E(x.city)}</option>`).join('')}</select>
            <p>${E(v.common)}</p>
            <div class="button-row"><a class="btn" href="downloads/exam-${v.id}.zip" download>Условие и данные ${v.id} · ZIP</a><a class="btn" href="downloads/exam-30-variants.zip" download>Все 30 вариантов · ZIP</a></div>
            <p class="small">Возьмите изображения из приложений БУ или со стоков. Сохраните их локально и запишите источники в SOURCES.md.</p>
          </section>`:btn('Полный текст базового образца','id="training-sample" aria-haspopup="dialog"')}
          <div class="training-workspace">
            ${practiceNavigation(list)}
            <article class="training-task">
              <h2>${E(selected.title)}</h2>
              <p class="task-meta">Задание ${task+1} · ${selected.minutes} мин · ${v?v.id:'КИМ, стр. '+selected.pages}</p>
              ${task===1?`<div class="button-row">${btn('Изображения к заданию','id="task-images"')}${btn('Требования к дизайну','id="task-style"')}<a class="btn" href="materials/style-guide.pdf" download>Руководство БУ · PDF</a></div>`:''}
              <p>${E(selected.text)}</p>
              ${!v?btn('Подсказка к заданию',`data-help="${selected.stage}"`):''}
              <section class="self-check training-checklist" aria-labelledby="training-check-title">
                <header><h3 id="training-check-title">Самопроверка</h3><span id="check-count" aria-live="polite">${selected.checks.filter((_,i)=>checked(i)).length} из ${selected.checks.length}</span></header>
                ${selected.checks.map((x,i)=>`<label><input type="checkbox" data-check="${selected.id}:${i}" ${checked(i)?'checked':''} ${finished?'disabled':''}>${E(x)}</label>`).join('')}
              </section>
              <label class="training-notes">Заметки<textarea id="notes" ${finished?'readonly':''}>${E(get('notes:'+key+':'+selected.id,''))}</textarea></label>
            </article>
          </div>`}
      </div>
    </div>
  </section>`;
}

function launchGuide(){return `<section class="launch-guide"><h2>Как запустить пример на своём компьютере</h2><p>Инструкция соответствует выбранному стеку в шапке. Кнопка «Открыть» начинает работать после запуска сервера. При повторном запуске не создавайте базу заново.</p><div class="example-grid"><article class="route-panel" ${db!=='php'?'hidden':''}><h3>PHP + MySQL · XAMPP</h3><ol><li><a href="downloads/conference-portal-php.zip" download>Скачайте PHP ZIP</a>. Распакуйте файлы в <code>C:\\xampp\\htdocs\\conference-rvpm-2027</code>. Файл <code>index.php</code> должен находиться прямо в этой папке.</li><li>Откройте XAMPP Control Panel. Нажмите <strong>Start</strong> у <strong>Apache</strong> и <strong>MySQL</strong>; они должны работать.</li><li>Откройте <a href="http://localhost/phpmyadmin" target="_blank" rel="noopener">phpMyAdmin</a> → «Создать БД». Имя: <code>conference_php_2027</code>, кодировка: <code>utf8mb4_unicode_ci</code>. База должна быть новой и пустой.</li><li>В VS Code откройте эту папку → «Терминал» → «Создать терминал» (PowerShell). Выполните один раз:</li></ol><pre class="lesson-code">cd C:\\xampp\\htdocs\\conference-rvpm-2027
& C:\\xampp\\php\\php.exe setup.php</pre><p>Должно появиться сообщение о создании таблиц и шести помещений. Затем:</p>${link('Открыть PHP · локально','http://localhost/conference-rvpm-2027/')}<p class="small">При следующем запуске достаточно включить Apache и MySQL. Если таблицы и начальные данные уже созданы на этапе БД, пропустите setup.php. Если setup.php пишет «База не пуста», проверьте наличие всех пяти таблиц и начальных данных.</p></article><article class="route-panel" ${db==='php'?'hidden':''}><h3>Flask · Python</h3><ol><li><a href="downloads/conference-portal-flask.zip" download>Скачайте Flask ZIP</a>. Распакуйте в отдельную папку. Откройте её в VS Code: внутри должны быть <code>app.py</code> и <code>requirements.txt</code>.</li><li>Нужен Python 3.10+. Откройте «Терминал» → «Создать терминал» (PowerShell) именно в папке проекта. Один раз создайте окружение и установите зависимости:</li></ol><pre class="lesson-code">py -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt</pre><p>Включите MySQL в XAMPP, создайте пустую базу <code>conference_rvpm_2027</code> в phpMyAdmin. В терминале выполните:</p><pre class="lesson-code">$env:DB_BACKEND='mysql'
$env:MYSQL_DATABASE='conference_rvpm_2027'
.\\.venv\\Scripts\\python.exe -m flask --app app run --port 5017</pre><p>Дождитесь строки <code>Running on http://127.0.0.1:5017</code>. Оставьте терминал открытым:</p>${link('Открыть Flask · локально','http://127.0.0.1:5017/')}<p class="small">Остановка: Ctrl+C в терминале. При следующем запуске повторите только команду сервера и выбор базы. Если команда py не найдена, установите Python или используйте python.</p></article></div><p>В стандартном XAMPP используется root без пароля. Другие параметры подключения описаны в README архивов. Для проверки: зарегистрируйтесь → создайте заявку → войдите как Conf2027 / Demo77 → завершите мероприятие → оставьте отзыв от пользователя.</p></section>`;}
function examples(){return `<section class="training-page">${header('Готовый пример','Два самостоятельных примера: Flask и PHP + MySQL. Выберите стек в шапке для просмотра его исходников.','files')}${launchGuide()}<div class="example-grid"><article class="route-panel"><h2>Скачать и запустить</h2><p>Регистрация, вход, каталог, заявки, отзывы после завершения и панель администратора. Flask-архив содержит обе SQL-схемы и тесты; PHP-архив — схему MySQL, установщик и инструкцию XAMPP.</p><a class="btn primary" href="downloads/conference-portal-${db==='php'?'php':'flask'}.zip" download>Скачать ${db==='php'?'PHP + MySQL':'Flask + MySQL'} ZIP</a><p class="small">Flask запускается через Python, PHP — через Apache/XAMPP. GitHub Pages размещает учебный сайт и архив, а серверные приложения запускаются на компьютере.</p>${btn('Инструкция Windows / XAMPP',`data-code="${db==='php'?'README.md':'docs/WINDOWS.md'}"`)}${btn('Отчёт о проверке',`data-code="${db==='php'?'QA.md':'docs/QA.md'}"`)}<p>Учебный администратор из КИМ: <code>Conf2027 / Demo77</code>.</p></article><article class="route-panel"><h2>Внутри проекта</h2><label class="file-picker">Файл<select id="example-file">${Object.keys(codes()).map(f=>`<option ${f===(db==='php'?'index.php':'app.py')?'selected':''}>${E(f)}</option>`).join('')}</select></label>${btn('Открыть файл','id="open-file"')}<p id="file-purpose">${E(filePurpose(db==='php'?'index.php':'app.py'))}</p><p>Исходный проект: <a href="https://github.com/OlgaKraven/conference-portal-flask">conference-portal-flask</a>. Версия 1c8001c, дополнена адаптером MySQL/MariaDB и инструкцией запуска.</p></article></div>${D.screenshots?.length?`<h2>Работающий портал</h2><div class="shot-grid">${D.screenshots.filter(f=>f.startsWith(db==='php'?'php':'flask')).map(f=>`<figure><button class="image-open" data-image="materials/screenshots/${f}" aria-label="Увеличить ${E(f)}"><img src="materials/screenshots/${f}" alt="Портал ${E(f)}" loading="lazy"></button><figcaption>${E(f)}</figcaption></figure>`).join('')}</div>`:''}</section>`;}
const kimPdfPath = 'materials/kim-2027.pdf';
const criteriaKimPage = 13;
function criteria() {
  return `<section id="criteria" class="route-panel overview-criteria" aria-labelledby="criteria-title">
    <header class="criteria-heading"><h2 id="criteria-title">Критерии оценки</h2><span>75 баллов</span></header>
    <p class="criteria-source">КИМ ${E(D.official.code)} · таблица 7</p>
    <div class="criteria-table-wrap">
      <table class="criteria-table" aria-labelledby="criteria-title">
        <thead><tr><th scope="col">Критерий</th><th scope="col">Баллы</th></tr></thead>
        <tbody>${D.criteria.map(([title,points])=>`<tr><th scope="row">${E(title)}</th><td>${points}</td></tr>`).join('')}</tbody>
        <tfoot><tr><th scope="row">Итого</th><td>75</td></tr></tfoot>
      </table>
    </div>
    <p><a id="criteria-kim" href="${kimPdfPath}#page=${criteriaKimPage}" aria-haspopup="dialog">Полные формулировки в КИМ · стр. ${criteriaKimPage}</a></p>
  </section>`;
}
function openCriteriaKim(event) {
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  const opener=event.currentTarget;
  const dialog=modal('Просмотр материала');
  dialog.addEventListener('close',()=>opener.focus({preventScroll:true}),{once:true});
  dialog.querySelector('.modal-body').innerHTML=kimPreview(criteriaKimPage);
}
function teacherStack() {
  const saved = get('teacher-db',db);
  return saved==='php'?'php':'mysql';
}

function presentationPdf(stack){return `downloads/presentation-rvpm-${stack==='php'?'php':'flask'}.pdf?v=${D.presentationVersion}`;}

function teacher() {
  const stack = teacherStack();
  return `<section class="training-page">
    ${header('Преподавателю','Разбор официального образца ДЭ 2027 для занятия.','deck')}
    <div id="teacher-db" class="teacher-stacks" role="group" aria-label="Стек презентации">
      ${[['php','PHP + MySQL (XAMPP)'],['mysql','Flask + MySQL / MariaDB']].map(([id,label])=>btn(label,`type="button" data-deck-stack="${id}" aria-pressed="${id===stack}"`)).join('')}
    </div>
    <article class="route-panel">
      <h2>Презентация по демоэкзамену</h2>
      <p>На слайдах — условия трёх заданий, пошаговая демонстрация и готовый пример.</p>
      <p>Перед показом впишите ФИО, должность и кафедру. В презентации можно перейти к нужному разделу, открыть окно аудитории или сохранить PDF с вашими данными.</p>
      <div class="button-row">${btn('Данные преподавателя','id="teacher-settings"')}<a class="btn primary" id="deck-open" href="deck.html?stack=${stack}">Открыть презентацию</a><a class="btn" id="teacher-pdf" href="${presentationPdf(stack)}" download>Скачать PDF</a></div>
    </article>
  </section>`;
}
function teacherSettings(){const d=modal('Настройка перед занятием');d.classList.add('teacher-settings');d.querySelector('.modal-body').innerHTML=`<div class="settings-form">${[['teacher-name','ФИО преподавателя',120],['teacher-position','Должность',140],['teacher-department','Кафедра или лаборатория',160]].map(([id,title,max])=>`<label>${title}<input id="${id}" maxlength="${max}" value="${E(get(id,''))}"></label>`).join('')}<p class="small">Сохраняется в этом браузере и отображается на вводном слайде.</p></div>`;['teacher-name','teacher-position','teacher-department'].forEach(id=>on(id,e=>set(id,e.target.value),'oninput'));}
function render({pushHistory=false}={}){
  closeTour();
  if(isPractice()) {
    const taskKey = 'task:'+practiceKey();
    const legacyTask = get('task');
    if(legacyTask!==null) {
      if(get(taskKey)===null)set(taskKey,legacyTask);
      set('task',null);
    }
    const saved = get(taskKey,0);
    task = Number.isInteger(saved) && saved>=0 && saved<D.tasks.length ? saved : 0;
  }
  set('mode',mode);
  set('stage',stage);
  document.body.classList.toggle('dark',dark);
  const nextUrl = pagePath();
  if(nextUrl!==location.search+location.hash)history[pushHistory?'pushState':'replaceState'](null,'',nextUrl);
  root.innerHTML=`<div class="shell">
    ${siteHeader()}
    ${siteNavigation()}
    <main id="main" tabindex="-1">
      ${siteBanner()}
      ${!storageOK?'<p class="notice">Браузер не сможет сохранить прогресс после закрытия страницы.</p>':''}
      ${mode==='overview'?criteria():mode==='learn'?learn():['training','mock'].includes(mode)?practice():mode==='examples'?examples():teacher()}
    </main>
  </div>`;
  bind();
  tick();
}
function on(id,fn,event='onclick'){const el=document.getElementById(id);if(el)el[event]=fn;}
function bind(){
  on('criteria-kim',openCriteriaKim);
  on('task-images',()=>materialsModal('images'));
  on('task-style',()=>materialsModal('style'));
  if(document.getElementById('er-workspace'))mountER();
  on('teacher-settings',teacherSettings);
  bindImages(root);
  on('example-file',()=>{document.getElementById('file-purpose').textContent=filePurpose(document.getElementById('example-file').value);},'onchange');
  on('materials-open',materialsModal);
  document.querySelectorAll('[data-reference]').forEach(b=>b.onclick=()=>{const [target,index]=b.dataset.reference.split(':');stage=target;set(lessonProgressKey('step',stage),Number(index));mode='learn';render({pushHistory:true});document.querySelector('.study-step').scrollIntoView({block:'start'});});
  on('mock-variant',e=>{mockId=e.target.value;set('mock-id',mockId);render();document.getElementById('mock-variant')?.focus();},'onchange');
  document.querySelectorAll('[data-copy-block]').forEach(b=>b.onclick=async()=>{const [i,j]=b.dataset.copyBlock.split(':').map(Number);try{await navigator.clipboard.writeText((db==='php'?D.phpAssembly:D.assembly)[i].blocks[j].text);b.textContent='Скопировано';}catch{b.textContent='Выделите код и нажмите Ctrl+C';}});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;render({pushHistory:true});document.querySelector(`.site-nav [data-mode="${mode}"]`).focus();});
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stage=b.dataset.stage;render({pushHistory:true});document.querySelector(`[data-stage="${stage}"]`).focus({preventScroll:true});});
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{set(lessonProgressKey('step',stage),Number(b.dataset.step));render({pushHistory:true});document.getElementById('study-step-title').focus();});
  document.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>tour(b.dataset.guide));
  document.querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>fileModal(b.dataset.code));
  document.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>{task=Number(b.dataset.task);set('task:'+practiceKey(),task);render();document.querySelector(`[data-task="${task}"]`).focus({preventScroll:true});});
  document.querySelectorAll('[data-check]').forEach(b=>b.onchange=()=>{
  set('check:'+practiceKey()+':'+b.dataset.check,b.checked);
  const checks=[...root.querySelectorAll('[data-check]')];
  document.getElementById('check-count').textContent=checks.filter(input=>input.checked).length+' из '+checks.length;
});
  document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>{returnTask=true;stage=b.dataset.help;mode='learn';render();});
  on('return-task',()=>{mode='training';returnTask=false;render();root.querySelector('.training-stage-list [aria-current=step]')?.focus();});
  on('step-select',e=>{set(lessonProgressKey('step',stage),Number(e.target.value));render({pushHistory:true});document.getElementById('study-step-title').focus();},'onchange');
  on('done',e=>{set(lessonProgressKey('done',stage),e.target.checked);render();document.getElementById('done').focus({preventScroll:true});},'onchange');
  on('db',e=>{db=e.target.value;set('db',db);render({pushHistory:true});document.querySelector('#db input:checked').focus({preventScroll:true});},'onchange');
  on('theme',()=>{dark=!dark;set('dark',dark);render();document.getElementById('theme').focus({preventScroll:true});});
  on('notes',e=>set('notes:'+practiceKey()+':'+D.tasks[task].id,e.target.value),'oninput');
  ['teacher-name','teacher-position','teacher-department'].forEach(id=>on(id,e=>set(id,e.target.value),'oninput'));
  root.querySelectorAll('[data-timer]').forEach(button=>button.onclick=()=>changeTimer(button.dataset.timer));
  on('training-sample',()=>materialsModal());
  on('open-file',()=>fileModal(document.getElementById('example-file').value));
  const deckButtons=root.querySelectorAll('[data-deck-stack]');
  deckButtons.forEach(button=>button.onclick=()=>{
    const stack=button.dataset.deckStack;
    set('teacher-db',stack);
    deckButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    document.getElementById('teacher-pdf').href=presentationPdf(stack);
    document.getElementById('deck-open').href='deck.html?stack='+stack;
  });
}

function changeTimer(action) {
  const key = 'timer:'+practiceKey();
  if(action==='reset') {
    if(!window.confirm('Сбросить таймер? Отметки и заметки этой попытки сохранятся.')) return;
    set(key,C.freshTimer(D.official.seconds,timerMode()));
  } else {
    set(key,C.transition(timer(),action));
  }
  render();
  const target = root.querySelector('.attempt-notice') || root.querySelector('[data-timer]');
  target?.focus({preventScroll:true});
}

function tick() {
  const clock = document.getElementById('clock');
  if(!clock) return;
  const state = timer();
  if(clock.dataset.status!==state.status) {
    const restoreFocus = root.querySelector('.attempt-layout')?.contains(document.activeElement);
    render();
    if(restoreFocus)root.querySelector('.attempt-notice')?.focus({preventScroll:true});
    return;
  }
  const view = C.timerView(state,state.lastSeenMs);
  clock.textContent = C.format(view.left);
  document.getElementById('elapsed').textContent = 'Прошло: '+C.format(view.used);
  document.getElementById('timer-progress').value = view.progress;
}

function modal(title){closeTour();const d=document.createElement('dialog');d.className='course-dialog';d.setAttribute('aria-label',title);d.innerHTML=`<header class="modal-head"><h2>${title}</h2>${btn('Закрыть','data-dismiss')}</header><div class="modal-body"></div>`;document.body.append(d);d.querySelector('[data-dismiss]').onclick=()=>d.close();d.onclose=()=>{closeTour();d.remove();};d.showModal();return d;}
function styleSamples(v){const colors=[v?.accent||'#007bff',v?.heading||'#0d47a1','#6c757d','#f8f9fa','#ffffff'];return `<section class="style-samples"><h3>Параметр и его вид</h3><p>Образцы ниже используют локальные файлы PT Sans. ${v?'Палитра адаптирована для выбранного учебного варианта.':'Параметры из руководства БУ.'}</p><div class="style-color-grid">${colors.map((c,i)=>`<div><span class="color-swatch" style="background:${c}"></span><code>${c}</code><span>${['Акцент','Заголовки','Вторичный текст','Фон','Карточки'][i]}</span></div>`).join('')}</div><div class="font-examples">${[[36,700,'normal','H1 · Заголовок страницы'],[24,700,'normal','H2 · Раздел страницы'],[18,700,'normal','H3 · Заголовок карточки'],[16,400,'normal','Основной текст: выберите помещение для конференции.'],[12,400,'italic','Пояснение к полю формы']].map(([size,weight,style,text])=>`<div class="font-example"><code>PT Sans · ${size}px · ${weight===700?'Bold':style==='italic'?'Italic':'Regular'}</code><span style="font-size:${size}px;font-weight:${weight};font-style:${style}">${text}</span></div>`).join('')}</div><a class="btn" href="materials/style-guide.pdf" target="_blank" rel="noopener">Открыть исходный PDF</a></section>`;}
function kimPreview(page) {
  const file = 'materials/kim-2027.pdf';
  const pageUrl = file+'#page='+page;
  const embedded = navigator.pdfViewerEnabled && !matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  return `<h3>КИМ ${E(D.official.code)} · стр. ${page}</h3>
    <div class="button-row">${link('Открыть PDF в новой вкладке',pageUrl)}<a class="btn" href="${file}" download>Скачать КИМ</a></div>
    ${embedded?`<iframe class="kim-preview" src="${pageUrl}" title="КИМ ${E(D.official.code)}, страница ${page}"></iframe>`:page===criteriaKimPage?'<img class="style-page" src="materials/preview/kim-criteria.png" alt="Таблица 7. Критерии оценки базового уровня, страница 13">':''}`;
}

function materialsModal(initial='condition'){const v=mode==='mock'?examVariant():null,d=modal('Материалы задания'+(v?' · '+v.id:''));let tab=['images','style','kim'].includes(initial)?initial:'condition';const tabs=[['condition','Текст задания'],['kim','КИМ · PDF'],['images','Изображения'],['style','Руководство по стилю'],['downloads','Скачать материалы']];function draw(){d.querySelector('.modal-body').innerHTML=`<nav class="material-tabs lesson-tabs" aria-label="Материалы">${tabs.map(([id,label])=>btn(label,`data-material-tab="${id}" ${id===tab?'aria-current="page"':''}`)).join('')}</nav><section class="material-view">${tab==='condition'?(v?`<h3>${v.id} · ${E(v.brand)}</h3><p class="notice">Авторский учебный вариант по структуре базового КИМ. 3 задания · 210 минут · 75 баллов.</p>${v.tasks.map((t,i)=>`<h3>Задание ${i+1}. ${E(t.title)}</h3><p>${E(t.text)}</p>`).join('')}<h3>Исходный каталог варианта</h3><div class="material-table"><table><thead><tr><th>Помещение</th><th>Тип</th><th>Город</th><th>Мест</th></tr></thead><tbody>${v.rooms.map(r=>`<tr><td>${E(r.name)}</td><td>${{auditorium:'Аудитория',coworking:'Коворкинг',cinema:'Кинозал'}[r.category]}</td><td>${E(r.city)}</td><td>${r.capacity}</td></tr>`).join('')}</tbody></table></div>`:`<h3>Конференции.РФ · официальный образец БУ</h3><p>КИМ 09.02.07-3-2027 · страницы 33–37. Текст ниже доступен прямо на странице.</p><div class="sample-reading">${sampleText()}</div>`):tab==='kim'?kimPreview(33):tab==='images'?`<h3>Изображения из приложений БУ</h3><p>Выберите изображение для увеличения. Подпись сохраняет имя файла в исходном архиве. Эти материалы доступны для всех учебных вариантов.</p><div id="material-image-focus" aria-live="polite"></div><div class="material-gallery">${D.previews.gallery.map((x,i)=>`<button class="material-thumb" data-image="${i}"><img src="materials/preview/${x.file}" alt="Изображение ${E(x.source)}" loading="lazy"><span>${E(x.source)}</span></button>`).join('')}</div>`:tab==='style'?(v?`<h3>Стиль варианта ${v.id} · ${E(v.brand)}</h3><p>Учебное руководство этого варианта: акцент <strong>${v.accent}</strong>, заголовки <strong>${v.heading}</strong>, текст #6c757d, фон #f8f9fa, карточки #ffffff.</p><div class="palette">${[v.accent,v.heading,'#6c757d','#f8f9fa','#ffffff'].map(c=>`<div><span style="background:${c}"></span><code>${c}</code></div>`).join('')}</div><p>PT Sans: H1 — 36 px, H2 — 24 px, H3 — 18 px, основной текст — 16 px, пояснения — 12 px курсив. Все страницы: 390 × 844 px. Оптимизируйте изображения и используйте их локально.</p>`:`<h3>Руководство по стилю · оригинал из БУ</h3>${D.previews.style.map((f,i)=>`<img class="style-page" src="materials/preview/${f}" alt="Руководство по стилю, страница ${i+1}">`).join('')}`):`<h3>Сохранить для работы без интернета</h3><div class="button-row">${v?`<a class="btn primary" href="downloads/exam-${v.id}.zip" download>Условие и каталог ${v.id}</a><a class="btn" href="downloads/exam-30-variants.zip" download>Все 30 вариантов</a>`:''}<a class="btn" href="materials/kim-2027.pdf" download>КИМ PDF</a><a class="btn" href="materials/basic-inputs.zip" download>Приложения БУ ZIP</a><a class="btn" href="materials/style-guide.pdf" download>Оригинал руководства PDF</a></div><p>Для просмотра используйте вкладки этого окна. Скачивание нужно только для сохранения файлов на компьютере.</p>`}${tab==='style'?styleSamples(v):''}</section>`;d.querySelectorAll('[data-material-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.materialTab;draw();d.querySelector('[aria-current=page]').focus({preventScroll:true});});d.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{const x=D.previews.gallery[Number(b.dataset.image)],focus=d.querySelector('#material-image-focus');focus.innerHTML=`<figure><img src="materials/preview/${x.file}" alt="${E(x.source)}"><figcaption>${E(x.source)}</figcaption></figure>`;focus.scrollIntoView({block:'center'});});}draw();}
function fileModal(file){if(!(file in codes()))file=db==='php'?'index.php':'app.py';const d=modal('Исходники примера');const body=d.querySelector('.modal-body');body.innerHTML=`<label class="file-picker">Файл<select id="code-file">${Object.keys(codes()).map(f=>`<option ${f===file?'selected':''}>${E(f)}</option>`).join('')}</select></label><div class="button-row">${btn('Гид по файлам','id="file-guide"')}${btn('Копировать код','id="copy-code"')}</div><p class="small">Полный исходный файл. Перенос длинных строк включён; копирование сохраняет исходное форматирование.</p><pre class="code-preview" tabindex="0" aria-label="Исходный код"></pre>`;const show=()=>body.querySelector('pre').textContent=codes()[body.querySelector('select').value]||'Файл недоступен';show();body.querySelector('select').onchange=show;body.querySelector('#file-guide').onclick=()=>tour('files');body.querySelector('#copy-code').onclick=async e=>{try{await navigator.clipboard.writeText(body.querySelector('pre').textContent);e.target.textContent='Скопировано';}catch{e.target.textContent='Выделите код и нажмите Ctrl+C';}};}
const entityStories=[
{name:'Пользователь',page:34,quote:'По кнопке «Создать пользователя» данные заносятся в базу данных.',why:'Регистрация повторяется для разных людей. Поэтому один пользователь — одна запись, а все пользователи хранятся в таблице users.',fields:'Логин → username; пароль → password_hash; ФИО → full_name; телефон → phone; электронная почта → email.',extra:'id — придуманный нами уникальный номер записи; is_admin — способ хранить роль; created_at — служебное время. Английские имена полей выбирает разработчик: в КИМ они не заданы.'},
{name:'Помещение',page:36,quote:'необходимо предоставить возможность выбора зала из предопределенного (конкретного) списка',why:'Один зал можно выбирать в разных заявках. Список выносим в отдельную таблицу rooms, чтобы не повторять описание зала в каждой заявке.',fields:'Название помещения → name; тип (аудитория, коворкинг, кинозал) → category. В заявку переносим только номер выбранного помещения: room_id.',extra:'Шесть названий, города, адреса, вместимость, цены и оборудование — демонстрационный каталог примера, а не готовая таблица из КИМ. В PHP он загружается из rooms.json; во Flask — также из rooms.json.'},
{name:'Заявка',page:34,quote:'Пользователь указывает нужное помещение для конференции',why:'Заявка — отдельное событие: один человек может отправить несколько заявок, в том числе на один и тот же зал. Создаём таблицу applications.',fields:'Помещение → room_id; дата → event_date; предпочтительное время → start_time; оплата → payment_method. «Свои заявки» означает связь user_id → users.id.',extra:'user_id сервер берёт из сессии, а room_id — из списка залов. Статус new задаёт сервер, затем его меняет администратор (стр. 35). Название конференции и число участников — дополнительные поля примера.'},
{name:'Отзыв',page:36,quote:'Возможность оставить отзыв появляется только после завершения мероприятия.',why:'Отзыв относится к конкретному завершённому мероприятию и его автору. Создаём reviews и связываем его с applications и users.',fields:'Текст отзыва → comment; выбранная заявка → application_id; автор из сессии → user_id. Сервер проверяет, что заявка своя и завершена.',extra:'Оценка rating от 1 до 5 и ограничение «один отзыв на заявку» — решения учебного примера. КИМ не задаёт эти поля и ограничения дословно.'},
{name:'Защита входа',page:null,quote:'В КИМ такой сущности нет.',why:'rate_limits добавлена разработчиком для ограничения частых попыток входа и регистрации. Она не является частью предметной модели конференций.',fields:'key — действие и IP; window_start — начало окна времени; hits — количество попыток. Все значения вычисляет сервер, формы для них нет.',extra:'Сначала спроектируйте четыре предметные таблицы. Эту техническую таблицу добавляйте отдельно, когда реализуете защиту входа.'}
];
function entityStory(i){const x=entityStories[i],e=D.entities[i];return `<section class="entity-story"><p class="section-code">ПОЧЕМУ ПОЯВИЛАСЬ ЭТА ТАБЛИЦА · ${i+1} / 5</p><h3>${x.name} → <code>${e.name}</code></h3><div class="origin-chain"><div><strong>1. Читаем условие</strong><blockquote>${E(x.quote)}</blockquote>${x.page?link('Открыть КИМ · стр. '+x.page,'materials/kim-2027.pdf#page='+x.page):'<span class="origin-tag">Дополнение разработчика</span>'}</div><div><strong>2. Выделяем сущность</strong><p>${E(x.why)}</p></div><div><strong>3. Получаем поля</strong><p>${E(x.fields)}</p></div></div><p class="origin-extra"><strong>Что выбрал разработчик:</strong> ${E(x.extra)}</p></section>`;}
function erDiagram(n){const box=(x,y,name,sub)=>`<g><rect x="${x}" y="${y}" width="200" height="72" rx="10"/><text x="${x+100}" y="${y+29}" text-anchor="middle" class="er-title">${name}</text><text x="${x+100}" y="${y+53}" text-anchor="middle">${sub}</text></g>`;return `<figure class="er-overview"><figcaption>Условие КИМ → сущности → таблицы → данные из форм</figcaption><svg viewBox="0 0 760 320" role="img" aria-label="Связи таблиц: пользователи и помещения имеют много заявок, у заявки не более одного отзыва">${n>=3?'<path d="M220 76 H285 V165 H330"/><path d="M220 246 H285 V195 H330"/><text x="245" y="98">1</text><text x="300" y="153">N</text><text x="244" y="236">1</text><text x="300" y="218">N</text>':''}${n>=4?'<path d="M530 180 H590 V76 H550"/><path d="M220 58 H550"/><text x="537" y="167">1</text><text x="605" y="126">0..1</text><text x="235" y="46">1</text><text x="520" y="46">N</text>':''}${box(20,30,'users','Регистрация и роль')}${n>=2?box(20,210,'rooms','Каталог помещений'):''}${n>=3?box(330,145,'applications','Форма заявки + сессия'):''}${n>=4?box(550,30,'reviews','Отзыв после завершения'):''}${n>=5?box(550,240,'rate_limits','Служебные счётчики'):''}</svg></figure>`;}
function fieldDecision(field){const f=field.split(' ·')[0];if(f==='id')return 'Числовой PK даёт стабильную ссылку на запись: имя или логин могут меняться, идентификатор — нет.';if(f.endsWith('_id'))return 'Храним идентификатор связанной записи вместо копии её текста: FK проверяет существование, а JOIN получает актуальные сведения.';if(f==='password_hash')return 'Пароль не сохраняем открытым: записываем результат хеширования и проверяем введённый пароль специальной функцией.';if(['created_at','updated_at','window_start'].includes(f))return 'Время задаётся программой или СУБД, чтобы не зависеть от произвольного ввода пользователя.';if(['phone','username','email'].includes(f))return 'Используем текст: здесь важны символы и формат. Телефон не является числом для вычислений; уникальность и формат проверяются отдельно.';if(['status','category','payment_method'].includes(f))return 'Ограниченный набор значений предотвращает разные написания одного состояния. Пользователь видит подпись, сервер сохраняет согласованный код.';if(f==='is_admin')return 'Роль задаёт доверенная серверная логика; обычная регистрация не должна разрешать назначить себе администратора.';if(['capacity','attendees','rating','hits'].includes(f))return 'Числовое значение удобно сравнивать и проверять по допустимому диапазону; текстовые подписи хранятся отдельно.';if(f==='event_date'||f==='start_time')return 'Тип даты или времени позволяет сортировать и проверять значение; не сохраняем дату как произвольную фразу.';return 'Отдельное поле хранит одно понятное свойство. Формат и допустимую длину согласуем между формой, сервером и схемой базы.';}
function fieldTable(i){const e=D.entities[i];return `<table class="origin-table"><thead><tr><th>Поле</th><th>Откуда данные и почему</th></tr></thead><tbody>${e.fields.map(f=>{const o=D.origins[e.name][f.split(' ·')[0]];return `<tr><th>${E(f)}</th><td><strong>${E(o[0])}</strong><p>${E(o[1])}</p><p class="field-decision">${E(fieldDecision(f))}</p></td></tr>`;}).join('')}</tbody></table>`;}
function mountER(){const host=document.getElementById('er-workspace');const lesson=S().find(item=>item.id==='er');const step=currentStepIndex(lesson);let n=[1,1,3,4,1,1][step];function draw(){host.innerHTML=`<div class="er-sequence button-row">${btn('←',`id="er-prev" aria-label="Предыдущая таблица" ${n===1?'disabled':''}`)}<label>Таблица<select id="er-entity">${entityStories.map((x,i)=>`<option value="${i+1}" ${n===i+1?'selected':''}>${x.name} · ${D.entities[i].name}</option>`).join('')}</select></label>${btn('→',`id="er-next" aria-label="Следующая таблица" ${n===5?'disabled':''}`)}${btn('Гид по схеме','id="er-guide"')}</div><div class="er-inline"><div class="er-pinned">${erDiagram(n)}<p>Стрелки связывают FK дочерней таблицы с PK родительской. 1:N — одна запись связана с несколькими; 0..1 — отзыв может отсутствовать.</p></div><div class="schema-grid"><section class="schema-table"><h3>${E(D.entities[n-1].name)}</h3>${fieldTable(n-1)}</section>${entityStory(n-1)}</div></div>`;on('er-entity',e=>{n=Number(e.target.value);draw();},'onchange');on('er-prev',()=>{n--;draw();});on('er-next',()=>{n++;draw();});on('er-guide',()=>tour('er'));}draw();}
function filePurpose(f){if(/schema/.test(f))return 'Описывает таблицы, типы полей, ограничения и связи базы данных.';if(f==='rooms.json')return 'Демонстрационный каталог помещений: начальные записи rooms, а не данные пользователей.';if(f==='app.py'||f==='index.php')return 'Принимает запросы браузера, проверяет данные и права, выполняет запросы к БД и возвращает страницу.';if(f==='lib.php'||f==='mysql_backend.py')return 'Общие функции и подключение к MySQL: запросы, соединение и вспомогательные операции.';if(f==='setup.php')return 'Однократная подготовка пустой учебной базы: таблицы, администратор и каталог.';if(f.endsWith('.html'))return 'HTML-шаблон страницы: подписи, поля формы и вывод данных, переданных сервером.';if(f.endsWith('.css'))return 'Оформление интерфейса: палитра, шрифты, сетки, состояния элементов и мобильная адаптация.';if(f.endsWith('.js'))return 'Поведение в браузере: обработка событий и обратная связь. Не заменяет проверки на сервере.';if(f.includes('test'))return 'Автоматическая проверка сценариев и ограничений приложения на тестовых данных.';if(f.endsWith('.md'))return 'Инструкция, описание источников или отчёт о проверке проекта.';if(f==='requirements.txt')return 'Список Python-зависимостей для установки в виртуальное окружение.';if(f==='.gitignore')return 'Исключает окружение, кэш и локальные секреты из новых добавлений в Git.';return 'Вспомогательный ресурс проекта. Смотрите путь файла и его содержимое перед изменением.';}
function lessonGuidance(id,i,stack=db){return D.guidance[id==='backend'&&stack==='php'?'phpBackend':id]?.[i];}
function guidanceHTML(id,i){const g=lessonGuidance(id,i);if(!g)return '';return `<section class="lesson-explanation"><h3>Как это понять</h3><p>${E(g.why)}</p><h3>Что сделать самостоятельно</h3><ol class="lesson-actions" role="list">${g.actions.map((x,index)=>`<li><span class="lesson-action-number" aria-hidden="true">${index+1}</span><span>${E(x)}</span></li>`).join('')}</ol>${g.code?`<pre class="lesson-code" tabindex="0">${E(g.code)}</pre>`:''}<div class="build-check"><strong>Проверьте себя</strong><p>${E(g.check)}</p></div></section>`;}
function beginnerHTML(id,index) {
  const key=id==='backend'&&db==='php'?'phpBackend':id;
  const example=D.beginner[key]?.[index];
  if(!example)return '';
  const rows=example.rows.map(([label,value])=>`<div><dt>${E(label)}</dt><dd>${value.startsWith('git ')?`<code>${E(value)}</code>`:E(value)}</dd></div>`).join('');
  return `<section class="lesson-explanation worked-example"><h3>${E(example.title)}</h3><dl>${rows}</dl>${example.after?`<p>${E(example.after)}</p>`:''}</section>`;
}
function resultImages(id,i,stack=db){const php=stack==='php';if(id==='backend'){const kind=php?['catalog','registration-mobile','login','application','application','catalog'][i]:['catalog','catalog','registration','login','catalog','application','admin-mobile','application','catalog'][i];return [{file:(php?'php-':'flask-')+kind+'.png',caption:kind.startsWith('registration')?'Регистрация: данные из условия превращены в подписанные поля формы.':kind==='login'?'Вход: логин и пароль проверяет сервер; после успеха создаётся сессия.':kind==='application'?'Заявка: помещение из rooms, остальные значения из формы, владелец из сессии.':kind==='admin-mobile'?'Администратор: фильтры и смена статуса на мобильном экране.':'Каталог: записи rooms превращены в карточки помещений.'}];}if(id==='design')return [{file:php?'php-catalog.png':'flask-catalog.png',caption:'Компьютер: общий стиль, локальные изображения и карточки каталога.'},{file:php?'php-registration-mobile.png':'flask-admin-mobile.png',caption:'Телефон: одна колонка, читаемый текст, доступные элементы управления.'}];return [];}
function resultPreview(id,i){return `<section class="lesson-result"><h3>Что должно получиться</h3><p>Снимок работающего примера — ориентир для проверки. Повторите действие в своём приложении и сравните результат.</p><div class="shot-grid">${resultImages(id,i).map(x=>`<figure><button class="image-open" data-image="materials/screenshots/${x.file}" aria-label="Увеличить результат"><img src="materials/screenshots/${x.file}" alt="${E(x.caption)}" loading="lazy"></button><figcaption>${E(x.caption)}</figcaption></figure>`).join('')}</div></section>`;}
function bindImages(scope){scope.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{const d=modal('Просмотр изображения');d.classList.add('image-dialog');d.querySelector('.modal-body').innerHTML=`<img src="${E(b.dataset.image)}" alt="Увеличенное изображение результата">`;});}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&coach){e.preventDefault();e.stopPropagation();closeTour();}});setInterval(tick,1000);render();
window.addEventListener('popstate',()=>{readRoute(new URLSearchParams(location.search));render();});
if(location.hash==='#criteria')document.getElementById('criteria')?.scrollIntoView();
})();
