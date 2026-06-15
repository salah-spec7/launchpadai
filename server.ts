/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LaunchPad AI — Secure Backend Server
 * Enhanced with security hardening:
 * - Persistent encrypted OAuth token storage
 * - File signature validation
 * - CORS security
 * - JWT authentication
 * - HTTPS support
 * - Improved input sanitization
 * - OAuth state TTL and cleanup
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import https from 'https';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import { google } from 'googleapis';
import * as FileType from 'file-type';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

// ============================================
// ENVIRONMENT VALIDATION
// ============================================
dotenv.config();

const requiredEnvVars = ['APP_URL'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ============================================
// SECURITY MIDDLEWARE — EARLY SETUP
// ============================================

// Use Helmet for comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https://*"],
      "connect-src": ["'self'", "https://*.googleapis.com", "https://*.google.com"],
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS block: ${origin}`);
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));

// ============================================
// RATE LIMITING
// ============================================

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

app.use(globalLimiter);

// ============================================
// JWT AUTHENTICATION
// ============================================

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

interface AuthRequest extends Request {
  userId?: string;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.path === '/api/health' || req.path === '/auth/google' || req.path === '/auth/google/callback') {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (process.env.NODE_ENV === 'development' && !token) {
    req.userId = 'default-user';
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err: any) {
    console.error('JWT validation error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

app.use(authMiddleware);

// ============================================
// LOGGING WITH ERROR IDs
// ============================================

const generateErrorId = () => crypto.randomUUID();

const createErrorLog = (context: string, error: any) => {
  const errorId = generateErrorId();
  const safeMessage = error?.message?.slice(0, 100) || 'Unknown error';
  console.error(`[${errorId}] ${context}: ${safeMessage}`);
  return errorId;
};

// ============================================
// PERSISTENT ENCRYPTED OAUTH TOKEN STORAGE
// ============================================

class SecureTokenStore {
  private dataDir = path.join(__dirname, '.data');
  private algorithm = 'aes-256-gcm';
  private encryptionKey = crypto.scryptSync(JWT_SECRET, 'salt', 32);

  async initialize() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create data directory:', err);
    }
  }

  async set(userId: string, tokens: any): Promise<void> {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as any;
      
      const plaintext = JSON.stringify(tokens);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      const payload = {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex'),
        createdAt: new Date().toISOString(),
      };

      const filePath = path.join(this.dataDir, `token-${userId}.json`);
      await fs.writeFile(filePath, JSON.stringify(payload), { mode: 0o600 });
      console.log(`✅ Token securely stored for user: ${userId}`);
    } catch (err) {
      console.error('Failed to store token:', err);
      throw err;
    }
  }

  async get(userId: string): Promise<any | null> {
    try {
      const filePath = path.join(this.dataDir, `token-${userId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const payload = JSON.parse(data);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(payload.iv, 'hex')
      ) as any;
      decipher.setAuthTag(Buffer.from(payload.authTag, 'hex'));

      let decrypted = decipher.update(payload.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (err) {
      return null;
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      const filePath = path.join(this.dataDir, `token-${userId}.json`);
      await fs.unlink(filePath);
      console.log(`🗑️ Token deleted for user: ${userId}`);
    } catch (err) {
      // Ignore
    }
  }
}

const tokenStore = new SecureTokenStore();

// ============================================
// AI & OAUTH INITIALIZATION
// ============================================

let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'launchpad-ai-secure',
        },
      },
    });
    console.log('✅ Gemini API initialized securely');
  } catch (error) {
    console.error('Failed to initialize Gemini:', error);
    ai = null;
  }
} else {
  console.log('⚠️ Gemini API key unconfigured. Using simulation mode.');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

// OAuth state store with TTL
const oauthStateStore = new Map<string, { userId: string; expiresAt: number }>();

// Cleanup expired OAuth states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateStore.entries()) {
    if (data.expiresAt < now) {
      oauthStateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

let oauth2Client: InstanceType<typeof google.auth.OAuth2> | null = null;
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CLIENT_ID !== 'MY_GOOGLE_CLIENT_ID') {
  oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  console.log('✅ Google OAuth2 initialized for Calendar + Meet');
} else {
  console.log('⚠️ Google OAuth credentials not configured. Meet scheduling in simulation mode.');
}

const meetingSessionStore = new Map<string, any>();

// ============================================
// INPUT SANITIZATION
// ============================================

const sanitizeAIInput = (text: string | undefined, maxLength: number = 500): string => {
  if (!text) return '';
  
  const sanitized = text
    .replace(/[^a-zA-Z0-9\s\-.,;:/()'@]/g, '')
    .replace(/(\r\n|\n|\r)/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  
  return sanitized;
};

const validateVettingInput = (input: any) => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input');
  }

  const { student, job } = input;
  if (!student || !student.fullName || !job || !job.companyName) {
    throw new Error('Invalid student or job profile');
  }

  return true;
};

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    aiEngineActive: ai !== null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Generate JWT token
 */
app.post('/api/auth/token', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId || 'default-user';
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      token,
      expiresIn: '7 days',
      userId,
    });
  } catch (err: any) {
    const errorId = createErrorLog('Token generation error', err);
    return res.status(500).json({ error: 'Failed to generate token', errorId });
  }
});

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed`));
    }
    cb(null, true);
  },
});

/**
 * Upload and parse resume with file signature validation
 */
app.post('/api/profiles/upload-resume', apiLimiter, upload.single('resume'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const extension = path.extname(originalname).toLowerCase();

    // Validate file signature
    const detectedType = await FileType.fromBuffer(buffer);
    if (!detectedType) {
      return res.status(400).json({ error: 'File format could not be determined.' });
    }

    const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedMimes.includes(detectedType.mime)) {
      return res.status(400).json({ error: `File type ${detectedType.mime} is not allowed.` });
    }

    let extractedText = '';

    try {
      if (extension === '.pdf' || detectedType.mime === 'application/pdf') {
        const data = await pdf(buffer);
        extractedText = data.text || '';
      } else if (extension === '.docx' || detectedType.mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } else if (extension === '.txt' || extension === '.md') {
        extractedText = buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file format.' });
      }
    } catch (parseErr: any) {
      const errorId = createErrorLog('File parsing error', parseErr);
      return res.status(422).json({ 
        error: 'Failed to process file.',
        errorId,
      });
    }

    const sanitizedText = extractedText.trim().slice(0, 50000);
    if (!sanitizedText) {
      return res.status(422).json({ 
        error: 'The uploaded file could not be parsed or contains no readable text.' 
      });
    }

    return res.json({
      success: true,
      text: sanitizedText,
      fileName: originalname,
      message: `Resume parsed successfully`,
    });
  } catch (err: any) {
    const errorId = createErrorLog('Resume upload', err);
    return res.status(500).json({ 
      error: 'An error occurred during file processing.',
      errorId,
    });
  }
});

/**
 * Hydrate user profile
 */
app.post('/api/profiles/hydrate', apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { username, rawSnippet, mode } = req.body;

    if (!username && !rawSnippet) {
      return res.status(400).json({ error: 'Username or text input required.' });
    }

    const defaultSkills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'PostgreSQL', 'Docker', 'Git'];
    const defaultTags = ['Fast Learner', 'Full-Stack Developer', 'Team Player'];
    const defaultHeadline = username ? `Software Engineer | ${sanitizeAIInput(username)}` : 'Software Engineer';
    const defaultSummary = 'Passionate developer with strong technical fundamentals.';

    if (ai) {
      try {
        const safeUsername = sanitizeAIInput(username as string, 100);
        const safeSnippet = sanitizeAIInput(rawSnippet as string, 200);
        const safeMode = sanitizeAIInput(mode as string, 50);

        const prompt = `
You are a technical recruiter. Analyze this developer and output a professional profile.

[BOUNDARY START]
Username: ${safeUsername}
Info: ${safeSnippet}
Role: ${safeMode}
[BOUNDARY END]

Return JSON matching:
{ "summary": "string", "skills": ["array"], "personalityTags": ["array"], "headline": "string", "simulatedStats": {"publicRepos": 0, "followers": 0, "stars": 0} }
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                personalityTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                headline: { type: Type.STRING },
                simulatedStats: {
                  type: Type.OBJECT,
                  properties: {
                    publicRepos: { type: Type.INTEGER },
                    followers: { type: Type.INTEGER },
                    stars: { type: Type.INTEGER },
                  },
                },
              },
              required: ['summary', 'skills', 'personalityTags', 'headline'],
            },
          },
        });

        const parsedResponse = JSON.parse(response.text?.trim() || '{}');
        return res.json({
          success: true,
          aiHydrated: true,
          data: {
            headline: sanitizeAIInput(parsedResponse.headline) || defaultHeadline,
            aiSummary: sanitizeAIInput(parsedResponse.summary) || defaultSummary,
            skills: (parsedResponse.skills || defaultSkills).slice(0, 8),
            personalityTags: (parsedResponse.personalityTags || defaultTags).slice(0, 4),
            githubStats: parsedResponse.simulatedStats || { publicRepos: 15, followers: 25, stars: 40 },
          },
        });
      } catch (error: any) {
        console.error('AI profiling error:', error.message);
      }
    }

    // Simulation mode
    const customSkills = [...defaultSkills];
    const combinedText = `${username} ${rawSnippet}`.toLowerCase();

    if (combinedText.includes('rust') || combinedText.includes('systems')) {
      customSkills.unshift('Rust', 'WebAssembly');
    }
    if (combinedText.includes('python') || combinedText.includes('ai') || combinedText.includes('ml')) {
      customSkills.unshift('Python', 'PyTorch', 'FastAPI');
    }

    return res.json({
      success: true,
      aiHydrated: false,
      data: {
        headline: defaultHeadline,
        aiSummary: defaultSummary,
        skills: customSkills.slice(0, 8),
        personalityTags: defaultTags,
        githubStats: { publicRepos: 12, followers: 20, stars: 35 },
      },
    });
  } catch (err: any) {
    const errorId = createErrorLog('Profile hydration', err);
    return res.status(500).json({ error: 'Profile processing failed', errorId });
  }
});

/**
 * AI Vetting Agent
 */
app.post('/api/matches/vetting', apiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { student, job } = req.body;

    validateVettingInput({ student, job });

    if (ai) {
      try {
        const safeStudentName = sanitizeAIInput(student.fullName, 100);
        const safeCompanyName = sanitizeAIInput(job.companyName, 100);

        const prompt = `
You are an AI vetting agent. Analyze this match:

[SAFE BOUNDARY START]
Student: ${safeStudentName}
Skills: ${(student.skills || []).map((s: string) => sanitizeAIInput(s, 50)).join(', ')}
Company: ${safeCompanyName}
Role: ${sanitizeAIInput(job.title, 100)}
Requirements: ${(job.requiredSkills || []).map((s: string) => sanitizeAIInput(s, 50)).join(', ')}
[SAFE BOUNDARY END]

Return JSON:
{ "overallVerdict": "passed|failed|needs_review", "technicalFit": "high|medium|low", "compatibilityScore": 0-100, "strengths": [], "gaps": [], "interviewFocus": [], "talkingPoints": [], "recommendation": "" }
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallVerdict: { type: Type.STRING },
                technicalFit: { type: Type.STRING },
                compatibilityScore: { type: Type.INTEGER },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                interviewFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
                talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendation: { type: Type.STRING },
              },
              required: ['overallVerdict', 'technicalFit', 'compatibilityScore', 'strengths', 'gaps', 'interviewFocus', 'talkingPoints', 'recommendation'],
            },
          },
        });

        const vettingReport = JSON.parse(response.text?.trim() || '{}');
        return res.json({
          success: true,
          aiProcessed: true,
          report: vettingReport,
        });
      } catch (error: any) {
        console.error('AI vetting error:', error.message);
      }
    }

    // Simulation mode
    const studentSkills = new Set((student.skills || []).map((s: string) => s.toLowerCase()));
    const requiredSkills = (job.requiredSkills || []).map((s: string) => s.toLowerCase());

    let overlapCount = 0;
    requiredSkills.forEach((skill: string) => {
      if (studentSkills.has(skill)) overlapCount++;
    });

    const matchingPercentage = Math.min(65 + overlapCount * 8, 98) + Math.floor(Math.random() * 5);
    const technicalFit = matchingPercentage >= 85 ? 'high' : matchingPercentage >= 70 ? 'medium' : 'low';

    return res.json({
      success: true,
      aiProcessed: false,
      report: {
        overallVerdict: matchingPercentage >= 75 ? 'passed' : 'needs_review',
        technicalFit,
        compatibilityScore: matchingPercentage,
        strengths: [
          `${overlapCount} key skills match`,
          `Strong academic background`,
          `Portfolio alignment`,
        ],
        gaps: ['Additional practical validation recommended'],
        interviewFocus: ['System design', 'Communication skills'],
        talkingPoints: [`Tell us about your ${Array.from(studentSkills)[0] || 'recent'} projects`, `How do you approach debugging?`],
        recommendation: `Strong match at ${matchingPercentage}%. Recommend proceeding.`,
      },
    });
  } catch (err: any) {
    const errorId = createErrorLog('Vetting agent', err);
    if (err.message.includes('Invalid')) {
      return res.status(400).json({ error: err.message, errorId });
    }
    return res.status(500).json({ error: 'Vetting failed', errorId });
  }
});

// ============================================
// OAUTH FLOW
// ============================================

/**
 * GET /auth/google
 */
app.get('/auth/google', (req, res) => {
  if (!oauth2Client) {
    return res.status(503).json({ error: 'Google OAuth not configured.' });
  }

  try {
    const userId = (req as AuthRequest).userId || (req.query.userId as string) || 'default-user';
    const state = crypto.randomBytes(32).toString('hex');

    oauthStateStore.set(state, {
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: CALENDAR_SCOPES,
      prompt: 'consent',
      state,
    });

    res.redirect(authUrl);
  } catch (err: any) {
    const errorId = createErrorLog('OAuth initiation', err);
    res.status(500).json({ error: 'OAuth initialization failed', errorId });
  }
});

/**
 * GET /auth/google/callback
 */
app.get('/auth/google/callback', async (req, res) => {
  if (!oauth2Client) {
    return res.status(503).json({ error: 'OAuth client not initialized.' });
  }

  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing OAuth callback parameters.' });
    }

    const stateData = oauthStateStore.get(state);
    if (!stateData || stateData.expiresAt < Date.now()) {
      console.error('❌ CSRF attack detected: Invalid or expired state');
      return res.status(403).json({ error: 'Invalid OAuth state. Possible CSRF attack.' });
    }

    const userId = stateData.userId;
    oauthStateStore.delete(state);

    try {
      const { tokens } = await oauth2Client.getToken(code);
      await tokenStore.set(userId, tokens);
      oauth2Client.setCredentials(tokens);

      console.log(`✅ OAuth tokens securely stored for user: ${userId}`);

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      res.redirect(`${appUrl}?oauth=success`);
    } catch (tokenErr: any) {
      const errorId = createErrorLog('Token exchange', tokenErr);
      res.status(500).json({ error: 'Token exchange failed', errorId });
    }
  } catch (err: any) {
    const errorId = createErrorLog('OAuth callback', err);
    res.status(500).json({ error: 'OAuth callback failed', errorId });
  }
});

/**
 * GET /auth/google/status
 */
app.get('/auth/google/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.query.userId as string) || req.userId || 'default-user';
    const tokens = await tokenStore.get(userId);
    const hasTokens = !!tokens;

    res.json({
      authenticated: hasTokens,
      provider: 'google',
      scopes: hasTokens ? CALENDAR_SCOPES : [],
      userId,
    });
  } catch (err: any) {
    const errorId = createErrorLog('OAuth status check', err);
    res.status(500).json({ error: 'Status check failed', errorId });
  }
});

/**
 * POST /api/meetings/schedule
 */
app.post('/api/meetings/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const {
      studentName,
      recruiterName,
      companyName,
      jobTitle,
      customDate,
      customTime,
      durationMinutes,
      studentEmail,
      recruiterEmail,
      userId,
    } = req.body;

    if (!studentName || !recruiterName || !companyName || !jobTitle) {
      return res.status(400).json({ error: 'Missing required scheduling parameters.' });
    }

    const duration = Math.min(Number(durationMinutes) || 30, 480);
    const sessionUserId = userId || req.userId || 'default-user';

    let scheduledDate = new Date();
    if (customDate && customTime) {
      const parsedDate = new Date(`${customDate}T${customTime}:00`);
      if (!isNaN(parsedDate.getTime())) {
        scheduledDate = parsedDate;
      }
    } else {
      scheduledDate.setDate(scheduledDate.getDate() + 2);
      scheduledDate.setHours(10, 0, 0, 0);
    }

    const endDate = new Date(scheduledDate.getTime() + duration * 60 * 1000);

    // Try live Google Calendar mode
    if (oauth2Client) {
      try {
        const tokens = await tokenStore.get(sessionUserId);
        if (tokens) {
          const authedClient = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
          authedClient.setCredentials(tokens);

          if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
            const { credentials } = await authedClient.refreshAccessToken();
            await tokenStore.set(sessionUserId, credentials);
            authedClient.setCredentials(credentials);
          }

          const calendar = google.calendar({ version: 'v3', auth: authedClient });
          const attendees = [];
          if (studentEmail) attendees.push({ email: studentEmail });
          if (recruiterEmail) attendees.push({ email: recruiterEmail });

          const eventPayload = {
            summary: `LaunchPad AI Interview: ${companyName}`,
            description: `🚀 LaunchPad AI Match!\n\nCandidate: ${studentName}\nRole: ${jobTitle}\n\nAuto-scheduled by LaunchPad AI.`,
            start: { dateTime: scheduledDate.toISOString(), timeZone: 'UTC' },
            end: { dateTime: endDate.toISOString(), timeZone: 'UTC' },
            attendees,
            conferenceData: {
              createRequest: {
                requestId: `lp-${crypto.randomBytes(8).toString('hex')}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          };

          const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventPayload,
            conferenceDataVersion: 1,
          });

          const meetLink = response.data.hangoutLink || `https://meet.google.com/${response.data.id}`;
          meetingSessionStore.set(`meeting-${response.data.id}`, {
            googleCalendarEventId: response.data.id,
            googleMeetLink: meetLink,
            scheduledAt: scheduledDate.toISOString(),
            liveIntegration: true,
          });

          console.log(`✅ Live Google Calendar event created`);

          return res.json({
            success: true,
            liveIntegration: true,
            scheduledAt: scheduledDate.toISOString(),
            googleMeetLink: meetLink,
            durationMinutes: duration,
            googleCalendarEventId: response.data.id,
          });
        }
      } catch (error: any) {
        console.error('Live Calendar fallback:', error.message);
      }
    }

    // Simulation mode
    const meetCode = `${crypto.randomBytes(3).toString('hex')}-${crypto.randomBytes(4).toString('hex')}-${crypto.randomBytes(3).toString('hex')}`;
    const meetLink = `https://meet.google.com/${meetCode}`;
    const eventId = `lp-event-${crypto.randomUUID()}`;

    meetingSessionStore.set(`meeting-${eventId}`, {
      googleCalendarEventId: eventId,
      googleMeetLink: meetLink,
      scheduledAt: scheduledDate.toISOString(),
      liveIntegration: false,
    });

    return res.json({
      success: true,
      liveIntegration: false,
      scheduledAt: scheduledDate.toISOString(),
      googleMeetLink: meetLink,
      durationMinutes: duration,
      googleCalendarEventId: eventId,
    });
  } catch (err: any) {
    const errorId = createErrorLog('Meeting scheduling', err);
    res.status(500).json({ error: 'Scheduling failed', errorId });
  }
});

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    await tokenStore.initialize();

    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('✅ Vite middleware mounted');
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 LaunchPad AI Secure Server running at http://0.0.0.0:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Security: CORS + Helmet + Rate Limiting + JWT Auth + Encrypted Tokens`);
    });

    if (process.env.HTTPS_CERT_PATH && process.env.HTTPS_KEY_PATH) {
      try {
        const cert = await fs.readFile(process.env.HTTPS_CERT_PATH);
        const key = await fs.readFile(process.env.HTTPS_KEY_PATH);
        const httpsServer = https.createServer({ cert, key }, app);
        httpsServer.listen(443, '0.0.0.0', () => {
          console.log(`🔒 HTTPS server also running on port 443`);
        });
      } catch (err) {
        console.warn('⚠️ HTTPS certificate not found, running HTTP only');
      }
    }
  } catch (err: any) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
};

startServer();
