import { z } from "zod";

export function normalizeRut(input: string): string {
  const raw = String(input ?? "")
    .toUpperCase()
    .replace(/[^0-9K]/g, "");
  if (!raw) return "";
  const dv = raw.slice(-1);
  const body = raw.slice(0, -1).replace(/^0+/, "");
  return body && dv ? `${body}-${dv}` : "";
}

export function computeCheckDigit(bodyDigits: string): string {
  let sum = 0;
  let mul = 2;
  for (let i = bodyDigits.length - 1; i >= 0; i--) {
    sum += parseInt(bodyDigits[i]!, 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

export function isValidRut(input: string): boolean {
  const norm = normalizeRut(input);
  const m = norm.match(/^(\d+)-([\dK])$/i);
  if (!m) return false;
  const [, body, dv] = m;
  return computeCheckDigit(body) === dv.toUpperCase();
}

export function formatRut(input: string): string {
  const norm = normalizeRut(input);
  const m = norm.match(/^(\d+)-([\dK])$/i);
  if (!m) return norm;
  const [, body, dv] = m;
  let out = "";
  let cnt = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    out = body[i]! + out;
    cnt++;
    if (cnt === 3 && i > 0) {
      out = "." + out;
      cnt = 0;
    }
  }
  return `${out}-${dv.toUpperCase()}`;
}

export const zRutString = z
  .string()
  .trim()
  .transform((v) => normalizeRut(v))
  .refine((v) => isValidRut(v), { message: "RUT inválido" });
