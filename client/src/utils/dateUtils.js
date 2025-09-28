// src/utils/dateUtils.js
export function formatDateLocal(dateLike) {
  const js = new Date(dateLike);
  const y = js.getFullYear();
  const m = String(js.getMonth() + 1).padStart(2, "0");
  const d = String(js.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}