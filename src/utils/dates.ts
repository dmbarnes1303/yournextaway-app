
// Date utility functions
export function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(time: string): string {
  return time;
}

export function isToday(date: string): boolean {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    today.getDate() === checkDate.getDate() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getFullYear() === checkDate.getFullYear()
  );
}

export default {
  formatDate,
  formatTime,
  isToday,
};
