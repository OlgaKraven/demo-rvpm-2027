const purposes = {
  'lib.php':'Открывает соединение PDO и собирает общие части страницы. Переменные MYSQL_* задают параметры вашей базы.',
  'index.php':'Принимает запрос, выбирает страницу и запускает сессию. Комментарии BEGIN и END отмечают участки для обработчиков следующих шагов.',
  'requirements.txt':'Перечисляет библиотеки Flask, проверок и драйвер MySQL. pip установит их из заранее скачанной папки wheels.',
  'mysql_backend.py':'Передаёт запросы MySQL через PyMySQL и возвращает записи, поля которых обработчик читает по имени.',
  'app.py':'Создаёт приложение, соединение с базой, сессию и маршруты. Пока маршруты возвращают короткие ответы; дальше по одному замените их обработчиками.',
  'templates/base.html':'Содержит общую разметку и блок, куда Jinja подставляет содержимое страницы.',
  'templates/error.html':'Показывает сообщение об ошибке через общий шаблон.',
  'static/style.css':'Задаёт исходные стили. Палитру и адаптацию добавите после форм.',
  'static/css/style.css':'Задаёт исходные стили. Палитру и адаптацию добавите после форм.'
};

export const projectSetup=Object.fromEntries(['php','mysql'].map(stack=>{
  const php=stack==='php';
  return [stack,{
    purposes,
    actions:[
      'В VS Code выберите «Файл → Открыть папку» и свою рабочую папку с README.md и database.sql из предыдущих этапов.',
      php?'В проводнике VS Code создайте папку static.':'В проводнике VS Code создайте папки templates и static, внутри static — css и js.',
      'Создайте пустой файл '+(php?'static/app.js':'static/js/app.js')+'. JavaScript добавите на этапе интерактивности.',
      'Распакуйте исходные изображения и шрифты в свою папку, сохранив пути static/img и static/fonts.',
      ...(!php?['Из раздела 0 скачайте библиотеки Python 3.12 x64. После распаковки папка wheels должна лежать в корне вашего проекта.']:[]),
      'Создайте каждый показанный ниже файл через «Создать файл», вставьте его код целиком и сохраните в UTF-8. Файлы и папки создаёте в своём проекте.'
    ],
    launchExplanation:'Оставьте MySQL включённым. В VS Code откройте «Терминал → Создать терминал» и выберите PowerShell. Выполните команды из корня своего проекта. В MYSQL_DATABASE укажите свою заполненную базу. В командах показаны стандартные реквизиты XAMPP: адрес 127.0.0.1, порт 3306, пользователь root и пустой пароль. Замените их теми значениями, с которыми открыли свою базу в клиенте СУБД. MYSQL_PASSWORD относится к СУБД; Conf2027 / Demo77 вводятся позже для входа на портал.',
    command:php?String.raw`$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='3306'
$env:MYSQL_USER='root'
$env:MYSQL_PASSWORD=''
$env:MYSQL_DATABASE='conference_php_2027'
& C:\xampp\php\php.exe -S 127.0.0.1:8087`:String.raw`py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --no-index --disable-pip-version-check --no-cache-dir --find-links .\wheels -r requirements.txt
$env:DB_BACKEND='mysql'
$env:MYSQL_HOST='127.0.0.1'
$env:MYSQL_PORT='3306'
$env:MYSQL_USER='root'
$env:MYSQL_PASSWORD=''
$env:MYSQL_DATABASE='conference_rvpm_2027'
.\.venv\Scripts\python.exe -m flask --app app run --port 5017`,
    check:'Откройте http://127.0.0.1:'+(php?'8087':'5017')+'/. Пока главная показывает заглушку. '+(php?'В оставшейся части этой карточки':'На следующем шаге')+' вы добавите каталог из своей таблицы rooms.',
    restart:php?'После изменения PHP сохраните файл и обновите страницу.':'Создание .venv и установку библиотек выполните один раз. После правок Python остановите сервер через Ctrl+C и повторите последнюю команду.'
  }];
}));
