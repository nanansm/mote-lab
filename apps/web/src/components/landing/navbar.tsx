"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon, ZapIcon } from "lucide-react";

const navLinks = [
  { label: "Fitur", href: "#features" },
  { label: "Harga", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#1E40AF]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1E40AF]/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white text-lg">
          <ZapIcon className="size-5 text-orange-400" />
          Mote LAB
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link href="/register">Coba Gratis</Link>
          </Button>
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <MenuIcon className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-6 pt-6">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <ZapIcon className="size-5 text-orange-500" />
                Mote LAB
              </Link>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Masuk
                  </Link>
                </Button>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Coba Gratis 7 Hari
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
