function hexToRgb(hex) {
  const clean = (hex || "#f0f941").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function luminance({ r, g, b }) {
  const a = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function mix(rgb, target, amount) {
  return {
    r: rgb.r + (target.r - rgb.r) * amount,
    g: rgb.g + (target.g - rgb.g) * amount,
    b: rgb.b + (target.b - rgb.b) * amount,
  };
}

const BELO = { r: 255, g: 255, b: 255 };
const CRNO = { r: 10, g: 10, b: 8 };

function lighten(hex, amount) {
  return rgbToHex(mix(hexToRgb(hex), BELO, amount));
}

function darken(hex, amount) {
  return rgbToHex(mix(hexToRgb(hex), CRNO, amount));
}

function contrastRatio(lumA, lumB) {
  const [l1, l2] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (l1 + 0.05) / (l2 + 0.05);
}

// Postepeno tamni/svetli boju dok ne dobije dovoljan kontrast na datoj pozadini,
// da izabrana boja ostane čitljiva kao tekst bez obzira šta korisnik izabere.
function obezbrediKontrast(hex, pozadinaLum) {
  let trenutna = hex;
  let i = 0;
  while (contrastRatio(luminance(hexToRgb(trenutna)), pozadinaLum) < 3 && i < 12) {
    trenutna = pozadinaLum > 0.5 ? darken(trenutna, 0.12) : lighten(trenutna, 0.12);
    i++;
  }
  return trenutna;
}

// Izvodi kompletan set tokena (dugme, tekst, odsjaj) iz jedne boje koju korisnik izabere.
export function izvediAkcenatTokene(hex, { svetlaPozadina }) {
  const rgb = hexToRgb(hex);
  const lum = luminance(rgb);
  const ink = lum > 0.5 ? "#0a0a08" : "#ffffff";
  const accent2 = svetlaPozadina ? darken(hex, 0.12) : lighten(hex, 0.1);
  const pozadinaLum = svetlaPozadina ? 0.92 : 0.02;
  const text = obezbrediKontrast(hex, pozadinaLum);
  const glow = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  return {
    accent: hex,
    accent2,
    ink,
    text,
    glow,
  };
}

export function jeIspravnaHex(vrednost) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(vrednost || "");
}
