import { Alert } from '@/types';
import { AlertBadge } from './AlertBadge';
import { ALERT_CONFIG } from '@/data/mockData';
import { ThumbsUp, CheckCircle, MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
  compact?: boolean;
}

export function AlertCard({ alert, onClick, compact }: AlertCardProps) {
  const config = ALERT_CONFIG[alert.type];
  const timeAgo = formatDistanceToNow(new Date(alert.reportedAt), { addSuffix: true });

  return (
    <div
      onClick={onClick}
      className={`group relative flex gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/40 hover:bg-card/80 cursor-pointer ${compact ? 'p-2' : 'p-3'}`}
    >
      {/* Severity indicator line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-${config.color}`} />

      <div className="flex-1 pl-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground leading-tight">{alert.title}</h4>
          <AlertBadge severity={alert.severity} />
        </div>

        {!compact && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{alert.description}</p>
        )}

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {alert.location.road ? `${alert.location.road}, ${alert.location.city}` : alert.location.city}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {alert.upvotes}
          </span>
          {alert.verified && (
            <span className="flex items-center gap-1 text-alert-info">
              <CheckCircle className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
