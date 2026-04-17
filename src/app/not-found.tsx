import { getTheme } from "@/lib/db";
import NotFoundContent from "./components/NotFoundContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NotFound() {
  const theme = await getTheme();
  
  return <NotFoundContent theme={theme} />;
}
