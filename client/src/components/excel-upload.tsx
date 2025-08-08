
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';

interface ExcelData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
}

interface ConversionFactor {
  id: number;
  category: string;
  subcategory: string;
  activity: string;
  unit: string;
  co2Factor: number;
  ch4Factor: number;
  n2oFactor: number;
  totalFactor: number;
  source: string;
}

export function ExcelUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [excelData, setExcelData] = useState<ExcelData[] | null>(null);
  const [conversionFactors, setConversionFactors] = useState<ConversionFactor[] | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExcelData(null);
      setConversionFactors(null);
    }
  };

  const uploadGenericExcel = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setExcelData(result.data);
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadConversionFactors = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await fetch('/api/upload-conversion-factors', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setConversionFactors(result.data);
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadData = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Excel File Reader
          </CardTitle>
          <CardDescription>
            Upload Excel files including UK Government conversion factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-file">Select Excel File</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {file && (
            <div className="flex gap-2">
              <Button 
                onClick={uploadGenericExcel} 
                disabled={loading}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Read Excel Data
              </Button>
              <Button 
                onClick={uploadConversionFactors} 
                disabled={loading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Parse as Conversion Factors
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-sm text-muted-foreground">
              Processing file...
            </div>
          )}
        </CardContent>
      </Card>

      {excelData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Excel Data Summary
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(excelData, 'excel-data.json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {excelData.map((sheet, index) => (
                <div key={index} className="border rounded p-4">
                  <h3 className="font-semibold mb-2">{sheet.sheetName}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {sheet.totalRows} rows, {sheet.headers.length} columns
                  </p>
                  <div className="text-xs">
                    <strong>Headers:</strong> {sheet.headers.slice(0, 5).join(', ')}
                    {sheet.headers.length > 5 && '...'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {conversionFactors && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Conversion Factors ({conversionFactors.length})
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(conversionFactors, 'conversion-factors.json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Activity</th>
                    <th className="text-left p-2">Unit</th>
                    <th className="text-left p-2">CO2 Factor</th>
                    <th className="text-left p-2">Total Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionFactors.slice(0, 50).map((factor) => (
                    <tr key={factor.id} className="border-b">
                      <td className="p-2">{factor.category}</td>
                      <td className="p-2">{factor.activity}</td>
                      <td className="p-2">{factor.unit}</td>
                      <td className="p-2">{factor.co2Factor}</td>
                      <td className="p-2">{factor.totalFactor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {conversionFactors.length > 50 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing first 50 of {conversionFactors.length} factors
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
