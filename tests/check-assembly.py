"""Reconstruct the student archive using the actual lesson instructions, then test it."""
from pathlib import Path
import json,os,re,subprocess,sys,tempfile,zipfile
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'site/content.js').read_text(encoding='utf-8').removeprefix('globalThis.COURSE=').removesuffix(';'))
with tempfile.TemporaryDirectory(prefix='rvpm-assembly-') as folder:
    path=Path(folder)
    with zipfile.ZipFile(root/'site/downloads/conference-portal-flask-starter.zip') as archive:
        archive.extractall(path)
    env={**os.environ,'DB_BACKEND':'sqlite'}
    env.pop('PORTAL_TEST_MYSQL',None)
    subprocess.run([sys.executable,'-c','from app import create_app; a=create_app(); r=a.test_client().get("/"); assert r.status_code==200; assert "Учебный каркас" in r.get_data(as_text=True)'],cwd=path,env=env,check=True)
    app=(path/'app.py').read_text(encoding='utf-8')
    for lesson in data['assembly']:
        for block in lesson['blocks']:
            target=path/block['file']
            if block['file']=='app.py':
                name=re.search(r'# BEGIN (\w+)',block['where'])[1]
                a=app.index('# BEGIN '+name); b=app.index('# END '+name,a)+len('# END '+name)
                app=app[:a]+block['text']+app[b:]
                (path/'app.py').write_text(app,encoding='utf-8')
            else:
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_text(block['text'],encoding='utf-8')
    subprocess.run([sys.executable,'-m','pytest','-q'],cwd=path,env=env,check=True)
print('Starter launches; all lesson blocks reconstruct a passing application.')
