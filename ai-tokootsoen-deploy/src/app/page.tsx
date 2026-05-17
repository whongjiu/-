import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { prisma } from "@/lib/db";
import { getDayName, getDayOfWeek } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = getDayOfWeek();

  const schedules = await prisma.dutySchedule.findMany({
    include: {
      member: { select: { name: true } },
      class: { select: { name: true } },
      dormitory: { select: { building: true } },
    },
    orderBy: { dayOfWeek: "asc" },
  });

  // Today's duty schedules
  const todaySchedules = schedules.filter((s) => s.dayOfWeek === today);

  // Today's member duties (daily mode only)
  const todayMemberDuties = await prisma.memberDuty.findMany({
    where: { dayOfWeek: today, mode: "daily" },
    include: {
      class: { select: { id: true, name: true, dormitory: { select: { building: true } } } },
    },
  });

  // Group today's duties by dormitory
  const dormitoryDuties: Record<string, Set<string>> = {};
  for (const s of todaySchedules) {
    const b = s.dormitory.building;
    if (!dormitoryDuties[b]) dormitoryDuties[b] = new Set();
    if (s.class) dormitoryDuties[b].add(s.class.name);
  }
  for (const d of todayMemberDuties) {
    const b = d.class.dormitory?.building;
    if (b) {
      if (!dormitoryDuties[b]) dormitoryDuties[b] = new Set();
      dormitoryDuties[b].add(d.class.name);
    }
  }

  const days = [1, 2, 3, 4, 5, 7];

  return (
    <div className="relative min-h-screen bg-gradient-page overflow-hidden">
      {/* 装饰背景斑块 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[420px] h-[420px] bg-primary-200/30 rounded-full blur-3xl animate-blob" />
        <div
          className="absolute top-[30%] right-[-12%] w-[380px] h-[380px] bg-warning-200/25 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-[-10%] left-[20%] w-[360px] h-[360px] bg-success-200/25 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "6s" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-40 sticky top-0 glass-strong border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-8 h-8 rounded-lg bg-gradient-primary text-white text-sm flex items-center justify-center font-bold shadow-md shadow-primary-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              学
            </span>
            <span className="text-base sm:text-lg font-bold text-gradient-primary">
              学风管理
            </span>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">
              <span>登入系统</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Hero */}
        <section className="text-center py-10 sm:py-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-primary-100 text-xs text-primary-600 font-medium mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse-glow" />
            校园学风建设一体化平台
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
            <span className="text-gradient-primary">学风管理</span>
            <span className="text-text-title">，从这里开始</span>
          </h1>
          <p className="text-sm sm:text-base text-text-body/80 max-w-md mx-auto leading-relaxed px-2">
            涵盖值班排班、课堂点名、数据上报全流程，
            <br className="hidden sm:block" />
            助力学风管理工作高效有序开展。
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <Link href="/login">
              <Button variant="primary" size="lg">
                立即使用
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">
                了解更多
              </Button>
            </a>
          </div>
        </section>

        {/* Today's Duty */}
        <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-end justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-text-title flex items-center gap-2">
              <span className="w-1 h-5 rounded bg-gradient-to-b from-primary-400 to-primary-600" />
              今日值日
              <span className="text-sm text-text-hint font-normal">· {getDayName(today)}</span>
            </h2>
          </div>
          {Object.keys(dormitoryDuties).length > 0 ? (
            <div className="grid gap-2.5 sm:gap-3 stagger-fade">
              {Object.entries(dormitoryDuties).map(([building, classes]) => (
                <Card key={building} hoverable>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-tag bg-warning-50 text-warning-700 text-xs font-semibold shrink-0 ring-1 ring-warning-100">
                      📍 {building}
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 flex-1">
                      {[...classes].map((className) => (
                        <Tag key={className} color="warning" dot>
                          {className}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-6">
                <div className="text-3xl mb-2 animate-float">🌤️</div>
                <p className="text-sm text-text-hint">今日暂无值日安排</p>
              </div>
            </Card>
          )}
        </section>

        {/* Weekly Schedule */}
        <section className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-lg sm:text-xl font-semibold text-text-title mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded bg-gradient-to-b from-primary-400 to-primary-600" />
            本周值班表
          </h2>
          <Card>
            <div className="space-y-2.5 sm:space-y-3">
              {days.map((day) => {
                const entries = schedules.filter((s) => s.dayOfWeek === day);
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={`flex items-start gap-3 rounded-lg p-2 transition-colors duration-200 ${
                      isToday ? "bg-primary-50/60" : "hover:bg-bg-hover"
                    }`}
                  >
                    <span
                      className={`text-xs sm:text-sm font-semibold w-10 sm:w-12 shrink-0 pt-1 ${
                        isToday ? "text-primary-600" : "text-text-body"
                      }`}
                    >
                      {getDayName(day)}
                      {isToday && (
                        <span className="block text-[10px] font-medium text-primary-500 mt-0.5">
                          今天
                        </span>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 flex-1">
                      {entries.length > 0 ? (
                        entries.map((entry) => (
                          <Tag key={entry.id} color="primary" dot>
                            {entry.member.name} · {entry.dormitory.building}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-sm text-text-disabled">暂无安排</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Features */}
        <section
          id="features"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 stagger-fade"
        >
          {[
            {
              icon: "📋",
              title: "值班排班",
              desc: "周循环排班，实时同步查看",
              color: "from-primary-50 to-primary-100/40",
              iconBg: "bg-primary-100",
            },
            {
              icon: "📝",
              title: "在线点名",
              desc: "移动端流畅点名，数据实时上报",
              color: "from-success-50 to-success-100/40",
              iconBg: "bg-success-100",
            },
            {
              icon: "📊",
              title: "数据可视化",
              desc: "考勤数据一目了然，随时可查",
              color: "from-warning-50 to-warning-100/40",
              iconBg: "bg-warning-100",
            },
          ].map((f) => (
            <Card
              key={f.title}
              hoverable
              className={`text-center bg-gradient-to-br ${f.color} border-white/60`}
            >
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-xl ${f.iconBg} flex items-center justify-center text-2xl shadow-sm hover:scale-110 hover:-rotate-6 transition-transform duration-300`}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-text-title mb-1">{f.title}</h3>
              <p className="text-xs sm:text-sm text-text-hint leading-relaxed">
                {f.desc}
              </p>
            </Card>
          ))}
        </section>

        <footer className="text-center py-6 sm:py-8 text-xs sm:text-sm text-text-disabled">
          学风管理系统 © 2026 · 校园学风建设管理平台
        </footer>
      </main>
    </div>
  );
}
