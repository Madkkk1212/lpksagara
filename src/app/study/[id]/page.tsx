import { notFound } from "next/navigation";
import StudyDetailClient from "./StudyDetailClient";

export const dynamic = "force-dynamic";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudyDetailClient id={id} />;
}

