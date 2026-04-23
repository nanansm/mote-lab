import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <h1 className="text-2xl font-bold text-foreground">Halaman Tidak Ditemukan</h1>
        <p className="text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">Ke Beranda</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
