const escape = value => value.replace(/[&<>"']/g, symbol => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[symbol]));
const commands = text => `<pre><code>${escape(text)}</code></pre>`;

export function installationPrograms(){
  return `<section>
    <h2>VS Code для файлов проекта</h2>
    <p>Откройте <a href="https://code.visualstudio.com/download">страницу скачивания VS Code</a>. В колонке Windows выберите <strong>x64 · User Installer</strong> или скачайте <a href="https://update.code.visualstudio.com/latest/win32-x64-user/stable">установщик для Windows x64</a> по прямой ссылке.</p>
    <img src="setup/setup-vscode-26.png" alt="Скачивание VS Code: Windows, x64, User Installer" width="1440" height="1000">
    <p>Запустите установщик. На странице дополнительных задач оставьте добавление в PATH. После установки откройте новое окно PowerShell и выполните команду ниже: должны появиться версия редактора и архитектура x64. В редакторе рабочую папку открывают через «Файл → Открыть папку», новые файлы создают в панели «Проводник».</p>
    ${commands('code --version')}
  </section>
  <section>
    <h2>Git и имя автора коммитов</h2>
    <p>На <a href="https://git-scm.com/install/windows">странице Git for Windows</a> выберите <strong>Git for Windows/x64 Setup</strong> в разделе Standalone Installer.</p>
    <img src="setup/setup-git-26.png" alt="Git for Windows: ссылка x64 Setup" width="1440" height="1000">
    <p>В установщике выберите VS Code как редактор Git. На странице Adjusting your PATH environment выберите Git from the command line and also from 3rd-party software. Завершите установку и откройте новое окно PowerShell.</p>
    <p>Замените ИМЯ ФАМИЛИЯ и ВАША_ПОЧТА своими данными. Первые две команды config сохраняют автора будущих коммитов; последние две показывают сохранённые значения. Эта настройка выполняется один раз на вашем компьютере. Локальные коммиты работают без интернета.</p>
    ${commands('git --version\ngit config --global user.name "ИМЯ ФАМИЛИЯ"\ngit config --global user.email "ВАША_ПОЧТА"\ngit config --global --get user.name\ngit config --global --get user.email')}
  </section>
  <section>
    <h2>XAMPP для PHP и базы данных</h2>
    <p>Откройте <a href="https://www.apachefriends.org/download.html">страницу XAMPP</a>. Ссылка <strong>More Downloads</strong> ведёт к архиву версий. Для повторения показанного интерфейса подготовлен <a href="https://sourceforge.net/projects/xampp/files/XAMPP%20Windows/8.2.12/xampp-windows-x64-8.2.12-0-VS16-installer.exe/download">установщик XAMPP 8.2.12 для Windows x64</a>: PHP 8.2 и phpMyAdmin 5.2.1.</p>
    <img src="setup/setup-xampp-26.png" alt="Страница XAMPP и ссылка More Downloads к архиву версий" width="1260" height="860">
    <p>В установщике выберите Apache, MySQL, PHP и phpMyAdmin. Оставьте папку C:\\xampp. Откройте XAMPP Control Panel и нажмите Start у Apache и MySQL. Запишите порты из колонки Port(s): порт MySQL понадобится приложению, порт Apache — адресу phpMyAdmin.</p>
    <p>Откройте http://localhost/phpmyadmin. Если Apache работает на другом порту, добавьте его после localhost. Например, для порта 8080 адрес будет http://localhost:8080/phpmyadmin. Убедитесь, что виден список баз. Отдельную учебную базу создадите на этапе «Создание БД и выгрузка».</p>
    ${commands(String.raw`& C:\xampp\php\php.exe --version
& C:\xampp\php\php.exe -m`)}
    <p>Для PHP-примера в списке расширений нужны pdo_mysql и mbstring. Первое соединяет PHP с MySQL, второе считает символы русского текста. Если строки отсутствуют, в C:\\xampp\\php\\php.ini включите extension=pdo_mysql и extension=mbstring, затем перезапустите Apache.</p>
  </section>
  <section>
    <h2>Python 3.12 x64 для Flask</h2>
    <p>Если выбрали Flask, откройте <a href="https://www.python.org/downloads/release/python-31210/">страницу Python 3.12.10</a> и выберите <strong>Windows installer (64-bit)</strong> в таблице Files. Можно скачать <a href="https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe">этот установщик</a> сразу.</p>
    <img src="setup/setup-python-26.png" alt="Python 3.12.10: Windows installer 64-bit в таблице Files" width="1440" height="1000">
    <p>Включите pip и Python Launcher; на начальном экране отметьте Add python.exe to PATH. После установки откройте новое окно PowerShell. Команды должны показать Python 3.12.x, pip и 64bit. Подготовленные wheels рассчитаны на Python 3.12 под Windows x64.</p>
    ${commands('py -3.12 --version\npy -3.12 -m pip --version\npy -3.12 -c "import platform; print(platform.architecture()[0])"')}
  </section>
  <section><h2>ER-схема и PDF</h2><p>Для схемы используйте «Дизайнер» в phpMyAdmin. Созданные таблицы и связи появятся в нём на этапе базы данных; там же показан экспорт схемы в PDF. Для этого маршрута дополнительных программ устанавливать не требуется.</p></section>`;
}

export function preparationPage(source,faq){
  return source.replace('<!-- PROGRAMS -->',installationPrograms())
    .replace(/  <section id="faq">[\s\S]*?\n  <\/section>/,faq)
    .replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g,(_,attrs,body)=>
      `<div data-check-code><button type="button" class="btn" data-copy-block>Копировать код</button><pre class="lesson-code" tabindex="0"${attrs}>${body}</pre></div>`);
}

// The presentation uses the same install instructions and download links.
export function installationSteps(){
  const decode=text=>text.replace(/&(amp|lt|gt|quot|#39);/g,(_,name)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[name]));
  const plain=text=>decode(text.replace(/<[^>]*>/g,'')).trim();
  return [...installationPrograms().matchAll(/<section>([\s\S]*?)<\/section>/g)].map(([,html])=>({
    title:plain(html.match(/<h2>([\s\S]*?)<\/h2>/)[1]),
    paragraphs:[...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(([,text])=>plain(text)),
    links:[...html.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)].map(([,href,label])=>[plain(label),decode(href)]),
    image:html.match(/<img src="([^"]+)"/)?.[1],
    commands:[...html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map(([,code])=>decode(code))
  }));
}
