import { Plus_Jakarta_Sans } from 'next/font/google';
import "./globals.css";

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
      {/* font-sans sekarang akan mengacu pada Plus Jakarta Sans */}
      <body className="font-sans bg-[#FCFBF8] text-[#1A1F24]">
        {children}
      </body>
    </html>
  );
}