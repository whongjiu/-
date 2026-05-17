"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

export default function AdminMemberClassesPage() {
  const [assignments, setAssignments] = useState<Array<{
    member: { id: number; name: string };
    classes: Array<{ id: number; name: string }>;
  }>>([]);
  const [members, setMembers] = useState<Array<{ id: number; name: string }>>([]);
  const [dormitories, setDormitories] = useState<Array<{ id: number; building: string; classes: Array<{ id: number; name: string }> }>>([]);
  const [allClasses, setAllClasses] = useState<Array<{ id: number; name: string; dormitoryId: number | null }>>([]);
  const [selectedMember, setSelectedMember] = useState(0);
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/admin/member-classes").then(r => r.json()).then(d => {
      if (d.success) setAssignments(d.data);
    });
    fetch("/api/users?role=member").then(r => r.json()).then(d => {
      if (d.success) setMembers(d.data);
    });
    fetch("/api/classes").then(r => r.json()).then(d => {
      if (d.success) setAllClasses(d.data);
    });
    fetch("/api/dormitories").then(r => r.json()).then(d => {
      if (d.success) setDormitories(d.data);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMemberSelect = (memberId: number) => {
    setSelectedMember(memberId);
    const existing = assignments.find(a => a.member.id === memberId);
    setSelectedClasses(new Set(existing ? existing.classes.map(c => c.id) : []));
  };

  const toggleClass = (classId: number) => {
    const next = new Set(selectedClasses);
    if (next.has(classId)) next.delete(classId);
    else next.add(classId);
    setSelectedClasses(next);
  };

  const handleSave = async () => {
    if (!selectedMember) return;
    setSaving(true);
    const res = await fetch("/api/admin/member-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selectedMember, classIds: [...selectedClasses] }),
    });
    const d = await res.json();
    if (d.success) {
      fetchData();
    } else {
      alert(d.error || "保存失败");
    }
    setSaving(false);
  };

  const handleRemoveClass = async (memberId: number, classId: number) => {
    const existing = assignments.find(a => a.member.id === memberId);
    if (!existing) return;
    const newClassIds = existing.classes.filter(c => c.id !== classId).map(c => c.id);
    const res = await fetch("/api/admin/member-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, classIds: newClassIds }),
    });
    const d = await res.json();
    if (d.success) fetchData();
    else alert(d.error || "操作失败");
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm("确认移除该部员的所有管辖班级？")) return;
    const res = await fetch("/api/admin/member-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, classIds: [] }),
    });
    const d = await res.json();
    if (d.success) fetchData();
    else alert(d.error || "操作失败");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-text-body">管辖分配</h1>

      <Card>
        <h3 className="font-semibold text-text-body mb-4">分配管辖班级</h3>

        <div className="flex flex-col gap-4">
          {/* Member selector */}
          <div>
            <label className="text-sm font-medium text-text-body block mb-2">选择学风部员</label>
            <select
              className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body focus:outline-none focus:border-primary-300"
              value={selectedMember}
              onChange={e => handleMemberSelect(Number(e.target.value))}
            >
              <option value={0}>请选择部员</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Class checkboxes by dormitory */}
          {selectedMember > 0 && (
            <>
              <div>
                <label className="text-sm font-medium text-text-body block mb-2">
                  选择管辖班级（按宿舍楼分组，可多选）
                </label>
                <div className="space-y-3 max-h-96 overflow-y-auto border border-border-light rounded-btn p-3">
                  {/* Filter by dormitory or show all */}
                  {dormitories.length > 0 ? (
                    dormitories.map(dorm => {
                      const dormClasses = dorm.classes || [];
                      if (dormClasses.length === 0) return null;
                      return (
                        <div key={dorm.id}>
                          <div className="text-xs font-semibold text-text-hint mb-1.5 px-1">
                            📍 {dorm.building}
                          </div>
                          <div className="space-y-1">
                            {dormClasses.map(c => (
                              <label
                                key={c.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                                  selectedClasses.has(c.id)
                                    ? "bg-primary-50 border border-primary-200"
                                    : "bg-bg-page border border-transparent hover:bg-bg-hover"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.has(c.id)}
                                  onChange={() => toggleClass(c.id)}
                                  className="w-4 h-4 accent-primary-500"
                                />
                                <span className="text-sm font-medium text-text-body">{c.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    // Fallback: show all classes without dormitory grouping
                    allClasses.map(c => (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                          selectedClasses.has(c.id)
                            ? "bg-primary-50 border border-primary-200"
                            : "bg-bg-page border border-transparent hover:bg-bg-hover"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.has(c.id)}
                          onChange={() => toggleClass(c.id)}
                          className="w-4 h-4 accent-primary-500"
                        />
                        <span className="text-sm font-medium text-text-body">{c.name}</span>
                      </label>
                    ))
                  )}
                  {allClasses.length === 0 && (
                    <p className="text-sm text-text-disabled py-2">暂无班级数据</p>
                  )}
                </div>
              </div>
              <Button fullWidth onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : `保存分配（${selectedClasses.size} 个班级）`}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Current assignments list */}
      <Card>
        <h3 className="font-semibold text-text-body mb-4">当前分配情况</h3>
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a.member.id} className="p-3 bg-bg-page rounded-btn">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-text-body">{a.member.name}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(a.member.id);
                      setSelectedClasses(new Set(a.classes.map(c => c.id)));
                    }}
                  >
                    编辑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(a.member.id)}>
                    清空全部
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {a.classes.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1">
                    <Tag color="primary">
                      {c.name}
                      <button
                        className="ml-1 text-primary-400 hover:text-danger-400 transition-colors"
                        onClick={() => handleRemoveClass(a.member.id, c.id)}
                        title={`移除 ${c.name}`}
                      >
                        ×
                      </button>
                    </Tag>
                  </span>
                ))}
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-center text-sm text-text-disabled py-4">暂无分配记录</p>
          )}
        </div>
      </Card>
    </div>
  );
}
