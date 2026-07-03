# Зоос — MVP терминал

## Юу бэлэн болсон бэ?
- 100% Монгол хэл дээрх UI
- Ticker/нэрээр хайх (Монгол + Англи хоёуланг ойлгоно)
- Крипто (BTC, ETH, SOL, BNB, XRP, DOGE) — **CoinGecko-с шууд live үнэ, 7 хоногийн график** (API key шаардлагагүй, 100% үнэгүй)
- Хувьцаа (AAPL, TSLA, GOOGL, AMZN, MSFT, NVDA) — одоохондоо demo тоо (доор тайлбарласан)
- Дээд талын гүйдэг ticker tape
- Мэдээний жишээ блок (Монгол хэлээр)
- Framework, build tool, backend огт байхгүй → deploy хийхэд секундын хэрэг

## Локал дээр шалгах
Аль ч browser дээр `index.html`-г шууд нээхэд ажиллана. Эсвэл:
```
cd mn-trade-site
python3 -m http.server 8000
```
`http://localhost:8000` нээнэ.

## Vercel дээр deploy хийх (санал болгож буй, хамгийн хялбар)
1. GitHub дээр шинэ repo үүсгэж энэ folder-ийг push хийнэ.
2. https://vercel.com → "Add New Project" → GitHub repo-гоо сонгоно.
3. Framework Preset: **Other** (build command хоосон, output directory: `.`)
4. Deploy дарна — 30 секундэд бэлэн болно.
5. "Settings → Domains" хэсэгт өөрийн авсан домайноо холбоно (жишээ: zoos.mn).

**Netlify** ашиглах бол: "Add new site → Deploy manually" → folder-оо чирж оруулаад л дуусна. Хоёул free tier дээр таны энэ хэмжээний сайтад хангалттай.

## Дараагийн алхмууд (таны бодож байсан дарааллын дагуу)

### 1. Хувьцааны live дата холбох
- https://finnhub.io → үнэгүй бүртгүүлж API key ав (60 хүсэлт/минут free)
- `script.js`-д `renderStockDemo`-г Finnhub-ийн `/quote` endpoint рүү fetch хийхээр солино
- ⚠️ API key-г client-side JS дотор шууд бичиж болохгүй (хэн ч харна) — Vercel Serverless Function дотор нуух хэрэгтэй. Энэ мөчид backend анх удаа хэрэг болно.

### 2. Мэдээг Монгол хэл рүү орчуулах
Хамгийн хямд арга: мэдээний эх сурвалж (жишээ NewsAPI, Finnhub news) татаад, орчуулгыг **cache-лэх** — өөрөөр хэлбэл нэг мэдээг зөвхөн 1 удаа орчуулаад database/файлд хадгална, дараагийн хэрэглэгчид дахин орчуулуулахгүй. Ингэснээр орчуулгын API-ийн зардал огцом буурна.

### 3. Хайлтыг өргөжүүлэх
Одоо `data.js` дотор гараар нэмсэн жагсаалт байгаа. Хэдэн зуун ticker болгоход:
- Нэг удаа бүх ticker + Монгол нэрийн mapping-ийг JSON файлд бэлдээд static байдлаар serve хийвэл хамгийн хямд (database хэрэггүй)

### 4. Trial + Subscription (Stripe)
- Хэрэглэгчийн бүртгэл хэрэгтэй болно → энэ үед **Supabase** (үнэгүй tier, auth+DB хамт өгдөг) санал болгож байна — өөрийн backend бичихээс хамаагүй хямд бөгөөд хурдан.
- Stripe Checkout + Webhook-ийг Vercel Serverless Function дээр байрлуулна.
- 2 хоногийн trial-ыг Supabase дахь хэрэглэгчийн `created_at` талбараар тооцно.

## Зураглалын шийдвэрийн тухай товч
Хар (ink) дэвсгэр дээр алт (Соёмбын алтлаг өнгө #E3B341) accent, mono фонт тоон дата дээр, sans фонт текст дээр — терминал мэдрэмжтэй боловч хэт "Bloomberg copy" биш, өөрийн онцлогтой болгохыг зорьсон. Google Fonts зэрэг гадаад фонт татахгүй (зөвхон системийн фонт), ингэснээр ачаалал бага, хурд өндөр.
