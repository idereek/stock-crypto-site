// ---------- Supabase холболт ----------
// Энэ бол "publishable" төрлийн key (sb_publishable_...) — client-side JS дотор
// шууд ил гарч болохоор ЗОРИУДААР нээлттэй зохион бүтээгдсэн key (Finnhub-ийн
// нууц key-тэй ЯЛГААТАЙ). Бодит хамгаалалт нь Supabase дээрх Row Level Security
// (RLS) policy-ууд дээр тулгуурладаг — тэдгээрийг дараагийн алхамд бэлдэнэ.

const SUPABASE_URL = "https://gbjwxuvrkuopfcrnxwvs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RW4VqPPfxYQWJ4oEVMavPQ_gyqdSAtC";

// index.html-д CDN-с supabase-js орсон байх ёстой (доор жишээ):
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//
// АНХААР: CDN library өөрөө "window.supabase" нэртэй global object үүсгэдэг тул
// бидний клиентийг ЯГ АДИЛХАН "supabase" нэрээр зарлавал давхцаж SyntaxError гардаг.
// Тиймээс манай клиентийг тусад нь "sb" нэрээр зарлана.
const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

if (!sb) {
  console.error("Supabase client үүсгэж чадсангүй — index.html-д supabase-js CDN script орсон эсэхийг шалгаарай.");
}
