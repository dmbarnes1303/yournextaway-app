
// Trip state management
export interface Trip {
  id: string;
  cityId: string;
  matchIds: string[];
  startDate: string;
  endDate: string;
  notes: string;
}

export const trips: Trip[] = [];

export default trips;
