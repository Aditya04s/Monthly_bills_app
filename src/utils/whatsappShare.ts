import type { PartyCalculationResult } from '../types/calculation';

const INDIA_COUNTRY_CODE = '91';
const MIN_WHATSAPP_DIGITS = 11;
const MAX_WHATSAPP_DIGITS = 15;

export interface PhoneSanitizationResult {
  phoneNumber?: string;
  error?: string;
}

export function sanitizeWhatsAppPhoneNumber(value: string): PhoneSanitizationResult {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { error: 'Add a phone number in Settings before sharing.' };
  }

  const withoutInternationalPrefix = trimmedValue.replace(/^00/, '');
  let digits = withoutInternationalPrefix.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  const phoneNumber = digits.length === 10 ? `${INDIA_COUNTRY_CODE}${digits}` : digits;

  if (
    phoneNumber.length < MIN_WHATSAPP_DIGITS ||
    phoneNumber.length > MAX_WHATSAPP_DIGITS ||
    phoneNumber.startsWith('0') ||
    /^0+$/.test(phoneNumber)
  ) {
    return { error: 'Enter a valid WhatsApp number in Settings.' };
  }

  return { phoneNumber };
}

export function createWhatsAppShareUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function createPartyBillMessage(
  party: PartyCalculationResult,
  displayName = party.partyName,
  date = new Date()
): string {
  const monthTitle = new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric'
  }).format(date);
  const lines = party.bills.map((bill) => `${bill.label}: ${bill.amount.formatted}`);

  return [
    `Hi ${displayName},`,
    '',
    `Utility Bill Summary for ${monthTitle}`,
    '',
    ...lines,
    '',
    `Total Payable: ${party.total.formatted}`
  ].join('\n');
}
