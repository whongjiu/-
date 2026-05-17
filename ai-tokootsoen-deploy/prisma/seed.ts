import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 清除所有数据
  await prisma.attendance.deleteMany();
  await prisma.rollCallList.deleteMany();
  await prisma.workLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.memberDuty.deleteMany();
  await prisma.dutySchedule.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.class.deleteMany();
  await prisma.dormitory.deleteMany();
  await prisma.user.deleteMany();

  // 仅创建管理员账号
  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      username: "admin",
      password: hashed,
      name: "管理员",
      role: "admin",
    },
  });

  // 创建系统配置
  await prisma.systemConfig.create({
    data: { key: "registration_open", value: "true" },
  });
  await prisma.systemConfig.create({
    data: { key: "invite_code", value: "init2026" },
  });

  console.log("Seed completed! Admin only.");
  console.log("  Username: admin");
  console.log("  Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
