export type TeamGuideSection = {
  title: string;
  body: string;
};

export type TeamGuideLink = {
  label: string;
  url: string;
};

export type TeamGuide = {
  /**
   * Stable key used in the registry.
   * Must match the related team record key.
   */
  teamKey: string;

  /** Display name */
  name: string;

  /**
   * Stable city key used for guide linking.
   * Strongly preferred for validation and cross-linking.
   */
  cityKey?: string;

  /** Optional display metadata */
  city?: string;
  country?: string;
  stadium?: string;

  /** Main rendered guide sections */
  sections: TeamGuideSection[];

  /** Optional useful links */
  links?: TeamGuideLink[];

  /** Optional ISO date string */
  updatedAt?: string;
};

export type TeamGuideRegistry = Record<string, TeamGuide>;
