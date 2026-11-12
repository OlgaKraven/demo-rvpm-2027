import {writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {chromium} from 'playwright';

const root = resolve('site');
const origin = 'http://rvpm.local';
const files = {php:'presentation-rvpm-php.pdf',mysql:'presentation-rvpm-flask.pdf'};
const executablePath = process.env.RVPM_CHROME;
const browser = await chromium.launch(executablePath?{executablePath}:{});
const outputs = [];

try {
  for(const [stack,name] of Object.entries(files)){
    const page = await browser.newPage({viewport:{width:1280,height:720}});
    try {
      await page.route('**/*',async route=>{
        const url = new URL(route.request().url());
        if(url.origin!==origin)return route.abort();
        const filename = resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
        if(!filename.startsWith(root+sep))return route.abort();
        await route.fulfill({path:filename});
      });
      await page.emulateMedia({media:'print'});
      const response = await page.goto(origin+'/?presentation=pdf&stack='+stack,{waitUntil:'domcontentloaded'});
      if(!response.ok())throw new Error('Could not open '+stack+' presentation');
      await page.waitForFunction(()=>globalThis.RvpmPdf!==undefined);
      const layout = await page.evaluate(()=>globalThis.RvpmPdf);
      if(!layout.pages||layout.overflow.length)throw new Error(stack+': '+JSON.stringify(layout));
      const pdf = await page.pdf({preferCSSPageSize:true,printBackground:true,tagged:true});
      outputs.push({name,pdf});
      console.log(name+': '+layout.pages+' pages');
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

for(const {name,pdf} of outputs)await writeFile(resolve(root,'downloads',name),pdf);
