// Grid 2 coloane pentru metrici per case study — numar mare + label scurt
// dedesubt, ancorat de o linie verticala 1px pe stanga. Marcat cu data-reveal
// pentru ca GSAP-ul parent (CaseStudy) sa il prinda la scroll.
type Metric = { value: string; label: string };

export default function MetricGrid({ metrics }: { metrics: readonly Metric[] }) {
  return (
    <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
      {metrics.map((m, i) => (
        <div key={i} data-reveal className="border-l border-[var(--border-soft)] pl-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[var(--text-quiet)]">
            {`Metric ${String(i + 1).padStart(2, '0')}`}
          </p>
          <p className="mt-3 text-5xl font-semibold tracking-[-0.04em] text-white lg:text-6xl">
            {m.value}
          </p>
          <p className="mt-3 text-sm text-[var(--text-mid)]">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
