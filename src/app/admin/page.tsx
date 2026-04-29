import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

import { getTheme } from "@/lib/db";

export async function generateMetadata() {
  const theme = await getTheme();
  return {
    title: `Admin Panel | ${theme?.app_name || "Sagara"}`,
    description: theme?.tagline || "Management Dashboard",
  };
}

export default function AdminPage() {
  return <AdminClient />;
}
