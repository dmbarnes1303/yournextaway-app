
// Trip types
export interface Trip {
  id: string;
  cityId: string;
  cityName: string;
  matchIds: string[];
  startDate: string;
  endDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default Trip;
