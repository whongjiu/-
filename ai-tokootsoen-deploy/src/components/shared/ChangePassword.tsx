"use client";

import { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function ChangePassword() {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPw || !newPw) {
      setMsg({ type: "error", text: "请填写原密码和新密码" });
      return;
    }
    if (newPw.length < 4) {
      setMsg({ type: "error", text: "新密码至少4位" });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg({ type: "success", text: "密码修改成功" });
        setOldPw("");
        setNewPw("");
      } else {
        setMsg({ type: "error", text: d.error || "修改失败" });
      }
    } catch {
      setMsg({ type: "error", text: "请求失败" });
    }
    setLoading(false);
  };

  return (
    <Card>
      <h3 className="font-semibold text-text-body mb-3">修改密码</h3>
      <div className="flex flex-col gap-3 max-w-sm">
        <Input
          type="password"
          placeholder="原密码"
          value={oldPw}
          onChange={e => setOldPw(e.target.value)}
        />
        <Input
          type="password"
          placeholder="新密码（至少4位）"
          value={newPw}
          onChange={e => setNewPw(e.target.value)}
        />
        {msg && (
          <p className={`text-sm ${msg.type === "success" ? "text-success-500" : "text-danger-500"}`}>
            {msg.text}
          </p>
        )}
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "修改中..." : "确认修改"}
        </Button>
      </div>
    </Card>
  );
}
