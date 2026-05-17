"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Array<{ id: number; name: string; _count: { users: number } }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [name, setName] = useState("");

  const fetchData = useCallback(() => {
    fetch("/api/classes").then(r => r.json()).then(d => { if (d.success) setClasses(d.data); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, name } : { name };
    const res = await fetch("/api/classes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.success) { setModalOpen(false); fetchData(); } else alert(d.error);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/classes?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">班级管理</h1>
        <Button onClick={() => { setEditing(null); setName(""); setModalOpen(true); }}>+ 新增班级</Button>
      </div>

      <Card padding="none">
        <div className="divide-y divide-neutral-100">
          {classes.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <span className="font-medium text-text-body">{c.name}</span>
                <span className="text-sm text-text-hint ml-2">关联账号: {c._count.users}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setName(c.name); setModalOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>删除</Button>
              </div>
            </div>
          ))}
          {classes.length === 0 && <div className="text-center py-8 text-text-disabled">暂无班级</div>}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑班级" : "新增班级"}>
        <div className="flex flex-col gap-4">
          <Input label="班级名称" value={name} onChange={e => setName(e.target.value)} />
          <Button fullWidth onClick={handleSave}>{editing ? "保存" : "创建"}</Button>
        </div>
      </Modal>
    </div>
  );
}
