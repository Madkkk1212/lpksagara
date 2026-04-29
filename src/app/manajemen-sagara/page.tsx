import StaffLoginClient from "./StaffLoginClient";
import { getTheme } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const theme = await getTheme();
  return {
    title: `Secure Portal | ${theme?.app_name || "Sagara"}`,
    description: "Restricted Staff Access",
  };
}

export default function StaffLoginPage() {
  return <StaffLoginClient />;
}
