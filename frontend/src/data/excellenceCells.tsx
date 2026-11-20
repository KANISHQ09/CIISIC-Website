import React from 'react';
import { Cpu, Brain, Layers, GraduationCap, Globe, Lightbulb, Users } from 'lucide-react';

/** The 7 CII Industry–Academia Excellence Cells, shown on the Ecosystem page and the home page. */
export interface ExcellenceCellData {
  id: string;
  name: string;
  partner: string;
  image: string;
  brief: string;
  details: string;
  icon: React.ReactNode;
  extended?: {
    vision?: string;
    whoThisIsFor?: string[];
    problemsWeHelpSolve?: string[];
    howWeWorkTogether?: {
      flow: string;
      description: string;
    };
    whatYouWalkAwayWith?: string[];
    whyPartnerTitle?: string;
    whyPartner?: string[];
    structuredOfferings?: {
      icon: string;
      title: string;
      description: string;
    }[];
    offerings?: string[];
  };
}

export const EXCELLENCE_CELLS: ExcellenceCellData[] = [
  {
    id: 'family-business',
    name: "Family Business & Entrepreneurship",
    partner: "Jagran Lakecity University",
    image: "/images/1_family_business.jpg",
    brief: "Building sustainable family enterprises through governance, entrepreneurship, and next-generation leadership.",
    details: "The Family Business & Entrepreneurship Cell supports family-owned enterprises and aspiring entrepreneurs through structured guidance, industry engagement, and practical learning. It focuses on strengthening business continuity, encouraging innovation, promoting networking opportunities, and developing next-generation leadership for sustainable growth.",
    icon: <Users className="h-5 w-5 text-blue-650" />
  },
  {
    id: 'talent-readiness',
    name: "Talent Readiness & Employability",
    partner: "Lakshmi Narain College of Technology",
    image: "/images/2_talent_readiness.jpg",
    brief: "Preparing students with industry exposure, career readiness, mentoring, and employability skills.",
    details: "The Talent Readiness & Employability Cell prepares students for successful careers by enhancing professional skills and industry exposure. The cell emphasizes career readiness, placement preparation, employability enhancement, and mentorship to bridge the gap between academia and industry.",
    icon: <GraduationCap className="h-5 w-5 text-indigo-650" />
  },
  {
    id: 'research-innovation',
    name: "Research & Innovation",
    partner: "LNCT University",
    image: "/images/3_research_innovation.jpg",
    brief: "Promoting applied research, innovation, technology development, and industry collaboration.",
    details: "The Research & Innovation Cell promotes applied research and technology-driven innovation to solve real-world challenges. It encourages industry collaboration, supports innovation laboratories, facilitates intellectual property development, and nurtures startup-oriented research initiatives.",
    icon: <Lightbulb className="h-5 w-5 text-amber-600" />
  },
  {
    id: 'ai-in-business',
    name: "AI in Business Excellence Cell",
    partner: "Oriental Group of Institutes (OGI)",
    image: "/images/4_ai_in_business.jpg",
    brief: "Helping organizations adopt Artificial Intelligence through practical use cases, analytics, automation, and AI-driven business transformation.",
    details: "The AI in Business Excellence Cell, run by Oriental Group of Institutes in collaboration with the CII Industry Academia Excellence Cell, exists to give organizations a dependable starting point for AI adoption, one built on evidence and experimentation rather than sales pitches. We help companies figure out where AI genuinely fits, test it before committing real budget, and build the internal skills needed to sustain it once the pilot is over.",
    icon: <Brain className="h-5 w-5 text-purple-600" />,
    extended: {
      vision: "To close the gap between real industry problems and what AI can practically solve, through hands-on innovation, honest research collaboration, and talent that's genuinely ready for the workplace.",
      whoThisIsFor: [
        "Startups and early-stage ventures exploring their first AI use case",
        "MSMEs looking for affordable, low-risk ways to automate or analyze",
        "Corporates validating AI investments before scaling",
        "Educational institutions building AI programs or research partnerships",
        "Government bodies and industry associations exploring digital transformation"
      ],
      problemsWeHelpSolve: [
        "Manual, repetitive processes eating up team time",
        "Large volumes of documents or unstructured data with no easy way to use them",
        "Customer support that doesn't scale",
        "Reporting and decision-making that relies on gut feel over data",
        "Forecasting, demand planning, and business intelligence gaps",
        "Uncertainty about where to even start with AI"
      ],
      howWeWorkTogether: {
        flow: "Discover → Assess → Prototype → Validate → Deploy → Scale",
        description: "We start by understanding your actual problem, assess where AI can realistically help, build a working prototype, test it against your data, support deployment, and help you scale what works. No step is skipped, and nothing gets built before it's been validated."
      },
      whatYouWalkAwayWith: [
        "An AI opportunity report specific to your business",
        "A practical, sequenced AI adoption roadmap",
        "A working proof-of-concept, not just a slide deck",
        "A tested prototype ready for real use",
        "Hands-on training for your team",
        "Ongoing access to student and faculty collaboration",
        "Research support and, where needed, deployment help"
      ],
      whyPartnerTitle: "Why an Academic AI Partner",
      whyPartner: [
        "Trusted academic partner for AI transformation",
        "Vendor-neutral guidance and expert consultation",
        "Collaborative innovation through faculty and student expertise",
        "Low-risk experimentation with AI solutions",
        "Access to future-ready talent and research capabilities",
        "Strong Industry–Academia collaboration through CII"
      ],
      structuredOfferings: [
        {
          icon: "🎓",
          title: "AI Education & Capability Building",
          description: "From foundational AI/ML and Generative AI workshops to prompt engineering training and hands-on bootcamps, we help faculty, students, and working professionals build real skills, not just certificates. This includes Faculty Development Programs and AI awareness sessions for leadership teams who need the big picture before making decisions."
        },
        {
          icon: "🛠️",
          title: "AI Projects & Prototyping",
          description: "We build working AI systems, not just proposals, including proof-of-concepts, computer vision solutions, NLP tools, recommendation engines, predictive models, and dashboards, often through live student-industry projects that give both sides something real to show for it."
        },
        {
          icon: "🤖",
          title: "Generative AI & Automation",
          description: "This is where a lot of near-term value sits: chatbots, RAG-based knowledge assistants, AI agents, document Q&A systems, and workflow automation that takes repetitive work off your team's plate, whether that's customer support, internal knowledge lookup, or content generation."
        },
        {
          icon: "📊",
          title: "Data & Business Intelligence",
          description: "We turn scattered data into decisions through business analytics, forecasting, decision-intelligence dashboards, and process-improvement work grounded in what your numbers are actually telling you."
        },
        {
          icon: "🏢",
          title: "AI Transformation for Organizations",
          description: "Before recommending any tool, we assess readiness, identify realistic use cases, and build a vendor-neutral adoption roadmap, including responsible AI guidance, so growth doesn't outpace governance."
        },
        {
          icon: "🔬",
          title: "Research & Innovation",
          description: "Applied AI research, hackathons, innovation challenges, and faculty-student collaboration aimed at solving real problems, with support extended to startups building their own AI-driven products."
        },
        {
          icon: "👨‍💻",
          title: "Talent & Industry Connect",
          description: "Internships, mentorships, industry expert sessions, and placement-oriented training that connect capable students directly with the organizations that need them, plus project showcases that double as a live talent pipeline."
        }
      ]
    }
  },
  {
    id: 'agritech',
    name: "AgriTech",
    partner: "Rabindranath Tagore University",
    image: "/images/5_agritech.jpeg",
    brief: "Advancing agriculture through digital technologies, sustainability, and smart farming innovation.",
    details: "The AgriTech Cell promotes innovation in agriculture by integrating modern technologies with sustainable farming practices. It supports agricultural research, digital solutions, climate-smart agriculture, and startup initiatives that contribute to the growth of the agri ecosystem.",
    icon: <Globe className="h-5 w-5 text-emerald-650" />
  },
  {
    id: 'skill-development',
    name: "Skill Development",
    partner: "Scope Global Skills University",
    image: "/images/6_skill_development.jpeg",
    brief: "Empowering learners with industry-aligned training, certifications, and lifelong learning opportunities.",
    details: "The Skill Development Cell equips learners with industry-relevant knowledge and practical experience to improve career readiness. The cell focuses on hands-on training, skill certification, lifelong learning, and continuous professional development aligned with industry requirements.",
    icon: <Layers className="h-5 w-5 text-sky-600" />
  },
  {
    id: 'startup-cell',
    name: "Startup Cell",
    partner: "Rabindranath Tagore University",
    image: "/images/7_startup.jpeg",
    brief: "Supporting entrepreneurship through mentorship, incubation, funding opportunities, and startup growth.",
    details: "The Startup Cell empowers innovators by supporting the complete entrepreneurial journey from idea to venture creation. It provides guidance in ideation, mentorship, investor connections, and startup growth through collaboration with industry and academic experts.",
    icon: <Cpu className="h-5 w-5 text-rose-650" />
  }
];
