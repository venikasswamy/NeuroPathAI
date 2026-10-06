'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="w-4 h-4 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-destructive text-sm flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-xs font-bold">!</span>
        {message}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    MASTERED: 'bg-green-100 text-green-700 border-green-200',
    DEVELOPING: 'bg-blue-100 text-blue-700 border-blue-200',
    NEEDS_REVISION: 'bg-orange-100 text-orange-700 border-orange-200',
    NOT_STARTED: 'bg-gray-100 text-gray-600 border-gray-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    STABLE: 'bg-green-100 text-green-700 border-green-200',
    WATCH: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    DRIFTING: 'bg-red-100 text-red-700 border-red-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    mastered: 'bg-green-100 text-green-700 border-green-200',
    developing: 'bg-blue-100 text-blue-700 border-blue-200',
    weak: 'bg-orange-100 text-orange-700 border-orange-200',
    missing: 'bg-gray-100 text-gray-600 border-gray-200',
    available: 'bg-blue-100 text-blue-700 border-blue-200',
    locked: 'bg-gray-100 text-gray-500 border-gray-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    delayed: 'bg-orange-100 text-orange-700 border-orange-200',
    'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
    )}>
      {label}
    </span>
  );
}
