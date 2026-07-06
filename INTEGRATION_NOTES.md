# Банкны ханш feature — нэгтгэх заавар

## 1. Supabase (нэг удаа)
1. Supabase Dashboard → SQL Editor → `sql/001_bank_rates.sql`-ийн агуулгыг бүтнээр нь paste хийж **Run**.
2. Dashboard → Settings → API → **service_role** key-г хуулж ав (нууц, хэзээ ч client код/GitHub-д бичихгүй!).

## 2. Vercel Environment Variables (нэг удаа)
Vercel project → Settings → Environment Variables дээр нэмнэ:

| Key | Утга |
|---|---|
| `SUPABASE_URL` | `https://gbjwxuvrkuopfcrnxwvs.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase-с хуулсан service_role key |
| `CRON_SECRET` | Санамсаргүй урт мөр, жишээ: `openssl rand -hex 32`-ээр үүсгэсэн утга |

⚠️ Нэмсний дараа **гараар Redeploy хийх** (лавлагаанд заасны дагуу автомат redeploy болдоггүй).

## 3. Файл нэмэх (GitHub UI-ээр)
- `api/bank-rates-sync.js` → GitHub дээр "Add file" → "Create new file" → зам: `api/bank-rates-sync.js`
- `bank-rates.js` → repo-ийн үндсэн (root) хэсэгт
- `sql/001_bank_rates.sql` → зөвхөн лавлагаанд зориулсан, repo-д хадгалж болно (`sql/001_bank_rates.sql`), эсвэл зөвхөн Supabase дээр ажиллуулаад устгаж болно

## 4. `style.css`-д нэмэх
`bank-rates.css`-ийн агуулгыг `style.css`-ийн төгсгөлд paste хийнэ (эсвэл тусад нь холбож болно).

## 5. `index.html`-д нэмэх

### (а) `<head>` эсвэл style холболтын хэсэгт өөрчлөлт хийхгүй (style.css дотор нэмсэн тул хангалттай).

### (б) Харьцуулах блокийг харуулах хэсэгт (жишээ нь indices/ticker блокийн дараа) нэмнэ:

```html
<section class="bank-rates-section">
  <h2 data-i18n="bankRatesTitle">Банкны ханшийн харьцуулалт</h2>
  <div id="bankRatesContainer">
    <p class="bank-rates-error">Ачаалж байна...</p>
  </div>
</section>
```

### (в) Script tag-уудын **төгсгөлд**, `supabase-client.js`-ийн ДАРАА нэмнэ:

```html
<script src="supabase-client.js"></script>
<!-- ... одоо байгаа бусад script tag-ууд ... -->
<script src="bank-rates.js"></script>
```

(Лавлагаанд дурдсан сургамж #10-ийн дагуу — шинэ script файл бүрд tag заавал нэмэгдсэн эсэхийг шалгах ёстой, эс бөгөөс `sb is not defined` гэх мэт алдаа гарна.)

## 6. `vercel.json` — Cron тохиргоо

Хэрэв `vercel.json` байхгүй бол repo-ийн root-д шинээр үүсгэнэ (байгаа бол `crons` хэсгийг нэгтгэнэ):

```json
{
  "crons": [
    {
      "path": "/api/bank-rates-sync",
      "schedule": "0 1,10 * * *"
    }
  ]
}
```

- `0 1,10 * * *` = UTC-гээр 01:00 ба 10:00 → Улаанбаатарын цагаар (UTC+8) **09:00 ба 18:00** (өглөө/орой).
- Vercel Cron нь дуудахдаа `Authorization: Bearer <CRON_SECRET>` header-г **автоматаар нэмдэггүй** тул одоогийн `bank-rates-sync.js` код дотор CRON_SECRET шалгалтыг Vercel-ийн албан ёсны `x-vercel-cron` эсвэл өөрийн CRON_SECRET query param-аар шалгах хувилбар руу тохируулж болно — Vercel-ийн баримт бичгээс "Securing Cron Jobs" хэсгийг үзээрэй.
- ⚠️ Vercel Cron нь **Hobby (үнэгүй) төлөвлөгөөнд** зөвхөн **өдөрт 1 удаа** ажиллах хязгаартай байж болзошгүй тул (Pro-с дээш нь минут/цагийн давтамжтай) — хэрэв "0 1,10 * * *" (өдөрт 2 удаа) ажиллахгүй бол Vercel dashboard-с Cron Jobs хэсгийг шалгаарай.

## 7. Гараар тест хийх
Deploy хийсний дараа browser эсвэл curl-аар:
```
curl -H "Authorization: Bearer <CRON_SECRET>" https://stock-crypto-site.vercel.app/api/bank-rates-sync
```
Хариу дотор `sources` талбарт банк тус бүр `ok: true/false` гэж харагдана — аль нь амжилтгүй болсныг шууд харна.

## 8. Мэдэгдэж буй дутагдал / дараагийн ажил
- Ариг, Төрийн банк, Капитрон, Богд, Чингис хаан, ҮХОБанк, ТрансБанк — endpoint олдоогүй, дараа нэмэгдэнэ
- TDB болон XacBank-ийн parse логик нь HTML бүтэц дээр тулгуурласан тул хамгийн эмзэг (fragile) — банкны сайт шинэчлэгдвэл эвдэрч болзошгүй, `sources` талбараар алдааг барих боломжтой
