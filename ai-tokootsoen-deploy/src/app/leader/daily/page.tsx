"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const DEFAULT_NOTICE = "在学院严格管理规定下，XXX同学未经过辅导员及系部领导同意，擅自出现无故旷晚自习违纪行为，为严肃校纪校规、警示全体同学，现给予通报批评处理，并扣除相应德育积分。今后如有再犯，将从严从重处分。";

function replaceNames(text: string, names: string[]): string {
  if (names.length === 0) return text;
  return text.replace(/XXX/g, names.join("、"));
}

export default function LeaderDailyPage() {
  const router = useRouter();
  const [names, setNames] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, "present" | "absent">>({});
  const [listId, setListId] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noticeText, setNoticeText] = useState(DEFAULT_NOTICE);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data.rollCallList) {
          setLoading(false);
          return;
        }
        const list = d.data.rollCallList;
        setListId(list.id);
        setNames(JSON.parse(list.names));

        // 如果已有考勤数据，恢复状态
        if (list.attendances && list.attendances.length > 0) {
          const existing: Record<string, "present" | "absent"> = {};
          list.attendances.forEach((a: { studentName: string; status: string }) => {
            if (a.status === "present" || a.status === "absent") {
              existing[a.studentName] = a.status;
            }
          });
          setStatuses(existing);
        }
        setLoading(false);
      });
  }, []);

  // 所有人为"已点"：每个人 status 都被赋值
  const allMarked = names.length > 0 && names.every((n) => statuses[n]);
  const presentCount = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount = Object.values(statuses).filter((s) => s === "absent").length;
  const absentNames = names.filter((n) => statuses[n] === "absent");

  const handleToggle = useCallback((name: string) => {
    setStatuses((prev) => {
      const cur = prev[name];
      let next: "present" | "absent";
      if (!cur) {
        next = "present"; // 未点 → 到
      } else if (cur === "present") {
        next = "absent"; // 到 → 不到
      } else {
        delete prev[name]; // 不到 → 清除（恢复未点状态）
        return { ...prev };
      }
      return { ...prev, [name]: next };
    });
  }, []);

  // 一键复制未到名单
  const handleCopyAbsent = async () => {
    const text = absentNames.join("、");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the textarea content
      if (textareaRef.current) {
        const rendered = replaceNames(noticeText, absentNames);
        textareaRef.current.value = `未到名单：${text}\n\n${rendered}`;
        textareaRef.current.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // 提交点名结果到 API
  const submitAttendance = async () => {
    const attendances = names.map((name) => ({
      studentName: name,
      status: statuses[name] || "absent",
    }));
    await fetch("/api/rollcalls", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rollCallId: listId, attendances }),
    });
  };

  // 重新点名
  const handleReset = () => {
    setStatuses({});
  };

  // 退回
  const handleGoBack = () => {
    router.push("/leader");
  };

  // 提交并完成
  const handleFinish = async () => {
    await submitAttendance();
    router.push("/leader");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-6 h-6 mx-auto border-2 border-primary-300 border-t-primary-600 rounded-full" />
        <p className="text-text-hint mt-3 text-sm">加载中...</p>
      </div>
    );
  }

  if (names.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-hint mb-4">请先录用班级名单</p>
        <Button onClick={() => router.push("/leader/enroll")}>去录用名单</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 页面标题 + 统计摘要 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-text-body flex items-center gap-2">
          <span className="w-1 h-5 rounded bg-gradient-to-b from-primary-400 to-primary-600" />
          日常点名
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-success-600 font-semibold">{presentCount} 到</span>
          <span className="text-danger-600 font-semibold">{absentCount} 不到</span>
          <span className="text-text-hint">{names.length - presentCount - absentCount} 待点</span>
        </div>
      </div>

      {/* 名单网格 — 每行 3 或 4 个 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5">
        {names.map((name) => {
          const status = statuses[name];
          let cardStyle = "";
          if (status === "present") {
            cardStyle = "bg-success-50 border-success-300 text-success-700 shadow-sm shadow-success-500/10";
          } else if (status === "absent") {
            cardStyle = "bg-danger-50 border-danger-300 text-danger-700 shadow-sm shadow-danger-500/10";
          } else {
            cardStyle = "bg-bg-card border-border-light text-text-body";
          }

          return (
            <button
              key={name}
              onClick={() => handleToggle(name)}
              className={`relative px-3 py-4 sm:py-5 rounded-card border text-sm sm:text-base font-medium transition-all duration-150 active:scale-[0.97] hover:shadow-md ${cardStyle}`}
            >
              {status === "present" && (
                <span className="absolute top-1.5 right-1.5 text-base sm:text-lg leading-none">✓</span>
              )}
              {status === "absent" && (
                <span className="absolute top-1.5 right-1.5 text-base sm:text-lg leading-none">✗</span>
              )}
              <span className={status === "absent" ? "line-through" : ""}>{name}</span>
            </button>
          );
        })}
      </div>

      {/* 通报单内容输入框 */}
      <Card>
        <h3 className="text-sm font-semibold text-text-body mb-2 flex items-center gap-2">
          <span>📋</span>
          通报单内容
          <span className="text-xs text-text-hint font-normal">（XXX 会被自动替换为未到名单）</span>
        </h3>
        <textarea
          ref={textareaRef}
          className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body min-h-[90px] sm:min-h-[110px] resize-y focus:outline-none focus:border-primary-300 text-sm leading-relaxed"
          value={noticeText}
          onChange={(e) => setNoticeText(e.target.value)}
          placeholder="输入通报单正文内容..."
        />
        {/* 预览 */}
        {absentNames.length > 0 && (
          <div className="mt-3 p-3 bg-bg-hover rounded-btn text-sm leading-relaxed text-text-body border border-border-light">
            <div className="text-xs text-text-hint mb-1 font-medium">预览（含替换后效果）：</div>
            <div className="whitespace-pre-wrap" style={{ fontFamily: '"宋体", SimSun, serif', color: "#000" }}>
              {replaceNames(noticeText, absentNames)}
            </div>
          </div>
        )}
      </Card>

      {/* 操作按钮区 */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <Button
          fullWidth
          size="lg"
          variant="primary"
          disabled={absentNames.length === 0}
          onClick={handleCopyAbsent}
        >
          {copied ? "✓ 已复制" : "📋 一键复制未到名单"}
        </Button>
        <Button fullWidth size="lg" variant="ghost" onClick={handleReset}>
          🔄 重新点名
        </Button>
        <Button fullWidth size="lg" variant="ghost" onClick={handleGoBack}>
          ↩ 退回
        </Button>
      </div>

      {/* 底部：仅当全部点完时提醒提交 */}
      {allMarked && (
        <div className="text-center pt-1">
          <Button fullWidth size="xl" variant="success" onClick={handleFinish}>
            ✅ 完成点名并提交
          </Button>
        </div>
      )}

      {/* 操作提示 */}
      <p className="text-xs text-text-disabled text-center">
        点击学生卡片切换状态：未点 → 到 → 不到 → 清除
      </p>
    </div>
  );
}
