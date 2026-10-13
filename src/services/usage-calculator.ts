export interface DailyUsageRecord {
  date: string;
  totalMb: number;
}

export interface WasteCalculationResult {
  wastedMb: number;
  consumedMb: number;
  dailyLimitMb: number;
  daysEvaluated: number;
  breakdown: Array<{
    date: string;
    usedMb: number;
    wastedMb: number;
  }>;
}

export interface PredictionResult {
  monthlyLimitMb: number;
  currentUsageMb: number;
  remainingMb: number;
  averageDailyMb: number;
  daysRemaining: number | null;
  projectedExhaustionDate: string | null;
  status: "exhausted" | "predictable" | "no_depletion_expected" | "no_recent_usage";
}

/**
 * Calculates wasted data for days strictly BEFORE today.
 * Daily quota expires at the end of each day; unconsumed data is "wasted".
 * Wasted = Math.max(0, dailyLimitMb - usedMb)
 */
export function calculateWastedData(
  records: DailyUsageRecord[],
  dailyLimitMb: number,
  todayStr: string
): WasteCalculationResult {
  let wastedMb = 0;
  let consumedMb = 0;
  const breakdown: WasteCalculationResult["breakdown"] = [];

  for (const record of records) {
    // Only calculate waste for completed past days
    if (record.date < todayStr) {
      const dayUsed = Math.max(0, record.totalMb);
      const dayWasted = Math.max(0, dailyLimitMb - dayUsed);
      wastedMb += dayWasted;
      consumedMb += dayUsed;
      breakdown.push({
        date: record.date,
        usedMb: Math.round(dayUsed * 100) / 100,
        wastedMb: Math.round(dayWasted * 100) / 100,
      });
    }
  }

  return {
    wastedMb: Math.round(wastedMb * 100) / 100,
    consumedMb: Math.round(consumedMb * 100) / 100,
    dailyLimitMb,
    daysEvaluated: breakdown.length,
    breakdown,
  };
}

/**
 * Predicts exhaustion date of monthly quota based on recent daily usage.
 * @param recentDailyUsage array of daily usage records from recent days (e.g. past 7-14 days)
 * @param monthlyLimitMb user's monthly quota in MB
 * @param currentMonthTotalMb total MB consumed in the current calendar month so far
 * @param currentDate the reference current date
 */
export function predictExhaustion(
  recentDailyUsage: DailyUsageRecord[],
  monthlyLimitMb: number,
  currentMonthTotalMb: number,
  currentDate: Date = new Date()
): PredictionResult {
  const remainingMb = Math.max(0, monthlyLimitMb - currentMonthTotalMb);

  if (remainingMb <= 0) {
    return {
      monthlyLimitMb,
      currentUsageMb: currentMonthTotalMb,
      remainingMb: 0,
      averageDailyMb: 0,
      daysRemaining: 0,
      projectedExhaustionDate: currentDate.toISOString().split("T")[0],
      status: "exhausted",
    };
  }

  if (recentDailyUsage.length === 0) {
    return {
      monthlyLimitMb,
      currentUsageMb: currentMonthTotalMb,
      remainingMb,
      averageDailyMb: 0,
      daysRemaining: null,
      projectedExhaustionDate: null,
      status: "no_recent_usage",
    };
  }

  const totalRecent = recentDailyUsage.reduce((acc, r) => acc + r.totalMb, 0);
  const averageDailyMb = totalRecent / recentDailyUsage.length;

  if (averageDailyMb <= 0) {
    return {
      monthlyLimitMb,
      currentUsageMb: currentMonthTotalMb,
      remainingMb,
      averageDailyMb: 0,
      daysRemaining: null,
      projectedExhaustionDate: null,
      status: "no_depletion_expected",
    };
  }

  const daysRemaining = Math.floor(remainingMb / averageDailyMb);
  const targetDate = new Date(currentDate.getTime());
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  return {
    monthlyLimitMb,
    currentUsageMb: Math.round(currentMonthTotalMb * 100) / 100,
    remainingMb: Math.round(remainingMb * 100) / 100,
    averageDailyMb: Math.round(averageDailyMb * 100) / 100,
    daysRemaining,
    projectedExhaustionDate: targetDate.toISOString().split("T")[0],
    status: "predictable",
  };
}
