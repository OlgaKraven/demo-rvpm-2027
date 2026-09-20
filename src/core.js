/* Shared pure functions. No network, tracking, file input or student submissions. */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';
  const escape = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
  const timerKey = (c, y, variant, scope, mode) => ['deprep', VERSION, c.id, y.year, y.documentCode || 'pending', y.contentVersion, variant, scope, mode].join(':');
  function freshTimer(seconds, mode, now = Date.now()) {
    assert(Number.isInteger(seconds) && seconds > 0, 'Продолжительность не подтверждена');
    return {version:1, durationMs:seconds*1000, mode, status:'idle', elapsedMs:0, anchorMs:null, lastSeenMs:now, assisted:false};
  }
  function elapsed(s, now = Date.now()) {
    const ongoing = s.status === 'running' ? Math.max(0, now - s.anchorMs) : 0;
    return Math.max(0, s.elapsedMs + ongoing);
  }
  function timerView(s, now = Date.now()) {
    const used = elapsed(s, now);
    return {used, left:Math.max(0, s.durationMs-used), over:Math.max(0, used-s.durationMs),
      expired:used >= s.durationMs, progress:Math.min(1, used/s.durationMs), clockChanged:s.clockChanged===true||now < s.lastSeenMs - 2000};
  }
  function checkpoint(s, now=Date.now()) {
    return {...s,elapsedMs:elapsed(s,now),anchorMs:s.status==='running'?now:null,lastSeenMs:now,clockChanged:s.clockChanged===true||now<s.lastSeenMs-2000};
  }
  function transition(s, action, now = Date.now()) {
    const n = {...s, lastSeenMs:now};
    if (action === 'start' && (s.status === 'idle' || s.status === 'paused')) {
      n.status='running'; n.anchorMs=now;
    } else if (action === 'pause' && s.status === 'running') {
      assert(s.mode !== 'mock', 'В пробном экзамене пауза не предусмотрена');
      n.elapsedMs=elapsed(s,now); n.anchorMs=null; n.status='paused';
    } else if (action === 'finish' && s.status !== 'finished') {
      n.elapsedMs=elapsed(s,now); n.anchorMs=null; n.status='finished';
    } else if (action === 'assisted') n.assisted=true;
    return n;
  }
  function format(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    return [Math.floor(sec/3600), Math.floor(sec%3600/60), sec%60].map(x=>String(x).padStart(2,'0')).join(':');
  }
  function restoreTimer(raw, seconds, mode) {
    try {
      const s=JSON.parse(raw);
      assert(s && s.version===1 && s.durationMs===seconds*1000 && s.mode===mode, 'Версия таймера');
      assert(['idle','running','paused','finished'].includes(s.status), 'Состояние');
      assert(Number.isFinite(s.elapsedMs)&&s.elapsedMs>=0&&Number.isFinite(s.lastSeenMs),'Числа');
      assert(s.status!=='running'||Number.isFinite(s.anchorMs),'Начало отсчёта');
      assert(!(mode==='mock'&&s.status==='paused'),'Недопустимая пауза');
      return s;
    } catch { return freshTimer(seconds,mode); }
  }
  function validateCourse(c, examReady=false) {
    assert(c.schemaVersion===1 && c.id && c.specialty==='09.02.07', 'Неверный паспорт');
    assert(Array.isArray(c.years)&&c.years.length,'Нет редакций');
    assert(c.variants.length===30,'Нужно ровно 30 тренировочных вариантов');
    const ids=new Set();
    for (const v of c.variants) {
      assert(/^V(0[1-9]|[12][0-9]|30)$/.test(v.id)&&!ids.has(v.id),'Неверный ID варианта');
      ids.add(v.id); assert(v.domain&&v.items.length===c.variantShape.itemCount,'Нарушена форма варианта');
      assert(v.items.every(x=>typeof x==='string'&&x.length>1),'Пустой предметный объект');
    }
    assert(c.example.id==='V00','Образец не входит в 30 вариантов');
    for (const y of c.years) {
      assert(y.level==='basic','В этой поставке только базовый уровень');
      if (y.status==='pending') {
        assert(y.modules.length===0 && y.totalSeconds===null,'Нельзя наследовать неподтверждённый норматив');
        continue;
      }
      assert(y.documentCode&&y.source.url&&y.source.timingPage,'Нет источника времени');
      assert(y.modules.length>0,'Нет модулей');
      assert(y.modules.every(m=>Number.isInteger(m.durationSeconds)&&m.durationSeconds>0),'Нет норматива модуля');
      assert(y.modules.reduce((s,m)=>s+m.durationSeconds,0)===y.totalSeconds,'Сумма времени не совпадает');
      const mi=new Set(y.modules.map(m=>m.id)); assert(mi.size===y.modules.length,'Повтор модуля');
      if(y.exercise)assert(mi.has(y.exercise.moduleId),'Пример ссылается на неизвестный модуль');
        else assert(y.status==='passport','Нет учебного примера');
        if(y.assessment)assert(y.assessment.criteria.reduce((s,r)=>s+r.points,0)===y.assessment.maxPoints,'Сумма баллов не совпадает');
      if(y.practice?.ready){
          assert(y.practice.kind==='published-sample','Неизвестный вид пробного комплекта');
          assert(y.practice.tasks.length===y.modules.length,'Неполный образец');
          assert(y.practice.tasks.every((t,i)=>t.id===y.modules[i].id&&t.seconds===y.modules[i].durationSeconds&&t.text.length>100&&t.zip&&t.page),'Неполное задание образца');
          assert(y.practice.zip,'Нет комплекта образца');
        }
      if(examReady) {
        assert(y.completeCourse===true,'Не подключён полный комплект курса: '+c.id+' / '+y.year);
        assert(y.sourceAttachmentsVerified===true,'Не сверены исходные приложения');
        assert(y.modules.every(m=>m.ready && m.taskText && m.solutionReady),'Не все модули готовы');
      }
    }
    return true;
  }
  const enc = new TextEncoder();
  const crcTable = Array.from({length:256},(_,n)=>{let v=n;for(let k=0;k<8;k++)v=(v&1)?(0xedb88320^(v>>>1)):(v>>>1);return v>>>0;});
  function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function zip(files) {
    // STORE method, UTF-8 names, deterministic metadata. Suitable for small static training packages.
    const local=[],central=[]; let offset=0,count=0;
    const u16=(v,p,x)=>v.setUint16(p,x,true),u32=(v,p,x)=>v.setUint32(p,x,true);
    for (const [path,content] of Object.entries(files).sort(([a],[b])=>a.localeCompare(b,'en'))) {
      assert(path && !path.startsWith('/') && !path.split('/').includes('..') && !path.includes('\\'),'Небезопасный путь');
      const name=enc.encode(path), body=content instanceof Uint8Array?content:enc.encode(content), crc=crc32(body);
      const h=new Uint8Array(30+name.length),v=new DataView(h.buffer);
      u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u16(v,12,33);u32(v,14,crc);u32(v,18,body.length);u32(v,22,body.length);u16(v,26,name.length);h.set(name,30);
      const ch=new Uint8Array(46+name.length),cv=new DataView(ch.buffer);
      u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x800);u16(cv,14,33);u32(cv,16,crc);u32(cv,20,body.length);u32(cv,24,body.length);u16(cv,28,name.length);u32(cv,42,offset);ch.set(name,46);
      local.push(h,body);central.push(ch);offset+=h.length+body.length;count++;
    }
    const csize=central.reduce((s,a)=>s+a.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
    u32(ev,0,0x06054b50);u16(ev,8,count);u16(ev,10,count);u32(ev,12,csize);u32(ev,16,offset);
    const parts=[...local,...central,end],out=new Uint8Array(parts.reduce((s,a)=>s+a.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;
  }
  const csv = rows => '\ufeff'+rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n')+'\r\n';
  root.ExamCore=Object.freeze({VERSION,escape,assert,timerKey,freshTimer,elapsed,timerView,checkpoint,transition,format,restoreTimer,validateCourse,zip,csv});
})(globalThis);
