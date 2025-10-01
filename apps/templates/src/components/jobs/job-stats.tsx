"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { 
  Briefcase, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  PauseCircle,
  XCircle,
  DollarSign,
  Users,
  Calendar,
  Target,
  Timer
} from "lucide-react";
import type { MockJob } from "@/lib/mock/jobs-mock";

type Props = {
  jobs: MockJob[];
};

export function JobStats({ jobs }: Props) {
  // Calculate stats
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(job => job.status === "completed").length;
  const inProgressJobs = jobs.filter(job => job.status === "in_progress").length;
  const pendingJobs = jobs.filter(job => job.status === "pending").length;
  const overdueJobs = jobs.filter(job => job.status === "overdue").length;
  const onHoldJobs = jobs.filter(job => job.status === "on_hold").length;

  const urgentJobs = jobs.filter(job => job.priority === "urgent").length;
  const highPriorityJobs = jobs.filter(job => job.priority === "high").length;

  const totalEstimatedHours = jobs.reduce((sum, job) => sum + job.estimatedHours, 0);
  const totalActualHours = jobs.reduce((sum, job) => sum + job.actualHours, 0);
  const totalEstimatedValue = jobs.reduce((sum, job) => sum + (job.estimatedHours * job.hourlyRate), 0);
  const totalActualValue = jobs.reduce((sum, job) => sum + (job.actualHours * job.hourlyRate), 0);

  const averageProgress = totalJobs > 0 ? jobs.reduce((sum, job) => sum + job.progress, 0) / totalJobs : 0;
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  const assignedJobs = jobs.filter(job => job.assignee).length;
  const unassignedJobs = totalJobs - assignedJobs;

  const jobsDueThisWeek = jobs.filter(job => {
    if (!job.dueDate) return false;
    const dueDate = new Date(job.dueDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= now && dueDate <= weekFromNow;
  }).length;

  const statusStats = [
    { status: "pending", count: pendingJobs, label: "Pending", icon: Clock, color: "text-gray-500" },
    { status: "in_progress", count: inProgressJobs, label: "In Progress", icon: TrendingUp, color: "text-blue-500" },
    { status: "completed", count: completedJobs, label: "Completed", icon: CheckCircle, color: "text-green-500" },
    { status: "overdue", count: overdueJobs, label: "Overdue", icon: AlertTriangle, color: "text-red-500" },
    { status: "on_hold", count: onHoldJobs, label: "On Hold", icon: PauseCircle, color: "text-yellow-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overview Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalJobs}</div>
          <p className="text-xs text-muted-foreground">
            {completionRate.toFixed(1)}% completion rate
          </p>
          <Progress value={completionRate} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressJobs}</div>
          <p className="text-xs text-muted-foreground">
            {averageProgress.toFixed(1)}% average progress
          </p>
          <Progress value={averageProgress} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalActualHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">
            of {totalEstimatedHours}h estimated
          </p>
          <Progress 
            value={(totalActualHours / totalEstimatedHours) * 100} 
            className="mt-2 h-1" 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalActualValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            of ${totalEstimatedValue.toLocaleString()} estimated
          </p>
          <Progress 
            value={(totalActualValue / totalEstimatedValue) * 100} 
            className="mt-2 h-1" 
          />
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Job Status</CardTitle>
          <CardDescription>Current status distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusStats.map((stat) => {
            const Icon = stat.icon;
            const percentage = totalJobs > 0 ? (stat.count / totalJobs) * 100 : 0;
            
            return (
              <div key={stat.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm font-medium">{stat.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-bold">{stat.count}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Priority & Assignment */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Priority & Assignment</CardTitle>
          <CardDescription>High priority and assignment overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Urgent</span>
                </div>
                <Badge variant="destructive">{urgentJobs}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">High Priority</span>
                </div>
                <Badge variant="secondary">{highPriorityJobs}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Assigned</span>
                </div>
                <Badge variant="default">{assignedJobs}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Unassigned</span>
                </div>
                <Badge variant="outline">{unassignedJobs}</Badge>
              </div>
            </div>
          </div>

          {overdueJobs > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">
                  {overdueJobs} job{overdueJobs > 1 ? 's' : ''} overdue
                </span>
              </div>
            </div>
          )}

          {jobsDueThisWeek > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-800">
                  {jobsDueThisWeek} job{jobsDueThisWeek > 1 ? 's' : ''} due this week
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}