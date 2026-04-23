import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, PlayCircleIcon, TrendingUpIcon } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1E40AF] via-[#1d4ed8] to-[#1e3a8a] text-white">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-orange-500/20 text-orange-300 border-orange-400/30 hover:bg-orange-500/20">
            <TrendingUpIcon className="size-3" />
            Shopee + TikTok Shop Indonesia
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            Riset Produk Marketplace
            <br />
            <span className="text-orange-400">dengan Data, Bukan Feeling</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Tool riset berbasis hybrid architecture: extension scrape data saat kamu browse,
            server aggregate jadi collective intelligence dari ribuan seller. Jauh lebih akurat
            dari tool manapun.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="xl"
              className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto shadow-lg shadow-orange-500/30"
            >
              <Link href="/register">
                Coba Gratis 7 Hari
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white w-full sm:w-auto"
            >
              <Link href="#features">
                <PlayCircleIcon className="size-4" />
                Lihat Fitur
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-white/60">
            Tidak perlu kartu kredit. Gratis 7 hari penuh.
          </p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "2 Platform", label: "Shopee & TikTok Shop" },
              { value: "Real-time", label: "Data Terkini" },
              { value: "100+", label: "Riset/hari (Trial)" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-orange-400">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 64L1440 64L1440 0C1440 0 1080 64 720 64C360 64 0 0 0 0L0 64Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
