"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

export default function LeaderEnrollPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    hasEnrolled: boolean;
    rollCallList: { id: number; names: string; class: { name: string } } | null;
    classId: number | null; className: string | null;
  } | null>(null);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedClass, setSelectedClass] = useState(0);
  const [nameText, setNameText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      if (d.success) {
        setData(d.data);
        if (d.data.classId) setSelectedClass(d.data.classId);
      }
    });
    fetch("/api/classes").then(r => r.json()).then(d => {
      if (d.success) setClasses(d.data);
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedClass || !nameText.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/rollcalls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: selectedClass, names: nameText }),
    });
    const d = await res.json();
    setSubmitting(false);
    if (d.success) {
      alert("名单录用成功！");
      router.push("/leader");
    } else {
      alert(d.error || "录用失败");
    }
  };

  if (!data) return <div className="text-center py-12 text-text-hint">加载中...</div>;

  if (data.hasEnrolled && data.rollCallList) {
    const names = JSON.parse(data.rollCallList.names);
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-text-body">已录用班级名单</h1>
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Tag color="success">已录用</Tag>
            <span className="font-medium text-text-body">{data.rollCallList.class.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {names.map((n: string, i: number) => (
              <Tag key={i} color="primary">{n}</Tag>
            ))}
          </div>
          <p className="text-sm text-text-disabled mt-3">
            名单已录用，不可重复操作。总人数: {names.length}人
          </p>
        </Card>
        <Button fullWidth variant="ghost" onClick={() => router.push("/leader")}>
          返回主页
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-body">录用班级名单</h1>
      <Card>
        <p className="text-sm text-danger-400 mb-4">
          ⚠️ 名单仅允许录用一次，录用后不可重复录入，请仔细核对！
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">选择班级</label>
            <select
              className="w-full px-4 py-2.5 rounded-btn border border-border-light bg-bg-page text-text-body"
              value={selectedClass}
              onChange={e => setSelectedClass(parseInt(e.target.value))}
            >
              <option value={0}>请选择班级</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text-body block mb-1">
              全员名单（每行一个姓名，或使用逗号/顿号分隔）
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body min-h-[200px] resize-y focus:outline-none focus:border-primary-300"
              value={nameText}
              onChange={e => setNameText(e.target.value)}
              placeholder={"张三\n李四\n王五\n赵六\n..."}
            />
            <p className="text-xs text-text-disabled mt-1">
              也支持: 张三、李四、王五、赵六
            </p>
          </div>

          <Button
            fullWidth
            size="xl"
            variant="warning"
            disabled={submitting || !selectedClass || !nameText.trim()}
            onClick={handleSubmit}
          >
            {submitting ? "提交中..." : "确认录用"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
