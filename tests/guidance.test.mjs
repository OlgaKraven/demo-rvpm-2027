import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guidance} from '../content/guidance.mjs';
import {stages} from '../content/course.mjs';
test('independent instructions cover preparation, design, interaction and delivery',()=>{
 for(const id of ['documents','design','interaction','delivery']){
  assert.equal(guidance[id].length,stages.find(s=>s.id===id).steps.length);
  for(const g of guidance[id])assert.ok(g.why&&g.actions.length>=2&&g.check);
 }
 assert.match(guidance.documents[3].code,/git add README.md/);
 assert.match(guidance.delivery[2].code,/git push -u origin main/);
});
test('all result screenshots needed by both learning routes exist',()=>{
 for(const f of ['flask-registration.png','flask-login.png','flask-application.png','php-login.png','php-application.png','php-registration-mobile.png'])assert.ok(fs.statSync('materials/screenshots/'+f).size>1000);
});
