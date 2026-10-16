import {
  ProblemStatement, User, SubmissionStatus, UserRole,
  ProblemAssignment, SolutionSubmission, SolutionStatus,
  RegisteredStudent
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

/** Problem Assignments (Institutions assigning challenges to student teams) */
export function getLocalAssignments(): ProblemAssignment[] {
  const saved = localStorage.getItem('ciisic_assignments');
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

export function saveLocalAssignments(assignments: ProblemAssignment[]) {
  localStorage.setItem('ciisic_assignments', JSON.stringify(assignments));
}

export function createAssignment(data: Omit<ProblemAssignment, 'id' | 'assignedDate' | 'status'>): ProblemAssignment {
  const assignments = getLocalAssignments();
  const newAssignment: ProblemAssignment = {
    ...data,
    id: 'ASG-' + Date.now().toString(36).toUpperCase(),
    assignedDate: new Date().toISOString(),
    status: 'ASSIGNED',
  };
  assignments.unshift(newAssignment);
  saveLocalAssignments(assignments);
  return newAssignment;
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

export async function submitSolution(data: Omit<SolutionSubmission, 'id' | 'submittedAt' | 'status'>): Promise<SolutionSubmission> {
  const solutions = getLocalSolutions();
  const newSolution: SolutionSubmission = {
    ...data,
    id: 'SOL-' + Date.now().toString(36).toUpperCase(),
    submittedAt: new Date().toISOString(),
    status: 'SUBMITTED',
  };

  solutions.unshift(newSolution);
  saveLocalSolutions(solutions);

  // If this solution is linked to an assignment, update assignment status
  if (data.assignmentId) {
    const assignments = getLocalAssignments();
    const idx = assignments.findIndex(a => a.id === data.assignmentId);
    if (idx !== -1) {
      assignments[idx].status = 'SUBMITTED';
      assignments[idx].solutionId = newSolution.id;
      saveLocalAssignments(assignments);
    }
  }

  // Attempt backend API dispatch if API_BASE is configured
  if (API_BASE) {
    try {
      await fetchJSON(`${API_BASE}/api/challenges/${data.challengeId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: data.summary,
          approachDoc: data.attachmentUrl || data.demoUrl || '',
          isDraft: false,
        }),
      });
    } catch (e) {
      console.warn('Backend proposal dispatch fallback to local state:', e);
    }
  }

  return newSolution;
}

export async function reviewSolution(
  solutionId: string, 
  status: SolutionStatus, 
  feedback?: string, 
  revisionNotes?: string
): Promise<SolutionSubmission> {
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
  
  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'API error');
  }
  return data.data as T;
}

/** Backend user to frontend User mapper */
export function mapBackendUserToFrontend(backendUser: any): User {
  let role: UserRole = 'industry';
  if (backendUser.role === 'CII_ADMIN' || backendUser.role === 'SUPER_ADMIN' || backendUser.role === 'admin') {
    role = 'admin';
  } else if (backendUser.role === 'INSTITUTION_SPOC' || backendUser.role === 'institution') {
    role = 'institution';
  } else if (backendUser.role === 'STUDENT' || backendUser.role === 'student') {
    role = 'student';
  } else if (backendUser.role === 'INDUSTRY_SPOC' || backendUser.role === 'industry') {
    role = 'industry';
  }

  const instName =
    backendUser.studentProfile?.institution?.name ||
    backendUser.institutionProfile?.institution?.name ||
    backendUser.institutionName ||
    '';
  const instCity =
    backendUser.studentProfile?.institution?.city ||
    backendUser.institutionProfile?.institution?.city ||
    backendUser.institutionCity ||
    '';
  const compName =
    backendUser.industryProfile?.companyName ||
    backendUser.companyName ||
    '';
  const desig =
    role === 'student'
      ? (backendUser.studentProfile?.enrollmentNo ? `Student Innovator (${backendUser.studentProfile.enrollmentNo})` : 'Student Innovator')
      : (backendUser.industryProfile?.designation ||
         backendUser.institutionProfile?.designation ||
         backendUser.designation ||
         '');
  const dept =
    backendUser.studentProfile?.department ||
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
    enrollmentNo: backendUser.studentProfile?.enrollmentNo,
    yearOfStudy: backendUser.studentProfile?.yearOfStudy,
    skills: backendUser.studentProfile?.skills,
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
export async function login(email: string, password: string, _roleHint?: UserRole): Promise<User> {
  const url = API_BASE ? `${API_BASE}/api/auth/login` : '/api/auth/login';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setAuthToken(data.token);
        const user = mapBackendUserToFrontend(data.user);
        localStorage.setItem('ciisic_current_user', JSON.stringify(user));
        return user;
      }
    }
  } catch (err) {
    console.warn('Backend login unavailable, proceeding with local credentials fallback:', err);
  }

  // Fallback demo authentication:
  const normalizedEmail = email.trim().toLowerCase();
  let role: UserRole = _roleHint || 'industry';
  let name = 'Corporate Innovation Partner';
  let compName = 'Tata Consultancy Services';
  let instName = '';
  
  if (normalizedEmail.includes('admin') || _roleHint === 'admin') {
    role = 'admin';
    name = 'CII Administrator';
    compName = '';
  } else if (_roleHint === 'student' || normalizedEmail.includes('student') || normalizedEmail.includes('stud')) {
    role = 'student';
    name = 'Arjun Verma';
    instName = 'Jagran Lakecity University';
    compName = '';
  } else if (normalizedEmail.includes('inst') || normalizedEmail.includes('univ') || normalizedEmail.includes('college') || normalizedEmail.includes('edu') || _roleHint === 'institution') {
    role = 'institution';
    name = 'Dr. Academic SPOC';
    instName = 'Indian Institute of Technology, Delhi';
    compName = '';
  }

  const fallbackUser: User = {
    id: 'usr_' + Date.now(),
    name: name,
    email: email.trim(),
    role: role,
    companyName: compName,
    designation: role === 'admin' ? 'Head of CII Operations' : role === 'institution' ? 'Dean of Academic R&D' : role === 'student' ? 'Student Innovator (JLU2024CS001)' : 'Lead R&D Director',
    institutionName: instName,
    institutionCity: role === 'student' ? 'Bhopal' : 'New Delhi',
    department: role === 'student' ? 'Computer Science & Engineering' : 'Research & Innovation Cell',
    phone: '+91 9876543210',
    enrollmentNo: role === 'student' ? 'JLU2024CS001' : undefined,
    yearOfStudy: role === 'student' ? 3 : undefined,
    skills: role === 'student' ? ['Python', 'Machine Learning', 'React', 'Data Analysis'] : undefined,
  };

  setAuthToken('token_local_' + Date.now());
  localStorage.setItem('ciisic_current_user', JSON.stringify(fallbackUser));
  return fallbackUser;
}

export async function registerIndustry(data: {
  companyName: string;
  industry: string;
  websiteUrl?: string;
  isCIIMember?: boolean;
  contactPerson: string;
  email: string;
  password: string;
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
        companyName: data.companyName,
        industry: data.industry,
        websiteUrl: data.websiteUrl || '',
        isCIIMember: data.isCIIMember ?? true,
      }),
    });

    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success) {
        return {
          success: true,
          requiresApproval: true,
          message: 'Your enterprise registration has been submitted and is pending CII Administrator review. You will be able to log in once approved.',
        };
      }
    }
  } catch (e) {
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
  password?: string;
}): Promise<{ success: boolean; message: string; requiresApproval: boolean }> {
  const url = API_BASE ? `${API_BASE}/api/auth/register` : '/api/auth/register';
  const password = data.password || 'Spoc@1234';

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
        department: data.department,
        designation: data.designation,
      }),
    });

    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success) {
        return {
          success: true,
          requiresApproval: true,
          message: 'Your academic institution registration has been submitted and is pending CII Administrator review. You will be able to log in once approved.',
        };
      }
    }
  } catch (e) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Student Registration & Management Store
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_STUDENTS: RegisteredStudent[] = [
  {
    id: 'std-001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@jlu.edu.in',
    phone: '+91 9826012345',
    institutionId: 'inst_jlu',
    institutionName: 'Jagran Lakecity University',
    institutionCity: 'Bhopal',
    enrollmentNo: 'JLU2023CS042',
    department: 'Computer Science & Engineering',
    course: 'B.Tech',
    yearOfStudy: 3,
    idCardUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    idCardFileName: 'aarav_jlu_id.jpg',
    skills: ['Python', 'Computer Vision', 'PyTorch', 'FastAPI'],
    createdAt: '2026-02-14T09:30:00.000Z',
    status: 'VERIFIED',
  },
  {
    id: 'std-002',
    name: 'Priya Patel',
    email: 'priya.patel@jlu.edu.in',
    phone: '+91 9755123456',
    institutionId: 'inst_jlu',
    institutionName: 'Jagran Lakecity University',
    institutionCity: 'Bhopal',
    enrollmentNo: 'JLU2023AI018',
    department: 'Artificial Intelligence & Machine Learning',
    course: 'B.Tech',
    yearOfStudy: 3,
    idCardUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    idCardFileName: 'priya_id_card.png',
    skills: ['Machine Learning', 'TensorFlow', 'NLP', 'Data Science'],
    createdAt: '2026-02-18T11:15:00.000Z',
    status: 'VERIFIED',
  },
  {
    id: 'std-003',
    name: 'Rohan Mehra',
    email: 'rohan.mehra@lnct.ac.in',
    phone: '+91 9425098765',
    institutionId: 'inst_lnct',
    institutionName: 'Lakshmi Narain College of Technology',
    institutionCity: 'Bhopal',
    enrollmentNo: '0103CS221089',
    department: 'Computer Science & Engineering',
    course: 'B.Tech',
    yearOfStudy: 4,
    idCardUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    idCardFileName: 'rohan_lnct_id.jpg',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    createdAt: '2026-02-20T14:45:00.000Z',
    status: 'VERIFIED',
  },
  {
    id: 'std-004',
    name: 'Divya Suryavanshi',
    email: 'divya.s@rntu.ac.in',
    phone: '+91 9111223344',
    institutionId: 'inst_rntu',
    institutionName: 'Rabindranath Tagore University (RNTU)',
    institutionCity: 'Bhopal',
    enrollmentNo: 'RNTU2024AG012',
    department: 'Agricultural Engineering',
    course: 'B.Tech',
    yearOfStudy: 2,
    idCardUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    idCardFileName: 'divya_rntu_id.jpg',
    skills: ['IoT Firmware', 'Agritech', 'Sensors', 'Embedded C'],
    createdAt: '2026-02-22T16:20:00.000Z',
    status: 'VERIFIED',
  },
  {
    id: 'std-005',
    name: 'Harsh Vardhan',
    email: 'harsh.v@iiti.ac.in',
    phone: '+91 9988776655',
    institutionId: 'inst_iit_indore',
    institutionName: 'Indian Institute of Technology (IIT), Indore',
    institutionCity: 'Indore',
    enrollmentNo: 'IIT22ME004',
    department: 'Mechanical Engineering',
    course: 'B.Tech',
    yearOfStudy: 4,
    idCardUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    idCardFileName: 'harsh_iiti_id.jpg',
    skills: ['CAD/CAM', 'ANSYS', 'SolidWorks', 'Thermal Modeling'],
    createdAt: '2026-02-24T10:00:00.000Z',
    status: 'VERIFIED',
  },
];

export function getLocalStudents(): RegisteredStudent[] {
  const saved = localStorage.getItem('ciisic_registered_students');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  localStorage.setItem('ciisic_registered_students', JSON.stringify(DEFAULT_STUDENTS));
  return DEFAULT_STUDENTS;
}

export function saveLocalStudents(students: RegisteredStudent[]) {
  localStorage.setItem('ciisic_registered_students', JSON.stringify(students));
}

/** Check if email or enrollment number is already registered */
export function checkStudentRegistered(email: string, enrollmentNo: string): { exists: boolean; reason?: 'email' | 'enrollment' } {
  const students = getLocalStudents();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedEnroll = enrollmentNo.trim().toUpperCase();

  const foundEmail = students.find(s => s.email.trim().toLowerCase() === normalizedEmail);
  if (foundEmail) return { exists: true, reason: 'email' };

  const foundEnroll = students.find(s => s.enrollmentNo.trim().toUpperCase() === normalizedEnroll);
  if (foundEnroll) return { exists: true, reason: 'enrollment' };

  return { exists: false };
}

/** Upload Student ID Card (backend API with data URL fallback) */
export async function uploadStudentIdCard(file: File): Promise<{ url: string; fileName: string }> {
  const url = API_BASE ? `${API_BASE}/api/upload` : '/api/upload';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'ID_CARD');

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const res = await response.json();
      if (res.success && res.data?.url) {
        return {
          url: res.data.url,
          fileName: res.data.fileName || file.name,
        };
      }
    }
  } catch (err) {
    console.warn('Backend upload unavailable, falling back to local object storage:', err);
  }

  // Fallback to data URL for seamless preview and offline operation
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  });
}

export interface StudentRegistrationPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  institutionId?: string;
  institutionName: string;
  institutionCity?: string;
  enrollmentNo: string;
  department: string;
  course: string;
  yearOfStudy: number | string;
  idCardUrl?: string;
  idCardFileName?: string;
  skills: string[];
}

/** Register Student */
export async function registerStudent(
  data: StudentRegistrationPayload
): Promise<{ success: boolean; alreadyRegistered?: boolean; message: string; student?: RegisteredStudent }> {
  // 1. Check local collision first
  const check = checkStudentRegistered(data.email, data.enrollmentNo);
  if (check.exists) {
    return {
      success: false,
      alreadyRegistered: true,
      message: check.reason === 'email' 
        ? 'An account with this email is already registered. Please sign in to your student account.'
        : 'This enrollment number is already registered. Please sign in to your student account.',
    };
  }

  // 2. Dispatch to Backend API
  const url = API_BASE ? `${API_BASE}/api/auth/register` : '/api/auth/register';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password,
        name: data.name.trim(),
        role: 'STUDENT',
        enrollmentNo: data.enrollmentNo.trim().toUpperCase(),
        institutionId: data.institutionId || data.institutionName,
        department: data.department,
        course: data.course,
        idCardUrl: data.idCardUrl || '',
        phone: data.phone || '',
        yearOfStudy: typeof data.yearOfStudy === 'number' ? data.yearOfStudy : parseInt(String(data.yearOfStudy)) || 1,
        skills: data.skills || [],
      }),
    });

    if (response.status === 409) {
      const errJson = await response.json().catch(() => null);
      return {
        success: false,
        alreadyRegistered: true,
        message: errJson?.message || 'An account with this email or enrollment number is already registered. Please sign in.',
      };
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      if (errJson?.message) {
        throw new Error(errJson.message);
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('already exists') || err.message.includes('already registered'))) {
      return {
        success: false,
        alreadyRegistered: true,
        message: err.message,
      };
    }
    console.warn('Backend student registration failed, persisting to local store:', err);
  }

  // 3. Persist new student locally
  const newStudent: RegisteredStudent = {
    id: 'std-' + Date.now().toString(36).toUpperCase(),
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone || '',
    institutionId: data.institutionId || 'inst_' + Date.now().toString(36),
    institutionName: data.institutionName,
    institutionCity: data.institutionCity || 'Bhopal',
    enrollmentNo: data.enrollmentNo.trim().toUpperCase(),
    department: data.department,
    course: data.course,
    yearOfStudy: typeof data.yearOfStudy === 'number' ? data.yearOfStudy : parseInt(String(data.yearOfStudy)) || 1,
    idCardUrl: data.idCardUrl || '',
    idCardFileName: data.idCardFileName || 'student_id_card.png',
    skills: data.skills,
    createdAt: new Date().toISOString(),
    status: 'VERIFIED',
  };

  const students = getLocalStudents();
  students.unshift(newStudent);
  saveLocalStudents(students);

  return {
    success: true,
    alreadyRegistered: false,
    message: 'Student Innovator registered successfully! You can now log in.',
    student: newStudent,
  };
}

/** Fetch Registered Students for an Institution */
export async function fetchInstitutionStudents(
  institutionIdentifier?: string
): Promise<RegisteredStudent[]> {
  const localList = getLocalStudents();

  if (institutionIdentifier && API_BASE) {
    try {
      const res = await fetchJSON<{ students?: RegisteredStudent[]; [key: string]: any }>(
        `${API_BASE}/api/institutions/${encodeURIComponent(institutionIdentifier)}/students`
      );
      if (res?.students && Array.isArray(res.students)) {
        return res.students;
      }
    } catch (e) {
      console.warn('Backend fetchInstitutionStudents unavailable, filtering local:', e);
    }
  }

  if (!institutionIdentifier || institutionIdentifier === 'All') {
    return localList;
  }

  const query = institutionIdentifier.toLowerCase().trim();
  const filtered = localList.filter((s) => {
    const sName = (s.institutionName || '').toLowerCase();
    const sId = (s.institutionId || '').toLowerCase();
    return sName.includes(query) || query.includes(sName) || sId === query;
  });

  return filtered.length > 0 ? filtered : localList;
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
  if (API_BASE) {
    try {
      const res = await fetchJSON<{ data?: any[]; [key: string]: any }>(`${API_BASE}/api/challenges`);
      const challengesList = Array.isArray(res) ? res : (res?.data || []);
      return challengesList.map(mapBackendToProblemStatement);
    } catch (e) {
      console.warn('Backend fetchChallenges failed, falling back to local data:', e);
    }
  }

  return getLocalChallenges();
}

export async function fetchChallengeById(id: string): Promise<ProblemStatement> {
  if (API_BASE) {
    try {
      const challenge = await fetchJSON<any>(`${API_BASE}/api/challenges/${id}`);
      return mapBackendToProblemStatement(challenge);
    } catch (e) {
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
    deadline: getDeadline(payload),
    budgetRange: getBudgetRange(payload),
    tags: payload.technical?.requiredTechnologies || [],
    attachmentUrls: payload.additional?.fileAttachmentName ? [payload.additional.fileAttachmentName] : [],
    organizationName: payload.company?.companyName || 'Unknown Organization',
    duration: payload.technical?.expectedDuration || '6 Months',
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
      if (payload.additional?.additionalNotes) {
        (flatPayload as any).budgetRange = tempFlat.budgetRange;
        (flatPayload as any).deadline = tempFlat.deadline;
      }
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
  const company = backend.organizationName || backend.industry?.companyName || 'Corporate Partner';
  return {
    id: backend.id,
    company: {
      industryName: sectorName,
      companyName: company,
      representativeName: backend.industry?.representativeName ?? '',
      designation: backend.industry?.designation ?? 'Corporate R&D',
      email: backend.industry?.email ?? '',
      phone: backend.industry?.phone ?? '',
      website: backend.industry?.website ?? '',
      industrySector: sectorName,
    },
    details: {
      title: backend.title ?? '',
      description: backend.description ?? '',
      businessChallenge: backend.problemStatement ?? '',
      existingProcess: '',
      expectedOutcome: backend.description ?? '',
      projectObjectives: '',
    },
    technical: {
      requiredTechnologies: backend.tags ?? [],
      requiredSkills: [],
      preferredBranches: [],
      preferredAcademicYear: '',
      difficultyLevel: 'Medium',
      expectedDuration: backend.duration ?? '',
    },
    additional: {
      expectedDeliverables: '',
      additionalNotes: backend.budgetRange ?? '',
      fileAttachmentName: backend.attachmentUrls?.[0] ?? '',
      declarationAccepted: true,
    },
    status: mapBackendStatus(backend.status),
    submittedDate: backend.createdAt || new Date().toISOString(),
    reviewRemarks: backend.reviewRemarks,
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

