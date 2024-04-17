export const balanceFormat = (amount?: number) => {
  if (!amount) return ['0', '00'] as [string, string];
  return (amount / 100).toFixed(2).split('.') as [string, string];
};
