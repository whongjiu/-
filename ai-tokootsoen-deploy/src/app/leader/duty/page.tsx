"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import { getDayName, getDayOfWeek } from "@/lib/utils";

export default function LeaderDutyPage() {
  const [duties, setDuties] = useState<Array<{ className: string }>>([]);
  const [myClassName, setMyClassName] = useState<string | null>(null);
  const [dormitoryBuilding, setDormitoryBuilding] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      if (d.success) {
        setDuties(d.data.todayDuties || []);
        setMyClassName(d.data.className || null);
        setDormitoryBuilding(d.data.dormitoryBuilding || null);
        if (d.data.className && d.data.todayDuties) {
          setIsMyTurn(d.data.todayDuties.some((dt: { className: string }) => dt.className === d.data.className));
        }
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-body">今日值日</h1>

      <Card className="text-center py-6">
        <div className="text-3xl mb-2">
          {getDayName(getDayOfWeek())}
        </div>
        <p className="text-sm text-text-hint">
          今日值日班级
          {dormitoryBuilding && (
            <span className="ml-1 text-primary-500 font-medium">· {dormitoryBuilding}</span>
          )}
        </p>
      </Card>

      {dormitoryBuilding && (
        <Card className="text-center py-3 bg-primary-50 border border-primary-100">
          <p className="text-xs text-primary-500">
            仅显示 <span className="font-semibold">{dormitoryBuilding}</span> 的值日安排
          </p>
        </Card>
      )}

      {isMyTurn && (
        <Card className="text-center py-6 bg-primary-50 border-2 border-primary-200">
          <p className="text-sm text-primary-500 mb-2">轮到本班值日</p>
          <p className="text-3xl font-bold text-primary-600">{myClassName}</p>
          <p className="text-xs text-primary-400 mt-1">请认真完成值日任务</p>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-text-body mb-3">
          {dormitoryBuilding ? `${dormitoryBuilding} 值日班级` : "值日班级"}
        </h3>
        {duties.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {duties.map((d, i) => (
              <Tag key={i} color={d.className === myClassName ? "primary" : "warning"}>
                {d.className}
              </Tag>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-text-disabled py-4">今日暂无值日安排</p>
        )}
      </Card>
    </div>
  );
}
