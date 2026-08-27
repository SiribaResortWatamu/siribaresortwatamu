import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { getPublicSettings } from "@/lib/data/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        propertyName={settings.property_name}
        phone={settings.phone}
        logoPath={settings.logo_path}
        logoLightPath={settings.logo_light_path}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppFab whatsapp={settings.whatsapp} />
    </div>
  );
}
