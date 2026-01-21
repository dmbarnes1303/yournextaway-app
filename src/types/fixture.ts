
// Fixture types
export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  league: string;
  status: 'scheduled' | 'live' | 'finished';
}

export default Fixture;
