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
test('all result screenshots needed by both learning routes exist',()=>{
 for(const f of ['flask-registration.png','flask-login.png','flask-application.png','php-login.png','php-application.png','php-registration-mobile.png'])assert.ok(fs.statSync('materials/screenshots/'+f).size>1000);
});
