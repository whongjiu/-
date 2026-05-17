"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";

export default function AdminLogsPage() {
  const [data, setData] = useState<{ logs: Array<{
    id: number; action: string; details: string | null; createdAt: string;
    user: { name: string; role: string };
  }>; total: number }>({ logs: [], total: 0 });
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(() => {
    fetch(`/api/logs?page=${page}&limit=50`).then(r => r.json()).then(d => {
      if (d.success) setData(d.data);
    });
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const roleLabels: Record<string, string> = { admin: "管理员", member: "部员", leader: "负责人" };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-body">工作日志</h1>

      <Card padding="none">
        <div className="divide-y divide-neutral-100">
          {data.logs.map(log => (
            <div key={log.id} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-text-body">{log.user.name}</span>
                <Tag color="neutral">{roleLabels[log.user.role] || log.user.role}</Tag>
                <span className="text-sm text-text-body">{log.action}</span>
              </div>
              {log.details && <p className="text-sm text-text-hint">{log.details}</p>}
              <p className="text-xs text-text-disabled mt-1">
                {new Date(log.createdAt).toLocaleString("zh-CN")}
              </p>
            </div>
          ))}
          {data.logs.length === 0 && <div className="text-center py-8 text-text-disabled">暂无日志</div>}
        </div>
      </Card>

      {data.total > 50 && (
        <div className="flex justify-center gap-2">
          <button
            className="px-4 py-2 rounded-btn bg-bg-card border border-border-light text-sm text-text-body disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </button>
          <button
            className="px-4 py-2 rounded-btn bg-bg-card border border-border-light text-sm text-text-body disabled:opacity-50"
            disabled={page * 50 >= data.total}
            onClick={() => setPage(p => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
