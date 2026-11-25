export async function zabeleziIzmenu(supabase, { opis, tabela = null, akcija = null }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("log_izmena").insert({
      korisnik: user?.email || null,
      opis,
      tabela,
      akcija,
    });
  } catch {
    // logovanje ne sme da sprovede glavnu radnju u grešku
  }
}
