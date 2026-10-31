export function Announcement({
  message,
  partnerOne,
  partnerTwo,
}: {
  message: string;
  partnerOne: string;
  partnerTwo: string;
}) {
  return (
    <section id="celebration" className="section-pad mx-auto max-w-3xl py-20 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Our Celebration</p>
      <h2 className="mt-4 font-serif text-4xl leading-tight text-primary md:text-5xl">
        {partnerOne} & {partnerTwo}
      </h2>
      <div className="ornament-line mx-auto my-8 w-28" />
      <p className="font-serif text-xl leading-relaxed text-foreground/90 md:text-2xl">
        “{message}”
      </p>
    </section>
  );
}
