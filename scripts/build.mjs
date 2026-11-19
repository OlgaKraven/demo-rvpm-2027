import {rvpmErGuide} from '../content/er-guide.mjs';
import {examFaq,faqSection} from '../content/faq.mjs';
import {projectSetup} from '../content/project-setup.mjs';
import {tableForms,constructorActions,relationForms,relationActions,valueChecks,valueChecksSql} from '../content/database-constructor.mjs';
import {preparationPage,installationSteps} from '../content/installation.mjs';
import {buildErLayouts} from './er-layout.mjs';
import {stageChecks,stepChecks,lessonFiles} from '../content/lesson-checks.mjs';
import {lessonReference} from '../content/lesson-reference.mjs';
import {projectFlow} from '../content/project-flow.mjs';
import {starterCss,studentEdits,studentChecks} from '../content/student-edits.mjs';
import {beginnerGuidance} from '../content/beginner.mjs';
import {teacherDeck} from '../content/teacher-deck.mjs';
import {guidance} from '../content/guidance.mjs';
import {phpAssembly} from '../content/php-assembly.mjs';
import {windowsWheels} from './offline-wheels.mjs';
import fs from 'node:fs';import {databaseIllustrations} from '../content/database.mjs';import {mockVariants,variantMarkdown,variantCSV} from '../content/variants.mjs';import {assembly} from '../content/assembly.mjs';import path from 'node:path';import {createHash} from 'node:crypto';import {stages,tasks,criteria,entities} from '../content/course.mjs';import '../src/core.js';import {phpStages,origins} from '../content/php.mjs';
const out='site';fs.mkdirSync(out,{recursive:true});
for(const f of fs.readdirSync('src'))fs.copyFileSync('src/'+f,out+'/'+f);
fs.cpSync('materials',out+'/materials',{recursive:true});
fs.cpSync('examples/conference-portal-flask/static/fonts',out+'/fonts',{recursive:true});
const base='examples/conference-portal-flask';let files={};
function walk(dir,rel=''){for(const f of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','.venv','instance','__pycache__','.pytest_cache','.env'].includes(f.name))continue;const key=rel+f.name;if(f.isDirectory())walk(path.join(dir,f.name),key+'/');else if(!f.name.endsWith('.pyc'))files[key]=fs.readFileSync(path.join(dir,f.name));}}
walk(base);fs.mkdirSync(out+'/downloads',{recursive:true});
const supportFiles={'copy-code.js':fs.readFileSync('src/copy-code.js')};
for(const name of ['vscode','git','xampp','python'])
  supportFiles['setup/setup-'+name+'-26.png']=fs.readFileSync('materials/screenshots/setup-'+name+'-26.png');
for(const [name,bytes] of Object.entries(supportFiles)){
  fs.mkdirSync(path.dirname(out+'/'+name),{recursive:true});
  fs.writeFileSync(out+'/'+name,bytes);
}
const learningPreparation=preparationPage(fs.readFileSync('src/learning-preparation.html','utf8'),faqSection());
const preparation=Buffer.from(preparationPage(fs.readFileSync('src/preparation.html','utf8'),faqSection()));
fs.writeFileSync(out+'/preparation.html',preparation);
fs.writeFileSync(out+'/learning-preparation.html',learningPreparation);
const launchGuide=Object.fromEntries(['php','flask'].map(id=>[
  id, preparation.toString('utf8').match(new RegExp(`  <section id="${id}">([\\s\\S]*?)\\n  </section>`))[1],
]));
const wheels=windowsWheels(`${base}/requirements.txt`);
const populatedDatabase=(schema,seed)=>['-- Импортируйте в новую пустую учебную базу UTF-8.',
  schema.toString('utf8').replace(/^DROP TABLE IF EXISTS .*;\s*$/gm,'').trim(),
  fs.readFileSync(`materials/database/${seed}`, 'utf8'),
].join('\n\n');
fs.writeFileSync(out+'/downloads/conference-portal-flask.zip',ExamCore.zip({...files,...wheels,...supportFiles,
  'preparation.html':preparation,
  'database-filled.sql':populatedDatabase(files['schema-mysql.sql'],'seed-flask.sql'),
}));
fs.writeFileSync(out+'/downloads/flask-wheels.zip',ExamCore.zip(wheels));
const code={};for(const [name,bytes] of Object.entries(files))if(name==='.gitignore'||/\.(py|sql|html|css|js|json|md|txt)$/.test(name))code[name]=bytes.toString('utf8');
const construction=assembly(code);
// Lessons show the initial files inline; only complete examples are downloadable.
for(const stack of ['flask','php'])
  fs.rmSync(out+'/downloads/conference-portal-'+stack+'-starter.zip',{force:true});
files={};walk('examples/conference-portal-php');
fs.writeFileSync(out+'/downloads/conference-portal-php.zip',ExamCore.zip({...files,...supportFiles,
  'preparation.html':preparation,
  'database-filled.sql':populatedDatabase(files['schema.sql'],'seed-php.sql'),
}));
const phpCode={};for(const [name,bytes] of Object.entries(files))if(/\.(php|py|sql|css|js|md|json)$/.test(name))phpCode[name]=bytes.toString('utf8');
const phpConstruction = phpAssembly(phpCode);
const usersSql=phpCode['schema.sql'].match(/^CREATE TABLE users\s*\([\s\S]*?;/m)[0];
fs.writeFileSync(out+'/materials/database/users.sql',usersSql+'\n');
const roomInsertExample=fs.readFileSync('materials/database/seed-php.sql','utf8').match(/^INSERT INTO rooms\([^\r\n]+/m)[0];
const projectAssets=Object.fromEntries(Object.entries(files).filter(([name])=>
  name.startsWith('static/img/') || name.startsWith('static/fonts/')));
fs.writeFileSync(out+'/downloads/portal-assets.zip',ExamCore.zip(projectAssets));
const setupFiles={
  php:{
    'lib.php':phpCode['lib.php'],
    'index.php':phpConstruction.starter,
    'static/style.css':starterCss
  },
  mysql:{
    'requirements.txt':code['requirements.txt'],
    'mysql_backend.py':code['mysql_backend.py'],
    'app.py':construction.starter,
    'templates/base.html':code['templates/base.html'],
    'templates/error.html':code['templates/error.html'],
    'static/css/style.css':starterCss
  }
};
const sqlBlocks=Object.fromEntries(['users','remaining-tables','seed-php','seed-flask','schema-export'].map(name=>[
  'materials/database/'+name+'.sql',fs.readFileSync(out+'/materials/database/'+name+'.sql','utf8')
]));
const allVariants={};for(const v of mockVariants){const vf={'Задание.md':variantMarkdown(v),'rooms.csv':variantCSV(v)};fs.writeFileSync(out+'/downloads/exam-'+v.id+'.zip',ExamCore.zip(vf));for(const [name,value]of Object.entries(vf))allVariants[v.id+'/'+name]=value;}fs.writeFileSync(out+'/downloads/exam-30-variants.zip',ExamCore.zip(allVariants));
const official=JSON.parse(fs.readFileSync('content/official.json'));
const sources=fs.readdirSync('materials').filter(f=>/\.pdf$|\.zip$/.test(f)).map(f=>({file:f,sha256:createHash('sha256').update(fs.readFileSync('materials/'+f)).digest('hex')}));
const screenshots=fs.existsSync('materials/screenshots')?fs.readdirSync('materials/screenshots').filter(f=>f.endsWith('.png')):[];const data={guidance,setupFiles,sqlBlocks,stageChecks,stepChecks,lessonFiles,lessonReference,projectFlow,studentEdits:Object.fromEntries(['php','mysql'].map(stack=>[stack,studentEdits(stack)])),studentChecks:Object.fromEntries(['php','mysql'].map(stack=>[stack,studentChecks(stack)])),usersSql,roomInsertExample,beginner:beginnerGuidance,databaseIllustrations,databaseScreens:fs.readdirSync('materials/database').filter(f=>f.endsWith('.png')),previews:JSON.parse(fs.readFileSync('materials/preview-index.json','utf8')),mockVariants,assembly:construction.lessons,phpAssembly:phpConstruction.lessons,stages,phpStages,origins,tasks,criteria,entities,official,code,phpCode,sources,screenshots};
fs.writeFileSync(out+'/downloads/source-manifest.json',JSON.stringify(sources,null,2));
data.examFaq=examFaq;
data.projectSetup=projectSetup;
data.installationSteps=installationSteps();
data.databaseConstructor={tableForms,constructorActions,relationForms,relationActions,valueChecks,valueChecksSql};
data.learningPreparationHtml=learningPreparation.match(/<main>([\s\S]*?)<\/main>/)[1]
  .replace(/<section id="faq">[\s\S]*?<\/section>/,'')
  .replace(/<(\/?)h([123])\b/g,(_,end,level)=>'<'+end+'h'+(Number(level)+2));
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
data.launchGuide=launchGuide;
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
