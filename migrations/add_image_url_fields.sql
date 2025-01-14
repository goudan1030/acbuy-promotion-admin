-- 添加图片URL字段
alter table traffic_products
add column if not exists image_url text,
add column if not exists qc_image_url text;

comment on column traffic_products.image_url is '商品图片URL（可选）';
comment on column traffic_products.qc_image_url is 'QC图片URL（可选）'; 