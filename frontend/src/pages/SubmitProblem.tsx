import React, { useEffect, useRef, useState } from 'react';
import { useScrollIntoViewOnChange } from '../lib/useScrollIntoViewOnChange';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Building2, Settings, FileText, CheckCircle, ArrowLeft, 
  ArrowRight, ShieldAlert, UploadCloud, X, Check, Sparkles, ChevronRight,
  UserRound, Copy
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { DifficultyLevel, PublicIndustry } from '../types';
import {
  uploadFile, uploadPublicDocument, fetchPublicIndustries,
  submitPublicProblem, toBackendProblemFields
} from '../lib/api';

/** Dropdown value for an organisation that is not registered on the portal. */
const OTHER_ORG = 'OTHER';
/** Dropdown value used when a logged-in industry user submits for their own company. */
const OWN_ORG = 'SELF';

// Zod validation schema
const formSchema = z.object({
  // Step 1: Organisation & contact
  orgChoice: z.string().min(1, 'Select your organisation, or choose "Other"'),
  industryName: z.string().min(1, 'Industry sector category is required'),
  companyName: z.string().min(1, 'Organisation name is required'),
  representativeName: z.string().min(2, 'Your name is required'),
  designation: z.string().min(2, 'Designation is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .regex(/^[+0-9 ()-]+$/, 'Use digits, spaces, +, - and brackets only'),
  website: z.string().optional(),
  industrySector: z.string().min(2, 'Industry sector is required'),
  // Only needed for "Other" organisations (checked in validateOrganisation)
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),

  // Step 2: Problem Details
  title: z.string().min(25, 'Title must be at least 25 characters'),
  description: z.string().min(25, 'Description must be at least 25 characters'),
  businessChallenge: z.string().min(25, 'Business challenge must be at least 25 characters'),
  existingProcess: z.string().min(10, 'Existing process explanation is required'),
  expectedOutcome: z.string().min(15, 'Expected outcome is required'),
  projectObjectives: z.string().min(15, 'Project objectives are required'),

  // Step 3: Technical Details
  requiredTechnologiesStr: z.string().min(2, 'Specify technologies separated by commas'),
  requiredSkillsStr: z.string().min(2, 'Specify skills separated by commas'),
  preferredBranchesStr: z.string().min(2, 'Preferred academic branches are required'),
  preferredAcademicYear: z.string().min(2, 'Preferred academic year is required'),
  difficultyLevel: z.enum(['Easy', 'Medium', 'Hard'] as const),
  expectedDuration: z.string().min(2, 'Duration is required (e.g., 6 Months)'),

  // Step 4: Additional Details
  expectedDeliverables: z.string().min(10, 'Expected deliverables are required'),
  budget: z.string().min(1, 'Budget / Funding Offered is required'),
  deadline: z.string().min(1, 'Expected Solution Deadline is required'),
  additionalNotes: z.string().optional(),
  declarationAccepted: z.boolean().refine(val => val === true, 'You must accept the declaration to submit')
});

type FormFields = z.infer<typeof formSchema>;

export const SubmitProblem: React.FC = () => {
  const { addSubmission, currentUser, showToast } = useApp();
  const navigate = useNavigate();
  const isIndustryUser = currentUser?.role === 'industry';

  const [currentStep, setCurrentStep] = useState(1);
  // Moving to another step starts it at the top (the Next button is at the bottom)
  const stepperRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(stepperRef, currentStep);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Public submission: organisation dropdown + result screen
  const [industries, setIndustries] = useState<PublicIndustry[]>([]);
  const [industriesState, setIndustriesState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [orgSearch, setOrgSearch] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitted, setSubmitted] = useState<{ referenceCode: string; email: string; title: string } | null>(null);

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit: _,
    trigger,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
    getValues
  } = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgChoice: isIndustryUser ? OWN_ORG : '',
      industryName: 'Manufacturing',
      companyName: isIndustryUser ? currentUser?.companyName || '' : '',
      representativeName: isIndustryUser ? currentUser?.name || '' : '',
      designation: isIndustryUser ? currentUser?.designation || '' : '',
      email: isIndustryUser ? currentUser?.email || '' : '',
      phone: isIndustryUser ? currentUser?.phone || '' : '',
      website: '',
      industrySector: isIndustryUser ? currentUser?.industry || '' : '',
      city: '',
      state: '',
      address: '',
      difficultyLevel: 'Medium',
      budget: '',
      deadline: '',
      declarationAccepted: false
    }
  });

  const orgChoice = watch('orgChoice');
  const isOtherOrg = orgChoice === OTHER_ORG;
  const isRegisteredOrg = !!orgChoice && orgChoice !== OTHER_ORG && orgChoice !== OWN_ORG;

  // Load the registered organisations for the dropdown (public visitors only)
  useEffect(() => {
    if (isIndustryUser) return;
    let cancelled = false;
    fetchPublicIndustries()
      .then((list) => {
        if (cancelled) return;
        setIndustries(list);
        setIndustriesState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        // The form still works: the visitor can choose "Other"
        setIndustriesState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [isIndustryUser]);

  const filteredIndustries = industries.filter((org) =>
    org.companyName.toLowerCase().includes(orgSearch.trim().toLowerCase())
  );

  const handleOrgChoice = (value: string) => {
    setValue('orgChoice', value, { shouldValidate: true });
    clearErrors(['companyName', 'industrySector', 'city', 'state']);
    if (value === OTHER_ORG || value === '') {
      setValue('companyName', '');
      setValue('industrySector', '');
      setValue('website', '');
      return;
    }
    const org = industries.find((i) => i.id === value);
    if (org) {
      setValue('companyName', org.companyName, { shouldValidate: true });
      setValue('industrySector', org.industry, { shouldValidate: true });
      setValue('website', org.websiteUrl || '');
    }
  };

  const steps = [
    { number: 1, title: 'Organisation', icon: <Building2 className="h-4.5 w-4.5" /> },
    { number: 2, title: 'Problem Details', icon: <FileText className="h-4.5 w-4.5" /> },
    { number: 3, title: 'Technical Spec', icon: <Settings className="h-4.5 w-4.5" /> },
    { number: 4, title: 'Filing & Consent', icon: <ShieldAlert className="h-4.5 w-4.5" /> }
  ];

  // Extra checks for "Other" organisations (fields that are optional otherwise)
  const validateOrganisation = (): boolean => {
    if (!isOtherOrg) return true;
    const values = getValues();
    let valid = true;
    if (!values.city || values.city.trim().length < 2) {
      setError('city', { message: 'City is required' });
      valid = false;
    }
    if (!values.state || values.state.trim().length < 2) {
      setError('state', { message: 'State is required' });
      valid = false;
    }
    return valid;
  };

  // Custom step validation before going forward
  const handleNextStep = async () => {
    let fieldsToValidate: Array<keyof FormFields> = [];

    if (currentStep === 1) {
      fieldsToValidate = ['orgChoice', 'industryName', 'companyName', 'representativeName', 'designation', 'email', 'phone', 'industrySector'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['title', 'description', 'businessChallenge', 'existingProcess', 'expectedOutcome', 'projectObjectives'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['requiredTechnologiesStr', 'requiredSkillsStr', 'preferredBranchesStr', 'preferredAcademicYear', 'difficultyLevel', 'expectedDuration'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    const isOrgValid = currentStep === 1 ? validateOrganisation() : true;
    if (isStepValid && isOrgValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } else {
      showToast('Please complete the required fields in the current step.', 'error');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Pre-submit confirmation opener
  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isFormValid = await trigger();
    const isOrgValid = validateOrganisation();
    if (isFormValid && isOrgValid) {
      setIsConfirming(true);
    } else {
      showToast('Form has validation errors. Please check all steps.', 'error');
    }
  };


  // Final submission processing
  const onFormSubmit = async (data: FormFields) => {
    setIsSubmitting(true);
    try {
      let attachmentUrl: string | undefined = undefined;

      if (uploadedFile) {
        showToast('Uploading document attachment...', 'info');
        const uploadRes = isIndustryUser
          ? await uploadFile(uploadedFile, 'DOCUMENT')
          : await uploadPublicDocument(uploadedFile);
        attachmentUrl = uploadRes.url;
      }


      const submission = {
        company: {
          industryName: data.industryName,
          companyName: data.companyName,
          representativeName: data.representativeName,
          designation: data.designation,
          email: data.email,
          phone: data.phone,
          website: data.website || '',
          industrySector: data.industrySector
        },
        details: {
          title: data.title,
          description: data.description,
          businessChallenge: data.businessChallenge,
          existingProcess: data.existingProcess,
          expectedOutcome: data.expectedOutcome,
          projectObjectives: data.projectObjectives
        },
        technical: {
          requiredTechnologies: data.requiredTechnologiesStr.split(',').map((s) => s.trim()).filter(Boolean),
          requiredSkills: data.requiredSkillsStr.split(',').map((s) => s.trim()).filter(Boolean),
          preferredBranches: data.preferredBranchesStr.split(',').map((s) => s.trim()).filter(Boolean),
          preferredAcademicYear: data.preferredAcademicYear,
          difficultyLevel: data.difficultyLevel as DifficultyLevel,
          expectedDuration: data.expectedDuration
        },
        additional: {
          expectedDeliverables: data.expectedDeliverables,
          additionalNotes: data.additionalNotes?.trim() || '',
          budget: data.budget.trim(),
          deadline: data.deadline,
          fileAttachmentName: attachmentUrl,
          declarationAccepted: data.declarationAccepted
        }
      };

      if (isIndustryUser) {
        // Logged-in industry partner: goes to their own account, then to CII review
        await addSubmission(submission);
        setIsSubmitting(false);
        setIsConfirming(false);
        showToast('Problem Statement filed successfully! Status is Pending Approval.', 'success');
        navigate('/industry/dashboard');
        return;
      }

      // Public visitor: no login, CII verifies before anything is published
      const result = await submitPublicProblem({
        ...toBackendProblemFields(submission),
        industryProfileId: isRegisteredOrg ? data.orgChoice : undefined,
        organisationName: isOtherOrg ? data.companyName : undefined,
        orgSector: isOtherOrg ? data.industrySector : undefined,
        orgWebsite: isOtherOrg ? data.website || undefined : undefined,
        orgCity: data.city || undefined,
        orgState: data.state || undefined,
        orgAddress: data.address || undefined,
        contactName: data.representativeName,
        contactDesignation: data.designation,
        contactEmail: data.email,
        contactPhone: data.phone,
        companyFax: honeypot,
      });

      setIsSubmitting(false);
      setIsConfirming(false);
      setSubmitted({ referenceCode: result.referenceCode, email: data.email, title: data.title });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'An error occurred during submission. Please try again.', 'error');
    }
  };

  // File Upload Handlers
  // Only PDFs up to 10MB are accepted by the server
  const acceptFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Please attach a PDF document.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('The attachment must be 10MB or smaller.', 'error');
      return;
    }
    setUploadedFile(file);
    showToast(`Selected file: ${file.name}`, 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      acceptFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      acceptFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const allValues = getValues();

  // Shown after a successful public submission
  if (submitted) {
    return (
      <div className="bg-[#faf8f4] min-h-screen py-10 sm:py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-md p-6 sm:p-10 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#edf4f0] text-[#063028] flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#063028] font-serif">Problem statement received</h1>
              <p className="text-base text-stone-600 leading-relaxed">
                Thank you. <strong className="text-stone-800">"{submitted.title}"</strong> is now pending verification by CII officials.
                It will be published to partner institutions only after it is approved.
              </p>
            </div>

            <div className="bg-[#faf8f4] border border-stone-200 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Your reference ID</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#063028] break-all">{submitted.referenceCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(submitted.referenceCode);
                    showToast('Reference ID copied', 'success');
                  }}
                  className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-white cursor-pointer"
                  aria-label="Copy reference ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-stone-600">
                We've emailed a confirmation to <strong className="text-stone-800 break-all">{submitted.email}</strong>.
                Quote this ID if you contact CII about your submission.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/problem-statements"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a]"
              >
                Browse published problems
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-stone-700 border border-stone-300 hover:bg-stone-50"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f4] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header info */}
        <div className="mb-10 text-center space-y-3">
          <Link
            to={isIndustryUser ? '/industry/dashboard' : '/'}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-[#063028] transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> {isIndustryUser ? 'Back to Industry Partner Dashboard' : 'Back to home'}
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight font-serif">
            Submit a Problem Statement
          </h1>
          <p className="text-base text-stone-600 max-w-xl mx-auto leading-relaxed">
            Share your organisation's challenge, technical requirements and target outcomes. CII officials verify every
            submission before it is published to partner institutions.
            {!isIndustryUser && ' No login needed.'}
          </p>
        </div>

        {/* Progress Stepper Bar */}
        <div ref={stepperRef} className="mb-8 bg-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl border border-stone-200/90 shadow-xs">
          {/* Always one line: other steps shrink to icons on small screens */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#063028] uppercase tracking-wider whitespace-nowrap shrink-0">
              Step {currentStep} of 4
            </span>
            <div className="flex items-center flex-nowrap min-w-0">
              {steps.map((st) => (
                <div key={st.number} className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      if (st.number < currentStep) {
                        setCurrentStep(st.number);
                      } else if (st.number > currentStep) {
                        handleNextStep();
                      }
                    }}
                    title={st.title}
                    aria-current={currentStep === st.number ? 'step' : undefined}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      currentStep === st.number
                        ? 'bg-[#063028] text-white shadow-sm'
                        : st.number < currentStep
                        ? 'bg-[#edf4f0] text-[#063028] border border-[#063028]/20'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {st.number < currentStep ? <Check className="h-4 w-4 shrink-0" /> : st.icon}
                    <span className={currentStep === st.number ? 'hidden sm:inline' : 'hidden lg:inline'}>{st.title}</span>
                  </button>
                  {st.number < 4 && <ChevronRight className="h-3.5 w-3.5 text-stone-300 mx-0.5 sm:mx-1 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Multi-Step Form Wrapper */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-md p-6 sm:p-10">
          <form onSubmit={handlePreSubmit} className="space-y-8">
            
            {/* STEP 1: ORGANISATION & CONTACT */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#063028] font-serif flex items-center gap-2.5">
                    <Building2 className="h-6 w-6 text-[#c48825]" /> Organisation &amp; Contact Details
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">CII uses these details to verify the submission and to contact you.</p>
                </div>

                {/* Spam trap: hidden from people, filled in only by bots */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="companyFax">Company fax</label>
                  <input
                    id="companyFax"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Organisation */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">Organisation</h3>

                  {isIndustryUser ? (
                    <div className="p-4 rounded-xl bg-[#edf4f0] border border-[#063028]/15 text-sm text-[#063028]">
                      Submitting as <strong>{currentUser?.companyName || 'your registered organisation'}</strong>.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor="orgChoice" className="block text-sm font-bold text-stone-700">
                        Select your organisation <span className="text-red-500">*</span>
                      </label>
                      {industries.length > 8 && (
                        <input
                          type="search"
                          value={orgSearch}
                          onChange={(e) => setOrgSearch(e.target.value)}
                          placeholder="Search registered organisations..."
                          className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white"
                        />
                      )}
                      <select
                        id="orgChoice"
                        value={orgChoice}
                        onChange={(e) => handleOrgChoice(e.target.value)}
                        className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white cursor-pointer"
                      >
                        <option value="">
                          {industriesState === 'loading' ? 'Loading organisations...' : '— Choose an organisation —'}
                        </option>
                        {filteredIndustries.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.companyName}{org.industry ? ` (${org.industry})` : ''}
                          </option>
                        ))}
                        <option value={OTHER_ORG}>Other — my organisation is not listed</option>
                      </select>
                      <p className="text-xs text-stone-500">
                        {industriesState === 'error'
                          ? 'We could not load the list of registered organisations. Choose "Other" to continue.'
                          : 'Registered CII industry partners are listed. Not listed? Choose "Other" and enter your organisation\'s details.'}
                      </p>
                      {errors.orgChoice && <p className="text-sm text-red-600 mt-1">{errors.orgChoice.message}</p>}
                    </div>
                  )}

                  {isRegisteredOrg && (
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-700 space-y-1">
                      <p><strong className="text-stone-900">{allValues.companyName}</strong></p>
                      {allValues.industrySector && <p>Sector: {allValues.industrySector}</p>}
                      {allValues.website && <p className="break-all">Website: {allValues.website}</p>}
                    </div>
                  )}

                  {(isOtherOrg || isIndustryUser) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-stone-700">
                          Organisation name <span className="text-red-500">*</span>
                        </label>
                        <input type="text" {...register('companyName')} readOnly={isIndustryUser} className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white read-only:bg-stone-100" />
                        {errors.companyName && <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-stone-700">
                          Industry sector <span className="text-red-500">*</span>
                        </label>
                        <input type="text" {...register('industrySector')} placeholder="e.g. Automotive Engineering" className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                        {errors.industrySector && <p className="text-sm text-red-600 mt-1">{errors.industrySector.message}</p>}
                      </div>

                      {isOtherOrg && (
                        <>
                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-stone-700">
                              City <span className="text-red-500">*</span>
                            </label>
                            <input type="text" {...register('city')} placeholder="e.g. Bhopal" className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                            {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-stone-700">
                              State <span className="text-red-500">*</span>
                            </label>
                            <input type="text" {...register('state')} placeholder="e.g. Madhya Pradesh" className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                            {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>}
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <label className="block text-sm font-bold text-stone-700">Address (optional)</label>
                            <input type="text" {...register('address')} placeholder="Office or plant address" className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                          </div>

                          <div className="space-y-2 sm:col-span-2">
                            <label className="block text-sm font-bold text-stone-700">Website (optional)</label>
                            <input type="text" {...register('website')} placeholder="https://www.example.com" className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 sm:max-w-sm">
                    <label className="block text-sm font-bold text-stone-700">Industry category</label>
                    <select {...register('industryName')} className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white cursor-pointer">
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Pharmaceuticals">Pharmaceuticals</option>
                      <option value="Energy & Power">Energy & Power</option>
                      <option value="Telecommunications">Telecommunications</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>
                    {errors.industryName && <p className="text-sm text-red-600 mt-1">{errors.industryName.message}</p>}
                  </div>
                </div>

                {/* Contact person */}
                <div className="space-y-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                    <UserRound className="h-4 w-4" /> Your contact details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">
                        Full name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" autoComplete="name" {...register('representativeName')} className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                      {errors.representativeName && <p className="text-sm text-red-600 mt-1">{errors.representativeName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">
                        Designation <span className="text-red-500">*</span>
                      </label>
                      <input type="text" autoComplete="organization-title" {...register('designation')} className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                      {errors.designation && <p className="text-sm text-red-600 mt-1">{errors.designation.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">
                        Official email <span className="text-red-500">*</span>
                      </label>
                      <input type="email" autoComplete="email" {...register('email')} className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                      {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                      {isRegisteredOrg && (
                        <p className="text-xs text-stone-500">Use your work email — CII checks it against the selected organisation.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">
                        Phone number <span className="text-red-500">*</span>
                      </label>
                      <input type="tel" autoComplete="tel" {...register('phone')} placeholder="+91 98765 43210" className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white" />
                      {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PROBLEM DETAILS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#063028] font-serif flex items-center gap-2.5">
                    <FileText className="h-6 w-6 text-[#c48825]" /> Problem Description Details
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">Detail your operating challenge so researchers can synthesize precise solutions.</p>
                </div>

                <div className="space-y-5">
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Problem Statement Title</label>
                    <input
                      type="text"
                      {...register('title')}
                      placeholder="e.g., Automated Bio-Reactor Foam Anomaly Control"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white"
                    />
                    {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Problem Statement Description</label>
                    <textarea
                      rows={4}
                      {...register('description')}
                      placeholder="Describe the overall scope, operational environment, and physical parameters."
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                    ></textarea>
                    {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Current Business Challenge</label>
                    <textarea
                      rows={3}
                      {...register('businessChallenge')}
                      placeholder="What is the active operational, financial, or developmental bottleneck?"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                    ></textarea>
                    {errors.businessChallenge && <p className="text-sm text-red-600 mt-1">{errors.businessChallenge.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">Existing Process / Workarounds</label>
                      <textarea
                        rows={3}
                        {...register('existingProcess')}
                        placeholder="How is this handled currently?"
                        className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                      ></textarea>
                      {errors.existingProcess && <p className="text-sm text-red-600 mt-1">{errors.existingProcess.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">Expected Outcomes</label>
                      <textarea
                        rows={3}
                        {...register('expectedOutcome')}
                        placeholder="What metrics or physical benchmarks must the solution satisfy?"
                        className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                      ></textarea>
                      {errors.expectedOutcome && <p className="text-sm text-red-600 mt-1">{errors.expectedOutcome.message}</p>}
                    </div>

                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Project Objectives</label>
                    <textarea
                      rows={2}
                      {...register('projectObjectives')}
                      placeholder="List specific milestones (e.g. 1. Conduct vibration analysis, 2. Build cloud monitoring dashboard)"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                    ></textarea>
                    {errors.projectObjectives && <p className="text-sm text-red-600 mt-1">{errors.projectObjectives.message}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: TECHNICAL SPECIFICATIONS */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#063028] font-serif flex items-center gap-2.5">
                    <Settings className="h-6 w-6 text-[#c48825]" /> Technical Specifications &amp; Requirements
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">Define student branches, difficulty benchmarks, and expected technology stacks.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="block text-sm font-bold text-stone-700">Required Technologies</label>
                    <input
                      type="text"
                      {...register('requiredTechnologiesStr')}
                      placeholder="e.g. Python, TensorFlow, React, Docker, MQTT (Comma separated)"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white"
                    />
                    {errors.requiredTechnologiesStr && <p className="text-sm text-red-600 mt-1">{errors.requiredTechnologiesStr.message}</p>}
                  </div>

                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="block text-sm font-bold text-stone-700">Required Skills &amp; Domain Expertise</label>
                    <input
                      type="text"
                      {...register('requiredSkillsStr')}
                      placeholder="e.g. Signal Processing, Deep Learning, Embedded IoT, Microservices (Comma separated)"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white"
                    />
                    {errors.requiredSkillsStr && <p className="text-sm text-red-600 mt-1">{errors.requiredSkillsStr.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Preferred Academic Disciplines / Branches</label>
                    <input
                      type="text"
                      {...register('preferredBranchesStr')}
                      placeholder="e.g. Mechanical, Computer Science, Electronics (Comma separated)"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white"
                    />
                    {errors.preferredBranchesStr && <p className="text-sm text-red-600 mt-1">{errors.preferredBranchesStr.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Preferred Student Academic Year</label>
                    <select
                      {...register('preferredAcademicYear')}
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white cursor-pointer"
                    >
                      <option value="Final Year UG">Final Year UG (Undergraduate)</option>
                      <option value="Pre-final / Final Year UG">Pre-final / Final Year UG</option>
                      <option value="Postgraduate (PG) / M.Tech">Postgraduate (PG) / M.Tech</option>
                      <option value="PhD Scholars / Researchers">PhD Scholars / Researchers</option>
                      <option value="All Academic Tiers Eligible">All Academic Tiers Eligible</option>
                    </select>
                    {errors.preferredAcademicYear && <p className="text-sm text-red-600 mt-1">{errors.preferredAcademicYear.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Difficulty Classification Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Easy', 'Medium', 'Hard'].map((lvl) => (
                        <label
                          key={lvl}
                          className="flex items-center justify-center p-3.5 rounded-xl border border-stone-300 bg-white cursor-pointer text-sm font-bold text-[#063028] hover:bg-stone-50 focus-within:border-[#063028] select-none text-center"
                        >
                          <input
                            type="radio"
                            value={lvl}
                            {...register('difficultyLevel')}
                            className="sr-only"
                          />
                          <span>{lvl}</span>
                        </label>
                      ))}
                    </div>
                    {errors.difficultyLevel && <p className="text-sm text-red-600 mt-1">{errors.difficultyLevel.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Expected Duration of Project</label>
                    <input
                      type="text"
                      {...register('expectedDuration')}
                      placeholder="e.g. 6 Months"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white"
                    />
                    {errors.expectedDuration && <p className="text-sm text-red-600 mt-1">{errors.expectedDuration.message}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: ADDITIONAL DETAILS & FILING */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-stone-200 pb-4">
                  <h2 className="text-xl font-bold text-[#063028] font-serif flex items-center gap-2.5">
                    <ShieldAlert className="h-6 w-6 text-[#c48825]" /> Deliverables &amp; Legal Declaration
                  </h2>
                  <p className="text-sm text-stone-600 mt-1">Provide final deliverables outline and accept platform terms.</p>
                </div>

                <div className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Expected Deliverables</label>
                    <textarea
                      rows={3}
                      {...register('expectedDeliverables')}
                      placeholder="What tangible output must be provided? (e.g. Working code repository, operational hardware prototype, engineering design schematic)"
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                    ></textarea>
                    {errors.expectedDeliverables && <p className="text-sm text-red-600 mt-1">{errors.expectedDeliverables.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Budget */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">Budget / Funding Offered <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        {...register('budget')}
                        placeholder="e.g. Rs 5,00,000"
                        className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white font-medium"
                      />
                      {errors.budget && <p className="text-sm text-red-600 mt-1">{errors.budget.message}</p>}
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-stone-700">Expected Solution Deadline <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        {...register('deadline')}
                        className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white font-medium cursor-pointer"
                      />
                      {errors.deadline && <p className="text-sm text-red-600 mt-1">{errors.deadline.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Additional Notes (Optional)</label>
                    <textarea
                      rows={2}
                      {...register('additionalNotes')}
                      placeholder="Any supplementary timelines or operational requests."
                      className="block w-full px-4 py-3 border border-stone-300 rounded-xl text-base text-stone-900 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 bg-white resize-y leading-relaxed"
                    ></textarea>
                  </div>

                  {/* File Upload Component */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-stone-700">Supporting Data Sheet / Attachment</label>
                    
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        dragOver 
                          ? 'border-[#063028] bg-[#edf4f0]' 
                          : uploadedFile 
                          ? 'border-emerald-400 bg-emerald-50/50' 
                          : 'border-stone-300 bg-stone-50/60 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,application/pdf"
                      />

                      {uploadedFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-emerald-100 rounded-full text-emerald-700">
                            <Check className="h-6 w-6 font-bold" />
                          </div>
                          <p className="text-base font-bold text-stone-900">{uploadedFile.name}</p>
                          <p className="text-sm text-stone-500 font-mono">({uploadedFile.size < 1024 * 1024 ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : `${(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB`})</p>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="mt-2 text-sm font-bold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <X className="h-4 w-4" /> Remove File
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                          <UploadCloud className="h-10 w-10 text-stone-400" />
                          <div>
                            <span className="text-base font-bold text-[#c48825] hover:text-[#a6711c] underline">Click to upload</span>
                            <span className="text-base text-stone-600"> or drag and drop</span>
                          </div>
                          <p className="text-xs text-stone-500">PDF only (Max 10MB)</p>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Declaration Checkbox */}
                  <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="declarationAccepted"
                        {...register('declarationAccepted')}
                        className="h-5 w-5 mt-0.5 text-[#063028] border-stone-300 rounded focus:ring-[#063028] cursor-pointer"
                      />
                      <label htmlFor="declarationAccepted" className="text-sm text-stone-700 leading-relaxed cursor-pointer select-none font-medium">
                        <strong className="text-stone-900">CII Official Declaration:</strong> By submitting this problem statement, the company representative certifies that the challenge is an active operational topic. The company agrees to facilitate review updates, engage with student research cohorts where appropriate, and ensure compliance with the CII Industry-Institute Collaboration Platform framework terms.
                      </label>
                    </div>
                    {errors.declarationAccepted && <p className="text-sm text-red-600">{errors.declarationAccepted.message}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* Stepper Buttons Panel */}
            <div className="border-t border-stone-200 pt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-2 px-5 py-3 border border-stone-300 rounded-xl text-sm font-bold text-stone-700 hover:bg-stone-50 transition-all ${
                  currentStep === 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ArrowLeft className="h-4 w-4" /> Previous Step
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all cursor-pointer shadow-sm"
                >
                  Next Step <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="h-5 w-5 text-[#c48825]" /> Complete Submission
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Confirmation Dialog Backdrop & Modal */}
        {isConfirming && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-8 shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
              
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-14 w-14 rounded-full bg-[#edf4f0] text-[#063028] flex items-center justify-center">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#063028] font-serif">Review Statement Filing</h3>
                  <p className="text-sm text-stone-600">Confirm the parameters of your operational problem proposal below.</p>
                </div>

                {/* Review block */}
                <div className="bg-[#faf8f4] p-6 rounded-2xl border border-stone-200 space-y-4 text-sm">
                  
                  <div>
                    <h4 className="text-xs font-bold uppercase text-[#c48825] tracking-wider">Title of Proposal</h4>
                    <p className="font-bold text-base text-[#063028] mt-1">{allValues.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Filing Organization</h4>
                      <p className="font-semibold text-stone-800 mt-1">{allValues.companyName}</p>
                      <p className="text-xs text-stone-500 mt-0.5 break-all">{allValues.representativeName} • {allValues.email}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Industry sector</h4>
                      <p className="font-semibold text-stone-800 mt-1">{allValues.industrySector}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Difficulty Level</h4>
                      <p className="font-semibold text-stone-800 mt-1">{allValues.difficultyLevel}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Academic Level</h4>
                      <p className="font-semibold text-stone-800 mt-1 truncate">{allValues.preferredAcademicYear}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Duration</h4>
                      <p className="font-semibold text-stone-800 mt-1">{allValues.expectedDuration}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">Technologies Requested</h4>
                    <p className="font-semibold text-stone-800 mt-1">{allValues.requiredTechnologiesStr}</p>
                  </div>

                  {uploadedFile && (
                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                      <span className="font-bold text-emerald-800">Attachment: {uploadedFile.name}</span>
                      <span className="font-mono text-xs text-emerald-700">File attached</span>
                    </div>
                  )}

                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsConfirming(false)}
                    className="flex-1 px-5 py-3.5 border border-stone-300 rounded-xl text-sm font-bold text-stone-700 bg-white hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    Edit Information
                  </button>
                  <button
                    type="button"
                    onClick={() => onFormSubmit(allValues)}
                    disabled={isSubmitting}
                    className="flex-1 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all disabled:opacity-50 flex justify-center items-center cursor-pointer shadow-md"
                  >
                    {isSubmitting ? 'Submitting...' : 'Yes, submit for CII review'}
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
