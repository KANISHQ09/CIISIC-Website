import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Lock, Mail, ArrowLeft, ArrowRight, Building2, 
  User, Phone, UploadCloud, Eye, EyeOff, CheckCircle2, AlertCircle, 
  FileText, X, Sparkles, ShieldCheck, Check
} from 'lucide-react';
import { ALL_INSTITUTIONS } from '../data/institutions';
import { registerStudent, uploadStudentIdCard, checkStudentRegistered } from '../lib/api';
import { useApp } from '../contexts/AppContext';

const COMMON_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science & Analytics',
  'Electronics & Communication Engineering',
  'Mechanical Engineering',
  'Electrical & Electronics Engineering',
  'Civil Engineering',
  'Information Technology',
  'Agricultural Engineering & Agritech',
  'Robotics & Automation',
  'Biotechnology',
  'Management & Business Studies',
  'Other Department',
];

const COMMON_COURSES = [
  'B.Tech / B.E.',
  'M.Tech / M.E.',
  'BCA',
  'MCA',
  'B.Sc (Computer Science / IT)',
  'M.Sc (Technology / Science)',
  'MBA (Tech / Operations)',
  'Ph.D / Doctoral Research',
  'Diploma / Polytechnic',
];

const SKILL_SUGGESTIONS = [
  'Python', 'Machine Learning', 'React', 'IoT', 'Embedded Systems', 
  'Computer Vision', 'PyTorch', 'Data Science', 'Node.js', 
  'Cloud / AWS', 'Robotics', 'CAD / SolidWorks', 'Agritech'
];

export const StudentRegister: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  // Institution Selection State
  const [institutionCityFilter, setInstitutionCityFilter] = useState<'All' | 'Indore' | 'Bhopal'>('All');
  const [selectedInstName, setSelectedInstName] = useState(ALL_INSTITUTIONS[0]?.name || 'Jagran Lakecity University');
  const [customInstName, setCustomInstName] = useState('');
  const [isCustomInst, setIsCustomInst] = useState(false);

  // Academic Details
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [course, setCourse] = useState('B.Tech / B.E.');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [customDepartment, setCustomDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState<number>(3);

  // Personal Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ID Card Upload State
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string>('');
  const [idCardFileName, setIdCardFileName] = useState<string>('');
  const [isUploadingId, setIsUploadingId] = useState(false);

  // Skills State
  const [skills, setSkills] = useState<string[]>(['Python', 'Machine Learning']);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Declaration & UI state
  const [agreedToCharter, setAgreedToCharter] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [alreadyRegisteredMessage, setAlreadyRegisteredMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter institutions based on city filter
  const filteredInstitutions = useMemo(() => {
    if (institutionCityFilter === 'All') return ALL_INSTITUTIONS;
    return ALL_INSTITUTIONS.filter(i => i.city === institutionCityFilter);
  }, [institutionCityFilter]);

  // Handle institution dropdown change
  const handleInstitutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__OTHER__') {
      setIsCustomInst(true);
      setSelectedInstName('');
    } else {
      setIsCustomInst(false);
      setSelectedInstName(val);
    }
  };

  // Handle Student ID Card Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('ID card file size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    setIdCardFile(file);
    setIdCardFileName(file.name);
    setError('');

    // Generate local preview
    const reader = new FileReader();
    reader.onload = () => {
      setIdCardPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded ID card
  const handleRemoveIdCard = () => {
    setIdCardFile(null);
    setIdCardPreview('');
    setIdCardFileName('');
  };

  // Toggle skills
  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter(s => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  // Add custom skill
  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkillInput('');
    }
  };

  // Real-time check on blur for email or enrollment
  const handleCheckDuplicate = () => {
    if (email.trim() && enrollmentNo.trim()) {
      const check = checkStudentRegistered(email, enrollmentNo);
      if (check.exists) {
        setAlreadyRegisteredMessage(
          check.reason === 'email'
            ? 'An account with this student email is already registered.'
            : 'This enrollment number is already registered in the innovation portal.'
        );
      } else {
        setAlreadyRegisteredMessage('');
      }
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAlreadyRegisteredMessage('');

    const finalInstName = isCustomInst ? customInstName.trim() : selectedInstName.trim();
    const finalDept = department === 'Other Department' ? customDepartment.trim() : department;

    // Basic Validations
    if (!finalInstName) {
      setError('Please select or enter your institution name.');
      return;
    }
    if (!enrollmentNo.trim()) {
      setError('Please enter your university enrollment or roll number.');
      return;
    }
    if (!finalDept) {
      setError('Please specify your department or branch.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all mandatory account details.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Account passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (!agreedToCharter) {
      setError('Please acknowledge the student declaration.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload ID card if attached
      let uploadedIdUrl = idCardPreview;
      if (idCardFile) {
        setIsUploadingId(true);
        const uploadResult = await uploadStudentIdCard(idCardFile);
        uploadedIdUrl = uploadResult.url;
        setIsUploadingId(false);
      }

      // 2. Register Student
      const res = await registerStudent({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        institutionName: finalInstName,
        enrollmentNo: enrollmentNo.trim().toUpperCase(),
        department: finalDept,
        course,
        yearOfStudy,
        idCardUrl: uploadedIdUrl || '',
        idCardFileName: idCardFileName || 'student_id.png',
        skills,
      });

      if (res.alreadyRegistered) {
        setAlreadyRegisteredMessage(res.message);
        setError(res.message);
        return;
      }

      if (res.success) {
        showToast('Student Innovator Registration completed successfully!', 'success');
        setIsSubmitted(true);
      } else {
        setError(res.message || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during student registration.');
    } finally {
      setIsLoading(false);
      setIsUploadingId(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (isSubmitted) {
    const finalInstName = isCustomInst ? customInstName.trim() : selectedInstName.trim();
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#faf8f4] relative overflow-hidden">
        <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/90 shadow-xl p-8 sm:p-10 text-center space-y-6 animate-fade-in relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#063028] bg-[#edf4f0] px-3 py-1 rounded-full border border-[#063028]/15">
              Innovator Account Active
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-[#063028]">
              Registration Successful!
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              Welcome to the CII Student Innovation Challenge Platform.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#faf8f4] border border-stone-200 text-left text-xs sm:text-sm text-stone-700 space-y-2.5">
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-medium">Student Name:</span>
              <strong className="text-stone-900 font-bold">{fullName}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-medium">Enrollment No:</span>
              <strong className="text-[#063028] font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                {enrollmentNo.toUpperCase()}
              </strong>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-medium">Institution:</span>
              <strong className="text-stone-900 font-semibold truncate max-w-[180px] text-right">
                {finalInstName}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">Department:</span>
              <span className="text-stone-800 font-medium truncate max-w-[180px] text-right">
                {course} • {department}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/student/login"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all shadow-md cursor-pointer"
              id="proceed-to-login-btn"
            >
              Sign In to Student Innovator Portal <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="block text-xs font-semibold text-stone-600 hover:text-[#063028] transition-colors"
            >
              Back to CIISIC Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN REGISTRATION FORM
  return (
    <div className="min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#faf8f4] relative overflow-hidden">
      {/* Background radial accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e0d8_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#edf4f0]/60 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-3xl w-full mx-auto space-y-6 relative z-10 animate-fade-in">
        
        {/* Navigation Breadcrumb & Portal Switcher */}
        <div className="flex justify-between items-center px-1">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#063028] transition-all group"
            id="back-to-home"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> 
            Back to Homepage
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#063028] tracking-wider uppercase bg-[#edf4f0] border border-[#063028]/15 px-3 py-1 rounded-full">
              Student Registration
            </span>
          </div>
        </div>

        {/* ALREADY REGISTERED CALLOUT BANNER */}
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#a6711c] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">Already registered as a student?</p>
              <p className="text-xs text-stone-600">If you already have a student innovator account, proceed directly to sign in.</p>
            </div>
          </div>
          <Link
            to="/student/login"
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-amber-300 text-stone-800 text-xs font-bold rounded-xl shadow-2xs transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
            id="banner-signin-btn"
          >
            Sign In Instead <ArrowRight className="w-3.5 h-3.5 text-[#063028]" />
          </Link>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
          {/* Top Banner Accent */}
          <div className="h-2.5 bg-gradient-to-r from-[#063028] via-[#c48825] to-[#063028]"></div>

          <div className="p-6 sm:p-10 lg:p-12 space-y-8 text-left">
            
            {/* Header Titles */}
            <div className="text-center space-y-3 pb-2 border-b border-stone-100">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-[#edf4f0] text-[#063028] border border-[#063028]/15 flex items-center justify-center shadow-sm">
                <GraduationCap className="h-8 w-8 text-[#063028]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#063028] tracking-tight font-serif">
                Student Innovator Registration
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
                Register to solve authentic industrial problem statements, collaborate on student projects, and submit technological prototypes.
              </p>
            </div>

            {/* Error or Duplicate Alert */}
            {alreadyRegisteredMessage && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs sm:text-sm font-medium text-amber-900 leading-relaxed flex items-start justify-between gap-3 animate-fade-in" id="duplicate-warning">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Account Already Exists</strong>
                    <span>{alreadyRegisteredMessage}</span>
                  </div>
                </div>
                <Link
                  to="/student/login"
                  className="px-3 py-1.5 bg-[#063028] text-white text-xs font-bold rounded-lg shrink-0 hover:bg-[#04201a] transition-all"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {error && !alreadyRegisteredMessage && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-xs sm:text-sm font-medium text-red-800 leading-relaxed animate-fade-in" id="register-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" id="student-register-form">
              
              {/* SECTION 1: ACADEMIC DETAILS */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <Building2 className="w-5 h-5 text-[#063028]" />
                  <h2 className="text-base font-bold text-stone-900 font-serif">1. Academic Affiliation</h2>
                </div>

                {/* Institute Dropdown List with City Quick Filter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="institute-dropdown" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Select Your Academic Institution <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500">
                      <span>Filter:</span>
                      <button
                        type="button"
                        onClick={() => setInstitutionCityFilter('All')}
                        className={`px-1.5 py-0.5 rounded ${institutionCityFilter === 'All' ? 'bg-[#063028] text-white' : 'hover:bg-stone-100'}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstitutionCityFilter('Bhopal')}
                        className={`px-1.5 py-0.5 rounded ${institutionCityFilter === 'Bhopal' ? 'bg-[#063028] text-white' : 'hover:bg-stone-100'}`}
                      >
                        Bhopal
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstitutionCityFilter('Indore')}
                        className={`px-1.5 py-0.5 rounded ${institutionCityFilter === 'Indore' ? 'bg-[#063028] text-white' : 'hover:bg-stone-100'}`}
                      >
                        Indore
                      </button>
                    </div>
                  </div>

                  <select
                    id="institute-dropdown"
                    value={isCustomInst ? '__OTHER__' : selectedInstName}
                    onChange={handleInstitutionChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 cursor-pointer"
                    required
                  >
                    <optgroup label="CII Partner Academic Institutions">
                      {filteredInstitutions.map((inst, idx) => (
                        <option key={`${inst.name}-${idx}`} value={inst.name}>
                          {inst.name} ({inst.city})
                        </option>
                      ))}
                    </optgroup>
                    <option value="__OTHER__">+ Other Institution (Not in list)</option>
                  </select>

                  {isCustomInst && (
                    <div className="pt-2 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Enter your institution / college name"
                        value={customInstName}
                        onChange={(e) => setCustomInstName(e.target.value)}
                        className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Enrollment No & Year of Study Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="enrollment-no" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Enrollment / Roll Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="enrollment-no"
                      type="text"
                      placeholder="e.g. JLU2023CS042 or 0103CS221089"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      onBlur={handleCheckDuplicate}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-mono font-bold text-stone-900 uppercase focus:outline-none focus:border-[#063028]"
                      required
                    />
                    <p className="text-[11px] text-stone-500">Unique university identifier used for verification.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="year-of-study" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Year of Study <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="year-of-study"
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white focus:outline-none focus:border-[#063028] cursor-pointer"
                      required
                    >
                      <option value={1}>1st Year (UG)</option>
                      <option value={2}>2nd Year (UG)</option>
                      <option value={3}>3rd Year (UG)</option>
                      <option value={4}>4th Year (Final Year UG)</option>
                      <option value={5}>Postgraduate / Masters (1st Year)</option>
                      <option value={6}>Postgraduate / Masters (2nd Year)</option>
                    </select>
                  </div>
                </div>

                {/* Course & Department Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="course-select" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Course / Degree <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="course-select"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white focus:outline-none focus:border-[#063028] cursor-pointer"
                      required
                    >
                      {COMMON_COURSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="department-select" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Department / Specialization <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="department-select"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 bg-white focus:outline-none focus:border-[#063028] cursor-pointer"
                      required
                    >
                      {COMMON_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {department === 'Other Department' && (
                  <div className="pt-1 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Specify your academic branch/department"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                      required
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: STUDENT ID CARD UPLOAD */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <FileText className="w-5 h-5 text-[#063028]" />
                  <h2 className="text-base font-bold text-stone-900 font-serif">2. Student ID Card Verification</h2>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs sm:text-sm font-bold text-stone-800">
                    Upload Student ID Card Photo / Document <span className="text-red-500">*</span>
                  </label>
                  
                  {!idCardPreview ? (
                    <div className="border-2 border-dashed border-stone-300 hover:border-[#063028] transition-colors rounded-2xl p-6 sm:p-8 text-center bg-stone-50/70 relative cursor-pointer group">
                      <input
                        type="file"
                        id="id-card-input"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl bg-[#edf4f0] text-[#063028] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-800">
                            Click to upload or drag &amp; drop student ID card
                          </p>
                          <p className="text-xs text-stone-500 mt-1">
                            Supports JPG, PNG, WebP or PDF (Max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-stone-200 rounded-2xl p-4 bg-stone-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {idCardFile?.type.includes('pdf') ? (
                          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
                            PDF
                          </div>
                        ) : (
                          <img
                            src={idCardPreview}
                            alt="ID Preview"
                            className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                          />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-stone-900 truncate">{idCardFileName || 'student_id_card.png'}</p>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            ✓ ID Card Attached
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveIdCard}
                        className="p-2 text-stone-400 hover:text-red-600 rounded-xl hover:bg-white transition-all cursor-pointer"
                        title="Remove ID Card"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-stone-500">
                    Your college coordinator / institution SPOC will review this ID card to verify student innovator status.
                  </p>
                </div>
              </div>

              {/* SECTION 3: PERSONAL & ACCOUNT DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <User className="w-5 h-5 text-[#063028]" />
                  <h2 className="text-base font-bold text-stone-900 font-serif">3. Personal &amp; Account Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="student-name" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="student-name"
                      type="text"
                      placeholder="e.g. Arjun Verma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="student-phone" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        id="student-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="student-email-input" className="block text-xs sm:text-sm font-bold text-stone-800">
                    Student Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="student-email-input"
                      type="email"
                      placeholder="student@university.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleCheckDuplicate}
                      className="w-full pl-9 pr-4 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">Used as your login email for the student innovator portal.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="student-pass" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Create Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="student-pass"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 chars, 1 uppercase, 1 digit"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="student-confirm-pass" className="block text-xs sm:text-sm font-bold text-stone-800">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="student-confirm-pass"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 border border-stone-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#063028]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: INNOVATION INTERESTS & SKILLS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                  <Sparkles className="w-5 h-5 text-[#c48825]" />
                  <h2 className="text-base font-bold text-stone-900 font-serif">4. Skills &amp; Domain Interests</h2>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs sm:text-sm font-bold text-stone-800">
                    Select your primary technical skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_SUGGESTIONS.map(skill => {
                      const isSelected = skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#063028] text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-emerald-300" />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add other skill (e.g. Flutter, Blockchain, CAD)"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={handleAddCustomSkill}
                      className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-[#063028] flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* DECLARATION CHECKBOX */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToCharter}
                    onChange={(e) => setAgreedToCharter(e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-[#063028] border-stone-300 rounded focus:ring-[#063028] cursor-pointer"
                    id="declaration-checkbox"
                    required
                  />
                  <span className="text-xs text-stone-600 leading-relaxed font-normal">
                    I certify that I am a bona fide student of the selected academic institution and the provided enrollment details and student ID card are authentic. I agree to uphold the CII Student Innovation Challenge integrity guidelines.
                  </span>
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading || isUploadingId}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-base font-bold text-white bg-[#063028] hover:bg-[#04201a] focus:outline-none transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  id="student-register-submit-btn"
                >
                  {isLoading || isUploadingId ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Registering Student Account...
                    </>
                  ) : (
                    <>
                      Register as Student Innovator <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-stone-600">
                  Already registered?{' '}
                  <Link to="/student/login" className="font-bold text-[#c48825] hover:underline">
                    Sign in to your student portal here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Other Portals Navigation */}
        <div className="text-center pt-2">
          <p className="text-xs text-stone-600 inline-flex items-center justify-center gap-3 flex-wrap">
            <Link to="/institution/login" className="hover:text-[#063028] hover:underline font-semibold">
              Institution Portal
            </Link>
            <span className="text-stone-300">•</span>
            <Link to="/industry/login" className="hover:text-[#063028] hover:underline font-semibold">
              Industry Portal
            </Link>
            <span className="text-stone-300">•</span>
            <Link to="/admin/login" className="hover:text-[#063028] hover:underline font-semibold">
              CII Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
