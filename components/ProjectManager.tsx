"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  FolderGit2,
  Search,
  Plus,
  Filter,
  X,
  Check,
} from "./icons";
import { Project, ProjectStatus } from "./types";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";
import { toast } from "./Toast";
import { confirmDialog } from "./ConfirmDialog";
import {
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  ProjectInput,
} from "@/app/projects/actions";

interface ProjectManagerProps {
  initialProjects: Project[];
  onProjectsChange?: (projects: Project[]) => void;
}

export function ProjectManager({
  initialProjects,
  onProjectsChange,
}: ProjectManagerProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [, startTransition] = useTransition();

  const syncProjects = (updated: Project[]) => {
    setProjects(updated);
    onProjectsChange?.(updated);
  };

  // Create / Update
  const handleCreateOrUpdate = async (data: ProjectInput) => {
    if (editingProject) {
      // Optimistic update
      const updated = projects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: data.name,
              description: data.description || null,
              technologies: data.technology_stack || [],
              technology_stack: data.technology_stack || [],
              technology: data.technology_stack || [],
              status: data.status || p.status,
              progress: data.progress !== undefined ? data.progress : p.progress,
              start_date: data.start_date || null,
              target_date: data.target_date || null,
            }
          : p
      );
      syncProjects(updated);

      const res = await updateProject(editingProject.id, data);
      if (res?.error) {
        toast.error("Failed to update project", { description: res.error });
        syncProjects(projects);
        return { error: res.error };
      }
      toast.success("Project updated", { description: `Changes to "${data.name}" were saved.` });
    } else {
      // Create project
      const res = await createProject(data);
      if (res?.error) {
        toast.error("Failed to create project", { description: res.error });
        return { error: res.error };
      }
      if (res?.data) {
        const created: Project = {
          id: res.data.id,
          user_id: res.data.user_id,
          name: res.data.name,
          description: res.data.description,
          technologies: res.data.technologies || [],
          technology_stack: res.data.technologies || [],
          technology: res.data.technologies || [],
          status: (res.data.status as ProjectStatus) || "In Progress",
          progress: res.data.progress ?? 0,
          start_date: res.data.start_date,
          target_date: res.data.target_date,
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
          tasks_count: 0,
          completed_tasks_count: 0,
        };
        syncProjects([created, ...projects]);
        toast.success("Project created", { description: `"${created.name}" created in Supabase.` });
      }
    }
  };

  const handleArchive = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    const confirmed = await confirmDialog({
      title: target ? `Archive "${target.name}"?` : "Archive project?",
      description: "This project will be marked as Archived. You can reactivate or edit it at any time.",
      confirmText: "Archive Project",
      cancelText: "Cancel",
      variant: "warning",
      onConfirm: async () => {
        const res = await archiveProject(id);
        if (res?.error) {
          throw new Error(res.error);
        }
      },
    });

    if (confirmed) {
      syncProjects(
        projects.map((p) => (p.id === id ? { ...p, status: "Archived" } : p))
      );
      toast.success("Project archived", {
        description: `"${target?.name || "Project"}" has been archived.`,
      });
    }
  };

  const handleDelete = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    const confirmed = await confirmDialog({
      title: target ? `Delete "${target.name}"?` : "Delete project?",
      description: "This will permanently remove the project and its roadmap metadata. This action cannot be undone.",
      confirmText: "Delete Project",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        const res = await deleteProject(id);
        if (res?.error) {
          throw new Error(res.error);
        }
      },
    });

    if (confirmed) {
      syncProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted", {
        description: "The project was permanently deleted.",
      });
    }
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const tech =
        p.technology_stack || p.technologies || p.technology || [];
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        tech.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const totalCount = projects.length;
  const inProgressCount = projects.filter((p) => p.status === "In Progress").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Project Tracker</span>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-xs text-violet-400 font-mono">
              {totalCount} repositories
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Architecture, technology stacks, and task-linked progress
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-violet-700/30 hover:bg-violet-500 active:scale-98 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search and Status Filters */}
      <div className="rounded-xl border border-white/5 bg-[#121217] p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search projects by name, description, tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-white/10 pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/5 text-xs self-start md:self-auto overflow-x-auto max-w-full">
            {["All", "Planning", "In Progress", "Review", "Completed", "Archived"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs transition-colors ${
                    statusFilter === status
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/30 font-medium"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#121217] py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-500 mb-3">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No projects found</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              {searchQuery || statusFilter !== "All"
                ? "No projects match your filter criteria. Try clearing filters."
                : "No projects in Supabase yet. Click 'New Project' to register your first repository."}
            </p>
            {(searchQuery || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("All");
                }}
                className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleOpenEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialProject={editingProject}
      />
    </div>
  );
}
