
import * as XLSX from 'xlsx';
import multer from "multer";
import { Request, Response } from 'express';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export interface ExcelData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
}

export function readExcelFile(buffer: Buffer): ExcelData[] {
  try {
    // Read the Excel file from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const results: ExcelData[] = [];
    
    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      }) as any[][];
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        results.push({
          sheetName,
          headers,
          rows,
          totalRows: rows.length
        });
      }
    });
    
    return results;
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function parseUKConversionFactors(data: ExcelData[]): any[] {
  // Look for the conversion factors sheet (common names)
  const conversionSheet = data.find(sheet => 
    sheet.sheetName.toLowerCase().includes('conversion') ||
    sheet.sheetName.toLowerCase().includes('factor') ||
    sheet.sheetName.toLowerCase().includes('emission')
  );
  
  if (!conversionSheet) {
    return [];
  }
  
  const factors: any[] = [];
  
  // Process rows to extract conversion factors
  conversionSheet.rows.forEach((row, index) => {
    if (row.length >= 3) { // Ensure we have enough columns
      const factor = {
        id: index + 1,
        category: row[0] || '',
        subcategory: row[1] || '',
        activity: row[2] || '',
        unit: row[3] || '',
        co2Factor: parseFloat(row[4]) || 0,
        ch4Factor: parseFloat(row[5]) || 0,
        n2oFactor: parseFloat(row[6]) || 0,
        totalFactor: parseFloat(row[7]) || 0,
        source: 'UK Government Conversion Factors'
      };
      
      // Only add if we have meaningful data
      if (factor.category && factor.totalFactor > 0) {
        factors.push(factor);
      }
    }
  });
  
  return factors;
}
