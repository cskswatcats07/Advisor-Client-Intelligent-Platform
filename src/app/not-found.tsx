import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Invitation</p>
      <h1 className="mt-3 font-serif text-4xl text-primary">Link not found</h1>
      <p className="mt-3 text-muted">
        This invitation may have been revoked or the link is incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.18em] text-cream"
      >
        View main invitation
      </Link>
    </main>
  );
}
