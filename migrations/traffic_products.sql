-- 检查并创建 images 表（如果不存在）
create table if not exists images (
  id bigint primary key generated by default as identity,
  file_name text not null,              -- 文件名 (时间戳+随机字符串)
  file_path text not null,              -- 存储路径
  public_url text not null,             -- 公开访问URL
  file_size bigint not null,            -- 文件大小(bytes)
  mime_type text not null,              -- 文件类型
  bucket_name text not null default 'traffic-products', -- 存储桶名称
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 检查并创建导流商品表（如果不存在）
create table if not exists traffic_products (
  id bigint primary key generated by default as identity,
  name text not null,                    -- 商品标题
  category text not null,                -- 商品分类
  current_price numeric not null,        -- 商品价格
  image_id bigint references images(id), -- 商品图片ID
  qc_image_id bigint references images(id), -- QC图片ID
  purchase_link text not null,           -- 购买链接
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 检查并启用 RLS（如果未启用）
do $$ 
begin
  -- 检查 images 表的 RLS
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
    and c.relname = 'images'
    and c.relrowsecurity = true
  ) then
    alter table images enable row level security;
  end if;

  -- 检查 traffic_products 表的 RLS
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
    and c.relname = 'traffic_products'
    and c.relrowsecurity = true
  ) then
    alter table traffic_products enable row level security;
  end if;
end $$;

-- 检查并创建策略（如果不存在）
do $$ 
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'images' 
    and policyname = '允许已认证用户进行所有操作'
  ) then
    create policy "允许已认证用户进行所有操作" on images
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'traffic_products' 
    and policyname = '允许已认证用户进行所有操作'
  ) then
    create policy "允许已认证用户进行所有操作" on traffic_products
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- 检查并创建存储桶（如果不存在）
do $$ 
begin
  if not exists (
    select 1 from storage.buckets 
    where id = 'traffic-products'
  ) then
    insert into storage.buckets (id, name, public)
    values ('traffic-products', 'traffic-products', true);
  end if;
end $$;

-- 检查并创建存储桶策略（如果不存在）
do $$ 
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = '允许公共访问图片'
  ) then
    create policy "允许公共访问图片" on storage.objects
      for select
      to public
      using (bucket_id = 'traffic-products');
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = '允许已认证用户上传图片'
  ) then
    create policy "允许已认证用户上传图片" on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'traffic-products');
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = '允许已认证用户删除图片'
  ) then
    create policy "允许已认证用户删除图片" on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'traffic-products');
  end if;
end $$;

-- 检查并创建触发器函数（如果不存在）
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 检查并创建触发器（如果不存在）
do $$ 
begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'update_traffic_products_updated_at'
  ) then
    create trigger update_traffic_products_updated_at
      before update on traffic_products
      for each row
      execute function update_updated_at_column();
  end if;
end $$;

-- 检查并创建索引（如果不存在）
do $$ 
begin
  if not exists (
    select 1 from pg_indexes 
    where schemaname = 'public' 
    and tablename = 'traffic_products' 
    and indexname = 'idx_traffic_products_category'
  ) then
    create index idx_traffic_products_category on traffic_products(category);
  end if;

  if not exists (
    select 1 from pg_indexes 
    where schemaname = 'public' 
    and tablename = 'traffic_products' 
    and indexname = 'idx_traffic_products_created_at'
  ) then
    create index idx_traffic_products_created_at on traffic_products(created_at desc);
  end if;

  if not exists (
    select 1 from pg_indexes 
    where schemaname = 'public' 
    and tablename = 'images' 
    and indexname = 'idx_images_bucket_name'
  ) then
    create index idx_images_bucket_name on images(bucket_name);
  end if;
end $$;

-- 更新注释
comment on table traffic_products is '导流商品表';
comment on table images is '图片资源表';
comment on column traffic_products.name is '商品标题';
comment on column traffic_products.category is '商品分类';
comment on column traffic_products.current_price is '商品价格';
comment on column traffic_products.image_id is '商品图片ID';
comment on column traffic_products.qc_image_id is 'QC图片ID';
comment on column traffic_products.purchase_link is '购买链接'; 