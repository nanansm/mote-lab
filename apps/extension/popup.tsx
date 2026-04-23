import { useEffect, useState } from "react";
import { LoginButton } from "./components/popup/LoginButton";
import { QuotaBar } from "./components/overlay/QuotaBar";
import "./styles/popup.css";

const API_URL = process.env.PLASMO_PUBLIC_API_URL ?? "https://lab.motekreatif.com";

interface AuthState {
  authenticated: boolean;
  user?: { id: string; email: string; name: string; plan: string };
  quota?: { used: number; limit: number; remaining: number; resetAt: string };
  cached?: boolean;
}

export default function Popup() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_AUTH_STATUS" }, (res: AuthState) => {
      setAuth(res);
      setLoading(false);
    });
    chrome.runtime.sendMessage({ type: "GET_QUEUE_LENGTH" }, (res: { length: number }) => {
      setQueueLen(res?.length ?? 0);
    });
  }, []);

  function handleLogin() {
    chrome.tabs.create({ url: `${API_URL}/auth/extension` });
  }

  function handleLogout() {
    chrome.runtime.sendMessage({ type: "LOGOUT" }, () => {
      setAuth({ authenticated: false });
    });
  }

  if (loading) {
    return (
      <div className="w-72 p-6 flex items-center justify-center min-h-[120px]">
        <div className="animate-spin w-5 h-5 border-2 border-gray-300 border-t-brand rounded-full" />
      </div>
    );
  }

  const planLabel = auth?.user?.plan
    ? { trial: "Trial", starter: "Starter", pro: "Pro", lifetime: "Lifetime" }[auth.user.plan] ?? auth.user.plan
    : "";

  return (
    <div className="w-72 flex flex-col">
      {/* Header */}
      <div className="bg-brand text-white px-4 py-3 flex items-center gap-2">
        <span className="font-bold text-base tracking-tight">Mote LAB</span>
        <span className="text-xs opacity-70 ml-auto">Extension</span>
      </div>

      <div className="p-4 space-y-4">
        {!auth?.authenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Hubungkan ekstensi ke akun Mote LAB kamu untuk mulai riset.</p>
            <LoginButton onClick={handleLogin} />
          </div>
        ) : (
          <>
            {/* User info */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-900">{auth.user?.name}</p>
                <p className="text-xs text-gray-500">{auth.user?.email}</p>
              </div>
              <span className="text-xs bg-blue-100 text-brand font-semibold px-2 py-0.5 rounded-full">
                {planLabel}
              </span>
            </div>

            {/* Quota */}
            {auth.quota && (
              <QuotaBar used={auth.quota.used} limit={auth.quota.limit} />
            )}

            {/* Queue badge */}
            {queueLen > 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {queueLen} item antri (akan dikirim saat online)
              </div>
            )}

            {auth.cached && (
              <p className="text-xs text-gray-400">Data tersimpan sementara (offline)</p>
            )}

            {/* Links */}
            <div className="flex gap-2">
              <a
                href={`${API_URL}/dashboard`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition-colors"
              >
                Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="flex-1 text-xs py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-md text-gray-500 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
