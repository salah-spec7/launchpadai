/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserType = 'student' | 'recruiter';

export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  headline: string;
  location: string;
  university: string;
  major: string;
  graduationYear: number;
  gpa?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  aiSummary: string;
  githubStats?: {
    publicRepos: number;
    followers: number;
    stars: number;
    languages: {[key: string]: number};
  };
  personalityTags: string[];
}

export interface RecruiterProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  headline: string;
  companyName: string;
  companySize?: string;
  location: string;
}

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  companyName: string;
  companyLogoUrl: string;
  jobType: 'Internship' | 'Full-time' | 'Contract';
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  aiJobSummary?: string;
  compatibilityTags: string[];
}

export type SwipeDirection = 'left' | 'right';

export interface Swipe {
  id: string;
  swiperId: string;
  swiperType: UserType;
  targetId: string; // Job ID if swiper is Student; Student ID if swiper is Recruiter
  direction: SwipeDirection;
  aiCompatibilityScore?: number;
  createdAt: string;
}

export interface VettingReport {
  overallVerdict: 'passed' | 'failed' | 'needs_review';
  technicalFit: 'high' | 'medium' | 'low';
  compatibilityScore: number;
  strengths: string[];
  gaps: string[];
  interviewFocus: string[];
  talkingPoints: string[];
  recommendation: string;
}

export interface Match {
  id: string;
  jobId: string;
  studentId: string;
  recruiterId: string;
  matchScore: number;
  matchReasons: string[];
  vettingStatus: 'pending' | 'in_progress' | 'passed' | 'failed';
  vettingReport?: VettingReport;
  matchedAt: string;
  meetingScheduled: boolean;
}

export interface Meeting {
  id: string;
  matchId: string;
  studentId: string;
  recruiterId: string;
  googleMeetLink: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  agenda: string;
  studentNotes?: string;
  recruiterNotes?: string;
}
