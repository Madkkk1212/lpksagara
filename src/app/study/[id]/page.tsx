import { notFound } from "next/navigation";
import StudyDetailClient from "./StudyDetailClient";

export const dynamic = "force-dynamic";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validIds = ["n5-aisatsu", "n4-aktivitas", "n3-perasaan", "n2-kantor", "n1-akademik", "ssw-kaigo", "ssw-food", "ssw-factory"];
  
  if (!validIds.includes(id)) {
    return notFound();
  }

  return <StudyDetailClient id={id} />;
}
