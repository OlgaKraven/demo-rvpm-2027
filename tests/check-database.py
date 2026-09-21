"""Local MySQL check of the downloadable schema and stack-specific seed files."""
from pathlib import Path
import os,subprocess,uuid
import pymysql
from werkzeug.security import check_password_hash
root=Path(__file__).resolve().parents[1]
connection=pymysql.connect(host='127.0.0.1',user='root',password=os.environ.get('MYSQL_PASSWORD',''),charset='utf8mb4',autocommit=True)
for stack in ('flask','php'):
    name='rvpm_material_'+uuid.uuid4().hex[:12]
    try:
        with connection.cursor() as cursor:
            cursor.execute(f'CREATE DATABASE `{name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
            connection.select_db(name)
            for path in [root/'examples/conference-portal-php/schema.sql',root/f'materials/database/seed-{stack}.sql']:
                for sql in path.read_text(encoding='utf-8').split(';'):
                    if sql.strip():cursor.execute(sql)
            cursor.execute('SELECT COUNT(*) FROM rooms');assert cursor.fetchone()[0]==6
            cursor.execute("SELECT password_hash FROM users WHERE username='Conf2027'");hashed=cursor.fetchone()[0]
            if stack=='flask':assert check_password_hash(hashed,'Demo77')
            else:subprocess.run(['C:/xampp/php/php.exe','-r','exit(password_verify("Demo77",getenv("VERIFY_HASH"))?0:1);'],env={**os.environ,'VERIFY_HASH':hashed},check=True)
    finally:
        with connection.cursor() as cursor:cursor.execute(f'DROP DATABASE IF EXISTS `{name}`')
connection.close()
print('Both downloadable seed files create 6 rooms and a valid stack-specific administrator.')
