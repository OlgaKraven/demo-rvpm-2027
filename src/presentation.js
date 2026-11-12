(() => {
  'use strict';

  const escape = ExamCore.escape;
  const channelName = id => 'rvpm-2027-presentation:'+id;
  const stackName = stack => stack==='php'?'PHP + MySQL':'Flask + MySQL';

  function slideMarkup(slide, number, total, stack, continued=false) {
    const cover = number===1;
    const visual = slide.image || slide.diagram || slide.code;
    const profile = slide.profile || [];
    const description = cover
      ? profile.length ? `<aside class="presentation-profile"><strong>Преподаватель</strong>${profile.map(line=>`<p>${escape(line)}</p>`).join('')}</aside>` : ''
      : slide.comment ? `<aside class="presentation-comment">${escape(slide.comment)}</aside>` : '';
    return `<article class="presentation-slide${cover?' presentation-cover':''}">
      <header class="presentation-slide-header">
        ${cover?'<img class="presentation-wordmark" src="presentation-wordmark.jpg" alt="Университет Синергия">':''}
        <span>ДЭ 2027 · ${stackName(stack)}</span>
        ${cover?'':'<img src="presentation-mark.png" alt="" width="30" height="30">'}
      </header>
      <h1 class="presentation-slide-title">${escape(slide.title)}${continued?' · продолжение':''}</h1>
      <div class="presentation-slide-content${visual?' has-visual':''}">
        ${visual?`<div class="presentation-slide-visual">${slide.image?`<img src="${escape(slide.image)}" alt="${escape(slide.text)}">`:slide.diagram||`<pre tabindex="0" aria-label="Фрагмент кода">${escape(slide.code)}</pre>`}</div>`:''}
        <div class="presentation-slide-copy">${slide.text&&!slide.image?`<p>${escape(slide.text)}</p>`:''}${slide.image&&slide.text?`<p class="presentation-caption">${escape(slide.text)}</p>`:''}${description}</div>
        ${cover?'<img class="presentation-cover-mascot" src="mascot-scientist.png" alt="Носорог-учёный">':''}
      </div>
      <footer class="presentation-slide-footer">${number} / ${total}</footer>
    </article>`;
  }

  function pointerAt(point, surface, position) {
    point.hidden = !position;
    if(!position)return;
    const bounds = surface.getBoundingClientRect();
    point.style.left = bounds.left+position.x*bounds.width+'px';
    point.style.top = bounds.top+position.y*bounds.height+'px';
  }

  function openPresenter({root, slides, stack, profile, dark}) {
    const previous = document.activeElement;
    const frame = document.createElement('section');
    frame.className = 'presentation-controller';
    frame.setAttribute('role','dialog');
    frame.setAttribute('aria-modal','true');
    frame.setAttribute('aria-label','Презентация');
    frame.tabIndex = -1;
    frame.innerHTML = `<header class="presentation-toolbar">
      <span class="presentation-stack">${stackName(stack)}</span>
      <button type="button" class="btn" id="deck-theme" aria-pressed="${dark}">Тёмная тема</button>
      <button type="button" class="btn" id="deck-laser" aria-pressed="false">Указка</button>
      <button type="button" class="btn" id="deck-full">Во весь экран</button>
      <button type="button" class="btn" id="deck-close">Закрыть</button>
      <button type="button" class="btn primary" id="deck-audience">Режим показа</button>
    </header>
    <div class="presentation-viewport"><div class="presentation-stage"></div></div>
    <div class="presentation-navigation">
      <button type="button" class="btn" id="slide-prev" aria-label="Предыдущий слайд">←</button>
      <output class="presentation-count" aria-live="polite"></output>
      <button type="button" class="btn" id="slide-next" aria-label="Следующий слайд">→</button>
      <p class="presentation-status" role="status"></p>
    </div>
    <span class="presentation-pointer" hidden aria-hidden="true"></span>`;
    root.inert = true;
    document.body.classList.add('presenting');
    document.body.append(frame);

    const find = selector => frame.querySelector(selector);
    const stage = find('.presentation-stage');
    const point = find('.presentation-pointer');
    const show = find('#deck-audience');
    const status = find('.presentation-status');
    const prev = find('#slide-prev');
    const next = find('#slide-next');
    const laserButton = find('#deck-laser');
    let index = 0;
    let target;
    let channel;
    let watchWindow;
    let laser = false;
    let position = null;

    function sync() {
      channel?.postMessage({kind:'state',index,dark,profile,position});
    }
    function showPointer(value) {
      position = value;
      pointerAt(point,stage,value);
      channel?.postMessage({kind:'pointer',position:value});
    }
    function draw() {
      stage.innerHTML = slideMarkup(slides[index],index+1,slides.length,stack);
      find('.presentation-count').textContent = `${index+1} / ${slides.length}`;
      prev.disabled = index===0;
      next.disabled = index===slides.length-1;
      if(document.activeElement===prev&&prev.disabled)next.focus({preventScroll:true});
      if(document.activeElement===next&&next.disabled)prev.focus({preventScroll:true});
      showPointer(null);
      sync();
    }
    function move(offset) {
      const destination = Math.max(0,Math.min(slides.length-1,index+offset));
      if(destination===index)return;
      index = destination;
      draw();
    }
    function stop(message='') {
      clearInterval(watchWindow);
      channel?.postMessage({kind:'stop'});
      channel?.close();
      if(target&&!target.closed)target.close();
      target = channel = undefined;
      show.textContent = 'Режим показа';
      status.textContent = message;
    }
    function openAudience() {
      if(target&&!target.closed){stop('Показ завершён.');return;}
      stop();
      if(!('BroadcastChannel' in window)){
        status.textContent = 'В этом браузере синхронизация окон недоступна.';
        return;
      }
      const id = Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');
      const url = new URL(location.pathname,location.href);
      url.search = new URLSearchParams({presentation:'audience',stack,session:id});
      channel = new BroadcastChannel(channelName(id));
      channel.onmessage = ({data}) => { if(data?.kind==='sync')sync(); };
      target = window.open(url,'_blank','popup,width=1152,height=648');
      if(!target){stop('Разрешите всплывающие окна для курса и откройте показ снова.');return;}
      show.textContent = 'Завершить показ';
      status.textContent = 'Окно аудитории открыто.';
      watchWindow = setInterval(()=>{if(target?.closed)stop('Окно аудитории закрыто.');},500);
    }
    function close() {
      stop();
      window.removeEventListener('pagehide',closeWindow);
      document.removeEventListener('keydown',keys);
      if(document.fullscreenElement===frame)document.exitFullscreen().catch(()=>{});
      frame.remove();
      root.inert = false;
      document.body.classList.remove('presenting');
      previous?.focus();
    }
    function keys(event) {
      if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest?.('pre'))return;
      if(event.key==='Escape'){event.preventDefault();close();return;}
      const forward = ['ArrowRight','PageDown'].includes(event.key) || (event.key===' '&&!event.target.closest?.('button'));
      if(forward||['ArrowLeft','PageUp'].includes(event.key)){
        event.preventDefault();
        move(forward?1:-1);
      }
      if(event.key==='Home'||event.key==='End'){
        event.preventDefault();
        move(event.key==='Home'?-index:slides.length-1-index);
      }
      if(event.key!=='Tab')return;
      const buttons = [...frame.querySelectorAll('button:not(:disabled),pre[tabindex]')];
      if(event.shiftKey&&[frame,buttons[0]].includes(document.activeElement)){
        event.preventDefault();
        buttons.at(-1).focus();
      } else if(!event.shiftKey&&document.activeElement===buttons.at(-1)){
        event.preventDefault();
        buttons[0].focus();
      }
    }

    function closeWindow(){stop();}

    frame.classList.toggle('dark',dark);
    const theme = find('#deck-theme');
    theme.onclick = () => {
      dark = !dark;
      frame.classList.toggle('dark',dark);
      theme.setAttribute('aria-pressed',dark);
      sync();
    };
    show.onclick = openAudience;
    find('#deck-close').onclick = close;
    find('#deck-full').onclick = async () => {
      try {
        if(document.fullscreenElement===frame)await document.exitFullscreen();
        else await frame.requestFullscreen();
      } catch { status.textContent='Браузер не открыл полноэкранный режим.'; }
    };
    prev.onclick = () => move(-1);
    next.onclick = () => move(1);
    laserButton.onclick = () => {
      laser = !laser;
      laserButton.setAttribute('aria-pressed',laser);
      if(!laser)showPointer(null);
    };
    stage.onpointermove = event => {
      if(!laser)return;
      const bounds = stage.getBoundingClientRect();
      showPointer({x:(event.clientX-bounds.left)/bounds.width,y:(event.clientY-bounds.top)/bounds.height});
    };
    stage.onpointerleave = () => { if(laser)showPointer(null); };
    window.addEventListener('pagehide',closeWindow);
    document.addEventListener('keydown',keys);
    draw();
    frame.focus();
  }

  function openAudience({root, slides, stack, session}) {
    document.body.classList.add('presentation-view');
    root.innerHTML = '<main class="presentation-audience"><p role="status">Подключение к показу…</p></main><span class="presentation-pointer" hidden aria-hidden="true"></span>';
    const stage = root.querySelector('.presentation-audience');
    const point = root.querySelector('.presentation-pointer');
    if(!/^[0-9a-f]{32}$/.test(session||'')||!('BroadcastChannel' in window)){
      stage.querySelector('p').textContent = 'Откройте окно через кнопку «Режим показа».';
      return;
    }
    const channel = new BroadcastChannel(channelName(session));
    channel.onmessage = ({data}) => {
      if(data?.kind==='state'&&Number.isInteger(data.index)&&slides[data.index]){
        const profile = Array.isArray(data.profile)?data.profile.filter(item=>typeof item==='string').slice(0,3):[];
        document.body.classList.toggle('dark',data.dark===true);
        stage.innerHTML = slideMarkup({...slides[data.index],profile},data.index+1,slides.length,stack);
        stage.querySelector('pre')?.removeAttribute('tabindex');
        pointerAt(point,stage,data.position);
      }
      if(data?.kind==='pointer')pointerAt(point,stage,data.position);
      if(data?.kind==='stop'){
        channel.close();
        point.hidden = true;
        stage.innerHTML = '<p role="status">Показ завершён.</p>';
        window.close();
      }
    };
    window.addEventListener('pagehide',()=>channel.close(),{once:true});
    channel.postMessage({kind:'sync'});
  }

  async function renderPdf({root, slides, stack}) {
    document.body.classList.add('presentation-print');
    document.title = 'Демонстрационный экзамен 2027 · '+stackName(stack);
    await document.fonts.load('700 32px Raleway');
    const pages = [];
    function appendPage(slide, index, continued) {
      root.insertAdjacentHTML('beforeend',slideMarkup(slide,index+1,slides.length,stack,continued));
      const page = root.lastElementChild;
      pages.push(page);
      return page;
    }
    for(const [index,slide] of slides.entries()) {
      let code = slide.code;
      let continued = false;
      let companion;
      do {
        const page = appendPage({...slide,code,comment:companion?'':slide.comment},index,continued);
        const copy = page.querySelector('.presentation-slide-copy');
        if(!continued&&slide.comment&&copy.scrollHeight>copy.clientHeight+2) {
          copy.querySelector('.presentation-comment').remove();
          companion = {title:slide.title,text:slide.comment};
        }
        if(!code)break;
        const pre = page.querySelector('pre');
        if(pre.scrollHeight<=pre.clientHeight+1)break;
        let low = 1;
        let high = code.length-1;
        while(low<high){
          const middle = Math.ceil((low+high)/2);
          pre.textContent = code.slice(0,middle);
          if(pre.scrollHeight<=pre.clientHeight+1)low = middle;
          else high = middle-1;
        }
        const lineEnd = code.lastIndexOf('\n',low-1)+1;
        const end = lineEnd>low*0.6?lineEnd:low;
        pre.textContent = code.slice(0,end);
        code = code.slice(end);
        continued = true;
      } while(code);
      if(companion)appendPage(companion,index,true);
    }
    for(const [index,page] of pages.entries())page.querySelector('footer').textContent = `${index+1} / ${pages.length}`;
    await Promise.all([...root.querySelectorAll('img')].map(img=>img.decode()));
    const overflow = [];
    for(const [index,page] of pages.entries()){
      const zones = page.querySelectorAll('.presentation-slide-copy, pre, .presentation-slide-visual');
      for(const zone of zones){
        if(zone.scrollHeight>zone.clientHeight+2||zone.scrollWidth>zone.clientWidth+2){
          overflow.push({page:index+1,title:page.querySelector('h1').textContent,zone:zone.className||zone.tagName,
            width:zone.scrollWidth-zone.clientWidth,height:zone.scrollHeight-zone.clientHeight});
        }
      }
    }
    return {pages:pages.length,overflow};
  }

  globalThis.RvpmPresentation = {openPresenter,openAudience,renderPdf};
})();
