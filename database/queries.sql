-- ========================================================
-- ТЕСТОВІ ТА АНАЛІТИЧНІ ЗАПИТИ ДО БАЗИ ДАНИХ
-- ========================================================

-- Запит 1: Публічний трекінг замовлення клієнтом за трек-кодом
SELECT 
    o.order_number AS "№ Замовлення",
    o.tracking_code AS "Трек-код",
    o.status AS "Статус",
    d.brand || ' ' || d.model AS "Пристрій",
    c.full_name AS "Клієнт",
    COALESCE(u.full_name, 'Не призначено') AS "Майстер",
    o.total_cost AS "До сплати (грн)"
FROM orders o
JOIN clients c ON o.client_id = c.id
JOIN devices d ON o.device_id = d.id
LEFT JOIN users u ON o.technician_id = u.id
WHERE o.tracking_code = 'TRK-B2C44E';

-- Запит 2: Деталізований кошторис (роботи + деталі) для замовлення
SELECT 
    'Послуга: ' || s.name AS "Стаття витрат",
    os.price AS "Вартість (грн)"
FROM order_services os
JOIN services s ON os.service_id = s.id
WHERE os.order_id = 2
UNION ALL
SELECT 
    'Деталь: ' || sp.name || ' (' || op.quantity || ' шт.)' AS "Стаття витрат",
    (op.unit_price * op.quantity) AS "Вартість (грн)"
FROM order_parts op
JOIN spare_parts sp ON op.spare_part_id = sp.id
WHERE op.order_id = 2;

-- Запит 3: Залишки на складі та оцінка капіталізації
SELECT 
    sku AS "Артикул",
    name AS "Назва запчастини",
    category AS "Категорія",
    stock_quantity AS "Залишок (шт)",
    min_stock_limit AS "Мін. ліміт",
    purchase_price AS "Ціна закуп. (грн)",
    retail_price AS "Ціна прод. (грн)",
    (stock_quantity * purchase_price) AS "Капіталізація складу (грн)"
FROM spare_parts
ORDER BY stock_quantity ASC;
