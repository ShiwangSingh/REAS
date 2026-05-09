import { cn } from '@/lib/utils';
import { AlertSeverity } from '@/types';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
  {
    variants: {
      severity: {
        critical: 'bg-alert-critical/20 text-alert-critical border border-alert-critical/30',
        high: 'bg-alert-high/20 text-alert-high border border-alert-high/30',
        medium: 'bg-alert-medium/20 text-alert-medium border border-alert-medium/30',
        info: 'bg-alert-info/20 text-alert-info border border-alert-info/30',
      },
    },
    defaultVariants: {
      severity: 'info',
    },
  }
);

interface AlertBadgeProps extends VariantProps<typeof badgeVariants> {
  severity: AlertSeverity;
  className?: string;
  children?: React.ReactNode;
}

export function AlertBadge({ severity, className, children }: AlertBadgeProps) {
  return (
    <span className={cn(badgeVariants({ severity }), className)}>
      {children || severity}
    </span>
  );
}
