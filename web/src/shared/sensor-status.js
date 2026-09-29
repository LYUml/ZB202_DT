// WS301 reports 0 for closed and >0 for open; WS303 reports 0 for dry and >0 for leak.
// A missing status reading cannot establish a normal state.
export function safetySensorStatus(model, values = {}) {
  const key = model === "WS301" ? "magnetStatus" : model === "WS303" ? "leakageStatus" : null;
  if (!key) return null;
  const value = values[key];
  if (!Number.isFinite(value)) return "unavailable";
  return value > 0 ? "fault" : "normal";
}
