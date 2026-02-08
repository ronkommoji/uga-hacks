import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ListTodo,
} from "lucide-react";

type Stats = {
  projectCount: number;
  totalTasks: number;
  completedTasks: number;
  blockedCount: number;
  completionRate: number;
  completedThisWeek: number;
};

export function KpiCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Active projects",
      value: stats.projectCount,
      icon: FolderKanban,
      desc: "Projects in progress",
    },
    {
      title: "Total tasks",
      value: stats.totalTasks,
      icon: ListTodo,
      desc: `${stats.completedTasks} completed`,
    },
    {
      title: "Completion rate",
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      desc: "Across all projects",
    },
    {
      title: "Blockers",
      value: stats.blockedCount,
      icon: AlertCircle,
      desc: "Need attention",
      variant: stats.blockedCount > 0 ? "destructive" : "default",
    },
    {
      title: "Completed this week",
      value: stats.completedThisWeek,
      icon: CheckCircle2,
      desc: "Tasks finished in last 7 days",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
