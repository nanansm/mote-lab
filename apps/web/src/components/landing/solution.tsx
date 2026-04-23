import { CheckCircleIcon, ChromeIcon, ServerIcon, UsersIcon } from "lucide-react";

const steps = [
  {
    icon: ChromeIcon,
    title: "Install Extension",
    description: "Pasang extension Chrome Mote LAB. Ringan, tidak mengganggu browsing.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: UsersIcon,
    title: "Browse & Auto-collect",
    description:
      "Saat kamu browse Shopee/Tokopedia, extension otomatis collect data produk yang kamu lihat.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: ServerIcon,
    title: "Collective Intelligence",
    description:
      "Data dari ribuan user ter-aggregate di server. Makin banyak user = makin akurat data trending.",
    color: "bg-green-100 text-green-600",
  },
];

const advantages = [
  "Tidak butuh server scraping mahal",
  "Data fresh karena real-time dari browser user",
  "Tidak bisa diblokir marketplace",
  "Cross-marketplace insights (Shopee + Tokopedia)",
];

export function SolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
            Solusi Kami
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Hybrid Architecture yang Cerdas
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Bukan sekadar tool riset biasa. Mote LAB menggabungkan kekuatan browser extension
            dan collective database untuk memberikan insights yang akurat.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mb-16">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 border-t-2 border-dashed border-slate-200" />
              )}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${step.color}`}
              >
                <step.icon className="size-7" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Step {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Advantages */}
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#1d4ed8] rounded-2xl p-8 md:p-12 max-w-4xl mx-auto text-white">
          <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">
            Kenapa Hybrid Architecture Lebih Unggul?
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {advantages.map((adv) => (
              <div key={adv} className="flex items-start gap-3">
                <CheckCircleIcon className="size-5 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-white/90 text-sm">{adv}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
