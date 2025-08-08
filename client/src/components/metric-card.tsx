import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  trend?: number;
  icon?: ReactNode;
  color?: 'green' | 'red' | 'neutral';
}

export default function MetricCard({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'neutral'
}: MetricCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-[var(--ca-green-normal)]/20',
          text: 'text-[var(--ca-green-normal)]',
          icon: 'text-[var(--ca-green-normal)]'
        };
      case 'red':
        return {
          bg: 'bg-[var(--ca-red-normal)]/20',
          text: 'text-[var(--ca-red-normal)]',
          icon: 'text-[var(--ca-red-normal)]'
        };
      default:
        return {
          bg: 'bg-[var(--ca-grey-normal)]/20',
          text: 'text-[var(--ca-grey-normal)]',
          icon: 'text-[var(--ca-grey-normal)]'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="text-sm text-[var(--ca-grey-dark)] mb-1">{title}</div>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold text-[var(--ca-grey-darker)]">{value}</div>
          {unit && <span className="text-sm text-[var(--ca-grey-normal)]">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 text-sm ${trend > 0 ? 'text-[var(--ca-green-normal)]' : trend < 0 ? 'text-[var(--ca-red-normal)]' : 'text-[var(--ca-grey-normal)]'
            }`}>
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      {icon && (
        <div className={`w-12 h-12 ${colorClasses.bg} rounded-full flex items-center justify-center`}>
          <div className={colorClasses.icon}>{icon}</div>
        </div>
      )}
    </div>
  );
}
