import {beginnerStep} from './beginner.mjs';
import {filesFor} from './lesson-checks.mjs';

const site = 'https://olgakraven.github.io/demo-rvpm-2027/';
const material = 'materials/';
const taskFor = {er:0,database:0,backend:0,design:1,interaction:2};
const sectionSteps = {er:[1,2,3,4,5],database:[2,3,4,5,7,8],backend:[1,2,3,4,5,6,7,8]};
const databaseNotes=[
  'Покажите зелёный индикатор MySQL и верхнюю строку phpMyAdmin. Спросите, какую роль здесь играет Apache.',
  'Введите имя учебной базы. Затем попросите назвать её: такое же значение должно попасть в MYSQL_DATABASE.',
  'Создайте id, нажмите A_I и сохраните. Покажите, где в «Структуре» виден значок первичного ключа.',
  'Создайте rooms, applications, reviews и rate_limits через конструктор. Перед каждой таблицей сверяйте имя базы; после сохранения покажите поля и отдельные индексы.',
  'В «Связях» выберите applications.user_id и покажите, куда ведёт эта стрелка на ER. Повторите для room_id.',
  'Покажите источник помещений и почему каталог нужен до регистрации. Сопоставьте первую запись JSON со строкой rooms, затем покажите роль администратора.',
  'Откройте Designer и разнесите таблицы. Попросите проследить путь от reviews к rooms через applications.',
  'Откройте экспортированный PDF. Увеличьте масштаб и убедитесь, что видны все поля и четыре связи.',
  'Покажите разницу между экспортом базы и экспортом одной таблицы. Откройте SQL и найдите CREATE TABLE users.'
];
const labels = {
  documents: 'Откройте КИМ и выделите требования к ролям, данным и страницам. Сохраните рабочую папку и список требований.',
  er: 'Превратите требования к порталу в поля и связи. Отдельно отметьте поля из КИМ, дополнения примера и технические поля.',
  database: 'Создайте учебную базу по схеме. Проверьте пять таблиц и четыре внешних ключа, затем отдельно выгрузите SQL и PDF.',
  backend: 'Свяжите формы, сессию и базу. Проверяйте каждый экран и обработчик сразу после вставки.',
  design: 'Примените руководство по стилю. Покажите те же формы и карточки на компьютере и на экране 390 × 844.',
  interaction: 'Проверьте сохранение заявки, переход в кабинет и защиту от дублей. Добавьте состояния отправки и обратную связь.',
  delivery: 'В чистой папке повторите запуск по README. Проверьте список файлов и отправьте работу в свой репозиторий.'
};

const exampleArchive = stack => 'downloads/conference-portal-'+(stack==='php'?'php':'flask')+'.zip';
const lessonUrl = (stack, stage, step) => '?mode=learn&stage='+stage+'&stack='+stack+'&step='+step;
const image = (folder,file,caption) => ({file:material+folder+'/'+file,caption});

function codePages(code) {
  const pages=[];
  let lines=[], height=0;
  const sourceLines=code.trimEnd().split(/\r?\n/).flatMap(line=>{
    const segments=[];
    while(line.length>1200){
      const boundary=line.lastIndexOf('><',1200)+1;
      const end=boundary>700?boundary:1200;
      segments.push(line.slice(0,end));line=line.slice(end);
    }
    segments.push(line);
    return segments;
  });
  for (const line of sourceLines) {
    const rows = Math.max(1, Math.ceil(line.length/94));
    if (lines.length && height+rows>16) {
      pages.push(lines.join('\n'));
      lines=[]; height=0;
    }
    lines.push(line); height+=rows;
  }
  if(lines.length)pages.push(lines.join('\n'));
  return pages;
}

function sourceParagraphs(text) {
  return text.trim().split(/\n\s*\n/).flatMap(group => group.trim().replace(/\s+/g,' ')
    .split(/(?<!\d[.!?])(?<=[.!?]) +(?=[А-ЯЁ0-9])/u)).filter(Boolean);
}

function textPages(items, limit=540, maxItems=6) {
  const pages=[];
  let page=[], count=0;
  for(const item of items) {
    if(page.length && (count+item.length>limit||page.length>=maxItems)){pages.push(page);page=[];count=0;}
    page.push(item); count+=item.length;
  }
  if(page.length)pages.push(page);
  return pages;
}

export function teacherDeck(data, stack) {
  const php=stack==='php', stages=php?data.phpStages:data.stages;
  const stackName=php?'PHP + MySQL (XAMPP)':'Flask + MySQL / MariaDB';
  const slides=[], chapters=[], snippets=[];
  let chapter;
  const add=(kind,title,props={})=>slides.push({kind,chapter:chapter.id,title,...props})-1;
  const start=(id,label)=>{
    chapter={id,label,index:slides.length,sections:[]};
    chapters.push(chapter);
  };
  const mark=(label)=>chapter.sections.push({label,index:slides.length});
  const contentsRows=entries=>entries.map(({label,index})=>[label,String(index+1),index]);
  const guide=(s,i)=>data.guidance[s.id==='backend'&&php?'phpBackend':s.id]?.[i];
  const officialTasks=data.official.text.split(/Задание [123]\. /).slice(1);

  start('intro','Введение');
  add('cover','Демонстрационный экзамен 2027');
  add('facts','Как устроен экзамен',{
    facts:[['3 ч 30 мин','210 минут на выполнение'],['Базовый','Уровень ГИА ДЭ'],['75','Максимум баллов']],
    body:'Разбираем портал «Конференции.РФ» по КИМ '+data.official.code+'. Пользователь бронирует помещение, администратор рассматривает заявку, после завершения пользователь оставляет отзыв.',
    note:'Назовите результат, который участник передаёт на проверку: работающий портал, ER-схема и индивидуальный репозиторий.'
  });
  add('table','Три задания и время',{
    columns:['Задание','Время'],rows:data.tasks.map((t,i)=>[(i+1)+'. '+t.title,t.minutes+' мин']),
    note:'Покажите, как семь учебных этапов раскрывают три задания КИМ.'
  });
  const contents=add('table','Содержание',{columns:['Раздел','Слайд']});
  add('text','Что открыть перед занятием',{
    actions:['Откройте КИМ на страницах 33–37 и скачайте приложения. Проверьте руководство по стилю, шрифты и исходные изображения.',
      php?'Запустите Apache и MySQL в XAMPP. Откройте phpMyAdmin и отдельную папку проекта в VS Code.':'Запустите MySQL в XAMPP. Откройте phpMyAdmin и VS Code. Flask запускается через Python из виртуального окружения.',
      'Создайте свою рабочую папку. Файлы и код добавляйте по шагам обучения; изображения, шрифты и библиотеки подготовьте заранее.'],
    links:[['КИМ · PDF',material+'kim-2027.pdf#page=33'],['Исходные файлы · ZIP',material+'basic-inputs.zip']],
    check:'Видны исходные материалы, открыта рабочая папка, запущена СУБД.'
  });
  const shownTasks=new Set();
  for(const stage of stages) {
    start(stage.id,stage.title);
    const taskIndex=taskFor[stage.id], task=data.tasks[taskIndex];
    const [input,verify]=data.stageChecks[stage.id];
    add('section',stage.title,{
      eyebrow:stage.module,body:labels[stage.id],source:'Перед началом: '+input,
      note:'Откройте соответствующий этап обучения. Сначала покажите результат предыдущего этапа и объясните, как он используется здесь.',
      links:[['Открыть учебный этап',lessonUrl(stack,stage.id,1)]]
    });
    const sectionContents=sectionSteps[stage.id]?add('table','Содержание · '+stage.title,{columns:['Блок','Слайд']}):null;
    if(task && !shownTasks.has(taskIndex)) {
      shownTasks.add(taskIndex);
      mark('Условие из КИМ');
      const source=officialTasks[taskIndex].split(/Инструкции для администратора центра/)[0].trim();
      const pages=textPages(sourceParagraphs(source));
      pages.forEach((paragraphs,i)=>add('text',task.title,{
        eyebrow:'Условие из КИМ'+(pages.length>1?' · '+(i+1)+'/'+pages.length:''),
        paragraphs,links:i===pages.length-1?[['КИМ · стр. '+task.pages,material+'kim-2027.pdf#page='+task.pages.match(/\d+/)[0]]]:undefined,
        note:'Прочитайте формулировку КИМ. Назовите, какие результаты студент должен показать.'
      }));
    }
    for(const [i,[title,body,source]] of stage.steps.entries()) {
      if(sectionSteps[stage.id]?.includes(i))mark(title);
      const stepKey=stage.id+':'+(i+1), eyebrow='Шаг '+(i+1)+' из '+stage.steps.length;
      const props={stepKey,eyebrow};
      const g=guide(stage,i);
      const card=lessonUrl(stack,stage.id,i+1);
      const materials=filesFor(data.lessonFiles,stage.id,i,stack).map(([label,path])=>[label,path]);
      const resources=materials.filter(([,path])=>!data.sqlBlocks[path]);
      const lesson=stage.id==='backend'?(php?data.phpAssembly:data.assembly)[i]:null;
      add('text',title,{...props,body,source,links:[['Открыть карточку',card],...resources],note:stage.id==='database'?databaseNotes[i]:g?.why});
      if(stage.id==='documents'&&i===0){
        for(const program of data.installationSteps){
          const paragraphs=program.paragraphs.flatMap(sourceParagraphs);
          textPages(paragraphs,410,3).forEach(actions=>add('step',program.title,{...props,actions,links:program.links}));
          if(program.image)add('step',program.title+' · где скачать',{...props,image:{file:program.image,caption:'Ссылка скачивания программы находится на этой странице.'},links:program.links});
          for(const code of program.commands)add('code',program.title+' · проверьте установку',{...props,code});
        }
      }
      const expected=data.stepChecks[stage.id]?.[i];
      if(expected&&stage.id==='er')add('step',title,{...props,check:expected});
      if(g) {
        textPages(g.actions,410).forEach((actions,index,pages)=>add('step',title,{
          ...props,eyebrow:eyebrow+(pages.length>1?' · '+(index+1)+'/'+pages.length:''),
          heading:'Что сделать',actions,actionOffset:pages.slice(0,index).flat().length,check:index===pages.length-1?g.check:undefined,note:g.why
        }));
        if(g.code)add('code',title,{...props,code:g.code,heading:'Команды и код для проверки'});
      }
      for(const [label,path] of materials){
        const code=data.sqlBlocks[path];
        if(!code)continue;
        add('text',label,{...props,heading:'В своей базе → SQL',body:'Структура уже создана и проверена. Следующий блок добавляет шесть помещений из учебного каталога и администратора своего стека. Скопируйте полный блок, вставьте в большое поле SQL своей базы и выполните один раз. PHP и Flask используют разные хеши учебного пароля.'});
        const pages=codePages(code),snippet=pages.length>1?snippets.push(code)-1:undefined;
        pages.forEach(part=>add('code',label,{...props,code:part,snippet,heading:'Начальные записи · копируйте полный блок',links:[['Источник данных и объяснение в карточке',card]]}));
      }
      for(const {file,code} of data.studentEdits[stack][stage.id]?.[i]??[]){
        const pages=codePages(code),snippet=pages.length>1?snippets.push(code)-1:undefined;
        for(const part of pages)add('code',title,{
          ...props,heading:'В конец файла '+file,code:part,snippet,links:[['Фрагмент целиком в карточке',card]]
        });
      }
      for(const {target,instruction,code} of data.studentChecks[stack][stage.id]?.[i]??[]){
        const pages=codePages(code),snippet=pages.length>1?snippets.push(code)-1:undefined;
        for(const part of pages)add('code',title,{
          ...props,heading:target,code:part,snippet,note:instruction,links:[['Порядок проверки в карточке',card]]
        });
      }
      const worked=beginnerStep(data.beginner,stage.id,i,stack);
      if(worked) {
        const actions=worked.rows.map(([label,value])=>label+'. '+value);
        textPages(actions,435).forEach((group,j,pages)=>add('step',worked.title,{
          ...props,actions:group,actionOffset:pages.slice(0,j).flat().length,
          check:j===pages.length-1?worked.after:undefined,note:'Выполните проверку на указанных данных. Попросите студента назвать видимый результат.'
        }));
      }
      if(stage.id==='er'&&i===0) add('step','Общая ER-диаграмма',{
        ...props,body:'Проследите четыре связи. У заявки есть владелец и помещение. Отзыв ссылается на заявку и пользователя.',
        image:image('database','constructor-designer.png','ER-схема в phpMyAdmin'),links:[['ER-схема · PDF',material+'database/er-example.pdf']]
      });
      if(stage.id==='er'&&[1,2,3].includes(i)) {
        const names = i===1?['users']:i===2?['rooms','applications']:['reviews','rate_limits'];
        for(const name of names) {
          const entity=data.entities.find(x=>x.name===name);
          const rows=entity.fields.map(field=>{
            const [origin,reason]=data.origins[name][field.split(' · ')[0]];
            return [field,origin+'. '+reason];
          });
          for(let j=0;j<rows.length;j+=4)add('table',name+' · поля и происхождение',{
            ...props,columns:['Поле и тип','Откуда берётся и зачем'],rows:rows.slice(j,j+4),wrapTable:true,
            note:'Сопоставьте значение поля с формой, сессией, каталогом или серверной логикой.'
          });
        }
      }
      if(stage.id==='database') {
        const constructor=data.databaseConstructor;
        const forms=i===2?constructor.tableForms.slice(0,1):i===3?constructor.tableForms.slice(1):[];
        if(forms.length){
          textPages(constructor.constructorActions,410).forEach(actions=>add('step',title,{...props,heading:'Порядок работы в конструкторе',actions}));
          for(const form of forms){
            add('text',form.name+' · '+form.fields.length+' столбцов',{...props,body:form.purpose});
            for(let j=0;j<form.fields.length;j+=4)add('table',form.name+' · заполните строки конструктора',{
              ...props,columns:['Имя','Тип','Длина','Индекс · имя','По умолчанию'],rows:form.fields.slice(j,j+4),wrapTable:true
            });
            textPages(form.notes,410,2).forEach(actions=>add('step',form.name+' · ключи и сохранение',{...props,actions}));
            for(const [file,caption] of form.extraImages??[])add('step',form.name+' · настройка индекса',{...props,image:image('database',file,caption)});
            add('step',form.name+' · после сохранения',{...props,image:image('database',form.image,'Сверьте поля и блок «Индексы».')});
          }
        }
        if(i===4){
          textPages(constructor.relationActions,410).forEach(actions=>add('step',title,{...props,heading:'Создайте связи в конструкторе',actions}));
          for(const form of constructor.relationForms){
            add('table',form.table+' · внешние ключи',{
              ...props,columns:['Имя ограничения','Связь','ON DELETE / ON UPDATE'],wrapTable:true,
              rows:form.rows.map(([name,field,table,column,onDelete,onUpdate])=>[name,field+' → '+table+'.'+column,onDelete+' / '+onUpdate])
            });
            add('step',form.table+' → Структура → Связи',{...props,image:image('database',form.image,'Заполните две отдельные строки и сохраните.')});
          }
          add('step','Проверки допустимых значений · CHECK',{...props,actions:[
            'В phpMyAdmin 5.2.1 конструктор полей и экран «Связи» не имеют редактора CHECK. Нажмите имя своей базы → «SQL».',
            'Скопируйте полный блок CHECK из следующего слайда в большое поле запроса → «Вперёд». Выполните один раз после создания таблиц. При повторе сначала проверьте уже существующие ограничения.',
            'ALTER TABLE изменяет таблицу, ADD CONSTRAINT задаёт имя, CHECK проверяет условие. CHAR_LENGTH считает символы русского текста; LENGTH в MySQL считает байты.'
          ]});
          for(let j=0;j<constructor.valueChecks.length;j+=3)add('table','Какие значения разрешены',{
            ...props,columns:['Таблица','Условие','Зачем'],wrapTable:true,
            rows:constructor.valueChecks.slice(j,j+3).map(([table,,expression,reason])=>[table,expression,reason])
          });
          const snippet=snippets.push(constructor.valueChecksSql)-1;
          codePages(constructor.valueChecksSql).forEach(code=>add('code','Добавьте CHECK в своей базе',{...props,code,snippet,heading:'Кнопка копирует весь блок ограничений'}));
        }
        if(i===8){
          add('step','Проверьте CHECK после экспорта',{...props,actions:[
            'В проверенном phpMyAdmin 5.2.1 быстрый экспорт пропускает CHECK. Откройте свой database.sql в VS Code и найдите CHECK (. Если проверок нет, добавьте следующий блок в конец файла; если часть есть, добавьте только недостающие.',
            'Сохраните UTF-8. Импортируйте свой файл в новую пустую учебную базу. Запросами шагов 3–6 проверьте поля, индексы, четыре FK, одиннадцать CHECK и начальные записи.',
            'Блок ниже дополняет файл выгрузки. В исходной рабочей базе CHECK уже есть; повторно выполнять блок в ней не нужно.'
          ]});
          const snippet=snippets.push(constructor.valueChecksSql)-1;
          codePages(constructor.valueChecksSql).forEach(code=>add('code','Дополнение к своей SQL-выгрузке',{...props,code,snippet,heading:'Копируется полный блок CHECK'}));
        }
        if(i===5) {
          const rooms=JSON.parse((php?data.phpCode:data.code)['rooms.json']);
          add('table','Из каталога в таблицу rooms',{
            ...props,columns:['Помещение','Код типа, город и вместимость'],wrapTable:true,
            rows:rooms.map(room=>[room.name,`${room.category} · ${room.city} · ${room.capacity} мест`]),
            note:'КИМ задаёт типы помещений. Значения в таблице учебные. В следующем этапе сервер возьмёт capacity по выбранному room_id.',
            links:[['Карточка с записью JSON и SQL',card]]
          });
        }
        const [file,caption]=data.databaseIllustrations[i];
        for(const [shot,description] of ([2,3,4].includes(i)?[]:[[file,caption]])) {
          add('step',title,{...props,image:image('database',shot,description)});
        }
        add('step',title,{...props,check:expected,links:resources});
      }
      if(lesson) {
        if(i===0) {
          const plan=data.projectSetup[stack];
          textPages(plan.actions,410).forEach(actions=>add('step',title,{
            ...props,heading:'Создайте свою рабочую папку и файлы',actions,
            links:[['Изображения и шрифты','downloads/portal-assets.zip'],...(!php?[['Библиотеки Python 3.12 x64','downloads/flask-wheels.zip']]:[])]
          }));
          for(const [file,text] of Object.entries(data.setupFiles[stack])) {
            add('text',title,{...props,heading:'Создайте файл '+file,body:plan.purposes[file]});
            const pages=codePages(text);
            const snippet=pages.length>1?snippets.push(text)-1:undefined;
            pages.forEach(code=>add('code',title,{...props,heading:file,code,snippet,links:[['Полный код файла в карточке',card]]}));
          }
          add('text',title,{...props,heading:'Запустите свой проект',body:plan.launchExplanation});
          add('code',title,{...props,heading:'Команды PowerShell из своей папки',code:plan.command,check:plan.check,note:plan.restart});
        }
        if(lesson.map)add('text',title,{...props,heading:'От условия к данным',body:lesson.map,check:lesson.check});
        for(const block of lesson.blocks) {
          const marker=block.first?.match(/BEGIN ([\w-]+)/)?.[1];
          const instruction=block.where || 'В '+block.file+' замените участок от '+block.first+' до '+block.last+' включительно.';
          add('text',title,{...props,heading:block.file+(marker?' · '+marker:''),body:instruction,check:lesson.check});
          const pages=codePages(block.text);
          const snippet=pages.length>1?snippets.push(block.text)-1:undefined;
          pages.forEach((code,j)=>add('code',title,{
            ...props,eyebrow:'Шаг '+(i+1)+' · '+block.file+(marker?' · '+marker:'')+(pages.length>1?' · '+(j+1)+'/'+pages.length:''),
            code,snippet,links:snippet!==undefined?[['Полный фрагмент в карточке',card]]:undefined
          }));
        }
        const shot=(php?['catalog','registration-mobile','login','application',null,null]:['catalog',null,'registration','login',null,'application','admin-mobile',null,null])[i];
        if(shot)add('step',title,{...props,heading:'Что должно получиться',image:image('screenshots',(php?'php-':'flask-')+shot+'.png','Экран работающего примера'),note:lesson.check});
      }
      if(stage.id==='design'&&i===3){
        const file=php?'php-registration-mobile.png':'flask-admin-mobile.png';
        add('step','Проверка на телефоне 390 × 844',{...props,image:image('screenshots',file,'Одна колонка, читаемые подписи и доступные кнопки')});
      }
      if(stage.id==='design'&&i===4){
        const file=(php?'php':'flask')+'-application.png';
        add('step','Выбор помещения и оплаты',{...props,image:image('screenshots',file,'Два выпадающих списка на форме заявки')});
      }
      if(stage.id==='design'&&i===1)for(const file of data.previews.style)
        add('step','Руководство по стилю',{...props,image:image('preview',file,'Оригинал руководства по стилю из комплекта БУ')});
    }
    if(sectionContents!==null)slides[sectionContents].rows=contentsRows(chapter.sections);
    add('text','Что должно остаться после этапа',{
      eyebrow:'Результат этапа',heading:'Что сохранить',body:stage.output,check:verify,note:'Попросите открыть сохранённый результат и показать, как проверить его по карточке.'
    });
  }
  start('example','Готовый пример');
  add('section','От регистрации до отзыва',{
    eyebrow:'Готовый пример',body:stackName,links:[['Готовый пример · ZIP',exampleArchive(stack)]],
    note:'Запустите пример в отдельной папке и откройте две сессии браузера для пользователя и администратора.'
  });
  for(const [title, actions, check, shot] of [
    ['Регистрация и вход',['Создайте student27 и войдите.','Повторите регистрацию с тем же логином.'], 'Пользователь видит пустой кабинет; повторный логин вызывает ошибку.', php?'registration-mobile':'registration'],
    ['Заявка на помещение',['Введите «Учебная конференция», выберите первый зал, завтрашнюю дату, 10:00, 1 участника и оплату по СБП.','Откройте кабинет и сверяйте данные с applications.'], 'Одна карточка со статусом «Новая».', 'application'],
    ['Действия администратора',['Войдите как Conf2027 с учебным паролем Demo77.','Найдите заявку. Назначьте, затем завершите мероприятие.'], 'У пользователя виден статус «Завершено».', php?null:'admin-mobile'],
    ['Отзыв и результат',['Под student27 оставьте отзыв о завершённом мероприятии.','Обновите кабинет и сверьте таблицу reviews.'], 'В карточке показан отзыв. Для заявки есть одна запись в reviews.', null]
  ]) {
    mark(title);
    add('step',title,{actions,check});
    if(shot)add('step',title,{image:image('screenshots',(php?'php-':'flask-')+shot+'.png','Экран работающего портала')});
  }
  mark('За что начисляют баллы');
  add('table','За что начисляют баллы',{
    eyebrow:'КИМ · таблица 7',columns:['Критерий','Баллы'],rows:data.criteria.map(([label,n])=>[label,String(n)]),
    links:[['Открыть КИМ · стр. 13',material+'kim-2027.pdf#page=13']],
    note:'Итого 75 баллов. Для оценивания используйте формулировки таблицы 7 КИМ.'
  });
  slides[contents].rows=contentsRows(chapters.slice(1));
  const externalLinks=[...new Set(data.installationSteps.flatMap(program=>program.links.map(([,href])=>href)))];
  return {stackName,code:data.official.code,site,slides,chapters,snippets,externalLinks};
}
