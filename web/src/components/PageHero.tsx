type PageHeroProps = {
  title: string;
  image: string;
  subtitle?: string;
};

export default function PageHero({ title, image, subtitle }: PageHeroProps) {
  return (
    <div
      className="relative flex h-[55vh] min-h-[380px] items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('${image}')` }}
    >
      <div className="absolute inset-0 bg-ink/45" />
      <div className="relative text-center text-white">
        <h1 className="font-display text-4xl font-semibold tracking-wide md:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-white/80">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
