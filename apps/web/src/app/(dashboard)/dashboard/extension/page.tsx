import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@mote-lab/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZapIcon, PlusIcon, TrashIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ExtensionPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const tokens = await db.query.extensionTokens.findMany({
    where: eq(schema.extensionTokens.userId, session.user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const now = new Date();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Extension</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Kelola koneksi Chrome Extension Mote LAB.
        </p>
      </div>

      {/* Status card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ZapIcon className="size-4 text-orange-500" />
            Status Koneksi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokens.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-4">Extension belum terkoneksi.</p>
              <Button asChild className="gap-2 bg-[#1E40AF] hover:bg-[#1d4ed8]">
                <Link href="/auth/extension" target="_blank">
                  <PlusIcon className="size-4" />
                  Connect Extension
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => {
                const isActive = token.expiresAt > now;
                return (
                  <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {isActive ? (
                        <CheckCircleIcon className="size-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <ClockIcon className="size-5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            Token •••{token.token.slice(-6)}
                          </span>
                          <Badge
                            variant={isActive ? "default" : "secondary"}
                            className={`text-xs ${isActive ? "bg-green-100 text-green-700 border-green-200" : ""}`}
                          >
                            {isActive ? "Aktif" : "Kadaluarsa"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Dibuat: {formatDate(token.createdAt)} ·{" "}
                          {isActive
                            ? `Kadaluarsa: ${formatDate(token.expiresAt)}`
                            : `Kadaluarsa: ${formatDate(token.expiresAt)}`}
                        </p>
                        {token.lastUsedAt && (
                          <p className="text-xs text-slate-400">
                            Terakhir digunakan: {formatDate(token.lastUsedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <form action="/api/extension/revoke" method="post">
                      <input type="hidden" name="tokenId" value={token.id} />
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                        <TrashIcon className="size-4" />
                      </Button>
                    </form>
                  </div>
                );
              })}

              <Button asChild variant="outline" size="sm" className="gap-2 w-full">
                <Link href="/auth/extension" target="_blank">
                  <PlusIcon className="size-4" />
                  Generate Token Baru
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/install-extension">Panduan Install</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/api/extension/download?download=1">Download Extension ZIP</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
