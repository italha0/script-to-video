import { type Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "Video Editor | Script to Video",
  description: "Create and edit your videos. Use the timeline to arrange scenes, add text, generate voiceovers, and customize your video before rendering.",
  robots: {
    index: false, // No-index this page as it requires auth
  }
};

export default async function EditorPage() {
  return <MainLayout />
}
