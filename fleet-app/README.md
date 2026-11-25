# Vozni park — aplikacija

Web aplikacija za evidenciju vozila, dokumenata, računa i plaćanja. Napravljena da se lako širi novim modulima.

Tehnologije: **Next.js** (frontend + backend), **Supabase** (baza podataka, login, čuvanje fajlova), **Vercel** (hosting).

---

## 1. Podesi Supabase (baza + login)

1. Otvori svoj Supabase projekat (ili napravi novi na [supabase.com](https://supabase.com)).
2. U levom meniju idi na **SQL Editor → New query**.
3. Otvori fajl `supabase/schema.sql` iz ovog projekta, kopiraj ceo sadržaj, nalepi u editor i klikni **Run**.
   - Ovo pravi sve tabele (`vozila`, `dokumenta`, `partneri`, `racuni`, `placanja`), uključuje zaštitu (RLS) i pravi mesto za čuvanje fajlova (`dokumenti` bucket).
4. Idi na **Authentication → Users → Add user** i ručno napravi naloge za sebe i za 2-3 osobe koje treba da imaju pristup (email + lozinka). Aplikacija namerno nema javnu registraciju.
5. Idi na **Project Settings → API** i zapamti:
   - `Project URL`
   - `anon public` ključ

---

## 2. Pokreni aplikaciju lokalno (da testiraš pre nego što je objaviš)

Potreban ti je [Node.js](https://nodejs.org) (LTS verzija).

```bash
# u folderu projekta
npm install
cp .env.local.example .env.local
```

Otvori `.env.local` i upiši vrednosti iz koraka 1.5 (`NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000) — prijavi se sa nalogom koji si napravio u koraku 1.4.

---

## 3. Postavi na GitHub

```bash
git init
git add .
git commit -m "Prva verzija aplikacije"
git branch -M main
git remote add origin https://github.com/TVOJ-NALOG/fleet-app.git
git push -u origin main
```

(Zameni link sa linkom svog praznog GitHub repozitorijuma — napravi ga prvo na github.com preko "New repository", bez README-a da izbegneš konflikt.)

---

## 4. Objavi na Vercel-u

1. Idi na [vercel.com](https://vercel.com) → **Add New → Project**.
2. Izaberi GitHub repozitorijum koji si upravo napravio.
3. U koraku "Environment Variables" dodaj:
   - `NEXT_PUBLIC_SUPABASE_URL` → vrednost iz Supabase-a
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → vrednost iz Supabase-a
4. Klikni **Deploy**.

Za par minuta aplikacija je na internetu, na adresi tipa `fleet-app.vercel.app`. Svaki put kad pošalješ izmenu na GitHub (`git push`), Vercel je automatski objavljuje.

---

## 5. Uvezi podatke o vozilima iz Excel/CSV fajla

Kad imaš spisak vozila u istom formatu kolona (izvezen iz Excel-a kao CSV, razdvojen sa `;`):

```bash
python3 scripts/uvoz.py putanja/do/tvog-fajla.csv > supabase/uvoz.sql
```

Ovo pravi SQL fajl (`supabase/uvoz.sql`) sa gotovim komandama za sva vozila iz fajla —
automatski razdvaja podatke u `vozila`, `dokumenta` (registracija + kasko/staklo/AO osiguranje)
i `putarine` (Srbija/Mađarska tagovi).

Zatim samo otvori taj fajl, kopiraj ceo sadržaj, nalepi u Supabase **SQL Editor** i pokreni.

Očekivane kolone su opisane na vrhu `scripts/uvoz.py` — ako fajl koji šalješ ima drugačije
kolone ili format, javi mi pa prilagođavam skriptu.

Primer već generisanog uvoza (iz fajla koji si poslao) nalazi se u `supabase/uvoz_ta_supabase.sql`
— možeš ga odmah pokrenuti u SQL Editor-u ako želiš da vidiš kako izgleda u aplikaciji.

---

## Struktura aplikacije

```
app/
  login/            - stranica za prijavu
  (app)/            - sve stranice iza login-a (deljen izgled sa bočnim menijem)
    dashboard/       - glavni pregled: dospele obaveze i dokumenta koja ističu
    vozila/          - evidencija vozila (registracija, marka/tip, vozač, vlasništvo...)
    dokumenta/       - registracija, kasko/staklo/AO osiguranje, rokovi i upload PDF-a
    putarine/        - TAG uređaji po vozilu i po zemlji
    racuni/          - izlazni i ulazni računi, partneri
    placanja/        - uplate/isplate vezane za račune
lib/supabase/        - konekcija ka Supabase (browser i server)
supabase/schema.sql  - definicija baze podataka
scripts/uvoz.py       - pretvara CSV izvoz vozila u gotov SQL za uvoz
middleware.js         - štiti stranice, redirektuje neprijavljene na /login
```

## Kako dodati novi modul kasnije

Svaki modul (npr. "Gorivo", "Servisi", "Putni nalozi") prati isti obrazac:

1. Dodaj novu tabelu u `supabase/schema.sql` (i pokreni je u Supabase SQL Editor-u).
2. Napravi novi folder u `app/(app)/tvoj-modul/page.js` po uzoru na `vozila/page.js`.
3. Dodaj link u `components/Sidebar.js`.

Ovaj korak je idealan za rad kroz **Claude Code** — dovoljno je opisati šta želiš, a kod prati postojeći obrazac u projektu.

## Napomene

- Svi prijavljeni korisnici trenutno vide iste podatke (deljena evidencija tima od 2-3 osobe). Ako kasnije zatreba da se podaci razdvoje po korisniku, to se dodaje kroz RLS pravila u `schema.sql`.
- Status računa (`neplaćeno/delimično/plaćeno`) se menja ručno — plaćanja se beleže odvojeno radi istorije, ali ne ažuriraju status automatski. Ovo je namerno pojednostavljeno za početak i lako se automatizuje kasnije.
- Fajlovi (skenirana dokumenta) čuvaju se privatno u Supabase Storage-u i otvaraju se preko privremenog (60s) linka — nisu javno dostupni.
