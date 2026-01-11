import { User, CSVJob } from '@/types';

const USERS_KEY = 'csv_review_users';
const JOBS_KEY = 'csv_review_jobs';
const AUTH_KEY = 'csv_review_auth';

// Initialize default users
export const initializeStorage = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    const defaultUsers: User[] = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'intern1', password: 'intern123', role: 'intern' },
      { username: 'intern2', password: 'intern123', role: 'intern' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  
  const jobs = localStorage.getItem(JOBS_KEY);
  if (!jobs) {
    localStorage.setItem(JOBS_KEY, JSON.stringify([]));
  }
};

// Auth functions
export const authenticate = (username: string, password: string): User | null => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const auth = localStorage.getItem(AUTH_KEY);
  return auth ? JSON.parse(auth) : null;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

// Job functions
export const getJobs = (): CSVJob[] => {
  return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]');
};

export const getJob = (id: string): CSVJob | null => {
  const jobs = getJobs();
  return jobs.find(j => j.id === id) || null;
};

export const saveJob = (job: CSVJob) => {
  const jobs = getJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  if (index >= 0) {
    jobs[index] = job;
  } else {
    jobs.push(job);
  }
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
};

export const deleteJob = (id: string) => {
  const jobs = getJobs().filter(j => j.id !== id);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
};

// CSV parsing
export const parseCSV = (content: string): { headers: string[]; data: string[][] } => {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
  
  return { headers, data };
};

// Generate job ID
export const generateJobId = (): string => {
  const jobs = getJobs();
  const nextNum = jobs.length + 1;
  return `job_${String(nextNum).padStart(3, '0')}`;
};

// Export CSV with flags
export const exportCSVWithFlags = (job: CSVJob): string => {
  const headers = [...job.headers, 'intern_flag'];
  const rows = job.data.map((row, index) => {
    const flag = job.flags[index] || '';
    return [...row, String(flag)];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};
