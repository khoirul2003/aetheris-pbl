"use client";

import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 3 }: TableSkeletonProps) {
  return (
    <div className="w-full">
      <table className="w-full text-left table-auto">
        <thead className="text-[11px] uppercase font-medium" style={{ backgroundColor: "var(--table-head-bg)", color: "var(--card-text-muted)", borderBottomWidth: 1, borderBottomColor: "var(--table-border)" }}>
          <tr>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <th key={`head-${colIdx}`} className="px-5 py-3">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y text-sm" style={{ backgroundColor: "var(--table-body-bg)", color: "var(--card-text)", borderColor: "var(--table-border)" }}>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={`row-${rowIdx}`}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={`cell-${rowIdx}-${colIdx}`} className="px-5 py-4">
                  <div className="h-4 w-full max-w-[150px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
