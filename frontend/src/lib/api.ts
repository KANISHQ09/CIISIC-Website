import {
  ProblemStatement, User, SubmissionStatus, UserRole,
  SolutionSubmission, SolutionStatus, PublicIndustry, PhoneVisibility
} from '../types';

/**
 * Base URL comes from VITE_API_URL (e.g., http://localhost:3001)
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

// Local memory store for JWT (initialized from localStorage)
let authToken = localStorage.getItem('ciisic_jwt_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('ciisic_jwt_token', token);
  } else {
    localStorage.removeItem('ciisic_jwt_token');
  }
}

// Local database helpers
const DEFAULT_CHALLENGES: ProblemStatement[] = [
  {
    id: 'CII-2025-2401',
    company: {
      industryName: 'Artificial Intelligence',
      companyName: 'Larsen & Toubro Technology Services',
      representativeName: 'Rajesh Sharma',
      designation: 'VP - Advanced Technologies',
      email: 'r.sharma@ltts.com',
      phone: '+91 9823011223',
      website: 'https://www.ltts.com',
      industrySector: 'Artificial Intelligence',
    },
    details: {
      title: 'AI-Powered Computer Vision for Automated Defect Detection in High-Precision Machining',
      description: 'Development of an edge-deployable computer vision system to detect micro-surface anomalies (<50 microns) on CNC-machined aerospace alloy parts in real-time.',
      businessChallenge: 'Manual optical inspection has a 14% false-negative rate and bottlenecks our assembly pipeline. We require a sub-second multi-angle camera inspection model with automated reject tagging.',
      existingProcess: 'Random batch sampling with manual microscope inspection requiring 15 minutes per batch.',
      expectedOutcome: 'A deployable lightweight neural network model achieving >98.5% precision on edge hardware.',
      projectObjectives: '1. Create synthetic data generator for edge anomalies. 2. Benchmark lightweight YOLO/transformer models.',
    },
    technical: {
      requiredTechnologies: ['PyTorch', 'OpenCV', 'NVIDIA TensorRT', 'FastAPI', 'Docker'],
      requiredSkills: ['Computer Vision', 'Deep Learning', 'Edge Computing', 'C++ / Python'],
      preferredBranches: ['Computer Science', 'Data Science', 'Mechanical Engineering', 'Electronics'],
      preferredAcademicYear: 'Final Year / M.Tech / PhD',
      difficultyLevel: 'Hard',
      expectedDuration: '6 Months',
    },
    additional: {
      expectedDeliverables: 'Trained model weights, edge deployment scripts, benchmark report, and demonstration dashboard.',
      additionalNotes: 'Budget allocated: INR 8,50,000 | Target date: 30/08/2026',
      fileAttachmentName: 'LTTS_Optical_Defect_Spec_2026.pdf',
      declarationAccepted: true,
    },
    status: 'Approved',
    submittedDate: '2026-02-15T10:30:00.000Z',
  },
  {
    id: 'CII-2025-2402',
    company: {
      industryName: 'Agritech',
      companyName: 'Mahindra Agri Solutions',
      representativeName: 'Ananya Deshmukh',
      designation: 'Head of Agritech R&D',
      email: 'ananya.d@mahindra.com',
      phone: '+91 9912345678',
      website: 'https://www.mahindra.com',
      industrySector: 'Agritech',
    },
    details: {
      title: 'IoT & Multi-Spectral Drone Imaging for Precision Crop Disease Early Warning System',
      description: 'Developing low-cost IoT soil moisture/nutrient sensors combined with multi-spectral drone imagery analysis for early blight detection in cotton crops.',
      businessChallenge: 'Smallholder farmers experience 25-40% crop losses due to late pest and blight diagnosis. Need an affordable, localized alert system operating with intermittent rural connectivity.',
      existingProcess: 'Periodic field scouting by agricultural extension officers.',
      expectedOutcome: 'Integrated mobile alert app for farmers + dashboard for agricultural clusters.',
      projectObjectives: 'Design sensor array and AI image classification model for 5 common regional crop pathogens.',
    },
    technical: {
      requiredTechnologies: ['IoT Firmware (ESP32)', 'LoRaWAN', 'TensorFlow Lite', 'React Native', 'Node.js'],
      requiredSkills: ['Embedded Systems', 'Remote Sensing', 'Agronomy', 'Full-stack Development'],
      preferredBranches: ['Agricultural Engineering', 'Electronics & Communication', 'Computer Science'],
      preferredAcademicYear: 'Pre-final & Final Year UG/PG',
      difficultyLevel: 'Medium',
      expectedDuration: '4 Months',
    },
    additional: {
      expectedDeliverables: 'Hardware prototype, trained disease classifier, farmer mobile UI application.',
      additionalNotes: 'Budget allocated: INR 6,00,000 | Target date: 15/10/2026',
      fileAttachmentName: 'Mahindra_Agri_Blight_Detection.pdf',
      declarationAccepted: true,
    },
    status: 'Approved',
    submittedDate: '2026-02-18T14:15:00.000Z',
  },
  {
    id: 'CII-2025-2403',
    company: {
      industryName: 'Research & Innovation',
      companyName: 'Thermax Clean Energy Division',
      representativeName: 'Dr. Vivek Kulkarni',
      designation: 'Chief Scientist',
      email: 'vivek.kulkarni@thermaxglobal.com',
      phone: '+91 9423556789',
      website: 'https://www.thermaxglobal.com',
      industrySector: 'Research & Innovation',
    },
    details: {
      title: 'Advanced Solid-State Battery Thermal Management & Fast-Charging Safety Models',
      description: 'Formulating thermal runaway prediction algorithms and novel phase-change cooling structures for next-generation solid-state lithium cells in heavy commercial vehicles.',
      businessChallenge: 'High-power fast charging causes localized thermal hotspots, accelerating battery degradation.',
      existingProcess: 'Physical thermal testing using thermocouple chambers.',
      expectedOutcome: 'Physics-informed neural network (PINN) simulator and thermal jacket design.',
      projectObjectives: 'Model 3D heat dissipation in cell packs and forecast thermal runaway 120 seconds in advance.',
    },
    technical: {
      requiredTechnologies: ['COMSOL / ANSYS', 'Python SciPy', 'Physics-Informed Neural Networks', 'MATLAB/Simulink'],
      requiredSkills: ['Thermodynamics', 'Battery Chemistry', 'Numerical Simulation', 'Machine Learning'],
      preferredBranches: ['Chemical Engineering', 'Mechanical Engineering', 'Electrical Engineering'],
      preferredAcademicYear: 'Postgraduate / Doctoral Research Scholars',
      difficultyLevel: 'Hard',
      expectedDuration: '9 Months',
    },
    additional: {
      expectedDeliverables: 'Simulation models, CFD validation dataset, technical publication & patent filing support.',
      additionalNotes: 'Budget allocated: INR 12,00,000 | Target date: 30/12/2026',
      fileAttachmentName: 'Thermax_Battery_Thermal_Spec.pdf',
      declarationAccepted: true,
    },
    status: 'Approved',
    submittedDate: '2026-02-20T09:00:00.000Z',
  }
];

function getLocalChallenges(): ProblemStatement[] {
  const saved = localStorage.getItem('ciisic_submissions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Purge legacy mock challenge IDs from early development
        const filtered = parsed.filter((c: any) => !c?.id?.startsWith?.('CII-2025-010'));
        if (filtered.length !== parsed.length) {
          localStorage.setItem('ciisic_submissions', JSON.stringify(filtered));
        }
        return filtered.length > 0 ? filtered : DEFAULT_CHALLENGES;
      }
    } catch {
      // ignore
    }
  }
  saveLocalChallenges(DEFAULT_CHALLENGES);
  return DEFAULT_CHALLENGES;
}

function saveLocalChallenges(challenges: ProblemStatement[]) {
  localStorage.setItem('ciisic_submissions', JSON.stringify(challenges));
}

/** Solutions Submissions (Institutions/Teams submitting proposals to Industry challenges) */
export function getLocalSolutions(): SolutionSubmission[] {
  const saved = localStorage.getItem('ciisic_solutions');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
}

export function saveLocalSolutions(solutions: SolutionSubmission[]) {
  localStorage.setItem('ciisic_solutions', JSON.stringify(solutions));
}

/** Convert an API proposal into the dashboards' SolutionSubmission shape. */
function mapBackendProposal(p: any): SolutionSubmission {
  const lead = p.team?.lead ?? {};
  const mentor = p.team?.mentor ?? {};
  const status: SolutionStatus = p.status === 'DRAFT' ? 'SUBMITTED' : p.status;
  return {
    id: p.id,
    challengeId: p.challengeId,
    challengeTitle: p.challenge?.title ?? 'Industry Problem Statement',
    industryCompanyName: p.challenge?.organisationName || 'Industry Partner',
    industrySector: p.challenge?.domain ? formatThemeToSector(p.challenge.domain) : undefined,
    institutionId: p.institution?.id ?? '',
    institutionName: p.institution?.name ?? '',
    teamName: p.team?.name ?? '',
    // Names / emails are only present for admins and the submitting institution
    teamLead: {
      name: lead.name ?? '',
      email: lead.email ?? '',
      department: lead.department ?? '',
      yearOfStudy: lead.yearOfStudy ?? '',
      phone: lead.phone,
    },
    teamMembers: (p.team?.members ?? []).map((m: any) => ({
      name: m.name ?? m.role ?? 'Team member',
      email: m.email ?? '',
      role: m.role,
    })),
    facultyMentor: {
      name: mentor.name ?? '',
      designation: mentor.designation ?? '',
      email: mentor.email ?? '',
      phone: mentor.phone,
    },
    title: p.title || p.challenge?.title || 'Solution proposal',
    summary: p.summary ?? '',
    detailedApproach: p.detailedApproach ?? '',
    technologiesUsed: p.technologiesUsed ?? [],
    deliverablesDescription: p.deliverables ?? '',
    demoUrl: p.demoUrl ?? undefined,
    attachmentUrl: p.approachDoc ?? undefined,
    documentName: p.approachDoc ? 'Solution document' : undefined,
    status,
    submittedAt: p.submittedAt,
    reviewedAt: p.status !== 'SUBMITTED' && p.status !== 'RESUBMITTED' ? p.updatedAt : undefined,
    industryFeedback: p.feedbackByIndustry ?? undefined,
    revisionNotes: p.revisionNotes ?? undefined,
  };
}

/** All solutions the signed-in user may see (the API scopes this by role). */
export async function fetchSolutions(): Promise<SolutionSubmission[]> {
  if (DEMO_MODE) return getLocalSolutions();

  const all: any[] = [];
  for (let page = 1; page <= 100; page++) {
    const res = await fetchJSON<{ data?: any[]; pagination?: { totalPages: number } }>(
      `${API_BASE}/api/proposals?page=${page}&limit=50`
    );
    const list = res?.data ?? [];
    all.push(...list);
    if (page >= (res?.pagination?.totalPages ?? 1) || list.length === 0) break;
  }
  return all.filter((p) => p.status !== 'DRAFT').map(mapBackendProposal);
}

export async function submitSolution(data: Omit<SolutionSubmission, 'id' | 'submittedAt' | 'status'>): Promise<SolutionSubmission> {
  if (!DEMO_MODE) {
    const created = await fetchJSON<any>(`${API_BASE}/api/challenges/${data.challengeId}/proposals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        summary: data.summary,
        detailedApproach: data.detailedApproach,
        deliverables: data.deliverablesDescription || undefined,
        technologiesUsed: data.technologiesUsed,
        demoUrl: data.demoUrl || '',
        approachDoc: data.attachmentUrl || undefined,
        teamName: data.teamName,
        teamLead: data.teamLead,
        teamMembers: data.teamMembers,
        facultyMentor: data.facultyMentor,
        isDraft: false,
      }),
    });
    return mapBackendProposal(created);
  }

  // Demo mode (no backend configured): keep it in this browser only
  const solutions = getLocalSolutions();
  const newSolution: SolutionSubmission = {
    ...data,
    id: 'SOL-' + Date.now().toString(36).toUpperCase(),
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
  };

  solutions.unshift(newSolution);
  saveLocalSolutions(solutions);
  return newSolution;
}

export async function reviewSolution(
  solutionId: string, 
  status: SolutionStatus, 
  feedback?: string, 
  revisionNotes?: string
): Promise<SolutionSubmission> {
  if (!DEMO_MODE) {
    if (status === 'SUBMITTED' || status === 'RESUBMITTED') {
      throw new Error('Choose a decision: under review, revision requested, approved or rejected.');
    }
    const updated = await fetchJSON<any>(`${API_BASE}/api/proposals/${solutionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        ...(feedback !== undefined && { feedbackByIndustry: feedback }),
        ...(revisionNotes !== undefined && { revisionNotes }),
        // A revision request without separate notes uses the feedback as the notes
        ...(status === 'REVISION_REQUESTED' && revisionNotes === undefined && feedback
          ? { revisionNotes: feedback }
          : {}),
      }),
    });
    return mapBackendProposal(updated);
  }

  // Demo mode (no backend configured)
  const solutions = getLocalSolutions();
  const index = solutions.findIndex(s => s.id === solutionId);
  if (index === -1) {
    throw new Error('Solution not found');
  }

  solutions[index] = {
    ...solutions[index],
    status,
    reviewedAt: new Date().toISOString(),
    industryFeedback: feedback !== undefined ? feedback : solutions[index].industryFeedback,
    revisionNotes: revisionNotes !== undefined ? revisionNotes : solutions[index].revisionNotes,
  };

  saveLocalSolutions(solutions);
  return solutions[index];
}

/** Helper to fetch JSON automatically injecting Authorization Bearer header */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers,
    });
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(apiErrorMessage(data, response.status));
  }
  return data.data as T;
}

/** Best human-readable message from an API error body. */
function apiErrorMessage(body: any, status: number): string {
  const fieldErrors = body?.errors?.fieldErrors as Record<string, string[]> | undefined;
  const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
  if (firstFieldError) return firstFieldError;
  if (body?.message) return body.message;
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to do this.';
  return `Request failed (${status}). Please try again.`;
}

/**
 * Local sample data is only used when no backend is configured (VITE_API_URL unset),
 * e.g. for a quick UI demo. With a backend configured, every failure is shown to the user.
 */
const DEMO_MODE = !API_BASE;

/** Backend user to frontend User mapper */
export function mapBackendUserToFrontend(backendUser: any): User {
  let role: UserRole = 'industry';
  if (backendUser.role === 'CII_ADMIN' || backendUser.role === 'SUPER_ADMIN' || backendUser.role === 'admin') {
    role = 'admin';
  } else if (backendUser.role === 'INSTITUTION_SPOC' || backendUser.role === 'institution') {
    role = 'institution';
  } else if (backendUser.role === 'INDUSTRY_SPOC' || backendUser.role === 'industry') {
    role = 'industry';
  }

  const instName =
    backendUser.institutionProfile?.institution?.name ||
    backendUser.institutionName ||
    '';
  const instCity =
    backendUser.institutionProfile?.institution?.city ||
    backendUser.institutionCity ||
    '';
  const compName =
    backendUser.industryProfile?.companyName ||
    backendUser.companyName ||
    '';
  const desig =
    backendUser.industryProfile?.designation ||
    backendUser.institutionProfile?.designation ||
    backendUser.designation ||
    '';
  const dept =
    backendUser.institutionProfile?.department ||
    backendUser.department ||
    '';
  const phone =
    backendUser.industryProfile?.phone ||
    backendUser.institutionProfile?.phone ||
    backendUser.phone ||
    '';

  return {
    id: backendUser.id,
    name: backendUser.name || 'User',
    email: backendUser.email,
    role,
    companyName: compName,
    designation: desig,
    institutionName: instName,
    institutionCity: instCity,
    department: dept,
    phone,
  };
}

const DEFAULT_REGISTRATIONS: RegistrationItem[] = [
  {
    id: 'reg-001',
    name: 'Dr. Ramesh Chandra',
    email: 'dean.rnd@iitb.ac.in',
    role: 'INSTITUTION_SPOC',
    approvalStatus: 'PENDING',
    isActive: true,
    createdAt: '2026-02-22T11:00:00.000Z',
    entityName: 'Indian Institute of Technology, Bombay',
    department: 'Center for Research & Industrial Consultancy',
    designation: 'Dean R&D',
    institutionCity: 'Mumbai',
    isCIIMember: true,
  },
  {
    id: 'reg-002',
    name: 'Suresh Menon',
    email: 'suresh.m@tataautocomp.com',
    role: 'INDUSTRY_SPOC',
    approvalStatus: 'PENDING',
    isActive: true,
    createdAt: '2026-02-23T14:30:00.000Z',
    entityName: 'Tata AutoComp Systems Ltd',
    industrySector: 'Automotive & Mobility',
    designation: 'General Manager - Innovation',
    websiteUrl: 'https://www.tataautocomp.com',
    isCIIMember: true,
  },
  {
    id: 'reg-003',
    name: 'Prof. Sunita Rao',
    email: 'spoc.cii@manipal.edu',
    role: 'INSTITUTION_SPOC',
    approvalStatus: 'APPROVED',
    isActive: true,
    createdAt: '2026-02-10T09:15:00.000Z',
    entityName: 'Manipal Academy of Higher Education',
    department: 'Directorate of Research',
    designation: 'Associate Dean - Industry Relations',
    institutionCity: 'Manipal',
    isCIIMember: true,
  }
];

function getLocalRegistrations(): RegistrationItem[] {
  const saved = localStorage.getItem('ciisic_registrations');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  localStorage.setItem('ciisic_registrations', JSON.stringify(DEFAULT_REGISTRATIONS));
  return DEFAULT_REGISTRATIONS;
}

function saveLocalRegistrations(regs: RegistrationItem[]) {
  localStorage.setItem('ciisic_registrations', JSON.stringify(regs));
}

/** Auth */
/**
 * Sign in against the backend. There is no offline/demo fallback: if the server
 * rejects the credentials or cannot be reached, this throws and nobody is signed in.
 */
export async function login(email: string, password: string, _roleHint?: UserRole): Promise<User> {
  const url = API_BASE ? `${API_BASE}/api/auth/login` : '/api/auth/login';

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new Error('Could not reach the server. Please check your connection and try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success || !data?.token) {
    throw new Error(data?.message || 'Invalid email or password');
  }

  setAuthToken(data.token);
  const user = mapBackendUserToFrontend(data.user);
  localStorage.setItem('ciisic_current_user', JSON.stringify(user));
  return user;
}

export async function registerIndustry(data: {
  companyName: string;
  industry: string;
  websiteUrl?: string;
  isCIIMember?: boolean;
  contactPerson: string;
  email: string;
  password: string;
  phone?: string;
  designation?: string;
}): Promise<{ success: boolean; message: string; requiresApproval: boolean }> {
  const url = API_BASE ? `${API_BASE}/api/auth/register` : '/api/auth/register';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
        name: data.contactPerson,
        role: 'INDUSTRY_SPOC',
        phone: data.phone || undefined,
        designation: data.designation || undefined,
        companyName: data.companyName,
        industry: data.industry,
        websiteUrl: data.websiteUrl || '',
        isCIIMember: data.isCIIMember ?? true,
      }),
    });

    const resJson = await response.json().catch(() => null);
    if (response.ok && resJson?.success) {
      return {
        success: true,
        requiresApproval: true,
        message: 'Your enterprise registration has been submitted and is pending CII Administrator review. You will be able to log in once approved.',
      };
    }
    throw new Error(apiErrorMessage(resJson, response.status));
  } catch (e) {
    if (!DEMO_MODE) throw e;
    console.warn('Backend registration failed, saving locally:', e);
  }

  // Local storage save
  const regs = getLocalRegistrations();
  regs.unshift({
    id: 'reg-' + Date.now(),
    name: data.contactPerson,
    email: data.email,
    role: 'INDUSTRY_SPOC',
    approvalStatus: 'PENDING',
    isActive: true,
    createdAt: new Date().toISOString(),
    entityName: data.companyName,
    industrySector: data.industry,
    websiteUrl: data.websiteUrl,
    isCIIMember: data.isCIIMember,
    designation: 'Corporate SPOC',
  });
  saveLocalRegistrations(regs);

  return {
    success: true,
    requiresApproval: true,
    message: 'Your enterprise registration has been submitted and is pending CII Administrator review. You will be able to log in once approved.',
  };
}

export async function registerInstitution(data: {
  institutionName: string;
  institutionCity: string;
  coordinatorName: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  password: string;
}): Promise<{ success: boolean; message: string; requiresApproval: boolean }> {
  const url = API_BASE ? `${API_BASE}/api/auth/register` : '/api/auth/register';
  const password = data.password;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim(),
        password,
        name: data.coordinatorName,
        role: 'INSTITUTION_SPOC',
        spocInstitutionId: data.institutionName,
        institutionCity: data.institutionCity,
        phone: data.phone || undefined,
        department: data.department,
        designation: data.designation,
      }),
    });

    const resJson = await response.json().catch(() => null);
    if (response.ok && resJson?.success) {
      return {
        success: true,
        requiresApproval: true,
        message: 'Your academic institution registration has been submitted and is pending CII Administrator review. You will be able to log in once approved.',
      };
    }
    throw new Error(apiErrorMessage(resJson, response.status));
  } catch (e) {
    if (!DEMO_MODE) throw e;
    console.warn('Backend institution registration failed, saving locally:', e);
  }

  // Local storage save
  const regs = getLocalRegistrations();
  regs.unshift({
    id: 'reg-' + Date.now(),
    name: data.coordinatorName,
    email: data.email,
    role: 'INSTITUTION_SPOC',
    approvalStatus: 'PENDING',
    isActive: true,
    createdAt: new Date().toISOString(),
    entityName: data.institutionName,
    department: data.department,
    designation: data.designation,
    institutionCity: data.institutionCity,
    isCIIMember: true,
  });
  saveLocalRegistrations(regs);

  return {
    success: true,
    requiresApproval: true,
    message: 'Your academic institution registration has been submitted and is pending CII Administrator review. You will be able to log in once approved.',
  };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const url = API_BASE ? `${API_BASE}/api/auth/change-password` : '/api/auth/change-password';
  try {
    return await fetchJSON<{ success: boolean; message: string }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (e) {
    if (!DEMO_MODE) throw e;
    console.warn('Backend changePassword offline, simulating success:', e);
    return { success: true, message: 'Password changed successfully.' };
  }
}

export interface RegistrationItem {
  id: string;
  name: string;
  email: string;
  role: 'INDUSTRY_SPOC' | 'INSTITUTION_SPOC';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive: boolean;
  createdAt: string;
  entityName: string;
  industrySector?: string;
  department?: string;
  designation?: string;
  websiteUrl?: string;
  isCIIMember?: boolean;
  institutionCity?: string;
}

export async function fetchAdminRegistrations(status?: string, role?: string): Promise<RegistrationItem[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (role) params.set('role', role);

  const query = params.toString() ? `?${params.toString()}` : '';
  const url = API_BASE ? `${API_BASE}/api/admin/registrations${query}` : `/api/admin/registrations${query}`;
  try {
    return await fetchJSON<RegistrationItem[]>(url);
  } catch (e) {
    if (!DEMO_MODE) throw e;
    console.warn('Backend fetchAdminRegistrations offline, returning local list:', e);
    let items = getLocalRegistrations();
    if (status) {
      items = items.filter(r => r.approvalStatus === status);
    }
    if (role) {
      items = items.filter(r => r.role === role);
    }
    return items;
  }
}

export async function reviewRegistration(id: string, action: 'APPROVE' | 'REJECT', remarks?: string): Promise<any> {
  const url = API_BASE ? `${API_BASE}/api/admin/registrations/${id}/review` : `/api/admin/registrations/${id}/review`;
  try {
    return await fetchJSON<any>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, remarks }),
    });
  } catch (e) {
    if (!DEMO_MODE) throw e;
    console.warn('Backend reviewRegistration offline, updating local list:', e);
    const regs = getLocalRegistrations();
    const idx = regs.findIndex(r => r.id === id);
    if (idx !== -1) {
      regs[idx].approvalStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      saveLocalRegistrations(regs);
    }
    return { success: true, message: `Registration ${action === 'APPROVE' ? 'approved' : 'rejected'}` };
  }
}

export async function logout() {
  const url = API_BASE ? `${API_BASE}/api/auth/logout` : '/api/auth/logout';
  try {
    const headers = new Headers();
    if (authToken) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    await fetch(url, {
      method: 'POST',
      headers,
      // Don't keep the user waiting on a slow server; this device is signed out either way
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error("Logout request error:", e);
  } finally {
    setAuthToken(null);
    localStorage.removeItem('ciisic_current_user');
  }
}

export async function getSession(): Promise<User | null> {
  if (!authToken) {
    return null;
  }

  const url = API_BASE ? `${API_BASE}/api/auth/me` : '/api/auth/me';
  try {
    const backendData = await fetchJSON<any>(url);
    const user = mapBackendUserToFrontend(backendData);
    localStorage.setItem('ciisic_current_user', JSON.stringify(user));
    return user;
  } catch {
    setAuthToken(null);
    localStorage.removeItem('ciisic_current_user');
    return null;
  }
}

/** Challenges */
export async function fetchChallenges(): Promise<ProblemStatement[]> {
  if (DEMO_MODE) return getLocalChallenges();

  // Fetch every page — the API returns at most 100 problem statements per request
  const all: any[] = [];
  for (let page = 1; page <= 100; page++) {
    const res = await fetchJSON<{ data?: any[]; pagination?: { totalPages: number } }>(
      `${API_BASE}/api/challenges?page=${page}&limit=100`
    );
    const list = Array.isArray(res) ? res : (res?.data || []);
    all.push(...list);
    const totalPages = (res as any)?.pagination?.totalPages ?? 1;
    if (page >= totalPages || list.length === 0) break;
  }
  return all.map(mapBackendToProblemStatement);
}

export async function fetchChallengeById(id: string): Promise<ProblemStatement> {
  if (API_BASE) {
    try {
      const challenge = await fetchJSON<any>(`${API_BASE}/api/challenges/${id}`);
      return mapBackendToProblemStatement(challenge);
    } catch (e) {
      if (!DEMO_MODE) throw e;
      console.warn(`Backend fetchChallengeById failed for ${id}, checking local:`, e);
    }
  }

  const challenges = getLocalChallenges();
  const found = challenges.find(c => c.id === id);
  if (!found) {
    throw new Error('Problem statement not found');
  }
  return found;
}

function mapSectorToCellTheme(sector: string): string {
  const normalized = (sector || '').toUpperCase().trim();
  if (normalized.includes("AGRI") || normalized.includes("FARM") || normalized.includes("FOOD")) {
    return "AGRITECH";
  }
  if (normalized.includes("AI") || normalized.includes("SOFTWARE") || normalized.includes("TECH") || normalized.includes("INFORMATION")) {
    return "AI_IN_BUSINESS";
  }
  if (normalized.includes("START") || normalized.includes("ENTREP")) {
    return "STARTUP";
  }
  if (normalized.includes("FAMILY") || normalized.includes("BUSINESS")) {
    return "FAMILY_BUSINESS";
  }
  if (normalized.includes("TALENT") || normalized.includes("EDUCATION") || normalized.includes("ACADEMIC")) {
    return "TALENT_READINESS";
  }
  if (normalized.includes("SKILL") || normalized.includes("TRAIN") || normalized.includes("DEVELOPMENT")) {
    return "SKILL_DEVELOPMENT";
  }
  return "RESEARCH_INNOVATION";
}

/** A YYYY-MM-DD date from a date picker → end of that day as ISO (so "today" is still valid). */
function toDeadlineISO(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 0).toISOString();
  }
  return new Date(value).toISOString();
}

/** Legacy: read "Target date: DD/MM/YYYY" out of the notes text. */
function getDeadline(payload: any): string {
  const notes = payload.additional?.additionalNotes || '';
  const match = notes.match(/Target date:\s*(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
    if (date > new Date()) {
      return date.toISOString();
    }
  }
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() + 3);
  return defaultDate.toISOString();
}

function getBudgetRange(payload: any): string {
  const notes = payload.additional?.additionalNotes || '';
  const match = notes.match(/Budget allocated:\s*([^\.]+)/);
  if (match) {
    return match[1].trim();
  }
  return notes || 'Not Specified';
}

function flattenChallengePayload(payload: any): any {
  const flat: any = {
    title: payload.details?.title || 'No Title Provided',
    description: payload.details?.description || 'No Description Provided',
    problemStatement: payload.details?.businessChallenge || payload.details?.description || 'No Problem Statement Provided',
    domain: mapSectorToCellTheme(payload.company?.industrySector || payload.company?.industryName || ''),
    // Prefer the real fields; the "Budget allocated / Target date" text is only for old data
    deadline: payload.additional?.deadline ? toDeadlineISO(payload.additional.deadline) : getDeadline(payload),
    budgetRange: payload.additional?.budget?.trim() || getBudgetRange(payload),
    tags: payload.technical?.requiredTechnologies || [],
    attachmentUrls: payload.additional?.fileAttachmentName ? [payload.additional.fileAttachmentName] : [],
    organizationName: payload.company?.companyName || 'Unknown Organization',
    duration: payload.technical?.expectedDuration || '6 Months',
    contactName: payload.company?.representativeName || undefined,
    contactDesignation: payload.company?.designation || undefined,
    contactEmail: payload.company?.email || undefined,
    contactPhone: payload.company?.phone || undefined,
    phoneVisibility: payload.company?.phoneVisibility,
    // Details from the submission form
    existingProcess: payload.details?.existingProcess || undefined,
    expectedOutcome: payload.details?.expectedOutcome || undefined,
    projectObjectives: payload.details?.projectObjectives || undefined,
    requiredSkills: payload.technical?.requiredSkills ?? undefined,
    preferredBranches: payload.technical?.preferredBranches ?? undefined,
    preferredAcademicYear: payload.technical?.preferredAcademicYear || undefined,
    difficultyLevel: payload.technical?.difficultyLevel || undefined,
    expectedDeliverables: payload.additional?.expectedDeliverables || undefined,
    additionalNotes: payload.additional?.additionalNotes || undefined,
  };

  if (payload.status) {
    const statusMap: Record<SubmissionStatus, string> = {
      'Pending': 'PENDING_APPROVAL',
      'Approved': 'OPEN',
      'Rejected': 'REJECTED',
    };
    flat.status = statusMap[payload.status as SubmissionStatus] || 'DRAFT';
  }

  return flat;
}

export async function createChallenge(payload: Omit<ProblemStatement, 'id' | 'status' | 'submittedDate'>): Promise<ProblemStatement> {
  if (API_BASE) {
    try {
      const flatPayload = flattenChallengePayload(payload);
      const created = await fetchJSON<any>(`${API_BASE}/api/challenges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flatPayload),
      });
      return mapBackendToProblemStatement(created);
    } catch (e) {
      if (!DEMO_MODE) throw e;
      console.warn('Backend createChallenge failed, persisting locally:', e);
    }
  }

  // Local creation
  const idNumber = Math.floor(1000 + Math.random() * 9000);
  const newChallenge: ProblemStatement = {
    ...payload,
    id: `CII-2025-${idNumber}`,
    status: 'Pending',
    submittedDate: new Date().toISOString(),
  };

  const challenges = getLocalChallenges();
  const updated = [newChallenge, ...challenges];
  saveLocalChallenges(updated);
  return newChallenge;
}

export async function updateChallenge(id: string, payload: Partial<ProblemStatement>): Promise<ProblemStatement> {
  if (API_BASE) {
    try {
      const flatPayload = {};
      const tempFlat = flattenChallengePayload(payload);
      
      if (payload.details?.title) (flatPayload as any).title = tempFlat.title;
      if (payload.details?.description) (flatPayload as any).description = tempFlat.description;
      if (payload.details?.businessChallenge) (flatPayload as any).problemStatement = tempFlat.problemStatement;
      if (payload.company?.industrySector || payload.company?.industryName) (flatPayload as any).domain = tempFlat.domain;
      if (payload.additional?.budget !== undefined) (flatPayload as any).budgetRange = tempFlat.budgetRange;
      if (payload.additional?.deadline) (flatPayload as any).deadline = tempFlat.deadline;
      if (payload.additional?.additionalNotes !== undefined) (flatPayload as any).additionalNotes = payload.additional.additionalNotes;
      if (payload.additional?.expectedDeliverables !== undefined) (flatPayload as any).expectedDeliverables = payload.additional.expectedDeliverables;
      if (payload.details?.existingProcess !== undefined) (flatPayload as any).existingProcess = payload.details.existingProcess;
      if (payload.details?.expectedOutcome !== undefined) (flatPayload as any).expectedOutcome = payload.details.expectedOutcome;
      if (payload.details?.projectObjectives !== undefined) (flatPayload as any).projectObjectives = payload.details.projectObjectives;
      if (payload.technical?.requiredSkills) (flatPayload as any).requiredSkills = payload.technical.requiredSkills;
      if (payload.technical?.preferredBranches) (flatPayload as any).preferredBranches = payload.technical.preferredBranches;
      if (payload.technical?.preferredAcademicYear !== undefined) (flatPayload as any).preferredAcademicYear = payload.technical.preferredAcademicYear;
      if (payload.technical?.difficultyLevel !== undefined) (flatPayload as any).difficultyLevel = payload.technical.difficultyLevel;
      if (payload.technical?.requiredTechnologies) (flatPayload as any).tags = tempFlat.tags;
      if (payload.additional?.fileAttachmentName) (flatPayload as any).attachmentUrls = tempFlat.attachmentUrls;
      if (payload.company?.companyName) (flatPayload as any).organizationName = tempFlat.organizationName;
      if (payload.technical?.expectedDuration) (flatPayload as any).duration = tempFlat.duration;
      if (payload.status) (flatPayload as any).status = tempFlat.status;

      const updated = await fetchJSON<any>(`${API_BASE}/api/challenges/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flatPayload),
      });
      return mapBackendToProblemStatement(updated);
    } catch (e) {
      if (!DEMO_MODE) throw e;
      console.warn('Backend updateChallenge failed, updating locally:', e);
    }
  }

  const challenges = getLocalChallenges();
  const index = challenges.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error('Problem statement not found');
  }

  const current = challenges[index];
  const merged: ProblemStatement = {
    ...current,
    ...payload,
    company: { ...current.company, ...(payload.company || {}) },
    details: { ...current.details, ...(payload.details || {}) },
    technical: { ...current.technical, ...(payload.technical || {}) },
    additional: { ...current.additional, ...(payload.additional || {}) },
    status: payload.status || current.status,
    reviewRemarks: payload.reviewRemarks !== undefined ? payload.reviewRemarks : current.reviewRemarks,
    editedByAdmin: payload.editedByAdmin !== undefined ? payload.editedByAdmin : current.editedByAdmin,
  };

  challenges[index] = merged;
  saveLocalChallenges(challenges);
  return merged;
}

/** Admin review */
export async function reviewChallenge(id: string, status: SubmissionStatus, remarks?: string) {
  if (API_BASE) {
    try {
      const action = status === 'Approved' ? 'APPROVE' : 'REJECT';
      const body: any = { action };
      if (remarks) body.remarks = remarks;
      await fetchJSON<any>(`${API_BASE}/api/admin/challenges/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return;
    } catch (e) {
      if (!DEMO_MODE) throw e;
      console.warn('Backend reviewChallenge failed, updating locally:', e);
    }
  }

  const challenges = getLocalChallenges();
  const index = challenges.findIndex(c => c.id === id);
  if (index !== -1) {
    challenges[index].status = status;
    if (remarks) challenges[index].reviewRemarks = remarks;
    saveLocalChallenges(challenges);
  }
}

/** File upload */
export async function uploadFile(file: File, type: 'LOGO' | 'DOCUMENT'): Promise<{ url: string }> {
  if (API_BASE) {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);

      const result = await fetchJSON<any>(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: form,
      });
      return result;
    } catch (e) {
      if (!DEMO_MODE) throw e;
      console.warn('Backend uploadFile failed, generating local object URL:', e);
    }
  }

  // Fallback to local object URL or file representation
  const objectUrl = URL.createObjectURL(file);
  return { url: objectUrl };
}

/** Mappers */
function formatThemeToSector(theme?: string): string {
  if (!theme) return 'General Innovation';
  const map: Record<string, string> = {
    'AI_IN_BUSINESS': 'Artificial Intelligence',
    'AGRITECH': 'Agritech',
    'RESEARCH_INNOVATION': 'Research & Innovation',
    'FAMILY_BUSINESS': 'Manufacturing & Enterprise',
    'TALENT_READINESS': 'Talent & Education',
    'SKILL_DEVELOPMENT': 'Skill Development',
    'STARTUP': 'Startup & Incubation',
  };
  return map[theme] || theme;
}

function mapBackendToProblemStatement(backend: any): ProblemStatement {
  const sectorName = formatThemeToSector(backend.domain);
  const company = backend.organisation?.name || backend.organizationName || backend.industry?.companyName || 'Corporate Partner';
  // Contact details only come back for CII admins and the owning company
  const contact = backend.contact ?? {};
  return {
    id: backend.id,
    company: {
      industryName: sectorName,
      companyName: company,
      representativeName: contact.name ?? backend.industry?.representativeName ?? '',
      designation: contact.designation ?? backend.industry?.designation ?? '',
      email: contact.email ?? backend.industry?.email ?? '',
      phone: contact.phone ?? backend.industry?.phone ?? '',
      phoneVisibility: backend.phoneVisibility ?? undefined,
      website: backend.organisation?.website ?? backend.industry?.website ?? '',
      industrySector: backend.organisation?.sector || sectorName,
      city: backend.organisation?.city ?? undefined,
      state: backend.organisation?.state ?? undefined,
      address: backend.organisation?.address ?? undefined,
    },
    details: {
      title: backend.title ?? '',
      description: backend.description ?? '',
      businessChallenge: backend.problemStatement ?? '',
      existingProcess: backend.existingProcess ?? '',
      expectedOutcome: backend.expectedOutcome ?? '',
      projectObjectives: backend.projectObjectives ?? '',
    },
    technical: {
      requiredTechnologies: backend.tags ?? [],
      requiredSkills: backend.requiredSkills ?? [],
      preferredBranches: backend.preferredBranches ?? [],
      preferredAcademicYear: backend.preferredAcademicYear ?? '',
      difficultyLevel: ['Easy', 'Medium', 'Hard'].includes(backend.difficultyLevel) ? backend.difficultyLevel : '',
      expectedDuration: backend.duration ?? '',
    },
    additional: {
      expectedDeliverables: backend.expectedDeliverables ?? '',
      additionalNotes: backend.additionalNotes ?? '',
      budget: backend.budgetRange ?? undefined,
      deadline: backend.deadline ?? undefined,
      fileAttachmentName: backend.attachmentUrls?.[0] ?? '',
      declarationAccepted: true,
    },
    status: mapBackendStatus(backend.status),
    submittedDate: backend.createdAt || new Date().toISOString(),
    reviewRemarks: backend.reviewRemarks,
    referenceCode: backend.referenceCode ?? undefined,
    submissionSource: backend.submissionSource,
    isNewOrganisation: backend.isNewOrganisation ?? false,
    ownedByRequester: backend.ownedByRequester ?? false,
    review: backend.review ?? undefined,
  } as ProblemStatement;
}

function mapBackendStatus(status: string): SubmissionStatus {
  const map: Record<string, SubmissionStatus> = {
    PENDING_APPROVAL: 'Pending',
    OPEN: 'Approved',
    REJECTED: 'Rejected',
    DRAFT: 'Pending',
    UNDER_REVIEW: 'Pending',
    CLOSED: 'Approved',
    ARCHIVED: 'Rejected',
  };
  return map[status] || 'Pending';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public (no-login) problem submission
// ─────────────────────────────────────────────────────────────────────────────

/** Calls a public endpoint and surfaces the server's own error message. */
async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) {
    throw new Error('The submission service is not configured. Please try again later.');
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    const fieldErrors = body?.errors?.fieldErrors as Record<string, string[]> | undefined;
    const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat()[0] : undefined;
    const formError = (body?.errors?.formErrors as string[] | undefined)?.[0];
    throw new Error(firstFieldError || formError || body?.message || `Request failed (${response.status})`);
  }
  return body.data as T;
}

/** Registered, approved organisations for the submission dropdown. */
export async function fetchPublicIndustries(): Promise<PublicIndustry[]> {
  return publicRequest<PublicIndustry[]>('/api/public/industries');
}

/** Upload a PDF attachment without logging in. */
export async function uploadPublicDocument(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  return publicRequest<{ url: string }>('/api/public/upload', { method: 'POST', body: form });
}

export interface PublicProblemPayload {
  // Organisation: either a registered one…
  industryProfileId?: string;
  // …or "Other"
  organisationName?: string;
  orgSector?: string;
  orgWebsite?: string;
  orgCity?: string;
  orgState?: string;
  orgAddress?: string;
  // Contact person
  contactName: string;
  contactDesignation: string;
  contactEmail: string;
  contactPhone: string;
  phoneVisibility?: PhoneVisibility;
  // Problem (already in backend shape)
  title: string;
  description: string;
  problemStatement: string;
  domain: string;
  deadline: string;
  budgetRange?: string;
  tags?: string[];
  attachmentUrls?: string[];
  duration?: string;
  existingProcess?: string;
  expectedOutcome?: string;
  projectObjectives?: string;
  requiredSkills?: string[];
  preferredBranches?: string[];
  preferredAcademicYear?: string;
  difficultyLevel?: string;
  expectedDeliverables?: string;
  additionalNotes?: string;
  // Spam trap — always empty for real users
  companyFax?: string;
}

/** Submit a problem statement without logging in. Never falls back to local storage. */
export async function submitPublicProblem(
  payload: PublicProblemPayload
): Promise<{ id: string; referenceCode: string; status: string; message: string }> {
  return publicRequest('/api/public/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** Build the backend problem fields from the submission form's ProblemStatement shape. */
export function toBackendProblemFields(payload: Omit<ProblemStatement, 'id' | 'status' | 'submittedDate'>) {
  const flat = flattenChallengePayload(payload);
  return {
    title: flat.title,
    description: flat.description,
    problemStatement: flat.problemStatement,
    domain: flat.domain,
    deadline: flat.deadline,
    budgetRange: flat.budgetRange || undefined,
    tags: flat.tags,
    attachmentUrls: flat.attachmentUrls,
    duration: flat.duration,
    existingProcess: flat.existingProcess,
    expectedOutcome: flat.expectedOutcome,
    projectObjectives: flat.projectObjectives,
    requiredSkills: flat.requiredSkills,
    preferredBranches: flat.preferredBranches,
    preferredAcademicYear: flat.preferredAcademicYear,
    difficultyLevel: flat.difficultyLevel,
    expectedDeliverables: flat.expectedDeliverables,
    additionalNotes: flat.additionalNotes,
  };
}

/** Change who can see a problem's mobile number. Does not send the problem back for review. */
export async function updatePhoneVisibility(id: string, phoneVisibility: PhoneVisibility): Promise<ProblemStatement> {
  if (!API_BASE) throw new Error('Backend is not configured');
  const updated = await fetchJSON<any>(`${API_BASE}/api/challenges/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneVisibility }),
  });
  return mapBackendToProblemStatement(updated);
}

/** CII admin: invite an unregistered ("Other") organisation to register. */
export async function inviteOrganisation(challengeId: string): Promise<{ inviteSentAt: string }> {
  if (!API_BASE) throw new Error('Backend is not configured');
  return fetchJSON<{ inviteSentAt: string }>(`${API_BASE}/api/admin/challenges/${challengeId}/invite`, {
    method: 'POST',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Password reset (all account types)
// ─────────────────────────────────────────────────────────────────────────────

/** Email a password reset link. The answer is the same whether or not the email is registered. */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const url = API_BASE ? `${API_BASE}/api/auth/forgot-password` : '/api/auth/forgot-password';
  return fetchJSON<{ message: string }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

/** Set a new password using the token from the emailed link. */
/** Company team: several people signing in to the same industry dashboard. */
export interface IndustryTeamMember {
  id: string;
  name: string;
  email: string;
  isMain: boolean;
  status: 'ACTIVE' | 'INVITED';
  createdAt: string;
}

export interface IndustryTeam {
  companyName: string;
  canManage: boolean;
  maxMembers: number;
  members: IndustryTeamMember[];
}

export function fetchIndustryTeam(): Promise<IndustryTeam> {
  return fetchJSON<IndustryTeam>(`${API_BASE}/api/industry/team`);
}

export function addTeamMember(name: string, email: string): Promise<{ member: IndustryTeamMember; setupUrl: string }> {
  return fetchJSON(`${API_BASE}/api/industry/team`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });
}

export async function createTeamMemberLink(id: string): Promise<string> {
  const { setupUrl } = await fetchJSON<{ setupUrl: string }>(`${API_BASE}/api/industry/team/${id}/link`, { method: 'POST' });
  return setupUrl;
}

export async function removeTeamMember(id: string): Promise<void> {
  await fetchJSON(`${API_BASE}/api/industry/team/${id}`, { method: 'DELETE' });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const url = API_BASE ? `${API_BASE}/api/auth/reset-password` : '/api/auth/reset-password';
  return fetchJSON<{ message: string }>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin insights
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminStats {
  summary: {
    totalUsers: number;
    totalInstitutions: number;
    totalChallenges: number;
    totalProposals: number;
    activeChallenges: number;
    pendingProposals: number;
    approvedProposals: number;
    pendingProblems: number;
    publicPendingProblems: number;
    pendingRegistrations: number;
    solutionsAwaitingReview: number;
    registeredIndustries: number;
  };
}

/** Platform-wide numbers for the admin overview (CII admins only). */
export async function fetchAdminStats(): Promise<AdminStats> {
  if (DEMO_MODE) {
    return {
      summary: {
        totalUsers: 0, totalInstitutions: 0, totalChallenges: 0, totalProposals: 0,
        activeChallenges: 0, pendingProposals: 0, approvedProposals: 0, pendingProblems: 0,
        publicPendingProblems: 0, pendingRegistrations: 0, solutionsAwaitingReview: 0, registeredIndustries: 0,
      },
    };
  }
  return fetchJSON<AdminStats>(`${API_BASE}/api/admin/stats`);
}

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string } | null;
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  q?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

/** One page of the activity log, newest first (CII admins only). */
export async function fetchAuditLog(
  query: AuditQuery
): Promise<{ data: AuditEntry[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  if (DEMO_MODE) return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return fetchJSON(`${API_BASE}/api/admin/audit?${params.toString()}`);
}
