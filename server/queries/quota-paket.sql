-- Quota & pax per paket umroh (for Alburaq Countdown Dashboard)
-- Adapted from: docs/Contoh Query Notif Quota Paket.sql
-- Returns one row per package (or per group_product if set)

WITH
odoo_products AS (
  SELECT
    p.id AS product_id,
    COALESCE(p.name->>'id_ID', p.name->>'en_US') AS product_name,
    p.default_code,
    p.departure_date,
    p.return_date,
    p.quota,
    p.quota_male,
    p.quota_female,
    NULLIF(TRIM(p.group_product), '') AS group_product,
    p.product_code,
    p.list_price
  FROM product_template p
  WHERE p.is_umrah_product IS TRUE
    AND p.sale_ok IS TRUE
    AND p.departure_date > CURRENT_DATE
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
gender_counts AS (
  SELECT
    uq.paket_umrah_id AS product_id,
    SUM(CASE WHEN uqj.gender = 'male' THEN 1 ELSE 0 END)::int AS pax_male,
    SUM(CASE WHEN uqj.gender = 'female' THEN 1 ELSE 0 END)::int AS pax_female
  FROM umrah_quotation_jamaah uqj
  JOIN umrah_quotation uq ON uq.id = uqj.quotation_id
  WHERE uqj.gender IS NOT NULL
    AND uq.state IN ('accepted', 'fully_paid')
    AND uqj.is_refunded IS NOT TRUE
    AND uqj.is_wait_list IS NOT TRUE
  GROUP BY uq.paket_umrah_id
),
grouped AS (
  SELECT
    CASE WHEN op.group_product IS NOT NULL THEN op.group_product ELSE op.product_name END AS product_name,
    op.product_code,
    MAX(op.quota)::int AS quota,
    SUM(COALESCE(mp.pax_mekari, 0))::int AS pax_mekari,
    SUM(COALESCE(mp.waiting_list_pax, 0))::int AS waiting_list_pax,
    MIN(op.departure_date) AS first_departure_date,
    MIN(op.return_date) AS first_return_date,
    MAX(op.list_price)::numeric AS list_price,
    MAX(op.quota_male)::int AS quota_male,
    MAX(op.quota_female)::int AS quota_female,
    SUM(COALESCE(gc.pax_male, 0))::int AS pax_male,
    SUM(COALESCE(gc.pax_female, 0))::int AS pax_female,
    MIN(op.product_id) AS product_id
  FROM odoo_products op
  LEFT JOIN mekari_per_product mp ON mp.product_id = op.product_id
  LEFT JOIN gender_counts gc ON gc.product_id = op.product_id
  WHERE CASE
    WHEN op.group_product IS NOT NULL THEN op.group_product ELSE op.product_name END NOT IN (
      'Lion CGK,SUB,YIA Umrah Sya''ban 1447 H (9D)',
      'LA Umrah Awal Ramadan 1447 H',
      'Lion, Garuda Awal Ramadhan'
    )
  GROUP BY
    CASE WHEN op.group_product IS NOT NULL THEN op.group_product ELSE op.product_name END,
    op.product_code
)
SELECT
  product_id,
  product_name,
  product_code,
  quota,
  pax_mekari,
  waiting_list_pax,
  first_departure_date,
  first_return_date,
  list_price,
  quota_male,
  quota_female,
  pax_male,
  pax_female
FROM grouped
ORDER BY first_departure_date;