"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  PlayCircle,
  PauseCircle
} from "lucide-react";

// Components
import { JobsDataTable } from "@/components/tables/jobs/data-table";
import { JobsHeader } from "@/components/jobs-header";
import { JobSheet } from "@/components/sheets/job-sheet";
import { JobCreateSheet } from "@/components/sheets/job-create-sheet";
import { JobStats } from "@/components/jobs/job-stats";
import { JobTimeTracker } from "@/components/jobs/job-time-tracker";

// Mock data
import { jobsAPI, type MockJob, type MockProject } from "@/lib/mock/jobs-mock";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // State
  const [jobs, setJobs] = useState<MockJob[]>([]);
  const [projects, setProjects] = useState<MockProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  // Sheet states
  const [selectedJob, setSelectedJob] = useState<MockJob | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
    loadProjects();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getJobs();
      setJobs(data);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    const data = await jobsAPI.getProjects();
    setProjects(data);
  };

  // Filter functions
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || job.status === statusFilter;
    const matchesPriority = !priorityFilter || job.priority === priorityFilter;
    const matchesProject = !projectFilter || job.projectId === projectFilter;
    const matchesDate = 
      (!job.startDate || new Date(job.startDate) >= dateRange.from) &&
      (!job.startDate || new Date(job.startDate) <= dateRange.to);
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "active" && ["in_progress", "pending"].includes(job.status)) ||
      (activeTab === "completed" && job.status === "completed") ||
      (activeTab === "overdue" && job.status === "overdue") ||
      (activeTab === "on_hold" && job.status === "on_hold");
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesDate && matchesTab;
  });

  // Calculate stats
  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === "in_progress").length,
    completedJobs: jobs.filter(j => j.status === "completed").length,
    overdueJobs: jobs.filter(j => j.status === "overdue").length,
    totalHours: jobs.reduce((sum, j) => sum + j.actualHours, 0),
    totalRevenue: jobs.reduce((sum, j) => sum + (j.actualHours * j.hourlyRate), 0),
    avgCompletionRate: 85, // Mock
    utilization: 73, // Mock
  };

  // Event handlers
  const handleJobClick = (job: MockJob) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleEditJob = (job: MockJob) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleDeleteJob = async (job: MockJob) => {
    try {
      await jobsAPI.deleteJob(job.id);
      toast({
        title: "Job deleted",
        description: "The job has been deleted successfully",
      });
      await loadJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const handleStartJob = async (job: MockJob) => {
    try {
      await jobsAPI.updateJob(job.id, { status: "in_progress", startDate: new Date().toISOString() });
      setActiveTimer(job.id);
      toast({
        title: "Job started",
        description: `Timer started for ${job.title}`,
      });
      await loadJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start job",
        variant: "destructive",
      });
    }
  };

  const handleCompleteJob = async (job: MockJob) => {
    try {
      await jobsAPI.updateJob(job.id, { 
        status: "completed", 
        completedDate: new Date().toISOString(),
        progress: 100
      });
      if (activeTimer === job.id) setActiveTimer(null);
      toast({
        title: "Job completed",
        description: `${job.title} has been marked as complete`,
      });
      await loadJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete job",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = (job: MockJob) => {
    toast({
      title: "Create invoice",
      description: `Creating invoice for ${job.title}`,
    });
  };

  const handleCreateJob = async (data: any) => {
    try {
      const newJob = await jobsAPI.createJob(data);
      toast({
        title: "Job created",
        description: `${newJob.title} has been created successfully`,
      });
      setShowCreateJob(false);
      await loadJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your jobs are being exported",
    });
  };

  const handleRefresh = () => {
    loadJobs();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <JobsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        projects={projects}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onCreateJob={() => setShowCreateJob(true)}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalJobs={jobs.length}
      />

      {/* Active Timer */}
      {activeTimer && (
        <JobTimeTracker
          job={jobs.find(j => j.id === activeTimer)}
          onStop={() => {
            setActiveTimer(null);
            loadJobs();
          }}
        />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Jobs
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalJobs}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">{stats.activeJobs}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              In Progress
              <PlayCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.activeJobs}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Hours
              <Clock className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalHours.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Revenue
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Utilization
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.utilization}%
            </div>
            <p className="text-xs text-muted-foreground">
              Team capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="on_hold">On Hold</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          <JobsDataTable
            data={filteredJobs}
            loading={loading}
            hasFilters={!!searchQuery || !!statusFilter || !!priorityFilter || !!projectFilter}
            onJobClick={handleJobClick}
            onEditJob={handleEditJob}
            onDeleteJob={handleDeleteJob}
            onStartJob={handleStartJob}
            onCompleteJob={handleCompleteJob}
            onCreateInvoice={handleCreateInvoice}
          />

          {activeTab === "all" && (
            <JobStats jobs={jobs} projects={projects} />
          )}
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <JobSheet
        job={selectedJob}
        open={showJobDetails}
        onOpenChange={setShowJobDetails}
        onEdit={handleEditJob}
        onDelete={handleDeleteJob}
        onStart={handleStartJob}
        onComplete={handleCompleteJob}
        onCreateInvoice={handleCreateInvoice}
      />

      <JobCreateSheet
        open={showCreateJob}
        onOpenChange={setShowCreateJob}
        onCreate={handleCreateJob}
        projects={projects}
      />
    </div>
  );
}