// === Helpers de estilo para el plan IA ===
const PLAN_STYLES = {
  fatloss:  { bg: "bg-rose-100",   text: "text-rose-700",   ring: "ring-rose-200",   icon: "🔥" },
  muscle:   { bg: "bg-emerald-100",text: "text-emerald-700",ring: "ring-emerald-200",icon: "💪" },
  hiit:     { bg: "bg-amber-100",  text: "text-amber-800",  ring: "ring-amber-200",  icon: "⚡" },
  recomp:   { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200", icon: "🔁" },
  default:  { bg: "bg-slate-100",  text: "text-slate-700",  ring: "ring-slate-200",  icon: "✨" },
};

function PlanBadge({ label }) {
  const key = (label || "").toLowerCase();
  const s = PLAN_STYLES[key] || PLAN_STYLES.default;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}>
      <span>{s.icon}</span>
      <span className="uppercase tracking-wide">{label || "IA"}</span>
    </span>
  );
}
