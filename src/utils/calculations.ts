import { Member, Contribution, MemberMonthlyStats } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatDateReadable(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatMonthReadable(monthKey: string): string {
  if (!monthKey) return '';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatCurrency(amount: number, currency: string = 'रू'): string {
  return `${currency} ${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function calculateMonthlyStats(
  members: Member[],
  contributions: Contribution[],
  monthKey: string
): MemberMonthlyStats[] {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
  const daysInMonth = getDaysInMonth(year, month);

  // Filter contributions for this month
  const monthContribs = contributions.filter(
    (c) => c.monthKey === monthKey || (c.date && c.date.startsWith(monthKey))
  );

  return members.map((member) => {
    const memberContribs = monthContribs.filter(
      (c) => c.memberId === member.id && c.hasDonated
    );

    const daysDonated = memberContribs.length;
    const totalDonated = memberContribs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const expectedAmount = member.defaultDailyAmount * daysInMonth;
    const fulfillmentRate = expectedAmount > 0 ? Math.min(100, Math.round((totalDonated / expectedAmount) * 100)) : 0;

    // Calculate longest consecutive donation streak in this month
    const donatedDates = new Set(memberContribs.map((c) => c.date));
    let longestStreak = 0;
    let currentStreak = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (donatedDates.has(dayStr)) {
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    return {
      member,
      daysDonated,
      totalDonated,
      expectedAmount,
      fulfillmentRate,
      longestStreak,
    };
  });
}
