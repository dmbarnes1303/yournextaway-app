
// Money utility functions
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
}

export default {
  formatPrice,
};
