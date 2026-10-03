import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
  Member,
  Contribution,
  FundSettings,
  Reminder,
  PaymentMethod,
  FundInstance,
  UserMembership,
  AccessPolicy,
} from '../types';

interface FundContextType {
  members: Member[];
  contributions: Contribution[];
  settings: FundSettings;
  reminders: Reminder[];
  loading: boolean;
  online: boolean;
  currentFund: FundInstance;
  userMemberships: UserMembership[];
  allPublicFunds: FundInstance[];
  canEdit: boolean;
  isReadOnlyMode: boolean;
  isOwner: boolean;
  toggleReadOnlyMode: () => void;
  setAccessPolicy: (policy: AccessPolicy) => Promise<void>;
  switchFund: (fundId: string) => void;
  joinFundByCode: (code: string) => Promise<{ success: boolean; message: string; fund?: FundInstance }>;
  createFund: (
    name: string,
    code?: string,
    description?: string,
    dailyAmount?: number,
    currency?: string
  ) => Promise<string>;
  addMember: (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<string>;
  updateMember: (id: string, data: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  recordDailyContribution: (
    memberId: string,
    date: string,
    hasDonated: boolean,
    amount?: number,
    paymentMethod?: PaymentMethod,
    remarks?: string
  ) => Promise<void>;
  batchRecordDate: (date: string, hasDonated: boolean) => Promise<void>;
  updateSettings: (data: Partial<FundSettings>) => Promise<void>;
  logReminder: (memberId: string, memberName: string, channel: 'push' | 'whatsapp' | 'sms', message: string, date: string) => Promise<void>;
  seedInitialDataIfEmpty: () => Promise<void>;
}

const DEFAULT_FUND_ID = 'fund_kun_main';
const DEFAULT_FUND: FundInstance = {
  id: DEFAULT_FUND_ID,
  name: 'KUN Samajik Kosh (कुन सामाजिक कोष)',
  code: 'KUN-2026',
  description: 'Official central community welfare and daily contribution fund.',
  ownerId: 'admin',
  ownerEmail: 'nikeshchaulagain50@gmail.com',
  currency: 'रू',
  defaultDailyAmount: 10,
  bankDetails: 'Bank: NIC Asia Bank\nAccount Name: KUN Samajik Kosh\nAccount No: 2940582910482910\nBranch: Kathmandu Main\neSewa ID: 9841000000',
  reminderTemplate: 'नमस्ते {name} ज्यू, KUN Samajik Kosh मा आज मिति {date} को दैनिक योगदान रू {amount} बाँकी रहेको व्यहोरा सादर स्मरण गराउँदछौं। धन्यवाद!',
  qrCodeUrl: '',
  accessPolicy: 'admin_only_edit',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const FundContext = createContext<FundContextType>({
  members: [],
  contributions: [],
  settings: {
    id: DEFAULT_FUND_ID,
    orgName: DEFAULT_FUND.name,
    currency: DEFAULT_FUND.currency,
    defaultDailyAmount: DEFAULT_FUND.defaultDailyAmount,
    bankDetails: DEFAULT_FUND.bankDetails,
    reminderTemplate: DEFAULT_FUND.reminderTemplate,
    accessPolicy: 'admin_only_edit',
  },
  reminders: [],
  loading: true,
  online: true,
  currentFund: DEFAULT_FUND,
  userMemberships: [],
  allPublicFunds: [],
  canEdit: true,
  isReadOnlyMode: false,
  isOwner: false,
  toggleReadOnlyMode: () => {},
  setAccessPolicy: async () => {},
  switchFund: () => {},
  joinFundByCode: async () => ({ success: false, message: '' }),
  createFund: async () => '',
  addMember: async () => '',
  updateMember: async () => {},
  deleteMember: async () => {},
  recordDailyContribution: async () => {},
  batchRecordDate: async () => {},
  updateSettings: async () => {},
  logReminder: async () => {},
  seedInitialDataIfEmpty: async () => {},
});

export const FundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  const [currentFundId, setCurrentFundId] = useState<string>(() => {
    return localStorage.getItem('kun_selected_fund_id') || DEFAULT_FUND_ID;
  });

  const [allFunds, setAllFunds] = useState<FundInstance[]>([DEFAULT_FUND]);
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [online, setOnline] = useState<boolean>(true);

  // Manual viewer simulation state
  const [manualReadOnly, setManualReadOnly] = useState<boolean>(() => {
    return localStorage.getItem('kun_force_read_only') === 'true';
  });

  // Connection check
  useEffect(() => {
    testConnection().then((isConnected) => setOnline(isConnected));
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Funds
  useEffect(() => {
    if (!currentUser) return;
    const unsubFunds = onSnapshot(
      collection(db, 'funds'),
      (snapshot) => {
        const fundsList: FundInstance[] = [];
        snapshot.forEach((d) => {
          fundsList.push({ id: d.id, ...(d.data() as Omit<FundInstance, 'id'>) });
        });
        if (!fundsList.some((f) => f.id === DEFAULT_FUND_ID)) {
          fundsList.unshift(DEFAULT_FUND);
        }
        setAllFunds(fundsList);
      },
      (err) => {
        console.warn('Funds load err:', err);
      }
    );

    // Listen to User Memberships
    const unsubMemberships = onSnapshot(
      query(collection(db, 'user_memberships'), where('userId', '==', currentUser.uid)),
      (snapshot) => {
        const mems: UserMembership[] = [];
        snapshot.forEach((d) => {
          mems.push({ id: d.id, ...(d.data() as Omit<UserMembership, 'id'>) });
        });
        setUserMemberships(mems);
      },
      (err) => {
        console.warn('Memberships error:', err);
      }
    );

    return () => {
      unsubFunds();
      unsubMemberships();
    };
  }, [currentUser]);

  // Active Fund object
  const currentFund = allFunds.find((f) => f.id === currentFundId) || DEFAULT_FUND;

  // Determine permissions
  const isOwner = Boolean(
    currentUser &&
      (currentFund.ownerId === currentUser.uid ||
        currentFund.ownerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
        isSuperAdmin)
  );

  const policy: AccessPolicy = currentFund.accessPolicy || 'admin_only_edit';
  const hasBasePermission = isOwner || policy === 'open_edit';
  const canEdit = hasBasePermission && !manualReadOnly;
  const isReadOnlyMode = !canEdit;

  const toggleReadOnlyMode = () => {
    setManualReadOnly((prev) => {
      const next = !prev;
      localStorage.setItem('kun_force_read_only', String(next));
      return next;
    });
  };

  const settings: FundSettings = {
    id: currentFund.id,
    orgName: currentFund.name,
    currency: currentFund.currency,
    defaultDailyAmount: currentFund.defaultDailyAmount,
    bankDetails: currentFund.bankDetails,
    qrCodeUrl: currentFund.qrCodeUrl,
    reminderTemplate: currentFund.reminderTemplate,
    accessPolicy: policy,
    monthlyTargetGoal: currentFund.monthlyTargetGoal,
    dailyTargetGoal: currentFund.dailyTargetGoal,
    targetTitle: currentFund.targetTitle,
  };

  // Sync Members and Contributions for the selected Fund
  useEffect(() => {
    if (!currentUser) {
      setMembers([]);
      setContributions([]);
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Sync Members
    const membersPath = 'members';
    const unsubMembers = onSnapshot(
      collection(db, membersPath),
      (snapshot) => {
        const mems: Member[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Member, 'id'>;
          if (data.fundId === currentFundId || (!data.fundId && currentFundId === DEFAULT_FUND_ID)) {
            mems.push({ id: docSnap.id, ...data });
          }
        });
        mems.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setMembers(mems);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, membersPath);
      }
    );

    // Sync Contributions
    const contribsPath = 'contributions';
    const unsubContribs = onSnapshot(
      collection(db, contribsPath),
      (snapshot) => {
        const list: Contribution[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Contribution, 'id'>;
          if (data.fundId === currentFundId || (!data.fundId && currentFundId === DEFAULT_FUND_ID)) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        setContributions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, contribsPath);
      }
    );

    // Sync Reminders
    const remindersPath = 'reminders';
    const unsubReminders = onSnapshot(
      collection(db, remindersPath),
      (snapshot) => {
        const rems: Reminder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<Reminder, 'id'>;
          if (data.fundId === currentFundId || (!data.fundId && currentFundId === DEFAULT_FUND_ID)) {
            rems.push({ id: docSnap.id, ...data });
          }
        });
        rems.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setReminders(rems.slice(0, 50));
      },
      (error) => {
        console.warn('Reminders sync:', error);
      }
    );

    return () => {
      unsubMembers();
      unsubContribs();
      unsubReminders();
    };
  }, [currentUser, currentFundId]);

  // Seed default community members if database is fresh
  const seedInitialDataIfEmpty = useCallback(async () => {
    if (!currentUser || members.length > 0) return;

    try {
      await setDoc(
        doc(db, 'funds', DEFAULT_FUND_ID),
        {
          name: DEFAULT_FUND.name,
          code: DEFAULT_FUND.code,
          description: DEFAULT_FUND.description,
          ownerId: currentUser.uid,
          ownerEmail: currentUser.email || 'nikeshchaulagain50@gmail.com',
          currency: DEFAULT_FUND.currency,
          defaultDailyAmount: DEFAULT_FUND.defaultDailyAmount,
          bankDetails: DEFAULT_FUND.bankDetails,
          reminderTemplate: DEFAULT_FUND.reminderTemplate,
          accessPolicy: 'admin_only_edit',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Ignore if exists
    }

    const initialMembers = [
      { fullName: 'Nikesh Chaulagain', phone: '9841234567', address: 'Ward 4, Kathmandu', defaultDailyAmount: 10, status: 'active' as const, joinDate: '2026-01-01', notes: 'Co-ordinator / Admin' },
      { fullName: 'Ramesh Adhikari', phone: '9851123456', address: 'Ward 2, KUN Community', defaultDailyAmount: 10, status: 'active' as const, joinDate: '2026-01-05', notes: 'Treasurer' },
      { fullName: 'Sita Sharma', phone: '9861987654', address: 'Ward 1, KUN Community', defaultDailyAmount: 10, status: 'active' as const, joinDate: '2026-01-10', notes: 'Member' },
      { fullName: 'Bikash Shrestha', phone: '9813234567', address: 'Ward 3, KUN Community', defaultDailyAmount: 10, status: 'active' as const, joinDate: '2026-01-12', notes: 'Member' },
      { fullName: 'Gita Thapa', phone: '9849876543', address: 'Ward 2, KUN Community', defaultDailyAmount: 20, status: 'active' as const, joinDate: '2026-02-01', notes: 'Vice President' },
    ];

    const today = new Date().toISOString().split('T')[0];
    const monthKey = today.substring(0, 7);

    for (let i = 0; i < initialMembers.length; i++) {
      const m = initialMembers[i];
      const memberId = `member_${Date.now()}_${i}`;
      const memberDoc = {
        ...m,
        fundId: DEFAULT_FUND_ID,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'members', memberId), memberDoc);

      const contribId = `${memberId}_${today}`;
      const contribDoc = {
        fundId: DEFAULT_FUND_ID,
        memberId,
        memberName: m.fullName,
        date: today,
        monthKey,
        hasDonated: i < 3,
        amount: i < 3 ? m.defaultDailyAmount : 0,
        paymentMethod: i === 0 ? 'qr_code' : 'cash',
        remarks: i < 3 ? 'Regular daily fund' : '',
        recordedBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'contributions', contribId), contribDoc);
    }
  }, [currentUser, members.length]);

  const switchFund = (fundId: string) => {
    setCurrentFundId(fundId);
    localStorage.setItem('kun_selected_fund_id', fundId);
  };

  const joinFundByCode = async (
    code: string
  ): Promise<{ success: boolean; message: string; fund?: FundInstance }> => {
    if (!currentUser) return { success: false, message: 'Please sign in with Google first.' };
    const cleanCode = code.trim().toUpperCase();

    const foundFund = allFunds.find(
      (f) => f.code.toUpperCase() === cleanCode || f.id === code.trim()
    );

    if (!foundFund) {
      return {
        success: false,
        message: `No Samajik Kosh found with code "${code}". Please check with the administrator.`,
      };
    }

    try {
      const isFundOwner = foundFund.ownerId === currentUser.uid;
      const membershipId = `memship_${currentUser.uid}_${foundFund.id}`;
      const membershipData: Omit<UserMembership, 'id'> = {
        userId: currentUser.uid,
        fundId: foundFund.id,
        fundName: foundFund.name,
        fundCode: foundFund.code,
        role: isFundOwner ? 'admin' : 'viewer',
        joinedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'user_memberships', membershipId), membershipData, { merge: true });
      switchFund(foundFund.id);

      return {
        success: true,
        message: `Successfully joined ${foundFund.name} in View-Only mode!`,
        fund: foundFund,
      };
    } catch (err) {
      console.error('Join fund error:', err);
      return { success: false, message: 'Could not complete joining. Please try again.' };
    }
  };

  const createFund = async (
    name: string,
    customCode?: string,
    description?: string,
    dailyAmount: number = 10,
    currency: string = 'रू'
  ): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in');

    const cleanName = name.trim();
    const fundId = `fund_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const code = (
      customCode?.trim().toUpperCase() ||
      `${cleanName.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    ).replace(/[^A-Z0-9\-]/g, '');

    const newFund: Omit<FundInstance, 'id'> = {
      name: cleanName,
      code,
      description: description || 'Community Welfare Fund',
      ownerId: currentUser.uid,
      ownerEmail: currentUser.email || '',
      currency,
      defaultDailyAmount: dailyAmount,
      bankDetails: `Bank Name: \nAccount Name: ${cleanName}\nAccount No: \nBranch: \neSewa/Fonepay: `,
      reminderTemplate: `नमस्ते {name} ज्यू, ${cleanName} मा मिति {date} को दैनिक योगदान रू {amount} बाँकी रहेको व्यहोरा अनुरोध गर्दछौं। धन्यवाद!`,
      accessPolicy: 'admin_only_edit',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'funds', fundId), newFund);

    const membershipId = `memship_${currentUser.uid}_${fundId}`;
    await setDoc(doc(db, 'user_memberships', membershipId), {
      userId: currentUser.uid,
      fundId,
      fundName: cleanName,
      fundCode: code,
      role: 'admin',
      joinedAt: new Date().toISOString(),
    });

    switchFund(fundId);
    return fundId;
  };

  const setAccessPolicy = async (newPolicy: AccessPolicy) => {
    if (!isOwner) throw new Error('Only the fund administrator can modify the access policy.');
    await updateSettings({ accessPolicy: newPolicy });
  };

  const addMember = async (data: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in with Google');
    if (!canEdit) throw new Error('You have read-only access. Only administrators can add members.');

    const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDoc: Omit<Member, 'id'> = {
      ...data,
      fundId: currentFundId,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'members', memberId), newDoc);
      return memberId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `members/${memberId}`);
    }
  };

  const updateMember = async (id: string, data: Partial<Member>): Promise<void> => {
    if (!currentUser) throw new Error('Must be signed in');
    if (!canEdit) throw new Error('You have read-only access. Only administrators can modify members.');

    try {
      const cleanData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      delete (cleanData as Record<string, unknown>).id;
      delete (cleanData as Record<string, unknown>).createdAt;
      delete (cleanData as Record<string, unknown>).createdBy;
      await setDoc(doc(db, 'members', id), cleanData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `members/${id}`);
    }
  };

  const deleteMember = async (id: string): Promise<void> => {
    if (!currentUser) throw new Error('Must be signed in');
    if (!canEdit) throw new Error('You have read-only access. Only administrators can delete members.');

    try {
      await deleteDoc(doc(db, 'members', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
    }
  };

  const recordDailyContribution = async (
    memberId: string,
    date: string,
    hasDonated: boolean,
    amount?: number,
    paymentMethod: PaymentMethod = 'cash',
    remarks: string = ''
  ): Promise<void> => {
    if (!currentUser) throw new Error('Must be signed in');
    if (!canEdit) throw new Error('You are in View-Only access mode. You can view all records and financial reports, but modifications are restricted to Administrators.');

    const member = members.find((m) => m.id === memberId);
    const finalAmount = hasDonated ? (amount !== undefined ? amount : member?.defaultDailyAmount || 10) : 0;
    const monthKey = date.substring(0, 7);
    const contributionId = `${memberId}_${date}`;

    const data: Omit<Contribution, 'id'> = {
      fundId: currentFundId,
      memberId,
      memberName: member?.fullName || 'Member',
      date,
      monthKey,
      hasDonated,
      amount: Number(finalAmount),
      paymentMethod,
      remarks,
      recordedBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'contributions', contributionId), data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `contributions/${contributionId}`);
    }
  };

  const batchRecordDate = async (date: string, hasDonated: boolean): Promise<void> => {
    if (!currentUser) throw new Error('Must be signed in');
    if (!canEdit) throw new Error('You have read-only access. Batch recording is restricted to administrators.');

    const activeMembers = members.filter((m) => m.status === 'active');
    for (const member of activeMembers) {
      await recordDailyContribution(
        member.id,
        date,
        hasDonated,
        hasDonated ? member.defaultDailyAmount : 0,
        'cash',
        hasDonated ? 'Daily community contribution' : ''
      );
    }
  };

  const updateSettings = async (data: Partial<FundSettings>): Promise<void> => {
    if (!currentUser) throw new Error('Must be signed in');
    if (!isOwner) throw new Error('Only the fund administrator can update settings.');

    try {
      const fundUpdate: Partial<FundInstance> = {
        updatedAt: new Date().toISOString(),
      };
      if (data.orgName) fundUpdate.name = data.orgName;
      if (data.currency) fundUpdate.currency = data.currency;
      if (data.defaultDailyAmount !== undefined) fundUpdate.defaultDailyAmount = data.defaultDailyAmount;
      if (data.bankDetails !== undefined) fundUpdate.bankDetails = data.bankDetails;
      if (data.qrCodeUrl !== undefined) fundUpdate.qrCodeUrl = data.qrCodeUrl;
      if (data.reminderTemplate !== undefined) fundUpdate.reminderTemplate = data.reminderTemplate;
      if (data.accessPolicy !== undefined) fundUpdate.accessPolicy = data.accessPolicy;
      if (data.monthlyTargetGoal !== undefined) fundUpdate.monthlyTargetGoal = data.monthlyTargetGoal;
      if (data.dailyTargetGoal !== undefined) fundUpdate.dailyTargetGoal = data.dailyTargetGoal;
      if (data.targetTitle !== undefined) fundUpdate.targetTitle = data.targetTitle;

      await setDoc(doc(db, 'funds', currentFundId), fundUpdate, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `funds/${currentFundId}`);
    }
  };

  const logReminder = async (
    memberId: string,
    memberName: string,
    channel: 'push' | 'whatsapp' | 'sms',
    message: string,
    date: string
  ): Promise<void> => {
    if (!currentUser) return;
    const reminderId = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const data: Omit<Reminder, 'id'> = {
      fundId: currentFundId,
      memberId,
      memberName,
      date,
      message,
      channel,
      status: 'sent',
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'reminders', reminderId), data);
    } catch (err) {
      console.warn('Reminder logging error:', err);
    }
  };

  return (
    <FundContext.Provider
      value={{
        members,
        contributions,
        settings,
        reminders,
        loading,
        online,
        currentFund,
        userMemberships,
        allPublicFunds: allFunds,
        canEdit,
        isReadOnlyMode,
        isOwner,
        toggleReadOnlyMode,
        setAccessPolicy,
        switchFund,
        joinFundByCode,
        createFund,
        addMember,
        updateMember,
        deleteMember,
        recordDailyContribution,
        batchRecordDate,
        updateSettings,
        logReminder,
        seedInitialDataIfEmpty,
      }}
    >
      {children}
    </FundContext.Provider>
  );
};

export const useFund = () => useContext(FundContext);
