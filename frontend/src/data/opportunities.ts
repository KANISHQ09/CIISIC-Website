/**
 * Opportunities shown on the Opportunities page.
 *
 * To publish one, add it to OPPORTUNITIES below with one of the category ids. While the list
 * is empty, the page shows the categories as "coming soon".
 */

export type OpportunityCategoryId = 'internships' | 'projects' | 'fellowships' | 'funding';

export interface OpportunityCategory {
  id: OpportunityCategoryId;
  title: string;
  description: string;
}

export interface Opportunity {
  id: string;
  category: OpportunityCategoryId;
  title: string;
  organisation: string;
  location: string;
  /** Last day to apply, as YYYY-MM-DD */
  deadline?: string;
  /** Where to apply or read more */
  link?: string;
  summary: string;
}

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  {
    id: 'internships',
    title: 'Internships',
    description: 'Hands-on internships with industry partners for students of partner institutions.',
  },
  {
    id: 'projects',
    title: 'Live Industry Projects',
    description: 'Short projects on real problems, run with a company and a faculty mentor.',
  },
  {
    id: 'fellowships',
    title: 'Fellowships',
    description: 'Fellowships for students and faculty working on applied research with industry.',
  },
  {
    id: 'funding',
    title: 'Grants & Funding',
    description: 'Support to take promising solutions and prototypes further.',
  },
];

export const OPPORTUNITIES: Opportunity[] = [];
