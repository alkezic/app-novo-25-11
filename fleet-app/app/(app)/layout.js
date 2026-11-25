import { createClient } from "@/lib/supabase/server";
import { ucitajPodesavanja } from "@/lib/podesavanja";
import { izvediAkcenatTokene } from "@/lib/boje";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const podesavanja = await ucitajPodesavanja(supabase);

  const tamno = izvediAkcenatTokene(podesavanja.akcenat_tamno, { svetlaPozadina: false });
  const svetlo = izvediAkcenatTokene(podesavanja.akcenat_svetlo, { svetlaPozadina: true });

  const stil = `
    :root {
      --accent: ${tamno.accent};
      --accent-2: ${tamno.accent2};
      --accent-ink: ${tamno.ink};
      --accent-text: ${tamno.text};
      --accent-glow: ${tamno.glow};
      --accent-soft: rgba(${tamno.glow}, 0.14);
    }
    :root.light {
      --accent: ${svetlo.accent};
      --accent-2: ${svetlo.accent2};
      --accent-ink: ${svetlo.ink};
      --accent-text: ${svetlo.text};
      --accent-glow: ${svetlo.glow};
      --accent-soft: rgba(${svetlo.glow}, 0.12);
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: stil }} />
      <AppShell email={user?.email} nazivFirme={podesavanja.naziv_firme}>
        {children}
      </AppShell>
    </>
  );
}
