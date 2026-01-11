import { User, CSVJob } from '@/types';

// Simulated file structure in localStorage:
// data/users.json -> USERS_KEY
// data/csv_jobs/job_xxx/metadata.json -> JOB_META_PREFIX + jobId
// data/csv_jobs/job_xxx/columns.json -> JOB_COLUMNS_PREFIX + jobId
// data/csv_jobs/job_xxx/flags.json -> JOB_FLAGS_PREFIX + jobId
// data/csv_jobs/job_xxx/original.csv -> JOB_DATA_PREFIX + jobId

const USERS_KEY = 'data/users.json';
const AUTH_KEY = 'data/auth.json';
const JOBS_INDEX_KEY = 'data/csv_jobs/index.json';
const JOB_META_PREFIX = 'data/csv_jobs/';
const JOB_COLUMNS_SUFFIX = '/columns.json';
const JOB_FLAGS_SUFFIX = '/flags.json';
const JOB_DATA_SUFFIX = '/data.json';
const JOB_META_SUFFIX = '/metadata.json';

// Types for JSON storage
interface JobMetadata {
  id: string;
  name: string;
  uploadDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  totalRows: number;
}

interface JobColumns {
  headers: string[];
  selectedColumns: string[];
}

interface JobFlags {
  [rowIndex: string]: number;
}

interface JobData {
  headers: string[];
  rows: string[][];
}

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
  
  const jobsIndex = localStorage.getItem(JOBS_INDEX_KEY);
  if (!jobsIndex) {
    localStorage.setItem(JOBS_INDEX_KEY, JSON.stringify([]));
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

// Job index functions
const getJobIds = (): string[] => {
  return JSON.parse(localStorage.getItem(JOBS_INDEX_KEY) || '[]');
};

const saveJobIds = (ids: string[]) => {
  localStorage.setItem(JOBS_INDEX_KEY, JSON.stringify(ids));
};

// Job file path helpers
const getMetaPath = (jobId: string) => `${JOB_META_PREFIX}${jobId}${JOB_META_SUFFIX}`;
const getColumnsPath = (jobId: string) => `${JOB_META_PREFIX}${jobId}${JOB_COLUMNS_SUFFIX}`;
const getFlagsPath = (jobId: string) => `${JOB_META_PREFIX}${jobId}${JOB_FLAGS_SUFFIX}`;
const getDataPath = (jobId: string) => `${JOB_META_PREFIX}${jobId}${JOB_DATA_SUFFIX}`;

// Job functions
export const getJobs = (): CSVJob[] => {
  const jobIds = getJobIds();
  return jobIds.map(id => getJob(id)).filter((job): job is CSVJob => job !== null);
};

export const getJob = (id: string): CSVJob | null => {
  const metaStr = localStorage.getItem(getMetaPath(id));
  const columnsStr = localStorage.getItem(getColumnsPath(id));
  const flagsStr = localStorage.getItem(getFlagsPath(id));
  const dataStr = localStorage.getItem(getDataPath(id));
  
  if (!metaStr || !dataStr) return null;
  
  const meta: JobMetadata = JSON.parse(metaStr);
  const columns: JobColumns = columnsStr ? JSON.parse(columnsStr) : { headers: [], selectedColumns: [] };
  const flags: JobFlags = flagsStr ? JSON.parse(flagsStr) : {};
  const data: JobData = JSON.parse(dataStr);
  
  return {
    id: meta.id,
    name: meta.name,
    uploadDate: meta.uploadDate,
    status: meta.status,
    headers: data.headers,
    data: data.rows,
    visibleColumns: columns.selectedColumns,
    flags,
    totalRows: meta.totalRows,
    flaggedRows: Object.keys(flags).length
  };
};

export const saveJob = (job: CSVJob) => {
  const jobIds = getJobIds();
  if (!jobIds.includes(job.id)) {
    jobIds.push(job.id);
    saveJobIds(jobIds);
  }
  
  // Save metadata.json
  const metadata: JobMetadata = {
    id: job.id,
    name: job.name,
    uploadDate: job.uploadDate,
    status: job.status,
    totalRows: job.totalRows
  };
  localStorage.setItem(getMetaPath(job.id), JSON.stringify(metadata, null, 2));
  
  // Save columns.json
  const columns: JobColumns = {
    headers: job.headers,
    selectedColumns: job.visibleColumns
  };
  localStorage.setItem(getColumnsPath(job.id), JSON.stringify(columns, null, 2));
  
  // Save flags.json
  localStorage.setItem(getFlagsPath(job.id), JSON.stringify(job.flags, null, 2));
  
  // Save data.json (original CSV data)
  const data: JobData = {
    headers: job.headers,
    rows: job.data
  };
  localStorage.setItem(getDataPath(job.id), JSON.stringify(data, null, 2));
};

export const deleteJob = (id: string) => {
  const jobIds = getJobIds().filter(jobId => jobId !== id);
  saveJobIds(jobIds);
  
  // Remove all job files
  localStorage.removeItem(getMetaPath(id));
  localStorage.removeItem(getColumnsPath(id));
  localStorage.removeItem(getFlagsPath(id));
  localStorage.removeItem(getDataPath(id));
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
  const jobIds = getJobIds();
  const nextNum = jobIds.length + 1;
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

// Export all data as JSON (for viewing/debugging)
export const exportAllDataAsJSON = () => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const jobIds = getJobIds();
  
  const csvJobs: Record<string, {
    metadata: JobMetadata | null;
    columns: JobColumns | null;
    flags: JobFlags | null;
    data: JobData | null;
  }> = {};
  
  jobIds.forEach(id => {
    csvJobs[id] = {
      metadata: JSON.parse(localStorage.getItem(getMetaPath(id)) || 'null'),
      columns: JSON.parse(localStorage.getItem(getColumnsPath(id)) || 'null'),
      flags: JSON.parse(localStorage.getItem(getFlagsPath(id)) || 'null'),
      data: JSON.parse(localStorage.getItem(getDataPath(id)) || 'null')
    };
  });
  
  return {
    'data/users.json': users,
    'data/csv_jobs/index.json': jobIds,
    'data/csv_jobs': csvJobs
  };
};

// Import all data from JSON backup
export const importAllDataFromJSON = (jsonString: string) => {
  const data = JSON.parse(jsonString);
  
  // Clear existing data first
  const existingKeys = getStorageStructure();
  existingKeys.forEach(key => localStorage.removeItem(key));
  
  // Restore users
  if (data['data/users.json']) {
    localStorage.setItem(USERS_KEY, JSON.stringify(data['data/users.json']));
  }
  
  // Restore job index
  if (data['data/csv_jobs/index.json']) {
    localStorage.setItem(JOBS_INDEX_KEY, JSON.stringify(data['data/csv_jobs/index.json']));
  }
  
  // Restore individual job files
  if (data['data/csv_jobs']) {
    const csvJobs = data['data/csv_jobs'] as Record<string, {
      metadata: JobMetadata | null;
      columns: JobColumns | null;
      flags: JobFlags | null;
      data: JobData | null;
    }>;
    
    Object.entries(csvJobs).forEach(([jobId, jobData]) => {
      if (jobData.metadata) {
        localStorage.setItem(getMetaPath(jobId), JSON.stringify(jobData.metadata, null, 2));
      }
      if (jobData.columns) {
        localStorage.setItem(getColumnsPath(jobId), JSON.stringify(jobData.columns, null, 2));
      }
      if (jobData.flags) {
        localStorage.setItem(getFlagsPath(jobId), JSON.stringify(jobData.flags, null, 2));
      }
      if (jobData.data) {
        localStorage.setItem(getDataPath(jobId), JSON.stringify(jobData.data, null, 2));
      }
    });
  }
};

// View storage structure (for debugging)
export const getStorageStructure = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('data/')) {
      keys.push(key);
    }
  }
  return keys.sort();
};
