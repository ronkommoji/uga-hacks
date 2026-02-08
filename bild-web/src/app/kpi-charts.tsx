"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Pie, PieChart, Cell } from "recharts";

const statusConfig: ChartConfig = {
  pending: { label: "Pending", color: "hsl(var(--muted-foreground))" },
  in_progress: { label: "In Progress", color: "hsl(var(--chart-3))" },
  blocked: { label: "Blocked", color: "hsl(var(--destructive))" },
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
};

const statusColors = ["#A08050", "#2196F3", "#E53935", "#4CAF50"];

type Stats = {
  tasksByStatus: {
    pending: number;
    in_progress: number;
    blocked: number;
    completed: number;
  };
  activity?: { action: string; created_at: string | null }[];
};

export function KpiCharts({ stats }: { stats: Stats }) {
  const statusData = [
    { name: "Pending", value: stats.tasksByStatus.pending, fill: statusColors[0] },
    { name: "In progress", value: stats.tasksByStatus.in_progress, fill: statusColors[1] },
    { name: "Blocked", value: stats.tasksByStatus.blocked, fill: statusColors[2] },
    { name: "Completed", value: stats.tasksByStatus.completed, fill: statusColors[3] },
  ].filter((d) => d.value > 0);

  const activityByDay = (stats.activity ?? []).reduce(
    (acc, a) => {
      const day = a.created_at?.slice(0, 10) ?? "unknown";
      if (!acc[day]) acc[day] = { date: day, completed: 0, started: 0, blocked: 0 };
      if (a.action === "task_completed") acc[day].completed += 1;
      if (a.action === "task_started") acc[day].started += 1;
      if (a.action === "task_blocked") acc[day].blocked += 1;
      return acc;
    },
    {} as Record<string, { date: string; completed: number; started: number; blocked: number }>
  );
  const activityChartData = Object.values(activityByDay).sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tasks by status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No task data yet
            </p>
          ) : (
            <ChartContainer config={statusConfig} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip
                  formatter={(value) => [value, "Tasks"]}
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border bg-card p-2 shadow-sm">
                        <p className="font-medium">{payload[0].name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].value} tasks
                        </p>
                      </div>
                    ) : null
                  }
                />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {activityChartData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No activity in the last 7 days
            </p>
          ) : (
            <ChartContainer
              config={{
                completed: { label: "Completed", color: "hsl(var(--chart-2))" },
                started: { label: "Started", color: "hsl(var(--chart-3))" },
                blocked: { label: "Blocked", color: "hsl(var(--destructive))" },
              }}
              className="h-[240px] w-full"
            >
              <BarChart data={activityChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                />
                <YAxis />
                <ChartTooltip
                  formatter={(value) => [value, ""]}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="started" fill="hsl(var(--chart-3))" name="Started" radius={[4, 4, 0, 0]} />
                <Bar dataKey="blocked" fill="hsl(var(--destructive))" name="Blocked" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
