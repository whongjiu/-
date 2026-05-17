"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Card from "@/components/ui/Card";
import StatusCard from "@/components/ui/StatusCard";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { getDayName } from "@/lib/utils";
import ChangePassword from "@/components/shared/ChangePassword";

export default function MemberDashboard() {
  const [data, setData] = useState<{
    onDuty: boolean;
    todayClass: { classId: number; name: string } | null;
    myClasses: Array<{ id: number; class: { id: number; name: string } }>;
    myDuties: Array<{ dayOfWeek: number; building: string }>;
    rollCallLists: Array<{
      id: number; names: string; images: string | null; class: { id: number; name: string };
      leader: { name: string };
      attendances: Array<{ id: number; studentName: string; status: string; images: string | null }>;
    }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabFilter, setTabFilter] = useState<Record<number, string>>({});
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);

  // Reroll
  const [rerollModal, setRerollModal] = useState(false);
  const [rerollListId, setRerollListId] = useState(0);
  const [rerollNames, setRerollNames] = useState<string[]>([]);
  const [customStatus, setCustomStatus] = useState<Record<string, string>>({});

  // Upload board photo (class-level)
  const [uploadingListId, setUploadingListId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(() => {
    setError(null);
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { if (d.success) { setData(d.data); } else { setError(d.error || "加载失败"); } })
      .catch(() => setError("网络错误，请刷新重试"));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) return <div className="text-center py-12 text-danger-400">{error}</div>;
  if (!data) return <div className="text-center py-12 text-text-hint">加载中...</div>;

  const handleUpdateStatus = async (attendanceId: number, status: string) => {
    await fetch("/api/rollcalls/attendance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceId, status }),
    });
    fetchData();
  };

  const handleUploadBoardPhoto = async (listId: number, file: File) => {
    setUploadingListId(listId);
    const formData = new FormData();
    formData.append("files", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const d = await res.json();
    if (d.success && d.data.length > 0) {
      await fetch("/api/rollcalls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollCallId: listId, action: "uploadBoard", addImage: d.data[0] }),
      });
      fetchData();
    }
    setUploadingListId(null);
  };

  const handleFinalSubmit = async (listId: number) => {
    if (!confirm("确认提交审批？提交后数据将同步至管理员后台存档。")) return;
    const res = await fetch("/api/rollcalls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollCallId: listId, action: "finalize" }),
    });
    const d = await res.json();
    if (d.success) {
      alert("✅ 已提交审批，数据已同步至管理员后台");
      fetchData();
    } else {
      alert(d.error || "提交失败");
    }
  };

  const handleRerollStart = (list: { id: number; names: string }) => {
    setRerollListId(list.id);
    setRerollNames(JSON.parse(list.names));
    setCustomStatus({});
    setRerollModal(true);
  };

  const handleRerollSubmit = async () => {
    const attendances = rerollNames.map(name => ({
      studentName: name,
      status: customStatus[name] || "absent",
    }));
    await fetch("/api/rollcalls", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollCallId: rerollListId, attendances }),
    });
    setRerollModal(false);
    fetchData();
  };

  const getTab = (listId: number) => tabFilter[listId] || "all";

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    present: { label: "已到", color: "text-success-500", bg: "bg-success-100" },
    absent: { label: "未到", color: "text-danger-500", bg: "bg-danger-100" },
    leave: { label: "请假", color: "text-primary-600", bg: "bg-warning-100" },
    excluded: { label: "已排除", color: "text-warning-600", bg: "bg-warning-100" },
  };

  statusConfig[""] = statusConfig.absent;

  const allStatuses = ["present", "absent", "leave", "excluded"];

  return (
    <div className="space-y-6">
      <StatusCard active={data.onDuty} />

      {/* Today's Duty Class */}
      {data.todayClass && (
        <Card>
          <h3 className="font-semibold text-text-body mb-3">今日值日班级</h3>
          <Tag color="warning">{data.todayClass.name}</Tag>
        </Card>
      )}

      {/* Managed Classes */}
      <Card>
        <h3 className="font-semibold text-text-body mb-3">📚 管辖班级</h3>
        <div className="flex flex-wrap gap-2">
          {data.myClasses.length > 0 ? (
            data.myClasses.map((c, i) => (
              <Tag key={i} color="primary">{c.class?.name ?? "未知"}</Tag>
            ))
          ) : (
            <span className="text-sm text-text-disabled">暂无管辖班级，请联系管理员分配</span>
          )}
        </div>
      </Card>

      {/* Roll Call Lists */}
      <Card>
        <h3 className="font-semibold text-text-body mb-3">点名名单</h3>
        <div className="grid gap-3">
          {data.rollCallLists.map(list => {
            const namesArr: string[] = JSON.parse(list.names);
            const abs = list.attendances.filter(a => a.status === "absent");
            const pr = list.attendances.filter(a => a.status === "present");
            const lv = list.attendances.filter(a => a.status === "leave");
            const ex = list.attendances.filter(a => a.status === "excluded");
            const isExp = selectedList === list.id;
            const tab = getTab(list.id);

            return (
              <div key={list.id} className="border border-border-light rounded-btn overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-bg-hover transition-colors gap-2"
                  onClick={() => setSelectedList(isExp ? null : list.id)}
                >
                  <div>
                    <span className="font-medium text-text-body">{list.class.name}</span>
                    <span className="text-sm text-text-hint ml-2">负责人: {list.leader.name}</span>
                    <span className="text-xs text-text-hint ml-1">· 应到 {namesArr.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <Tag color="success">已到{pr.length}</Tag>
                    <Tag color="danger">未到{abs.length}</Tag>
                    <Tag color="warning">请假{lv.length}</Tag>
                    {ex.length > 0 && <Tag color="warning">排除{ex.length}</Tag>}
                  </div>
                </button>
                {isExp && (
                  <div className="px-4 pb-4">
                    {/* Tab bar + Reroll button */}
                    <div className="flex items-center gap-2 mt-1 mb-3">
                      <div className="flex gap-1 bg-bg-hover p-1 rounded-btn flex-1 overflow-x-auto scrollbar-none">
                        {[
                          { key: "all", label: `全部 (${namesArr.length})` },
                          { key: "present", label: `已到 (${pr.length})` },
                          { key: "absent", label: `未到 (${abs.length})` },
                          { key: "leave", label: `请假 (${lv.length})` },
                          { key: "excluded", label: `排除 (${ex.length})` },
                        ].map(t => (
                          <button
                            key={t.key}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${tab === t.key ? "bg-bg-card text-text-body shadow-sm" : "text-text-hint"}`}
                            onClick={() => setTabFilter({ ...tabFilter, [list.id]: t.key })}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <Button variant="warning" size="sm" onClick={() => handleRerollStart(list)}>
                        再次点名
                      </Button>
                    </div>

                    {/* Attendance list */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {list.attendances
                        .filter(a => tab === "all" || a.status === tab)
                        .map(a => (
                          <div key={a.id} className="flex items-center justify-between p-2 rounded-btn bg-bg-page flex-wrap gap-2">
                            <span className="text-sm font-medium text-text-body">{a.studentName}</span>
                            <div className="flex gap-1">
                              {allStatuses.map(st => (
                                <button
                                  key={st}
                                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                                    a.status === st
                                      ? `${statusConfig[st].bg} ${statusConfig[st].color}`
                                      : "bg-bg-card text-text-hint hover:bg-bg-hover"
                                  }`}
                                  onClick={() => handleUpdateStatus(a.id, st)}
                                >
                                  {statusConfig[st].label}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              {a.images && JSON.parse(a.images).map((img: string, i: number) => (
                                <button key={i} onClick={() => setExpandedImg(img)}>
                                  <img src={img} alt="" className="w-10 h-10 object-cover rounded-lg hover:ring-2 hover:ring-primary-300 transition-all" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Class-level board photos + upload */}
                    {(() => {
                      const listImages: string[] = list.images ? JSON.parse(list.images) : [];
                      return (
                        <div className="mt-3 pt-3 border-t border-border-light">
                          {listImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {listImages.map((img: string, i: number) => (
                                <button key={i} onClick={() => setExpandedImg(img)}>
                                  <img src={img} alt="板书" className="w-16 h-16 object-cover rounded-btn hover:ring-2 hover:ring-primary-300 transition-all" />
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button variant="primary" size="sm" onClick={() => handleFinalSubmit(list.id)}>
                              最终提交审批
                            </Button>
                            <button
                              className="px-3 py-1.5 text-xs font-medium rounded-btn bg-bg-page border border-dashed border-border-light text-text-body hover:border-primary-300 hover:text-primary-500 transition-colors"
                              onClick={() => {
                                setUploadingListId(list.id);
                                setTimeout(() => fileRef.current?.click(), 50);
                              }}
                            >
                              {uploadingListId === list.id ? "上传中..." : "📷 上传板书"}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
          {data.rollCallLists.length === 0 && (
            <p className="text-center text-sm text-text-disabled py-4">暂无管辖班级数据，等待负责人导入名单</p>
          )}
        </div>
      </Card>

      {/* My Duty Schedule */}
      <Card>
        <h3 className="font-semibold text-text-body mb-3">📌 我的值班</h3>
        {data.myDuties && data.myDuties.length > 0 ? (
          <div className="space-y-2">
            {data.myDuties.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-bg-page rounded-btn">
                <Tag color="success">{getDayName(d.dayOfWeek)}</Tag>
                <span className="text-xs text-text-hint">📍 {d.building}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-disabled">暂无值班安排</p>
        )}
      </Card>

      {/* Hidden file input for board photo upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadingListId) handleUploadBoardPhoto(uploadingListId, file);
          e.target.value = "";
        }}
      />

      {/* Image zoom modal */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpandedImg(null)}
        >
          <img
            src={expandedImg}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-btn shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Change Password */}
      <ChangePassword />

      {/* Reroll Modal */}
      <Modal open={rerollModal} onClose={() => setRerollModal(false)} title="二次重新点名" className="max-w-lg">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {rerollNames.map((name, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-btn bg-bg-page">
              <span className="font-medium text-text-body">{name}</span>
              <div className="flex gap-1">
                {allStatuses.map(st => (
                  <button
                    key={st}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      (customStatus[name] || "absent") === st
                        ? `${statusConfig[st].bg} ${statusConfig[st].color}`
                        : "bg-bg-card text-text-hint"
                    }`}
                    onClick={() => setCustomStatus({ ...customStatus, [name]: st })}
                  >
                    {statusConfig[st].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button fullWidth className="mt-4" onClick={handleRerollSubmit}>提交点名结果</Button>
      </Modal>
    </div>
  );
}
