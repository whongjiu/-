"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

export default function LeaderHomePage() {
  const router = useRouter();
  const [data, setData] = useState<{
    hasEnrolled: boolean;
    rollCallList: {
      id: number; names: string; class: { name: string };
      attendances: Array<{ studentName: string; status: string }>;
    } | null;
    className: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      if (d.success) setData(d.data);
    });
  }, []);

  if (!data) return <div className="text-center py-12 text-text-hint">加载中...</div>;

  const hasDoneAttendance = data.rollCallList?.attendances &&
    data.rollCallList.attendances.length > 0;

  return (
    <div className="space-y-6">
      {/* User identity display */}
      <div className="text-sm text-text-hint">
        {data.className ? `当前班级: ${data.className}` : "未分配班级"}
      </div>

      {/* Large enrollment button */}
      {!data.hasEnrolled ? (
        <Card className="text-center py-8">
          <div className="text-3xl mb-2">📋</div>
          <p className="text-text-body mb-4">请先录用班级名单以解锁全部功能</p>
          <Button
            variant="warning"
            size="xl"
            fullWidth
            onClick={() => router.push("/leader/enroll")}
          >
            录用班级名单
          </Button>
        </Card>
      ) : (
        <>
          {/* Feature buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              className={`p-4 rounded-card text-center transition-all ${
                hasDoneAttendance
                  ? "bg-bg-card shadow-card border border-border-light"
                  : "bg-bg-card shadow-card border border-border-light"
              }`}
              onClick={() => router.push("/leader/attendance")}
            >
              <div className="text-2xl mb-1">📝</div>
              <div className="text-xs font-medium text-text-body">
                {hasDoneAttendance ? "点名系统" : "开始点名"}
              </div>
              {hasDoneAttendance && (
                <Tag color="success">已完成</Tag>
              )}
            </button>
            <button
              className="p-4 rounded-card text-center bg-bg-card shadow-card border border-border-light"
              onClick={() => router.push("/leader/leave")}
            >
              <div className="text-2xl mb-1">📎</div>
              <div className="text-xs font-medium text-text-body">请假审核</div>
            </button>
            <button
              className="p-4 rounded-card text-center bg-bg-card shadow-card border border-border-light"
              onClick={() => router.push("/leader/duty")}
            >
              <div className="text-2xl mb-1">📅</div>
              <div className="text-xs font-medium text-text-body">今日值日</div>
            </button>
          </div>

          {/* Roll call summary */}
          {data.rollCallList && hasDoneAttendance && (
            <Card>
              <h3 className="font-semibold text-text-body mb-3">点名概况</h3>
              {(() => {
                const pr = data.rollCallList.attendances.filter(a => a.status === "present");
                const abs = data.rollCallList.attendances.filter(a => a.status === "absent");
                const lv = data.rollCallList.attendances.filter(a => a.status === "leave");
                return (
                  <div className="flex gap-3 text-center">
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-success-500">{pr.length}</div>
                      <div className="text-xs text-text-hint">已到</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-danger-500">{abs.length}</div>
                      <div className="text-xs text-text-hint">未到</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold text-primary-400">{lv.length}</div>
                      <div className="text-xs text-text-hint">请假</div>
                    </div>
                  </div>
                );
              })()}
            </Card>
          )}

          {/* Re-entry to enrollment */}
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => router.push("/leader/enroll")}
          >
            查看已录用名单
          </Button>
        </>
      )}
    </div>
  );
}
