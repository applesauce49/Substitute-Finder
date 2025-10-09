// src/utils/dateUtils.js
export function formatDateLocal(dateLike, includeTime = false) {
  const js = new Date(dateLike);
  const y = js.getFullYear();
  const m = String(js.getMonth() + 1).padStart(2, "0");
  const d = String(js.getDate()).padStart(2, "0");
  if (includeTime) {
    const hh = String(js.getHours()).padStart(2, "0");
    const min = String(js.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${min}`;
  }
  return `${y}-${m}-${d}`;
}