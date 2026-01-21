
// Guide types
export interface Guide {
  id: string;
  type: 'team' | 'city';
  title: string;
  content: string;
  sections: GuideSection[];
}

export interface GuideSection {
  title: string;
  content: string;
}

export default Guide;
