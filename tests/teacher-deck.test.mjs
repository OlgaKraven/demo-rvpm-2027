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
      assert.equal(data.stageChecks[stage.id].length,2);
      if(data.stepChecks[stage.id])assert.equal(data.stepChecks[stage.id].length,stage.steps.length);
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
    for(const slide of deck.slides){
      if(slide.image)assert(fs.existsSync(site+slide.image.file),slide.image.file);
      for(const [,href] of slide.links??[]){
        const url=new URL(href,deck.site);
        assert(url.href.startsWith(deck.site),href);
        const asset=url.pathname.slice(new URL(deck.site).pathname.length);
        assert(asset ? fs.existsSync(site+asset) : url.searchParams.has('mode'),href);
        if(asset.match(/(?:^|\/)kim-\d+\.pdf$/))assert.equal(asset,'materials/kim-'+data.official.year+'.pdf');
        if(url.searchParams.get('mode')==='learn'){
          const stage=stages.find(stage=>stage.id===url.searchParams.get('stage'));
          const number=Number(url.searchParams.get('step'));
          assert.equal(url.searchParams.get('stack'),stack,href);
          assert(stage && number>=1 && number<=stage.steps.length,href);
        }
      }
    }
    const resourceLinks=(step,asset)=>deck.slides.some(slide=>slide.stepKey===step&&slide.links?.some(([,href])=>href===asset));
    assert(resourceLinks('database:4','materials/database/remaining-tables.sql'));
    assert(resourceLinks('database:6','materials/database/seed-'+(stack==='php'?'php':'flask')+'.sql'));
    const catalogue=deck.slides.find(slide=>slide.title==='Из каталога в таблицу rooms');
    assert.equal(catalogue.rows.length,6);
    assert(catalogue.rows.every(row=>row.length===2));
    assert.match(catalogue.rows[0][1],/auditorium.*120 мест/);
    assert(resourceLinks('database:8','materials/database/er-example.pdf'));
    assert(resourceLinks('database:9','materials/database/schema-export.sql'));
  }
});
