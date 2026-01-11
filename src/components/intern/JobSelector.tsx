import { CSVJob } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Calendar, FileSpreadsheet, Columns } from 'lucide-react';
import { format } from 'date-fns';

interface JobSelectorProps {
  jobs: CSVJob[];
  onSelect: (job: CSVJob) => void;
}

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  completed: 'success',
} as const;

const statusLabels = {
  pending: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export const JobSelector = ({ jobs, onSelect }: JobSelectorProps) => {
  if (jobs.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Tasks Available</h3>
          <p className="text-sm text-muted-foreground">Check back later for new CSV review tasks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Available Tasks ({jobs.length})</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => {
          const progress = job.totalRows > 0 
            ? Math.round((job.flaggedRows / job.totalRows) * 100) 
            : 0;

          return (
            <Card 
              key={job.id} 
              className="shadow-soft hover:shadow-elevated transition-all cursor-pointer group animate-fade-in"
              onClick={() => onSelect(job)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant={statusColors[job.status] as any}>
                    {statusLabels[job.status]}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-foreground mb-2 truncate">{job.name}</h3>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(job.uploadDate), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Columns className="w-4 h-4" />
                    {job.visibleColumns.length} columns · {job.totalRows} rows
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <Button className="w-full group-hover:bg-primary/90" size="sm">
                  {job.status === 'completed' ? 'View' : 'Start Review'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
