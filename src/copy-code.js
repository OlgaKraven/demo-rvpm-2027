(()=>{
  function bind(root=document){
    root.querySelectorAll('[data-copy-block]').forEach(button=>button.onclick=async()=>{
      const pre=button.closest('[data-edit-file], [data-check-code]')?.querySelector('pre');
      if(!pre)return;
      try{
        await navigator.clipboard.writeText(pre.textContent);
        button.textContent='Скопировано';
      }catch{
        button.textContent='Выделите код и нажмите Ctrl+C';
      }
    });
  }
  globalThis.CopyBlocks={bind};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>bind());
  else bind();
})();
