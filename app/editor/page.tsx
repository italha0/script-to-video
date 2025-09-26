"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { MainLayout } from "@/components/layout/MainLayout";

export default function EditorPage() {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace("/auth/login?redirect=/editor");
    }
  }, [user, router]);

  if (user === null) {
    return null; // Or a loading spinner
  }

  return <MainLayout />;
}
