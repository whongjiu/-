"use client";

import { useEffect, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Modal from "@/components/ui/Modal";

const TYPE_LABELS: Record<string, string> = {
  leader: "负责人",
  member: "学风部员",
};

export default function AdminInviteCodesPage() {
  const [codes, setCodes] = useState<Array<{ id: number; code: string; type: string; maxUses: number; useCount: number; used: boolean; usedBy: number | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Generation dialog
  const [showGenModal, setShowGenModal] = useState(false);
  const [genCount, setGenCount] = useState(1);
  const [genType, setGenType] = useState("leader");
  const [genMaxUses, setGenMaxUses] = useState(1);

  const fetchCodes = useCallback(() => {
    fetch("/api/invite-codes").then(r => r.json()).then(d => {
      if (d.success) setCodes(d.data);
    });
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const generateCodes = async () => {
    setLoading(true);
    const res = await fetch("/api/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: genCount, type: genType, maxUses: genMaxUses }),
    });
    const d = await res.json();
    if (d.success) {
      fetchCodes();
      setShowGenModal(false);
    }
    setLoading(false);
  };

  const deleteUnused = async () => {
    if (!confirm("确认删除所有未使用的邀请码？")) return;
    await fetch("/api/invite-codes", { method: "DELETE" });
    fetchCodes();
  };

  const deleteOne = async (id: number) => {
    await fetch(`/api/invite-codes?id=${id}`, { method: "DELETE" });
    fetchCodes();
  };

  const copyAllUnused = () => {
    const unused = codes.filter(c => c.useCount < c.maxUses).map(c => c.code).join("\n");
    navigator.clipboard.writeText(unused || "无");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-text-body">邀请码管理</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={copyAllUnused}>复制全部可用</Button>
          <Button variant="danger" onClick={deleteUnused}>清空未使用</Button>
        </div>
      </div>

      <Card>
        <div className="flex items-end gap-3 mb-4">
          <Button onClick={() => { setGenCount(1); setGenType("leader"); setGenMaxUses(1); setShowGenModal(true); }}>
            + 生成邀请码
          </Button>
        </div>

        <div className="divide-y divide-neutral-100">
          {codes.map(c => (
            <div key={c.id} className="flex items-center justify-between px-2 py-3">
              <div className="flex items-center gap-3">
                <code className="text-lg font-mono font-bold text-primary-600 tracking-wider">{c.code}</code>
                <Tag color={c.useCount >= c.maxUses ? "danger" : "success"}>
                  {c.useCount >= c.maxUses ? "已用完" : `可用 (${c.useCount}/${c.maxUses})`}
                </Tag>
                <Tag color={c.type === "member" ? "primary" : "warning"}>
                  {TYPE_LABELS[c.type] || c.type}
                </Tag>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-disabled">
                  {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                </span>
                {c.useCount < c.maxUses && (
                  <Button variant="ghost" size="sm" onClick={() => deleteOne(c.id)}>删除</Button>
                )}
              </div>
            </div>
          ))}
          {codes.length === 0 && (
            <div className="text-center py-8 text-text-disabled">暂无邀请码，请生成</div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-body mb-2">说明</h3>
        <ul className="text-sm text-text-hint space-y-1 list-disc list-inside">
          <li>每个邀请码可设置使用次数上限，超出后自动失效</li>
          <li>邀请码类型：负责人（leader）和学风部员（member）</li>
          <li>系统配置中的全局邀请码作为兜底，在邀请码表中找不到时生效</li>
          <li>点击"复制全部可用"可批量复制所有未用完的邀请码</li>
        </ul>
      </Card>

      {/* Generate Modal */}
      <Modal open={showGenModal} onClose={() => setShowGenModal(false)} title="生成邀请码" className="max-w-sm">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">生成数量</label>
            <input
              type="number"
              min={1}
              max={50}
              value={genCount}
              onChange={e => setGenCount(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 rounded-btn border border-border-light bg-bg-page text-text-body"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-body block mb-2">邀请码类型</label>
            <div className="flex gap-2">
              {[
                { value: "leader", label: "负责人" },
                { value: "member", label: "学风部员" },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`flex-1 py-2.5 px-4 rounded-btn text-sm font-medium border transition-colors ${
                    genType === opt.value
                      ? "bg-primary-50 border-primary-300 text-primary-600"
                      : "bg-bg-page border-border-light text-text-body hover:bg-bg-hover"
                  }`}
                  onClick={() => setGenType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-body block mb-1">可使用次数</label>
            <input
              type="number"
              min={1}
              max={999}
              value={genMaxUses}
              onChange={e => setGenMaxUses(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 rounded-btn border border-border-light bg-bg-page text-text-body"
            />
          </div>
          <Button fullWidth onClick={generateCodes} disabled={loading}>
            {loading ? "生成中..." : `生成 ${genCount} 个邀请码`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
