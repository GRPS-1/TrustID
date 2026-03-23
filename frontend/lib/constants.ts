// Valid credential types
export const CREDENTIAL_TYPES = {
  CERTIFICATE: 'certificate',
  DEGREE: 'degree',
  ID_CARD: 'id_card',
  LICENSE: 'license',
  PASSPORT: 'passport',
  OTHER: 'other',
} as const;

export type CredentialType = typeof CREDENTIAL_TYPES[keyof typeof CREDENTIAL_TYPES];

// Valid access levels
export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type AccessLevel = typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS];

// Valid credential statuses
export const CREDENTIAL_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
} as const;

export type CredentialStatus = typeof CREDENTIAL_STATUS[keyof typeof CREDENTIAL_STATUS];

// Validation functions
export function isValidCredentialType(type: string): type is CredentialType {
  return Object.values(CREDENTIAL_TYPES).includes(type as CredentialType);
}

export function isValidAccessLevel(access: string): access is AccessLevel {
  return Object.values(ACCESS_LEVELS).includes(access as AccessLevel);
}

export function isValidStatus(status: string): status is CredentialStatus {
  return Object.values(CREDENTIAL_STATUS).includes(status as CredentialStatus);
}

// Display labels
export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  [CREDENTIAL_TYPES.CERTIFICATE]: 'Certificate',
  [CREDENTIAL_TYPES.DEGREE]: 'Degree',
  [CREDENTIAL_TYPES.ID_CARD]: 'ID Card',
  [CREDENTIAL_TYPES.LICENSE]: 'License',
  [CREDENTIAL_TYPES.PASSPORT]: 'Passport',
  [CREDENTIAL_TYPES.OTHER]: 'Other',
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  [ACCESS_LEVELS.PUBLIC]: 'Public',
  [ACCESS_LEVELS.PRIVATE]: 'Private',
};

export const STATUS_LABELS: Record<CredentialStatus, string> = {
  [CREDENTIAL_STATUS.ACTIVE]: 'Active',
  [CREDENTIAL_STATUS.REVOKED]: 'Revoked',
  [CREDENTIAL_STATUS.SUSPENDED]: 'Suspended',
  [CREDENTIAL_STATUS.EXPIRED]: 'Expired',
};
