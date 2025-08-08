import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
  title: string;
  children: ReactNode;
}

export function ChartCard({ title, children }: ChartProps) {
  return (
    <Card className="ca-metric-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[var(--ca-grey-darker)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-center space-x-4" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div 
            className={`w-12 rounded-t mb-2 ${item.color || 'bg-[var(--ca-green-normal)]'}`}
            style={{ 
              height: `${Math.max(20, (item.value / maxValue) * (height - 60))}px` 
            }}
          ></div>
          <div className="text-xs text-[var(--ca-grey-dark)] text-center">
            {item.label}
          </div>
          <div className="text-sm font-semibold text-center">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  size?: number;
}

export function ProgressRing({ value, max, label, size = 120 }: ProgressRingProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--ca-grey-light)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--ca-green-normal)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">
              {value}
            </div>
            <div className="text-xs text-[var(--ca-grey-dark)]">
              {label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
