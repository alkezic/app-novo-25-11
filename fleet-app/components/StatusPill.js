// Vraća { label, tone } na osnovu broja dana do isteka datuma.
export function rokStatus(datum) {
  if (!datum) return { label: "Bez roka", tone: "neutral" };

  const danas = new Date();
  danas.setHours(0, 0, 0, 0);
  const rok = new Date(datum);
  const dana = Math.round((rok - danas) / (1000 * 60 * 60 * 24));

  if (dana < 0) {
    const aps = Math.abs(dana);
    return { label: `Isteklo pre ${aps}d`, tone: "danger" };
  }
  if (dana === 0) return { label: "Ističe danas", tone: "danger" };
  if (dana <= 7) return { label: `Ističe za ${dana}d`, tone: "danger" };
  if (dana <= 14) return { label: `Ističe za ${dana}d`, tone: "warn" };
  if (dana <= 30) return { label: `${dana}d do isteka`, tone: "warn" };
  return { label: `${dana}d`, tone: "ok" };
}

export default function StatusPill({ label, tone = "neutral" }) {
  return <span className={`pill ${tone}`}>{label}</span>;
}