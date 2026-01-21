
// Stadium data
export interface Stadium {
  id: string;
  name: string;
  slug: string;
  city: string;
  capacity: number;
  image: string;
}

export const stadiums: Stadium[] = [];

export default stadiums;
