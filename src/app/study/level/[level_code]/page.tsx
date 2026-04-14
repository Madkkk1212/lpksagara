import { notFound } from "next/navigation";
import StudyLevelClient from "./StudyLevelClient";
import { getStudyLevelByCode } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StudyLevelPage({ params }: { params: Promise<{ level_code: string }> }) {
  const { level_code } = await params;
  
  const level = await getStudyLevelByCode(level_code);
  if (!level) return notFound();

  return <StudyLevelClient levelData={level} />;
}
