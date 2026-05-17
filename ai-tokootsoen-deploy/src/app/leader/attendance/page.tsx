"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import NameCard from "@/components/ui/NameCard";

export default function LeaderAttendancePage() {
  const router = useRouter();
  const [names, setNames] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, "present" | "absent">>({});
  const [finished, setFinished] = useState(false);
  const [listId, setListId] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      if (!d.success || !d.data.rollCallList) {
        setLoading(false);
        return;
      }
      const list = d.data.rollCallList;
      setListId(list.id);
      const nameList = JSON.parse(list.names);

      // Check if attendance already exists
      if (list.attendances && list.attendances.length > 0) {
        setHasExisting(true);
        const existing: Record<string, "present" | "absent"> = {};
        list.attendances.forEach((a: { studentName: string; status: string }) => {
          existing[a.studentName] = a.status === "present" ? "present" : "absent";
        });
        setStatuses(existing);
      }

      setNames(nameList);
      setLoading(false);
    });
  }, []);

  const currentName = names[currentIndex];

  const handleStatus = useCallback((status: "present" | "absent") => {
    if (!currentName) return;
    setHistory(prev => [...prev, currentName]);
    setStatuses(prev => ({ ...prev, [currentName]: status }));
    if (currentIndex < names.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setFinished(true);
    }
  }, [currentName, currentIndex, names.length]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const lastName = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setStatuses(prev => {
      const updated = { ...prev };
      delete updated[lastName];
      return updated;
    });
    const idx = names.indexOf(lastName);
    if (idx >= 0) setCurrentIndex(idx);
  }, [history, names]);

  const submitAttendance = async (): Promise<boolean> => {
    const attendances = names.map(name => ({
      studentName: name,
      status: statuses[name] || "absent",
    }));
    const res = await fetch("/api/rollcalls", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollCallId: listId, attendances }),
    });
    const d = await res.json();
    return d.success;
  };

  const handleSubmitAttendance = async () => {
    await submitAttendance();
    setFinished(false);
    router.push("/leader/leave");
  };

  const handleReturnAndSubmit = async () => {
    const ok = await submitAttendance();
    if (ok) {
      setFinished(false);
      router.push("/leader");
    }
  };

  if (loading) return <div className="text-center py-12 text-text-hint">加载中...</div>;
  if (names.length === 0) return (
    <div className="text-center py-12">
      <p className="text-text-hint mb-4">请先录用班级名单</p>
      <Button onClick={() => router.push("/leader/enroll")}>去录用名单</Button>
    </div>
  );

  const absCount = Object.values(statuses).filter(s => s === "absent").length;
  const prCount = Object.values(statuses).filter(s => s === "present").length;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-text-hint">
        <span>点名进度</span>
        <span>{currentIndex + 1} / {names.length}</span>
      </div>
      <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-400 rounded-full transition-all duration-300"
          style={{ width: `${Math.round((currentIndex / names.length) * 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-center">
        <div className="flex-1">
          <div className="text-lg font-bold text-success-500">{prCount}</div>
          <div className="text-xs text-text-hint">已到</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-danger-500">{absCount}</div>
          <div className="text-xs text-text-hint">未到</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-text-hint">{names.length - prCount - absCount}</div>
          <div className="text-xs text-text-hint">待点</div>
        </div>
      </div>

      {/* Current student name - large display */}
      {currentName && (
        <Card className="text-center py-8">
          <p className="text-xs text-text-disabled mb-2">当前点名</p>
          <p className="text-3xl font-bold text-text-body">{currentName}</p>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-4">
        <Button
          variant="danger"
          size="xl"
          fullWidth
          onClick={() => handleStatus("absent")}
        >
          未到
        </Button>
        <Button
          variant="success"
          size="xl"
          fullWidth
          onClick={() => handleStatus("present")}
        >
          到
        </Button>
      </div>

      {/* Undo button */}
      {history.length > 0 && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={handleUndo}>
            ↩ 返回上一个
          </Button>
        </div>
      )}

      {/* Finish modal */}
      <Modal
        open={finished}
        onClose={() => {}}
        title="点名完成"
      >
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-success-500">已到: {prCount}人</span>
            <span className="text-danger-500">未到: {absCount}人</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button fullWidth variant="primary" onClick={handleSubmitAttendance}>
            提交点名结果
          </Button>
          <Button fullWidth variant="ghost" onClick={() => {
            setStatuses({});
            setCurrentIndex(0);
            setHistory([]);
            setFinished(false);
          }}>
            重新点名
          </Button>
          <Button fullWidth variant="ghost" onClick={handleReturnAndSubmit}>
            返回并提交
          </Button>
        </div>
      </Modal>
    </div>
  );
}
