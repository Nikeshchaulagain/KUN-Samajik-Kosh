# Security Specification: KUN Samajik Kosh Firestore Rules

## 1. Data Invariants
1. Only authenticated users with verified Google accounts can read or write fund records.
2. The user `nikeshchaulagain50@gmail.com` is bootstrapped as the super administrator.
3. A Member document cannot be created without a valid string fullName (2..100 chars), phone number, and positive defaultDailyAmount.
4. Member documents cannot be spoofed to assign arbitrary system fields or bypass role boundaries.
5. A Contribution document must be tied to an authenticated recorder and cannot have negative donation amounts.
6. A Contribution document must have a valid ISO date (YYYY-MM-DD) and matching monthKey (YYYY-MM).
7. FundSettings can only be altered by authenticated authorized users with valid boundary checks on QR code strings and bank details.
8. Reminders cannot exceed volumetric payload limits (400 chars).
9. All updates must protect immutable fields (`createdAt`, `createdBy`).
10. Default deny applies to any unspecified collections.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Unauthenticated Read on Members**: Anonymous/unauthenticated `get /members/member_123` -> PERMISSION_DENIED.
2. **Unauthenticated Write on Members**: Anonymous user attempts `setDoc` on `/members/member_123` -> PERMISSION_DENIED.
3. **Identity Spoofing on Member Creation**: User `uid_abc` tries to set `createdBy: 'uid_xyz'` -> PERMISSION_DENIED.
4. **Member Denial of Wallet Name Explosion**: Member `fullName` with 2000 characters -> PERMISSION_DENIED.
5. **Negative Contribution Amount**: Malicious contribution with `amount: -500` -> PERMISSION_DENIED.
6. **Contribution Date Format Poisoning**: Contribution `date: "malicious_script_string"` instead of YYYY-MM-DD -> PERMISSION_DENIED.
7. **Contribution Identity Spoofing**: User `uid_abc` sets `recordedBy: 'admin_uid'` -> PERMISSION_DENIED.
8. **Shadow Field Injection**: Attempt to create member with ghost field `isAdmin: true` -> PERMISSION_DENIED.
9. **Tampering Immutable Creation Time**: Attempting to alter `createdAt` on an existing member -> PERMISSION_DENIED.
10. **Huge Buffer Injection in QR Code**: Sending 10MB payload in `qrCodeUrl` exceeding size limits -> PERMISSION_DENIED.
11. **Malicious Reminder Injection**: Unauthenticated reminder creation -> PERMISSION_DENIED.
12. **Arbitrary Collection Root Write**: Attempting write to `/system_secrets/config` -> PERMISSION_DENIED.
