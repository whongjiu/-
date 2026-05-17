"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import UploadZone from "@/components/ui/UploadZone";

export default function MemberClassDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [list, setList] = useState<{
    id: number; names: string; class: { name: string };
    leader: { name: string };
    attendances: Array<{ id: number; studentName: string; status: string; images: string | null }>;
  } | null>(null);
  const [tabFilter, setTabFilter] = useState("all");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const fetchData = useCallback(() => {
    fetch(`/api/rollcalls?classId=${id}`).then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) setList(d.data[0]);
    });
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = async (attendanceId: number, status: string) => {
    await fetch("/api/rollcalls/attendance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId, status }),
    });
    fetchData();
  };

  const handleUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  if (!list) return <div className="text-center py-12 text-text-hint">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-text-hint">
        <span>{list.class.name}</span>
        <span>·</span>
        <span>负责人: {list.leader.name}</span>
      </div>

      {/* Upload board photo */}
      <Card>
        <h3 className="font-semibold text-text-body mb-3">班级板书现场照片</h3>
        <UploadZone onUpload={handleUpload} previews={previews} />
      </Card>

      {/* Tab filter */}
      <div className="flex gap-1 bg-bg-card p-1 rounded-btn shadow-card overflow-x-auto scrollbar-none">
        {[
          { key: "all", label: "全部" },
          { key: "present", label: "已到" },
          { key: "absent", label: "未到" },
          { key: "leave", label: "请假" },
        ].map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-2 text-sm font-medium rounded-btn transition-colors whitespace-nowrap shrink-0 ${tabFilter === tab.key ? "bg-primary-50 text-primary-600" : "text-text-hint"}`}
            onClick={() => setTabFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Attendance list */}
      <div className="space-y-2">
        {list.attendances
          .filter(a => tabFilter === "all" || a.status === tabFilter)
          .map(a => (
            <Card key={a.id} padding="sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-text-body">{a.studentName}</span>
                <div className="flex items-center gap-2">
                  {a.images && JSON.parse(a.images).map((img: string, i: number) => (
                    <button key={i} onClick={() => window.open(img, "_blank")}>
                      <img src={img} alt="" className="w-10 h-10 object-cover rounded-btn" />
                    </button>
                  ))}
                  <div className="flex gap-1">
                    {["present", "absent", "leave"].map(st => (
                      <button
                        key={st}
                        className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                          a.status === st
                            ? st === "present" ? "bg-success-100 text-success-500"
                              : st === "absent" ? "bg-danger-100 text-danger-500"
                              : "bg-warning-100 text-primary-600"
                            : "bg-bg-hover text-text-hint"
                        }`}
                        onClick={() => handleStatusChange(a.id, st)}
                      >
                        {st === "present" ? "已到" : st === "absent" ? "未到" : "请假"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      <Button fullWidth onClick={async () => {
        if (uploadedFiles.length > 0) {
          const fd = new FormData();
          uploadedFiles.forEach(f => fd.append("files", f));
          await fetch("/api/upload", { method: "POST", body: fd });
        }
        alert("最终审批已提交，数据同步至管理员后台");
      }}>
        最终提交审批
      </Button>
    </div>
  );
}
