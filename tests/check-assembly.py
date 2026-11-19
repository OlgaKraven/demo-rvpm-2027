"""Compose lesson files in an empty folder; CI uses temporary SQLite fixtures.

The MariaDB/phpMyAdmin student walkthrough is documented separately.
"""
from pathlib import Path
import json,os,re,socket,subprocess,sys,tempfile,time,zipfile
from urllib.request import urlopen
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'site/content.js').read_text(encoding='utf-8').removeprefix('globalThis.COURSE=').removesuffix(';'))
for stack,label,style,script in [
    ('php','php','static/style.css','static/app.js'),
    ('mysql','flask','static/css/style.css','static/js/app.js')
]:
    assert '--primary' not in data['setupFiles'][stack][style]
    edits=data['studentEdits'][stack]
    assert '--primary' in edits['design']['0'][0]['code']
    assert 'Отправка' in edits['interaction']['1'][1]['code']
    for stage in edits.values():
        for step in stage.values():
            for edit in step:
                assert edit['file'] in (style,script)

with tempfile.TemporaryDirectory(prefix='rvpm-assembly-') as folder:
    path=Path(folder)
    def write(file,text):
        target=path/file
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(text,encoding='utf-8')
    for file,text in data['setupFiles']['mysql'].items():write(file,text)
    write('static/js/app.js','')
    with zipfile.ZipFile(root/'site/downloads/portal-assets.zip') as archive:archive.extractall(path)
    # The CI harness supplies these SQLite fixtures and regression tests.
    for file in ['schema.sql','rooms.json','tests/test_app.py']:write(file,data['code'][file])
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
    for stage in data['studentEdits']['mysql'].values():
        for step in stage.values():
            for edit in step:
                with (path/edit['file']).open('a',encoding='utf-8') as file:
                    file.write('\n'+edit['code']+'\n')
    subprocess.run([sys.executable,'-m','pytest','-q','tests/test_app.py'],cwd=path,env=env,check=True)
    with socket.socket() as connection:
        connection.bind(('127.0.0.1',0))
        port=connection.getsockname()[1]
    server=subprocess.Popen([sys.executable,'-m','flask','--app','app','run','--host','127.0.0.1','--port',str(port)],cwd=path,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        address=f'http://127.0.0.1:{port}'
        deadline=time.monotonic()+20
        while True:
            try:
                with urlopen(address,timeout=1) as response:assert response.status==200
                break
            except OSError:
                if server.poll() is not None or time.monotonic()>deadline:raise
                time.sleep(.1)
        subprocess.run([sys.executable,'-m','pytest','-q','tests/test_portal.py'],cwd=path,env={**env,'PORTAL_TEST_URL':address},check=True)
    finally:
        server.terminate()
        try:server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
            server.wait()
print('Files composed from learning snippets; SQLite regression and live HTTP checks pass.')
