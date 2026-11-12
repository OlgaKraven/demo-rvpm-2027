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
    {blocks:[block('status-review',status,'$titles=',pendingPost(['status','review'])),
      block('dashboards',dashboards,'<?php endif?></main>',`${dashboards} ?>\n${pendingView}`,true)],
      check:'Назначьте и завершите мероприятие под администратором. Вернитесь в кабинет владельца и оставьте отзыв.'},
    {blocks:[],check:'Пройдите весь сценарий с новой учётной записью и проверьте результат по пунктам карточки.'}
  ];
  return {lessons,starter};
}

export const phpStarterReadme = `# Учебный каркас «Конференции.РФ» на PHP

1. Распакуйте архив в отдельную папку. Для Apache используйте отдельную папку в htdocs. В README.md описаны требования к PHP, создание отдельной базы и настройка MYSQL_DATABASE.
2. Если вы уже создали пять таблиц и импортировали seed-php.sql на этапе «Создание БД и выгрузка», укажите имя этой базы в MYSQL_DATABASE и переходите к запуску. При запуске каркаса с нуля создайте отдельную пустую базу и один раз выполните setup.php из командной строки. Он создаст таблицы, каталог и учебного администратора.
3. Откройте index.php через Apache. Для встроенного сервера PHP выполните \`php -S 127.0.0.1:8087\` из папки каркаса и откройте http://127.0.0.1:8087/.
4. Откройте [первый шаг PHP](https://olgakraven.github.io/demo-rvpm-2027/?mode=learn&stage=backend&stack=php&step=1). На каждом шаге заменяйте участок index.php вместе с двумя указанными маркерами на фрагмент из карточки и проверяйте результат.

В каркасе уже есть схема, начальные данные, стили, подключение PDO, сессия и общая навигация. Экраны и обработчики добавляются последовательно. Сохраняйте работу в одной папке между шагами.
`;
