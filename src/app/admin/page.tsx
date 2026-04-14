import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Panel | Reiwa LMS",
  description: "Reiwa LMS Management Dashboard",
};

export default function AdminPage() {
  return <AdminClient />;
}
