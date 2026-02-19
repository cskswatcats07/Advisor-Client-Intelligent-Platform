export function Disclaimer() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Important — Advisor Infrastructure Only</p>
      <p className="mt-1">
        The Advisor Client Intelligence Platform (ACIP) is <strong>advisor infrastructure software</strong> and
        does not provide regulated financial advice directly. All outputs are illustrative and require advisor
        attestation before client delivery. This platform does not execute trades, custody assets, provide
        autonomous financial advice, or represent itself as a registered dealer or insurer. Results depend on
        assumptions entered and should be independently verified by a qualified professional.
      </p>
    </div>
  );
}

export function FooterDisclaimer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-xs text-slate-600">
      <p>
        ACIP follows Canadian regulatory guidelines (PIPEDA, CIRO, provincial regulations).
        This platform does not constitute an offer or solicitation. All AI-generated content requires
        advisor review and attestation before any client-facing use. Past performance and projections
        are not guarantees of future results.
      </p>
    </footer>
  );
}
