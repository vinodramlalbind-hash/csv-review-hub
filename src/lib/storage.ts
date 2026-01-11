import { User, CSVJob } from '@/types';

// File structure (simulated in localStorage):
// /data/users.json
// /csv_jobs/job_XXX/original.csv
// /csv_jobs/job_XXX/updated.csv
// /csv_jobs/job_XXX/columns.json
// /csv_jobs/job_XXX/flags.json
// /csv_jobs/job_XXX/metadata.json

const USERS_PATH = '/data/users.json';
const AUTH_PATH = '/data/auth.json';
const JOBS_INDEX_PATH = '/csv_jobs/index.json';

// Path builders for job files
const getJobPath = (jobId: string) => `/csv_jobs/${jobId}`;
const getMetaPath = (jobId: string) => `${getJobPath(jobId)}/metadata.json`;
const getColumnsPath = (jobId: string) => `${getJobPath(jobId)}/columns.json`;
const getFlagsPath = (jobId: string) => `${getJobPath(jobId)}/flags.json`;
const getOriginalCsvPath = (jobId: string) => `${getJobPath(jobId)}/original.csv`;
const getUpdatedCsvPath = (jobId: string) => `${getJobPath(jobId)}/updated.csv`;

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
  visibleColumns: string[];
}

interface JobFlags {
  [rowIndex: string]: number;
}

// Initialize default users
export const initializeStorage = () => {
  const users = localStorage.getItem(USERS_PATH);
  if (!users) {
    const defaultUsers: User[] = [
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'intern1', password: 'intern123', role: 'intern' },
      { username: 'intern2', password: 'intern123', role: 'intern' },
    ];
    localStorage.setItem(USERS_PATH, JSON.stringify(defaultUsers, null, 2));
  }
  
  const jobsIndex = localStorage.getItem(JOBS_INDEX_PATH);
  if (!jobsIndex) {
    localStorage.setItem(JOBS_INDEX_PATH, JSON.stringify([], null, 2));
  }
};

// Auth functions
export const authenticate = (username: string, password: string): User | null => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_PATH) || '[]');
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(AUTH_PATH, JSON.stringify(user, null, 2));
    return user;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const auth = localStorage.getItem(AUTH_PATH);
  return auth ? JSON.parse(auth) : null;
};

export const logout = () => {
  localStorage.removeItem(AUTH_PATH);
};

// Job index functions
const getJobIds = (): string[] => {
  return JSON.parse(localStorage.getItem(JOBS_INDEX_PATH) || '[]');
};

const saveJobIds = (ids: string[]) => {
  localStorage.setItem(JOBS_INDEX_PATH, JSON.stringify(ids, null, 2));
};

// CSV string conversion utilities
const arrayToCSV = (headers: string[], rows: string[][]): string => {
  const headerLine = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const dataLines = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
};

const csvToArray = (csvContent: string): { headers: string[]; rows: string[][] } => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };
  
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  
  return { headers, rows };
};

// Job functions
export const getJobs = (): CSVJob[] => {
  const jobIds = getJobIds();
  return jobIds.map(id => getJob(id)).filter((job): job is CSVJob => job !== null);
};

export const getJob = (id: string): CSVJob | null => {
  const metaStr = localStorage.getItem(getMetaPath(id));
  const columnsStr = localStorage.getItem(getColumnsPath(id));
  const flagsStr = localStorage.getItem(getFlagsPath(id));
  const originalCsv = localStorage.getItem(getOriginalCsvPath(id));
  
  if (!metaStr || !originalCsv) return null;
  
  const meta: JobMetadata = JSON.parse(metaStr);
  const columns: JobColumns = columnsStr ? JSON.parse(columnsStr) : { headers: [], visibleColumns: [] };
  const flags: JobFlags = flagsStr ? JSON.parse(flagsStr) : {};
  const { headers, rows } = csvToArray(originalCsv);
  
  return {
    id: meta.id,
    name: meta.name,
    uploadDate: meta.uploadDate,
    status: meta.status,
    headers: headers,
    data: rows,
    visibleColumns: columns.visibleColumns,
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
    visibleColumns: job.visibleColumns
  };
  localStorage.setItem(getColumnsPath(job.id), JSON.stringify(columns, null, 2));
  
  // Save flags.json
  localStorage.setItem(getFlagsPath(job.id), JSON.stringify(job.flags, null, 2));
  
  // Save original.csv (original CSV data)
  const originalCsv = arrayToCSV(job.headers, job.data);
  localStorage.setItem(getOriginalCsvPath(job.id), originalCsv);
  
  // Save updated.csv (CSV with intern flags)
  const updatedHeaders = [...job.headers, 'intern_flag'];
  const updatedRows = job.data.map((row, index) => {
    const flag = job.flags[index] !== undefined ? String(job.flags[index]) : '';
    return [...row, flag];
  });
  const updatedCsv = arrayToCSV(updatedHeaders, updatedRows);
  localStorage.setItem(getUpdatedCsvPath(job.id), updatedCsv);
};

export const deleteJob = (id: string) => {
  const jobIds = getJobIds().filter(jobId => jobId !== id);
  saveJobIds(jobIds);
  
  // Remove all job files
  localStorage.removeItem(getMetaPath(id));
  localStorage.removeItem(getColumnsPath(id));
  localStorage.removeItem(getFlagsPath(id));
  localStorage.removeItem(getOriginalCsvPath(id));
  localStorage.removeItem(getUpdatedCsvPath(id));
};

// CSV parsing (for file upload)
export const parseCSV = (content: string): { headers: string[]; data: string[][] } => {
  const { headers, rows } = csvToArray(content);
  return { headers, data: rows };
};

// Generate job ID
export const generateJobId = (): string => {
  const jobIds = getJobIds();
  const nextNum = jobIds.length + 1;
  return `job_${String(nextNum).padStart(3, '0')}`;
};

// Export CSV with flags (returns updated.csv content)
export const exportCSVWithFlags = (job: CSVJob): string => {
  return localStorage.getItem(getUpdatedCsvPath(job.id)) || '';
};

// Export all data as JSON (for backup/viewing)
export const exportAllDataAsJSON = () => {
  const users = JSON.parse(localStorage.getItem(USERS_PATH) || '[]');
  const jobIds = getJobIds();
  
  const csvJobs: Record<string, {
    'metadata.json': JobMetadata | null;
    'columns.json': JobColumns | null;
    'flags.json': JobFlags | null;
    'original.csv': string | null;
    'updated.csv': string | null;
  }> = {};
  
  jobIds.forEach(id => {
    csvJobs[id] = {
      'metadata.json': JSON.parse(localStorage.getItem(getMetaPath(id)) || 'null'),
      'columns.json': JSON.parse(localStorage.getItem(getColumnsPath(id)) || 'null'),
      'flags.json': JSON.parse(localStorage.getItem(getFlagsPath(id)) || 'null'),
      'original.csv': localStorage.getItem(getOriginalCsvPath(id)),
      'updated.csv': localStorage.getItem(getUpdatedCsvPath(id))
    };
  });
  
  return {
    '/data/users.json': users,
    '/csv_jobs/index.json': jobIds,
    '/csv_jobs': csvJobs
  };
};

// Import all data from JSON backup
export const importAllDataFromJSON = (jsonString: string) => {
  const data = JSON.parse(jsonString);
  
  // Clear existing data first
  const existingKeys = getStorageStructure();
  existingKeys.forEach(key => localStorage.removeItem(key));
  
  // Restore users
  if (data['/data/users.json']) {
    localStorage.setItem(USERS_PATH, JSON.stringify(data['/data/users.json'], null, 2));
  }
  
  // Restore job index
  if (data['/csv_jobs/index.json']) {
    localStorage.setItem(JOBS_INDEX_PATH, JSON.stringify(data['/csv_jobs/index.json'], null, 2));
  }
  
  // Restore individual job files
  if (data['/csv_jobs']) {
    const csvJobs = data['/csv_jobs'] as Record<string, {
      'metadata.json': JobMetadata | null;
      'columns.json': JobColumns | null;
      'flags.json': JobFlags | null;
      'original.csv': string | null;
      'updated.csv': string | null;
    }>;
    
    Object.entries(csvJobs).forEach(([jobId, jobData]) => {
      if (jobData['metadata.json']) {
        localStorage.setItem(getMetaPath(jobId), JSON.stringify(jobData['metadata.json'], null, 2));
      }
      if (jobData['columns.json']) {
        localStorage.setItem(getColumnsPath(jobId), JSON.stringify(jobData['columns.json'], null, 2));
      }
      if (jobData['flags.json']) {
        localStorage.setItem(getFlagsPath(jobId), JSON.stringify(jobData['flags.json'], null, 2));
      }
      if (jobData['original.csv']) {
        localStorage.setItem(getOriginalCsvPath(jobId), jobData['original.csv']);
      }
      if (jobData['updated.csv']) {
        localStorage.setItem(getUpdatedCsvPath(jobId), jobData['updated.csv']);
      }
    });
  }
};

// View storage structure (for debugging)
export const getStorageStructure = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('/data/') || key.startsWith('/csv_jobs/'))) {
      keys.push(key);
    }
  }
  return keys.sort();
};

// Get raw file content (for viewing individual files)
export const getRawFileContent = (path: string): string | null => {
  return localStorage.getItem(path);
};
