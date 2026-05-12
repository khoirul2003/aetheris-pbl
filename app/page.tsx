"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Otomatis mengarahkan ke halaman login saat web dibuka
    router.push("/login");
  }, [router]);

  return null; 
}