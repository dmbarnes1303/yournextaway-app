
// User preferences state management
export interface Preferences {
  favoriteTeams: string[];
  favoriteLeagues: string[];
  notifications: boolean;
  theme: 'light' | 'dark';
}

export const defaultPreferences: Preferences = {
  favoriteTeams: [],
  favoriteLeagues: [],
  notifications: true,
  theme: 'dark',
};

export default defaultPreferences;
