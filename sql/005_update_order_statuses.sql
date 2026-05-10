ALTER TABLE :schema.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE :schema.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'received', 'cancelled'));

UPDATE :schema.orders SET status = 'accepted' WHERE status = 'confirmed';
