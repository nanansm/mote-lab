export interface ProductEstimate {
  totalOmset: number;
  monthlyOmset: number;
  avgDailyOmset: number;
  trend: "up" | "down" | "stable";
}

export interface AggregateEstimate {
  totalOmset: number;
  monthlyOmset: number;
  avgMonthlyPerProduct: number;
  productCount: number;
}

export const estimateProductOmset = (product: {
  current_price: number;
  total_sold: number;
}): ProductEstimate => {
  const totalOmset = product.current_price * product.total_sold;
  // Assume product active ~6 months on average
  const estimatedActiveDays = 180;
  const avgDailyOmset = totalOmset / estimatedActiveDays;
  const monthlyOmset = avgDailyOmset * 30;

  return {
    totalOmset,
    monthlyOmset,
    avgDailyOmset,
    trend: "stable",
  };
};

export const aggregateEstimate = (
  products: Array<{ current_price: number; total_sold: number }>
): AggregateEstimate => {
  if (products.length === 0) {
    return { totalOmset: 0, monthlyOmset: 0, avgMonthlyPerProduct: 0, productCount: 0 };
  }

  const estimates = products.map(estimateProductOmset);
  const totalOmset = estimates.reduce((sum, e) => sum + e.totalOmset, 0);
  const monthlyOmset = estimates.reduce((sum, e) => sum + e.monthlyOmset, 0);

  return {
    totalOmset,
    monthlyOmset,
    avgMonthlyPerProduct: monthlyOmset / products.length,
    productCount: products.length,
  };
};

export const formatIDR = (num: number): string => {
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(2)} M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(2)} JT`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} RB`;
  return `Rp ${num}`;
};
