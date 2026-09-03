import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>

      {/* Main Section Skeleton */}
      <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-60 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-60 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
};
