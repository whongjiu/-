"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(d => {
      if (d.success) {
        setConfig(d.data);
        setRegistrationOpen(d.data.registration_open === "true");
        setInviteCode(d.data.invite_code || "");
      }
    });
  }, []);

  const handleSave = async () => {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_open: registrationOpen ? "true" : "false",
        invite_code: inviteCode,
      }),
    });
    const d = await res.json();
    if (d.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-text-body">系统配置</h1>

      <Card>
        <h3 className="font-semibold text-text-body mb-4">注册权限管控</h3>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-body">开放注册</span>
          <button
            className={`relative w-12 h-7 rounded-full transition-colors ${registrationOpen ? "bg-success-400" : "bg-bg-hover"}`}
            onClick={() => setRegistrationOpen(!registrationOpen)}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-bg-card shadow transition-transform ${registrationOpen ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <Input
          label="全局邀请码（兜底）"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          placeholder="设置注册邀请码，邀请码管理页面中的码优先"
        />

        <div className="mt-4">
          <Button onClick={handleSave}>
            {saved ? "✅ 已保存" : "保存配置"}
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-body mb-2">数据重置</h3>
        <p className="text-sm text-text-hint mb-4">
          清除当日点名数据和考勤记录，保留账号、班级、排班等结构数据。每天凌晨0点自动执行。
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirm("确认清除所有当日的点名数据和考勤记录？此操作不可恢复！")) return;
              const res = await fetch("/api/reset-daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirm: "yes" }),
              });
              const d = await res.json();
              if (d.success) {
                alert(`已清除考勤记录 ${d.data.deletedAttendances} 条，重置名单 ${d.data.resetRollCallLists} 个`);
              } else {
                alert(d.error || "操作失败");
              }
            }}
          >
            立即清除当日数据
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-body mb-2">数据库初始化</h3>
        <p className="text-sm text-text-hint mb-4">
          首次使用系统时需要初始化管理员账号。默认账号: admin，密码: admin123
        </p>
        <Button
          variant="warning"
          onClick={async () => {
            const res = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: "admin",
                password: "admin123",
                name: "管理员",
                inviteCode: inviteCode || "init2026",
                role: "admin",
              }),
            });
            const d = await res.json();
            if (d.success) {
              alert("管理员账号已创建！请前往 /admint 登录");
            } else {
              alert(d.error || "创建失败，可能已存在");
            }
          }}
        >
          初始化管理员账号
        </Button>
      </Card>
    </div>
  );
}
