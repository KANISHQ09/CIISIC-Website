export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected';

/** Who can see an industry's mobile number, besides CII admins and the company itself. */
export type PhoneVisibility = 'EVERYONE' | 'INSTITUTION_SPOCS' | 'NO_ONE';

export interface CompanyInfo {
  industryName: string;
  companyName: string;
  representativeName: string;
  designation: string;
  email: string;
  phone: string;
  // Only returned to CII admins and the owning company
  phoneVisibility?: PhoneVisibility;
  website: string;
  industrySector: string;
  // Organisation location (from public submissions)
  city?: string;
  state?: string;
  address?: string;
}

export interface ProblemDetails {
  title: string;
  description: string;
  businessChallenge: string;
  existingProcess: string;
  expectedOutcome: string;
  projectObjectives: string;
}

export interface TechnicalDetails {
  requiredTechnologies: string[];
  requiredSkills: string[];
  preferredBranches: string[];
  preferredAcademicYear: string;
  // '' when the submitter didn't choose one (older problems)
  difficultyLevel: DifficultyLevel | '';
  expectedDuration: string;
}

export interface AdditionalDetails {
  expectedDeliverables: string;
  additionalNotes: string;
  // Budget / funding offered (hidden from public visitors by the API)
  budget?: string;
  // Solution deadline, ISO date string
  deadline?: string;
  // Optional cover photo shown on problem cards (placeholder when missing)
  coverImageUrl?: string;
  fileAttachmentName?: string;
  declarationAccepted: boolean;
}

export interface ProblemStatement {
  id: string;
  company: CompanyInfo;
  details: ProblemDetails;
  technical: TechnicalDetails;
  additional: AdditionalDetails;
  status: SubmissionStatus;
  submittedDate: string;
  reviewRemarks?: string;
  editedByAdmin?: boolean;
  // Human-friendly ID shared with the submitter (admins and owner only)
  referenceCode?: string;
  submissionSource?: 'PORTAL' | 'PUBLIC';
  // Submitted as "Other" — the organisation has no account on the portal
  isNewOrganisation?: boolean;
  // True when the logged-in industry user owns this problem
  ownedByRequester?: boolean;
  // CII's standardised PDF of the industry's raw file
  standardisedFile?: { url: string; updatedAt: string | null } | null;
  // Reviewer hints (CII admins only)
  review?: {
    registeredCompany: boolean;
    emailMatchesCompany: boolean | null;
    inviteSentAt: string | null;
  };
}

/** Registered organisation shown in the "Submit a problem" dropdown. */
export interface PublicIndustry {
  id: string;
  companyName: string;
  industry: string;
  logoUrl: string | null;
  websiteUrl: string | null;
}

export type UserRole = 'industry' | 'admin' | 'institution';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  designation?: string;
  industry?: string;
  institutionName?: string;
  institutionCity?: string;
  department?: string;
  phone?: string;
}

export interface StudentTeamLead {
  name: string;
  email: string;
  department: string;
  yearOfStudy: string;
  phone?: string;
}

export interface StudentTeamMember {
  name: string;
  email: string;
  role?: string;
}

export interface FacultyMentor {
  name: string;
  designation: string;
  email: string;
  phone?: string;
}

export type SolutionStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REVISION_REQUESTED'
  | 'RESUBMITTED'
  | 'REJECTED';

export interface SolutionSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  industryCompanyName: string;
  industrySector?: string;
  institutionId: string;
  institutionName: string;
  teamName: string;
  teamLead: StudentTeamLead;
  teamMembers: StudentTeamMember[];
  facultyMentor: FacultyMentor;
  title: string;
  summary: string;
  detailedApproach: string;
  technologiesUsed: string[];
  deliverablesDescription: string;
  demoUrl?: string;
  attachmentUrl?: string;
  documentName?: string;
  status: SolutionStatus;
  submittedAt: string;
  reviewedAt?: string;
  industryFeedback?: string;
  revisionNotes?: string;
}
