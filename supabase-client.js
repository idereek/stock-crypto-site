// ---------- Supabase холболт ----------
// Энэ бол "publishable" төрлийн key (sb_publishable_...) — client-side JS дотор
// шууд ил гарч болохоор ЗОРИУДААР нээлттэй зохион бүтээгдсэн key (Finnhub-ийн
// нууц key-тэй ЯЛГААТАЙ). Бодит хамгаалалт нь Supabase дээрх Row Level Security
// (RLS) policy-ууд дээр тулгуурладаг — тэдгээрийг дараагийн алхамд бэлдэнэ.

const SUPABASE_URL = "https://gbjwxuvrkuopfcrnxwvs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RW4VqPPfxYQWJ4oEVMavPQ_gyqdSAtC";

// index.html-д CDN-с supabase-js орсон байх ёстой (доор жишээ):
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

if (!supabase) {
  console.error("Supabase client үүсгэж чадсангүй — index.html-д supabase-js CDN script орсон эсэхийг шалгаарай.");
}
