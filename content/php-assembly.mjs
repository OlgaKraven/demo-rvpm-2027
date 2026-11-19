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
  function block(id, purpose, from, to, stub, view=false) {
    const begin = index.indexOf(from);
    const end = index.indexOf(to,begin+from.length);
    if(begin<0||end<0)throw new Error('PHP assembly anchor missing: '+id);
    const text = index.slice(begin,end);
    const comment = word => view?`<?php /* ${word} ${id} */ ?>`:`// ${word} ${id}`;
    const first = comment('BEGIN');
    const last = comment('END');
    starter = starter.replace(text,first+'\n'+stub+last+'\n');
    return {file:'index.php',first,last,text,purpose};
  }
  const lessons = [
    {blocks:[block('catalog','Читает rooms и выводит карточки помещений.',catalog,authForm,`${catalog} ?>\n${pendingView}`,true)],
      check:'Откройте http://127.0.0.1:8087/index.php?r=rooms. Видны шесть помещений и лофт «Балтика» на 120 мест.'},
    {blocks:[block('register','Проверяет POST регистрации и сохраняет пользователя.',register,login,pendingPost(['register'])),
      block('auth-form','Выводит формы регистрации и входа. Обработчик входа появится на следующем шаге.',authForm,bookingForm,authForm+'\n'+pendingView,true)],
      check:'Откройте http://127.0.0.1:8087/index.php?r=register. После исправления ошибок и успешной регистрации браузер откроет форму входа.'},
    {blocks:[block('login-logout','Проверяет пароль, создаёт сессию и обрабатывает выход.',login,booking,pendingPost(['login','logout']))],
      check:'Откройте http://127.0.0.1:8087/index.php?r=login. Неверный пароль оставляет форму открытой. Верный ведёт в кабинет с заглушкой. После выхода адрес index.php?r=dashboard снова требует входа.'},
    {blocks:[block('booking','Проверяет поля заявки и сохраняет запись с владельцем из сессии.',booking,status,pendingPost(['new'])),
      block('booking-form','Показывает форму и берёт варианты помещений из rooms.',bookingForm,dashboards,`${bookingForm} ?>\n${pendingView}`,true)],
      check:'Под student27 откройте http://127.0.0.1:8087/index.php?r=new. После сохранения откроется заглушка кабинета, а строка заявки уже будет в applications.'},
    {blocks:[block('dashboards','Выводит личный кабинет и панель администратора.',dashboards,'<?php endif?></main>',`${dashboards} ?>\n${pendingView}`,true),
      block('status-review','Обрабатывает изменение статуса и отправку отзыва.',status,'$titles=',pendingPost(['status','review']))],
      check:'Под student27 откройте http://127.0.0.1:8087/index.php?r=dashboard. Под Conf2027 в другом профиле откройте http://127.0.0.1:8087/index.php?r=admin. В обоих видна заявка, но статус меняется только в админке.'},
    {blocks:[],check:'Повторите путь от регистрации до отзыва с другой учебной учётной записью. Под ней должна быть видна только её заявка. После проверки сохраните изменения в Git.'}
  ];
  return {lessons,starter};
}
