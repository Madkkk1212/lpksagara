import { notFound } from "next/navigation";
import StudyMaterialClient from "./StudyMaterialClient";
import { getStudyMaterialById } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StudyMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const material = await getStudyMaterialById(id);
  if (!material) return notFound();

  return <StudyMaterialClient materialData={material} />;
}
