# Пошаговый урок: Flask-проект поверх пустой базы MySQL

Этот урок показывает, что делать **после создания базы MySQL**, когда сама база уже существует, но таблиц, моделей и файла schema.sql ещё нет. Схему мы опишем моделями Python и создадим через миграции Flask-Migrate.

В результате получится учебный портал «Конференции.РФ» с регистрацией, входом, каталогом помещений, заявками, кабинетом пользователя, отзывами и административной панелью.

## Что считаем готовым

Перед началом у вас уже должны быть:

- запущенный сервер MySQL;
- пустая база, например conference_rf;
- отдельный пользователь MySQL с паролем;
- права этого пользователя на создание и изменение таблиц в conference_rf;
- Python 3.10 или новее.

В примерах заменяйте значения conference_rf, conference_app и YOUR_PASSWORD на свои.

## Шаг 1. Проверьте подключение к созданной базе

Подключитесь к MySQL:

~~~bash
mysql -h 127.0.0.1 -P 3306 -u conference_app -p conference_rf
~~~

После ввода пароля выполните:

~~~sql
SELECT DATABASE();
SHOW TABLES;
SHOW VARIABLES LIKE 'character_set_database';
~~~

Ожидаемый результат:

- SELECT DATABASE() возвращает conference_rf;
- SHOW TABLES показывает пустой список;
- кодировка базы — utf8mb4.

Если SHOW TABLES уже выводит таблицы, остановитесь: сначала выясните, кому они принадлежат, и сделайте резервную копию. Не применяйте начальную миграцию вслепую к базе с данными.

Приложение не должно работать от MySQL-пользователя root. Для учебной миграции отдельному пользователю нужны как минимум права SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP и REFERENCES на одну базу. REFERENCES требуется при создании внешних ключей. Выдавать права должен администратор MySQL.

## Шаг 2. Создайте каталог и виртуальное окружение

На macOS или Linux:

~~~bash
mkdir conference-mysql
cd conference-mysql
python3 -m venv .venv
source .venv/bin/activate
~~~

В Windows PowerShell:

~~~powershell
mkdir conference-mysql
cd conference-mysql
py -m venv .venv
.venv\Scripts\Activate.ps1
~~~

После активации команда python должна указывать на интерпретатор внутри .venv:

~~~bash
python --version
python -c "import sys; print(sys.executable)"
~~~

## Шаг 3. Установите зависимости

Создайте requirements.txt:

~~~text
Flask>=3.1,<4
Flask-SQLAlchemy>=3.1,<4
Flask-Migrate>=4,<5
PyMySQL>=1.1,<2
python-dotenv>=1,<2
Flask-WTF>=1.2,<2
Flask-Limiter>=4,<5
pytest>=8,<9
~~~

Установите пакеты:

~~~bash
python -m pip install -r requirements.txt
~~~

Зачем они нужны:

- Flask принимает HTTP-запросы и отображает страницы;
- Flask-SQLAlchemy связывает классы Python с таблицами;
- Flask-Migrate и Alembic создают и обновляют схему;
- PyMySQL подключает SQLAlchemy к MySQL;
- python-dotenv загружает локальные переменные из .env;
- Flask-WTF добавляет CSRF-защиту форм;
- Flask-Limiter ограничивает частоту входа и регистрации;
- pytest запускает автоматические тесты.

## Шаг 4. Создайте структуру проекта

Соберите такую структуру:

~~~text
conference-mysql/
├── app.py
├── config.py
├── requirements.txt
├── .env
├── .env.example
├── .flaskenv
├── .gitignore
├── conference_portal/
│   ├── __init__.py
│   ├── extensions.py
│   ├── models.py
│   ├── commands.py
│   ├── auth.py
│   ├── portal.py
│   ├── admin.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── application_form.html
│   │   ├── dashboard.html
│   │   └── admin.html
│   └── static/
│       ├── css/style.css
│       ├── js/app.js
│       ├── fonts/
│       └── img/
└── tests/
    ├── conftest.py
    └── test_app.py
~~~

Почему приложение оформлено пакетом: модели, авторизацию, пользовательские страницы и админку можно развивать отдельно, а фабрика приложения остаётся небольшой.

## Шаг 5. Защитите секреты и настройте окружение

Создайте .gitignore:

~~~text
.venv/
.env
__pycache__/
*.py[cod]
.pytest_cache/
.coverage
htmlcov/
~~~

Файл .env никогда не добавляйте в Git. Создайте в нём реальные локальные значения:

~~~dotenv
SECRET_KEY=replace-with-a-random-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=conference_rf
DB_USER=conference_app
DB_PASSWORD=YOUR_PASSWORD
COOKIE_SECURE=0
~~~

Случайный SECRET_KEY можно получить так:

~~~bash
python -c "import secrets; print(secrets.token_hex(32))"
~~~

Создайте безопасный шаблон .env.example без реального пароля:

~~~dotenv
SECRET_KEY=generate-me
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=conference_rf
DB_USER=conference_app
DB_PASSWORD=change-me
COOKIE_SECURE=0
~~~

Создайте .flaskenv:

~~~dotenv
FLASK_APP=app
FLASK_RUN_PORT=5001
~~~

При установленном python-dotenv команда flask загрузит .env и .flaskenv автоматически. Порт 5001 выбран потому, что на некоторых компьютерах macOS порт 5000 занят системной службой.

## Шаг 6. Настройте подключение SQLAlchemy к MySQL

Создайте config.py:

~~~python
import os

from dotenv import load_dotenv
from sqlalchemy import URL


load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = None
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    }

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.environ.get("COOKIE_SECURE") == "1"
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 8
    MAX_CONTENT_LENGTH = 1024 * 1024


def mysql_database_url():
    required = ("DB_USER", "DB_PASSWORD", "DB_NAME")
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise RuntimeError(
            "Не заданы переменные окружения: " + ", ".join(missing)
        )

    return URL.create(
        "mysql+pymysql",
        username=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ.get("DB_HOST", "127.0.0.1"),
        port=int(os.environ.get("DB_PORT", "3306")),
        database=os.environ["DB_NAME"],
        query={"charset": "utf8mb4"},
    )
~~~

URL.create безопасно собирает адрес даже тогда, когда пароль содержит специальные символы. Параметр utf8mb4 нужен для полноценного Unicode. pool_pre_ping проверяет соединение перед использованием, а pool_recycle не позволяет слишком долго держать устаревшие соединения. Адрес MySQL вынесен в функцию: благодаря этому тестовая конфигурация сможет подставить SQLite, не требуя локального файла .env с реквизитами MySQL.

## Шаг 7. Создайте расширения и фабрику приложения

Создайте conference_portal/extensions.py:

~~~python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect


db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
    storage_uri="memory://",
)
~~~

Хранилище memory:// подходит для одного локального процесса. При настоящем размещении с несколькими процессами лимитер нужно подключить к общему поддерживаемому хранилищу.

Создайте conference_portal/__init__.py:

~~~python
from flask import Flask

from config import Config, mysql_database_url
from .extensions import csrf, db, limiter, migrate


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)

    if test_config is None:
        if not app.config["SECRET_KEY"]:
            raise RuntimeError("Не задана переменная окружения SECRET_KEY")
        app.config["SQLALCHEMY_DATABASE_URI"] = mysql_database_url()
    else:
        app.config.update(test_config)

    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    limiter.init_app(app)

    # Импорт нужен до работы миграций: Alembic должен увидеть модели.
    from . import models
    from .auth import bp as auth_bp
    from .portal import bp as portal_bp
    from .admin import bp as admin_bp
    from .commands import init_app as init_commands

    app.register_blueprint(auth_bp)
    app.register_blueprint(portal_bp)
    app.register_blueprint(admin_bp)
    init_commands(app)

    return app
~~~

Создайте корневой app.py:

~~~python
from conference_portal import create_app


app = create_app()
~~~

Контрольная точка:

~~~bash
flask --app app routes
~~~

Пока модули auth.py, portal.py и admin.py пустые, создайте в каждом хотя бы объект Blueprint, иначе импорт завершится ошибкой:

~~~python
from flask import Blueprint

bp = Blueprint("portal", __name__)
~~~

Для auth.py используйте имя auth, для admin.py — admin и параметр url_prefix="/admin".
Во временный commands.py до шага 10 добавьте заглушку:

~~~python
def init_app(app):
    pass
~~~

## Шаг 8. Опишите схему моделями Python

Создайте conference_portal/models.py:

~~~python
from .extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(17), nullable=False)
    email = db.Column(db.String(254), nullable=False, unique=True)
    is_admin = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default=db.false(),
    )
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )

    applications = db.relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reviews = db.relationship(
        "Review",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    category = db.Column(db.String(20), nullable=False, index=True)
    city = db.Column(db.String(80), nullable=False, index=True)
    address = db.Column(db.String(180), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    hourly_rate = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    equipment = db.Column(db.String(255), nullable=False)

    applications = db.relationship("Application", back_populates="room")

    __table_args__ = (
        db.CheckConstraint(
            "category IN ('auditorium', 'coworking', 'cinema')",
            name="ck_rooms_category",
        ),
        db.CheckConstraint("capacity > 0", name="ck_rooms_capacity"),
        db.CheckConstraint("hourly_rate >= 0", name="ck_rooms_hourly_rate"),
    )


class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    room_id = db.Column(
        db.Integer,
        db.ForeignKey("rooms.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    conference_name = db.Column(db.String(120), nullable=False)
    event_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.Time, nullable=False)
    attendees = db.Column(db.Integer, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)
    status = db.Column(
        db.String(20),
        nullable=False,
        default="new",
        server_default="new",
        index=True,
    )
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )

    user = db.relationship("User", back_populates="applications")
    room = db.relationship("Room", back_populates="applications")
    review = db.relationship(
        "Review",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        db.CheckConstraint("attendees > 0", name="ck_applications_attendees"),
        db.CheckConstraint(
            "payment_method IN ('onsite', 'sbp')",
            name="ck_applications_payment",
        ),
        db.CheckConstraint(
            "status IN ('new', 'scheduled', 'completed')",
            name="ck_applications_status",
        ),
    )


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(
        db.Integer,
        db.ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(500), nullable=False)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.current_timestamp(),
    )

    application = db.relationship("Application", back_populates="review")
    user = db.relationship("User", back_populates="reviews")

    __table_args__ = (
        db.UniqueConstraint(
            "application_id",
            name="uq_reviews_application_id",
        ),
        db.CheckConstraint(
            "rating BETWEEN 1 AND 5",
            name="ck_reviews_rating",
        ),
    )
~~~

Главные решения модели:

- дата и время хранятся типами Date и Time, а не произвольными строками;
- user_id заявки приходит из авторизованной сессии, а не из формы;
- внешний ключ от заявки к пользователю удаляется каскадно;
- удалять помещение с существующей заявкой запрещает RESTRICT;
- UNIQUE на reviews.application_id гарантирует не более одного отзыва;
- CHECK и серверная валидация дополняют друг друга.

Связи можно представить так:

~~~mermaid
erDiagram
    USERS ||--o{ APPLICATIONS : creates
    ROOMS ||--o{ APPLICATIONS : selected_for
    USERS ||--o{ REVIEWS : writes
    APPLICATIONS ||--o| REVIEWS : receives
~~~

## Шаг 9. Создайте таблицы первой миграцией

Не используйте db.create_all() для основной MySQL-базы. Сразу создайте историю миграций:

~~~bash
flask --app app db init
flask --app app db migrate -m "initial schema"
~~~

Теперь обязательно откройте новый файл в migrations/versions и проверьте:

- создаются ровно users, rooms, applications и reviews;
- типы и длины столбцов совпадают с моделями;
- присутствуют внешние ключи, UNIQUE, CHECK и индексы;
- downgrade удаляет таблицы в обратном порядке.

Автогенерация Alembic не распознаёт абсолютно все изменения, особенно переименования. Поэтому migrate — это генерация черновика миграции, а не безусловная команда «сделать всё правильно».

Если файл корректен, примените его:

~~~bash
flask --app app db upgrade
flask --app app db current
~~~

Проверьте результат в MySQL:

~~~sql
USE conference_rf;
SHOW TABLES;
SHOW CREATE TABLE applications;
SHOW CREATE TABLE reviews;
~~~

Кроме четырёх таблиц приложения появится alembic_version — Flask-Migrate хранит там текущую версию схемы.

## Шаг 10. Добавьте администратора и помещения

Начальные данные лучше добавлять отдельной повторяемой командой, а не внутрь миграции. Создайте conference_portal/commands.py:

~~~python
import click
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash

from .extensions import db
from .models import Room, User


@click.command("seed")
@with_appcontext
def seed_command():
    admin = db.session.scalar(
        db.select(User).where(User.username == "Conf2027")
    )
    if admin is None:
        db.session.add(
            User(
                username="Conf2027",
                password_hash=generate_password_hash("Demo77"),
                full_name="Администратор Портала",
                phone="8(800)000-00-00",
                email="admin@conference.test",
                is_admin=True,
            )
        )

    rooms = [
        {
            "name": "Аудитория «Нева»",
            "category": "auditorium",
            "city": "Москва",
            "address": "Ленинградский проспект, 39",
            "capacity": 48,
            "hourly_rate": 5200,
            "image": "img/auditorium-neva.webp",
            "description": "Светлый зал для лекций и обсуждений.",
            "equipment": "Проектор, флипчарт, Wi-Fi",
        },
        {
            "name": "Коворкинг «Спектр»",
            "category": "coworking",
            "city": "Казань",
            "address": "ул. Петербургская, 52",
            "capacity": 70,
            "hourly_rate": 6100,
            "image": "img/coworking-spectrum.jpg",
            "description": "Гибкое пространство для рабочих групп.",
            "equipment": "Wi-Fi, кухня, проектор",
        },
        {
            "name": "Кинозал «Панорама»",
            "category": "cinema",
            "city": "Новосибирск",
            "address": "Красный проспект, 17",
            "capacity": 85,
            "hourly_rate": 7800,
            "image": "img/cinema-panorama.jpg",
            "description": "Зал для форумов и гибридных трансляций.",
            "equipment": "4K-проектор, микрофоны, трансляция",
        },
    ]

    for values in rooms:
        exists = db.session.scalar(
            db.select(Room).where(Room.name == values["name"])
        )
        if exists is None:
            db.session.add(Room(**values))

    db.session.commit()
    click.echo("Администратор и помещения готовы.")


def init_app(app):
    app.cli.add_command(seed_command)
~~~

Запустите:

~~~bash
flask --app app seed
flask --app app seed
~~~

Вторая команда не должна создавать дубликаты. Проверьте:

~~~sql
SELECT username, is_admin FROM users;
SELECT name, category, capacity FROM rooms;
~~~

Пароль Demo77 нужен по заданию, но в БД должен лежать только его хеш.

## Шаг 11. Создайте первую страницу

В conference_portal/portal.py:

~~~python
from flask import Blueprint, render_template

from .extensions import db
from .models import Room


bp = Blueprint("portal", __name__)


@bp.get("/")
def index():
    rooms = db.session.scalars(
        db.select(Room).order_by(Room.id).limit(3)
    ).all()
    return render_template("index.html", rooms=rooms)
~~~

Минимальный conference_portal/templates/base.html:

~~~html
<!doctype html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}Конференции.РФ{% endblock %}</title>
    <link rel="stylesheet"
          href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <header>
        <a href="{{ url_for('portal.index') }}">Конференции.РФ</a>
    </header>
    <main>{% block content %}{% endblock %}</main>
</body>
</html>
~~~

Минимальный index.html:

~~~html
{% extends "base.html" %}
{% block content %}
<h1>Помещения для конференций</h1>
{% for room in rooms %}
    <article>
        <h2>{{ room.name }}</h2>
        <p>{{ room.city }} · до {{ room.capacity }} человек</p>
    </article>
{% else %}
    <p>Помещения пока не добавлены.</p>
{% endfor %}
{% endblock %}
~~~

Запустите приложение:

~~~bash
flask --app app run --debug --port 5001
~~~

Откройте http://127.0.0.1:5001. Если карточки появились, Flask, Jinja, SQLAlchemy и MySQL уже работают вместе.

## Шаг 12. Реализуйте регистрацию

В auth.py подключите Blueprint:

~~~python
import re

from flask import Blueprint, flash, redirect, render_template, request, url_for
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from .extensions import db, limiter
from .models import User


bp = Blueprint("auth", __name__)

USERNAME_RE = re.compile(r"^[A-Za-z0-9]{6,40}$")
FULL_NAME_RE = re.compile(r"^[А-Яа-яЁё]+(?:\s+[А-Яа-яЁё]+)*$")
PHONE_RE = re.compile(r"^8\(\d{3}\)\d{3}-\d{2}-\d{2}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-zА-Яа-яЁё]{2,}$")
~~~

Маршрут должен:

1. принять GET и POST;
2. собрать значения через request.form.get;
3. проверить все поля на сервере;
4. сохранить не пароль, а generate_password_hash(password);
5. перехватить IntegrityError для повторного логина или e-mail;
6. обязательно вызвать db.session.rollback() после ошибки;
7. после успеха перенаправить на вход.

Каркас:

~~~python
@bp.route("/register", methods=["GET", "POST"])
@limiter.limit("5 per hour", methods=["POST"])
def register():
    errors = {}
    values = {
        "username": request.form.get("username", "").strip(),
        "full_name": request.form.get("full_name", "").strip(),
        "phone": request.form.get("phone", "").strip(),
        "email": request.form.get("email", "").strip().lower(),
    }

    if request.method == "POST":
        password = request.form.get("password", "")
        password_confirm = request.form.get("password_confirm", "")

        if not USERNAME_RE.fullmatch(values["username"]):
            errors["username"] = "Только латиница и цифры, от 6 до 40."
        if not 8 <= len(password) <= 128:
            errors["password"] = "Пароль должен содержать от 8 до 128 символов."
        if password != password_confirm:
            errors["password_confirm"] = "Пароли не совпадают."
        if len(values["full_name"]) > 120 or not FULL_NAME_RE.fullmatch(values["full_name"]):
            errors["full_name"] = "ФИО вводится кириллицей."
        if not PHONE_RE.fullmatch(values["phone"]):
            errors["phone"] = "Формат: 8(XXX)XXX-XX-XX."
        if len(values["email"]) > 254 or not EMAIL_RE.fullmatch(values["email"]):
            errors["email"] = "Введите корректный e-mail."

        if not errors:
            db.session.add(
                User(
                    username=values["username"],
                    password_hash=generate_password_hash(password),
                    full_name=values["full_name"],
                    phone=values["phone"],
                    email=values["email"],
                )
            )
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                errors["username"] = "Логин или e-mail уже используется."
            else:
                flash("Профиль создан.", "success")
                return redirect(url_for("auth.login"))

    return render_template("register.html", values=values, errors=errors)
~~~

Клиентская проверка required, minlength и pattern улучшает интерфейс, но не заменяет серверную проверку.

## Шаг 13. Добавьте вход, сессию и разграничение ролей

Основной фрагмент входа:

~~~python
from flask import g, session
from werkzeug.security import check_password_hash


@bp.before_app_request
def load_logged_in_user():
    user_id = session.get("user_id")
    g.user = db.session.get(User, user_id) if user_id else None


@bp.route("/login", methods=["GET", "POST"])
@limiter.limit("10 per 15 minutes", methods=["POST"])
def login():
    error = None
    username = request.form.get("username", "").strip()

    if request.method == "POST":
        password = request.form.get("password", "")
        if len(username) > 40 or len(password) > 128:
            error = "Неверный логин или пароль."
        else:
            user = db.session.scalar(
                db.select(User).where(User.username == username)
            )

            if user is None or not check_password_hash(
                user.password_hash,
                password,
            ):
                error = "Неверный логин или пароль."
            else:
                session.clear()
                session["user_id"] = user.id
                session.permanent = True
                destination = "admin.index" if user.is_admin else "portal.dashboard"
                return redirect(url_for(destination))

    return render_template("login.html", error=error, username=username)


@bp.post("/logout")
def logout():
    session.clear()
    return redirect(url_for("portal.index"))
~~~

MySQL часто использует регистронезависимую collation для строк. Всё равно проверьте поведение логинов явно и выберите одно правило: либо логины чувствительны к регистру, либо нормализуются одинаково при регистрации и входе.

Ниже в том же auth.py создайте декораторы. Отдельный decorators.py в этом варианте не нужен:

~~~python
from functools import wraps
from flask import abort


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            return redirect(url_for("auth.login"))
        return view(*args, **kwargs)
    return wrapped


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            return redirect(url_for("auth.login"))
        if not g.user.is_admin:
            abort(403)
        return view(*args, **kwargs)
    return wrapped
~~~

Никогда не определяйте роль по скрытому полю формы или параметру URL. Источник роли — запись пользователя, загруженная из базы.

## Шаг 14. Включите CSRF-защиту форм

CSRFProtect уже подключён в фабрике. В каждую POST-форму без FlaskForm добавьте скрытое поле:

~~~html
<form method="post">
    <input type="hidden"
           name="csrf_token"
           value="{{ csrf_token() }}">
    <!-- остальные поля -->
    <button type="submit">Сохранить</button>
</form>
~~~

Это поле нужно в регистрации, входе, выходе, создании заявки, отзыве и смене статуса. Для fetch-запросов токен передаётся заголовком X-CSRFToken.

## Шаг 15. Реализуйте создание заявки

Форма отправляет room_id, conference_name, event_date, start_time, attendees и payment_method. Сервер обязан:

- загрузить Room по идентификатору;
- отвергнуть неизвестную площадку;
- разобрать дату и время;
- не разрешать дату в прошлом;
- проверить вместимость;
- разрешить только onsite или sbp;
- всегда брать user_id из g.user.id;
- создать статус new на сервере.

Ключевая часть:

~~~python
from datetime import date, time

from flask import abort, g, redirect, request, url_for

from .auth import login_required
from .models import Application, Room


@bp.route("/applications/new", methods=["GET", "POST"])
@login_required
def new_application():
    rooms = db.session.scalars(
        db.select(Room).order_by(Room.city, Room.name)
    ).all()
    errors = {}

    if request.method == "POST":
        room = db.session.get(Room, request.form.get("room_id", type=int))
        try:
            event_date = date.fromisoformat(request.form.get("event_date", ""))
            start_time = time.fromisoformat(request.form.get("start_time", ""))
            attendees = int(request.form.get("attendees", "0"))
        except (TypeError, ValueError):
            errors["form"] = "Проверьте дату, время и число участников."
            event_date = None
            start_time = None
            attendees = 0

        payment = request.form.get("payment_method", "")
        if room is None:
            errors["room_id"] = "Выберите помещение."
        if event_date is not None and event_date < date.today():
            errors["event_date"] = "Дата не может быть в прошлом."
        if room is not None and not 1 <= attendees <= room.capacity:
            errors["attendees"] = "Превышена вместимость помещения."
        if payment not in {"onsite", "sbp"}:
            errors["payment_method"] = "Выберите способ оплаты."

        if not errors:
            conference_name = request.form.get("conference_name", "").strip()
            if not 3 <= len(conference_name) <= 120:
                errors["conference_name"] = "От 3 до 120 символов."

        if not errors:
            application = Application(
                user_id=g.user.id,
                room_id=room.id,
                conference_name=conference_name,
                event_date=event_date,
                start_time=start_time,
                attendees=attendees,
                payment_method=payment,
                status="new",
            )
            db.session.add(application)
            db.session.commit()
            return redirect(url_for("portal.dashboard"))

    return render_template(
        "application_form.html",
        rooms=rooms,
        errors=errors,
    )
~~~

## Шаг 16. Сделайте личный кабинет

Ключевое условие — обычный пользователь видит только собственные заявки:

~~~python
@bp.get("/dashboard")
@login_required
def dashboard():
    applications = db.session.scalars(
        db.select(Application)
        .where(Application.user_id == g.user.id)
        .order_by(Application.created_at.desc())
    ).all()
    return render_template(
        "dashboard.html",
        applications=applications,
    )
~~~

Фильтрация только в шаблоне недостаточна. Ограничение по user_id должно находиться в SQL-запросе.

## Шаг 17. Сделайте административную панель

В admin.py:

~~~python
from flask import Blueprint, abort, redirect, render_template, request, url_for

from .auth import admin_required
from .extensions import db
from .models import Application


bp = Blueprint("admin", __name__, url_prefix="/admin")

ALLOWED_STATUSES = {"new", "scheduled", "completed"}


@bp.get("/")
@admin_required
def index():
    status = request.args.get("status", "")
    statement = db.select(Application)
    if status in ALLOWED_STATUSES:
        statement = statement.where(Application.status == status)

    sort_options = {
        "newest": Application.created_at.desc(),
        "date_asc": Application.event_date.asc(),
        "date_desc": Application.event_date.desc(),
    }
    sort_expression = sort_options.get(
        request.args.get("sort"),
        sort_options["newest"],
    )
    applications = db.session.scalars(
        statement.order_by(sort_expression)
    ).all()
    return render_template("admin.html", applications=applications)


@bp.post("/applications/<int:application_id>/status")
@admin_required
def update_status(application_id):
    status = request.form.get("status", "")
    if status not in ALLOWED_STATUSES:
        abort(400)

    application = db.get_or_404(Application, application_id)
    application.status = status
    db.session.commit()
    return redirect(url_for("admin.index"))
~~~

Для поиска и сортировки используйте заранее подготовленные выражения:

~~~python
sort_options = {
    "newest": Application.created_at.desc(),
    "date_asc": Application.event_date.asc(),
    "date_desc": Application.event_date.desc(),
}
sort_expression = sort_options.get(
    request.args.get("sort"),
    sort_options["newest"],
)
~~~

Не вставляйте необработанное значение sort из URL в ORDER BY.

## Шаг 18. Разрешите отзыв только после завершения

Сервер должен одновременно доказать три условия:

1. заявка принадлежит текущему пользователю;
2. статус заявки — completed;
3. отзыва ещё нет.

~~~python
from .models import Review


@bp.post("/applications/<int:application_id>/review")
@login_required
def add_review(application_id):
    application = db.session.scalar(
        db.select(Application).where(
            Application.id == application_id,
            Application.user_id == g.user.id,
        )
    )
    if application is None:
        abort(404)
    if application.status != "completed":
        abort(400, description="Мероприятие ещё не завершено.")
    if application.review is not None:
        abort(409, description="Отзыв уже оставлен.")

    rating = request.form.get("rating", type=int)
    comment = request.form.get("comment", "").strip()
    if rating not in range(1, 6) or not 10 <= len(comment) <= 500:
        abort(400, description="Проверьте оценку и комментарий.")

    db.session.add(
        Review(
            application_id=application.id,
            user_id=g.user.id,
            rating=rating,
            comment=comment,
        )
    )
    db.session.commit()
    return redirect(url_for("portal.dashboard"))
~~~

Даже при двух одновременных запросах UNIQUE в MySQL не даст создать второй отзыв. Если commit вызвал IntegrityError, сделайте rollback и верните понятный ответ.

## Шаг 19. Напишите тесты

Никогда не запускайте тесты, которые удаляют таблицы, против основной базы. Есть два безопасных варианта:

- отдельная база conference_rf_test, имя которой проверяется в фикстуре;
- SQLite в памяти для быстрых тестов моделей и маршрутов плюс отдельный smoke-тест миграций на временной MySQL-базе.

Пример tests/conftest.py для быстрых тестов:

~~~python
import pytest

from conference_portal import create_app
from conference_portal.extensions import db


@pytest.fixture()
def app():
    app = create_app(
        {
            "TESTING": True,
            "SECRET_KEY": "test-only",
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False,
        }
    )
    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()
~~~

Пример первого теста:

~~~python
def test_home_page(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Конференции.РФ" in response.get_data(as_text=True)
~~~

Общая фикстура выше отключает CSRF только затем, чтобы тесты бизнес-правил не извлекали токен из каждой формы. Саму защиту проверьте отдельным приложением, где она включена:

~~~python
def test_post_without_csrf_is_rejected():
    app = create_app(
        {
            "TESTING": True,
            "SECRET_KEY": "test-only",
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": True,
        }
    )
    with app.test_client() as client:
        response = client.post(
            "/auth/login",
            data={"username": "student1", "password": "password123"},
        )
    assert response.status_code == 400
~~~

Минимальный набор сценариев:

- неправильная и правильная регистрация;
- повторный логин;
- пароль хранится как хеш;
- вход администратора;
- обычный пользователь получает 403 на /admin;
- пользователь видит только свои заявки;
- превышение вместимости отклоняется;
- отзыв до завершения отклоняется;
- администратор завершает заявку;
- после завершения отзыв создаётся один раз;
- POST без CSRF получает 400;
- лимит частых попыток входа возвращает 429.

Запуск:

~~~bash
pytest -q
~~~

## Шаг 20. Запустите полный ручной сценарий

Запустите сервер:

~~~bash
flask --app app run --debug --port 5001
~~~

Проверьте по порядку:

1. Главная страница открывается.
2. Новый пользователь регистрируется.
3. Пароль в MySQL не совпадает с введённым текстом.
4. Пользователь входит и создаёт заявку.
5. В заявке автоматически стоит new.
6. Пользователь не может открыть /admin.
7. Администратор Conf2027 / Demo77 входит.
8. Администратор меняет статус на completed.
9. Пользователь оставляет отзыв.
10. Повторный отзыв отклоняется.

Полезные запросы для проверки:

~~~sql
SELECT id, username, is_admin, password_hash FROM users;
SELECT id, user_id, room_id, status FROM applications;
SELECT application_id, rating, comment FROM reviews;
~~~

Не публикуйте содержимое password_hash и реальные данные пользователей.

## Шаг 21. Как менять схему дальше

Например, вы добавили поле duration_minutes в Application:

~~~python
duration_minutes = db.Column(
    db.Integer,
    nullable=False,
    default=60,
    server_default="60",
)
~~~

Рабочий цикл:

~~~bash
flask --app app db migrate -m "add application duration"
~~~

Проверьте созданный revision, затем:

~~~bash
flask --app app db upgrade
pytest -q
~~~

Добавляйте каталог migrations в Git. На другом компьютере не нужно заново выполнять db init — достаточно получить migrations и запустить db upgrade.

## Типичные ошибки

| Ошибка | Причина | Исправление |
|---|---|---|
| Access denied for user | Неверный пользователь, пароль или права MySQL | Проверьте .env и GRANT для нужной базы |
| Unknown database | Ошибка в DB_NAME | Сверьте имя через SHOW DATABASES |
| Can't connect to MySQL server | Сервер выключен, неверный host или port | Запустите MySQL и проверьте 127.0.0.1:3306 |
| No module named pymysql | Драйвер установлен не в активное окружение | Активируйте .venv и повторите pip install |
| Working outside of application context | db используется без активного Flask-приложения | Работайте внутри маршрута, CLI-команды или with app.app_context() |
| Target database is not up to date | Есть неприменённые миграции | Выполните flask db current и flask db upgrade |
| migrate не видит моделей | models.py не импортирован при создании app | Импортируйте models после db.init_app |
| Повторный commit всегда падает | После IntegrityError не выполнен rollback | В блоке except вызовите db.session.rollback() |
| Кириллица отображается неверно | Соединение или база не используют utf8mb4 | Добавьте charset=utf8mb4 и проверьте кодировку базы |
| CSRF token is missing | В POST-форме нет скрытого csrf_token | Добавьте поле во все изменяющие формы |
| Address already in use | Порт занят другой программой | Используйте --port 5001 |
| Случайно удалились рабочие данные | Тесты или drop_all были направлены на основную БД | Используйте только отдельную тестовую БД и проверяйте её имя |

## Контрольный список готовности

- .env исключён из Git;
- приложение подключается не под root;
- база использует utf8mb4;
- модели импортируются до запуска миграции;
- начальная миграция проверена вручную;
- flask db upgrade создаёт четыре таблицы и alembic_version;
- seed можно запускать повторно без дубликатов;
- пароль хранится только как хеш;
- во всех POST-формах есть CSRF-токен;
- обычный пользователь не может открыть административные маршруты;
- пользователь получает только свои заявки;
- отзыв разрешён только к своей завершённой заявке;
- фильтры и сортировки используют белые списки;
- тесты никогда не очищают основную MySQL-базу;
- pytest проходит без ошибок.

## Как использовать готовую Flask-версию рядом

Рабочая копия в каталоге flask-version использует SQLite и один файл app.py, но бизнес-правила и интерфейс уже реализованы. Из неё удобно брать:

- Jinja-шаблоны из templates;
- стили, JavaScript, изображения и шрифты из static;
- правила валидации и тексты ошибок из app.py;
- сценарии из tests/test_app.py.

При переносе на MySQL заменяйте прямые sqlite3-запросы на модели и db.session из этого урока. Не копируйте schema.sql и не запускайте SQLite-команду init-db против MySQL.

## Официальные материалы

- [Flask: фабрика приложения](https://flask.palletsprojects.com/en/stable/tutorial/factory/)
- [Flask-SQLAlchemy: быстрый старт](https://flask-sqlalchemy.palletsprojects.com/en/stable/quickstart/)
- [Flask-Migrate: init, migrate и upgrade](https://flask-migrate.readthedocs.io/en/latest/)
- [SQLAlchemy: подключение к MySQL и utf8mb4](https://docs.sqlalchemy.org/en/20/dialects/mysql.html)
- [Flask: переменные окружения и dotenv](https://flask.palletsprojects.com/en/stable/cli/)
- [Flask-WTF: CSRF-защита](https://flask-wtf.readthedocs.io/en/latest/csrf/)
- [Flask-Limiter: ограничение частоты запросов](https://flask-limiter.readthedocs.io/en/stable/)
- [Flask: тестирование приложений](https://flask.palletsprojects.com/en/stable/testing/)
