import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ExtensionAuthClient } from "./extension-auth-client";

export default async function ExtensionAuthPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?callbackUrl=/auth/extension");
  }

  return (
    <ExtensionAuthClient
      user={{ name: session.user.name, email: session.user.email }}
    />
  );
}
