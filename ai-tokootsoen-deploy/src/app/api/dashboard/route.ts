import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDayOfWeek, resolveWeeklyActive } from "@/lib/utils";

async function autoResetIfNewDay() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const lastReset = await prisma.systemConfig.findUnique({ where: { key: "last_daily_reset" } });

  if (lastReset?.value !== today) {
    // Only clear attendance status data, keep name lists intact
    await prisma.attendance.deleteMany();
    await prisma.systemConfig.upsert({
      where: { key: "last_daily_reset" },
      update: { value: today },
      create: { key: "last_daily_reset", value: today },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
  }

  // Auto-reset at midnight
  await autoResetIfNewDay();

  const today = getDayOfWeek();

  if (session.role === "admin") {
    // Today's duty members
    const todaySchedules = await prisma.dutySchedule.findMany({
      where: { dayOfWeek: today },
      include: {
        member: { select: { id: true, name: true } },
        dormitory: { select: { id: true, building: true } },
      },
    });

    // Today's duty classes: daily mode (fixed dayOfWeek) + weekly mode (resolved by week index)
    const dailyDuties = await prisma.memberDuty.findMany({
      where: { dayOfWeek: today, mode: "daily" },
      include: { class: true },
    });

    const allWeeklyDuties = await prisma.memberDuty.findMany({
      where: { mode: "weekly" },
      include: { class: true, member: { select: { id: true, name: true } } },
      orderBy: { order: "asc" },
    });

    // Group weekly duties by member, resolve active class per member
    const weeklyByMember: Record<number, Array<{ classId: number; order: number | null; class?: { id: number; name: string } | null }>> = {};
    for (const d of allWeeklyDuties) {
      if (!weeklyByMember[d.memberId]) weeklyByMember[d.memberId] = [];
      weeklyByMember[d.memberId].push(d);
    }

    const weeklyActive = new Set<string>();
    for (const duties of Object.values(weeklyByMember)) {
      const active = resolveWeeklyActive(duties);
      if (active) weeklyActive.add(active.name);
    }

    const allDutyClasses = [
      ...dailyDuties.map((d) => d.class.name),
      ...weeklyActive,
    ];

    // Roll call statistics — only show reviewed (member-approved) lists
    const rollCallLists = await prisma.rollCallList.findMany({
      where: { enrolled: true, reviewed: true },
      include: {
        class: true,
        leader: { select: { id: true, name: true } },
        attendances: true,
      },
    });

    let totalNames = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;

    for (const list of rollCallLists) {
      const names = JSON.parse(list.names);
      totalNames += names.length;
      totalPresent += list.attendances.filter((a) => a.status === "present").length;
      totalAbsent += list.attendances.filter((a) => a.status === "absent").length;
      totalLeave += list.attendances.filter((a) => a.status === "leave").length;
    }

    return NextResponse.json({
      success: true,
      data: {
        todayDutyMembers: todaySchedules.map((s) => s.member.name),
        todayDutyClasses: allDutyClasses,
        totalNames,
        totalPresent,
        totalAbsent,
        totalLeave,
        rollCallLists,
      },
    });
  }

  if (session.role === "member") {
    // Check if member is on duty today
    const isOnDuty = await prisma.dutySchedule.findFirst({
      where: { memberId: session.id, dayOfWeek: today },
    });

    // Get member's classes from MemberDuty (member self-configured)
    const myDuties = await prisma.memberDuty.findMany({
      where: { memberId: session.id },
      include: { class: true },
    });

    const memberDutyClassIds = myDuties.map((d) => d.classId);

    // Also get classes from DutySchedule (admin-assigned)
    const scheduleClasses = await prisma.dutySchedule.findMany({
      where: { memberId: session.id },
      include: { class: true },
    });

    // Merge unique class IDs from both sources (filter nulls)
    const allClassIds = [...new Set([
      ...memberDutyClassIds,
      ...scheduleClasses.map(s => s.classId).filter((id): id is number => id !== null),
    ])];

    // Get roll call data for these classes (skip if no classes assigned)
    let rollCallLists: Array<{
      id: number; names: string; images: string | null; class: { id: number; name: string };
      leader: { id: number; name: string };
      attendances: Array<{ id: number; studentName: string; status: string; images: string | null; reviewedBy: number | null }>;
    }> = [];
    if (allClassIds.length > 0) {
      rollCallLists = await prisma.rollCallList.findMany({
        where: { classId: { in: allClassIds }, enrolled: true },
        include: {
          class: true,
          leader: { select: { id: true, name: true } },
          attendances: true,
        },
      });
    }

    // Collect all classes the member oversees (deduplicated by classId, skip nulls)
    const seen = new Set<number>();
    const allClasses: Array<{ id: number; class: { id: number; name: string } }> = [];
    for (const d of myDuties) {
      if (d.class && d.classId != null && !seen.has(d.classId)) {
        seen.add(d.classId);
        allClasses.push({ id: d.id, class: d.class });
      }
    }
    for (const s of scheduleClasses) {
      if (s.class && s.classId != null && !seen.has(s.classId)) {
        seen.add(s.classId);
        allClasses.push({ id: 0, class: s.class });
      }
    }

    // Get member's own duty schedule (值班位置)
    const myDutySchedules = await prisma.dutySchedule.findMany({
      where: { memberId: session.id },
      include: {
        dormitory: { select: { id: true, building: true } },
      },
      orderBy: { dayOfWeek: "asc" },
    });

    // Resolve today's active class (daily + weekly)
    let todayClass: { classId: number; name: string } | null = null;

    // Check daily mode first
    const todayDaily = myDuties.find((d) => d.mode === "daily" && d.dayOfWeek === today);
    if (todayDaily && todayDaily.class) {
      todayClass = { classId: todayDaily.classId, name: todayDaily.class.name };
    } else {
      // Check weekly mode
      const myWeekly = myDuties.filter((d) => d.mode === "weekly");
      if (myWeekly.length > 0) {
        const active = resolveWeeklyActive(myWeekly);
        if (active) todayClass = active;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        onDuty: !!isOnDuty,
        todayClass,
        myClasses: allClasses,
        myDuties: myDutySchedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          building: s.dormitory.building,
        })),
        rollCallLists,
      },
    });
  }

  if (session.role === "leader") {
    // Check if leader has enrolled
    const rollCallList = await prisma.rollCallList.findFirst({
      where: { leaderId: session.id, enrolled: true },
      include: {
        class: true,
        attendances: true,
      },
    });

    const hasEnrolled = !!rollCallList;

    // Get today's duty classes for the leader's dormitory building
    let todayDuties: { className: string }[] = [];
    let dormitoryBuilding: string | null = null;

    if (session.classId) {
      // Get the leader's class with dormitory info
      const leaderClass = await prisma.class.findUnique({
        where: { id: session.classId },
        include: { dormitory: true },
      });

      if (leaderClass?.dormitoryId) {
        dormitoryBuilding = leaderClass.dormitory?.building || null;

        // Get all classes in this dormitory
        const dormClasses = await prisma.class.findMany({
          where: { dormitoryId: leaderClass.dormitoryId },
          select: { id: true, name: true },
        });
        const dormClassIds = dormClasses.map(c => c.id);

        if (dormClassIds.length > 0) {
          // Get duties for all classes in this dormitory
          const memberDuties = await prisma.memberDuty.findMany({
            where: {
              classId: { in: dormClassIds },
              dayOfWeek: today,
              mode: "daily",
            },
            include: { class: true },
          });
          const scheduleDuties = await prisma.dutySchedule.findMany({
            where: { classId: { in: dormClassIds }, dayOfWeek: today },
            include: { class: true },
          });
          const seen = new Set<string>();
          todayDuties = [...memberDuties, ...scheduleDuties]
            .filter(d => {
              if (!d.class) return false;
              if (seen.has(d.class.name)) return false;
              seen.add(d.class.name);
              return true;
            })
            .map(d => ({ className: d.class!.name }));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        hasEnrolled,
        rollCallList,
        todayDuties,
        dormitoryBuilding,
        classId: session.classId,
        className: rollCallList?.class?.name || null,
      },
    });
  }

  return NextResponse.json({ success: false, error: "无效角色" }, { status: 400 });
  } catch (e) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ success: false, error: "服务器错误" }, { status: 500 });
  }
}
