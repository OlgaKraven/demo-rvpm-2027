const catalogueCheck = `SELECT id, name, capacity
FROM rooms ORDER BY id;`;

const tablesCheck = 'SHOW TABLES;';
const foreignKeysCheck = `SELECT TABLE_NAME, COLUMN_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;`;

const registrationCheck = `SELECT username, full_name, email, is_admin
FROM users
WHERE username = 'student27';`;

const bookingCheck = `SELECT a.id, u.username, r.name AS room,
       a.event_date, a.start_time, a.attendees, a.payment_method, a.status
FROM applications AS a
JOIN users AS u ON u.id = a.user_id
JOIN rooms AS r ON r.id = a.room_id
WHERE u.username = 'student27'
  AND a.conference_name = 'Учебная конференция'
ORDER BY a.id DESC;`;

const reviewCheck = `SELECT a.id, a.status, r.rating, r.comment
FROM applications AS a
JOIN users AS u ON u.id = a.user_id
LEFT JOIN reviews AS r ON r.application_id = a.id
WHERE u.username = 'student27'
  AND a.conference_name = 'Учебная конференция'
ORDER BY a.id DESC;`;

const sql = (instruction,code)=>({
  target:'Учебная база → phpMyAdmin → SQL',
  instruction,
  code
});

export function databaseCheckpoints(stack) {
  const name=stack==='php'?'conference_php_2027':'conference_rvpm_2027';
  return {
    0:[{target:'Главная phpMyAdmin → SQL',instruction:'Вставьте запрос и нажмите «Вперёд». В результате видна версия MariaDB или MySQL.',code:'SELECT VERSION() AS server_version;'}],
    1:[sql(`Слева откройте созданную базу ${name} и выполните оба запроса. selected_database показывает имя базы, а список таблиц пуст. Если выбрали другое имя, используйте его также в MYSQL_DATABASE.`, `SELECT DATABASE() AS selected_database;
${tablesCheck}`)],
    2:[sql('Выполните после создания users. Первая выдача содержит восемь полей, id имеет auto_increment. Во второй видны PRIMARY и уникальные индексы username и email.', `SHOW COLUMNS FROM users;
SHOW INDEX FROM users;`)],
    3:[sql('Выполните после импорта remaining-tables.sql. Результат содержит applications, rate_limits, reviews, rooms и users.',tablesCheck)],
    4:[sql('В результате четыре строки. Сверьте пары с черновиком: applications.room_id → rooms.id, applications.user_id → users.id, reviews.application_id → applications.id и reviews.user_id → users.id.',foreignKeysCheck)],
    5:[sql('Выполните после импорта начальных данных. Ожидаются шесть залов, по два каждого типа, Conf2027 с ролью 1, ноль заявок и ноль отзывов.', `${catalogueCheck}
SELECT category, COUNT(*) AS room_count FROM rooms GROUP BY category;
SELECT username, is_admin FROM users;
SELECT COUNT(*) AS application_count FROM applications;
SELECT COUNT(*) AS review_count FROM reviews;`)],
    8:[{
      target:'PowerShell в папке проекта',
      instruction:'После экспорта проверьте оба пути и найдите команды создания таблиц и вставки данных. Ожидаются True для обоих файлов и строки CREATE TABLE и INSERT INTO.',
      code:`Test-Path .\\database.sql
Test-Path .\\docs\\er-diagram.pdf
Select-String -Path .\\database.sql -Pattern 'CREATE TABLE','INSERT INTO' |
  Select-Object -First 8`
    }]
  };
}

export function backendCheckpoints(stack) {
  const php=stack==='php';
  const catalog=sql('Сверьте каталог с результатом запроса: шесть строк, у «Балтики» 120 мест.',catalogueCheck);
  const registration=sql('После успешной регистрации и повторной попытки с тем же логином выполните запрос. Ожидается одна строка student27 с is_admin = 0.',registrationCheck);
  const booking=sql('После отправки формы и двух проб с ошибками выполните запрос. Если начали с чистой базы, будет одна строка с «Балтикой», 12 участниками, onsite и статусом new.',bookingCheck);
  const reviews=sql('Выполните запрос до смены статуса, после завершения и после публикации отзыва. До публикации rating и comment равны NULL. После неё статус completed, оценка 5 и одна строка с текстом отзыва.',reviewCheck);
  return php?{
    0:[catalog],
    1:[registration],
    3:[booking],
    4:[reviews],
    5:[{target:'PowerShell в папке проекта',instruction:'Проверьте синтаксис сохранённых файлов. Для каждого PHP выведет No syntax errors detected. Затем проверьте наличие SQL и PDF перед коммитом.',code:`& C:\\xampp\\php\\php.exe -l index.php
& C:\\xampp\\php\\php.exe -l lib.php
Test-Path .\\database.sql
Test-Path .\\docs\\er-diagram.pdf`}]
  }:{
    0:[sql('После запуска каркаса выполните запрос. Шесть строк подтверждают, что каталог в выбранной базе уже загружен.',catalogueCheck)],
    1:[catalog],
    2:[registration],
    4:[sql('До создания первой заявки выполните запрос. Ожидается 0. Если вы уже пробовали отправлять заявки, откройте новый кабинет под другим учебным пользователем для проверки пустого экрана.',`SELECT COUNT(*) AS applications_found
FROM applications AS a JOIN users AS u ON u.id = a.user_id
WHERE u.username = 'student27';`)],
    5:[booking],
    6:[sql('Выполните запрос после каждого сохранения статуса. Последовательно видны new, scheduled и completed.',bookingCheck)],
    7:[reviews],
    8:[{target:'PowerShell в папке проекта',instruction:'Откройте второй терминал, чтобы сервер продолжил работать. Запустите тесты через Python из окружения. Ожидается строка с passed. Затем проверьте наличие файлов перед коммитом.',code:`.\\.venv\\Scripts\\python.exe -m pytest -q
Test-Path .\\database.sql
Test-Path .\\docs\\er-diagram.pdf`}]
  };
}
