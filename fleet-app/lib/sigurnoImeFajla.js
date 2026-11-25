const DIAKRITICI = {
  č: "c", ć: "c", ž: "z", š: "s", đ: "dj",
  Č: "C", Ć: "C", Ž: "Z", Š: "S", Đ: "Dj",
};

export function sigurnoImeFajla(name) {
  let out = name.replace(/[čćžšđČĆŽŠĐ]/g, (m) => DIAKRITICI[m] || m);
  // ukloni preostale dijakritike (npr. iz drugih jezika) svođenjem na osnovna slova
  out = out.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // razmaci i sve što nije slovo/broj/tačka/crtica postaje "_"
  out = out.replace(/[^a-zA-Z0-9._-]+/g, "_");
  // spreči gomilanje više uzastopnih "_"
  out = out.replace(/_+/g, "_");
  return out;
}
