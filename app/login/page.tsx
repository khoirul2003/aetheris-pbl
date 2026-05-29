"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 antialiased font-sans">
      <div className="w-full max-w-md">
        
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link href="/" className="text-xs font-bold text-[#4A6741] hover:underline flex items-center gap-1">
            ← Kembali ke Beranda
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-[#4A6741]/5 overflow-hidden">
          <div className="p-8">
            
            {/* Branding Logo */}
            <div className="text-center mb-8">
              
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Aetheris<span className="text-[#4A6741]">.</span>
              </h1>
              <p className="text-slate-400 text-xs font-semibold mt-1 uppercase tracking-wider">
                Sistem Monitoring Kebocoran Gas
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs font-medium leading-relaxed">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Input */}
            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Email Restoran
                </label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-800 text-xs font-medium placeholder-slate-400/60 focus:outline-hidden focus:border-[#4A6741] focus:bg-white transition-all"
                    placeholder="nama@restoran.com"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Kata Sandi
                </label>
                <div className="mt-1.5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-800 text-xs font-medium placeholder-slate-400/60 focus:outline-hidden focus:border-[#4A6741] focus:bg-white transition-all"
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-[#4A6741] hover:bg-[#3d5535] text-white text-xs font-bold transition-all shadow-lg shadow-[#4A6741]/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border-none cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  "Masuk ke Dashboard"
                )}
              </button>
            </form>
          </div>

          {/* Footer Card */}
          <div className="bg-slate-50/80 p-4 text-center border-t border-slate-100">
            <p className="text-slate-400 text-[10px] font-medium">
              © 2026 Aetheris PBL Team &bull; Politeknik Negeri Malang
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}