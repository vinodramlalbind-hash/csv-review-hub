import { CSVJob } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Settings, Download, Trash2, Calendar, FileSpreadsheet } from 'lucide-react';
import { exportCSVWithFlags, deleteJob } from '@/lib/storage';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface JobListProps {
  jobs: CSVJob[];
  onManage: (job: CSVJob) => void;
  onRefresh: () => void;
}

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'success',
} as const;

const statusLabels = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const JobList = ({ jobs, onManage, onRefresh }: JobListProps) => {
  const { toast } = useToast();

  const handleDownload = (job: CSVJob) => {
    const csv = exportCSVWithFlags(job);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.name}_flagged.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download Started',
      description: `${job.name}_flagged.csv is being downloaded`,
    });
  };

  const handleDelete = (job: CSVJob) => {
    deleteJob(job.id);
    onRefresh();
    toast({
      title: 'Job Deleted',
      description: `${job.name} has been removed`,
    });
  };

  if (jobs.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No CSV Jobs</h3>
          <p className="text-sm text-muted-foreground">Upload your first CSV file to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">CSV Jobs ({jobs.length})</h2>
      
      <div className="grid gap-4">
        {jobs.map((job) => {
          const progress = job.totalRows > 0 
            ? Math.round((job.flaggedRows / job.totalRows) * 100) 
            : 0;

          return (
            <Card key={job.id} className="shadow-soft hover:shadow-elevated transition-shadow animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground truncate">{job.name}</h3>
                      <Badge variant={statusColors[job.status] as any}>
                        {statusLabels[job.status]}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(job.uploadDate), 'MMM d, yyyy')}
                      </span>
                      <span>{job.totalRows} rows</span>
                      <span>{job.headers.length} columns</span>
                      <span>{job.visibleColumns.length} visible</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onManage(job)}>
                      <Settings className="w-4 h-4" />
                      Manage
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(job)}>
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(job)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
