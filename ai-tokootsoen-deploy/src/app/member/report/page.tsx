"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import html2canvas from "html2canvas";

const CUT_WIDTH = 800; // 固定截图画布宽度（px）

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function shiftDate(dateStr: string, delta: number): string {
  const parts = dateStr.split(".");
  if (parts.length !== 3) return todayStr();
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function replaceName(text: string, name: string): string {
  if (!name || name === "XXX") return text;
  return text.replace(/XXX/g, name).replace(/([一-龥]{2,4})(?=同学)/g, name);
}

export default function MemberReportPage() {
  const [reports, setReports] = useState<Array<{ id: number; title: string; content: string; createdAt: string }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; title: string; content: string } | null>(null);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  const [studentName, setStudentName] = useState("XXX");
  const [rawTitle, setRawTitle] = useState("承德应用技术职业学院津承艺术设计系\n关于XXX同学的通报批评");
  const [rawBody, setRawBody] = useState(
    "在学院严格管理规定下，XXX同学未经过辅导员及系部领导同意，擅自出现无故旷晚自习违纪行为，为严肃校纪校规、警示全体同学，现给予通报批评处理，并扣除相应德育积分。今后如有再犯，将从严从重处分。"
  );
  const [rawBottom, setRawBottom] = useState("津承艺术设计系");
  const [noticeDate, setNoticeDate] = useState(todayStr());

  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cutRef = useRef<HTMLDivElement>(null);

  const [docxUploading, setDocxUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/reports").then(r => r.json()).then(d => { if (d.success) setReports(d.data); });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (titleRef.current) titleRef.current.textContent = replaceName(rawTitle, studentName);
  }, [rawTitle, studentName]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.textContent = replaceName(rawBody, studentName);
  }, [rawBody, studentName]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.textContent = rawBottom;
  }, [rawBottom]);

  const handleNameChange = (name: string) => setStudentName(name || "XXX");
  const handleTitleBlur = () => { if (titleRef.current) setRawTitle(titleRef.current.textContent || ""); };
  const handleBodyBlur = () => { if (bodyRef.current) setRawBody(bodyRef.current.textContent || ""); };
  const handleBottomBlur = () => { if (bottomRef.current) setRawBottom(bottomRef.current.textContent || ""); };

  const handleSaveTemplate = async () => {
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, title: templateTitle, content: templateContent } : { title: templateTitle, content: templateContent };
    await fetch("/api/reports", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除？")) return;
    await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const applyTemplate = (r: { title: string; content: string }) => {
    setRawTitle(r.title);
    setRawBody(r.content);
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocxUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/parse-docx", { method: "POST", body: formData });
      const d = await res.json();
      if (d.success) setRawBody(d.data.text);
      else alert(d.error || "解析失败");
    } catch { alert("文档上传解析失败"); }
    setDocxUploading(false);
    e.target.value = "";
  };

  const handleGenerateImage = async () => {
    if (!cutRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cutRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "通报.png";
      a.click();
    } catch (err) { console.error(err); alert("图片生成失败"); }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">通报单</h1>
        <Button onClick={() => { setEditing(null); setTemplateTitle(""); setTemplateContent(""); setModalOpen(true); }}>+ 新增模板</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <h3 className="font-semibold text-text-body mb-3">👤 学生姓名</h3>
          <Input value={studentName === "XXX" ? "" : studentName} onChange={e => handleNameChange(e.target.value)} placeholder="输入学生姓名（默认XXX）" />
          <p className="text-xs text-text-hint mt-1">标题和正文中的 XXX 会实时替换为此姓名</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-text-body mb-3">📅 通报日期</h3>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-border-light flex items-center justify-center text-text-body hover:bg-bg-hover" onClick={() => setNoticeDate(shiftDate(noticeDate, -1))}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
            <input type="date" value={noticeDate.replace(/\./g, "-")} onChange={e => { const d = new Date(e.target.value); setNoticeDate(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`); }} className="flex-1 px-3 py-2 rounded-btn border border-border-light bg-bg-page text-text-body text-center font-mono" />
            <button className="w-9 h-9 rounded-lg border border-border-light flex items-center justify-center text-text-body hover:bg-bg-hover" onClick={() => setNoticeDate(shiftDate(noticeDate, 1))}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-text-body mb-3">📄 导入 Word</h3>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-primary-50 text-primary-600 font-medium text-sm cursor-pointer hover:bg-primary-100 transition-colors">
            {docxUploading ? "解析中..." : "选择 .docx 文件"}
            <input type="file" accept=".docx" className="hidden" onChange={handleDocxUpload} disabled={docxUploading} />
          </label>
          <p className="text-xs text-text-hint mt-1">导入正文内容到下方编辑区</p>
        </Card>
      </div>

      <div className="text-center">
        <button className="px-8 py-3 text-lg font-medium bg-danger-500 text-white rounded-btn hover:bg-rose-600 transition-colors disabled:opacity-50 shadow-lg shadow-rose-200" onClick={handleGenerateImage} disabled={generating}>
          {generating ? "⏳ 生成中..." : "📸 一键生成并下载图片"}
        </button>
      </div>

      {/* Screenshot Area Wrapper — mobile: horizontal scroll; PC: centered */}
      <div className="overflow-x-auto">
        {/* === Screenshot Area: 固定 800px 宽, 黑色字体 === */}
        <div
          ref={cutRef}
          style={{
            width: `${CUT_WIDTH}px`,
            fontFamily: '"宋体", SimSun, serif',
            color: "#000000",
          }}
          className="bg-white py-10 px-10 shadow-md mx-auto"
        >
          <h2
            ref={titleRef}
            className="text-center font-bold leading-relaxed outline-dashed outline-1 outline-neutral-300"
            style={{
              fontSize: "26px",
              lineHeight: "1.6",
              color: "#000000",
              whiteSpace: "pre-wrap",
            }}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleTitleBlur}
          />
          <div
            ref={bodyRef}
            className="mt-10 leading-relaxed outline-dashed outline-1 outline-neutral-300"
            style={{
              fontSize: "19px",
              lineHeight: "2.2",
              color: "#000000",
              textIndent: "2em",
              whiteSpace: "pre-wrap",
            }}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBodyBlur}
          />
          <div
            ref={bottomRef}
            className="text-right mt-10 leading-relaxed outline-dashed outline-1 outline-neutral-300"
            style={{
              fontSize: "19px",
              lineHeight: "2",
              color: "#000000",
              whiteSpace: "pre-wrap",
            }}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBottomBlur}
          />
          <div
            className="text-right"
            style={{
              fontSize: "19px",
              lineHeight: "2",
              color: "#000000",
            }}
          >
            {noticeDate}
          </div>
        </div>
      </div>

      <Card>
        <h3 className="font-semibold text-text-body mb-4">📋 模板管理</h3>
        <div className="space-y-2">
          {reports.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-bg-page rounded-btn">
              <div className="flex-1 min-w-0"><h4 className="font-medium text-text-body truncate">{r.title}</h4><p className="text-xs text-text-disabled">{new Date(r.createdAt).toLocaleDateString("zh-CN")}</p></div>
              <div className="flex gap-1 ml-3">
                <Button variant="ghost" size="sm" onClick={() => applyTemplate(r)}>套用</Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setTemplateTitle(r.title); setTemplateContent(r.content); setModalOpen(true); }}>编辑</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>删除</Button>
              </div>
            </div>
          ))}
          {reports.length === 0 && <p className="text-center text-text-disabled py-4 text-sm">暂无模板</p>}
        </div>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑通报单模板" : "新增通报单模板"} className="max-w-2xl">
        <div className="flex flex-col gap-4">
          <Input label="模板标题" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} />
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">模板内容</label>
            <textarea className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body min-h-[200px] resize-y focus:outline-none focus:border-primary-300" value={templateContent} onChange={e => setTemplateContent(e.target.value)} placeholder="输入通报单模板内容..." />
          </div>
          <Button fullWidth onClick={handleSaveTemplate}>{editing ? "保存修改" : "创建模板"}</Button>
        </div>
      </Modal>
    </div>
  );
}
