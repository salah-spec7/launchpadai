/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentProfile, Job, RecruiterProfile, Match, Meeting } from '../types';

export const PRESET_STUDENTS: StudentProfile[] = [
  {
    id: 'student-alex-chen',
    email: 'alexchen@stanford.edu',
    fullName: 'Alex Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    headline: 'AI Integration Dev & Full-Stack Enthusiast @ Stanford',
    location: 'Stanford, CA',
    university: 'Stanford University',
    major: 'Computer Science',
    graduationYear: 2026,
    gpa: '3.91',
    skills: ['TypeScript', 'React', 'Node.js', 'Next.js', 'Python', 'PyTorch', 'Tailwind CSS', 'Docker'],
    githubUrl: 'github.com/alexchen-dev',
    linkedinUrl: 'linkedin.com/in/alex-chen-dev',
    portfolioUrl: 'alexchen.io',
    aiSummary: 'CS Senior at Stanford with deep specialization in web interfaces and microservice orchestration. Built an open-source vector search orchestrator with over 400 GitHub stars. Active developer and open-source contributor.',
    githubStats: {
      publicRepos: 32,
      followers: 128,
      stars: 489,
      languages: { 'TypeScript': 45, 'Python': 35, 'Rust': 12, 'CSS': 8 }
    },
    personalityTags: ['Fast Learner', 'Open-Source Contributor', 'Team Leader', 'Hackathon Champ']
  },
  {
    id: 'student-priya-patel',
    email: 'priya.patel@berkeley.edu',
    fullName: 'Priya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    headline: 'Backend Infrastructure Intern & Cloud Specialist',
    location: 'Berkeley, CA',
    university: 'UC Berkeley',
    major: 'Electrical Engineering & Computer Science',
    graduationYear: 2026,
    gpa: '3.85',
    skills: ['Go', 'Kubernetes', 'Docker', 'PostgreSQL', 'Redis', 'AWS', 'GraphQL', 'gRPC'],
    githubUrl: 'github.com/priyapatel-codes',
    linkedinUrl: 'linkedin.com/in/priyapatel-backend',
    portfolioUrl: 'priyacodes.dev',
    aiSummary: 'EECS student at Berkeley passionate about distributed systems and highly scalable ledger APIs. Contributed patches to Kubernetes core and created a lightweight custom container runner as an academic project.',
    githubStats: {
      publicRepos: 24,
      followers: 95,
      stars: 182,
      languages: { 'Go': 60, 'Python': 20, 'Shell': 15, 'C++': 5 }
    },
    personalityTags: ['Distributed Systems fan', 'Core Contributor', 'Analytical Mind', 'Self Starter']
  },
  {
    id: 'student-marcus-vance',
    email: 'mvance@gatech.edu',
    fullName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    headline: 'Creative Frontend Engineer & UX Devotee',
    location: 'Atlanta, GA',
    university: 'Georgia Institute of Technology',
    major: 'Computational Media',
    graduationYear: 2026,
    gpa: '3.72',
    skills: ['JavaScript', 'React', 'CSS/Sass', 'Framer Motion', 'Tailwind', 'Figma', 'UI/UX Proto', 'Jest'],
    githubUrl: 'github.com/marcusv-ux',
    linkedinUrl: 'linkedin.com/in/marcus-vance-design',
    portfolioUrl: 'marcuscreative.design',
    aiSummary: 'Frontend designer-developer with a track record of crafting fluid user interfaces. Won GT Fall Hackathon for building an intuitive web system aiding neurodiverse high school students mapping schedule pathways.',
    githubStats: {
      publicRepos: 18,
      followers: 72,
      stars: 92,
      languages: { 'JavaScript': 55, 'CSS': 30, 'HTML': 15 }
    },
    personalityTags: ['Design Thinker', 'Accessibility Advocate', 'Detail Oriented', 'Collaborator']
  },
  {
    id: 'student-lucas-diaz',
    email: 'ldiaz@mit.edu',
    fullName: 'Lucas Diaz',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    headline: 'Systems Dev & Rust Aficionado @ MIT',
    location: 'Boston, MA',
    university: 'Massachusetts Institute of Technology',
    major: 'Computer Science & Engineering',
    graduationYear: 2027,
    gpa: '4.00',
    skills: ['Rust', 'C', 'Assembly', 'Linux Kernel', 'Docker', 'WebAssembly', 'TypeScript'],
    githubUrl: 'github.com/lucasdiaz-rust',
    aiSummary: 'Sophomore CS major with double-honors focusing on performance optimization. Author of a high-concurrency event loop in pure Rust benchmarked 40% faster than standard runtime variants. Enjoys diving into compiler files.',
    githubStats: {
      publicRepos: 14,
      followers: 160,
      stars: 312,
      languages: { 'Rust': 75, 'C': 15, 'Assembly': 8, 'TypeScript': 2 }
    },
    personalityTags: ['System Geek', 'Performance Optimizer', 'High Tech', 'Humble Solver']
  }
];

export const PRESET_RECRUITERS: RecruiterProfile[] = [
  {
    id: 'recruiter-sarah-j',
    email: 'sarah.jenkins@stripe.com',
    fullName: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    headline: 'Senior Tech Recruiter @ Stripe University Relations',
    companyName: 'Stripe',
    companySize: '5,000 - 10,000',
    location: 'San Francisco, CA'
  },
  {
    id: 'recruiter-dave-k',
    email: 'dave.kim@vercel.com',
    fullName: 'Dave Kim',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    headline: 'Director of Engineering, Core React Frameworks @ Vercel',
    companyName: 'Vercel',
    companySize: '500 - 1,000',
    location: 'Remote'
  }
];

export const PRESET_JOBS: Job[] = [
  {
    id: 'job-stripe-frontend',
    recruiterId: 'recruiter-sarah-j',
    title: 'Frontend Engineering Intern (University Partnerships)',
    companyName: 'Stripe',
    companyLogoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=80&auto=format&fit=crop&q=80',
    jobType: 'Internship',
    location: 'San Francisco, CA (Hybrid)',
    isRemote: false,
    salaryMin: 90000,
    salaryMax: 120000,
    description: 'We are seeking an active CS student with a true affinity for building polished visual components. You will work side-by-side with our SDK core engineers refining user dashboards, dealing directly with responsive layouts, and integrating high-performance chart metrics.',
    requirements: [
      'Enrolled in BS/MS Computer Science or related engineering degree',
      'Solid experience coding in TypeScript and React framework',
      'True design sense, understands viewport constraints and fluid layouts',
      'Demonstrated project portfolios with robust GitHub interactions'
    ],
    requiredSkills: ['TypeScript', 'React', 'CSS/Sass', 'Tailwind', 'Jest'],
    compatibilityTags: ['Fast-paced', 'Design-obsessed', 'Fintech innovator']
  },
  {
    id: 'job-vercel-fullstack',
    recruiterId: 'recruiter-dave-k',
    title: 'Developer Advocate & Next.js Fullstack Intern',
    companyName: 'Vercel',
    companyLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80',
    jobType: 'Internship',
    location: 'Remote (Global)',
    isRemote: true,
    salaryMin: 100000,
    salaryMax: 130000,
    description: 'Help Vercel developer ecosystems thrive! You will construct interactive tutorial sandboxes, write high-quality open-source template portfolios, and stress-test the limits of edge middleware, dynamic routing, and server components.',
    requirements: [
      'Passionate about teaching through software, active blogger or open-source publisher',
      'Deep expertise using modern React features (hooks, context, Suspense)',
      'Familiar with serverless environment execution and system routing mechanics',
      'Active content showcase (GitHub projects, public tech blogs)'
    ],
    requiredSkills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Framer Motion'],
    compatibilityTags: ['Creator/Educator', 'Remote Core', 'UI Innovations']
  },
  {
    id: 'job-stripe-backend',
    recruiterId: 'recruiter-sarah-j',
    title: 'Distributed Infrastructure Systems Intern',
    companyName: 'Stripe',
    companyLogoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=80&auto=format&fit=crop&q=80',
    jobType: 'Internship',
    location: 'San Francisco, CA',
    isRemote: false,
    salaryMin: 95000,
    salaryMax: 125000,
    description: 'Help Stripe handle trillions of payment events. As an infrastructure intern, you will contribute directly to microservice connectivity layers written in Go and Ruby, monitoring distributed pipeline throughputs and optimizing database connections.',
    requirements: [
      'Background in systems engineering, low-level scheduling, or distributed protocols',
      'Excellent backend scripting using Go, Python, or Ruby',
      'Familiarity with container concepts, Unix socket structures, and Docker engines'
    ],
    requiredSkills: ['Go', 'Docker', 'PostgreSQL', 'AWS', 'Redis'],
    compatibilityTags: ['Distributed Systems', 'Data Intensive', 'Scale Enabler']
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-alex-stripe',
    jobId: 'job-stripe-frontend',
    studentId: 'student-alex-chen',
    recruiterId: 'recruiter-sarah-j',
    matchScore: 92,
    matchReasons: [
      'Overwhelming synergy with core React & TypeScript requirements',
      'Alex resides close to the San Francisco core (Stanford)',
      'Exceptional GitHub signal with real public portfolio traction'
    ],
    vettingStatus: 'passed',
    vettingReport: {
      overallVerdict: 'passed',
      technicalFit: 'high',
      compatibilityScore: 92,
      strengths: [
        'Built full vector database pipeline indicating high server competency',
        'Has 400+ stars on GitHub project indicating popular and quality code output',
        'Excellent understanding of React performance metrics in university track'
      ],
      gaps: [
        'Limited corporate internship experience, but compensated by independent projects'
      ],
      interviewFocus: [
        'Deep dive into his open-source orchestrator framework design',
        'Practical coding session regarding high-volume stream render configurations'
      ],
      talkingPoints: [
        'Ask about his project scalable index mechanics',
        'Confirm graduation timeline and availability limits for full-time conversion'
      ],
      recommendation: 'Highly recommended for immediate technical scheduling cycle. Candidate stands out in university channels.'
    },
    matchedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
    meetingScheduled: true
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-alex-stripe-event',
    matchId: 'match-alex-stripe',
    studentId: 'student-alex-chen',
    recruiterId: 'recruiter-sarah-j',
    googleMeetLink: 'https://meet.google.com/tsr-vckj-mnz',
    scheduledAt: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow/24h from now
    durationMinutes: 30,
    status: 'scheduled',
    agenda: 'Kickoff technical introduction and project review session.',
    studentNotes: 'Prepare diagram explanations for the vector search project.',
    recruiterNotes: 'Vetting highlights React capability: ask about custom hooks design.'
  }
];
