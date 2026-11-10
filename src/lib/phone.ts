// US numbers, stored as 10 digits.
export const phoneDigits = (raw: string) =>
  raw
    .replace(/\D/g, "")
    .replace(/^1(?=\d{10}$)/, "")
    .slice(0, 10);

export const isValidPhone = (raw: string) => phoneDigits(raw).length === 10;

export function formatPhone(raw: string) {
  const d = phoneDigits(raw);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const smsHref = (digits: string, body?: string) =>
  `sms:+1${digits}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;
