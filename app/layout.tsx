import { Plus_Jakarta_Sans } from 'next/font/google';
import "./globals.css";
import ThemeProvider from "@/src/components/ThemeProvider";
import { Toaster } from "sonner";
import RefreshButton from "@/src/components/ui/RefreshButton";
// Memuat Plus Jakarta Sans dengan variasi weight lengkap untuk standar SaaS
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap', // Memastikan font langsung muncul tanpa kedipan
});

export const metadata = {
  title: "Aetheris | IoT Dashboard",
  description: "Sistem Deteksi Dini Kebocoran Gas & Asap Berbasis IoT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Memasukkan variabel font ke dalam tag HTML
    <html lang="id" className={`${plusJakartaSans.variable} antialiased`} suppressHydrationWarning>
      {/* Inline script untuk mencegah flash tema yang salah (FOUC prevention) */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('aetheris_theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      {/* font-sans sekarang akan mengacu pada Plus Jakarta Sans */}
      <body className="font-sans bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
          <RefreshButton />
        </ThemeProvider>
      </body>
    </html>
  );
}