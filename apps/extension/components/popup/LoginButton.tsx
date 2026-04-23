interface LoginButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function LoginButton({ onClick, loading = false }: LoginButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2.5 px-4 bg-brand text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-800 transition-colors"
    >
      {loading ? "Menghubungkan..." : "Login ke Mote LAB"}
    </button>
  );
}
