"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Modal from "@/components/ui/Modal";
import { getDayName } from "@/lib/utils";

export default function MemberSchedulePage() {
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [duties, setDuties] = useState<Array<{
    id?: number; classId: number; class?: { id: number; name: string };
    dayOfWeek?: number; order?: number; mode: string;
  }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [saved, setSaved] = useState(false);
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());

  const fetchData = useCallback(() => {
    fetch("/api/member-duties").then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) {
        setDuties(d.data);
        setMode(d.data[0].mode || "daily");
      }
    });
    fetch("/api/classes").then(r => r.json()).then(d => { if (d.success) setClasses(d.data); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    const payload = duties.map((d, i) => ({
      classId: d.classId,
      dayOfWeek: mode === "daily" ? d.dayOfWeek : undefined,
      order: mode === "weekly" ? i : undefined,
    }));
    const res = await fetch("/api/member-duties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duties: payload, mode }),
    });
    const data = await res.json();
    if (data.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const days = [1, 2, 3, 4, 5, 7]; // Mon-Fri + Sun, skip Saturday

  const moveOrder = (from: number, to: number) => {
    const updated = [...duties];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setDuties(updated);
  };

  // Get classes not yet in the duty list
  const availableClasses = classes.filter(c => !duties.find(d => d.classId === c.id));

  const handleMultiAdd = () => {
    if (selectedClasses.size === 0) return;
    const newDuties = [...duties];
    for (const classId of selectedClasses) {
      if (!newDuties.find(d => d.classId === classId)) {
        const cls = classes.find(c => c.id === classId);
        newDuties.push({ classId, class: cls, mode: "weekly", order: newDuties.length });
      }
    }
    setDuties(newDuties);
    setSelectedClasses(new Set());
    setMultiSelectOpen(false);
  };

  const toggleClass = (classId: number) => {
    const next = new Set(selectedClasses);
    if (next.has(classId)) {
      next.delete(classId);
    } else {
      next.add(classId);
    }
    setSelectedClasses(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">管辖班级值日排班</h1>
        <Button onClick={handleSave}>{saved ? "✅ 已保存" : "保存生效"}</Button>
      </div>

      <Card>
        <div className="flex gap-2 mb-4">
          {(["daily", "weekly"] as const).map(m => (
            <button
              key={m}
              className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${mode === m ? "bg-primary-100 text-primary-600" : "bg-bg-hover text-text-hint"}`}
              onClick={() => setMode(m)}
            >
              {m === "daily" ? "每天轮换" : "每周轮换"}
            </button>
          ))}
        </div>

        {mode === "daily" ? (
          <div className="space-y-3">
            <p className="text-sm text-text-hint mb-2">为每个值日天分配一个管辖班级（周六不排班）</p>
            {days.map(day => {
              const duty = duties.find(d => d.dayOfWeek === day);
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-medium text-text-body">{getDayName(day)}</span>
                  <select
                    className="flex-1 px-3 py-2 rounded-btn border border-border-light bg-bg-page text-sm text-text-body"
                    value={duty?.classId || 0}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      if (!val) {
                        setDuties(duties.filter(d => d.dayOfWeek !== day));
                        return;
                      }
                      const exists = duties.find(d => d.dayOfWeek === day);
                      if (exists) {
                        setDuties(duties.map(d => d.dayOfWeek === day ? { ...d, classId: val } : d));
                      } else {
                        setDuties([...duties, { classId: val, dayOfWeek: day, mode: "daily" }]);
                      }
                    }}
                  >
                    <option value={0}>不安排</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-text-hint mb-3">
              按周循环轮换管辖班级。使用箭头拖拽排序，系统自动生成每周循环值日表。
            </p>

            {/* Current duty list */}
            {duties.map((d, i) => (
              <div key={d.classId} className="flex items-center gap-2 p-3 bg-bg-page rounded-btn">
                <div className="flex flex-col gap-1">
                  <button
                    className="text-text-hint hover:text-text-body disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => moveOrder(i, i - 1)}
                  >
                    ▲
                  </button>
                  <button
                    className="text-text-hint hover:text-text-body disabled:opacity-30"
                    disabled={i === duties.length - 1}
                    onClick={() => moveOrder(i, i + 1)}
                  >
                    ▼
                  </button>
                </div>
                <span className="font-medium text-text-body">{d.class?.name || `班级 #${d.classId}`}</span>
                <button
                  className="ml-auto text-text-hint hover:text-danger-500"
                  onClick={() => setDuties(duties.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}

            {duties.length === 0 && (
              <p className="text-center text-sm text-text-disabled py-4">暂未添加管辖班级</p>
            )}

            {/* Multi-select add button */}
            <div className="mt-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedClasses(new Set());
                  setMultiSelectOpen(true);
                }}
              >
                + 多选添加班级
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Multi-select Modal */}
      <Modal
        open={multiSelectOpen}
        onClose={() => setMultiSelectOpen(false)}
        title="选择管辖班级（可多选）"
        className="max-w-md"
      >
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {availableClasses.length === 0 ? (
            <p className="text-center text-sm text-text-disabled py-4">所有班级已添加</p>
          ) : (
            <>
              <label className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer bg-bg-hover hover:bg-bg-hover transition-colors">
                <input
                  type="checkbox"
                  checked={selectedClasses.size === availableClasses.length}
                  onChange={() => {
                    if (selectedClasses.size === availableClasses.length) {
                      setSelectedClasses(new Set());
                    } else {
                      setSelectedClasses(new Set(availableClasses.map(c => c.id)));
                    }
                  }}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-sm font-medium text-text-body">全选 / 取消全选</span>
              </label>
              {availableClasses.map(c => (
              <label
                key={c.id}
                className={`flex items-center gap-3 p-3 rounded-btn cursor-pointer transition-colors ${
                  selectedClasses.has(c.id) ? "bg-primary-50 border border-primary-200" : "bg-bg-page border border-transparent hover:bg-bg-hover"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedClasses.has(c.id)}
                  onChange={() => toggleClass(c.id)}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="font-medium text-text-body">{c.name}</span>
              </label>
            ))}
            </>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" fullWidth onClick={() => setMultiSelectOpen(false)}>取消</Button>
          <Button fullWidth onClick={handleMultiAdd} disabled={selectedClasses.size === 0}>
            添加选中 ({selectedClasses.size})
          </Button>
        </div>
      </Modal>
    </div>
  );
}
