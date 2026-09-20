# ER-диаграмма

~~~mermaid
erDiagram
    USERS ||--o{ APPLICATIONS : "создаёт"
    ROOMS ||--o{ APPLICATIONS : "выбрано в"
    USERS ||--o{ REVIEWS : "пишет"
    APPLICATIONS ||--o| REVIEWS : "получает"

    USERS {
        INTEGER id PK
        TEXT username UK
        TEXT password_hash
        TEXT full_name
        TEXT phone
        TEXT email UK
        INTEGER is_admin
        TEXT created_at
    }
    ROOMS {
        INTEGER id PK
        TEXT name UK
        TEXT category
        TEXT city
        TEXT address
        INTEGER capacity
        INTEGER hourly_rate
        TEXT image
        TEXT description
        TEXT equipment
    }
    APPLICATIONS {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER room_id FK
        TEXT conference_name
        TEXT event_date
        TEXT start_time
        INTEGER attendees
        TEXT payment_method
        TEXT status
        TEXT created_at
        TEXT updated_at
    }
    REVIEWS {
        INTEGER id PK
        INTEGER application_id FK
        INTEGER user_id FK
        INTEGER rating
        TEXT comment
        TEXT created_at
    }
~~~

Один пользователь создаёт много заявок; одна площадка фигурирует во многих заявках. У заявки может быть не более одного отзыва благодаря UNIQUE application_id. Сервер разрешает отзыв только автору собственной завершённой заявки. CHECK-условия в schema.sql закрепляют допустимые категории, способы оплаты, статусы и оценки; внешние ключи включаются через PRAGMA foreign_keys = ON.
