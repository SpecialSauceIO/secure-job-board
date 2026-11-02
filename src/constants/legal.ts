/**
 * Centralized Corporate & Legal Entity Configuration for specialsauce.io
 *
 * Operated by Special Sauce Solutions LLC (Texas Operating LLC).
 * All public legal, privacy, and general inquiries route through info@specialsauce.io.
 */

export const LEGAL_CONFIG = {
  brandName: 'Special Sauce',
  domain: 'specialsauce.io',
  legalEntityName:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || 'Special Sauce Solutions LLC',
  legalEntityAddress:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS ||
    '5900 Balcones Dr #34619, Austin, TX 78731 US',
  governingState: 'State of Texas',
  lastUpdated: 'November 1, 2026',
  legalEmail: 'info@specialsauce.io',
  privacyEmail: 'info@specialsauce.io',
  supportEmail: 'info@specialsauce.io',
} as const
