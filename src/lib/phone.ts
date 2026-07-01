const RWANDA_MOBILE_REGEX = /^(\+250|250|0)7\d{8}$/;

export const RWANDA_PAYMENT_PREFIXES = ['072', '073', '078', '079'] as const;

export function normalizePhoneInput(value: string): string {
  const compact = value.replace(/\s+/g, '');
  const stripped = compact.replace(/[^\d+]/g, '');

  if (stripped.startsWith('+')) {
    return `+${stripped.slice(1).replace(/\+/g, '')}`;
  }

  return stripped.replace(/\+/g, '');
}

export function isValidRwandaMobilePhone(phone: string): boolean {
  return RWANDA_MOBILE_REGEX.test(normalizePhoneInput(phone));
}

export function isSupportedPaymentPrefix(phone: string): boolean {
  const normalized = normalizePhoneInput(phone);

  return RWANDA_PAYMENT_PREFIXES.some((prefix) => {
    const prefixWithoutZero = prefix.slice(1);
    return (
      normalized.startsWith(prefix) ||
      normalized.startsWith(`250${prefixWithoutZero}`) ||
      normalized.startsWith(`+250${prefixWithoutZero}`)
    );
  });
}

export function validateSupportedPhone(phone: string): string {
  const normalized = normalizePhoneInput(phone);

  if (!normalized) {
    return 'Phone number is required';
  }

  if (!isValidRwandaMobilePhone(normalized)) {
    return 'Use a valid Rwanda mobile number';
  }

  if (!isSupportedPaymentPrefix(normalized)) {
    return 'Use a number starting with 072, 073, 078, or 079';
  }

  return '';
}

export function toRwandaE164Phone(phone: string): string {
  const normalized = normalizePhoneInput(phone);

  if (!isValidRwandaMobilePhone(normalized) || !isSupportedPaymentPrefix(normalized)) {
    return '';
  }

  if (normalized.startsWith('+250')) {
    return normalized;
  }

  if (normalized.startsWith('250')) {
    return `+${normalized}`;
  }

  return `+250${normalized.slice(1)}`;
}
