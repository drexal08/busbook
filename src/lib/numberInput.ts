export function sanitizeRwfAmountInput(value: string): string {
  return value
    .replace(/[^\d,\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^ /, '');
}

export function parseRwfAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const validFormat = /^\d+$|^\d{1,3}(?:[ ,]\d{3})+$/.test(trimmed);
  if (!validFormat) return null;

  const normalized = trimmed.replace(/[ ,]/g, '');
  const amount = Number(normalized);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

export function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
