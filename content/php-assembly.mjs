const catalog = "<?php if($route==='home'||$route==='rooms'):";
const authForm = "<?php elseif($route==='register'||$route==='login'):?>";
const bookingForm = "<?php elseif($route==='new'):";
const dashboards = "<?php elseif($route==='dashboard'||$route==='admin'):";
const register = "if($post&&in_array($route,['login','register'],true)){";
const login = "if($post&&$route==='login'){";
const booking = "if($post&&$route==='new'){";
const status = "if($post&&$route==='status'){";

function pendingPost(routes) {
  return `if($post&&in_array($route,[${routes.map(route=>`'${route}'`).join(',')}],true)) {
    fail(501,'Добавьте обработчик по учебной карточке.');
}
`;
}

const pendingView = '<p>Добавьте экран по учебной карточке.</p>\n';

export function phpAssembly(code) {
  const index = code['index.php'].replaceAll('\r\n','\n');
  let starter = index;
  function block(id, from, to, stub, view=false) {
    const begin = index.indexOf(from);
    const end = index.indexOf(to,begin+from.length);
    if(begin<0||end<0)throw new Error('PHP assembly anchor missing: '+id);
    const text = index.slice(begin,end);
    const comment = word => view?`<?php /* ${word} ${id} */ ?>`:`// ${word} ${id}`;
    const first = comment('BEGIN');
    const last = comment('END');
    starter = starter.replace(text,first+'\n'+stub+last+'\n');
    return {file:'index.php',first,last,text};
  }
  const lessons = [
    {blocks:[block('catalog',catalog,authForm,`${catalog} ?>\n${pendingView}`,true)],
      check:'До замены блока главная показывает сообщение каркаса. После замены откройте «Помещения»: в каталоге видно шесть залов.'},
    {blocks:[block('register',register,login,pendingPost(['register'])),
      block('auth-form',authForm,bookingForm,authForm+'\n'+pendingView,true)],
      check:'Отправьте регистрацию с коротким логином. Исправьте его: после успешной записи откроется форма входа.'},
    {blocks:[block('login-logout',login,booking,pendingPost(['login','logout']))],
      check:'Войдите под созданным пользователем. Ссылка выхода работает, кабинет пока показывает сообщение каркаса.'},
    {blocks:[block('booking',booking,status,pendingPost(['new'])),
      block('booking-form',bookingForm,dashboards,`${bookingForm} ?>\n${pendingView}`,true)],
      check:'Откройте «Новая заявка» после входа и отправьте корректную форму. Сверьте новую запись в таблице applications.'},
    {blocks:[block('dashboards',dashboards,'<?php endif?></main>',`${dashboards} ?>\n${pendingView}`,true),
      block('status-review',status,'$titles=',pendingPost(['status','review']))],
      check:'Назначьте и завершите мероприятие под администратором. Вернитесь в кабинет владельца и оставьте отзыв.'},
    {blocks:[],check:'Пройдите весь сценарий с новой учётной записью и проверьте результат по пунктам карточки.'}
  ];
  return {lessons,starter};
}

export const phpStarterReadme = `# Учебный каркас «Конференции.РФ» на PHP

1. Распакуйте архив во временную папку. Перенесите файлы каркаса в свою рабочую папку в htdocs. Сохраните подготовленные README.md, .gitignore, docs и историю Git. Инструкцию из архивного README можно читать во временной папке.
2. Для основного маршрута подключите базу, где создали пять таблиц и импортировали seed-php.sql. Если имя отличается от conference_php_2027, укажите его в MYSQL_DATABASE. Если открыли каркас без предыдущих этапов, вернитесь к уроку создания базы. setup.php используется для отдельного быстрого запуска на пустой базе.
3. Откройте index.php через Apache. Для встроенного сервера PHP выполните \`php -S 127.0.0.1:8087\` из папки каркаса и откройте http://127.0.0.1:8087/.
4. Откройте [первый шаг PHP](https://olgakraven.github.io/demo-rvpm-2027/?mode=learn&stage=backend&stack=php&step=1). На каждом шаге заменяйте участок index.php вместе с двумя указанными маркерами на фрагмент из карточки и проверяйте результат.

В каркасе уже есть схема, начальные данные, стили, подключение PDO, сессия и общая навигация. Экраны и обработчики добавляются последовательно. Сохраняйте работу в одной папке между шагами.
`;
