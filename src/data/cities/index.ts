
// City data
export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  teams: string[];
  image: string;
}

export const cities: City[] = [];

export default cities;
