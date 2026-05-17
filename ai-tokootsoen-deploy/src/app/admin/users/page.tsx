"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Tag from "@/components/ui/Tag";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Array<{
    id: number; username: string; name: string; role: string;
    canNotify: boolean;
    class: { id: number; name: string } | null;
  }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "member", classId: 0, canNotify: false });

  const fetchUsers = useCallback(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => { if (d.success) setUsers(d.data); });
  }, []);

  useEffect(() => {
    fetchUsers();
    fetch("/api/classes").then((r) => r.json()).then((d) => { if (d.success) setClasses(d.data); });
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ username: "", password: "", name: "", role: "member", classId: 0, canNotify: false });
    setModalOpen(true);
  };

  const openEdit = (u: Record<string, unknown>) => {
    setEditingUser(u);
    setForm({
      username: (u.username as string) || "",
      password: "",
      name: (u.name as string) || "",
      role: (u.role as string) || "member",
      classId: (u.classId as number) || 0,
      canNotify: (u.canNotify as boolean) || false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const url = "/api/users";
    const method = editingUser ? "PUT" : "POST";
    const body = editingUser
      ? { id: editingUser.id as number, ...form, password: form.password || undefined, classId: form.classId || null }
      : { ...form, classId: form.classId || null };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchUsers();
      } else {
        alert(data.error || "操作失败");
      }
    } catch (err) {
      console.error(err);
      alert("请求失败，请检查网络或联系管理员");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此账号？")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) { alert(d.error); return; }
      fetchUsers();
    } catch {
      alert("删除失败");
    }
  };

  const toggleNotify = async (id: number, val: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, canNotify: val }),
      });
      const d = await res.json();
      if (d.success) {
        fetchUsers();
      } else {
        alert(d.error || "操作失败");
      }
    } catch {
      alert("操作失败");
    }
  };

  const roleLabels: Record<string, string> = { admin: "管理员", member: "学风部员", leader: "班级负责人" };
  const roleColors: Record<string, "primary" | "success" | "warning"> = {
    admin: "warning",
    member: "success",
    leader: "primary",
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-text-body">账号管理</h1>
        <Button size="sm" onClick={openCreate}>+ 新增账号</Button>
      </div>

      {/* User list — 统一响应式布局 */}
      <Card padding="none">
        <div className="divide-y divide-border-light/60">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 flex items-center justify-center text-sm font-semibold shrink-0">
                {u.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text-body text-sm">{u.name}</div>
                <div className="text-xs text-text-hint mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>@{u.username}</span>
                  <Tag color={roleColors[u.role]}>{roleLabels[u.role] || u.role}</Tag>
                  {u.class && <span>· {u.class.name}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {u.role === "member" && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-text-hint select-none hidden sm:inline">通报</span>
                    <button
                      className={`relative w-9 sm:w-10 h-5 sm:h-5 rounded-full transition-colors duration-200 ${
                        u.canNotify ? "bg-success-500" : "bg-border"
                      }`}
                      onClick={() => toggleNotify(u.id, !u.canNotify)}
                      aria-label={u.canNotify ? "关闭通报权限" : "开启通报权限"}
                    >
                      <span
                        className={`absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          u.canNotify ? "translate-x-[18px] sm:translate-x-[22px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>
                )}
                <Button variant="ghost" size="xs" onClick={() => openEdit(u as unknown as Record<string, unknown>)}>
                  编辑
                </Button>
                <Button variant="ghost" size="xs" onClick={() => handleDelete(u.id)}>
                  删除
                </Button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-12 text-text-disabled text-sm">暂无账号</div>
          )}
        </div>
      </Card>

      {/* Add / Edit Modal — 移动端居中 + 安全区 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? "编辑账号" : "新增账号"}
        className="md:max-w-md"
      >
        <div className="flex flex-col gap-3 sm:gap-4 pb-safe">
          <Input
            label="姓名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="账号"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <Input
            label="密码"
            type="password"
            placeholder={editingUser ? "留空则不修改密码" : ""}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {/* Role selector */}
          <div>
            <label className="text-sm font-medium text-text-body block mb-2">角色</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(roleLabels) as Array<[string, string]>).map(([role, label]) => {
                const active = form.role === role;
                return (
                  <button
                    key={role}
                    className={`px-3 py-2.5 rounded-btn text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      active
                        ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25"
                        : "bg-bg-hover text-text-hint hover:bg-primary-50 hover:text-primary-600"
                    }`}
                    onClick={() => setForm({ ...form, role })}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.role === "leader" && (
            <div className="animate-fade-up">
              <label className="text-sm font-medium text-text-body block mb-1.5">
                绑定班级
              </label>
              <select
                className="w-full px-4 py-3 rounded-btn border border-border-light bg-bg-page text-text-body focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100/60 transition-all duration-200"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
              >
                <option value={0}>请选择班级</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.role === "member" && (
            <div className="flex items-center justify-between px-4 py-3 bg-bg-page rounded-btn animate-fade-up">
              <div>
                <span className="text-sm font-medium text-text-body">通报系统权限</span>
                <p className="text-xs text-text-hint mt-0.5">开启后可使用通报单功能</p>
              </div>
              <button
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ml-3 ${
                  form.canNotify ? "bg-success-500" : "bg-border"
                }`}
                onClick={() => setForm({ ...form, canNotify: !form.canNotify })}
                aria-label={form.canNotify ? "关闭通报权限" : "开启通报权限"}
              >
                <span
                  className={`absolute top-[2px] w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    form.canNotify ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>
          )}

          <Button fullWidth size="lg" onClick={handleSave} className="mt-1">
            {editingUser ? "保存修改" : "创建账号"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
