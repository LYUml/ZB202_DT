// Choose readable kW steps while keeping the plotted peak below the top gridline.
export function demandAxis(maxValue) {
  const target = Math.max((Number.isFinite(maxValue) ? maxValue : 0) * 1.12, 0.01);
  const exponent = Math.floor(Math.log10(target));
  let best = null;
  for (let power = exponent - 3; power <= exponent + 1; power += 1) {
      for (const factor of [1, 2, 2.5, 5, 10]) {
      const step = factor * 10 ** power;
      for (let intervals = 3; intervals <= 5; intervals += 1) {
        const max = step * intervals;
        if (max + 1e-12 < target) continue;
        const score = (max - target) / target + Math.abs(intervals - 4) * 0.03;
        if (!best || score < best.score) best = { step, intervals, max, score };
      }
    }
  }
  const { step, intervals, max } = best;
  const ticks = Array.from({ length: intervals + 1 }, (_, index) => step * index);
  const digits = [0, 1, 2, 3, 4, 5].find((count) => Math.abs(step - Number(step.toFixed(count))) < 1e-10) ?? 5;
  return { max, ticks, digits };
}
