export const stageChecks = {
  documents: ['КИМ и архив приложений БУ', 'Откройте свой README.md. Для регистрации, входа, заявки, статуса и отзыва указаны страница КИМ, роль и ожидаемый результат. Покажите первый коммит.'],
  er: ['Список требований из README.md', 'Покажите на черновике четыре связи FK → PK и назовите поле, которое запрещает второй отзыв к одной заявке.'],
  database: ['Черновик ER-схемы и отдельная база в phpMyAdmin', 'В «Структуре» видны пять таблиц, в «Связях» — четыре FK, в rooms — шесть залов. Откройте сохранённый PDF и найдите CREATE TABLE в SQL-выгрузке.'],
  backend: ['Учебная база с шестью залами, аккаунт Conf2027 и каркас своего стека', 'Создайте заявку обычным пользователем. Назначьте и завершите её как администратор. Вернитесь владельцем, оставьте отзыв и обновите кабинет. Видны одна заявка и один отзыв.'],
  design: ['Рабочий портал и руководство по стилю', 'Откройте все обязательные страницы при 390 × 844. Проверьте Tab, ошибки возле полей, списки помещения и оплаты. Сохраните снимки.'],
  interaction: ['Работающие формы и снимки адаптации', 'После одного POST и двух обновлений кабинета в applications есть одна новая строка. Без интернета локальные стили, шрифты и скрипты продолжают загружаться.'],
  delivery: ['Рабочий портал, ER, SQL и инструкция запуска', 'Откройте свой репозиторий в браузере. Видны исходники, ER, SQL, README и коммиты начала и завершения заданий. Повторите запуск по README в чистой папке.']
};

export const stepChecks = {
  er: [
    'Отметьте четыре предметные таблицы и отдельно rate_limits. Для каждой предметной таблицы назовите, какая запись в ней хранится.',
    'В черновике users есть PK id и UNIQUE для username. Объясните, какой результат даст повтор логина.',
    'Проведите стрелки applications.user_id → users.id и applications.room_id → rooms.id. Две заявки могут ссылаться на один зал.',
    'Укажите FK reviews.application_id и reviews.user_id. Поле application_id имеет UNIQUE. Для одного application_id получится максимум один отзыв.',
    'Сохраните рабочую схему и сверяйте по ней имена, типы и ключи при создании базы.',
    'На черновике предскажите три отказа: повтор логина, неизвестный зал и второй отзыв. Проверки в программе начнутся после сборки форм.'
  ],
  database: [
    'В XAMPP запущены Apache и MySQL. В браузере открывается phpMyAdmin.',
    'В верхней цепочке видно имя вашей учебной базы, список таблиц пуст.',
    'В «Структуре» users восемь полей, id отмечен PRIMARY и A_I, у username и email есть UNIQUE.',
    'В «Структуре» ровно пять таблиц: users, rooms, applications, reviews и rate_limits.',
    'В applications видны два внешних ключа, в reviews — ещё два.',
    'В rooms шесть записей. В users виден Conf2027 с is_admin = 1.',
    'В Designer видны все таблицы и четыре линии, rate_limits стоит отдельно.',
    'Сохранённый er-diagram.pdf открывается. Подписи и четыре связи читаются при увеличении.',
    'В database.sql рядом с README есть таблицы и начальные записи. В docs/er-diagram.pdf читаются поля и связи.'
  ]
};

export const lessonFiles = {
  documents: {
    0: [['КИМ · стр. 33','materials/kim-2027.pdf#page=33']],
    2: [['Приложения БУ · ZIP','materials/basic-inputs.zip'],['Руководство по стилю · PDF','materials/style-guide.pdf']]
  },
  database: {
    2: [['SQL для таблицы users','materials/database/users.sql']],
    3: [['SQL оставшихся таблиц','materials/database/remaining-tables.sql']],
    5: [['Начальные данные для PHP','materials/database/seed-php.sql','php'],['Начальные данные для Flask','materials/database/seed-flask.sql','mysql']],
    7: [['Посмотреть PDF из phpMyAdmin','materials/database/er-example.pdf']],
    8: [['Пример SQL-выгрузки','materials/database/schema-export.sql']]
  },
  design: {
    0: [['Руководство по стилю · PDF','materials/style-guide.pdf']],
    2: [['Приложения БУ · ZIP','materials/basic-inputs.zip']]
  }
};

export function filesFor(files,stage,index,stack) {
  return (files[stage]?.[index]??[]).filter(([, , only])=>!only||only===stack);
}
