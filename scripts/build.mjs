import {rvpmErGuide} from '../content/er-guide.mjs';
import {buildErLayouts} from './er-layout.mjs';
import {stageChecks,stepChecks,lessonFiles} from '../content/lesson-checks.mjs';
import {lessonReference} from '../content/lesson-reference.mjs';
import {projectFlow} from '../content/project-flow.mjs';
import {starterCss,studentEdits} from '../content/student-edits.mjs';
import {beginnerGuidance} from '../content/beginner.mjs';
import {teacherDeck} from '../content/teacher-deck.mjs';
import {guidance} from '../content/guidance.mjs';
import {phpAssembly,phpStarterReadme} from '../content/php-assembly.mjs';
import fs from 'node:fs';import {databaseIllustrations} from '../content/database.mjs';import {mockVariants,variantMarkdown,variantCSV} from '../content/variants.mjs';import {assembly} from '../content/assembly.mjs';import path from 'node:path';import {createHash} from 'node:crypto';import {stages,tasks,criteria,entities} from '../content/course.mjs';import '../src/core.js';import {phpStages,origins} from '../content/php.mjs';
const out='site';fs.mkdirSync(out,{recursive:true});
for(const f of fs.readdirSync('src'))fs.copyFileSync('src/'+f,out+'/'+f);
fs.cpSync('materials',out+'/materials',{recursive:true});
fs.cpSync('examples/conference-portal-flask/static/fonts',out+'/fonts',{recursive:true});
const base='examples/conference-portal-flask';let files={};
function walk(dir,rel=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','.venv','instance','__pycache__','.pytest_cache','.env'].includes(f.name))continue;const key=rel+f.name;if(f.isDirectory())walk(path.join(dir,f.name),key+'/');else if(!f.name.endsWith('.pyc'))files[key]=fs.readFileSync(path.join(dir,f.name));}}
walk(base);fs.mkdirSync(out+'/downloads',{recursive:true});fs.writeFileSync(out+'/downloads/conference-portal-flask.zip',ExamCore.zip(files));
const code={};for(const [name,bytes] of Object.entries(files))if(name==='.gitignore'||/\.(py|sql|html|css|js|json|md|txt)$/.test(name))code[name]=bytes.toString('utf8');
const construction=assembly(code);
const starterFiles={...files,'app.py':construction.starter,'static/css/style.css':starterCss,'static/js/app.js':'','START-HERE.md':'# Учебный каркас Flask\n\nНачните с карточки https://olgakraven.github.io/demo-rvpm-2027/?mode=learn&stage=backend&stack=mysql&step=1. В ней есть команды для рабочей базы, разметка, код и проверки.\n\nРаспакуйте архив во временную папку. Перенесите файлы в начатый проект, сохранив свой README.md, .gitignore, docs и историю Git. Выполняйте изменения в порядке карточек. Базовые стили уже подключены. Палитру, адаптацию и JavaScript добавляйте на этапах дизайна и интерактивности.\n'};
for(const file of Object.keys(starterFiles)){
  if(file==='README.md'||file.startsWith('docs/')||
    file.startsWith('templates/')&&!['templates/base.html','templates/error.html'].includes(file))delete starterFiles[file];
}
fs.writeFileSync(out+'/downloads/conference-portal-flask-starter.zip',ExamCore.zip(starterFiles));
files={};walk('examples/conference-portal-php');fs.writeFileSync(out+'/downloads/conference-portal-php.zip',ExamCore.zip(files));const phpCode={};for(const [name,bytes] of Object.entries(files))if(/\.(php|py|sql|css|js|md|json)$/.test(name))phpCode[name]=bytes.toString('utf8');
const phpConstruction = phpAssembly(phpCode);
const usersSql=phpCode['schema.sql'].match(/^CREATE TABLE users\s*\([\s\S]*?;/m)[0];
fs.writeFileSync(out+'/materials/database/users.sql',usersSql+'\n');
const roomInsertExample=fs.readFileSync('materials/database/seed-php.sql','utf8').match(/^INSERT INTO rooms\([^\r\n]+/m)[0];
const phpStarterFiles={
  ...files,'index.php':phpConstruction.starter,'static/style.css':starterCss,'static/app.js':'','START-HERE.md':phpStarterReadme
};
for(const file of ['README.md','QA.md','setup.php'])delete phpStarterFiles[file];
fs.writeFileSync(out+'/downloads/conference-portal-php-starter.zip',ExamCore.zip(phpStarterFiles));
const allVariants={};for(const v of mockVariants){const vf={'Задание.md':variantMarkdown(v),'rooms.csv':variantCSV(v)};fs.writeFileSync(out+'/downloads/exam-'+v.id+'.zip',ExamCore.zip(vf));for(const [name,value]of Object.entries(vf))allVariants[v.id+'/'+name]=value;}fs.writeFileSync(out+'/downloads/exam-30-variants.zip',ExamCore.zip(allVariants));
const official=JSON.parse(fs.readFileSync('content/official.json'));
const sources=fs.readdirSync('materials').filter(f=>/\.pdf$|\.zip$/.test(f)).map(f=>({file:f,sha256:createHash('sha256').update(fs.readFileSync('materials/'+f)).digest('hex')}));
const screenshots=fs.existsSync('materials/screenshots')?fs.readdirSync('materials/screenshots').filter(f=>f.endsWith('.png')):[];const data={guidance,stageChecks,stepChecks,lessonFiles,lessonReference,projectFlow,studentEdits:Object.fromEntries(['php','mysql'].map(stack=>[stack,studentEdits(stack)])),usersSql,roomInsertExample,beginner:beginnerGuidance,databaseIllustrations,databaseScreens:fs.readdirSync('materials/database').filter(f=>f.endsWith('.png')),previews:JSON.parse(fs.readFileSync('materials/preview-index.json','utf8')),mockVariants,assembly:construction.lessons,phpAssembly:phpConstruction.lessons,stages,phpStages,origins,tasks,criteria,entities,official,code,phpCode,sources,screenshots};
fs.writeFileSync(out+'/downloads/source-manifest.json',JSON.stringify(sources,null,2));
const er=rvpmErGuide(data);
er.layouts=await buildErLayouts(er);
fs.writeFileSync(out+'/er-data.js','globalThis.ER_GUIDE='+JSON.stringify(er)+';');
const decks=Object.fromEntries(['php','mysql'].map(stack=>[stack,teacherDeck(data,stack)]));
const deckData='globalThis.TEACHER_DECKS='+JSON.stringify(decks)+';';
fs.writeFileSync(out+'/deck-data.js',deckData);
const presentationVersion=createHash('sha256').update(deckData);
const assets=new Set(['deck.css','deck.js','deck.html','deck-mark.png','deck-wordmark.jpg','deck-raleway.woff2','mascot-exam.png']);
for(const deck of Object.values(decks))for(const slide of deck.slides)if(slide.image)assets.add(slide.image.file);
for(const asset of [...assets].sort())presentationVersion.update(fs.readFileSync(out+'/'+asset));
data.presentationVersion=presentationVersion.digest('hex').slice(0,12);
fs.writeFileSync(out+'/content.js','globalThis.COURSE='+JSON.stringify(data)+';');
for(const entry of ['index.html','deck.html']){
  let html=fs.readFileSync(out+'/'+entry,'utf8');
  for(const file of fs.readdirSync(out).filter(name=>/\.(css|js)$/.test(name))){
    const hash=createHash('sha256').update(fs.readFileSync(out+'/'+file)).digest('hex').slice(0,10);
    html=html.replaceAll('"'+file+'"','"'+file+'?v='+hash+'"');
  }
  fs.writeFileSync(out+'/'+entry,html);
}
fs.writeFileSync(out+'/.nojekyll','');
console.log(`Built basic 2027 course: ${tasks.length} official tasks, ${stages.length} learning stages, ${Object.keys(files).length} example files.`);
