import AdminApp from "@/components/admin/AdminApp";

export const metadata = { title: "Panel · Huellitas HMO", robots: { index: false, follow: false } };

export default function Admin() {
  return (
    <div className="wrap page">
      <AdminApp />
    </div>
  );
}
