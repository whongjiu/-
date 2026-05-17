"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function AdminRollCallPage() {
  const [lists, setLists] = useState<Array<{
    id: number; names: string; enrolled: boolean; class: { name: string };
    leader: { name: string }; attendances: Array<{ studentName: string; status: string }>;
  }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(0);
  const [nameText, setNameText] = useState("");

  const fetchData = useCallback(() => {
    fetch("/api/rollcalls").then(r => r.json()).then(d => { if (d.success) setLists(d.data); });
  }, []);

  useEffect(() => {
    fetchData();
    fetch("/api/classes").then(r => r.json()).then(d => { if (d.success) setClasses(d.data); });
  }, [fetchData]);

  const handleSubmit = async () => {
    await fetch("/api/rollcalls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: selectedClass, names: nameText }),
    });
    setModalOpen(false);
    fetchData();
  };

  const handleReset = async (id: number) => {
    if (!confirm("确认重置此名单？所有点名数据将丢失！")) return;
    await fetch(`/api/rollcalls?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleExportImage = (report: { title: string; content: string }) => {
    // Export as text-based image using canvas
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fdfcfb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4a4a4a";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(report.title, 40, 60);
    ctx.font = "16px sans-serif";
    const lines = report.content.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(line, 40, 100 + i * 28);
    });
    const link = document.createElement("a");
    link.download = `${report.title}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">点名名单管理</h1>
        <Button onClick={() => { setSelectedClass(0); setNameText(""); setModalOpen(true); }}>+ 导入名单</Button>
      </div>

      {lists.map(list => {
        const names = JSON.parse(list.names || "[]");
        const abs = list.attendances.filter(a => a.status === "absent");
        const pr = list.attendances.filter(a => a.status === "present");
        const lv = list.attendances.filter(a => a.status === "leave");
        return (
          <Card key={list.id}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-text-body">{list.class.name}</h3>
                <p className="text-sm text-text-hint">
                  负责人: {list.leader.name} · 总人数: {names.length} · 实到: {pr.length} · 未到: {abs.length} · 请假: {lv.length}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleReset(list.id)}>重置</Button>
                <Button variant="ghost" size="sm" onClick={() => handleExportImage({ title: list.class.name, content: names.join("\n") })}>导出</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {names.map((n: string, i: number) => {
                const att = list.attendances.find(a => a.studentName === n);
                const color = att?.status === "present" ? "success" : att?.status === "absent" ? "danger" : att?.status === "leave" ? "warning" : "neutral";
                return <Tag key={i} color={color}>{n}</Tag>;
              })}
            </div>
          </Card>
        );
      })}
      {lists.length === 0 && <p className="text-center text-text-disabled py-8">暂无名单</p>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="导入点名名单">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">选择班级</label>
            <select
              className="w-full px-4 py-2.5 rounded-btn border border-border-light bg-bg-page text-text-body"
              value={selectedClass}
              onChange={e => setSelectedClass(parseInt(e.target.value))}
            >
              <option value={0}>请选择</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">学生名单（一行一个，或用逗号分隔）</label>
            <textarea
              className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body min-h-[150px] resize-y focus:outline-none focus:border-primary-300"
              value={nameText}
              onChange={e => setNameText(e.target.value)}
              placeholder="张三、李四、王五..."
            />
          </div>
          <Button fullWidth onClick={handleSubmit} disabled={!selectedClass || !nameText.trim()}>提交录用</Button>
        </div>
      </Modal>
    </div>
  );
}
