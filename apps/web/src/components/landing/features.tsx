import {
  SearchIcon,
  StoreIcon,
  BarChart2Icon,
  BookmarkIcon,
  DownloadIcon,
  BellRingIcon,
} from "lucide-react";

const features = [
  {
    icon: SearchIcon,
    title: "Riset Produk",
    description:
      "Analisis sold count, estimasi omset bulanan, growth rate, dan data harga per produk secara real-time.",
    badge: "Core",
  },
  {
    icon: StoreIcon,
    title: "Riset Toko",
    description:
      "Deep-dive toko pesaing: follower, performa keseluruhan, top produk, dan tren growth mereka.",
    badge: "Core",
  },
  {
    icon: BarChart2Icon,
    title: "Cross-Marketplace Insight",
    description:
      "Bandingkan performa produk yang sama di Shopee vs TikTok Shop. Temukan arbitrase harga dan peluang.",
    badge: "Pro",
  },
  {
    icon: BookmarkIcon,
    title: "Bookmark & Organize",
    description:
      "Simpan produk dan toko yang menarik. Tambah catatan, buat kategori, dan pantau perkembangan mereka.",
    badge: "Semua Plan",
  },
  {
    icon: DownloadIcon,
    title: "Export CSV",
    description:
      "Download data riset kamu dalam format CSV untuk analisis lebih lanjut di Excel, Google Sheets, atau Notion.",
    badge: "Starter+",
  },
  {
    icon: BellRingIcon,
    title: "Trending Alerts",
    description:
      "Notifikasi otomatis ketika produk bookmark kamu mulai trending atau ada perubahan harga signifikan.",
    badge: "Pro",
  },
];

const badgeColors: Record<string, string> = {
  Core: "bg-blue-100 text-blue-700",
  Pro: "bg-orange-100 text-orange-700",
  "Semua Plan": "bg-green-100 text-green-700",
  "Starter+": "bg-purple-100 text-purple-700",
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
            Fitur Lengkap
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Semua Yang Kamu Butuhkan
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Dari riset produk basic sampai insights cross-marketplace yang advanced — semua ada
            di satu platform.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-[#1E40AF]/10 rounded-xl flex items-center justify-center">
                  <feature.icon className="size-5 text-[#1E40AF]" />
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColors[feature.badge] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
