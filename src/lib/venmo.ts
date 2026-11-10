// Opens Venmo with the amount and note filled in.
export function venmoPayUrl(handle: string, amount: number, note: string) {
  const params = new URLSearchParams({
    txn: "pay",
    amount: amount.toFixed(2),
    note,
  });
  return `https://venmo.com/${encodeURIComponent(handle.replace(/^@/, ""))}?${params}`;
}
