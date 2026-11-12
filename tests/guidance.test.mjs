import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guidance} from '../content/guidance.mjs';
import {stages} from '../content/course.mjs';
import {phpStages} from '../content/php.mjs';
test('independent instructions cover preparation, design, interaction and delivery',()=>{
 for(const id of ['documents','design','interaction','delivery']){
  assert.equal(guidance[id].length,stages.find(s=>s.id===id).steps.length);
  for(const g of guidance[id])assert.ok(g.why&&g.actions.length>=2&&g.check);
 }
 assert.match(guidance.documents[3].code,/git add README.md/);
 assert.match(guidance.delivery[2].code,/git push -u origin main/);
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
