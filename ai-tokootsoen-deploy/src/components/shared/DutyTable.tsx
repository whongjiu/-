import Card from "../ui/Card";
import Tag from "../ui/Tag";
import { getDayName } from "@/lib/utils";

interface DutyRow {
  id: number;
  dayOfWeek: number;
  member: { name: string };
  class: { name: string };
  dormitory: { building: string };
}

interface DutyTableProps {
  data: DutyRow[];
  title?: string;
  compact?: boolean;
}

export default function DutyTable({ data, title, compact }: DutyTableProps) {
  const days = [1, 2, 3, 4, 5, 7]; // 周一到周五+周日

  return (
    <Card>
      {title && (
        <h3 className="text-base font-semibold text-text-body mb-4">{title}</h3>
      )}
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {days.map((day) => {
          const entries = data.filter((d) => d.dayOfWeek === day);
          return (
            <div key={day} className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-body w-10 shrink-0">
                {getDayName(day)}
              </span>
              {entries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {entries.map((entry) => (
                    <Tag key={entry.id} color="primary">
                      {entry.member.name} · {entry.class.name} · {entry.dormitory.building}
                    </Tag>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-text-disabled">—</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
