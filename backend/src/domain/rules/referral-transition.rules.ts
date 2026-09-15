import type { ReferralStatus, UserRole } from '../models/referral.model.ts';

export const VALID_STATUS_TRANSITIONS: Record<ReferralStatus, readonly ReferralStatus[]> = {
  REFERRAL_INITIATED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['BED_RESERVATION'],
  REJECTED: [],
  BED_RESERVATION: ['PATIENT_ARRIVAL'],
  PATIENT_ARRIVAL: ['BED_ALLOTTED'],
  BED_ALLOTTED: ['TREATMENT_ONGOING'],
  TREATMENT_ONGOING: ['COMPLETED'],
  COMPLETED: []
};

export const ROLE_ALLOWED_TRANSITIONS: Record<UserRole, readonly ReferralStatus[]> = {
  doctor: ['REJECTED'],
  facility: ['ACCEPTED', 'REJECTED', 'BED_RESERVATION', 'PATIENT_ARRIVAL', 'BED_ALLOTTED', 'TREATMENT_ONGOING', 'COMPLETED'],
  patient: [],
  admin: ['ACCEPTED', 'REJECTED', 'BED_RESERVATION', 'PATIENT_ARRIVAL', 'BED_ALLOTTED', 'TREATMENT_ONGOING', 'COMPLETED']
};

export interface TransitionValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

export function validateStatusTransition(
  currentStatus: ReferralStatus,
  targetStatus: ReferralStatus,
  userRole: UserRole
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return {
      isValid: false,
      error: `Referral is already in status '${currentStatus}'.`
    };
  }

  const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus];
  if (!allowedNextStatuses || !allowedNextStatuses.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Invalid status transition: Cannot transition from '${currentStatus}' directly to '${targetStatus}'. Allowed next statuses: [${allowedNextStatuses?.join(', ') || 'none'}].`
    };
  }

  const roleAllowed = ROLE_ALLOWED_TRANSITIONS[userRole];
  if (!roleAllowed || !roleAllowed.includes(targetStatus)) {
    return {
      isValid: false,
      error: `Role '${userRole}' is not authorized to transition referral to '${targetStatus}'.`
    };
  }

  return { isValid: true };
}
