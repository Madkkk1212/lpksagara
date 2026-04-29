import TeacherClient from "./TeacherClient";
import { getTheme } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const theme = await getTheme();
  return {
    title: `Teacher Hub | ${theme?.app_name || "Sagara"}`,
    description: "Cinematic Teacher Dashboard",
  };
}

export default function TeacherPage() {
  return <TeacherClient />;
}
