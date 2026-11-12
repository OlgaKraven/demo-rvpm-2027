(()=>{'use strict';
const D=COURSE,C=ExamCore,E=C.escape,root=document.getElementById('app');
const params = new URLSearchParams(location.search);
let memory={},storageOK=true;const prefix='rvpm-2027-basic-v1:';
function get(k,f=null){try{return JSON.parse(localStorage.getItem(prefix+k))??f;}catch{storageOK=false;return memory[k]??f;}}
function set(k,v){memory[k]=v;try{localStorage.setItem(prefix+k,JSON.stringify(v));}catch{storageOK=false;}}
let mode=get('mode','overview'),stage=get('stage','documents'),task=0,db=get('db','mysql'),dark=get('dark',false),returnTask=false,learningView='map',mockBrief=false;
const lessonTabs=[['brief','Условие и файлы'],['steps','Шаги'],['help','Справка']];
const helpTabs=[['summary','Объяснение'],['example','Пример'],['terms','Термины'],['errors','Ошибки']];
let helpTopic='summary';
let tourActive=false, tourErStep=false, tourCleanup=null, destroyER=null;
const modes=[['overview','Обзор'],['learn','Обучение'],['training','Тренировка'],['mock','Пробный экзамен'],['examples','Примеры'],['teacher','Преподавателю']];
db=db==='php'?'php':'mysql';
function lessonProgressKey(kind, id) {
  return ['database','backend'].includes(id) ? `${kind}:${db}:${id}` : `${kind}:${id}`;
}
for(const id of ['database','backend']) {
  for(const kind of ['step','done']) {
    const legacyKey=kind+':'+id;
    const saved=get(legacyKey);
    if(saved===null)continue;
    const key=lessonProgressKey(kind,id);
    if(get(key)===null)set(key,saved);
    set(legacyKey,null);
  }
}
function currentStepIndex(lesson) {
  const saved = get(lessonProgressKey('step',lesson.id),0);
  return Number.isInteger(saved)?Math.min(Math.max(0,saved),lesson.steps.length-1):0;
}

function readRoute(query) {
  mode = query.get('mode') || mode;
  if(mode==='criteria' || !modes.some(([id])=>id===mode))mode='overview';
  const stack = query.get('stack');
  if(['learn','examples'].includes(mode) && (stack==='php'||stack==='mysql'))db=stack;
  const deckStack=query.get('deckStack');
  if(mode==='teacher' && ['php','mysql'].includes(deckStack))set('teacher-db',deckStack);
  stage = query.get('stage') || stage;
  if(!S().some(lesson=>lesson.id===stage))stage='documents';
  const step = query.get('step');
  const view=query.get('view');
  if(mode==='learn')learningView=['map','brief','help','result'].includes(view)?view:(step||query.has('stage'))?'steps':'map';
  helpTopic=helpTabs.some(([id])=>id===query.get('topic'))?query.get('topic'):'summary';
  if(mode!=='learn' || !step || !/^\d+$/.test(step))return;
  const index = Number(step)-1;
  const lesson = S().find(item=>item.id===stage);
  if(index>=0 && index<lesson.steps.length)set(lessonProgressKey('step',stage),index);
}

function pagePath() {
  const query = new URLSearchParams({mode,stage});
  if(['learn','examples'].includes(mode))query.set('stack',db);
  if(mode==='learn'){
    if(learningView==='steps')query.set('step',currentStepIndex(S().find(item=>item.id===stage))+1);
    else {
      query.set('view',learningView);
      if(learningView==='help'&&helpTopic!=='summary')query.set('topic',helpTopic);
    }
  }
  const criteriaAnchor = mode==='overview' && (location.hash==='#criteria' || new URLSearchParams(location.search).get('mode')==='criteria');
  return '?'+query+(criteriaAnchor?'#criteria':'');
}

readRoute(params);

function S(stack=db){return stack==='php'?D.phpStages:D.stages;}function codes(){return db==='php'?D.phpCode:D.code;}
const btn=(text,attrs='',primary=false)=>`<button class="btn${primary?' primary':''}" ${attrs}>${text}</button>`;
const link=(text,path)=>`<a class="btn" href="${path}" target="_blank" rel="noopener">${text}</a>`;
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
      <div class="utility-group">
        ${iconButton(themeLabel,dark?toolIcons.sun:toolIcons.moon,'id="theme"')}
        ${iconButton('Тур по сайту',toolIcons.tour,'id="site-tour" aria-haspopup="dialog"')}
      </div>
    </div>
  </header>`;
}

const studyStacks = [
  ['php','PHP + MySQL (XAMPP)','Windows · VS Code · PHP · Apache · phpMyAdmin'],
  ['mysql','Flask + MySQL / MariaDB','Windows · VS Code · Python · Flask · phpMyAdmin']
];

function stackPicker(label) {
  return `<div class="map-stack">
    <label for="stack">${label}</label>
    <select id="stack">
      <button type="button"><selectedcontent></selectedcontent></button>
      ${studyStacks.map(([id,name,tools])=>`<option value="${id}" ${db===id?'selected':''}>
        <span>${E(name)}</span><span class="stack-tools"><span class="stack-separator"> · </span>${E(tools)}</span>
      </option>`).join('')}
    </select>
  </div>`;
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
  const lessons=S();
  const completed=lessons.filter(item=>get(lessonProgressKey('done',item.id),false)).length;
  return `<nav class="route-sidebar stage-nav" aria-label="Этапы обучения">
    <div class="stage-nav-caption"><strong>Этапы</strong><span>Выполнено ${completed} из ${lessons.length}</span></div>
    <ol class="stage-nav-list" role="list">${lessons.map((item,i)=>stageNode({
      number:i, title:item.title, detail:item.module, short:shortLabels[i],
      action:`data-stage="${item.id}"`, current:stage===item.id, done:get(lessonProgressKey('done',item.id),false)
    })).join('')}</ol>
  </nav>`;
}

function practiceNavigation(tasks) {
  const shortLabels = ['Приложение','Дизайн','Интерактив'];
  const training=mode==='training';
  return `<nav class="training-stage-list stage-nav" aria-label="Задания на выполнение">
    <div class="stage-nav-caption"><strong>Задания</strong>${training?`<span>Выполнено ${tasks.filter((_,i)=>taskDone(i)).length} из ${tasks.length}</span>`:''}</div>
    <ol class="stage-nav-list" role="list">${tasks.map((item,i)=>stageNode({
      number:i+1, title:item.title, detail:`${item.minutes} мин`, short:shortLabels[i],
      action:`data-task="${i}"`, current:i===task, done:mode==='training'&&taskDone(i)
    })).join('')}</ol>
  </nav>`;
}

function header(title,description) {
  return `<header class="workspace-intro"><div><h1>${E(title)}</h1>${description?`<p>${E(description)}</p>`:''}</div></header>`;
}
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
  const sql=i===2?D.usersSql:i===5?`SELECT id, name, capacity FROM rooms ORDER BY id;
SELECT username, is_admin FROM users;
SELECT COUNT(*) AS application_count FROM applications;
SELECT COUNT(*) AS review_count FROM reviews;`:'';
  return `<section class="database-lesson">
    ${sql?`<h3>${i===2?'Запрос создания таблицы':'Проверка начальных записей'}</h3>
      <pre class="lesson-code" tabindex="0" aria-label="Запрос SQL"><code>${E(sql)}</code></pre>
      ${i===5?'<p>Ожидаемый результат: шесть помещений, одна учётная запись Conf2027 с ролью 1 и по 0 строк в applications и reviews.</p>':''}`:''}
    ${[[file,caption],...(extras[i]??[])].map(([f,title])=>
    `<figure><a href="materials/database/${E(f)}" target="_blank" rel="noopener"><img src="materials/database/${E(f)}" alt="${E(title)}" loading="lazy"></a><figcaption>${E(title)} · нажмите для увеличения</figcaption></figure>`
  ).join('')}</section>`;
}
function stepCheck(id,index) {
  const check=D.stepChecks[id]?.[index];
  return check?`<div class="build-check"><strong>Проверьте себя</strong><p>${E(check)}</p></div>`:'';
}
const stageResources = {
  documents:[['КИМ · PDF','materials/kim-2027.pdf#page=33'],['Приложения БУ · ZIP','materials/basic-inputs.zip']],
  er:[['КИМ · стр. 33–36','materials/kim-2027.pdf#page=33'],['Образец ER · PDF','materials/database/er-example.pdf']],
  design:[['Руководство по стилю · PDF','materials/style-guide.pdf'],['Изображения и шрифты · ZIP','materials/basic-inputs.zip']],
  interaction:[['КИМ · стр. 36–37','materials/kim-2027.pdf#page=36']],
  delivery:[['Критерии КИМ · стр. 13','materials/kim-2027.pdf#page=13']]
};

function savedStep(lesson) {
  return Number.isInteger(get(lessonProgressKey('step',lesson.id)))?currentStepIndex(lesson)+1:null;
}

function lessonArtifacts(id) {
  const files=D.lessonReference[id].files;
  const items=id==='backend'
    ? [[db==='php'?'index.php, lib.php, static/':'app.py, templates/, static/',files[0][1]]]
    : files;
  return `<ul class="result-files">${items.map(([name,description])=>
    `<li><code>${E(name)}</code> <span>· ${E(description)}</span></li>`).join('')}</ul>`;
}

function lessonTabsHTML(items,active,group,panel) {
  return items.map(([id,label])=>btn(E(label),`type="button" role="tab" id="${group}-${id}" data-${group}="${id}"
    aria-selected="${id===active}" tabindex="${id===active?0:-1}" aria-controls="${panel}"`)).join('');
}

function lessonHelp(lesson) {
  const {intro,example,terms,errors}=D.lessonReference[lesson.id];
  const stackHint=lesson.id==='backend'&&helpTopic==='summary'
    ? `<p>${db==='php'?'Откройте обработчик в index.php и найдите вызов PDO в lib.php.':'Откройте маршрут в app.py и найдите поля формы в соответствующем файле из templates/.'}</p>`
    : '';
  const content={
    summary:`<h3>${E(intro[0])}</h3><p>${E(intro[1])}</p>${stackHint}`,
    example:`<h3>${E(example[0])}</h3><p>${E(example[1])}</p>`,
    terms:`<h3>Термины этапа</h3><dl class="lesson-glossary">${terms.map(([term,definition])=>
      `<div><dt>${E(term)}</dt><dd>${E(definition)}</dd></div>`).join('')}</dl>`,
    errors:`<h3>Типичные ошибки</h3><ul class="lesson-help-errors">${errors.map(([issue,fix])=>
      `<li><strong>${E(issue)}</strong><p>${E(fix)}</p></li>`).join('')}</ul>`
  };
  return `<div class="lesson-help-body">
    <div class="lesson-tabs lesson-help-menu" role="tablist" aria-label="Темы справки">
      ${lessonTabsHTML(helpTabs,helpTopic,'lesson-topic','lesson-topic-panel')}
    </div>
    <div class="lesson-help-pane" id="lesson-topic-panel" role="tabpanel" aria-labelledby="lesson-topic-${helpTopic}" tabindex="0">
      ${content[helpTopic]}
    </div>
  </div>`;
}

function learningMap() {
  const lesson=S().find(item=>item.id===stage);
  const done=id=>get(lessonProgressKey('done',id),false);
  const saved=savedStep(lesson);
  const resume=saved!==null&&!done(lesson.id);
  const action=resume?`Продолжить с шага ${saved} →`:done(lesson.id)?'Открыть этап →':lesson.id==='documents'?'Открыть подготовку →':'Прочитать условие →';
  return `<section class="map-panel">
    <div class="map-intro"><h1>Маршрут обучения</h1><p>Сначала разберите исходные документы. Дальше каждый этап даёт результат для следующего.</p></div>
    ${stackPicker('Стек обучения')}
    <div class="learning-map">
      <ol class="map-nodes" aria-label="Этапы обучения">${S().map((item,index)=>`<li>
        <button class="map-node" type="button" data-map-stage="${item.id}" aria-pressed="${item.id===stage}" ${item.id===stage?'aria-current="step"':''} ${done(item.id)?'data-completed':''}>
          <span class="map-circle" aria-hidden="true">${done(item.id)?'✓':index}</span>
          <span><strong>${E(item.title)}</strong><small>${E(item.module)}${done(item.id)?' · Завершён':''}</small></span>
        </button></li>`).join('')}</ol>
      <article class="map-detail" aria-labelledby="map-stage-title">
        <div>
          <p class="section-code">${E(lesson.module)}</p>
          <h2 id="map-stage-title">${E(lesson.title)}</h2><p>${E(D.lessonReference[lesson.id].intro[1])}</p>
          <strong>Что сохранить</strong>${lessonArtifacts(lesson.id)}
          ${btn(action,`data-lesson-view="${resume||done(lesson.id)?'steps':'brief'}"`,true)}
        </div>
      </article>
    </div>
  </section>`;
}

function lessonBrief(lesson) {
  const files=[...(stageResources[lesson.id]??[])];
  const assignment=D.tasks[{er:0,database:0,backend:0,design:1,interaction:2}[lesson.id]];
  if(assignment&&!files.some(([,href])=>href.startsWith(kimPdfPath)))files.unshift(['КИМ · стр. '+assignment.pages,kimPdfPath+'#page='+assignment.pages.match(/\d+/)[0]]);
  if(lesson.id==='backend')files.push(['Скачать учебный каркас','downloads/conference-portal-'+(db==='php'?'php':'flask')+'-starter.zip']);
  return `<section class="lesson-brief">
    <p>${E(lesson.goal)}</p>
    ${assignment?`<h3>Условие задания</h3><p>${E(assignment.text)}</p>`:''}
    <h3>Что понадобится</h3><p>${E(D.stageChecks[lesson.id][0])}</p>
    ${files.length?`<section class="task-files"><h3>Файлы этапа</h3><ul>${files.map(([name,url])=>`<li><a href="${E(url)}" ${url.endsWith('.zip')?'download':'target="_blank" rel="noopener"'}>${E(name)}</a></li>`).join('')}</ul></section>`:''}
    <div class="lesson-brief-actions">${btn(savedStep(lesson)!==null?'Продолжить с шага '+savedStep(lesson)+' →':'Перейти к шагам →','data-lesson-view="steps"',true)}</div>
  </section>`;
}

function stepArrow(index, direction, label) {
  const previous = direction==='previous';
  const path = previous ? 'M20 12H4m7-7-7 7 7 7' : 'M4 12h16m-7-7 7 7-7 7';
  const icon = `<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  return btn(icon,`type="button" data-step="${index}" data-step-direction="${direction}" aria-label="${E(label)}"
    title="${E(label)}" aria-keyshortcuts="${previous?'ArrowLeft':'ArrowRight'}"`,!previous);
}

function learn() {
  if(learningView==='map')return learningMap();
  const lesson=S().find(item=>item.id===stage);
  const index=tourErStep?lesson.steps.length-1:currentStepIndex(lesson), step=lesson.steps[index];
  const result=learningView==='result';
  const activeTab=result?'steps':learningView;
  const er=stage==='er'&&index===lesson.steps.length-1;
  const done=get(lessonProgressKey('done',stage),false);
  const next=S()[S().indexOf(lesson)+1];
  const mapPath='?'+new URLSearchParams({mode:'learn',stage,stack:db,view:'map'});
  return `<header class="workspace-intro"><div><h1>Обучение</h1><p>Портал «Конференции.РФ»</p></div>
      ${returnTask?btn('← Вернуться к тренировке','id="return-task"'):`<a class="lesson-back-link" href="${E(mapPath)}" data-lesson-view="map">← К маршруту</a>`}</header>
    <div class="route-layout lesson-layout">
      ${learningNavigation()}
      <section class="route-content lesson-card" aria-labelledby="lesson-title">
        <header class="lesson-card-heading"><h2 id="lesson-title">${E(lesson.title)}</h2><p class="task-meta">${E(lesson.module)}</p></header>
        <div class="lesson-tabs lesson-section-tabs" role="tablist" aria-label="Разделы этапа">${lessonTabsHTML(lessonTabs,activeTab,'lesson-view','lesson-panel')}</div>
        <div class="lesson-panel" id="lesson-panel" role="tabpanel" aria-labelledby="lesson-view-${activeTab}" tabindex="0">
        ${learningView==='brief'?lessonBrief(lesson):learningView==='help'?lessonHelp(lesson):`<section class="study-step${er&&!result?' study-step-er':''}" aria-labelledby="study-step-title">
          <div class="lesson-step-heading">
            <h3 class="lesson-heading" id="study-step-title" tabindex="-1"><span class="lesson-step-number">${result?lesson.steps.length+1:index+1}</span><span>${result?'Что сохранить':E(step[0])}</span></h3>
            ${btn('☰','id="lesson-steps" aria-label="Все шаги" title="Все шаги" aria-haspopup="dialog"')}
          </div>
          ${result?`<div class="lesson-result">${lessonArtifacts(lesson.id)}${stepResultCheck(lesson.id)}</div>`:`
            <p>${E(step[1])}</p><p class="source-note">Источник · ${E(step[2])}</p>
            ${guidanceHTML(stage,index)}${lessonLinks(stage,index)}${beginnerHTML(stage,index)}
            ${stage==='database'?databaseLesson(index):stage==='backend'?buildLesson(index):''}
            ${stepCheck(stage,index)}
            ${er?'<section class="er-workspace" id="er-workspace" aria-labelledby="er-title"></section>':''}
            ${stage==='design'&&index<2?styleSamples(null):''}
            ${stage==='design'&&index===2?btn('Изображения из приложений','id="lesson-images" aria-haspopup="dialog"'):''}
            ${['backend','design'].includes(stage)?resultPreview(stage,index):''}
          `}
          <div class="study-controls${result?' lesson-result-controls':''}">
            ${result?stepArrow(lesson.steps.length-1,'previous','Последний шаг'):index>0?stepArrow(index-1,'previous','Предыдущий шаг'):''}
            ${result?`<label class="lesson-complete"><input type="checkbox" id="done" ${done?'checked':''}> Этап выполнен</label>
              ${done?(next?btn('Далее · '+E(next.title)+' →',`data-stage="${next.id}"`,true):btn('Перейти к тренировке →','data-mode="training"',true)):''}`
              :stepArrow(index+1,'next',index===lesson.steps.length-1?'Что сохранить':'Следующий шаг')}
          </div>
        </section>`}
        </div>
      </section>
    </div>`;
}

function stepResultCheck(id) {
  return `<div class="build-check"><strong>Проверьте себя</strong><p>${E(D.stageChecks[id][1])}</p></div>`;
}

function showLessonSteps() {
  const lesson=S().find(item=>item.id===stage);
  const dialog=modal('Все шаги');
  dialog.querySelector('.modal-body').innerHTML=`<ol class="lesson-step-list">${[...lesson.steps.map(step=>step[0]),'Что сохранить'].map((title,index)=>
    `<li>${btn(E(title),`data-jump-step="${index}" ${(learningView==='result'?lesson.steps.length:currentStepIndex(lesson))===index?'aria-current="step"':''}`)}</li>`
  ).join('')}</ol>`;
  dialog.querySelectorAll('[data-jump-step]').forEach(button=>button.onclick=()=>{
    dialog.close();
    openStep(Number(button.dataset.jumpStep));
  });
}

function openStep(index) {
  const lesson=S().find(item=>item.id===stage);
  if(index>=lesson.steps.length)learningView='result';
  else {
    set(lessonProgressKey('step',stage),index);
    learningView='steps';
  }
  render({pushHistory:true});
  document.getElementById('study-step-title')?.focus();
}

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
  if(!tourActive&&(current.status==='running' || current.status!==saved.status || current.elapsedMs!==saved.elapsedMs)) {
    set(key,current);
  }
  return current;
}

const taskDone = index => get('task-done:'+practiceKey()+':'+index,false);
const taskClock = () => get('task-clock:'+practiceKey(),{anchor:0,spent:{},alerted:{}});

function taskElapsed(clock,elapsed) {
  return (clock.spent[task]||0)+Math.max(0,elapsed-clock.anchor);
}

function selectPracticeTask(next) {
  mockBrief=false;
  if(mode==='training'&&next!==task){
    const clock=taskClock(), elapsed=timer().elapsedMs;
    clock.spent[task]=taskElapsed(clock,elapsed);
    clock.anchor=elapsed;
    set('task-clock:'+practiceKey(),clock);
  }
  set('task:'+practiceKey(),next);
  render();
  root.querySelector(`[data-task="${next}"]`)?.focus({preventScroll:true});
}

let audioContext;
function enableTimerSound(){
  if(!get('timer-sound',true)||!window.AudioContext)return;
  audioContext??=new AudioContext();
  audioContext.resume().catch(()=>{});
}

function signalTimer(){
  if(!get('timer-sound',true)||audioContext?.state!=='running')return;
  const tone=audioContext.createOscillator(),volume=audioContext.createGain();
  const now=audioContext.currentTime;
  tone.frequency.value=660;
  volume.gain.setValueAtTime(.12,now);
  volume.gain.exponentialRampToValueAtTime(.001,now+.25);
  tone.connect(volume).connect(audioContext.destination);
  tone.start(now);
  tone.stop(now+.25);
}

function timerBox(state) {
  const training=mode==='training', running=state.status==='running', idle=state.status==='idle', finished=state.status==='finished';
  const view=C.timerView(state,state.lastSeenMs);
  const status=finished&&view.expired?'Время истекло':{idle:'Готов к началу',running:'Идёт отсчёт',paused:'На паузе',finished:'Завершено'}[state.status];
  const action=finished?btn('Начать заново','data-timer="reset"',true)
    :training&&running?btn('Пауза','data-timer="pause"',true)
    :running?'':btn(training?(idle?'Начать тренировку':'Продолжить тренировку'):'Начать','data-timer="start"',true);
  return `<section class="timer-card" aria-label="${training?'Время тренировки':'Время пробного экзамена'}">
    <div class="training-timer-top">
      <span class="eyebrow">${training?'ТРЕНИРОВКА':'ПРОБНЫЙ ЭКЗАМЕН'}</span>
      <output class="training-clock" id="clock" aria-live="off" data-status="${state.status}">${C.format(view.left)}</output>
      <span id="timer-status" role="status">${status}</span>
      <progress id="timer-progress" aria-label="Использованное время" max="1" value="${view.progress}"></progress>
      ${training?`<div class="timer-task"><span id="task-clock-label">Время на задание ${task+1}</span>
        <output id="task-clock" aria-labelledby="task-clock-label" aria-live="off">${C.format(D.tasks[task].minutes*60000-taskElapsed(taskClock(),view.used))}</output></div>`:''}
    </div>
    <div class="training-timer-controls">
      ${action}
      ${!finished&&(!idle||!training)?btn('Завершить',`data-timer="finish" ${idle?'disabled':''}`):''}
    </div>
    ${training?`<div class="attempt-actions">
      <label class="attempt-sound"><input type="checkbox" id="timer-sound" ${get('timer-sound',true)?'checked':''}> Звук таймера</label>
      ${!finished?btn('Сбросить тренировку','data-timer="reset"'):''}
    </div>`:!finished?'<p class="timer-hint">После начала время идёт непрерывно, даже при закрытой странице.</p>':''}
  </section>`;
}

function attemptNotice(state) {
  if(state.status==='paused')return '<section class="pause-screen route-panel" aria-labelledby="pause-title" tabindex="-1"><h2 id="pause-title">Тренировка на паузе</h2><p>Условия и отметки снова появятся после продолжения.</p></section>';
  if(state.status==='finished')return `<section class="attempt-result route-panel" tabindex="-1"><h2>${C.timerView(state).expired?'Время вышло':'Попытка завершена'}</h2><p>Отметки этой попытки доступны до нового запуска.</p></section>`;
  return '';
}

function sampleText(){const parts=[];let paragraph=[];const flush=()=>{if(paragraph.length){parts.push('<p>'+E(paragraph.join(' '))+'</p>');paragraph=[];}};for(const raw of D.official.text.split('\n')){const line=raw.trim();if(!line){flush();continue;}if(/^(Задание \d+\.|Образец задания)/.test(line)){flush();parts.push('<h3>'+E(line)+'</h3>');continue;}if(/^\d+\.\s|^[•–—]\s/.test(line))flush();paragraph.push(line);if(/[.!?:;]$/.test(line))flush();}flush();return parts.join('');}

function practiceFiles(selected,variant) {
  const files=variant
    ? [['Файлы варианта '+variant.id+' · ZIP','downloads/exam-'+variant.id+'.zip']]
    : [['КИМ · стр. '+selected.pages,'materials/kim-2027.pdf#page='+selected.pages.match(/\d+/)[0]]];
  if(!variant&&task===0)files.push(['Приложения БУ · ZIP','materials/basic-inputs.zip']);
  if(task===1){
    if(!variant)files.push(['Руководство по стилю · PDF','materials/style-guide.pdf']);
    files.push(['Изображения и шрифты · ZIP','materials/basic-inputs.zip']);
  }
  return `<section class="task-files"><h3>Файлы задания</h3><ul>${files.map(([label,href])=>
    `<li><a href="${E(href)}" ${href.endsWith('.zip')?'download':'target="_blank" rel="noopener"'}>${E(label)}</a></li>`
  ).join('')}</ul></section>`;
}

function mockVariantBrief(variant) {
  return `<article class="training-task">
    <header class="mock-brief-heading"><h2>Условие варианта</h2>${btn('К заданию '+(task+1),`data-task="${task}"`)}</header>
    <p>${E(variant.common)}</p>
    <section class="mock-reference"><h3>Исходный каталог помещений</h3>
      <div class="material-table"><table><thead><tr><th>Помещение</th><th>Тип</th><th>Город</th><th>Мест</th></tr></thead><tbody>
      ${variant.rooms.map(room=>`<tr><td>${E(room.name)}</td><td>${E({auditorium:'Аудитория',coworking:'Коворкинг',cinema:'Кинозал'}[room.category])}</td><td>${E(room.city)}</td><td>${room.capacity}</td></tr>`).join('')}
      </tbody></table></div>
      <p><a href="downloads/exam-30-variants.zip" download>Все 30 вариантов · ZIP</a></p>
    </section>
  </article>`;
}

function practice() {
  const list=activeTasks(), selected=list[task], key=practiceKey();
  const variant=mode==='mock'?examVariant():null, state=timer(), status=state.status;
  const locked=status==='paused'||status==='finished';
  const checked=index=>get('check:'+key+':'+selected.id+':'+index,false);
  const checks=selected.checks.map((item,index)=>
    `<label><input type="checkbox" data-check="${selected.id}:${index}" ${checked(index)?'checked':''} ${locked?'disabled':''}>${E(item)}</label>`
  ).join('');
  const workspace=`<div class="training-workspace" ${status==='paused'?'hidden':''}>
    ${practiceNavigation(list)}
    ${variant&&mockBrief?mockVariantBrief(variant):`<article class="training-task">
      <h2>${E(selected.title)}</h2>
      <p class="task-meta">Задание ${task+1} · ${selected.minutes} мин · ${variant?E(variant.id):'КИМ, стр. '+E(selected.pages)}</p>
      <section class="practice-condition"><h3>Условие задания</h3><p>${E(selected.text)}</p></section>
      <div class="task-support">
        ${practiceFiles(selected,variant)}
        ${!variant&&!locked?btn('Подсказка к заданию',`data-help="${selected.stage}"`):''}
      </div>
      <section class="self-check training-checklist" aria-labelledby="training-check-title">
        <header><h3 id="training-check-title">Самопроверка</h3><span id="check-count" aria-live="polite">${selected.checks.filter((_,index)=>checked(index)).length} из ${selected.checks.length}</span></header>
        ${checks}
        ${variant?'':`<label class="task-complete"><input type="checkbox" id="task-complete" ${taskDone(task)?'checked':''} ${locked?'disabled':''}> Задание выполнено</label>`}
      </section>
    </article>`}
  </div>`;
  const heading=variant?'<div><h1>Пробный экзамен</h1><p>30 учебных вариантов · 3 задания · 75 баллов</p></div>'
    :`<div><h1>Тренировка</h1><p>Портал «Конференции.РФ» · официальный образец КИМ</p></div>
       <div class="training-intro-actions">${btn('Условие КИМ и приложения','id="training-sample" aria-haspopup="dialog"')}</div>`;
  return `<section class="training-page practice-page training-compact${variant?' mock-exam':''}">
    <header class="workspace-intro">${heading}</header>
    <div class="attempt-layout">${timerBox(state)}<div class="attempt-content">
      ${variant?`<div class="mock-variant-bar">
        <div class="training-source"><label for="mock-variant">Вариант<select id="mock-variant" ${status==='running'?'disabled':''}>${D.mockVariants.map(item=>
          `<option value="${item.id}" ${item.id===variant.id?'selected':''}>${item.number}. ${E(item.brand)} · ${E(item.city)}</option>`).join('')}</select></label></div>
        <div class="mock-variant-actions">${btn('Условие варианта',`id="mock-brief" aria-pressed="${mockBrief}"`)}
          <a class="btn" id="mock-download" href="downloads/exam-${variant.id}.zip" download>Файлы ${variant.id} · ZIP</a></div>
      </div>`:''}
      ${attemptNotice(state)}${workspace}
    </div></div>
  </section>`;
}

function launchGuide(){return `<section class="launch-guide"><div class="example-grid"><article class="route-panel" ${db!=='php'?'hidden':''}><h3>PHP + MySQL · XAMPP</h3><ol><li><a href="downloads/conference-portal-php.zip" download>Скачайте PHP ZIP</a>. Распакуйте файлы в <code>C:\\xampp\\htdocs\\conference-rvpm-2027</code>. Файл <code>index.php</code> должен находиться прямо в этой папке.</li><li>Откройте XAMPP Control Panel. Нажмите <strong>Start</strong> у <strong>Apache</strong> и <strong>MySQL</strong>; они должны работать.</li><li>Откройте <a href="http://localhost/phpmyadmin" target="_blank" rel="noopener">phpMyAdmin</a> → «Создать БД». Имя: <code>conference_php_2027</code>, кодировка: <code>utf8mb4_unicode_ci</code>. База должна быть новой и пустой.</li><li>В VS Code откройте эту папку → «Терминал» → «Создать терминал» (PowerShell). Выполните один раз:</li></ol><pre class="lesson-code">cd C:\\xampp\\htdocs\\conference-rvpm-2027
& C:\\xampp\\php\\php.exe setup.php</pre><p>Должно появиться сообщение о создании таблиц и шести помещений. Затем:</p>${link('Открыть PHP · локально','http://localhost/conference-rvpm-2027/')}<p class="small">При следующем запуске достаточно включить Apache и MySQL. Если таблицы и начальные данные уже созданы на этапе БД, пропустите setup.php. Если setup.php пишет «База не пуста», проверьте наличие всех пяти таблиц и начальных данных.</p></article><article class="route-panel" ${db==='php'?'hidden':''}><h3>Flask · Python</h3><ol><li><a href="downloads/conference-portal-flask.zip" download>Скачайте Flask ZIP</a>. Распакуйте в отдельную папку. Откройте её в VS Code: внутри должны быть <code>app.py</code> и <code>requirements.txt</code>.</li><li>Нужен Python 3.10+. Откройте «Терминал» → «Создать терминал» (PowerShell) именно в папке проекта. Один раз создайте окружение и установите зависимости:</li></ol><pre class="lesson-code">py -m venv .venv
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt</pre><p>Включите MySQL в XAMPP, создайте пустую базу <code>conference_rvpm_2027</code> в phpMyAdmin. В терминале выполните:</p><pre class="lesson-code">$env:DB_BACKEND='mysql'
$env:MYSQL_DATABASE='conference_rvpm_2027'
.\\.venv\\Scripts\\python.exe -m flask --app app run --port 5017</pre><p>Дождитесь строки <code>Running on http://127.0.0.1:5017</code>. Оставьте терминал открытым:</p>${link('Открыть Flask · локально','http://127.0.0.1:5017/')}<p class="small">Остановка: Ctrl+C в терминале. При следующем запуске повторите только команду сервера и выбор базы. Если команда py не найдена, установите Python или используйте python.</p></article></div><p>В стандартном XAMPP используется root без пароля. Другие параметры подключения описаны в README архивов. Для проверки: зарегистрируйтесь → создайте заявку → войдите как Conf2027 / Demo77 → завершите мероприятие → оставьте отзыв от пользователя.</p></section>`;}
function examples() {
  const php=db==='php', name=php?'PHP + MySQL (XAMPP)':'Flask + MySQL / MariaDB';
  const firstFile=php?'index.php':'app.py';
  const screens=php?['php-login.png','php-application.png','php-catalog.png','php-registration-mobile.png']
    :['flask-login.png','flask-application.png','flask-admin-mobile.png','flask-catalog.png'];
  const captions=['Вход','Новая заявка',php?'Каталог помещений':'Панель администратора',php?'Регистрация на телефоне':'Каталог помещений'];
  return `<section class="training-page example-page">
    ${header('Готовый пример','Выберите стек и скачайте рабочий проект с учебными данными.')}
    <div class="example-stacks" role="group" aria-label="Стек готового примера">${studyStacks.map(([id,title])=>
      btn(E(title),`type="button" data-example-stack="${id}" aria-pressed="${id===db}"`)
    ).join('')}</div>
    <div class="example-grid">
      <article class="route-panel">
        <h2>${E(name)}</h2>
        <p>В архив входят портал «Конференции.РФ», SQL-схема и учебный каталог. В портале можно зарегистрироваться, подать заявку, изменить её статус и оставить отзыв.</p>
        <div class="example-actions">
          <a class="btn primary" href="downloads/conference-portal-${php?'php':'flask'}.zip" download>Скачать ZIP · ${php?'PHP':'Flask'}</a>
          ${btn('Инструкция по запуску','id="example-launch" aria-haspopup="dialog"')}
        </div>
        <div class="example-accounts"><p>Учебная учётная запись из КИМ. Для проверки пользовательского кабинета зарегистрируйте новую запись.</p>
          <table aria-label="Учебная учётная запись"><thead><tr><th scope="col">Роль</th><th scope="col">Логин</th><th scope="col">Пароль</th></tr></thead>
          <tbody><tr><th scope="row">Администратор</th><td><code>Conf2027</code></td><td><code>Demo77</code></td></tr></tbody></table>
        </div>
      </article>
      <article class="route-panel">
        <h2>Внутри проекта</h2><p>Откройте файл, чтобы прочитать код и скопировать его.</p>
        <label class="file-picker">Файл<select id="example-file">${Object.keys(codes()).map(file=>
          `<option ${file===firstFile?'selected':''}>${E(file)}</option>`
        ).join('')}</select></label>
        <p id="file-purpose">${E(filePurpose(firstFile))}</p>
        ${btn('Открыть файл','id="open-file" aria-haspopup="dialog"')}
      </article>
    </div>
    <h2>Работающий портал</h2>
    <p>Откройте снимок, чтобы рассмотреть форму и сравнить её со своим результатом.</p>
    <div class="shot-grid">${screens.map((file,index)=>`<figure>
      <button class="image-open" data-image="materials/screenshots/${file}" aria-label="Увеличить: ${E(captions[index])}">
        <img src="materials/screenshots/${file}" alt="${E(captions[index])}" loading="lazy">
      </button><figcaption>${E(captions[index])}</figcaption></figure>`
    ).join('')}</div>
  </section>`;
}

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
  destroyER?.();
  destroyER=null;
  if(isPractice()) {
    const taskKey = 'task:'+practiceKey();
    const legacyTask = get('task');
    if(!tourActive&&legacyTask!==null) {
      if(get(taskKey)===null)set(taskKey,legacyTask);
      set('task',null);
    }
    const saved = get(taskKey,0);
    task = Number.isInteger(saved) && saved>=0 && saved<D.tasks.length ? saved : 0;
  }
  if(!tourActive){
    set('mode',mode);
    set('stage',stage);
    const nextUrl=pagePath();
    if(nextUrl!==location.search+location.hash)history[pushHistory?'pushState':'replaceState'](null,'',nextUrl);
  }
  document.body.classList.toggle('dark',dark);
  root.innerHTML=`<div class="shell">
    ${siteHeader()}
    ${siteNavigation()}
    <main id="main" tabindex="-1">
      ${!storageOK?'<p class="notice">Браузер не сможет сохранить прогресс после закрытия страницы.</p>':''}
      ${mode==='overview'?overviewBanner()+criteria():mode==='learn'?learn():['training','mock'].includes(mode)?practice():mode==='examples'?examples():teacher()}
    </main>
  </div>`;
  bind();
  tick();
}
function on(id,fn,event='onclick'){const el=document.getElementById(id);if(el)el[event]=fn;}
function bindLessonTabs(selector) {
  const list=root.querySelector(selector);
  if(!list)return;
  const tabs=[...list.querySelectorAll('[role="tab"]')];
  list.onkeydown=event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    const index=tabs.indexOf(event.target);
    if(index<0)return;
    const next={ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if(next===undefined)return;
    event.preventDefault();
    event.stopPropagation();
    tabs[next].click();
  };
}
function bind(){
  on('criteria-kim',openCriteriaKim);
  const workspace=document.getElementById('er-workspace');
  if(workspace){
    const stack=db;
    destroyER=ExamErGuide.mount(workspace,{get:key=>get(stack+':'+key),set:(key,value)=>set(stack+':'+key,value)});
  }
  on('site-tour',tour);
  on('lesson-steps',showLessonSteps);
  on('teacher-settings',teacherSettings);
  bindImages(root);
  on('example-file',()=>{document.getElementById('file-purpose').textContent=filePurpose(document.getElementById('example-file').value);},'onchange');
  on('materials-open',()=>materialsModal());
  on('lesson-images',()=>materialsModal('images'));
  document.querySelectorAll('[data-reference]').forEach(b=>b.onclick=()=>{const [target,index]=b.dataset.reference.split(':');stage=target;set(lessonProgressKey('step',stage),Number(index));mode='learn';render({pushHistory:true});document.querySelector('.study-step').scrollIntoView({block:'start'});});
  on('mock-variant',e=>{mockBrief=false;mockId=e.target.value;set('mock-id',mockId);render();document.getElementById('mock-variant')?.focus();},'onchange');
  document.querySelectorAll('[data-copy-block]').forEach(b=>b.onclick=async()=>{const [i,j]=b.dataset.copyBlock.split(':').map(Number);try{await navigator.clipboard.writeText((db==='php'?D.phpAssembly:D.assembly)[i].blocks[j].text);b.textContent='Скопировано';}catch{b.textContent='Выделите код и нажмите Ctrl+C';}});
  root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
    mode=button.dataset.mode;
    returnTask=false;
    mockBrief=false;
    if(mode==='learn')learningView='map';
    render({pushHistory:true});
    root.querySelector(`.site-nav [data-mode="${mode}"]`)?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-map-stage]').forEach(button=>button.onclick=()=>{
    stage=button.dataset.mapStage;
    render({pushHistory:true});
    root.querySelector(`[data-map-stage="${stage}"]`)?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>{
    stage=button.dataset.stage;
    learningView='brief';
    helpTopic='summary';
    render({pushHistory:true});
    root.querySelector(`[data-stage="${stage}"]`)?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-lesson-view]').forEach(control=>control.onclick=event=>{
    if(control.matches('a')&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey))return;
    event.preventDefault();
    const view=control.dataset.lessonView;
    if(view==='steps'&&learningView==='result'&&control.matches('[role=tab]'))return;
    learningView=view;
    if(view==='steps'&&savedStep(S().find(item=>item.id===stage))===null)set(lessonProgressKey('step',stage),0);
    render({pushHistory:true});
    root.querySelector(view==='map'?'[data-map-stage][aria-pressed="true"]':'.lesson-section-tabs [aria-selected="true"]')?.focus();
  });
  root.querySelectorAll('[data-lesson-topic]').forEach(tab=>tab.onclick=()=>{
    helpTopic=tab.dataset.lessonTopic;
    render({pushHistory:true});
    root.querySelector('.lesson-help-menu [aria-selected="true"]')?.focus({preventScroll:true});
  });
  bindLessonTabs('.lesson-section-tabs');
  bindLessonTabs('.lesson-help-menu');
  root.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>openStep(Number(button.dataset.step)));
  document.querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>fileModal(b.dataset.code));
  root.querySelectorAll('[data-task]').forEach(button=>button.onclick=()=>selectPracticeTask(Number(button.dataset.task)));
  on('mock-brief',()=>{mockBrief=!mockBrief;render();document.getElementById('mock-brief').focus({preventScroll:true});});
  on('task-complete',event=>{set('task-done:'+practiceKey()+':'+task,event.target.checked);render();document.getElementById('task-complete')?.focus({preventScroll:true});},'onchange');
  on('timer-sound',event=>{set('timer-sound',event.target.checked);if(event.target.checked)enableTimerSound();},'onchange');
  document.querySelectorAll('[data-check]').forEach(b=>b.onchange=()=>{
  set('check:'+practiceKey()+':'+b.dataset.check,b.checked);
  const checks=[...root.querySelectorAll('[data-check]')];
  document.getElementById('check-count').textContent=checks.filter(input=>input.checked).length+' из '+checks.length;
});
  document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>{returnTask=true;stage=b.dataset.help;mode='learn';learningView='steps';render({pushHistory:true});});
  on('return-task',()=>{mode='training';returnTask=false;render({pushHistory:true});root.querySelector('.training-stage-list [aria-current=step]')?.focus();});
  on('done',e=>{set(lessonProgressKey('done',stage),e.target.checked);render();document.getElementById('done').focus({preventScroll:true});},'onchange');
  on('stack',event=>{
    db=event.target.value;
    set('db',db);
    render({pushHistory:true});
    document.getElementById('stack').focus({preventScroll:true});
  },'onchange');
  on('theme',()=>{dark=!dark;set('dark',dark);render();document.getElementById('theme').focus({preventScroll:true});});
  ['teacher-name','teacher-position','teacher-department'].forEach(id=>on(id,e=>set(id,e.target.value),'oninput'));
  root.querySelectorAll('[data-timer]').forEach(button=>button.onclick=()=>changeTimer(button.dataset.timer));
  on('training-sample',()=>materialsModal());
  on('open-file',()=>fileModal(document.getElementById('example-file').value));
  on('example-launch',()=>{
    const dialog=modal('Инструкция по запуску');
    dialog.classList.add('example-launch-dialog');
    dialog.querySelector('.modal-body').innerHTML=launchGuide();
  });
  root.querySelectorAll('[data-example-stack]').forEach(button=>button.onclick=()=>{
    const stack=button.dataset.exampleStack;
    if(db===stack)return;
    db=stack;
    set('db',db);
    render({pushHistory:true});
    root.querySelector(`[data-example-stack="${stack}"]`)?.focus({preventScroll:true});
  });
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
  const attempt=practiceKey(), key='timer:'+attempt;
  if(action==='reset'){
    if(!window.confirm('Начать новую попытку? Время и отметки этой попытки будут сброшены.'))return;
    for(const [index,item] of D.tasks.entries()){
      item.checks.forEach((_,check)=>set('check:'+attempt+':'+item.id+':'+check,null));
      set('task-done:'+attempt+':'+index,null);
    }
    set('task-clock:'+attempt,null);
    set('task:'+attempt,0);
    mockBrief=false;
    set(key,C.freshTimer(D.official.seconds,timerMode()));
  }else{
    if(action==='start'&&mode==='training')enableTimerSound();
    set(key,C.transition(timer(),action));
  }
  render();
  (root.querySelector('.pause-screen,.attempt-result')||root.querySelector('[data-timer]'))?.focus({preventScroll:true});
}

function tick() {
  const clock=document.getElementById('clock');
  if(!clock||tourActive)return;
  const state=timer(),view=C.timerView(state,state.lastSeenMs);
  if(clock.dataset.status!==state.status){
    const focused=root.querySelector('.attempt-layout')?.contains(document.activeElement);
    if(view.expired&&mode==='training')signalTimer();
    render();
    if(focused)root.querySelector('.attempt-result')?.focus({preventScroll:true});
    return;
  }
  clock.textContent=C.format(view.left);
  document.getElementById('timer-progress').value=view.progress;
  const taskOutput=document.getElementById('task-clock');
  if(taskOutput){
    const taskState=taskClock(), left=D.tasks[task].minutes*60000-taskElapsed(taskState,view.used);
    taskOutput.textContent=C.format(left);
    if(state.status==='running'&&left<=0&&!taskState.alerted[task]){
      taskState.alerted[task]=true;
      set('task-clock:'+practiceKey(),taskState);
      signalTimer();
    }
  }
}

function tour() {
  const original={mode,stage,learningView,scroll:window.scrollY};
  const items=[
    ['overview','#materials-open','Материалы задания','Откройте официальный КИМ, изображения и руководство по стилю.'],
    ['overview','.criteria-heading','Критерии оценки','Здесь указаны формулировки КИМ и баллы. Ссылка под таблицей открывает страницу 13.'],
    ['learn','#stack','Стек обучения','Выберите PHP с XAMPP или Flask с MySQL. Каркас, примеры и шаги соответствуют выбранному стеку.','map'],
    ['learn','.map-node[aria-pressed="true"]','Маршрут обучения','Выберите этап, прочитайте его цель и откройте карточку.','map'],
    ['learn','.lesson-section-tabs [aria-selected="true"]','Условие и файлы','Здесь собраны материалы и требования этапа. Затем перейдите к шагам.','brief','documents'],
    ['learn','#lesson-steps','Шаги','Стрелки листают карточки. Кнопка у заголовка открывает список всех шагов и переход к результату.','steps','documents'],
    ['learn','#er-full','ER-диаграмма','На последнем шаге ER можно построить схему поэтапно, открыть готовую схему и проверить ключи.','steps','er',true],
    ['learn','#done','Что сохранить','Сверьте результат и отметьте выполнение этапа.','result','documents'],
    ['training','#training-sample','Условие КИМ и приложения','Откройте полный текст и исходные файлы официального образца.'],
    ['training','.timer-card','Два таймера тренировки','Верхний отсчитывает общее время, нижний показывает остаток по выбранному заданию. Пауза останавливает оба.'],
    ['training','.training-checklist','Самопроверка','Отметьте проверенные пункты и завершение задания.'],
    ['mock','#mock-variant','Пробный экзамен','Выберите учебный вариант. Условие и архив относятся к выбранному варианту.'],
    ['mock','.timer-card','Непрерывный отсчёт','После запуска время пробного экзамена идёт даже при закрытой вкладке.'],
    ['examples','.example-stacks','Готовый пример','Выберите стек и скачайте архив. Инструкция по запуску открывается по кнопке в левой карточке.'],
    ['examples','#example-file','Исходники','Выберите файл в правой карточке и откройте его для чтения или копирования.'],
    ['teacher','#deck-open','Преподавателю','Выберите стек, заполните данные преподавателя и откройте презентацию или PDF.']
  ];
  let index=0,target=null;
  tourActive=true;
  const dialog=modal('Тур по сайту');
  dialog.classList.add('tour-dialog');
  const card=document.createElement('section');
  card.className='tour-card';
  card.append(...dialog.childNodes);
  const spot=document.createElement('div');
  spot.className='tour-spotlight';
  spot.setAttribute('aria-hidden','true');
  dialog.append(spot,card);
  const body=card.querySelector('.modal-body');

  function position() {
    const pad=8,gap=14,w=innerWidth,h=innerHeight;
    const rect=target?.getBoundingClientRect();
    spot.toggleAttribute('data-missing',!rect);
    const top=rect?Math.min(h-pad,Math.max(pad,rect.top-5)):pad;
    const left=rect?Math.min(w-pad,Math.max(pad,rect.left-5)):pad;
    const right=rect?Math.max(left,Math.min(w-pad,rect.right+5)):left;
    const bottom=rect?Math.max(top,Math.min(h-pad,rect.bottom+5)):top;
    Object.assign(spot.style,{top:top+'px',left:left+'px',width:right-left+'px',height:bottom-top+'px'});
    const width=card.offsetWidth,height=Math.min(card.scrollHeight,h-2*pad);
    const above=top-gap-pad,below=h-pad-bottom-gap;
    let x=Math.min(left,w-pad-width),y=pad;
    if(!rect)y=Math.max(pad,(h-height)/2);
    else if(below>=height)y=bottom+gap;
    else if(above>=height)y=top-gap-height;
    else if(w-right-gap-pad>=width||left-gap-pad>=width){
      x=w-right-gap-pad>=width?right+gap:left-gap-width;
      y=Math.min(top,h-pad-height);
    }else if(below>=above)y=Math.min(bottom+gap,h-pad-height);
    Object.assign(card.style,{top:Math.max(pad,y)+'px',left:Math.max(pad,x)+'px',maxHeight:h-2*pad+'px'});
  }

  function draw() {
    const [nextMode,selector,title,description,view,nextStage,showEr]=items[index];
    mode=nextMode;
    stage=nextStage||original.stage;
    learningView=view||'map';
    tourErStep=showEr;
    render();
    const paused=nextMode==='training'&&selector==='.training-checklist'&&root.querySelector('#pause-title');
    target=paused||root.querySelector(selector);
    body.innerHTML=`<p class="section-code">${index+1} / ${items.length}</p><h3>${E(title)}</h3>
      <p>${E(paused?'После продолжения снова откроются задания и самопроверка.':description)}</p>
      <div class="button-row">${btn('← Назад',`id="tour-prev" ${index===0?'disabled':''}`)}
        ${btn(index===items.length-1?'Готово':'Далее →','id="tour-next"',true)}</div>`;
    target?.scrollIntoView({block:'center',behavior:'instant'});
    position();
    body.querySelector('#tour-prev').onclick=()=>{index--;draw();};
    body.querySelector('#tour-next').onclick=()=>{if(index===items.length-1)cleanup(true);else{index++;draw();}};
    body.querySelector('#tour-next').focus({preventScroll:true});
  }

  const cleanup=restore=>{
    if(tourCleanup!==cleanup)return;
    tourActive=false;
    tourErStep=false;
    tourCleanup=null;
    window.removeEventListener('resize',position);
    window.removeEventListener('scroll',position);
    if(dialog.open)dialog.close();
    if(restore){
      ({mode,stage,learningView}=original);
      render();
      window.scrollTo(0,original.scroll);
      document.getElementById('site-tour')?.focus({preventScroll:true});
    }
  };
  tourCleanup=cleanup;
  window.addEventListener('resize',position);
  window.addEventListener('scroll',position);
  dialog.addEventListener('close',()=>cleanup(true),{once:true});
  draw();
}

function modal(title) {
  const opener=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.className='course-dialog';
  dialog.setAttribute('aria-label',title);
  dialog.innerHTML=`<header class="modal-head"><h2>${E(title)}</h2>${btn('Закрыть','data-dismiss')}</header><div class="modal-body"></div>`;
  document.body.append(dialog);
  dialog.querySelector('[data-dismiss]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{
    dialog.remove();
    if(opener?.isConnected)opener.focus({preventScroll:true});
  },{once:true});
  dialog.showModal();
  return dialog;
}
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
function fileModal(file){if(!(file in codes()))file=db==='php'?'index.php':'app.py';const d=modal('Исходники примера');const body=d.querySelector('.modal-body');body.innerHTML=`<label class="file-picker">Файл<select id="code-file">${Object.keys(codes()).map(f=>`<option ${f===file?'selected':''}>${E(f)}</option>`).join('')}</select></label><div class="button-row">${btn('Копировать код','id="copy-code"')}</div><p class="small">Полный исходный файл. Перенос длинных строк включён; копирование сохраняет исходное форматирование.</p><pre class="code-preview" tabindex="0" aria-label="Исходный код"></pre>`;const show=()=>body.querySelector('pre').textContent=codes()[body.querySelector('select').value]||'Файл недоступен';show();body.querySelector('select').onchange=show;body.querySelector('#copy-code').onclick=async e=>{try{await navigator.clipboard.writeText(body.querySelector('pre').textContent);e.target.textContent='Скопировано';}catch{e.target.textContent='Выделите код и нажмите Ctrl+C';}};}
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
document.addEventListener('keydown',event=>{
  if(mode!=='learn'||!['steps','result'].includes(learningView)||document.querySelector('dialog[open]')||
      event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||
      event.target.closest('button:not([data-step-direction]),a,input,textarea,select,pre,#er-workspace'))return;
  const direction={ArrowLeft:'previous',ArrowRight:'next'}[event.key];
  const button=direction&&root.querySelector(`[data-step-direction="${direction}"]`);
  if(button){event.preventDefault();button.click();}
});
setInterval(tick,1000);render();
window.addEventListener('popstate',()=>{tourCleanup?.(false);returnTask=false;readRoute(new URLSearchParams(location.search));render();});
if(location.hash==='#criteria')document.getElementById('criteria')?.scrollIntoView();
})();
