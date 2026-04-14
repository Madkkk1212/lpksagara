import { notFound } from "next/navigation";
import ExamLevelClient from "./ExamLevelClient";

export const dynamic = "force-dynamic";

const validLevels = new Set(["n5", "n4", "n3", "n2", "n1"]);

export default async function ExamLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const normalizedLevel = level.toLowerCase();

  if (!validLevels.has(normalizedLevel)) {
    notFound();
  }

  return <ExamLevelClient level={normalizedLevel as "n5" | "n4" | "n3" | "n2" | "n1"} />;
}
