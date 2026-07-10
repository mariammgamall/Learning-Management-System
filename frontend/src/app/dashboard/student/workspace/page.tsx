'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useToastStore } from '../../../../hooks/useToastStore';
import { api } from '../../../../utils/api';
import {
  Briefcase,
  Users,
  FolderGit2,
  FileCheck,
  Plus,
  Send,
  X,
  Loader2,
  CheckCircle,
  ExternalLink,
  Code2,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function StudentWorkspacePage() {
  const { lang } = useTranslation();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<'teams' | 'projects' | 'internships' | 'applications'>('teams');

  // Modals & form states
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);

  const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projCategory, setProjCategory] = useState('');
  const [projTechs, setProjTechs] = useState('');
  const [projFeatures, setProjFeatures] = useState('');
  const [projStatus, setProjStatus] = useState('Planning');
  const [projProgress, setProjProgress] = useState(0);
  const [projDemo, setProjDemo] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projDocs, setProjDocs] = useState('');
  const [projTeamId, setProjTeamId] = useState('');
  const [projVideoUrl, setProjVideoUrl] = useState('');
  const [projLogo, setProjLogo] = useState<File | null>(null);
  const [projVideoFile, setProjVideoFile] = useState<File | null>(null);
  const [projFiles, setProjFiles] = useState<FileList | null>(null);
  const [isCreatingProj, setIsCreatingProj] = useState(false);

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedInternship, setSelectedInternship] = useState<any>(null);

  const formatExternalUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Queries
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ['workspace-teams'],
    queryFn: async () => {
      const response = await api.get('/workspace/teams');
      return response.data;
    },
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['workspace-projects'],
    queryFn: async () => {
      const response = await api.get('/workspace/projects');
      return response.data;
    },
  });

  const { data: internships = [], isLoading: isLoadingInternships } = useQuery({
    queryKey: ['workspace-internships'],
    queryFn: async () => {
      const response = await api.get('/workspace/internships');
      return response.data;
    },
  });

  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['workspace-applications'],
    queryFn: async () => {
      const response = await api.get('/workspace/applications');
      return response.data;
    },
  });

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      await api.post('/workspace/teams', { name: teamName, description: teamDesc });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-teams'] });
      addToast(lang === 'en' ? 'Team created successfully!' : 'تم إنشاء الفريق بنجاح!', 'success');
      setTeamName('');
      setTeamDesc('');
      setIsCreateTeamOpen(false);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create team', 'error');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ teamId, email, roleName }: { teamId: string; email: string; roleName: string }) => {
      await api.post(`/workspace/teams/${teamId}/invite`, { email, roleName });
    },
    onSuccess: () => {
      addToast(lang === 'en' ? 'Invitation sent successfully!' : 'تم إرسال الدعوة بنجاح!', 'success');
      setInviteEmail('');
      setInvitingTeamId(null);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to send invite', 'error');
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string; status: string }) => {
      await api.put(`/workspace/teams/invitations/${inviteId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-teams'] });
      addToast(lang === 'en' ? 'Invitation updated successfully' : 'تم تحديث الدعوة بنجاح', 'success');
    },
  });

  const createProjMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await api.post('/workspace/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
      addToast(lang === 'en' ? 'Project created/submitted successfully!' : 'تم إنشاء وتسليم المشروع بنجاح!', 'success');
      setIsCreateProjOpen(false);
      // Reset form
      setProjName('');
      setProjDesc('');
      setProjCategory('');
      setProjTechs('');
      setProjFeatures('');
      setProjStatus('Planning');
      setProjProgress(0);
      setProjDemo('');
      setProjGithub('');
      setProjDocs('');
      setProjTeamId('');
      setProjVideoUrl('');
      setProjLogo(null);
      setProjVideoFile(null);
      setProjFiles(null);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create project', 'error');
    },
  });

  const applyInternshipMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/workspace/internships/${id}/apply`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-applications'] });
      addToast(lang === 'en' ? 'Application submitted successfully!' : 'تم تقديم الطلب بنجاح!', 'success');
      setSelectedInternship(null);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to apply', 'error');
    },
  });

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamDesc.trim()) return;
    createTeamMutation.mutate();
  };

  const handleCreateProjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projDesc.trim() || !projCategory.trim()) return;

    const techsArray = projTechs.split(',').map(s => s.trim()).filter(Boolean);
    const featuresArray = projFeatures.split(',').map(s => s.trim()).filter(Boolean);

    const formData = new FormData();
    formData.append('name', projName);
    formData.append('description', projDesc);
    formData.append('category', projCategory);
    formData.append('technologies', JSON.stringify(techsArray));
    formData.append('keyFeatures', JSON.stringify(featuresArray));
    formData.append('status', projStatus);
    formData.append('completionPercentage', String(projProgress));
    if (projDemo) formData.append('liveDemoUrl', projDemo);
    if (projGithub) formData.append('githubUrl', projGithub);
    if (projDocs) formData.append('docsUrl', projDocs);
    if (projTeamId) formData.append('teamId', projTeamId);
    if (projVideoUrl) formData.append('demoVideoUrl', projVideoUrl);

    if (projLogo) {
      formData.append('logo', projLogo);
    }
    if (projVideoFile) {
      formData.append('demoVideo', projVideoFile);
    }
    if (projFiles) {
      for (let i = 0; i < projFiles.length; i++) {
        formData.append('files', projFiles[i]);
      }
    }

    createProjMutation.mutate(formData);
  };

  // Filter invitations and active memberships
  const invitations = teams.filter((t: any) => t.status === 'Pending');
  const activeTeams = teams.filter((t: any) => t.status === 'Accepted');

  return (
    <div className="space-y-6">
      {/* Top Welcome Panel */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft">
        <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-mint-500" />
          {lang === 'en' ? 'Student Workspace Studio' : 'مساحة عمل الطلاب الاحترافية'}
        </h2>
        <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
          {lang === 'en'
            ? 'Collaborate with colleagues, build portfolios, show features, and track internship job roles.'
            : 'تعاون مع زملائك، ابني سيرة مشاريعك الذاتية، وتتبع فرص التدريب المهني.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-beige-200 dark:border-neutral-800 pb-3 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveSection('teams')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'teams'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Users className="w-4 h-4" />
          {lang === 'en' ? 'Collaborative Teams' : 'الفرق التعاونية'}
        </button>

        <button
          onClick={() => setActiveSection('projects')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'projects'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          {lang === 'en' ? 'Projects Portfolio' : 'معرض المشاريع'}
        </button>

        <button
          onClick={() => setActiveSection('internships')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'internships'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          {lang === 'en' ? 'Internship Board' : 'فرص التدريب المهني'}
        </button>

        <button
          onClick={() => setActiveSection('applications')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'applications'
              ? 'bg-mint-500 text-white shadow-soft'
              : 'text-text-secondary hover:bg-beige-100 dark:hover:bg-neutral-850'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          {lang === 'en' ? 'Applications' : 'الطلبات المقدمة'}
        </button>
      </div>

      {/* Content Rendering Switcher */}
      <div className="space-y-6">

        {/* ==========================================
            A. TEAMS SECTION
           ========================================== */}
        {activeSection === 'teams' && (
          <div className="space-y-6">
            {/* Team actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">
                {lang === 'en' ? 'Team Cohorts' : 'فرق العمل التعاونية'}
              </h3>
              <button
                onClick={() => setIsCreateTeamOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-lg transition-transform hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                {lang === 'en' ? 'Create Team' : 'إنشاء فريق'}
              </button>
            </div>

            {/* Invitations Alert Banner */}
            {invitations.length > 0 && (
              <div className="space-y-3">
                {invitations.map((inv: any) => (
                  <div key={inv.id} className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-semibold text-amber-800 dark:text-amber-400">
                    <div>
                      <p className="font-bold">
                        {lang === 'en'
                          ? `You have been invited to join "${inv.team.name}" as ${inv.roleName}`
                          : `لقد تم دعوتك للانضمام إلى فريق "${inv.team.name}" بدور ${inv.roleName}`}
                      </p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{inv.team.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptInviteMutation.mutate({ inviteId: inv.id, status: 'Accepted' })}
                        className="px-3 py-1 bg-mint-500 hover:bg-mint-400 text-white font-black text-[10px] rounded-lg"
                      >
                        {lang === 'en' ? 'Accept' : 'قبول'}
                      </button>
                      <button
                        onClick={() => acceptInviteMutation.mutate({ inviteId: inv.id, status: 'Rejected' })}
                        className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 font-black text-[10px] rounded-lg"
                      >
                        {lang === 'en' ? 'Reject' : 'رفض'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Teams Grid */}
            {isLoadingTeams ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
              </div>
            ) : activeTeams.length === 0 ? (
              <div className="p-12 text-center text-text-secondary bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800">
                <Users className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                <p className="text-xs font-bold">{lang === 'en' ? 'No teams joined yet' : 'لم تنضم لأي فريق عمل بعد'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTeams.map((membership: any) => {
                  const team = membership.team;
                  const isLead = membership.roleName === 'Team Lead';

                  return (
                    <div key={team.id} className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">{team.name}</h4>
                          <span className="px-2 py-0.5 bg-mint-50 text-mint-600 dark:bg-mint-950/20 dark:text-mint-400 text-[8px] font-black uppercase rounded">
                            {membership.roleName}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary dark:text-neutral-400 font-semibold mt-1">
                          {team.description}
                        </p>
                      </div>

                      {/* Team Members List */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Team Members</span>
                        <div className="flex flex-wrap gap-2">
                          {team.members.map((m: any) => (
                            <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-beige-50 dark:bg-neutral-850 rounded-xl text-[10px] font-bold border border-beige-100 dark:border-neutral-805">
                              {m.user.profilePhoto ? (
                                <img src={m.user.profilePhoto} alt={m.user.name} className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <div className="w-4 h-4 bg-beige-200 dark:bg-neutral-800 text-text-secondary text-[8px] flex items-center justify-center font-bold rounded-full">
                                  {m.user.name.charAt(0)}
                                </div>
                              )}
                              <span>{m.user.name} ({m.roleName})</span>
                              {m.status === 'Pending' && <span className="text-[8px] text-amber-500 font-black italic">[Invited]</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Lead Actions */}
                      {isLead && (
                        <div className="border-t border-beige-50 dark:border-neutral-850 pt-3">
                          <button
                            onClick={() => setInvitingTeamId(team.id)}
                            className="text-[10px] font-black text-mint-500 hover:text-mint-450 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            {lang === 'en' ? 'Invite Colleague to Team' : 'دعوة زميل للفريق'}
                          </button>

                          {invitingTeamId === team.id && (
                            <div className="mt-3 p-3 bg-beige-50/50 dark:bg-neutral-850 rounded-xl space-y-2 text-xs">
                              <div className="flex gap-2">
                                <input
                                  type="email"
                                  placeholder="Colleague Email..."
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  className="w-full px-2.5 py-1 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg outline-none bg-white font-semibold"
                                />
                                <input
                                  type="text"
                                  placeholder="Role: e.g. Frontend..."
                                  value={inviteRole}
                                  onChange={(e) => setInviteRole(e.target.value)}
                                  className="px-2.5 py-1 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg outline-none bg-white font-semibold max-w-[120px]"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setInvitingTeamId(null)}
                                  className="px-2.5 py-1 text-[10px] font-bold text-text-secondary"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => inviteMutation.mutate({ teamId: team.id, email: inviteEmail, roleName: inviteRole })}
                                  className="px-3 py-1 bg-mint-500 hover:bg-mint-400 text-white font-black text-[10px] rounded-lg"
                                >
                                  Invite
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            B. PROJECTS PORTFOLIO SECTION
           ========================================== */}
        {activeSection === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">
                {lang === 'en' ? 'Product Portfolios' : 'معرض أعمال المشاريع'}
              </h3>
              <button
                onClick={() => setIsCreateProjOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-lg transition-transform hover:scale-102"
              >
                <Plus className="w-4 h-4" />
                {lang === 'en' ? 'Create Project' : 'إضافة مشروع'}
              </button>
            </div>

            {isLoadingProjects ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center text-text-secondary bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800">
                <FolderGit2 className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                <p className="text-xs font-bold">{lang === 'en' ? 'No projects registered' : 'لا توجد مشاريع مسجلة حالياً'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((proj: any) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4 hover:border-mint-300 transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <span className="px-2 py-0.5 bg-beige-100 dark:bg-neutral-800 text-text-secondary dark:text-neutral-300 text-[8px] font-black uppercase rounded">
                          {proj.category}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                          proj.status === 'Completed' ? 'bg-mint-50 text-mint-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {proj.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100">{proj.name}</h4>
                      <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold line-clamp-3">
                        {proj.description}
                      </p>

                      {/* Tech stack badges */}
                      <div className="flex flex-wrap gap-1">
                        {proj.technologies.slice(0, 4).map((tech: string) => (
                          <span key={tech} className="px-2 py-0.5 bg-beige-50 dark:bg-neutral-850 border border-beige-100 dark:border-neutral-800 text-[9px] font-bold text-text-secondary rounded-lg">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="space-y-1.5 border-t border-beige-50 dark:border-neutral-850 pt-4 mt-3">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-text-secondary">Completion Progress</span>
                        <span className="text-mint-500">{proj.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-beige-100 dark:bg-neutral-850 h-2 rounded-full overflow-hidden">
                        <div className="bg-mint-500 h-full rounded-full" style={{ width: `${proj.completionPercentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            C. INTERNSHIPS BOARD SECTION
           ========================================== */}
        {activeSection === 'internships' && (
          <div className="space-y-6">
            <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">
              {lang === 'en' ? 'Discovered Internships' : 'لوحة التدريب والفرص المهنية'}
            </h3>

            {isLoadingInternships ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
              </div>
            ) : internships.length === 0 ? (
              <p className="text-xs text-text-secondary font-bold">No active internship positions available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {internships.map((intern: any) => (
                  <div
                    key={intern.id}
                    onClick={() => setSelectedInternship(intern)}
                    className="p-6 bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl shadow-soft space-y-4 hover:border-mint-250 transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-text-primary dark:text-neutral-100 truncate">{intern.title}</h4>
                          <p className="text-[10px] text-text-secondary font-bold mt-0.5">{intern.companyName} | {intern.industry}</p>
                        </div>
                        {intern.companyLogo && (
                          <img src={intern.companyLogo} alt={intern.companyName} className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-text-secondary dark:text-neutral-450 font-semibold line-clamp-3">
                        {intern.companyDescription}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {intern.skills.map((skill: string) => (
                          <span key={skill} className="px-2 py-0.5 bg-mint-50/50 dark:bg-mint-950/20 text-mint-600 dark:text-mint-400 text-[9px] font-bold rounded-lg">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-beige-50 dark:border-neutral-850 pt-3 mt-3 flex items-center justify-between text-[10px] text-text-secondary font-bold">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {intern.mode}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Deadline: {new Date(intern.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            D. APPLICATIONS LIST SECTION
           ========================================== */}
        {activeSection === 'applications' && (
          <div className="space-y-6">
            <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider">
              {lang === 'en' ? 'My Internship Applications' : 'طلبات التوظيف والتدريب الأكاديمي'}
            </h3>

            {isLoadingApps ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-text-secondary bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800">
                <FileCheck className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                <p className="text-xs font-bold">{lang === 'en' ? 'No applications submitted' : 'لم تقدم على أي تدريبات أكاديمية بعد'}</p>
              </div>
            ) : (
              <div className="divide-y divide-beige-100 dark:divide-neutral-850 border border-beige-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 shadow-soft">
                {applications.map((app: any) => (
                  <div key={app.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold text-text-primary dark:text-neutral-200">
                    <div>
                      <p className="font-bold text-sm">{app.internship.title}</p>
                      <p className="text-text-secondary font-bold mt-0.5">{app.internship.companyName}</p>
                      <p className="text-[9px] text-text-secondary/70 mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${
                      app.status === 'Accepted'
                        ? 'bg-green-50 text-green-600'
                        : app.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE TEAM MODAL OVERLAY */}
      {isCreateTeamOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 space-y-4 text-xs font-semibold animate-scale-up">
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-mint-500" />
                {lang === 'en' ? 'Create New Team' : 'تأسيس فريق تعاوني جديد'}
              </h3>
              <button onClick={() => setIsCreateTeamOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold block">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold block">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg outline-none focus:ring-1 focus:ring-mint-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={createTeamMutation.isPending}
                className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2"
              >
                {createTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Team'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL OVERLAY */}
      {isCreateProjOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 space-y-4 text-xs font-semibold animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-mint-500" />
                {lang === 'en' ? 'Register New Project' : 'إضافة مشروع جديد للمعرض'}
              </h3>
              <button onClick={() => setIsCreateProjOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projName}
                    onChange={(e) => setProjName(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Application"
                    value={projCategory}
                    onChange={(e) => setProjCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold block">Project Description *</label>
                <textarea
                  required
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Technologies (comma separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Next.js, Python, FastAPI"
                    value={projTechs}
                    onChange={(e) => setProjTechs(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Key Features (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Authentication, AI Summaries"
                    value={projFeatures}
                    onChange={(e) => setProjFeatures(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Status</label>
                  <select
                    value={projStatus}
                    onChange={(e) => setProjStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={projProgress}
                    onChange={(e) => setProjProgress(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Link to Team (Optional)</label>
                  <select
                    value={projTeamId}
                    onChange={(e) => setProjTeamId(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  >
                    <option value="">None</option>
                    {activeTeams.map((t: any) => (
                      <option key={t.team.id} value={t.team.id}>{t.team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Live Demo URL</label>
                  <input
                    type="url"
                    value={projDemo}
                    onChange={(e) => setProjDemo(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">GitHub URL</label>
                  <input
                    type="url"
                    value={projGithub}
                    onChange={(e) => setProjGithub(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Docs URL</label>
                  <input
                    type="url"
                    value={projDocs}
                    onChange={(e) => setProjDocs(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Project Logo File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProjLogo(e.target.files?.[0] || null)}
                    className="w-full text-xs text-text-secondary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-beige-100 file:text-text-primary hover:file:bg-beige-200 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Submit Project Files / Code (Multiple)</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setProjFiles(e.target.files)}
                    className="w-full text-xs text-text-secondary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-beige-100 file:text-text-primary hover:file:bg-beige-200 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Demo Video URL</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={projVideoUrl}
                    onChange={(e) => setProjVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block">Or Upload Demo Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setProjVideoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-text-secondary file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-beige-100 file:text-text-primary hover:file:bg-beige-200 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createProjMutation.isPending}
                className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2"
              >
                {createProjMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DETAILS VIEW MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 space-y-4 text-xs font-semibold animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-mint-500" />
                {selectedProject.name}
              </h3>
              <button onClick={() => setSelectedProject(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-text-primary dark:text-neutral-200">
              <div className="flex justify-between">
                <span className="px-2.5 py-1 bg-beige-50 dark:bg-neutral-850 text-text-secondary rounded-lg">Category: {selectedProject.category}</span>
                <span className="px-2.5 py-1 bg-mint-50 text-mint-600 rounded-lg">Status: {selectedProject.status}</span>
              </div>

              <div className="space-y-1 bg-beige-50/50 dark:bg-neutral-850/50 p-4 rounded-2xl">
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Overview</span>
                <p className="leading-relaxed text-text-secondary dark:text-neutral-350">{selectedProject.description}</p>
              </div>

              {/* Technologies list */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Technology Stack</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.technologies.map((tech: string) => (
                    <span key={tech} className="px-2.5 py-1 bg-mint-50/40 dark:bg-mint-950/20 text-mint-600 dark:text-mint-400 rounded-xl font-bold">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Features */}
              {selectedProject.keyFeatures && selectedProject.keyFeatures.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Key Features</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.keyFeatures.map((feat: string) => (
                      <div key={feat} className="p-3 bg-beige-50/30 dark:bg-neutral-850/30 border border-beige-100 dark:border-neutral-800 rounded-xl flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-mint-500 flex-shrink-0 mt-0.5" />
                        <span className="text-text-secondary dark:text-neutral-300 font-bold">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Video Player or Link */}
              {selectedProject.demoVideoUrl && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Demo Video</span>
                  {selectedProject.demoVideoUrl.match(/\.(mp4|webm|ogg)$/i) || selectedProject.demoVideoUrl.includes('cloudinary') ? (
                    <video
                      src={formatExternalUrl(selectedProject.demoVideoUrl)}
                      controls
                      className="w-full rounded-xl border border-beige-200 dark:border-neutral-805 max-h-[200px] bg-black"
                    />
                  ) : (
                    <a
                      href={formatExternalUrl(selectedProject.demoVideoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 bg-beige-50 dark:bg-neutral-850 border border-beige-200 dark:border-neutral-800 text-text-primary dark:text-neutral-200 rounded-xl hover:text-mint-500 font-bold block"
                    >
                      <ExternalLink className="w-4 h-4 text-mint-500" />
                      {lang === 'en' ? 'Watch Demo Video' : 'مشاهدة الفيديو التوضيحي للمشروع'}
                    </a>
                  )}
                </div>
              )}

              {/* Submitted Files and Code */}
              {selectedProject.submittedFiles && selectedProject.submittedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Submitted Project Code / Files</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.submittedFiles.map((fileUrl: string, idx: number) => {
                      const fileName = fileUrl.split('/').pop() || `Attachment_${idx + 1}`;
                      return (
                        <a
                          key={idx}
                          href={formatExternalUrl(fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-mint-50/50 dark:bg-mint-950/20 text-mint-600 dark:text-mint-400 text-[10px] font-bold rounded-lg border border-mint-100 hover:border-mint-300"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {fileName}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Project Links */}
              <div className="border-t border-beige-50 dark:border-neutral-850 pt-4 flex gap-3">
                {selectedProject.liveDemoUrl && (
                  <a
                    href={formatExternalUrl(selectedProject.liveDemoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-mint-500 hover:bg-mint-400 text-white font-bold rounded-lg text-[10px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Demo
                  </a>
                )}
                {selectedProject.githubUrl && (
                  <a
                    href={formatExternalUrl(selectedProject.githubUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-white font-bold rounded-lg text-[10px]"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    GitHub Repo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INTERNSHIP DETAILS MODAL */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[5px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 space-y-4 text-xs font-semibold animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-2">
              <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-mint-500" />
                {selectedInternship.title}
              </h3>
              <button onClick={() => setSelectedInternship(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-text-primary dark:text-neutral-200">
              <div className="flex justify-between items-center bg-beige-50 dark:bg-neutral-850 p-4 rounded-xl">
                <div>
                  <p className="font-bold text-sm">{selectedInternship.companyName}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">{selectedInternship.industry}</p>
                </div>
                {selectedInternship.companyLogo && (
                  <img src={selectedInternship.companyLogo} alt={selectedInternship.companyName} className="w-10 h-10 object-contain rounded-lg bg-white" />
                )}
              </div>

              {/* Responsibilities */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Responsibilities</span>
                <p className="leading-relaxed bg-beige-50/20 dark:bg-neutral-850/20 p-3 rounded-xl border border-beige-100 dark:border-neutral-805">
                  {selectedInternship.responsibilities}
                </p>
              </div>

              {/* Requirements */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Requirements</span>
                <p className="leading-relaxed bg-beige-50/20 dark:bg-neutral-850/20 p-3 rounded-xl border border-beige-100 dark:border-neutral-805">
                  {selectedInternship.requirements}
                </p>
              </div>

              {/* Required Skills */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider block">Required Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedInternship.skills.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-mint-50 text-mint-600 dark:bg-mint-950/20 dark:text-mint-400 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => applyInternshipMutation.mutate(selectedInternship.id)}
                disabled={applyInternshipMutation.isPending}
                className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft flex items-center justify-center gap-1.5 transition-transform hover:scale-102 mt-4"
              >
                {applyInternshipMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply for Internship Opportunity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
