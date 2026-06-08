"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // State untuk mengontrol animasi Entrance (masuk) & Exit (keluar)
  const [isMounted, setIsMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Memicu animasi fade-in segera setelah komponen dimuat
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Fungsi khusus untuk tombol "Kembali ke Beranda" dengan efek Cinematic
  const handleBackToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return;
    
    setIsNavigating(true); // Memicu layar menjadi blur & fade-out
    
    setTimeout(() => {
      router.push("/"); // Pindah ke beranda secara instan setelah transisi selesai
    }, 500);
  };

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
        
        // Buat efek fade-out juga saat login berhasil sebelum pindah ke dashboard
        setIsNavigating(true);
        setTimeout(() => {
          router.push(userData.role === "admin" ? "/dashboard/admin" : "/dashboard/user");
        }, 500);

      } else {
        setError("Akses ditolak. Role tidak terdaftar.");
        setLoading(false);
      }
    } catch {
      setError("Email atau password yang Anda masukkan salah.");
      setLoading(false);
    }
  };

  return (
    // Transisi Entrance & Exit diterapkan di pembungkus utama
    <div className={`relative min-h-screen flex items-center justify-center p-4 antialiased font-sans overflow-hidden transition-all duration-500 ease-in-out ${
      isMounted && !isNavigating ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-[0.99]"
    }`} style={{ backgroundColor: "var(--background)" }}>
      
      {/* ================================================== */}
      {/* ANIMATED MESH GRADIENT BACKGROUND (LIGHT OLIVE)    */}
      {/* ================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[100px] md:blur-[140px] mix-blend-multiply opacity-80 animate-blob-1" style={{ backgroundColor: "var(--accent-primary)" }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] md:blur-[160px] mix-blend-multiply opacity-70 animate-blob-2" style={{ backgroundColor: "var(--accent-primary-hover)" }} />
        <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full blur-[100px] md:blur-[140px] opacity-80 animate-blob-3" style={{ backgroundColor: "var(--card-bg-solid)" }} />
      </div>

      {/* ================================================== */}
      {/* LOGIN CARD (FOREGROUND)                            */}
      {/* ================================================== */}
      <div className="w-full max-w-md relative z-10 flex flex-col">
        
        {/* Back to Home Button - Sekarang memicu handleBackToHome() */}
        <div className="mb-6 self-start">
          <button 
            onClick={handleBackToHome}
            disabled={isNavigating || loading}
            className="text-[11px] font-bold flex items-center gap-1.5 transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-50 hover:opacity-80"
            style={{ color: "var(--accent-primary)" }}
          >
            ← Kembali ke Beranda
          </button>
        </div>

        {/* Glassmorphism Card (Light Version) */}
        <div className="border rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden transition-all duration-500 backdrop-blur-2xl" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <div className="p-8 md:p-10">
            
            {/* Branding Logo */}
            <div className="text-center mb-8 flex flex-col items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Aetheris Logo" 
                width={150} 
                height={50} 
                className="object-contain dark:invert"
                priority
              />
              <p className="text-[10px] font-black mt-3 uppercase tracking-widest" style={{ color: "var(--card-text-faint)" }}>
                Authentication Gateway
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="mb-6 p-4 rounded-xl border flex items-start gap-3 text-xs font-semibold leading-relaxed shadow-inner" style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.2)", color: "rgb(244, 63, 94)" }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Input */}
            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--card-text-faint)" }}>
                  Email
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--card-text-muted)" }}>
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all shadow-inner"
                    style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-title)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                    placeholder="nama@restoran.com"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isNavigating}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--card-text-faint)" }}>
                  Kata Sandi
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: "var(--card-text-muted)" }}>
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 transition-all shadow-inner"
                    style={{ backgroundColor: "var(--card-bg-solid)", borderColor: "var(--card-surface-border)", color: "var(--card-title)", "--tw-ring-color": "var(--accent-primary)" } as React.CSSProperties}
                    placeholder="••••••••"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isNavigating}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isNavigating}
                className="w-full flex justify-center items-center py-3.5 px-4 mt-2 rounded-xl text-white text-[11px] font-black tracking-widest uppercase transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] border-none cursor-pointer hover:opacity-80"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                {loading || isNavigating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>

          {/* Footer Card */}
          <div className="backdrop-blur-md p-5 text-center border-t" style={{ backgroundColor: "var(--card-surface)", borderColor: "var(--card-surface-border)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--card-text-faint)" }}>
              © 2026 Aetheris Infrastructure
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}