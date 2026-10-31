export const metadata = {
  title: "Wedding Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-shell min-h-screen">{children}</div>;
}
