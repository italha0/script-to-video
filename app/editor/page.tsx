import { redirect } from "next/navigation"
import { MainLayout } from "@/components/layout/MainLayout"
import { createClient } from "@/lib/supabase/server"

export default async function EditorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent('/editor')}`)
  }

  return <MainLayout />
}