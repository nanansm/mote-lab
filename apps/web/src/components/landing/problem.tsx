import { AlertTriangleIcon, PackageXIcon, EyeOffIcon } from "lucide-react";

const problems = [
  {
    icon: AlertTriangleIcon,
    title: "Terlalu Banyak Guesswork",
    description:
      "Pilih produk berdasarkan intuisi, bukan data. Hasilnya? Sering miss trend dan buang waktu riset manual berjam-jam yang hasilnya pun tidak akurat.",
  },
  {
    icon: PackageXIcon,
    title: "Modal Nyangkut di Stok Salah",
    description:
      "Beli stok besar tanpa tahu demand sebenarnya. Produk menumpuk, cash flow tersumbat, dan kamu tidak tahu kapan harus restock atau stop.",
  },
  {
    icon: EyeOffIcon,
    title: "Kompetitor Susah Di-track",
    description:
      "Tidak tahu strategi harga, produk baru, dan performa toko pesaing. Sementara mereka terus berkembang, kamu tertinggal tanpa sadar.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
            Masalah Yang Sering Terjadi
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Kenapa Seller Masih Struggle?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tanpa data yang tepat, keputusan bisnis marketplace menjadi tebak-tebakan yang
            mahal.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-5">
                <problem.icon className="size-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{problem.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
