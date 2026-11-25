"""
Pretvara CSV izvoz vozila (format sa kolonama kao u primeru "ta_supabase.csv")
u SQL fajl spreman za uvoz u Supabase (SQL Editor -> paste -> Run).

Upotreba:
    python3 uvoz.py putanja/do/fajla.csv > uvoz_generisano.sql

Očekivane kolone u CSV-u (razdvojene sa ";"), tačno ovi nazivi:
    Registarska oznaka
    Marka i tip vozila
    Godina proizvodnje
    Broj šasije
    Broj sedišta
    vrsta vozila
    U voznom parku          (DA/NE - licenca Ministarstva)
    Datum isteka registracije   (format dd.mm.gggg)
    TAG srb putarina
    vozač
    NAPOMENA
    HU-GO mađarska putarina
    aktivno                 (da/ne - da li je vozilo trenutno u upotrebi)
    vlasništvo               (sopstveno/lizing)
    LIZING BR UGOVORA
    br polise kasko
    Naziv osiguranja kasko
    br polise stakla
    Naziv osiguranja stakla
    br polise AO
    Naziv osiguranja AO
"""

import csv
import io
import sys
import uuid
import datetime


import codecs


def _cp1250_fallback(error):
    # Excel ume da ostavi pokoji Windows-1250 bajt (crtice, č/ć u imenima)
    # unutar inače UTF-8 fajla. Ovo dekodira samo taj jedan bajt kao cp1250
    # i nastavlja dalje kao UTF-8, umesto da pokvari ceo fajl.
    bad_byte = error.object[error.start : error.start + 1]
    char = bad_byte.decode("cp1250", errors="replace")
    return (char, error.start + 1)


codecs.register_error("cp1250_fallback", _cp1250_fallback)


def load_text(path):
    with open(path, "rb") as f:
        raw = f.read()

    if raw[:3] == b"\xef\xbb\xbf":
        raw = raw[3:]

    text = raw.decode("utf-8", errors="cp1250_fallback")

    # ako je BOM greškom ostao kao doslovan tekst (poznat artefakt iz starijih šablona)
    text = text.replace("\\xEF\\xBB\\xBF", "").lstrip("\ufeff")
    return text


def parse_bool(val):
    return (val or "").strip().lower() == "da"


def normalizuj_vlasnistvo(val):
    val = (val or "").strip().lower()
    if val == "lizing":
        return "lizing"
    return "sopstveno"


def parse_date(val):
    val = (val or "").strip()
    if not val:
        return None
    try:
        return datetime.datetime.strptime(val, "%d.%m.%Y").date().isoformat()
    except ValueError:
        return None


def parse_int(val):
    val = (val or "").strip()
    return val if val else None


def sql_str(val):
    val = (val or "").strip()
    if val == "":
        return "NULL"
    escaped = val.replace("'", "''")
    return f"'{escaped}'"


def sql_bool(val):
    return "true" if val else "false"


def sql_int(val):
    return val if val is not None else "NULL"


def sql_date(val):
    return f"'{val}'" if val else "NULL"


def sql_uuid(val):
    return f"'{val}'"


def main():
    if len(sys.argv) < 2:
        print("Upotreba: python3 uvoz.py putanja/do/fajla.csv", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    out = []

    out.append("-- Automatski generisan uvoz iz: " + path)
    out.append("-- Nalepi ceo sadržaj u Supabase SQL Editor i pokreni.\n")
    out.append("begin;\n")

    with io.StringIO(load_text(path), newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        broj = 0

        for row in reader:
            registracija = (row.get("Registarska oznaka") or "").strip()
            if not registracija:
                continue

            broj += 1
            vid = str(uuid.uuid4())

            marka_tip = row.get("Marka i tip vozila")
            godina = parse_int(row.get("Godina proizvodnje"))
            vin = row.get("Broj šasije")
            sedista = parse_int(row.get("Broj sedišta"))
            vrsta = row.get("vrsta vozila")
            u_voznom_parku = (row.get("U voznom parku") or "").strip() or None
            datum_isteka_reg = parse_date(row.get("Datum isteka registracije"))
            tag_srb = (row.get("TAG srb putarina") or "").strip()
            vozac = row.get("vozač")
            napomena = row.get("NAPOMENA")
            tag_hu = (row.get("HU-GO mađarska putarina") or "").strip()
            aktivno = parse_bool(row.get("aktivno"))
            vlasnistvo = normalizuj_vlasnistvo(row.get("vlasništvo"))
            lizing_br = row.get("LIZING BR UGOVORA")

            osiguranja = [
                ("kasko", row.get("br polise kasko"), row.get("Naziv osiguranja kasko")),
                ("staklo", row.get("br polise stakla"), row.get("Naziv osiguranja stakla")),
                ("AO", row.get("br polise AO"), row.get("Naziv osiguranja AO")),
            ]

            out.append(f"-- Vozilo {broj}: {registracija}")
            out.append(
                "insert into vozila (id, registracija, marka_tip, godina, vin, broj_sedista, "
                "vrsta_vozila, aktivno, u_voznom_parku, vlasnistvo, lizing_br_ugovora, vozac, napomena) values ("
                f"{sql_uuid(vid)}, {sql_str(registracija)}, {sql_str(marka_tip)}, {sql_int(godina)}, "
                f"{sql_str(vin)}, {sql_int(sedista)}, {sql_str(vrsta)}, {sql_bool(aktivno)}, "
                f"{sql_str(u_voznom_parku)}, {sql_str(vlasnistvo)}, {sql_str(lizing_br)}, "
                f"{sql_str(vozac)}, {sql_str(napomena)});"
            )

            if datum_isteka_reg:
                out.append(
                    "insert into dokumenta (vozilo_id, tip, datum_isteka) values ("
                    f"{sql_uuid(vid)}, 'registracija', {sql_date(datum_isteka_reg)});"
                )

            for tip, broj_polise, izdavalac in osiguranja:
                if (broj_polise or "").strip() or (izdavalac or "").strip():
                    out.append(
                        "insert into dokumenta (vozilo_id, tip, broj, izdavalac) values ("
                        f"{sql_uuid(vid)}, {sql_str(tip)}, {sql_str(broj_polise)}, {sql_str(izdavalac)});"
                    )

            if tag_srb:
                out.append(
                    "insert into putarine (vozilo_id, zemlja, broj_taga) values ("
                    f"{sql_uuid(vid)}, 'Srbija', {sql_str(tag_srb)});"
                )
            if tag_hu:
                out.append(
                    "insert into putarine (vozilo_id, zemlja, broj_taga) values ("
                    f"{sql_uuid(vid)}, 'Mađarska', {sql_str(tag_hu)});"
                )

            out.append("")

    out.append("commit;")
    out.append(f"\n-- Ukupno uvezeno vozila: {broj}")

    print("\n".join(out))


if __name__ == "__main__":
    main()
