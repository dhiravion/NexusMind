import type {
  Referral,
  ReferralStatus,
  ReferralStatusHistoryItem,
  CreateReferralDto,
  UpdateReferralStatusDto,
  UserRole
} from '../../domain/models/referral.model.ts';
import { validateStatusTransition } from '../../domain/rules/referral-transition.rules.ts';
import { InMemoryReferralStore } from '../../infrastructure/cache/referral.store.ts';

export interface ReferralListFilters {
  readonly role?: UserRole;
  readonly status?: ReferralStatus;
  readonly facilityId?: string;
  readonly doctorId?: string;
  readonly patientId?: string;
  readonly search?: string;
}

export interface ReferralStats {
  readonly total: number;
  readonly pending: number; // REFERRAL_INITIATED, ACCEPTED, BED_RESERVATION, PATIENT_ARRIVAL, BED_ALLOTTED, TREATMENT_ONGOING
  readonly rejected: number; // REJECTED
  readonly completed: number; // COMPLETED
}

export class ManageReferralUseCase {
  private readonly store: InMemoryReferralStore;

  constructor(store: InMemoryReferralStore) {
    this.store = store;
  }

  public async createReferral(dto: CreateReferralDto): Promise<Referral> {
    if (!dto.patientName || !dto.receivingFacilityName || !dto.specialty || !dto.reason) {
      throw new Error('Missing required referral fields: patientName, receivingFacilityName, specialty, reason.');
    }

    const seq = this.store.getNextSequenceNumber();
    const formattedSeq = String(seq).padStart(5, '0');
    const referralId = `REF-2026-${formattedSeq}`;
    const internalId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const initialHistoryItem: ReferralStatusHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referralId,
      fromStatus: null,
      toStatus: 'REFERRAL_INITIATED',
      updatedBy: dto.referringDoctorName || 'Doctor',
      userRole: 'doctor',
      remarks: 'Digital referral initiated via MedVeda.',
      timestamp: now
    };

    const newReferral: Referral = {
      id: internalId,
      referralId,
      patientId: dto.patientId || `PAT-${Date.now().toString().slice(-4)}`,
      patientName: dto.patientName,
      patientAge: dto.patientAge,
      patientSex: dto.patientSex,
      patientPhone: dto.patientPhone || '',
      patientLocation: dto.patientLocation || 'Jharkhand',
      referringDoctorId: dto.referringDoctorId,
      referringDoctorName: dto.referringDoctorName,
      referringFacilityId: dto.referringFacilityId,
      referringFacilityName: dto.referringFacilityName,
      receivingFacilityId: dto.receivingFacilityId,
      receivingFacilityName: dto.receivingFacilityName,
      departmentReferredTo: dto.departmentReferredTo || 'General',
      specialty: dto.specialty,
      reason: dto.reason,
      clinicalSummary: dto.clinicalSummary || '',
      urgency: dto.urgency || 'Normal',
      icuPatient: dto.icuPatient || false,
      currentStep: 1,
      treatingDoctor: null,
      digitalSignature: dto.digitalSignature || null,
      bedAllocation: null,
      priorityRank: dto.urgency === 'Emergency' ? 1 : dto.urgency === 'Urgent' ? 2 : 3,
      status: 'REFERRAL_INITIATED',
      createdAt: now,
      updatedAt: now,
      statusHistory: [initialHistoryItem]
    };

    this.store.save(newReferral);
    this.store.appendHistory(initialHistoryItem);

    return newReferral;
  }

  public async updateReferralStatus(
    referralId: string,
    dto: UpdateReferralStatusDto
  ): Promise<Referral> {
    const referral = this.store.findByReferralId(referralId);
    if (!referral) {
      throw new Error(`Referral with ID '${referralId}' not found.`);
    }

    const validation = validateStatusTransition(referral.status, dto.toStatus, dto.userRole);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid referral status transition.');
    }

    const now = new Date().toISOString();
    const historyItem: ReferralStatusHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referralId,
      fromStatus: referral.status,
      toStatus: dto.toStatus,
      updatedBy: dto.updatedBy || dto.userRole,
      userRole: dto.userRole,
      remarks: dto.remarks || `Status transitioned to ${dto.toStatus}`,
      timestamp: now
    };

    const updatedHistory = [...referral.statusHistory, historyItem];

    const updatedReferral: Referral = {
      ...referral,
      status: dto.toStatus,
      updatedAt: now,
      statusHistory: updatedHistory,
      ...(dto.treatingDoctor !== undefined && { treatingDoctor: dto.treatingDoctor }),
      ...(dto.bedAllocation !== undefined && { bedAllocation: dto.bedAllocation }),
      ...(dto.currentStep !== undefined && { currentStep: dto.currentStep })
    };

    this.store.save(updatedReferral);
    this.store.appendHistory(historyItem);

    return updatedReferral;
  }

  public async getReferral(referralId: string): Promise<Referral | null> {
    const referral = this.store.findByReferralId(referralId);
    if (!referral) return null;
    const history = this.store.getHistoryByReferralId(referralId);
    return {
      ...referral,
      statusHistory: history
    };
  }

  public async listReferrals(filters?: ReferralListFilters): Promise<Referral[]> {
    let all = this.store.findAll();

    if (filters?.status) {
      all = all.filter((r) => r.status === filters.status);
    }

    if (filters?.facilityId) {
      all = all.filter(
        (r) =>
          r.receivingFacilityId === filters.facilityId ||
          r.referringFacilityId === filters.facilityId
      );
    }

    if (filters?.doctorId) {
      all = all.filter((r) => r.referringDoctorId === filters.doctorId);
    }

    if (filters?.patientId) {
      all = all.filter((r) => r.patientId === filters.patientId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      all = all.filter(
        (r) =>
          r.referralId.toLowerCase().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          r.specialty.toLowerCase().includes(q) ||
          r.receivingFacilityName.toLowerCase().includes(q)
      );
    }

    return all;
  }

  public async getPendingReferrals(): Promise<Referral[]> {
    const all = this.store.findAll();
    return all.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED');
  }

  public async getCompletedReferrals(): Promise<Referral[]> {
    const all = this.store.findAll();
    return all.filter((r) => r.status === 'COMPLETED');
  }

  public async getStats(): Promise<ReferralStats> {
    const all = this.store.findAll();
    return {
      total: all.length,
      pending: all.filter((r) => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length,
      rejected: all.filter((r) => r.status === 'REJECTED').length,
      completed: all.filter((r) => r.status === 'COMPLETED').length
    };
  }

  public async getHistory(referralId: string): Promise<ReferralStatusHistoryItem[]> {
    return this.store.getHistoryByReferralId(referralId);
  }

  public async deleteReferral(referralId: string): Promise<boolean> {
    return this.store.delete(referralId);
  }
}
