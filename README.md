# Інформаційна система управління замовленнями сервісного центру (RepairHub)

**Варіант № 19** для курсової та дипломної роботи зі спеціальності **121 Інженерія програмного забезпечення**.

## Технологічний стек
- **Backend:** Java 21, Spring Boot 3 (Spring Data JPA, Spring Security, JWT)
- **Frontend:** React (TypeScript, Vite, Tailwind CSS)
- **Database:** PostgreSQL 16 (Relational + JSONB support)
- **DevOps:** Docker, Docker Compose, Git

## Структура репозиторію
```
service-center-system/
├── backend/          # Серверна частина (Java Spring Boot)
├── frontend/         # Клієнтська частина (React SPA)
└── database/         # Скрипти бази даних
    ├── schema.sql    # DDL: Створення таблиць, індексів та обмежень
    ├── seed_data.sql # DML: Тестові дані (користувачі, замовлення, запчастини)
    └── queries.sql   # Зразки аналітичних та операційних запитів
```

## Підключення до бази даних
- **Host:** `localhost` (порт 5432)
- **Database:** `service_center_db`
- **User:** `devuser`
- **Password:** `devpassword`
