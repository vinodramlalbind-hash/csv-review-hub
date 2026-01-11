import { useCallback } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { parseCSV, generateJobId, saveJob } from '@/lib/storage';
import { CSVJob } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CSVUploaderProps {
  onUpload: () => void;
}

export const CSVUploader = ({ onUpload }: CSVUploaderProps) => {
  const { toast } = useToast();

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a CSV file`,
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const { headers, data } = parseCSV(content);

          const job: CSVJob = {
            id: generateJobId(),
            name: file.name.replace('.csv', ''),
            uploadDate: new Date().toISOString(),
            status: 'pending',
            data,
            headers,
            visibleColumns: headers,
            flags: {},
            totalRows: data.length,
            flaggedRows: 0,
          };

          saveJob(job);
          toast({
            title: 'CSV Uploaded',
            description: `${file.name} uploaded successfully with ${data.length} rows`,
          });
          onUpload();
        } catch (err) {
          toast({
            title: 'Parse Error',
            description: `Failed to parse ${file.name}`,
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    });
  }, [onUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <label className="block p-8 cursor-pointer">
        <input
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Upload CSV Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop CSV files here, or click to browse
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Supports multiple file uploads</span>
          </div>
        </div>
      </label>
    </Card>
  );
};
