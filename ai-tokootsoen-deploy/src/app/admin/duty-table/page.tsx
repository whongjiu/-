"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import { getDayName } from "@/lib/utils";

export default function DutyTablePage() {
  const [schedules, setSchedules] = useState<Array<{
    id: number; dayOfWeek: number;
    member: { id: number; name: string };
    dormitory: { id: number; building: string };
  }>>([]);

  const fetchData = useCallback(() => {
    fetch("/api/schedules").then(r => r.json()).then(d => {
      if (d.success) setSchedules(d.data);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const days = [1, 2, 3, 4, 5, 7]; // 周一至周五+周日

  // Group by dayOfWeek
  const byDay: Record<number, typeof schedules> = {};
  for (const d of days) {
    byDay[d] = schedules.filter(s => s.dayOfWeek === d);
  }

  // Get all unique member names across all days
  const memberNames = [...new Set(schedules.map(s => s.member?.name).filter(Boolean))];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-body">详细值班表</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-bg-card rounded-card shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-primary-50">
              <th className="px-4 py-3 text-sm font-semibold text-primary-600 border-b border-primary-100 text-left">
                值班人员
              </th>
              {days.map(day => (
                <th key={day} className="px-4 py-3 text-sm font-semibold text-primary-600 border-b border-primary-100 text-center min-w-[140px]">
                  {getDayName(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {memberNames.length > 0 ? (
              memberNames.map(name => (
                <tr key={name} className="hover:bg-bg-page transition-colors">
                  <td className="px-4 py-3 border-b border-border-light font-medium text-text-body">
                    {name}
                  </td>
                  {days.map(day => {
                    const entry = byDay[day]?.find(s => s.member?.name === name);
                    return (
                      <td key={day} className="px-4 py-3 border-b border-border-light text-center">
                        {entry ? (
                          <span className="inline-block px-3 py-1.5 rounded-btn bg-warning-50 text-primary-600 text-sm font-medium">
                            📍 {entry.dormitory?.building}
                          </span>
                        ) : (
                          <span className="text-text-disabled">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-disabled">
                  暂无排班数据，请先在"值班排班"中配置
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Per-day detail */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-3">
        {days.map(day => (
          <Card key={day} className="text-center">
            <h4 className="text-sm font-semibold text-primary-600 mb-2">{getDayName(day)}</h4>
            {byDay[day]?.length > 0 ? (
              <div className="space-y-2">
                {byDay[day].map(s => (
                  <div key={s.id} className="text-sm">
                    <div className="font-medium text-text-body">{s.member?.name}</div>
                    <div className="text-xs text-primary-500">📍 {s.dormitory?.building}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-disabled">暂未安排</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
