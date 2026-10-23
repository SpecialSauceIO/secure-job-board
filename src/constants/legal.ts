/**
 * Centralized Corporate & Legal Entity Configuration for specialsauce.io
 *
 * When your Texas Operating LLC filing and Registered Agent address are finalized,
 * update the defaults below (or set NEXT_PUBLIC_LEGAL_ENTITY_NAME /
 * NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS in Vercel) and every legal page updates automatically.
 */

export const LEGAL_CONFIG = {
  brandName: 'Special Sauce',
  domain: 'specialsauce.io',
  legalEntityName:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || 'Special Sauce (specialsauce.io)',
  legalEntityAddress:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS ||
    ' State of Texas, United States (Corporate Address on file; requestable via legal@specialsauce.io)',
  governingState: 'State of Texas',
  lastUpdated: 'October 23, 2026',
  legalEmail: 'legal@specialsauce.io',
  privacyEmail: 'privacy@specialsauce.io',
  supportEmail: 'info@specialsauce.io',
} as const
