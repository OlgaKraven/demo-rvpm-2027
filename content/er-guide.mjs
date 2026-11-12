const entityStories=[
{name:'Пользователь',page:34,quote:'По кнопке «Создать пользователя» данные заносятся в базу данных.',why:'Регистрация повторяется для разных людей. Поэтому один пользователь — одна запись, а все пользователи хранятся в таблице users.',fields:'Логин → username; пароль → password_hash; ФИО → full_name; телефон → phone; электронная почта → email.',extra:'id — придуманный нами уникальный номер записи; is_admin — способ хранить роль; created_at — служебное время. Английские имена полей выбирает разработчик: в КИМ они не заданы.'},
{name:'Помещение',page:36,quote:'необходимо предоставить возможность выбора зала из предопределенного (конкретного) списка',why:'Один зал можно выбирать в разных заявках. Список выносим в отдельную таблицу rooms, чтобы не повторять описание зала в каждой заявке.',fields:'Название помещения → name; тип (аудитория, коворкинг, кинозал) → category. В заявку переносим только номер выбранного помещения: room_id.',extra:'Шесть названий, города, адреса, вместимость, цены и оборудование — демонстрационный каталог примера, а не готовая таблица из КИМ. В PHP он загружается из rooms.json; во Flask — также из rooms.json.'},
{name:'Заявка',page:34,quote:'Пользователь указывает нужное помещение для конференции',why:'Заявка — отдельное событие: один человек может отправить несколько заявок, в том числе на один и тот же зал. Создаём таблицу applications.',fields:'Помещение → room_id; дата → event_date; предпочтительное время → start_time; оплата → payment_method. «Свои заявки» означает связь user_id → users.id.',extra:'user_id сервер берёт из сессии, а room_id — из списка залов. Статус new задаёт сервер, затем его меняет администратор (стр. 35). Название конференции и число участников — дополнительные поля примера.'},
{name:'Отзыв',page:36,quote:'Возможность оставить отзыв появляется только после завершения мероприятия.',why:'Отзыв относится к конкретному завершённому мероприятию и его автору. Создаём reviews и связываем его с applications и users.',fields:'Текст отзыва → comment; выбранная заявка → application_id; автор из сессии → user_id. Сервер проверяет, что заявка своя и завершена.',extra:'Оценка rating от 1 до 5 и ограничение «один отзыв на заявку» — решения учебного примера. КИМ не задаёт эти поля и ограничения дословно.'},
{name:'Защита входа',page:null,quote:'В КИМ такой сущности нет.',why:'rate_limits добавлена разработчиком для ограничения частых попыток входа и регистрации. Она не является частью предметной модели конференций.',fields:'key — действие и IP; window_start — начало окна времени; hits — количество попыток. Все значения вычисляет сервер, формы для них нет.',extra:'Сначала спроектируйте четыре предметные таблицы. Эту техническую таблицу добавляйте отдельно, когда реализуете защиту входа.'}
];

function model(sql, entities, origins) {
  const links=[];
  const tables=entities.map((entity,index)=>{
    const story=entityStories[index];
    const definition=[...sql.matchAll(/^CREATE TABLE (\w+) \(\n([\s\S]*?)^\) ENGINE=/gm)]
      .find(([,name])=>name===entity.name)?.[2];
    if(!definition)throw new Error('Missing ER table: '+entity.name);
    const fields=entity.fields.map(field=>{
      const id=field.split(' ·')[0];
      const line=definition.split('\n').find(line=>line.trim().replace(/^`(\w+)`/,'$1').startsWith(id+' '));
      const declaration=line?.trim().match(/^`?\w+`?\s+(\w+(?:\(\d+\))?)(.*)$/);
      if(!declaration)throw new Error('Missing ER field: '+entity.name+'.'+id);
      const [,type,attributes]=declaration;
      const pk=attributes.includes('PRIMARY KEY'),unique=attributes.includes('UNIQUE');
      const fk=field.includes('FK');
      const [origin,why]=origins[entity.name][id];
      if(fk){
        const relation=[...definition.matchAll(/FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)/g)]
          .find(([,name])=>name===id);
        if(!relation)throw new Error('Missing ER relation: '+entity.name+'.'+id);
        const [, ,to,target]=relation;
        links.push({from:entity.name,field:id,to,target,cardinality:unique?'1 : 0..1':'1 : N',explanation:why});
      }
      const page=Number(why.match(/стр\.\s*(\d+)/)?.[1]);
      const file=page?{title:'КИМ · стр. '+page,href:'materials/kim-2027.pdf#page='+page}:undefined;
      return {id,title:id,type,pk,fk,unique,nullable:!pk&&!attributes.includes('NOT NULL'),why,file,location:origin};
    });
    return {id:entity.name,title:story.name,why:story.why,quote:story.quote,page:story.page,example:story.fields,extra:story.extra,fields};
  });
  return {tables,links};
}

export function rvpmErGuide(data) {
  const schema=model(data.phpCode['schema.sql'].replaceAll('\r\n','\n'),data.entities,data.origins);
  const flask=model(data.code['schema-mysql.sql'].replaceAll('\r\n','\n'),data.entities,data.origins);
  if(JSON.stringify(schema)!==JSON.stringify(flask))throw new Error('ER layouts require matching MySQL models');
  return {schema,order:data.entities.map(entity=>entity.name),source:{code:data.official.code,files:[
    {title:'КИМ · стр. 33–36',href:'materials/kim-2027.pdf#page=33'},
    {title:'Приложения БУ · ZIP',href:'materials/basic-inputs.zip'}
  ]}};
}
