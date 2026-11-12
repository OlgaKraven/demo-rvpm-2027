(function (root) {
'use strict';

const E = value => root.ExamCore.escape(value);
const expandIcon = '<svg class="er-expand-icon" viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="M3 3h7v2.5H5.5V10H3zm11 0h7v7h-2.5V5.5H14zM3 14h2.5v4.5H10V21H3zm15.5 0H21v7h-7v-2.5h4.5z"/></svg>';
const closeIcon = '<svg class="er-close-icon" viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true"><path d="m6 4.6 6 6 6-6L19.4 6l-6 6 6 6-1.4 1.4-6-6-6 6L4.6 18l6-6-6-6z"/></svg>';

function mount(workspace, ctx) {
  const D = () => root.ER_GUIDE.schema;
  const er = selector => workspace.querySelector(selector);
  const all = [{kind:'intro'}, ...root.ER_GUIDE.order.flatMap(id => [
    {kind:'table',table:id},
    ...D().tables.find(table => table.id===id).fields.map(field => ({kind:'field',table:id,field:field.id}))
  ]), {kind:'finish'}];
  const saved = Number(ctx.get('er-guide-step-v1'));
  let position = Number.isInteger(saved) ? Math.max(0,Math.min(all.length-1,saved)) : 0;
  let view = ctx.get('er-guide-view-v1')==='full'?'full':'steps', infoVisible = true, observer;
  const views = {
    steps: {selection:null, zoom:1, fit:null, scroll:{left:0,top:0}},
    full: {selection:{kind:'table',table:'users'}, zoom:1, fit:null, scroll:{left:0,top:0}}
  };
  const state = () => views[view];
  const current = () => state().selection || all[position];

  function syncControls() {
    const expanded = !!workspace.closest('.er-expanded-dialog[open]');
    workspace.classList.toggle('er-is-expanded',expanded);
    er('#er-title').textContent=expanded?'Построение ER-диаграммы':'Схема и пояснения';
    const expand = er('#er-expand');
    const title = expanded?'Закрыть большую схему':'На весь экран';
    expand.setAttribute('aria-label',title);
    expand.title=title;
    if (expanded) expand.removeAttribute('aria-haspopup');
    else expand.setAttribute('aria-haspopup','dialog');

    const hidden = view==='full' && expanded && !infoVisible;
    workspace.classList.toggle('er-info-hidden',hidden);
    er('#er-info').hidden=hidden;
    const toggle=er('#er-source-toggle');
    if (toggle) {
      toggle.hidden=!expanded;
      toggle.textContent=hidden?'Показать пояснения':'Скрыть пояснения';
      toggle.setAttribute('aria-expanded',String(!hidden));
    }
  }

  function toggleExpanded() {
    const open = workspace.closest('.er-expanded-dialog[open]');
    if (open) {
      open.close();
      return;
    }
    const anchor = document.createComment('ER workspace');
    workspace.before(anchor);
    const dialog = document.createElement('dialog');
    dialog.className='er-expanded-dialog';
    dialog.setAttribute('aria-labelledby','er-title');
    dialog.append(workspace);
    document.body.append(dialog);
    dialog.addEventListener('close',() => {
      if (anchor.isConnected) anchor.replaceWith(workspace);
      dialog.remove();
      infoVisible=true;
      syncControls();
      if (workspace.isConnected) er('#er-expand').focus({preventScroll:true});
    },{once:true});
    dialog.showModal();
    syncControls();
    er('#er-expand').focus({preventScroll:true});
  }

  function availableTables() {
    if (view==='full') return D().tables;
    const visible = all.slice(0,position+1);
    return root.ER_GUIDE.order.filter(id => visible.some(step => step.table===id)).map(id => {
      const table = D().tables.find(item => item.id===id);
      return {...table, fields:table.fields.filter(field => visible.some(step => step.table===id && step.field===field.id))};
    });
  }

  function detail(){const s=current();if(s.kind==='intro')return '<h3>Документы задания 1 · ДЭ 2027</h3><p class="er-origin">КИМ '+E(root.ER_GUIDE.source.code)+'</p><p>Выберите этап построения, чтобы увидеть, из какого документа взято поле и как оно связано с другими таблицами.</p><ul class="er-source-list">'+root.ER_GUIDE.source.files.map(file=>'<li>'+sourceLink(file)+'</li>').join('')+'</ul>';
   if(s.kind==='finish')return '<h3>Сверьте свою схему</h3><ol><li>Проверьте пять таблиц и четыре внешних ключа.</li><li>Убедитесь, что reviews.application_id уникален, а rate_limits не связана с предметными таблицами.</li><li>На этапе «Создание БД и выгрузка» перенесите модель в phpMyAdmin и сохраните её в PDF.</li></ol><p>'+sourceLink({title:'Пример ER · PDF',href:'materials/database/er-example.pdf'})+'</p>';
   const table=D().tables.find(t=>t.id===s.table);
   if(s.kind==='table')return '<h3>Почему появилась таблица «'+E(table.title)+'»?</h3><blockquote>'+E(table.quote)+'</blockquote><p>'+E(table.why)+'</p><p>'+E(table.example)+'</p><p>'+E(table.extra)+'</p>'+(table.page?sourceLink({title:'КИМ · стр. '+table.page,href:'materials/kim-2027.pdf#page='+table.page}):'');
   const field=table.fields.find(item=>item.id===s.field);
   const link=D().links.find(item=>item.from===table.id&&item.field===field.id);
   const target=link&&D().tables.find(item=>item.id===link.to);
   const title=s.kind==='link'&&target
     ? table.title+' → '+target.title
     : table.title+' · '+field.title;
   const fieldName=table.id+'.'+field.id;
   const keys=[field.pk&&'PK',field.fk&&'FK',field.unique&&'UNIQUE'].filter(Boolean);
   const explanation=link?.explanation||field.why||field.location;
   return `<div class="er-element">
     <header>
       <h4>${E(title)}</h4>
       <code class="er-field-path">${E(fieldName)}</code>
     </header>
     <section class="er-detail-section er-field-explanation">
       <h5>${link?'Что связывает':'Зачем нужно поле'}</h5>
       ${!field.file&&!link?'<p class="er-origin">Решение модели</p>':''}
       ${explanation?`<p>${E(explanation.replace(/^Техническое: /,''))}</p>`:''}
     </section>
     ${field.file||field.location?`<section class="er-detail-section">
       <h5>Источник</h5>
       ${field.file?`<p>${sourceLink(field.file)}</p>`:''}
       ${field.location&&field.location!==explanation?`<p>${E(field.location)}</p>`:''}
       ${field.value&&field.value!==field.title?`<p><strong>Пример из файла</strong> <code>${E(field.value)}</code></p>`:''}
     </section>`:link&&field.why?`<section class="er-detail-section">
       <h5>Решение модели</h5>
       <p>${E(field.why.replace(/^Техническое: /,''))}</p>
     </section>`:''}
     ${link?`<section class="er-detail-section">
       <h5>Связь</h5>
       <p><code>${E(fieldName)} <wbr>→ ${E(link.to+'.'+link.target)}</code></p>
       <p>${E(link.cardinality)} · ${link.cardinality==='1 : 0..1'?'один к нулю или одному':'один ко многим'}</p>
     </section>`:''}
     <section class="er-detail-section">
       <h5>Свойства в SQL</h5>
       <dl class="er-field-properties">
         ${keys.length?`<div><dt>Ключи</dt><dd>${keys.join(' · ')}</dd></div>`:''}
         <div><dt>Тип поля</dt><dd><code>${E(field.type.split(' REF ')[0].replace(/ UNIQUE$/,''))}</code></dd></div>
         <div><dt>Значение NULL</dt><dd>${field.nullable?'Разрешено':'Запрещено'}</dd></div>
       </dl>
     </section>
   </div>`;
  }
  function sourceLink(file){return '<a href="'+E(file.href)+'" target="_blank" rel="noopener">'+E(file.title)+'</a>';}

  function keepScroll() {
    const box = er('.er-scroll');
    if (box) state().scroll = {left:box.scrollLeft,top:box.scrollTop};
  }

  function move(index, control) {
    keepScroll();
    position = Math.max(0,Math.min(all.length-1,index));
    views.steps.selection = null;
    ctx.set('er-guide-step-v1',String(position));
    render();
    const target = er(control);
    (target.disabled ? er('#er-jump') : target).focus({preventScroll:true});
  }

  function changeView(next) {
    if (next===view) return;
    keepScroll();
    view = next;
    ctx.set('er-guide-view-v1',view);
    infoVisible = true;
    render();
    er(view==='steps'?'#er-steps':'#er-full').focus({preventScroll:true});
    if (view==='full' && !workspace.classList.contains('er-is-expanded') && workspace.offsetHeight<=window.innerHeight) {
      workspace.scrollIntoView({block:'nearest',behavior:'instant'});
    }
  }

  function stepTitle(step) {
    if (!step.table) return {intro:'Источники', finish:'Сверка схемы'}[step.kind];
    const table = D().tables.find(item => item.id===step.table);
    return table.title + ' · ' + (step.field ? table.fields.find(field => field.id===step.field).title : 'добавляем таблицу');
  }

  function tableMarkup(table) {
    return `<section class="er-table" data-table="${E(table.id)}">
      <button class="er-table-title" data-select-table="${E(table.id)}">${E(table.title)}<small>${E(table.id)}</small></button>
      ${table.fields.map(field => `<button class="er-field" id="er-f-${E(table.id)}-${E(field.id)}" data-table-id="${E(table.id)}" data-field-id="${E(field.id)}">
        <span>${E((field.pk?'PK ':'')+(field.fk?'FK ':'')+field.title)}</span><small>${E(field.id)}</small>
      </button>`).join('') || '<p class="er-table-empty">Поля появятся на следующих этапах.</p>'}
    </section>`;
  }

  function focusCurrent(force=false) {
    const step = current(), scroll = er('.er-scroll');
    const node = step.field ? er('#er-f-'+step.table+'-'+step.field) : er('[data-table="'+step.table+'"] .er-table-title');
    workspace.querySelectorAll('.er-current-table').forEach(item => item.classList.remove('er-current-table'));
    if (!node) return;
    node.closest('.er-table').classList.add('er-current-table');
    const row=node.getBoundingClientRect(), box=scroll.getBoundingClientRect();
    if (!force && row.left>=box.left+12 && row.right<=box.right-12 && row.top>=box.top+12 && row.bottom<=box.bottom-12) return;
    scroll.scrollTo({
      left:scroll.scrollLeft+(row.left+row.width/2-box.left-box.width/2),
      top:scroll.scrollTop+(row.top+row.height/2-box.top-box.height/2),
      behavior:'instant'
    });
  }

  function render() {
    observer?.disconnect();
    const tables = availableTables(), isFull = view==='full';
    const links = D().links.filter(link => tables.some(table => table.id===link.from && table.fields.some(field => field.id===link.field))
      && tables.some(table => table.id===link.to && table.fields.some(field => field.id===link.target)));
    const key = tables.map(table => table.id+':'+table.fields.length).sort().join('|');
    const layout = root.ER_GUIDE.layouts[key];

    workspace.innerHTML = `
      <header class="er-head">
        <h3 id="er-title"></h3>
        <div class="er-head-actions">
          <button class="btn er-icon" id="er-expand" type="button">${expandIcon}${closeIcon}</button>
        </div>
      </header>
      <div class="er-toolbar">
        <div class="er-modes" role="group" aria-label="Вид схемы">
          <button class="btn" id="er-steps" type="button" aria-pressed="${!isFull}">Поэтапное построение</button>
          <button class="btn" id="er-full" type="button" aria-pressed="${isFull}">Готовая схема</button>
        </div>
        ${isFull?'<button class="btn" type="button" id="er-source-toggle" aria-controls="er-info" hidden></button>':''}
      </div>
      ${isFull?'':`<div class="er-step-bar">
          <div class="er-step-picker">
            <label for="er-jump">Этап построения</label>
            <select id="er-jump">${all.map((step,index) => `<option value="${index}" ${index===position?'selected':''}>${E((index+1)+'. '+stepTitle(step))}</option>`).join('')}</select>
          </div>
          <div class="er-step-navigation" role="group" aria-label="Переключение этапов построения">
            <button class="btn" type="button" id="er-prev" aria-label="Предыдущий этап построения" ${position===0?'disabled':''}>←</button>
            <span aria-live="polite">${position+1} из ${all.length}</span>
            <button class="btn primary" type="button" id="er-next" aria-label="Следующий этап построения" ${position===all.length-1?'disabled':''}>→</button>
          </div>
        </div>`}
      <div class="er-zoom" role="group" aria-label="Масштаб схемы" ${!layout?'hidden':''}>
        <button class="btn" type="button" id="er-smaller" aria-label="Уменьшить схему" ${!layout?'disabled':''}>−</button>
        <button class="btn" type="button" id="er-scale" aria-label="Вернуть масштаб 100 процентов" title="Вернуть масштаб 100%">100%</button>
        <button class="btn" type="button" id="er-larger" aria-label="Увеличить схему" ${!layout?'disabled':''}>+</button>
        <button class="btn" type="button" id="er-fit" ${!layout?'disabled':''}>По ширине</button>
        <button class="btn" type="button" id="er-overview" ${!layout?'disabled':''}>Вся схема</button>
        <button class="btn" type="button" id="er-focus" ${!layout?'disabled':''}>К элементу</button>
      </div>
      <div class="er-body">
        <div class="er-diagram">
          <div class="er-scroll" role="region" aria-label="Диаграмма. Прокручивается по горизонтали и вертикали" tabindex="0" ${!layout?'data-empty':''}>
            <div class="er-canvas" style="${layout?`width:${layout.width}px;height:${layout.height}px`:''}">
              ${tables.length ? tables.map(tableMarkup).join('') : '<p class="er-empty">Перейдите к следующему этапу построения, чтобы добавить первую таблицу.</p>'}
              <svg class="er-wires" aria-label="Стрелки внешних ключей"></svg>
            </div>
          </div>
        </div>
        <aside class="er-info" id="er-info" aria-label="Пояснения к схеме">
          <div class="er-explanation" aria-live="polite"></div>
        </aside>
      </div>`;

    const canvas=er('.er-canvas'), scroll=er('.er-scroll');
    for (const node of layout?.nodes || []) {
      const table=er('[data-table="'+node.id+'"]');
      Object.assign(table.style,{left:node.x+'px',top:node.y+'px',width:node.width+'px'});
    }

    function select(element) {
      state().selection = element;
      infoVisible = true;
      syncControls();
      renderPanel();
      draw(layout,links,select);
      focusCurrent();
    }

    function renderPanel() {
      const body=er('.er-explanation');
      body.innerHTML=detail();
      body.scrollTop=0;
    }

    function applyZoom(restore=false) {
      if (!canvas.isConnected || !layout || !scroll.clientWidth) return;
      const settings=state();
      const widthFit=Math.max(.05,(scroll.clientWidth-16)/layout.width);
      const heightFit=Math.max(.05,(scroll.clientHeight-16)/layout.height);
      if (settings.fit==='overview') settings.zoom=Math.min(1,widthFit,heightFit);
      if (settings.fit==='width') settings.zoom=Math.min(1,widthFit);
      canvas.style.zoom=String(settings.zoom);
      er('#er-scale').textContent=Math.round(settings.zoom*100)+'%';
      if (restore) scroll.scrollTo(settings.scroll.left,settings.scroll.top);
      if (settings.fit==='overview') scroll.scrollTo(0,0);
      else if (restore || settings.fit) focusCurrent();
    }

    function setZoom(zoom,fit=null) {
      Object.assign(state(),{zoom,fit});
      applyZoom();
    }

    er('#er-expand').onclick=toggleExpanded;
    er('#er-steps').onclick=() => changeView('steps');
    er('#er-full').onclick=() => changeView('full');
    if (isFull) er('#er-source-toggle').onclick=() => {infoVisible=!infoVisible;syncControls();};
    else {
      er('#er-prev').onclick=() => move(position-1,'#er-prev');
      er('#er-next').onclick=() => move(position+1,'#er-next');
      er('#er-jump').onchange=event => move(Number(event.target.value),'#er-jump');
    }
    er('#er-smaller').onclick=() => setZoom(Math.max(.05,state().zoom-.1));
    er('#er-larger').onclick=() => setZoom(Math.min(1.6,state().zoom+.1));
    er('#er-scale').onclick=() => setZoom(1);
    er('#er-fit').onclick=() => setZoom(1,'width');
    er('#er-overview').onclick=() => setZoom(1,'overview');
    er('#er-focus').onclick=() => {setZoom(1);focusCurrent(true);};
    workspace.querySelectorAll('[data-select-table]').forEach(button => button.onclick=() => select({kind:'table',table:button.dataset.selectTable}));
    workspace.querySelectorAll('[data-field-id]').forEach(button => button.onclick=() => select({kind:'field',table:button.dataset.tableId,field:button.dataset.fieldId}));
    syncControls();
    renderPanel();
    draw(layout,links,select);
    requestAnimationFrame(() => applyZoom(true));
    observer=new ResizeObserver(() => {if (state().fit) applyZoom();});
    observer.observe(scroll);
  }

  function draw(layout, links, select) {
    const step=current(), svg=er('.er-wires');
    svg.replaceChildren();
    workspace.querySelectorAll('.er-field').forEach(button => button.classList.toggle('selected',button.dataset.tableId===step.table && button.dataset.fieldId===step.field));
    if (!layout) return;
    const ns='http://www.w3.org/2000/svg';
    const svgNode=(name, attributes={}) => {
      const node=document.createElementNS(ns,name);
      for (const [attribute,value] of Object.entries(attributes)) node.setAttribute(attribute,value);
      return node;
    };
    svg.setAttribute('viewBox','0 0 '+layout.width+' '+layout.height);
    const defs=svgNode('defs'), marker=svgNode('marker',{id:'er-arrow',viewBox:'0 0 8 8',refX:8,refY:4,markerWidth:7,markerHeight:7,orient:'auto'});
    marker.append(svgNode('path',{d:'M0 0L8 4L0 8Z',fill:'var(--red)'}));
    defs.append(marker);
    svg.append(defs);
    const labelledParents=new Set();
    for (const link of links) {
      const edge=layout.edges.find(item => item.id===link.from+'.'+link.field);
      if (!edge) continue;
      const chosen=step.table===link.from && step.field===link.field;
      if (chosen) {
        er('#er-f-'+link.from+'-'+link.field)?.classList.add('selected');
        er('#er-f-'+link.to+'-'+link.target)?.classList.add('selected');
      }
      for (const section of edge.sections) {
        const points=[section.startPoint,...(section.bendPoints||[]),section.endPoint].reverse();
        const path=svgNode('path',{d:points.map((point,index) => (index?'L':'M')+point.x+' '+point.y).join(' '),class:'er-wire'+(chosen?' selected':''),'data-er-link':link.from+'.'+link.field,'marker-end':'url(#er-arrow)'});
        path.onclick=() => select({kind:'link',table:link.from,field:link.field});
        const title=svgNode('title');
        title.textContent=link.from+'.'+link.field+' → '+link.to+'.'+link.target+' · '+link.cardinality;
        path.append(title);
        svg.append(path);
        const parent=section.startPoint, child=section.endPoint;
        for (const [key,x,y,text] of [[link.from+'.'+link.field,child.x-18,child.y-7,link.cardinality==='1 : 0..1'?'0..1':'N'],[link.to+'.'+link.target,parent.x+5,parent.y-7,'1']]) {
          if (text==='1' && labelledParents.has(key)) continue;
          if (text==='1') labelledParents.add(key);
          const label=svgNode('text',{class:'er-cardinality',x,y});
          label.textContent=text;
          svg.append(label);
        }
      }
    }
  }

  render();
  return ()=>{
    workspace.closest('.er-expanded-dialog[open]')?.close();
    observer?.disconnect();
  };
}
root.ExamErGuide={mount};
})(globalThis);
