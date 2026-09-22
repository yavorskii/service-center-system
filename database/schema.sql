-- ========================================================
-- ІНФОРМАЦІЙНА СИСТЕМА УПРАВЛІННЯ СЕРВІСНИМ ЦЕНТРОМ
-- Варіант № 19: DDL Скрипт створення бази даних
-- СУБД: PostgreSQL 16
-- ========================================================

-- Видалення таблиць за необхідності (каскадно)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_parts CASCADE;
DROP TABLE IF EXISTS order_services CASCADE;
DROP TABLE IF EXISTS spare_parts CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Таблиця користувачів системи (персонал: адміністратори, менеджери, майстри)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_TECHNICIAN')),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблиця клієнтів сервісного центру
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Таблиця пристроїв (техніка, що здається на ремонт)
CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    device_type VARCHAR(50) NOT NULL, -- Ноутбук, Смартфон, Планшет тощо
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    imei VARCHAR(20),
    appearance_notes TEXT, -- подряпини, тріщини тощо
    specs_json JSONB,      -- гнучкі характеристики (RAM, SSD, колір)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Таблиця замовлень на ремонт
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE, -- Наприклад: 'SRV-2026-0001'
    tracking_code VARCHAR(32) NOT NULL UNIQUE, -- Для публічного онлайн-трекінгу
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    technician_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (
        status IN ('NEW', 'IN_DIAGNOSTICS', 'PENDING_APPROVAL', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELED')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (
        priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
    ),
    defect_description TEXT NOT NULL,
    diagnostics_notes TEXT,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    total_cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Довідник послуг сервісного центру
CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    standard_price NUMERIC(10, 2) NOT NULL CHECK (standard_price >= 0)
);

-- 6. Перелік виконаних робіт/послуг у замовленні
CREATE TABLE order_services (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    technician_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Складський облік запчастин
CREATE TABLE spare_parts (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    retail_price NUMERIC(10, 2) NOT NULL CHECK (retail_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock_limit INT NOT NULL DEFAULT 2
);

-- 8. Списані запчастини під конкретне замовлення
CREATE TABLE order_parts (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    spare_part_id BIGINT NOT NULL REFERENCES spare_parts(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Фіксація платежів за замовленням
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'BANK_TRANSFER')),
    transaction_ref VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для оптимізації типових запитів
CREATE INDEX idx_orders_tracking_code ON orders(tracking_code);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_spare_parts_sku ON spare_parts(sku);
