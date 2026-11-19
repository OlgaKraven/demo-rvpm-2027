const field=(name,type,length='',index='—',value='Нет')=>[name,type,length||'—',index,value];

export const tableForms=[
  {name:'users',purpose:'Одна строка — учётная запись. Поля регистрации сохраняет сервер, хеш создаёт библиотека, роль и время задаются при добавлении записи.',fields:[
    field('id','INT','','PRIMARY · A_I'),field('username','VARCHAR','191','UNIQUE · username'),
    field('password_hash','TEXT'),field('full_name','TEXT'),field('phone','TEXT'),
    field('email','VARCHAR','191','UNIQUE · email'),field('is_admin','INT','','—','Как определено: 0'),
    field('created_at','VARCHAR','30','—','CURRENT_TIMESTAMP')
  ],notes:[
    'В строке id выберите PRIMARY в столбце «Индекс». В появившемся окне оставьте имя PRIMARY и столбец id, нажмите «Вперёд». Только после закрытия окна отметьте A_I в строке id.',
    'В строке username выберите UNIQUE. В окне «Добавить индекс» введите имя username, проверьте выбранный столбец username, оставьте «Размер» пустым и нажмите «Вперёд».',
    'В строке email выберите UNIQUE. Если появится выбор, оставьте «Создать индекс по одному столбцу» → «Вперёд». В следующем окне задайте имя email, проверьте столбец email и нажмите «Вперёд». Это два самостоятельных уникальных индекса.',
    'Для is_admin в «По умолчанию» выберите «Как определено:» и в появившееся поле введите 0 без кавычек. Для created_at выберите CURRENT_TIMESTAMP в самом списке; длина VARCHAR остаётся 30.'
  ],image:'constructor-users-structure.png',extraImages:[
    ['constructor-primary-index.png','Подтвердите PRIMARY для одного столбца id'],
    ['constructor-separate-index.png','Для второго UNIQUE оставьте индекс по одному столбцу']
  ]},
  {name:'rooms',purpose:'Одна строка — помещение из rooms.json. Числа нужны для проверки вместимости и показа цены, текст — для карточки помещения.',fields:[
    field('id','INT','','PRIMARY · A_I'),field('name','VARCHAR','191','UNIQUE · name'),
    field('category','VARCHAR','20'),field('city','TEXT'),field('address','TEXT'),
    field('capacity','INT'),field('hourly_rate','INT'),field('image','TEXT'),field('description','TEXT'),field('equipment','TEXT')
  ],notes:[
    'Настройте PRIMARY и A_I у id так же, как у users. Для name выберите UNIQUE, назовите индекс name и проверьте единственный столбец name.',
    'Для TEXT и INT не вводите длину. Для category задайте VARCHAR и длину 20. Ограничения типа помещения, вместимости и цены добавите после связей.'
  ],image:'constructor-rooms-structure.png'},
  {name:'applications',purpose:'Одна строка — заявка пользователя на помещение. user_id и room_id содержат идентификаторы; дату и время сервер сохраняет в согласованном текстовом формате.',fields:[
    field('id','INT','','PRIMARY · A_I'),field('user_id','INT','','INDEX · applications_user_idx'),
    field('room_id','INT','','INDEX · applications_room_idx'),field('conference_name','TEXT'),
    field('event_date','TEXT','','INDEX · applications_event_date_idx'),field('start_time','TEXT'),field('attendees','INT'),
    field('payment_method','VARCHAR','20'),field('status','VARCHAR','20','INDEX · applications_status_idx','Как определено: new'),
    field('created_at','VARCHAR','30','—','CURRENT_TIMESTAMP'),field('updated_at','VARCHAR','30','—','CURRENT_TIMESTAMP')
  ],notes:[
    'Настройте PRIMARY и A_I у id. Для status выберите «Как определено:» и введите new без кавычек. Для created_at и updated_at выберите CURRENT_TIMESTAMP. Автоматическое изменение updated_at в этой модели делает серверный код.',
    'По очереди выберите INDEX у user_id, room_id, event_date и status. В каждом окне задайте имя индекса из таблицы. При предложении объединить индексы выбирайте «Создать индекс по одному столбцу». Поле «Размер» оставьте пустым: проверенная MariaDB сама задаёт префикс для TEXT event_date.',
    'Индекс помогает искать заявки; связь с существующим пользователем или помещением настроите в следующем шаге. Здесь индекс не заменяет внешний ключ.'
  ],image:'constructor-applications-structure.png'},
  {name:'reviews',purpose:'Одна строка — отзыв к завершённой заявке. UNIQUE у application_id разрешает только один отзыв к одной заявке.',fields:[
    field('id','INT','','PRIMARY · A_I'),field('application_id','INT','','UNIQUE · application_id'),
    field('user_id','INT','','INDEX · reviews_user_idx'),field('rating','INT'),field('comment','TEXT'),
    field('created_at','VARCHAR','30','—','CURRENT_TIMESTAMP')
  ],notes:[
    'Настройте PRIMARY и A_I у id. Для application_id выберите UNIQUE и имя application_id. Для user_id выберите INDEX и имя reviews_user_idx. В обоих случаях выбран только один столбец.',
    'Для created_at выберите CURRENT_TIMESTAMP. Проверку оценки и длины комментария добавите после связей; принадлежность и статус заявки проверит сервер.'
  ],image:'constructor-reviews-structure.png'},
  {name:'rate_limits',purpose:'Техническая таблица считает попытки входа. Ключ формирует приложение, window_start хранит начало интервала, hits — число попыток.',fields:[
    field('key','VARCHAR','191','PRIMARY'),field('window_start','INT'),field('hits','INT')
  ],notes:[
    'Для key выберите PRIMARY и подтвердите единственный столбец key. A_I оставьте выключенным: ключ строковый и приходит из приложения.',
    'При нажатии «Сохранить» phpMyAdmin предупреждает: «Имя key является зарезервированным словом MySQL». Подтвердите сохранение кнопкой OK. Конструктор заключает имя в обратные кавычки; так же оно записано в серверных запросах.'
  ],image:'constructor-rate-limits-structure.png'}
];

export const constructorActions=[
  'Нажмите имя своей базы в верхней цепочке. Внизу «Структуры» найдите «Создать таблицу»: введите имя и количество столбцов из карточки, нажмите «Создать». Не выбирайте «Создать БД» повторно.',
  'Заполните строки в указанном порядке. «Имя» — точное имя поля, «Тип» — значение списка. Для VARCHAR число вводится отдельно в «Длина/Значения». Знак «—» в таблице означает оставить поле пустым, вводить его не нужно.',
  'Во всех строках оставьте Null выключенным. «Атрибуты», комментарии и виртуальность оставьте без изменений. «Нет» в колонке «По умолчанию» означает исходный вариант списка, а не текст для ввода.',
  'Форма широкая: нижняя горизонтальная полоса открывает «Индекс» и A_I справа. После работы с ключами прокрутите её влево и снова сверьте имена, типы и длину.',
  'Под таблицей выберите «Тип таблиц» InnoDB и «Сравнение» utf8mb4_unicode_ci. Настройте ключи и значения по умолчанию по пояснениям своей таблицы.',
  'Нажмите «Предпросмотр SQL», проверьте имя базы и таблицы, затем «Закрыть». Нажмите «Сохранить». Откройте созданную таблицу → «Структура», сверьте поля и блок «Индексы» внизу. Для следующей таблицы вернитесь к имени базы.'
];

export const relationForms=[
  {table:'applications',image:'constructor-applications-relations.png',rows:[
    ['applications_user_fk','user_id','users','id','CASCADE','RESTRICT'],
    ['applications_room_fk','room_id','rooms','id','RESTRICT','RESTRICT']
  ]},
  {table:'reviews',image:'constructor-reviews-relations.png',rows:[
    ['reviews_application_fk','application_id','applications','id','CASCADE','RESTRICT'],
    ['reviews_user_fk','user_id','users','id','CASCADE','RESTRICT']
  ]}
];

export const relationActions=[
  'Слева выберите applications → вкладка «Структура» → кнопка «Связи» под верхним меню. Работайте в группе «Ограничения внешнего ключа», а не только с линиями Designer.',
  'В первой строке введите имя ограничения. Выберите ON DELETE, оставьте ON UPDATE = RESTRICT, в локальном «Столбце» выберите поле заявки. Справа оставьте свою базу, выберите целевую таблицу и дождитесь списка её столбцов; затем явно выберите id.',
  'Нажмите «+ Добавить ограничение» для второй связи. «+ Добавить столбец» относится к одной составной связи и здесь не требуется. Заполните вторую строку по таблице ниже, нажмите «Сохранить» и проверьте сообщение об успехе.',
  'Повторите те же действия для reviews. CASCADE удаляет зависимую запись вместе с владельцем; RESTRICT у помещения запрещает удалить зал, на который уже есть заявка. Все четыре ON UPDATE остаются RESTRICT.'
];

export const valueChecks=[
  ['users','users_role_check','is_admin IN (0, 1)','Роль — обычный пользователь или администратор.'],
  ['rooms','rooms_category_check',"category IN ('auditorium', 'coworking', 'cinema')",'Только три типа помещений из задания.'],
  ['rooms','rooms_capacity_check','capacity > 0','Вместимость положительная.'],
  ['rooms','rooms_price_check','hourly_rate >= 0','Цена неотрицательная.'],
  ['applications','applications_title_check','CHAR_LENGTH(conference_name) BETWEEN 3 AND 120','Название содержит от 3 до 120 символов.'],
  ['applications','applications_attendees_check','attendees > 0','Число участников положительное.'],
  ['applications','applications_payment_check',"payment_method IN ('onsite', 'sbp')",'Два значения оплаты из формы.'],
  ['applications','applications_status_check',"status IN ('new', 'scheduled', 'completed')",'Три статуса заявки.'],
  ['reviews','reviews_rating_check','rating BETWEEN 1 AND 5','Оценка от 1 до 5.'],
  ['reviews','reviews_comment_check','CHAR_LENGTH(comment) BETWEEN 10 AND 500','Комментарий содержит от 10 до 500 символов.'],
  ['rate_limits','rate_limits_hits_check','hits > 0','Счётчик попыток положительный.']
];
export const valueChecksSql=valueChecks.map(([table,name,expression])=>`ALTER TABLE ${table}\n  ADD CONSTRAINT ${name} CHECK (${expression});`).join('\n\n');
