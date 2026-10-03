export type PaymentMethod = 'cash' | 'qr_code' | 'bank_transfer' | 'other';
export type AccessPolicy = 'admin_only_edit' | 'open_edit';

export interface FundInstance {
  id: string;
  name: string;
  code: string; // e.g. KUN-2026 or KUN-XXXX
  description?: string;
  ownerId: string;
  ownerEmail?: string;
  currency: string;
  defaultDailyAmount: number;
  bankDetails?: string;
  qrCodeUrl?: string;
  reminderTemplate?: string;
  accessPolicy?: AccessPolicy;
  monthlyTargetGoal?: number;
  dailyTargetGoal?: number;
  targetTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMembership {
  id: string;
  userId: string;
  fundId: string;
  fundName: string;
  fundCode: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface Member {
  id: string;
  fundId?: string;
  fullName: string;
  phone: string;
  address?: string;
  defaultDailyAmount: number;
  joinDate: string; // YYYY-MM-DD
  status: 'active' | 'inactive';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  id: string;
  fundId?: string;
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  hasDonated: boolean;
  amount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundSettings {
  id: string;
  orgName: string;
  currency: string;
  defaultDailyAmount: number;
  qrCodeUrl?: string;
  bankDetails?: string;
  reminderTemplate?: string;
  accessPolicy?: AccessPolicy;
  monthlyTargetGoal?: number;
  dailyTargetGoal?: number;
  targetTitle?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Reminder {
  id: string;
  fundId?: string;
  memberId: string;
  memberName: string;
  date: string;
  message: string;
  channel: 'push' | 'whatsapp' | 'sms';
  status: 'sent' | 'pending';
  createdBy: string;
  createdAt: string;
}

export interface MemberMonthlyStats {
  member: Member;
  daysDonated: number;
  totalDonated: number;
  expectedAmount: number;
  fulfillmentRate: number; // percentage (0 - 100)
  longestStreak: number;
}
