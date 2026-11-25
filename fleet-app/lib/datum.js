export function formatDatum(ulaz) {
  if (!ulaz) return null;
  const d = ulaz instanceof Date ? ulaz : new Date(ulaz);
  if (Number.isNaN(d.getTime())) return null;
  const dan = String(d.getDate()).padStart(2, "0");
  const mesec = String(d.getMonth() + 1).padStart(2, "0");
  const godina = d.getFullYear();
  return `${dan}.${mesec}.${godina}`;
}
