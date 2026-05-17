"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface LoginPanelProps {
  adminMode?: boolean;
}

export default function LoginPanel({ adminMode }: LoginPanelProps) {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body: Record<string, string> = { username, password };
      if (isRegister) {
        body.name = name;
        body.inviteCode = inviteCode;
        body.role = adminMode ? "admin" : "leader";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "操作失败");
        return;
      }

      // Redirect based on role
      if (data.data?.redirect === "login") {
        setIsRegister(false);
        setError("");
        return;
      }
      const role = data.data?.role || (adminMode ? "admin" : "leader");
      switch (role) {
        case "admin":
          router.push("/admin");
          break;
        case "member":
          router.push("/member");
          break;
        case "leader":
          router.push("/leader");
          break;
        default:
          router.push("/");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <div className="relative w-full max-w-sm">
      {/* 卡片光晕 */}
      <div className="absolute -inset-1 bg-gradient-to-br from-primary-200/40 via-white/0 to-primary-300/40 rounded-modal blur-xl opacity-60" />

      <div className="relative glass-strong rounded-modal shadow-modal border border-white/70 p-6 sm:p-7">
        {/* 标题区 */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-title mb-1">
            {adminMode ? "管理员登录" : isRegister ? "注册账号" : "欢迎回来"}
          </h2>
          <p className="text-sm text-text-hint">
            {adminMode
              ? "学风管理系统·管理员入口"
              : isRegister
              ? "填写信息以创建账号"
              : "继续使用学风管理系统"}
          </p>
        </div>

        {/* 表单 */}
        <div className="flex flex-col gap-3.5" onKeyDown={onKeyDown}>
          {isRegister && (
            <div className="animate-fade-up">
              <Input
                label="姓名"
                placeholder="请输入真实姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>
          )}
          <Input
            label="账号"
            placeholder="请输入账号"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <Input
            label="密码"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v4M6 11v-4a6 6 0 1112 0v4M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
              </svg>
            }
          />
          {isRegister && (
            <div className="animate-fade-up">
              <Input
                label="邀请码"
                placeholder="请输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7h2a4 4 0 010 8h-2M9 7H7a4 4 0 100 8h2m-3-4h8" />
                  </svg>
                }
              />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-btn bg-danger-50 border border-danger-100 text-sm text-danger-600 animate-fade-up">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-4a.75.75 0 11.001-1.5.75.75 0 010 1.5zm0-3a.75.75 0 01-.75-.75v-4a.75.75 0 011.5 0v4a.75.75 0 01-.75.75z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            loading={loading}
            disabled={!username || !password || (isRegister && (!name || !inviteCode))}
            className="mt-1"
          >
            {loading ? "处理中..." : isRegister ? "立即注册" : "登 录"}
          </Button>

          {!adminMode && (
            <p className="text-center text-sm text-text-hint">
              {isRegister ? "已有账号？" : "没有账号？"}
              <button
                className="text-primary-500 ml-1 font-medium hover:text-primary-600 hover:underline underline-offset-4 transition-colors"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
              >
                {isRegister ? "去登录" : "去注册"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
