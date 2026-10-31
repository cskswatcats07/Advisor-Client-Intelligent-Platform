export default function PdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white text-black">
      <style>{`
        @page { margin: 0; }
        body { margin: 0; background: white !important; }
        a { color: inherit; }
      `}</style>
      {children}
    </div>
  );
}
