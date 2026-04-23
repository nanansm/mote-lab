import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Apakah Mote LAB aman dipakai?",
    answer:
      "Ya, sangat aman. Mote LAB hanya membaca data yang sudah publicly visible di halaman marketplace — sama seperti yang kamu lihat saat browse. Extension tidak pernah mengakses login, password, atau data pribadi marketplace kamu. Tidak ada auto-click atau auto-navigate yang bisa trigger anti-bot.",
  },
  {
    question: "Bagaimana cara kerja hybrid architecture-nya?",
    answer:
      "Extension Chrome di browser kamu membaca data produk dari halaman Shopee/Tokopedia yang kamu buka secara natural. Data tersebut dikirim ke server kami dan digabung (aggregate) dengan data dari user lain. Hasilnya: collective intelligence yang jauh lebih kaya dari apa yang bisa kamu kumpulkan sendiri.",
  },
  {
    question: "Data marketplace apa saja yang tersedia?",
    answer:
      "Saat ini Phase 1 mencakup Shopee Indonesia (shopee.co.id) dan Tokopedia Indonesia. Data yang dikumpulkan: nama produk, harga, jumlah terjual, rating, info toko, kategori, dan lokasi seller. Tokopedia dan Lazada dijadwalkan di Phase berikutnya.",
  },
  {
    question: "Apakah extension perlu izin/permission khusus?",
    answer:
      "Extension Mote LAB hanya meminta permission minimum: storage (untuk menyimpan sesi) dan activeTab (untuk membaca halaman yang sedang kamu buka). Tidak ada permission all_urls, tabs, atau webRequest yang berlebihan.",
  },
  {
    question: "Berapa lama data history tersedia?",
    answer:
      "Tergantung plan: Trial (7 hari), Starter (30 hari), Pro & Lifetime (90 hari). Data history ini berguna untuk melihat tren harga dan penjualan produk dari waktu ke waktu.",
  },
  {
    question: "Apakah ada batasan penggunaan di trial?",
    answer:
      "Trial gratis 7 hari memberi akses ke semua fitur dengan limit 100 riset produk per hari. Lebih dari cukup untuk evaluasi apakah Mote LAB cocok untuk bisnis kamu.",
  },
  {
    question: "Bisa pakai di lebih dari 1 device?",
    answer:
      "Ya, 1 akun bisa dipakai di beberapa device. Extension terinstall di browser masing-masing, namun data ter-sync ke akun yang sama. Dashboard bisa diakses dari device apapun.",
  },
  {
    question: "Apa yang terjadi setelah trial habis?",
    answer:
      "Setelah 7 hari trial, dashboard masuk mode read-only dan extension berhenti collect data. Semua data yang sudah terkumpul tetap tersimpan selama 7 hari tambahan sehingga kamu bisa upgrade dan langsung lanjut tanpa kehilangan data.",
  },
  {
    question: "Apakah ada refund policy?",
    answer:
      "Untuk plan bulanan, kami menyediakan refund dalam 7 hari pertama jika ada masalah teknis yang tidak bisa kami selesaikan. Untuk Lifetime, tidak ada refund karena sudah ada 7 hari trial gratis untuk evaluasi sebelumnya.",
  },
  {
    question: "Marketplace apa yang akan ditambahkan selanjutnya?",
    answer:
      "Roadmap kami: Tokopedia dan Lazada Indonesia di Phase berikutnya. Kami juga mempertimbangkan Lazada SEA untuk user yang jualan ke region. Bergabung sekarang sebagai early adopter untuk dapat akses ke fitur baru lebih awal.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Pertanyaan yang Sering Ditanya
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Masih ada pertanyaan? Hubungi kami di{" "}
            <a
              href="mailto:motekreatif@gmail.com"
              className="text-[#1E40AF] hover:underline font-medium"
            >
              motekreatif@gmail.com
            </a>
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden px-6">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-0">
                <AccordionTrigger className="text-left font-medium text-slate-900 hover:text-[#1E40AF] text-sm md:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed text-sm">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
