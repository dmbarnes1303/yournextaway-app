
// Saved items state management
export interface SavedItem {
  id: string;
  type: 'match' | 'team' | 'city';
  itemId: string;
  savedAt: string;
}

export const savedItems: SavedItem[] = [];

export default savedItems;
