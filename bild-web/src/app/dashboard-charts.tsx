"use client";

import { useState, useMemo } from "react";
import type { Task } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Pie, PieChart, Cell } from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  high: "#E53935",
  medium: "#FF9800",
  low: "#4CAF50",
};
const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

type Period = "7" | "30" | "90";

export function DashboardCharts({
  tasks,
}: {
  tasks: Task[];
}) {
  const [period, setPeriod] = useState<Period>("7");

  const pieData = useMemo(() => {
    const byPriority = { high: 0, medium: 0, low: 0 };
    for (const t of tasks) {
      const p = t.priority ?? "medium";
      if (p in byPriority) byPriority[p as keyof typeof byPriority]++;
    }
    return (["high", "medium", "low"] as const)
      .filter((p) => byPriority[p] > 0)
      .map((p) => ({
        name: PRIORITY_LABELS[p],
        value: byPriority[p],
        fill: PRIORITY_COLORS[p],
      }));
  }, [tasks]);

  const barData = useMemo(() => {
    const days = parseInt(period, 10);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const completed = tasks.filter(
      (t) => t.completed_at && new Date(t.completed_at) >= start && new Date(t.completed_at) <= end
    );
    const byDay: Record<string, number> = {};
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const t of completed) {
      if (!t.completed_at) continue;
      const key = t.completed_at.slice(0, 10);
      if (key in byDay) byDay[key]++;
    }
    return Object.entries(byDay)
      .map(([date, completed]) => ({ date, completed }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, period]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tasks by priority</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No task data yet</p>
          ) : (
            <ChartContainer
              config={{
                high: { label: "High", color: PRIORITY_COLORS.high },
                medium: { label: "Medium", color: PRIORITY_COLORS.medium },
                low: { label: "Low", color: PRIORITY_COLORS.low },
              }}
              className="h-[240px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  formatter={(value: number) => [value, "Tasks"]}
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
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks completed by day</CardTitle>
          <div className="flex gap-1 rounded-md border p-0.5">
            {(["7", "30", "90"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {p === "7" ? "7 days" : p === "30" ? "1 month" : "3 months"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {barData.every((d) => d.completed === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No completions in this period
            </p>
          ) : (
            <ChartContainer
              config={{ completed: { label: "Completed", color: "var(--primary)" } }}
              className="h-[240px] w-full"
            >
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis />
                <ChartTooltip
                  formatter={(value: number) => [value, "Completed"]}
                  labelFormatter={(v) => new Date(v).toLocaleDateString()}
                />
                <Bar
                  dataKey="completed"
                  fill="var(--primary)"
                  name="Completed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
