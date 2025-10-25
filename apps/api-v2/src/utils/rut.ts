export function normalizeRut(input: string): string {
  const raw = (input || "").toUpperCase().replace(/[^0-9K]/g, "");
  if (!raw) return "";
  const dv = raw.slice(-1);
  const body = raw.slice(0, -1).replace(/^0+/, "");
  return body && dv ? `${body}-${dv}` : "";
}
