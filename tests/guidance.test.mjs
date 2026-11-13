import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guidance} from '../content/guidance.mjs';
import {stages} from '../content/course.mjs';
import {beginnerGuidance,beginnerStep} from '../content/beginner.mjs';
import {phpStages} from '../content/php.mjs';
import {projectFlow} from '../content/project-flow.mjs';
test('independent instructions cover every shared stage',()=>{
 assert.deepEqual(Object.keys(projectFlow),stages.map(stage=>stage.id));
 for(const id of ['documents','er','database','design','interaction','delivery']){
  assert.equal(guidance[id].length,stages.find(s=>s.id===id).steps.length);
  for(const g of guidance[id])assert.ok(g.why&&g.actions.length>=2&&g.check);
 }
 assert.match(guidance.documents[3].code,/git add README.md/);
 assert.match(guidance.delivery[2].code,/git remote -v/);
 assert.doesNotMatch(guidance.delivery[2].code,/git remote (add|set-url)|git push/);
 const branches=beginnerStep(beginnerGuidance,'delivery',2,'php').rows.map(row=>row[1]);
 assert.match(branches[0],/^git remote add origin /);
 assert.match(branches[1],/git push -u origin main/);
 assert.match(branches[2],/^git remote set-url origin /);
});
test('the demonstrated SQL row comes from the same catalogue in both stacks',()=>{
 const data=JSON.parse(fs.readFileSync('site/content.js','utf8').slice('globalThis.COURSE='.length,-1));
 const [room]=JSON.parse(data.code['rooms.json']);
 assert.deepEqual(JSON.parse(data.code['rooms.json']),JSON.parse(data.phpCode['rooms.json']));
 assert.equal(room.name,'Лофт «Балтика»');
 assert.equal(room.capacity,120);
 for(const stack of ['php','flask']){
  const seed=fs.readFileSync('materials/database/seed-'+stack+'.sql','utf8');
  assert(seed.includes(data.roomInsertExample));
 }
 assert.match(data.roomInsertExample,/^INSERT INTO rooms\(name,category,city,address,capacity/);
 assert(data.roomInsertExample.includes(`'${room.name}','${room.category}','${room.city}','${room.address}',${room.capacity},`));
});
test('backend walkthroughs match every Flask and PHP step',()=>{
  for(const [route,steps] of [[stages,guidance.backend],[phpStages,guidance.phpBackend]]){
    assert.equal(steps.length,route.find(s=>s.id==='backend').steps.length);
    for(const step of steps)assert.ok(step.why&&step.actions.length>=2&&step.check);
  }
});
test('every design and interaction card has an edit or a runnable check for both stacks',()=>{
  const data=JSON.parse(fs.readFileSync('site/content.js','utf8').slice('globalThis.COURSE='.length,-1));
  for(const stack of ['php','mysql']){
    const edits=data.studentEdits[stack], checks=data.studentChecks[stack];
    const sources=stack==='php'?data.phpCode:data.code;
    for(const stage of ['design','interaction']){
      for(const [index,[title]] of stages.find(item=>item.id===stage).steps.entries()){
        const fragments=edits[stage]?.[index]??[];
        const verification=checks[stage]?.[index]??[];
        assert(fragments.length||verification.length,title);
        for(const {file,code} of fragments)assert(file in sources&&code,title);
        for(const {target,instruction,code,backendStep} of verification){
          assert(target&&instruction&&code,title);
          if(backendStep){
            const lessons=stack==='php'?data.phpAssembly:data.assembly;
            assert(lessons[backendStep-1].blocks.some(block=>block.text.includes(code)),title);
          }
        }
      }
    }
  }
});
test('database and forms checkpoints cover imports and the intermediate states of both routes',()=>{
 const data=JSON.parse(fs.readFileSync('site/content.js','utf8').slice('globalThis.COURSE='.length,-1));
 for(const [stack,expected] of [['php',[0,1,3,4,5]],['mysql',[0,1,2,4,5,6,7,8]]]){
  const {database,backend}=data.studentChecks[stack];
  assert.deepEqual(Object.keys(database).map(Number),[0,1,2,3,4,5,8]);
  assert.deepEqual(Object.keys(backend).map(Number),expected);
  for(const checks of [database,backend]){
   for(const items of Object.values(checks)){
    for(const {target,instruction,code} of items)assert(target&&instruction&&code);
   }
  }
  assert.match(database[4][0].code,/TABLE_SCHEMA = DATABASE\(\)/);
  assert.match(database[5][0].code,/SELECT username, is_admin FROM users/);
  assert.match(backend[stack==='php'?4:7][0].code,/LEFT JOIN reviews/);
 }
 assert(data.phpAssembly.flatMap(lesson=>lesson.blocks).every(block=>block.purpose));
 assert.deepEqual(data.assembly[0].blocks,[]);
 assert.deepEqual(data.assembly.at(-1).blocks,[]);
});
test('all result screenshots needed by both learning routes exist',()=>{
 for(const f of ['flask-registration.png','flask-login.png','flask-application.png','php-login.png','php-application.png','php-registration-mobile.png'])assert.ok(fs.statSync('materials/screenshots/'+f).size>1000);
});
