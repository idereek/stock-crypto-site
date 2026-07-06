-- ============================================================
-- "Зоос" — Банкны ханшийн харьцуулалт: bank_rates хүснэгт
-- Supabase Dashboard → SQL Editor-д энэ файлыг бүтнээр нь paste хийж Run дарна
-- ============================================================

create table if not exists public.bank_rates (
  id                bigint generated always as identity primary key,
  bank              text not null,        -- жишээ: 'golomt', 'khaan', 'xac', 'tdb', 'mongolbank'
  bank_name_mn      text not null,        -- жишээ: 'Голомт банк'
  currency          text not null,        -- жишээ: 'USD', 'EUR', 'CNY'
  buy_cash          numeric,              -- бэлэн авах
  sell_cash         numeric,              -- бэлэн зарах
  buy_noncash       numeric,              -- бэлэн бус авах
  sell_noncash      numeric,              -- бэлэн бус зарах
  official          numeric,              -- Монголбанкны албан ханш (mongolbank мөрөнд л утгатай)
  updated_at        timestamptz not null default now(),
  unique (bank, currency)
);

-- Public (anon) хэрэглэгч зөвхөн УНШИХ эрхтэй, бичих эрхгүй
alter table public.bank_rates enable row level security;

drop policy if exists "bank_rates_public_read" on public.bank_rates;
create policy "bank_rates_public_read"
  on public.bank_rates
  for select
  to anon, authenticated
  using (true);

-- Бичихийг зөвхөн service_role (Vercel serverless function-с) хийнэ,
-- тул INSERT/UPDATE policy тусад нь нэмэхгүй — service_role нь RLS-ийг bypass хийдэг.

create index if not exists bank_rates_currency_idx on public.bank_rates (currency);
