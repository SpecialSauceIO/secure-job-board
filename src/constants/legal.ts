/**
 * Centralized Corporate & Legal Entity Configuration for specialsauce.io
 *
 * Operated by Special Sauce Solutions LLC (Texas Operating LLC).
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
  lastUpdated: 'October 24, 2026',
  legalEmail: 'legal@specialsauce.io',
  privacyEmail: 'privacy@specialsauce.io',
  supportEmail: 'info@specialsauce.io',
} as const
