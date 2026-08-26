import { PageHero } from "@/components/site/page-hero";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

/**
 * Shared layout for the privacy policy and terms pages.
 *
 * NOTE FOR THE OWNER: the wording in those two pages is a starting point,
 * not legal advice. Have it reviewed before you rely on it, and keep it in
 * step with what the business actually does.
 */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={title}
        intro={intro}
        image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&q=80"
        imageAlt=""
        crumbs={[{ href: "/", label: "Home" }, { label: title }]}
        compact
      />

      <section className="section-y bg-sand">
        <div className="shell-narrow">
          <p className="text-sm text-ink-muted">Last updated: {updated}</p>

          <div className="mt-10 space-y-11">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-display text-xl font-semibold">{section.heading}</h2>

                {section.paragraphs?.map((para, i) => (
                  <p key={i} className="mt-4 leading-relaxed text-ink-muted">
                    {para}
                  </p>
                ))}

                {section.bullets && (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 leading-relaxed text-ink-muted"
                      >
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-terracotta" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
