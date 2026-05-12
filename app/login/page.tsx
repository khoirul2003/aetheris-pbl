"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        router.push(userData.role === "admin" ? "/dashboard/admin" : "/dashboard/user");
      } else {
        setError("Akses ditolak. Role tidak terdaftar.");
      }
    } catch {
      setError("Email atau password yang Anda masukkan salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-white tracking-tight">
                AETHERIS<span className="text-blue-400">.</span>
              </h1>
              <p className="text-blue-200/70 text-sm mt-2">Sistem Monitoring Kebocoran Gas</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center gap-3 text-red-200 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider ml-1">Email</label>
                <div className="mt-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="nama@restoran.com"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-blue-200 uppercase tracking-wider ml-1">Kata Sandi</label>
                <div className="mt-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/30 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Login"}
              </button>
            </form>
          </div>

          <div className="bg-white/5 p-4 text-center border-t border-white/10">
            <p className="text-blue-300/50 text-xs">
              © 2026 Aetheris PBL Team - Politeknik Negeri Malang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}