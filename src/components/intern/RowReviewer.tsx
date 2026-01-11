import { useState, useEffect } from 'react';
import { CSVJob, FLAG_OPTIONS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { saveJob } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RowReviewerProps {
  job: CSVJob;
  onBack: () => void;
  onUpdate: () => void;
}

const ROWS_PER_PAGE = 10;

export const RowReviewer = ({ job, onBack, onUpdate }: RowReviewerProps) => {
  const [flags, setFlags] = useState<Record<number, number>>(job.flags);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  const totalPages = Math.ceil(job.totalRows / ROWS_PER_PAGE);
  const startRow = currentPage * ROWS_PER_PAGE;
  const endRow = Math.min(startRow + ROWS_PER_PAGE, job.totalRows);
  const currentRows = job.data.slice(startRow, endRow);

  const flaggedCount = Object.keys(flags).length;
  const progress = job.totalRows > 0 ? Math.round((flaggedCount / job.totalRows) * 100) : 0;

  const setFlag = (rowIndex: number, value: number) => {
    setFlags(prev => ({ ...prev, [rowIndex]: value }));
  };

  const handleSave = () => {
    const status = flaggedCount === job.totalRows ? 'completed' : 'in_progress';
    const updatedJob: CSVJob = {
      ...job,
      flags,
      flaggedRows: flaggedCount,
      status,
    };
    saveJob(updatedJob);
    onUpdate();
    toast({
      title: 'Progress Saved',
      description: `${flaggedCount} of ${job.totalRows} rows flagged`,
    });
  };

  const getButtonVariant = (flagValue: number) => {
    switch (flagValue) {
      case 1: return 'flagAbsent';
      case 2: return 'flagGood';
      case 3: return 'flagBad';
      case 4: return 'flagVeryBad';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{job.name}</h2>
            <p className="text-sm text-muted-foreground">Review and flag each row</p>
          </div>
        </div>
        
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" />
          Save Progress
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium text-foreground">
              {flaggedCount} / {job.totalRows} rows ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Rows {startRow + 1} - {endRow} of {job.totalRows}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left p-3 font-medium text-foreground w-12">#</th>
                  {job.visibleColumns.map((header) => (
                    <th key={header} className="text-left p-3 font-medium text-foreground">
                      {header}
                    </th>
                  ))}
                  <th className="text-left p-3 font-medium text-foreground min-w-[280px]">Flag</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => {
                  const actualRowIndex = startRow + idx;
                  const currentFlag = flags[actualRowIndex];

                  return (
                    <tr 
                      key={actualRowIndex} 
                      className={cn(
                        "border-b border-border transition-colors",
                        currentFlag ? "bg-muted/30" : "hover:bg-muted/20"
                      )}
                    >
                      <td className="p-3 text-muted-foreground font-mono text-xs">
                        {actualRowIndex + 1}
                      </td>
                      {job.visibleColumns.map((header) => {
                        const colIndex = job.headers.indexOf(header);
                        return (
                          <td key={header} className="p-3 text-foreground">
                            {row[colIndex] || '-'}
                          </td>
                        );
                      })}
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {FLAG_OPTIONS.map((option) => (
                            <Button
                              key={option.value}
                              variant={currentFlag === option.value ? getButtonVariant(option.value) : 'outline'}
                              size="xs"
                              onClick={() => setFlag(actualRowIndex, option.value)}
                              className={cn(
                                "transition-all",
                                currentFlag === option.value && "ring-2 ring-offset-1"
                              )}
                            >
                              {currentFlag === option.value && <Check className="w-3 h-3" />}
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Page
        </Button>
        
        <Button onClick={handleSave} variant="accent">
          <Save className="w-4 h-4" />
          Save & Continue
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage >= totalPages - 1}
        >
          Next Page
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
