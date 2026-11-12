import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {teacherDeck} from '../content/teacher-deck.mjs';

test('both presentations cover each lesson step and link to their own sections',()=>{
  const site='site/';
  const data=JSON.parse(fs.readFileSync(site+'content.js','utf8').slice('globalThis.COURSE='.length,-1));
  for(const stack of ['php','mysql']){
    const deck=teacherDeck(data,stack);
    const stages=stack==='php'?data.phpStages:data.stages;
    assert.deepEqual(deck.chapters.map(chapter=>chapter.id),['intro',...stages.map(stage=>stage.id),'example']);
    for(const stage of stages){
      const chapter=deck.chapters.find(item=>item.id===stage.id);
      assert.equal(deck.slides[chapter.index].kind,'section');
      assert.equal(deck.slides[chapter.index].title,stage.title);
      for(const section of chapter.sections)assert.equal(deck.slides[section.index].chapter,stage.id);
      for(let i=0;i<stage.steps.length;i++){
        const step=deck.slides.find(slide=>slide.stepKey===stage.id+':'+(i+1));
        assert.equal(step?.title,stage.steps[i][0]);
        assert.match(step.links[0][1],new RegExp('stack='+stack+'&step='+(i+1)+'$'));
      }
    }
    const contents=deck.slides.find(slide=>slide.title==='Содержание');
    for(const [title, page, destination] of contents.rows){
      assert.equal(Number(page),destination+1);
      assert.equal(deck.chapters.find(chapter=>chapter.index===destination)?.label,title);
    }
    for(const slide of deck.slides.filter(slide=>slide.image))assert(fs.existsSync(site+slide.image.file),slide.image.file);
  }
});
