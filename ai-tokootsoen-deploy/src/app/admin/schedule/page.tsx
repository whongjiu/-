"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { getDayName } from "@/lib/utils";

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<Array<{
    id: number; dayOfWeek: number;
    memberId: number; dormitoryId: number;
    member: { id: number; name: string };
    dormitory: { id: number; building: string };
  }>>([]);
  const [members, setMembers] = useState<Array<{ id: number; name: string }>>([]);
  const [dorms, setDorms] = useState<Array<{ id: number; building: string }>>([]);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/schedules").then(r => r.json()).then(d => {
      if (d.success) setSchedules(d.data.map((s: Record<string, unknown>) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        memberId: s.memberId ?? (s.member as Record<string,unknown>)?.id ?? 0,
        dormitoryId: s.dormitoryId ?? (s.dormitory as Record<string,unknown>)?.id ?? 0,
        member: s.member || { id: 0, name: "" },
        dormitory: s.dormitory || { id: 0, building: "" },
      })));
    });
    fetch("/api/users?role=member").then(r => r.json()).then(d => { if (d.success) setMembers(d.data); });
    fetch("/api/dormitories").then(r => r.json()).then(d => { if (d.success) setDorms(d.data); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const days = [1, 2, 3, 4, 5, 7]; // 周一至周五+周日

  const handleSave = async () => {
    const payload = schedules
      .filter(s => s.memberId > 0 && s.dormitoryId > 0)
      .map(s => ({
        dayOfWeek: s.dayOfWeek,
        memberId: s.memberId,
        dormitoryId: s.dormitoryId,
      }));
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schedules: payload }),
    });
    const d = await res.json();
    if (d.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const addEntry = (day: number) => {
    setSchedules([...schedules, {
      id: Date.now(),
      dayOfWeek: day,
      memberId: 0,
      dormitoryId: 0,
      member: { id: 0, name: "" },
      dormitory: { id: 0, building: "" },
    }]);
  };

  const removeEntry = (tempId: number) => {
    setSchedules(schedules.filter(s => s.id !== tempId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">值班排班</h1>
        <Button onClick={handleSave}>{saved ? "✅ 已保存" : "💾 保存排班"}</Button>
      </div>

      <div className="space-y-4">
        {days.map(day => {
          const entries = schedules.filter(s => s.dayOfWeek === day);
          return (
            <Card key={day}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-body">{getDayName(day)}</h3>
                <Button variant="ghost" size="sm" onClick={() => addEntry(day)}>+ 添加</Button>
              </div>
              <div className="space-y-2">
                {entries.map(e => (
                  <div key={e.id} className="flex items-center gap-2 flex-wrap">
                    <select
                      className="px-3 py-2 rounded-btn border border-border-light bg-bg-page text-sm text-text-body"
                      value={e.memberId}
                      onChange={ev => {
                        const mid = parseInt(ev.target.value);
                        const m = members.find(x => x.id === mid);
                        setSchedules(schedules.map(s => s.id === e.id ? { ...s, memberId: mid, member: m || s.member } : s));
                      }}
                    >
                      <option value={0}>选择部员</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <span className="text-sm text-text-hint">值班</span>
                    <select
                      className="px-3 py-2 rounded-btn border border-border-light bg-bg-page text-sm text-text-body"
                      value={e.dormitoryId}
                      onChange={ev => {
                        const did = parseInt(ev.target.value);
                        const d = dorms.find(x => x.id === did);
                        setSchedules(schedules.map(s => s.id === e.id ? { ...s, dormitoryId: did, dormitory: d || s.dormitory } : s));
                      }}
                    >
                      <option value={0}>选择宿舍楼</option>
                      {dorms.map(d => <option key={d.id} value={d.id}>{d.building}</option>)}
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => removeEntry(e.id)}>✕</Button>
                  </div>
                ))}
                {entries.length === 0 && (
                  <p className="text-sm text-text-disabled py-2">暂无安排</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
