import { useState } from 'react';
import { CSVJob } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { saveJob } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface ColumnSelectorProps {
  job: CSVJob;
  onBack: () => void;
  onUpdate: () => void;
}

export const ColumnSelector = ({ job, onBack, onUpdate }: ColumnSelectorProps) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(job.visibleColumns);
  const { toast } = useToast();

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => 
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  };

  const selectAll = () => setVisibleColumns([...job.headers]);
  const selectNone = () => setVisibleColumns([]);

  const handleSave = () => {
    const updatedJob = { ...job, visibleColumns };
    saveJob(updatedJob);
    onUpdate();
    toast({
      title: 'Columns Updated',
      description: `${visibleColumns.length} columns are now visible to interns`,
    });
    onBack();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{job.name}</h2>
          <p className="text-sm text-muted-foreground">Select columns visible to interns</p>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Column Visibility</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                <Eye className="w-4 h-4" />
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                <EyeOff className="w-4 h-4" />
                Select None
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {job.headers.map((header) => (
              <div 
                key={header}
                className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={header}
                  checked={visibleColumns.includes(header)}
                  onCheckedChange={() => toggleColumn(header)}
                />
                <Label 
                  htmlFor={header} 
                  className="text-sm font-medium cursor-pointer flex-1 truncate"
                >
                  {header}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {visibleColumns.length} of {job.headers.length} columns selected
            </p>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Data Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {visibleColumns.map((header) => (
                    <th key={header} className="text-left p-3 font-medium text-foreground bg-muted">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {job.data.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border">
                    {visibleColumns.map((header) => {
                      const colIndex = job.headers.indexOf(header);
                      return (
                        <td key={header} className="p-3 text-muted-foreground">
                          {row[colIndex] || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {job.data.length > 5 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Showing first 5 of {job.data.length} rows
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
