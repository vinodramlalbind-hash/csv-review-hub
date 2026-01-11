import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, AlertTriangle, CheckCircle, FileJson } from 'lucide-react';
import { exportAllDataAsJSON, importAllDataFromJSON, getStorageStructure } from '@/lib/storage';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DataBackupProps {
  onRestore: () => void;
}

export const DataBackup = ({ onRestore }: DataBackupProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<string | null>(null);
  const [showStructure, setShowStructure] = useState(false);
  const [structure, setStructure] = useState<string[]>([]);

  const handleExport = () => {
    try {
      const data = exportAllDataAsJSON();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `csv-review-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        // Validate JSON structure
        const parsed = JSON.parse(content);
        if (!parsed['data/users.json'] || !parsed['data/csv_jobs/index.json']) {
          toast.error('Invalid backup file format');
          return;
        }
        setPendingData(content);
        setShowConfirm(true);
      } catch {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestore = () => {
    if (!pendingData) return;
    
    try {
      importAllDataFromJSON(pendingData);
      toast.success('Data restored successfully!');
      onRestore();
    } catch (error) {
      toast.error('Failed to restore data');
      console.error(error);
    } finally {
      setPendingData(null);
      setShowConfirm(false);
    }
  };

  const handleViewStructure = () => {
    setStructure(getStorageStructure());
    setShowStructure(!showStructure);
  };

  return (
    <>
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileJson className="w-5 h-5" />
            Data Backup & Restore
          </CardTitle>
          <CardDescription>
            Export all data as JSON or restore from a backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export All Data
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Backup
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <Collapsible open={showStructure} onOpenChange={setShowStructure}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewStructure}
                className="text-muted-foreground"
              >
                {showStructure ? 'Hide' : 'View'} Storage Structure
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 p-3 bg-muted rounded-lg font-mono text-sm">
                <div className="text-muted-foreground mb-2">Files in localStorage:</div>
                {structure.length === 0 ? (
                  <div className="text-muted-foreground italic">No data files found</div>
                ) : (
                  <ul className="space-y-1">
                    {structure.map((path) => (
                      <li key={path} className="text-foreground flex items-center gap-2">
                        <FileJson className="w-3 h-3 text-primary" />
                        {path}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Data Restore
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will replace ALL existing data with the backup file contents. 
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-destructive hover:bg-destructive/90">
              <CheckCircle className="w-4 h-4 mr-2" />
              Restore Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
