"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NameCard from "@/components/ui/NameCard";
import UploadZone from "@/components/ui/UploadZone";
import Tag from "@/components/ui/Tag";

export default function LeaderLeavePage() {
  const router = useRouter();
  const [list, setList] = useState<{
    id: number; names: string;
    attendances: Array<{ id: number; studentName: string; status: string; images: string | null }>;
  } | null>(null);
  const [absentNames, setAbsentNames] = useState<string[]>([]);
  const [selectedForLeave, setSelectedForLeave] = useState<Set<string>>(new Set());
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/rollcalls").then(r => r.json()).then(d => {
      if (d.success && d.data.length > 0) {
        const lst = d.data[0];
        setList(lst);
        const attendances = lst.attendances || [];
        const abs = attendances
          .filter((a: { status: string }) => a.status === "absent")
          .map((a: { studentName: string }) => a.studentName);
        setAbsentNames(abs);
      }
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = (files: File[]) => {
    setUploadedImages(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(f);
    });
  };

  const toggleSelect = (name: string) => {
    setSelectedForLeave(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!list) return;
    setSubmitting(true);

    // Upload images first
    let imagePaths: string[] = [];
    if (uploadedImages.length > 0) {
      const formData = new FormData();
      uploadedImages.forEach(f => formData.append("files", f));
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (uploadData.success) imagePaths = uploadData.data;
    }

    // Update attendance: selected = leave, unselected = absent (remain)
    const attendances = absentNames.map(name => ({
      studentName: name,
      status: selectedForLeave.has(name) ? "leave" : "absent",
    }));

    // Also include present students
    if (list.attendances) {
      list.attendances
        .filter(a => a.status === "present")
        .forEach(a => {
          attendances.push({ studentName: a.studentName, status: "present" });
        });
    }

    await fetch("/api/rollcalls", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rollCallId: list.id,
        attendances,
        images: imagePaths.length > 0 ? JSON.stringify(imagePaths) : null,
      }),
    });

    setSubmitting(false);
    alert("请假数据已上报！");
    router.push("/leader");
  };

  if (!list) return <div className="text-center py-12 text-text-hint">加载中...</div>;
  if (absentNames.length === 0) return (
    <div className="text-center py-12">
      <p className="text-text-hint mb-4">没有未到人员</p>
      <Button variant="ghost" onClick={() => router.push("/leader")}>返回</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-body">请假审核 & 数据上报</h1>

      {/* Upload area - chat-style */}
      <Card>
        <UploadZone
          onUpload={handleUpload}
          previews={imagePreviews}
        />
        <p className="text-xs text-text-disabled mt-2 text-center">
          上传请假凭证图片（支持多图）
        </p>
      </Card>

      {/* Name selection */}
      <Card>
        <h3 className="font-semibold text-text-body mb-3">
          请选择请假的姓名
        </h3>
        <p className="text-xs text-text-hint mb-3">
          选中 = 视为请假，未选中 = 无故未到
        </p>
        <div className="flex flex-wrap gap-2">
          {absentNames.map(name => (
            <NameCard
              key={name}
              name={name}
              selected={selectedForLeave.has(name)}
              status={selectedForLeave.has(name) ? "leave" : "absent"}
              onClick={() => toggleSelect(name)}
            />
          ))}
        </div>
      </Card>

      {/* Summary */}
      <Card>
        <div className="flex gap-3 text-center text-sm">
          <div className="flex-1">
            <span className="text-warning-200 font-medium">
              请假: {selectedForLeave.size}人
            </span>
          </div>
          <div className="flex-1">
            <span className="text-danger-400 font-medium">
              无故未到: {absentNames.length - selectedForLeave.size}人
            </span>
          </div>
        </div>
      </Card>

      {/* Submit */}
      <Button
        fullWidth
        size="xl"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "提交中..." : "确认提交上报"}
      </Button>
    </div>
  );
}
