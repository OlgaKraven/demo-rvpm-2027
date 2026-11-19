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
    for(const [file,code] of Object.entries(data.setupFiles[stack])){
      const pages=deck.slides.filter(slide=>slide.stepKey==='backend:1'&&slide.heading===file&&slide.kind==='code');
      assert(pages.length,file+' · initial code must be present in the presentation');
      const full=pages[0].snippet!==undefined?deck.snippets[pages[0].snippet]:pages.map(page=>page.code).join('\n');
      assert.equal(full.replace(/\r\n/g,'\n').trimEnd(),code.replace(/\r\n/g,'\n').trimEnd(),file);
    }
    for(const [kind,collection] of [['edits',data.studentEdits[stack]],['checks',data.studentChecks[stack]]]){
      for(const [stage,steps] of Object.entries(collection))for(const [index,blocks] of Object.entries(steps))for(const block of blocks){
        const heading=kind==='edits'?'В конец файла '+block.file:block.target;
        const pages=deck.slides.filter(slide=>slide.stepKey===stage+':'+(Number(index)+1)&&slide.kind==='code'&&slide.heading===heading);
        assert(pages.length,heading+' must be present');
        for(const page of pages){
          const copied=deck.snippets[page.snippet]??page.code;
          assert.equal(copied.replace(/\r\n/g,'\n').trimEnd(),block.code.replace(/\r\n/g,'\n').trimEnd(),heading+' must copy the complete block from every page');
        }
      }
    }
    for(const slide of deck.slides.filter(slide=>slide.chapter!=='example'))
      for(const [,href] of slide.links??[])
        assert(!/downloads\/conference-portal-(?:php|flask)(?:-starter)?\.zip$/.test(href),'Learning presentation must teach file creation instead of downloading a project');
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
        if(url.origin!==new URL(deck.site).origin){
          assert.equal(url.protocol,'https:');
          assert(['code.visualstudio.com','update.code.visualstudio.com','git-scm.com','www.apachefriends.org','sourceforge.net','www.python.org'].includes(url.hostname),href);
          continue;
        }
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
    for(const slide of deck.slides.filter(slide=>slide.chapter!=='example'))
      for(const [,href] of slide.links??[])
        assert(!/materials\/database\/[^/]+\.sql$/.test(href),'Learning must show SQL inline instead of downloading it');
    const seed=data.sqlBlocks['materials/database/seed-'+(stack==='php'?'php':'flask')+'.sql'];
    assert([...deck.snippets,...deck.slides.filter(slide=>slide.stepKey==='database:6').map(slide=>slide.code??'')]
      .some(code=>code.replace(/\r\n/g,'\n').trimEnd()===seed.replace(/\r\n/g,'\n').trimEnd()),'The complete seed must be copyable from the presentation');
    const catalogue=deck.slides.find(slide=>slide.title==='Из каталога в таблицу rooms');
    assert.equal(catalogue.rows.length,6);
    assert(catalogue.rows.every(row=>row.length===2));
    assert.match(catalogue.rows[0][1],/auditorium.*120 мест/);
    assert(resourceLinks('database:8','materials/database/er-example.pdf'));
  }
});
