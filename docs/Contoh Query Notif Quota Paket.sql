
WITH
odoo_products AS (
  SELECT 
    p.id AS product_id,
    COALESCE(p.name->>'id_ID', p.name->>'en_US') AS product_name,
    p.default_code,
    p.departure_date,
    p.quota,
    p.quota_male,
    p.quota_female,
    NULLIF(TRIM(p.group_product), '') AS group_product,
    p.product_code
  FROM product_template p
  WHERE p.is_umrah_product IS TRUE
    AND p.sale_ok IS TRUE
    AND p.departure_date > CURRENT_DATE
),
owais_occ AS (
  SELECT jra.product_id, COUNT(DISTINCT jra.jamaah_id) AS raw_occupancy_owais
  FROM jamaah_room_assignment jra
  JOIN hotel_room hr ON hr.id = jra.room_id
  JOIN res_partner h ON h.id = hr.hotel_id
  WHERE h.name ILIKE '%owais%'
  GROUP BY jra.product_id
),
odoo_keys AS (
  SELECT DISTINCT product_id, key_norm
  FROM (
    SELECT p.id AS product_id, REGEXP_REPLACE(LOWER(TRIM(COALESCE(p.name->>'id_ID',''))), '\s+', ' ', 'g') AS key_norm
    FROM product_template p JOIN odoo_products op ON op.product_id = p.id
    UNION ALL
    SELECT p.id, REGEXP_REPLACE(LOWER(TRIM(COALESCE(p.name->>'en_US',''))), '\s+', ' ', 'g')
    FROM product_template p JOIN odoo_products op ON op.product_id = p.id
    UNION ALL
    SELECT p.id, REGEXP_REPLACE(LOWER(TRIM(COALESCE(p.default_code,''))), '\s+', ' ', 'g')
    FROM product_template p JOIN odoo_products op ON op.product_id = p.id
  ) k WHERE key_norm <> ''
),
mekari_lines_norm AS (
  SELECT
    REGEXP_REPLACE(LOWER(TRIM(line->'product'->>'name')), '\s+', ' ', 'g') AS name_norm,
    COALESCE(NULLIF(TRIM(line->>'quantity'), '')::numeric, 1) AS qty,
    (LOWER(COALESCE(mor.raw_data->>'tags_string','')) ~ 'waiting\s*list|waitinglist'
     OR LOWER(COALESCE(mor.raw_data->>'message',''))  ~ 'wait(ing)?\s*list') AS is_waitlist
  FROM mekari_orders_refreshed mor
  CROSS JOIN LATERAL jsonb_path_query(mor.raw_data, '$.transaction_lines_attributes[*]') AS line
  WHERE mor.deleted_at IS NULL
    AND (mor.raw_data->>'kind') IN ('Sales Order','Sales Invoice')
    AND (mor.raw_data->'transaction_status'->>'name') = 'Open'
    AND line->'product'->>'name' IS NOT NULL
),
mekari_by_name AS (
  SELECT name_norm,
         SUM(CASE WHEN NOT is_waitlist THEN qty ELSE 0 END)::int AS pax_mekari,
         SUM(CASE WHEN is_waitlist THEN qty ELSE 0 END)::int AS waiting_list_pax
  FROM mekari_lines_norm GROUP BY name_norm
),
mekari_mapped AS (
  SELECT DISTINCT ok.product_id, mbn.pax_mekari, mbn.waiting_list_pax
  FROM mekari_by_name mbn JOIN odoo_keys ok ON mbn.name_norm = ok.key_norm
),
mekari_per_product AS (
  SELECT product_id, SUM(pax_mekari)::int AS pax_mekari, SUM(waiting_list_pax)::int AS waiting_list_pax
  FROM mekari_mapped GROUP BY product_id
),
q_jamaah_by_product AS (
  SELECT uq.product_id, COUNT(*)::int AS quotation_jamaah
  FROM umrah_quotation_jamaah uqj JOIN umrah_quotation uq ON uq.id = uqj.quotation_id
  GROUP BY uq.product_id
),
gender_counts AS (
  SELECT 
    uq.paket_umrah_id AS product_id,
    SUM(CASE WHEN uqj.gender = 'male' THEN 1 ELSE 0 END)::int AS pax_male,
    SUM(CASE WHEN uqj.gender = 'female' THEN 1 ELSE 0 END)::int AS pax_female
  FROM umrah_quotation_jamaah uqj
  JOIN umrah_quotation uq ON uq.id = uqj.quotation_id
  WHERE uqj.gender IS NOT NULL
    AND uq.state IN ('accepted', 'fully_paid')
  GROUP BY uq.paket_umrah_id
)
SELECT
  CASE WHEN op.group_product IS NOT NULL THEN op.group_product ELSE op.product_name END AS product_name,
  date_trunc('month', MIN(op.departure_date))::date AS month_start,
  to_char(date_trunc('month', MIN(op.departure_date)), 'YYYY-MM') AS month_key,
  to_char(MIN(op.departure_date), 'FMMonth YYYY') AS month_label,
  CASE 
    WHEN MIN(op.departure_date) > DATE '2026-02-10' 
     AND MIN(op.departure_date) < DATE '2026-03-25'
      THEN 'Ramadhan 2026'
    ELSE to_char(MIN(op.departure_date), 'FMMonth YYYY')
  END AS notif_group_label,
  CASE 
    WHEN MIN(op.departure_date) > DATE '2026-02-10' 
     AND MIN(op.departure_date) < DATE '2026-03-25'
      THEN 'ramadhan-2026'
    ELSE to_char(date_trunc('month', MIN(op.departure_date)), 'YYYY-MM')
  END AS notif_group_key,
  CASE 
    WHEN MIN(op.departure_date) > DATE '2026-02-10' 
     AND MIN(op.departure_date) < DATE '2026-03-25'
      THEN DATE '2026-02-10'
    ELSE date_trunc('month', MIN(op.departure_date))::date
  END AS notif_group_order,
  MAX(op.quota)::int AS quota,
  SUM(COALESCE(mp.pax_mekari, 0))::int AS pax_mekari,
  SUM(COALESCE(mp.waiting_list_pax, 0))::int AS waiting_list_pax,
  MIN(op.departure_date) AS first_departure_date,
  MAX(op.quota_male)::int AS quota_male,
  MAX(op.quota_female)::int AS quota_female,
  SUM(COALESCE(gc.pax_male, 0))::int AS pax_male,
  SUM(COALESCE(gc.pax_female, 0))::int AS pax_female,
  op.product_code
FROM odoo_products op
LEFT JOIN mekari_per_product mp ON mp.product_id = op.product_id
LEFT JOIN q_jamaah_by_product qp ON qp.product_id = op.product_id
LEFT JOIN owais_occ oo ON oo.product_id = op.product_id
LEFT JOIN gender_counts gc ON gc.product_id = op.product_id
WHERE CASE 
  WHEN op.group_product IS NOT NULL THEN op.group_product ELSE op.product_name END NOT IN (
    'Lion CGK,SUB,YIA Umrah Sya''ban 1447 H (9D)',
    'LA Umrah Awal Ramadan 1447 H',
    'Lion, Garuda Awal Ramadhan'
  )
GROUP BY CASE WHEN op.group_product IS NOT NULL THEN op.group_product ELSE op.product_name END, op.product_code
ORDER BY notif_group_order, product_name;