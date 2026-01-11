import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { JobSelector } from '@/components/intern/JobSelector';
import { RowReviewer } from '@/components/intern/RowReviewer';
import { CSVJob } from '@/types';
import { getJobs } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, CheckCircle, Clock } from 'lucide-react';

const InternDashboard = () => {
  const [jobs, setJobs] = useState<CSVJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<CSVJob | null>(null);

  const loadJobs = () => {
    const allJobs = getJobs();
    // Filter jobs that have visible columns configured
    setJobs(allJobs.filter(j => j.visibleColumns.length > 0));
    
    // Refresh selected job if exists
    if (selectedJob) {
      const updated = allJobs.find(j => j.id === selectedJob.id);
      if (updated) setSelectedJob(updated);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  if (selectedJob) {
    return (
      <Layout>
        <RowReviewer 
          job={selectedJob} 
          onBack={() => {
            setSelectedJob(null);
            loadJobs();
          }}
          onUpdate={loadJobs}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Intern Dashboard</h1>
          <p className="text-muted-foreground">Review and flag CSV data rows</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">New</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <JobSelector jobs={jobs} onSelect={setSelectedJob} />
      </div>
    </Layout>
  );
};

export default InternDashboard;
