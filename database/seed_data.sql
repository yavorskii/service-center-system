-- ========================================================
-- ІНФОРМАЦІЙНА СИСТЕМА УПРАВЛІННЯ СЕРВІСНИМ ЦЕНТРОМ
-- Тестові дані (Seed Data) та перевірочні запити
-- ========================================================

-- 1. Персонал сервісу
INSERT INTO users (username, password_hash, full_name, role, phone) VALUES
('admin_oleg', '$2a$12$e8Yx2UfK9vM1eL...', 'Олег Петренко', 'ROLE_ADMIN', '+380501112233'),
('mgr_alina', '$2a$12$K1jL9kM2nB4vC5...', 'Аліна Ковальчук', 'ROLE_MANAGER', '+380672223344'),
('tech_taras', '$2a$12$P9mN3bV5cZ7xQ8...', 'Тарас Бондаренко', 'ROLE_TECHNICIAN', '+380633334455'),
('tech_dmytro', '$2a$12$L4kM8jN6bV2xC1...', 'Дмитро Мельник', 'ROLE_TECHNICIAN', '+380994445566');

-- 2. Клієнти
INSERT INTO clients (full_name, phone, email, address, notes) VALUES
('Іван Сидоренко', '+380671234567', 'ivan.sydor@gmail.com', 'м. Київ, вул. Хрещатик, 10', 'Постійний клієнт, знижка 5%'),
('Марія Василенко', '+380509876543', 'mariya.vas@ukr.net', 'м. Львів, пр. Свободи, 24', 'Корпоративний клієнт (ТОВ Альфа)'),
('Сергій Павленко', '+380631122334', 'serg.p@gmail.com', 'м. Дніпро, вул. Січових Стрільців, 5', 'Новий клієнт');

-- 3. Пристрої
INSERT INTO devices (client_id, device_type, brand, model, serial_number, imei, appearance_notes, specs_json) VALUES
(1, 'Ноутбук', 'Asus', 'ROG Zephyrus G14', 'SN-ASUS-98231', NULL, 'Дрібні подряпини на верхній кришці', '{"cpu": "Ryzen 9", "ram": "16GB", "ssd": "1TB"}'),
(2, 'Смартфон', 'Apple', 'iPhone 13 Pro', 'SN-APPL-77123', '356987123456789', 'Тріщина на склі дисплея, камери цілі', '{"color": "Sierra Blue", "storage": "256GB", "battery_health": "86%"}'),
(3, 'Планшет', 'Samsung', 'Galaxy Tab S8', 'SN-SAMS-44190', '359871029384756', 'Стан ідеальний, не вмикається після води', '{"color": "Graphite", "lte": true}');

-- 4. Замовлення
INSERT INTO orders (order_number, tracking_code, client_id, device_id, technician_id, status, priority, defect_description, diagnostics_notes, estimated_cost, total_cost, completed_at) VALUES
('SRV-2026-0001', 'TRK-A8F91B', 1, 1, 3, 'IN_PROGRESS', 'MEDIUM', 'Перегрівається під навантаженням, шум вентиляторів', 'Забруднення радіатора, пересихання термопасти. Потрібна чистка та заміна термоінтерфейсу.', 850.00, 850.00, NULL),
('SRV-2026-0002', 'TRK-B2C44E', 2, 2, 4, 'READY_FOR_PICKUP', 'HIGH', 'Розбитий екран, сенсор не реагує у верхній частині', 'Пошкоджена матриця. Замінено оригінальний екранний модуль.', 4800.00, 4800.00, CURRENT_TIMESTAMP),
('SRV-2026-0003', 'TRK-F7D33A', 3, 3, 3, 'NEW', 'URGENT', 'Потрапила волога, перестав заряджатися', 'Прийнято на термінову діагностику.', 500.00, 0.00, NULL);

-- 5. Довідник послуг
INSERT INTO services (name, description, standard_price) VALUES
('Комплексна чистка та заміна термопасти', 'Розбирання, видалення пилу, нанесення високопровідної термопасти', 600.00),
('Заміна дисплейного модуля смартфона', 'Демонтаж пошкодженого екрана, проклейка та калібрування сенсора', 800.00),
('Ультразвукова чистка плати після рідини', 'Сушка, видалення оксидів в ультразвуковій ванні', 700.00),
('Апаратна діагностика вузлів', 'Тестування живлення та компонентів материнської плати', 250.00);

-- 6. Виконані роботи у замовленнях
INSERT INTO order_services (order_id, service_id, technician_id, price, status) VALUES
(1, 1, 3, 600.00, 'COMPLETED'),
(2, 2, 4, 800.00, 'COMPLETED');

-- 7. Складські запчастини
INSERT INTO spare_parts (sku, name, category, purchase_price, retail_price, stock_quantity, min_stock_limit) VALUES
('TH-MX4-4G', 'Термопаста Arctic MX-4 (4г)', 'Витратні матеріали', 150.00, 250.00, 15, 3),
('DISP-IPH13P-OEM', 'Дисплейний модуль iPhone 13 Pro (OEM)', 'Дисплеї', 2800.00, 4000.00, 4, 1),
('BAT-SAM-S8', 'Акумулятор Samsung Galaxy Tab S8', 'Акумулятори', 900.00, 1400.00, 6, 2),
('CON-TYPEC-GEN', 'Роз''єм живлення USB Type-C', 'Роз''єми', 40.00, 120.00, 50, 10);

-- 8. Списання запчастин під замовлення
INSERT INTO order_parts (order_id, spare_part_id, quantity, unit_price) VALUES
(1, 1, 1, 250.00),
(2, 2, 1, 4000.00);

-- 9. Платежі
INSERT INTO payments (order_id, amount, payment_method, transaction_ref) VALUES
(2, 4800.00, 'CARD', 'TXN-MONO-8837192');
