import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1 text-sm">Kelola profil dan preferensi akun kamu.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
          <CardDescription>Informasi akun dari Google OAuth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="bg-[#1E40AF] text-white text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-slate-900">{user.name ?? "-"}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
              <Badge variant="secondary" className="mt-1.5 text-xs">
                {user.emailVerified ? "Email terverifikasi" : "Email belum terverifikasi"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Bergabung sejak
              </div>
              <div className="text-sm font-medium text-slate-900">
                {formatDate(user.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Login method
              </div>
              <div className="text-sm font-medium text-slate-900">Google OAuth</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data & Privacy</CardTitle>
          <CardDescription>Kelola data kamu di Mote LAB.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 leading-relaxed">
            Untuk request hapus akun atau ekspor data, hubungi kami di{" "}
            <a href="mailto:motekreatif@gmail.com" className="text-[#1E40AF] hover:underline">
              motekreatif@gmail.com
            </a>
            . Kami akan memproses permintaan dalam 3 hari kerja.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
