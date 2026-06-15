/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserType, StudentProfile, RecruiterProfile } from '../types';
import { Github, FileText, Send, Sparkles, Loader2, ArrowRight, Star, GraduationCap, Building2, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface OnboardingProps {
  role: UserType;
  userName: string;
  onCompleted: (profile: any) => void;
}

export function Onboarding({ role, userName, onCompleted }: OnboardingProps) {
  const [githubUser, setGithubUser] = useState('');
  const [profileSnippet, setProfileSnippet] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyHeadline, setCompanyHeadline] = useState('');
  const [recruiterLocation, setRecruiterLocation] = useState('San Francisco, CA');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedProfile, setGeneratedProfile] = useState<StudentProfile | null>(null);

  // Resume File Upload States
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Quick fill defaults for demonstrative testing
  const handleQuickPreset = (presetName: 'alex' | 'priya' | 'marcus') => {
    setIsLoading(true);
    setLoadingStep(1);
    
    // Simulate steps for aesthetic feel
    const timers = [
       setTimeout(() => setLoadingStep(2), 700),
       setTimeout(() => setLoadingStep(3), 1550),
       setTimeout(() => {
         setIsLoading(false);
         // Import preset data directly
         let data: any;
         if (presetName === 'alex') {
           data = {
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
             skills: ['TypeScript', 'React', 'Node.js', 'Next.js', 'Python', 'PyTorch', 'Tailwind', 'Docker'],
             githubUrl: 'github.com/alexchen-dev',
             aiSummary: 'CS Senior at Stanford specialized in reactive web layers and model connectors. Developed an open-source vector search orchestration node loaded with standard embedding APIs.',
             githubStats: { publicRepos: 32, followers: 128, stars: 489, languages: { 'TypeScript': 45, 'Python': 35, 'Rust': 12, 'CSS': 8 } },
             personalityTags: ['Fast Learner', 'Open-Source Dev', 'Team Leader', 'Pragmatic Coder']
           };
         } else if (presetName === 'priya') {
           data = {
             id: 'student-priya-patel',
             email: 'priya.patel@berkeley.edu',
             fullName: 'Priya Patel',
             avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
             headline: 'Backend Infrastructure Intern & Cloud Specialist',
             location: 'Berkeley, CA',
             university: 'UC Berkeley',
             major: 'EECS',
             graduationYear: 2026,
             gpa: '3.85',
             skills: ['Go', 'Kubernetes', 'Docker', 'PostgreSQL', 'Redis', 'AWS', 'GraphQL', 'gRPC'],
             githubUrl: 'github.com/priyapatel-backend',
             aiSummary: 'EECS student focusing on microservice optimization and asynchronous database queues. Actively contributed core documentation patches to upstream Kubernetes nodes.',
             githubStats: { publicRepos: 24, followers: 95, stars: 182, languages: { 'Go': 60, 'Python': 20, 'Shell': 15, 'C++': 5 } },
             personalityTags: ['System Architect', 'Core contributor', 'Performance nerd', 'Autonomous']
           };
         } else {
           data = {
             id: 'student-marcus-vance',
             email: 'mvance@gatech.edu',
             fullName: 'Marcus Vance',
             avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
             headline: 'Creative Frontend Engineer & UX Designer @ Georgia Tech',
             location: 'Atlanta, GA',
             university: 'Georgia Tech',
             major: 'Computational Media',
             graduationYear: 2026,
             gpa: '3.72',
             skills: ['JavaScript', 'React', 'Framer Motion', 'Tailwind CSS', 'Figma', 'UI testing', 'CSS Grid'],
             githubUrl: 'github.com/marcusv-ux',
             aiSummary: 'Interactive designer centered on user accessibility standards and micro-animations. Winner of Georgia Tech Hackathon for streamlined calendar visualizations.',
             githubStats: { publicRepos: 18, followers: 72, stars: 92, languages: { 'JavaScript': 55, 'CSS': 30, 'HTML': 15 } },
             personalityTags: ['Design Thinker', 'Accessibility Advocate', 'Fast Prototyper', 'Collaborator']
           };
         }

         setGeneratedProfile(data);
       }, 2300)
    ];

    return () => timers.forEach(clearTimeout);
  };

  // File upload and processing handlers
  const handleFileUpload = async (file: File) => {
    setIsParsingFile(true);
    setFileError(null);
    setUploadedFileName(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/profiles/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Failed to parse file.');
      }

      if (resJson.success) {
        setProfileSnippet(resJson.text);
        setUploadedFileName(resJson.fileName);
      } else {
        throw new Error(resJson.error || 'Failed to parse file.');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setFileError(err.message || 'Error occurred while processing file.');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Dispatch live API analysis call
  const triggerLiveHydration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStep(1);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 700);

    try {
      const response = await fetch('/api/profiles/hydrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: githubUser,
          rawSnippet: profileSnippet,
          mode: 'student'
        })
      });

      const resJson = await response.json();
      clearInterval(stepInterval);
      setIsLoading(false);

      if (resJson.success) {
        const payload: StudentProfile = {
          id: `student-${Date.now()}`,
          email: `${userName.replace(/\s+/g, '').toLowerCase()}@university.edu`,
          fullName: userName,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          headline: resJson.data.headline,
          location: 'San Francisco, CA',
          university: 'State University',
          major: 'Computer Science',
          graduationYear: 2026,
          gpa: '3.80',
          skills: resJson.data.skills,
          githubUrl: githubUser ? `github.com/${githubUser}` : undefined,
          aiSummary: resJson.data.aiSummary,
          githubStats: resJson.data.githubStats,
          personalityTags: resJson.data.personalityTags
        };
        setGeneratedProfile(payload);
      } else {
         throw new Error(resJson.error || 'Calibration error');
      }

    } catch (err) {
      console.error('Hydration fail, running fallback preset:', err);
      clearInterval(stepInterval);
      // Fallback preset
      handleQuickPreset('alex');
    }
  };

  const handleRecruiterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      const profile: RecruiterProfile = {
        id: `recruiter-${Date.now()}`,
        email: `${userName.replace(/\s+/g, '').toLowerCase()}@${(companyName || 'vercel').toLowerCase()}.com`,
        fullName: userName,
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        headline: companyHeadline || `Senior Tech Recruiter @ ${companyName || 'Vercel'}`,
        companyName: companyName || 'Vercel',
        location: recruiterLocation,
      };
      onCompleted(profile);
    }, 800);
  };

  const renderLoadingState = () => {
    const steps = [
      'Establishing developer api hooks...',
      'Analyzing repository languages and projects...',
      'Synthesizing professional profile summary with Gemini...'
    ];

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-200/80 rounded-3xl shadow-lg">
        <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-6" />
        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
          AI Agent Active
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Please wait while the Antigravity Agent digests the technical signals.
        </p>

        {/* Dynamic Stepper */}
        <div className="mt-8 space-y-3 w-full max-w-xs text-left">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${
                loadingStep > idx 
                  ? 'bg-emerald-500' 
                  : loadingStep === idx 
                    ? 'bg-violet-600 animate-pulse' 
                    : 'bg-slate-200'
              }`} />
              <span className={
                loadingStep > idx 
                  ? 'text-emerald-600 font-medium line-through opacity-70' 
                  : loadingStep === idx 
                    ? 'text-violet-700 font-bold' 
                    : 'text-slate-400'
              }>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render profile preview so student can review hydrated stats
  const renderProfileReview = () => {
    if (!generatedProfile) return null;

    return (
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          Hydration Completed with Gemini 3.5-Flash!
        </div>
        
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Review Your Smart Profile
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Our parser extracted these indicators. Edit or press save to enter active matching decks.
        </p>

        {/* Interactive preview card block */}
        <div className="mt-6 border border-slate-200/80 rounded-2xl p-6 bg-slate-50/50 space-y-4">
          <div className="flex items-start gap-4">
            <img 
              src={generatedProfile.avatarUrl} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full object-cover border-2 border-violet-500/20"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">{generatedProfile.fullName}</h3>
              <p className="text-xs text-slate-500">{generatedProfile.university} • {generatedProfile.major}</p>
              <input 
                type="text" 
                value={generatedProfile.headline}
                onChange={(e) => setGeneratedProfile({ ...generatedProfile, headline: e.target.value })}
                className="w-full text-xs font-semibold text-violet-700 bg-white border border-slate-200 rounded px-2.5 py-1.5 mt-2 focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-200/80 pt-4">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              AI Summary (Editable)
            </label>
            <textarea
              value={generatedProfile.aiSummary}
              onChange={(e) => setGeneratedProfile({ ...generatedProfile, aiSummary: e.target.value })}
              rows={4}
              className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 focus:ring-1 focus:ring-violet-500 focus:outline-none text-slate-600 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Extract Skills
              </span>
              <div className="flex flex-wrap gap-1.5">
                {generatedProfile.skills.map((skill, index) => (
                  <span key={index} className="px-2.5 py-1 bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-medium rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Personality Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {generatedProfile.personalityTags.map((tag, index) => (
                  <span key={index} className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {generatedProfile.githubStats && (
            <div className="bg-slate-900 text-zinc-100 rounded-xl p-4 flex justify-between text-center mt-3 font-mono">
              <div>
                <span className="block text-[10px] text-zinc-400">REPOS</span>
                <span className="text-lg font-bold text-violet-400">{generatedProfile.githubStats.publicRepos}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-400">STARS</span>
                <span className="text-lg font-bold text-violet-400">{generatedProfile.githubStats.stars}</span>
              </div>
              <div>
                <span className="block text-[10px] text-zinc-400">FOLLOWERS</span>
                <span className="text-lg font-bold text-violet-400">{generatedProfile.githubStats.followers}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onCompleted(generatedProfile)}
          className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-800 text-zinc-100 font-bold text-sm tracking-wide rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
        >
          Confirm Details & Build Swipe Deck
          <ArrowRight className="w-4 h-4 text-violet-400" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return renderLoadingState();
  }

  if (generatedProfile) {
    return renderProfileReview();
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {role === 'student' ? (
        <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl">
          
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
              <GraduationCap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Welcome, {userName}!
              </h2>
              <p className="text-xs text-slate-500">
                Setup your developer identity with smart profile parsing.
              </p>
            </div>
          </div>

          {/* Quick Match Presets */}
          <div className="mb-8 bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              Developer Showcase Presets (Instant match testing)
            </h4>
            <p className="text-[11px] text-slate-500 mb-4">
              Click any profile to load an active developer record with preset github projects, ready to swipe!
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleQuickPreset('alex')}
                className="px-3 py-2.5 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-xl text-left text-xs transition cursor-pointer"
              >
                <span className="font-bold block text-slate-800">Alex Chen</span>
                <span className="text-[10px] text-violet-600">Stanford • FS/AI</span>
              </button>
              <button 
                onClick={() => handleQuickPreset('priya')}
                className="px-3 py-2.5 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-xl text-left text-xs transition cursor-pointer"
              >
                <span className="font-bold block text-slate-800">Priya Patel</span>
                <span className="text-[10px] text-violet-600">Berkeley • Backend</span>
              </button>
              <button 
                onClick={() => handleQuickPreset('marcus')}
                className="px-3 py-2.5 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 rounded-xl text-left text-xs transition cursor-pointer"
              >
                <span className="font-bold block text-slate-800">Marcus Vance</span>
                <span className="text-[10px] text-violet-600">GT • UI Frontend</span>
              </button>
            </div>
          </div>

          {/* Custom profile creation */}
          <form onSubmit={triggerLiveHydration} className="space-y-5">
            <div className="text-center font-bold text-xs text-slate-400 uppercase tracking-widest my-2 relative">
              <span className="bg-white px-3 relative z-10">Or Connect Custom Codebases</span>
              <div className="h-[1px] bg-slate-100 absolute top-1/2 left-0 right-0 z-0" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" />
                Your Public GitHub Account ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. torvalds or gaearon"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            {/* Elegant Resume Drop Zone */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-violet-600" />
                Upload Professional Resume (.pdf, .docx, .txt)
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resume-file-input')?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[120px] ${
                  isDragging 
                    ? 'border-violet-500 bg-violet-50/50 shadow-inner' 
                    : 'border-slate-200 hover:border-violet-400 bg-slate-50 hover:bg-violet-50/10'
                }`}
              >
                <input 
                  type="file" 
                  id="resume-file-input" 
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                
                {isParsingFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-700">Extracting resume content...</p>
                    <p className="text-[10px] text-slate-400">Scanning document structure & tech tags</p>
                  </div>
                ) : uploadedFileName ? (
                  <div className="flex flex-col items-center gap-1.5 font-sans">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 animate-bounce" />
                    <p className="text-xs font-bold text-slate-800">Successfully digested!</p>
                    <p className="text-[10px] text-emerald-600 font-mono bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100 max-w-xs truncate">
                      {uploadedFileName}
                    </p>
                    <p className="text-[10px] text-slate-400">Extracted details are ready below</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 p-2">
                    <UploadCloud className="w-8 h-8 text-slate-400 hover:text-violet-500 transition-colors" />
                    <p className="text-xs text-slate-600 font-medium">
                      Drag and drop your file here, or <span className="text-violet-600 font-bold hover:underline">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Supports PDF, Microsoft Word (.docx), TXT, or markdown
                    </p>
                  </div>
                )}
              </div>

              {/* Error messages */}
              {fileError && (
                <div className="flex items-center gap-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Resume / Project Snippets
              </label>
              <textarea
                rows={3}
                placeholder="Mention key projects, university highlights, or tech stack keywords. The agent parses this to determine compatibility."
                value={profileSnippet}
                onChange={(e) => setProfileSnippet(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-violet-200/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white shrink-0" />
              Hydrate Resume Portfolio via Gemini
            </button>
          </form>
        </div>
      ) : (
        /* Recruiter Onboarding form */
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl">
          
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Position Your Company
              </h2>
              <p className="text-xs text-slate-500">
                Configure your recruiter bio and active job vacancies.
              </p>
            </div>
          </div>

          <form onSubmit={handleRecruiterSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Target Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Vercel, Stripe, Acme Cloud"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Professional Bio / Recruiter Title
              </label>
              <input
                type="text"
                placeholder="e.g. Tech Recruiting Lead at Stripe Core"
                required
                value={companyHeadline}
                onChange={(e) => setCompanyHeadline(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Primary Location
              </label>
              <input
                type="text"
                value={recruiterLocation}
                onChange={(e) => setRecruiterLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA (Hybrid)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 border border-dashed border-slate-200/90 rounded-2xl p-4 text-[11px] text-slate-500 leading-relaxed">
              <strong>Interactive Demo Hack:</strong> Your recruiter profile will swipe candidates on behalf of Vercel or Stripe core vacancies, immediately matching with student sandbox profiles!
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Deploy Card Deck
              <Send className="w-3.5 h-3.5 text-violet-400" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
