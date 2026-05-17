"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ChangePassword from "@/components/shared/ChangePassword";

export default function AdminDashboard() {
  const [data, setData] = useState<{
    todayDutyMembers: string[];
    todayDutyClasses: string[];
    totalNames: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    rollCallLists: Array<{
      id: number;
      names: string;
      class: { id: number; name: string };
      leader: { id: number; name: string };
      attendances: Array<{
        id: number;
        studentName: string;
        status: string;
        images: string | null;
        reviewedBy: number | null;
      }>;
    }>;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  // Import name list
  const [importModal, setImportModal] = useState(false);
  const [importClassId, setImportClassId] = useState(0);
  const [importNames, setImportNames] = useState("");
  const [importing, setImporting] = useState(false);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);

  const fetchData = useCallback(() => {
    fetch("/api/dashboard").then(r => r.json()).then(d => {
      if (d.success) setData(d.data);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => { if (d.success) setClasses(d.data); });
  }, []);

  const handleImportNames = async () => {
    if (!importClassId || !importNames.trim()) {
      alert("请选择班级并输入名单");
      return;
    }
    setImporting(true);
    const res = await fetch("/api/rollcalls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: importClassId, names: importNames }),
    });
    const d = await res.json();
    if (d.success) {
      setImportModal(false);
      setImportNames("");
      setImportClassId(0);
      fetchData();
    } else {
      alert(d.error || "导入失败");
    }
    setImporting(false);
  };

  if (!data) return <div className="text-center py-12 text-text-hint">加载中...</div>;

  const absentNames = data.rollCallLists
    .flatMap(l => l.attendances.filter(a => a.status === "absent").map(a => a.studentName));

  // Collect all images (leave certificates + board photos)
  const allImages = data.rollCallLists.flatMap(l =>
    l.attendances.flatMap(a => {
      const imgs: { src: string; student: string; className: string }[] = [];
      if (a.images) {
        JSON.parse(a.images).forEach((img: string) => {
          imgs.push({ src: img, student: a.studentName, className: l.class.name });
        });
      }
      return imgs;
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">仪表盘</h1>
        <Button size="sm" onClick={() => { setImportClassId(0); setImportNames(""); setImportModal(true); }}>
          + 导入
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-500">{data.totalNames}</div>
          <div className="text-xs text-text-hint mt-1">应到人数</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-success-500">{data.totalPresent}</div>
          <div className="text-xs text-text-hint mt-1">实到人数</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-danger-500">{data.totalAbsent}</div>
          <div className="text-xs text-text-hint mt-1">未到人数</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-primary-400">{data.totalLeave}</div>
          <div className="text-xs text-text-hint mt-1">请假人数</div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <h3 className="font-semibold text-text-body mb-3">今日查班人员</h3>
          <div className="flex flex-wrap gap-2">
            {data.todayDutyMembers.length > 0
              ? data.todayDutyMembers.map((n, i) => <Tag key={i} color="primary">{n}</Tag>)
              : <span className="text-sm text-text-disabled">暂无</span>}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-text-body mb-3">今日值日班级</h3>
          <div className="flex flex-wrap gap-2">
            {data.todayDutyClasses.length > 0
              ? data.todayDutyClasses.map((n, i) => <Tag key={i} color="warning">{n}</Tag>)
              : <span className="text-sm text-text-disabled">暂无</span>}
          </div>
        </Card>
      </div>

      {/* One-click copy absent names */}
      <div className="flex justify-end">
        <Button variant="danger" size="sm" onClick={() => {
          navigator.clipboard.writeText(absentNames.join("、") || "无");
        }}>
          一键复制未到名单
        </Button>
      </div>

      {/* Per-class Detail Panels */}
      <div className="space-y-4">
        {data.rollCallLists.map(list => {
          const namesArr: string[] = JSON.parse(list.names);
          const present = list.attendances.filter(a => a.status === "present");
          const absent = list.attendances.filter(a => a.status === "absent");
          const leave = list.attendances.filter(a => a.status === "leave");
          const excluded = list.attendances.filter(a => a.status === "excluded");
          const isExpanded = expandedId === list.id;
          const reviewed = list.attendances.some(a => a.reviewedBy);

          return (
            <Card key={list.id} padding="none">
              {/* Header - click to expand */}
              <button
                className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 text-left hover:bg-bg-hover transition-colors gap-2"
                onClick={() => setExpandedId(isExpanded ? null : list.id)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-title">{list.class.name}</span>
                    {reviewed && <Tag color="success">已审批</Tag>}
                  </div>
                  <div className="text-xs text-text-hint mt-0.5">
                    负责人: {list.leader.name} · 应到 {namesArr.length} 人
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 text-xs flex-wrap shrink-0">
                  <Tag color="success">实到 {present.length}</Tag>
                  <Tag color="danger">未到 {absent.length}</Tag>
                  <Tag color="warning">请假 {leave.length}</Tag>
                  {excluded.length > 0 && <Tag color="warning">排除 {excluded.length}</Tag>}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-border-light pt-4">
                  {/* Tabs */}
                  <div className="flex gap-1 mb-4 bg-bg-hover p-1 rounded-btn overflow-x-auto scrollbar-none">
                    {[
                      { key: "all", label: `全部 (${namesArr.length})` },
                      { key: "present", label: `已到 (${present.length})` },
                      { key: "absent", label: `未到 (${absent.length})` },
                      { key: "leave", label: `请假 (${leave.length})` },
                      { key: "excluded", label: `排除 (${excluded.length})` },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors text-text-hint hover:bg-bg-card whitespace-nowrap shrink-0"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Student list with photos */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {list.attendances.map(a => {
                      const statusColors: Record<string, string> = {
                        present: "bg-success-50 border-success-200",
                        absent: "bg-danger-50 border-danger-200",
                        leave: "bg-primary-50 border-primary-200",
                        excluded: "bg-warning-50 border-amber-200",
                      };
                      const statusLabels: Record<string, string> = {
                        present: "已到",
                        absent: "未到",
                        leave: "请假",
                        excluded: "已排除",
                      };
                      const images: string[] = a.images ? JSON.parse(a.images) : [];

                      return (
                        <div
                          key={a.id}
                          className={`flex items-center justify-between p-3 rounded-btn border ${statusColors[a.status]}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-text-title">{a.studentName}</span>
                            <span className="text-xs text-text-body">{statusLabels[a.status]}</span>
                          </div>
                          <div className="flex gap-2">
                            {/* Photos */}
                            {images.map((img, i) => (
                              <button
                                key={i}
                                onClick={() => setPreviewImg(img)}
                                className="w-12 h-12 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-300 transition-all"
                              >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Export */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border-light">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const text = [
                          `班级: ${list.class.name}`,
                          `负责人: ${list.leader.name}`,
                          `应到: ${namesArr.length} | 实到: ${present.length} | 未到: ${absent.length} | 请假: ${leave.length} | 排除: ${excluded.length}`,
                          "",
                          "未到: " + absent.map(a => a.studentName).join("、") || "无",
                          "请假: " + leave.map(a => a.studentName).join("、") || "无",
                        ].join("\n");
                        navigator.clipboard.writeText(text);
                      }}
                    >
                      导出文字
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {data.rollCallLists.length === 0 && (
          <p className="text-center text-text-disabled py-8">暂无点名数据，等待学风部员汇报</p>
        )}
      </div>

      {/* All Photos Section */}
      {allImages.length > 0 && (
        <Card>
          <h3 className="font-semibold text-text-body mb-3">📷 全部现场照片</h3>
          <div className="flex flex-wrap gap-3">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setPreviewImg(img.src)}
                className="w-20 h-20 rounded-btn overflow-hidden hover:ring-2 hover:ring-primary-300 transition-all relative group"
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.student} · {img.className}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Import Names Modal */}
      <Modal open={importModal} onClose={() => setImportModal(false)} title="导入班级名单" className="max-w-lg">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-body block mb-2">选择班级</label>
            <select
              className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body focus:outline-none focus:border-primary-300"
              value={importClassId}
              onChange={e => setImportClassId(Number(e.target.value))}
            >
              <option value={0}>请选择班级</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">学生名单</label>
            <textarea
              className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body min-h-[160px] resize-y focus:outline-none focus:border-primary-300"
              value={importNames}
              onChange={e => setImportNames(e.target.value)}
              placeholder={"输入学生姓名，用逗号、顿号或换行分隔\n例如：\n张三\n李四\n王五"}
            />
          </div>
          <Button fullWidth onClick={handleImportNames} disabled={importing}>
            {importing ? "导入中..." : "导入名单"}
          </Button>
        </div>
      </Modal>

      {/* Change Password */}
      <ChangePassword />

      {/* Image Lightbox */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImg(null)}
        >
          <img
            src={previewImg}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-btn shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
