"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Tag from "@/components/ui/Tag";

export default function AdminDormsPage() {
  const [dorms, setDorms] = useState<Array<{
    id: number; building: string;
    classes: Array<{ id: number; name: string }>;
  }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; building: string } | null>(null);
  const [building, setBuilding] = useState("");

  // Class binding
  const [bindModal, setBindModal] = useState(false);
  const [bindDormId, setBindDormId] = useState(0);
  const [bindDormName, setBindDormName] = useState("");
  const [allClasses, setAllClasses] = useState<Array<{ id: number; name: string; dormitoryId: number | null }>>([]);
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set());

  const fetchData = useCallback(() => {
    fetch("/api/dormitories").then(r => r.json()).then(d => { if (d.success) setDorms(d.data); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, building } : { building };
    const res = await fetch("/api/dormitories", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.success) { setModalOpen(false); fetchData(); } else alert(d.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/dormitories?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const openBind = async (dormId: number, dormName: string) => {
    setBindDormId(dormId);
    setBindDormName(dormName);
    const res = await fetch("/api/classes");
    const d = await res.json();
    if (d.success) setAllClasses(d.data);
    const dorm = dorms.find(x => x.id === dormId);
    setSelectedClasses(new Set(dorm?.classes.map(c => c.id) || []));
    setBindModal(true);
  };

  const handleBind = async () => {
    await fetch("/api/dormitories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dormitoryId: bindDormId, classIds: [...selectedClasses] }),
    });
    setBindModal(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">宿舍楼管理</h1>
        <Button onClick={() => { setEditing(null); setBuilding(""); setModalOpen(true); }}>+ 新增楼栋</Button>
      </div>

      <Card padding="none">
        <div className="divide-y divide-neutral-100">
          {dorms.map(d => (
            <div key={d.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-text-body">{d.building}</span>
                  {d.classes.length > 0 && (
                    <div className="flex gap-1">
                      {d.classes.map(c => <Tag key={c.id} color="primary">{c.name}</Tag>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openBind(d.id, d.building)}>绑定班级</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setBuilding(d.building); setModalOpen(true); }}>编辑</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>删除</Button>
                </div>
              </div>
            </div>
          ))}
          {dorms.length === 0 && <div className="text-center py-8 text-text-disabled">暂无宿舍楼</div>}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑楼栋" : "新增楼栋"}>
        <div className="flex flex-col gap-4">
          <Input label="楼牌号" value={building} onChange={e => setBuilding(e.target.value)} placeholder="如: 1号楼" />
          <Button fullWidth onClick={handleSave}>{editing ? "保存" : "创建"}</Button>
        </div>
      </Modal>

      {/* Bind Classes Modal */}
      <Modal open={bindModal} onClose={() => setBindModal(false)} title={`绑定班级到 ${bindDormName}`} className="max-w-md">
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {allClasses.length === 0 ? (
            <p className="text-sm text-text-disabled py-4 text-center">暂无班级</p>
          ) : (
            <>
              <label className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer bg-bg-hover hover:bg-bg-hover transition-colors">
                <input
                  type="checkbox"
                  checked={selectedClasses.size === allClasses.length}
                  onChange={() => {
                    if (selectedClasses.size === allClasses.length) {
                      setSelectedClasses(new Set());
                    } else {
                      setSelectedClasses(new Set(allClasses.map(c => c.id)));
                    }
                  }}
                  className="w-4 h-4 accent-primary-500"
                />
                <span className="text-xs font-medium text-text-body">全选 / 取消全选</span>
              </label>
              {allClasses.map(c => (
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
                    onChange={() => {
                      const next = new Set(selectedClasses);
                      if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                      setSelectedClasses(next);
                    }}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <span className="text-sm font-medium text-text-body">{c.name}</span>
                </label>
              ))}
            </>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" fullWidth onClick={() => setBindModal(false)}>取消</Button>
          <Button fullWidth onClick={handleBind}>保存绑定 ({selectedClasses.size})</Button>
        </div>
      </Modal>
    </div>
  );
}
