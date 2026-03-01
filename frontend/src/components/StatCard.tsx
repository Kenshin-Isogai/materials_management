type Props = {
  label: string;
  value: string | number;
  tone?: "default" | "signal" | "brass";
};

export function StatCard({ label, value, tone = "default" }: Props) {
  const toneClass =
    tone === "signal"
      ? "border-signal/30 bg-signal/10 text-signal"
      : tone === "brass"
      ? "border-brass/30 bg-brass/10 text-brass"
      : "border-slate-200 bg-white text-slate-700";
  return (
    <div className={`panel border px-5 py-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

