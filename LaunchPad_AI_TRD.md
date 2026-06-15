# Technical Requirement Document (TRD)
## Project Name: LaunchPad AI
**A "Tinder-for-Jobs" Swipeable Matching Engine with Instant AI Vetting & Automated Meeting Dispatch**

---

## 1. Executive Summary & Vision

### 1.1 Project Vision
**LaunchPad AI** is a mobile-first, desktop-optimized full-stack platform designed specifically for college students, freshers, and tech recruiters. Traditional job boards feature cumbersome application tracking systems (ATS), endless form-filling, and delayed email-tag back-and-forths. LaunchPad AI turns recruiting into a seamless flow:
* **For Students:** Swipe through highly visual, condensed Job Cards. Profile details are automatically hydrated from interactive scraping/parsing of developer signals (GitHub repositories, LinkedIn export metadata).
* **For Recruiters:** Swipe through structured, curated Candidate Cards displaying core stack metrics, side projects, and clean, standardized telemetry.
* **The Match Hook:** Once a mutual swipe (Match) occurs, instead of manual outreach, a background **AI Vetting Agent** parses both profiles, creates a tailored structured review, interfaces with the recruiter's Google Workspace, and triggers an autonomous Google Meet execution link dispatched directly to both calendars.

### 1.2 System Topology & Interaction Flow
```
[Student Applet]                   [Recruiter Applet]
       │                                   │
       ├────────── Swipe Right ────────────┤
       │                                   │
       ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│                 Match Event Engine                  │
│       - Validates mutual right-swipe affinity       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼ (Triggers Agentic Pipeline)
┌─────────────────────────────────────────────────────┐
│                 Antigravity Agent                   │
│   - Fetches & Hydrates profiles (GitHub API)        │
│   - Evaluates Resume vs. Tech Stack Requirements    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼ (Triggers Action Protocol)
┌─────────────────────────────────────────────────────┐
│             Google Workspace Connector              │
│  - Executes OAuth authentication                    │
│  - Requests Google Calendar meeting slot            │
│  - Dispatches Google Meet invite link               │
└─────────────────────────────────────────────────────┘
```

---

## 2. Database Schema (Supabase / PostgreSQL)

The schema balances immediate read performance of card piles with high integrity for swipe records and real-time match events. Performance is accelerated via optimized compound indices on swipe matches.

### 2.1 Entity Relationship Diagram (ERD) & Postgres DDL

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Handles student / recruiter identities, user profiles, and hydrated AI metadata
CREATE TYPE user_role AS ENUM ('student', 'recruiter');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    headline TEXT, -- e.g., "MERN Stack Dev @ Stanford" or "Engineering Director at Vercel"
    location TEXT,
    
    -- Hydrated Skills Profile
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    
    -- External Integrations Metadata
    github_username TEXT,
    linkedin_url TEXT,
    raw_resume_text TEXT,
    ai_profile_summary TEXT, -- Extracted automatically from GitHub/LinkedIn parsed content
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. JOBS TABLE
-- Created by recruiters to represent discrete job listings swipeable by students
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    title TEXT NOT NULL, -- e.g., "Frontend Engineer (React) Intern"
    salary_range TEXT, -- e.g., "$80,000 - $110,000"
    job_type TEXT DEFAULT 'Full-time', -- e.g., Regular, Hybrid, Remote
    description TEXT NOT NULL,
    tech_stack TEXT[] DEFAULT '{}' NOT NULL,
    requirements TEXT[] DEFAULT '{}' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SWIPES TABLE
-- Stores individual swipe vectors. Represents dynamic interaction history
CREATE TYPE swipe_direction AS ENUM ('right', 'left');

CREATE TABLE public.swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- The swipe target is either a Job or a Candidate Profile
    target_job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    target_candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    direction swipe_direction NOT NULL,
    
    -- Constraint: Swipe must target EITHER a job or a candidate, but NOT both and NOT none
    CONSTRAINT chk_swipe_target CHECK (
        (target_job_id IS NOT NULL AND target_candidate_id IS NULL) OR
        (target_job_id IS NULL AND target_candidate_id IS NOT NULL)
    ),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure a swiper cannot swipe on the exact same target multiple times
CREATE UNIQUE INDEX idx_swiper_job ON public.swipes (swiper_id, target_job_id) WHERE target_job_id IS NOT NULL;
CREATE UNIQUE INDEX idx_swiper_candidate ON public.swipes (swiper_id, target_candidate_id) WHERE target_candidate_id IS NOT NULL;


-- 4. MEETINGS & MATCHES TABLE
-- Documents mutual matches and calendar integrations
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    
    -- AI generated evaluation score during the matching event (0 to 100)
    ai_compatibility_score INT CHECK (ai_compatibility_score >= 0 AND ai_compatibility_score <= 100),
    ai_vetting_notes JSONB DEFAULT '{}'::jsonb, -- Store dynamic markdown/bullet feedback from Gemini
    
    -- Meeting integration states
    calendar_event_id TEXT, -- Google Calendar unique event identifier
    meet_link TEXT, -- Google Meet invite URL
    scheduled_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'confirmed', 'canceled'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_jobs_active ON public.jobs(is_active);
CREATE INDEX idx_swipes_direction ON public.swipes(direction);
CREATE INDEX idx_meetings_status ON public.meetings(status);
```

### 2.2 Row Level Security (RLS) Configuration

To verify security patterns across tenants, the following RLS principles apply:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are readable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profiles" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs Policies
CREATE POLICY "Active jobs are readable by everyone" 
ON public.jobs FOR SELECT USING (is_active = true);

CREATE POLICY "Recruiters can insert their own jobs" 
ON public.jobs FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their own jobs" 
ON public.jobs FOR UPDATE USING (auth.uid() = recruiter_id);

-- Swipes Policies
CREATE POLICY "Users can read their own swipe interactions" 
ON public.swipes FOR SELECT USING (auth.uid() = swiper_id);

CREATE POLICY "Users can record a swipe" 
ON public.swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Meetings Policies
CREATE POLICY "Participants can view their meetings" 
ON public.meetings FOR SELECT USING (auth.uid() = student_id OR auth.uid() = recruiter_id);
```

---

## 3. Frontend Architecture

The architecture relies on a Single-View Container model utilizing robust state overlays. The design focuses on fluid interactions using **Tailwind CSS** and **motion/react** for smooth physics.

### 3.1 Component Hierarchy
```
App.tsx (Context Providers + Main State Manager)
├── TopNavigationBar (Brand identity + Action tabs: "Swipe Deck", "Matches / Live Schedule", "My Profile")
│
├── SwipeDeckView (Main tinder-like action stage)
│   ├── FloatingCardStack (Stack layout using absolute layering)
│   │   └── InteractionCard (The swipe card containing rich metadata)
│   │       ├── ProfileHeader / JobHeader (Headline, Salary, Stack Badges)
│   │       ├── CollapsibleDetailedView (Tabs: GitHub Projects, Resume, Job Requirement Spec)
│   │       └── SwipeControlPanel (Reject Button [Left], Shortlist Button [Right])
│   └── EmptyDeckState (Fallback visual state offering profile search adjustments)
│
├── MatchOverlayModal (Dynamic pop-up triggering post-match)
│   ├── MatchCelebrationBlast (Particle or layout animation)
│   ├── AI_VettingTelemetry (Displays compatibility gauge + AI summary points)
│   └── AppointmentScheduler (Instant slot options + button to "Confirm & Generate Meet Link")
│
└── ProfileManagementDrawer (Edit tags, manually re-ingest GitHub link)
```

### 3.2 Tailored Component Interface Designs

#### A. Card Gestures (`SwipeDeck.tsx` with dynamic physics)
Using React 19 `useRef` and `motion` (imported from `motion/react`) for native drag mechanics:

```tsx
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'motion/react';
import { Briefcase, MapPin, DollarSign, X, Check, Eye } from 'lucide-react';

interface CardProps {
  id: string;
  title: string;
  subtitle: string;
  payload: any;
  onSwipe: (direction: 'left' | 'right') => void;
  onViewDetails: () => void;
}

export const InteractionCard: React.FC<CardProps> = ({
  title,
  subtitle,
  payload,
  onSwipe,
  onViewDetails
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  const controls = useAnimation();

  const handleDragEnd = async (event: any, info: any) => {
    const swipeThreshold = 140;
    if (info.offset.x > swipeThreshold) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      onSwipe('left');
    } else {
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      style={{ x, y, rotate, opacity }}
      animate={controls}
      onDragEnd={handleDragEnd}
      className="absolute w-full max-w-md h-[550px] bg-white border border-slate-100 rounded-3xl shadow-xl p-6 cursor-grab active:cursor-grabbing flex flex-col justify-between select-none"
    >
      <div>
        {/* Brand/Role Identifier */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-semibold tracking-wider uppercase">
            {payload.type || 'Tech Internship'}
          </span>
          <div className="flex items-center text-slate-400 text-xs">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {payload.location || 'Remote'}
          </div>
        </div>

        {/* Major Info */}
        <h3 className="text-2xl font-bold text-slate-800 leading-tight tracking-tight mb-1">{title}</h3>
        <p className="text-slate-600 font-medium mb-4">{subtitle}</p>

        {/* Dynamic Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {payload.skills?.map((skill: string, index: number) => (
            <span key={index} className="px-2 py-1 bg-slate-50 text-slate-600 font-mono text-xs rounded-md">
              {skill}
            </span>
          ))}
        </div>

        {/* AI Bio Summary */}
        <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300">
          <p className="text-xs text-slate-500 italic line-clamp-3">
            {payload.aiSummary || 'Hydration index in progress. Swipe right to evaluate match potential.'}
          </p>
        </div>
      </div>

      {subControls()}
    </motion.div>
  );

  function subControls() {
    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onViewDetails}
          className="flex items-center text-slate-500 text-xs hover:text-slate-800 transition"
        >
          <Eye className="w-4 h-4 mr-1.5" /> See details
        </button>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
              onSwipe('left');
            }}
            className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-95 rounded-full shadow-sm transition"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={async () => {
              await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
              onSwipe('right');
            }}
            className="p-3 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 active:scale-95 rounded-full shadow-sm transition"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
};
```

#### B. The Instant Match Modal (`MatchModal.tsx`)
```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, Zap, AlertCircle } from 'lucide-react';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: {
    studentName: string;
    recruiterName: string;
    companyName: string;
    jobTitle: string;
    compatibility: number;
    points: string[];
  };
  onScheduleMeet: (time: string) => Promise<string | null>;
}

export const MatchModal: React.FC<MatchModalProps> = ({ isOpen, onClose, matchData, onScheduleMeet }) => {
  const [scheduling, setScheduling] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const handleBooking = async () => {
    setScheduling(true);
    const link = await onScheduleMeet(new Date().toISOString());
    setMeetLink(link);
    setScheduling(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col p-6"
          >
            {/* Header Sparkle */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2 text-violet-600">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="font-bold text-sm tracking-wide uppercase">LaunchPad Match System</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">Dismiss</button>
            </div>

            {/* Visual Title */}
            <div className="text-center my-4">
              <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">It's a Match!</h2>
              <p className="text-slate-500 mt-1">
                {matchData.studentName} & {matchData.companyName} ({matchData.jobTitle})
              </p>
            </div>

            {/* AI Telemetry Area */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold font-mono">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  AI COMPATIBILITY ANALYTICAL GAUGING
                </div>
                <span className="text-lg font-extrabold text-violet-600 font-mono">
                  {matchData.compatibility}%
                </span>
              </div>
              
              <ul className="space-y-2 border-t pt-3 border-slate-200/60 text-slate-600 text-xs">
                {matchData.points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-violet-500 font-bold">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Micro Call-to-Action Booking Engine */}
            {!meetLink ? (
              <button
                disabled={scheduling}
                onClick={handleBooking}
                className="w-full py-4 bg-slate-900 border border-slate-800 text-zinc-100 hover:bg-slate-800 font-bold transition flex items-center justify-center gap-2 rounded-2xl shadow-md disabled:opacity-50"
              >
                <Calendar className="w-4 h-4 text-violet-400" />
                {scheduling ? 'Deploying Calendar Hooks...' : 'Instant Meet: Generate Google Meet Link'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800 font-medium">
                  Calendar Slot Booked! Google Meet Room Provisioned Successfully.
                </div>
                <a
                  href={meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full block text-center py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition rounded-2xl shadow-sm"
                >
                  Join Google Meet Call Directly
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

---

## 4. Backend & Agentic Orchestration Layer (Antigravity 2.0)

LaunchPad AI uses a highly responsive server-side full-stack model. When a user swipes "right" on a candidate (or job) and the other has also swiped right, a backend `match_event` takes place.

### 4.1 Server Framework (`server.ts`)
The server uses **Express + Vite** in development to serve the SPA and proxies backend requests. In production, it executes the compiled client and runs endpoints.

```ts
// server.ts - Core Express Server & Agent Routing
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Google Gemini Client Lazily (Requires server-side secret API Key)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// 1. Hook endpoint for automatic GitHub scraping analysis
app.post('/api/profiles/hydrate-github', async (req, res) => {
  const { githubUsername } = req.body;
  if (!githubUsername) {
    return res.status(400).json({ error: 'GitHub username is required.' });
  }

  try {
    // Stage 1: Call public GitHub API to extract repos, techs, bio
    const githubUrl = `https://api.github.com/users/${githubUsername}`;
    const userRes = await fetch(githubUrl, { headers: { 'User-Agent': 'LaunchPad-AI-Agent' } });
    if (!userRes.ok) throw new Error('Failed to resolve GitHub metadata.');
    
    const githubUserData = await userRes.json();
    const reposRes = await fetch(`${githubUrl}/repos?sort=updated&per_page=6`, {
      headers: { 'User-Agent': 'LaunchPad-AI-Agent' }
    });
    const reposData = await reposRes.json();
    
    const structuredGitContext = {
      bio: githubUserData.bio,
      publicRepoCount: githubUserData.public_repos,
      repos: reposData.map((r: any) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count
      }))
    };

    // Stage 2: Prompt Gemini model automatically to analyze dev telemetry
    const ai = getAIClient();
    const modelResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform professional developer telemetry digestion on the following parsed GitHub summary JSON structure. 
      Generate a clean JSON response containing:
      1. A short markdown bio overview
      2. Extracted programming languages stack
      3. Focus areas (e.g., "Fullstack", "System programming", "AI Integration")
      
      GitHub context: ${JSON.stringify(structuredGitContext)}`
    });

    res.json({
      success: true,
      rawGithub: structuredGitContext,
      aiHydration: modelResponse.text
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Swipes and Match Event Trigger
app.post('/api/swipes', async (req, res) => {
  const { swiper_id, target_job_id, target_candidate_id, direction } = req.body;
  
  // Here, the system writes the entry into swipes database table.
  // Then, it performs an immediate check if there is mutual affinity.
  // In a real DB scenario, query swipes in reverse. Let's showcase standard match check:
  const isMutual = await checkMutualAffinityInMockDB(swiper_id, target_job_id, target_candidate_id, direction);

  if (isMutual && direction === 'right') {
    // Triggers custom Vetting script instantly on matching event
    const matchAnalysis = await triggerAIVettingSequence(swiper_id, target_job_id);
    return res.json({
      match: true,
      matchTelemetry: matchAnalysis
    });
  }

  res.json({ match: false });
});

// Vite server development / distribution route bindings
// ... (Standard production/development static routers as defined in Framework specifications)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LaunchPad Agent Core deployed at http://localhost:${PORT}`);
});

// Mock database and vetting helper functions detailed in subsequent sections...
async function checkMutualAffinityInMockDB(swiper: string, job: string, cand: string, dir: string) {
  // Simulates finding structural match in sweeps logs
  return true; 
}
```

### 4.2 Dynamic Match Vetting Agent Workflow
Upon confirmation of mutual right-swipe logs, `triggerAIVettingSequence` fires to parse requirements versus student profile:

```ts
async function triggerAIVettingSequence(studentId: string, jobId: string) {
  const ai = getAIClient();
  
  // 1. Fetch related rows from Profiles and Jobs tables (Supabase/DB Client mock query)
  const [studentProfile, jobListing] = await Promise.all([
    MockQueryDbProfiles(studentId),
    MockQueryDbJobs(jobId)
  ]);

  const matchPrompt = `
    Conduct an algorithmic tech stack compatibility comparison for LaunchPad AI.
    
    Student:
    - Headline: ${studentProfile.headline}
    - Stacks / Skills: ${studentProfile.skills.join(', ')}
    - Bio Summary: ${studentProfile.ai_profile_summary}
    
    Job Profile:
    - Company: ${jobListing.company_name}
    - Title: ${jobListing.title}
    - Stack Desired: ${jobListing.tech_stack.join(', ')}
    - Target Requirements: ${jobListing.requirements.join(', ')}

    Return a JSON payload formatted strictly with:
    {
      "compatibilityPercentage": integer,
      "strengths": ["string", "string"],
      "gaps": ["string"],
      "vettingReportSummary": "string markdown summarizing suitability"
    }
  `;

  const reviewResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: matchPrompt
  });

  return JSON.parse(reviewResponse.text || '{}');
}

// Mock query helpers representing actual client calls
async function MockQueryDbProfiles(id: string) {
  return {
    headline: "Frontend wizard learning rust and modern systems",
    skills: ["React", "TypeScript", "Tailwind CSS", "GitHub Actions"],
    ai_profile_summary: "Dynamic engineering intern candidate"
  };
}
async function MockQueryDbJobs(id: string) {
  return {
    company_name: "Acme Cloud Corp",
    title: "Software Engineer Intern - Cloud Platform Integrations",
    tech_stack: ["React", "TypeScript", "Node.js", "Docker"],
    requirements: ["Understands responsive state layout", "Familiarity with REST routing systems"]
  };
}
```

### 4.3 Google Calendar & "Instant Meet" Engine Integration
Once matching telemetry is parsed, the recruiter (who authenticated using Google Calendar Auth Scope) calls the Instant Meet trigger. This leverages the OAuth environment setup.

```ts
import { google } from 'googleapis'; // Installed dependency for Workspace API Interaction

// Express Endpoint to Dispatch Auto Google Calendar Event with Google Meet link
app.post('/api/meetings/schedule', async (req, res) => {
  const { studentEmail, recruiterEmail, companyName, jobTitle, scheduledTime } = req.body;
  
  // Retreives User credentials store securely via backend oauth tokens mapping
  const userOAuthToken = req.headers.authorization; // Extracted safely from auth state
  
  if (!userOAuthToken) {
    return res.status(401).json({ error: 'Workspace Credentials are unconfigured.' });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: userOAuthToken.replace('Bearer ', '') });
  
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const eventMetadata = {
    summary: `LaunchPad AI Interview: ${companyName} (${jobTitle})`,
    description: `Congratulations, you matched on LaunchPad AI! A smart vetting review matched your criteria.\nAutomatically scheduled.`,
    start: {
      dateTime: scheduledTime || new Date(Date.now() + 86400000).toISOString(), // Suggest default 24h block
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(Date.now() + 86400000 + 1800000).toISOString(), // Default 30-min block
      timeZone: 'UTC',
    },
    attendees: [
      { email: studentEmail },
      { email: recruiterEmail }
    ],
    conferenceData: {
      createRequest: {
        requestId: `launchpad-meet-${Date.now()}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet'
        }
      }
    }
  };

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventMetadata,
      conferenceDataVersion: 1, // Crucial parameter to tell Google API to configure Meet ID
    });

    res.json({
      meetingId: response.data.id,
      meetLink: response.data.hangoutLink, // Google Meet direct address
      status: 'confirmed'
    });
  } catch (error: any) {
    res.status(500).json({ error: `Google Workspace Hook Failure: ${error.message}` });
  }
});
```

---

## 5. Implementation Roadmap (Vibe Coding Guide)

To develop LaunchPad AI incrementally within sandboxed constraints (such as context-window ceilings and local execution variables), follow this structured phase progression.

### 5.1 Step 1: Structural UX & Dynamic Draggable Deck (Mock Phase)
* **Goal:** Verify immediate client-side mechanics before wiring up storage systems.
* **Scope:** 
  1. Set up high-contrast light theme, import **Space Grotesk** and **Inter** font pairing within `src/index.css`.
  2. Implement functional `SwipeDeck` and `InteractionCard` using standard client storage (`localStorage`) of swipe history state.
  3. Wire custom simulated `match_event` where third swipe always triggers a mock Celebration and launches `MatchModal`.
* **Prompt to Lovable / Bolt / AI Editor:**
  > "Create a single-screen responsive view of a Tinder-for-Jobs app named LaunchPad AI. Style a high-contrast layout, containing a centered card deck implementing physics drag with 'motion/react'. The deck displays a stack of developer/job cards. Dragging over threshold right swipe logs 'shortlisted', left swipe logs 'rejected'. If you reach the third item, manifest an animated MatchModal that shows a compatibility rating and a template calendar call-to-action button. Use custom Lucide icons."

### 5.2 Step 2: Database Storage Setup & Analytical Integration (Storage & Gemini Integration)
* **Goal:** Migrate mock profiles into a dynamic relational model.
* **Scope:**
  1. Initialize Postgres SQL schema (ddl tables: profiles, jobs, swipes, meetings).
  2. Map relational entities. Use ORM or client connectors to read active cards and persist swipes records from real profile interaction vectors.
  3. Deploy standard server-side endpoint `/api/profiles/hydrate-github` using `GoogleGenAI` library to handle analytical digestion of user repos.
* **Prompt to lovables/editors in Phase 2:**
  > "Integrate PostgreSQL database storage into LaunchPad AI. Add support for creating real profiles (student / recruiter), swiping vectors, and meeting records. Create a server-side route `/api/profiles/hydrate-github` using Google's `@google/genai` TypeScript SDK and the 'gemini-2.5-flash' model to evaluate the student's tech stack matches based on incoming JSON. The client displays a visual loader on hydration."

### 5.3 Step 3: OAuth Authentication & Direct Calendar Dispatch
* **Goal:** Enable recruiters to log in via Google OAuth and dispatch calendar slots.
* **Scope:**
  1. Trigger Oauth integrations scope via configuration tools request: `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`.
  2. Deploy Express endpoint `/api/meetings/schedule` to consume Google Client credentials mapping, schedule events on target calendars, and request a unique `hangoutsMeet` room code.
* **Prompt to editors in Phase 3:**
  > "Add the Google Calendar API interface to the Express backend for LaunchPad AI. Configure an OAuth protocol on client side. Use the authenticated developer token to authorize the Google Client API. Implement an endpoint `/api/meetings/schedule` that creates a Calendar Invite with an active Google Meet hangoutLink, dispatching it to both matched candidate and employer profiles when booking is clicked."

---

*This specification document acts as a complete architectural specification. It is ready for copy-pasting directly into your developer terminal or prompt editors to orchestrate full-stack modular build processes.*
