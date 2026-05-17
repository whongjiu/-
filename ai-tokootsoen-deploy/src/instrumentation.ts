import cron from "node-cron";

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  // 每日凌晨 0:00 自动清除考勤数据（不动名单）
  cron.schedule("0 0 * * *", async () => {
    try {
      const { prisma } = await import("@/lib/db");
      const deletedAtt = await prisma.attendance.deleteMany();
      console.log(`[每日重置] 清除考勤记录: ${deletedAtt.count}条`);
    } catch (error) {
      console.error("[每日重置] 执行失败:", error);
    }
  });

  console.log("[每日重置] 定时任务已注册，每日凌晨 0:00 执行");
}
