import Link from "next/link";

export function Footer({
  partnerOne,
  partnerTwo,
}: {
  partnerOne: string;
  partnerTwo: string;
}) {
  return (
    <footer className="border-t border-champagne/70 px-6 py-12 text-center">
      <p className="font-serif text-2xl text-primary">
        {partnerOne} & {partnerTwo}
      </p>
      <p className="mt-2 text-sm text-muted">
        With love, gratitude and warm invitation
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-muted/60 hover:text-muted"
      >
        Admin
      </Link>
    </footer>
  );
}
