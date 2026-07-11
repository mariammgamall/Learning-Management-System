'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../utils/api';
import { useToastStore } from '../../../../hooks/useToastStore';
import { useTranslation } from '../../../../hooks/useTranslation';
import ModalPortal from '../../../../components/ModalPortal';
import {
  Briefcase,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  X,
  Search,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react';

const STATUSES = ['Applied', 'Under Review', 'Interview', 'Accepted', 'Rejected'];
const STATUS_COLORS: Record<string, string> = {
  Applied: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  'Under Review': 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  Interview: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
  Accepted: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400',
  Rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
};

const emptyForm = {
  companyName: '', companyDescription: '', industry: '', website: '',
  title: '', category: '', duration: '', mode: 'Remote',
  skills: '', responsibilities: '', requirements: '', benefits: '',
  deadline: '',
};

export default function AdminInternshipsPage() {
  const { lang } = useTranslation();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'internships' | 'applications'>('internships');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [viewingApps, setViewingApps] = useState<any>(null); // internship whose applications to show
  const [appSearch, setAppSearch] = useState('');

  /* ---------- DATA ---------- */
  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['admin-internships'],
    queryFn: async () => {
      const r = await api.get('/workspace/internships');
      return r.data;
    },
  });

  const { data: allApps = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['admin-all-applications'],
    queryFn: async () => {
      const r = await api.get('/workspace/admin/applications');
      return r.data;
    },
  });

  /* ---------- MUTATIONS ---------- */
  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      await api.post('/workspace/admin/internships', {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
      addToast('Internship created successfully!', 'success');
      closeForm();
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Failed to create internship', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      await api.put(`/workspace/admin/internships/${id}`, {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
      addToast('Internship updated successfully!', 'success');
      closeForm();
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Failed to update internship', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workspace/admin/internships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-internships'] });
      addToast('Internship deleted.', 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Failed to delete', 'error'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      await api.put(`/workspace/admin/applications/${appId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-applications'] });
      addToast('Application status updated!', 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.message || 'Failed to update status', 'error'),
  });

  /* ---------- HELPERS ---------- */
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setIsFormOpen(true);
  };

  const openEdit = (internship: any) => {
    setEditingId(internship.id);
    const skills = Array.isArray(internship.skills)
      ? internship.skills.join(', ')
      : internship.skills;
    const deadline = internship.deadline
      ? new Date(internship.deadline).toISOString().split('T')[0]
      : '';
    setForm({
      companyName: internship.companyName || '',
      companyDescription: internship.companyDescription || '',
      industry: internship.industry || '',
      website: internship.website || '',
      title: internship.title || '',
      category: internship.category || '',
      duration: internship.duration || '',
      mode: internship.mode || 'Remote',
      skills,
      responsibilities: internship.responsibilities || '',
      requirements: internship.requirements || '',
      benefits: internship.benefits || '',
      deadline,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.title.trim() || !form.skills.trim() || !form.deadline) {
      addToast('Company name, title, skills, and deadline are required', 'error');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filteredInternships = internships.filter((i: any) => {
    const term = search.toLowerCase();
    return (
      i.title?.toLowerCase().includes(term) ||
      i.companyName?.toLowerCase().includes(term) ||
      i.industry?.toLowerCase().includes(term)
    );
  });

  const filteredApps = allApps.filter((a: any) => {
    const term = appSearch.toLowerCase();
    return (
      a.fullName?.toLowerCase().includes(term) ||
      a.email?.toLowerCase().includes(term) ||
      a.internship?.title?.toLowerCase().includes(term) ||
      a.internship?.companyName?.toLowerCase().includes(term)
    );
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  /* ---------- RENDER ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800 shadow-soft gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary dark:text-neutral-100 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-mint-500" />
            Internship Management
          </h2>
          <p className="text-xs font-semibold text-text-secondary dark:text-neutral-400 mt-1">
            Create, edit, and manage internship listings and review student applications.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add Internship
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', value: internships.length, icon: Briefcase, color: 'text-mint-500' },
          { label: 'Total Applications', value: allApps.length, icon: Users, color: 'text-blue-500' },
          { label: 'Accepted', value: allApps.filter((a: any) => a.status === 'Accepted').length, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Pending Review', value: allApps.filter((a: any) => a.status === 'Applied' || a.status === 'Under Review').length, icon: Clock, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800 shadow-soft flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-beige-50 dark:bg-neutral-850 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-lg font-black text-text-primary dark:text-neutral-100">{value}</p>
              <p className="text-[10px] font-bold text-text-secondary dark:text-neutral-400 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-beige-100 dark:bg-neutral-850 rounded-xl w-fit">
        {(['internships', 'applications'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize ${
              tab === t
                ? 'bg-white dark:bg-neutral-900 text-text-primary dark:text-neutral-100 shadow-soft'
                : 'text-text-secondary dark:text-neutral-400 hover:text-text-primary'
            }`}
          >
            {t === 'internships' ? `Listings (${internships.length})` : `Applications (${allApps.length})`}
          </button>
        ))}
      </div>

      {/* ---- TAB: INTERNSHIP LISTINGS ---- */}
      {tab === 'internships' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search internships..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-xl bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="p-12 text-center text-text-secondary bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800">
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-beige-300" />
              <p className="text-xs font-bold">No internship listings found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredInternships.map((intern: any) => {
                const skills = Array.isArray(intern.skills)
                  ? intern.skills
                  : (typeof intern.skills === 'string' ? JSON.parse(intern.skills) : []);
                const appCount = allApps.filter((a: any) => a.internshipId === intern.id).length;
                return (
                  <div key={intern.id} className="bg-white dark:bg-neutral-900 border border-beige-200 dark:border-neutral-800 rounded-2xl p-5 shadow-soft flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-text-primary dark:text-neutral-100 truncate">{intern.title}</h3>
                        <p className="text-[10px] font-bold text-text-secondary dark:text-neutral-400 mt-0.5">{intern.companyName} · {intern.industry}</p>
                      </div>
                      <span className="ml-2 px-2 py-0.5 bg-beige-50 dark:bg-neutral-850 text-text-secondary text-[9px] font-black uppercase rounded-lg flex-shrink-0">{intern.mode}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, 4).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-mint-50 dark:bg-mint-950/20 text-mint-600 dark:text-mint-400 text-[9px] font-bold rounded-lg">{s}</span>
                      ))}
                      {skills.length > 4 && <span className="text-[9px] text-text-secondary">+{skills.length - 4}</span>}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Deadline: {new Date(intern.deadline).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => { setViewingApps(intern); setTab('applications'); setAppSearch(''); }}
                        className="flex items-center gap-1 text-mint-500 hover:text-mint-400"
                      >
                        <Users className="w-3 h-3" />
                        {appCount} applicant{appCount !== 1 ? 's' : ''}
                      </button>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-beige-100 dark:border-neutral-850">
                      <button
                        onClick={() => openEdit(intern)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-beige-50 dark:bg-neutral-850 hover:bg-beige-100 dark:hover:bg-neutral-800 text-text-primary dark:text-neutral-200 text-xs font-bold rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this internship? All applications will be removed too.')) {
                            deleteMutation.mutate(intern.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 text-xs font-bold rounded-lg"
                      >
                        {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- TAB: APPLICATIONS ---- */}
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {viewingApps && (
              <button
                onClick={() => setViewingApps(null)}
                className="flex items-center gap-1 px-3 py-1.5 bg-beige-100 dark:bg-neutral-850 hover:bg-beige-200 text-text-secondary text-xs font-bold rounded-lg"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search applicant name, email, or internship..."
                value={appSearch}
                onChange={e => setAppSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-xl bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
              />
            </div>
          </div>

          {viewingApps && (
            <div className="px-4 py-2 bg-mint-50 dark:bg-mint-950/20 border border-mint-200 dark:border-mint-900 rounded-xl text-xs font-bold text-mint-600 dark:text-mint-400">
              Showing applications for: <span className="font-black">{viewingApps.title}</span> at {viewingApps.companyName}
            </div>
          )}

          {isLoadingApps ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-6 h-6 text-mint-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-beige-200 dark:border-neutral-800 shadow-soft overflow-hidden">
              <table className="w-full text-xs font-semibold">
                <thead>
                  <tr className="bg-beige-50 dark:bg-neutral-850 border-b border-beige-200 dark:border-neutral-800">
                    <th className="text-left px-4 py-3 text-[10px] font-black text-text-secondary uppercase tracking-wider">Applicant</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-text-secondary uppercase tracking-wider hidden sm:table-cell">Internship</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-text-secondary uppercase tracking-wider hidden md:table-cell">University / GPA</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-text-secondary uppercase tracking-wider hidden lg:table-cell">Applied</th>
                    <th className="text-left px-4 py-3 text-[10px] font-black text-text-secondary uppercase tracking-wider">CV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-100 dark:divide-neutral-850">
                  {filteredApps
                    .filter((a: any) => !viewingApps || a.internshipId === viewingApps.id)
                    .map((app: any) => (
                      <tr key={app.id} className="hover:bg-beige-50/50 dark:hover:bg-neutral-850/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-text-primary dark:text-neutral-200">{app.fullName || app.student?.name}</p>
                          <p className="text-[9px] text-text-secondary">{app.email || app.student?.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="font-bold text-text-primary dark:text-neutral-200 truncate max-w-[150px]">{app.internship?.title}</p>
                          <p className="text-[9px] text-text-secondary">{app.internship?.companyName}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-text-primary dark:text-neutral-200">{app.university}</p>
                          <p className="text-[9px] text-text-secondary">GPA: {app.grade}</p>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={app.status}
                            onChange={e => updateStatusMutation.mutate({ appId: app.id, status: e.target.value })}
                            className={`text-[10px] font-black px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${STATUS_COLORS[app.status] || ''} bg-opacity-100`}
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s} className="bg-white dark:bg-neutral-850 text-text-primary">{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-text-secondary text-[9px]">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {app.resumeUrl ? (
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-mint-500 hover:text-mint-400 font-bold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                          ) : (
                            <span className="text-text-secondary">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {filteredApps.filter((a: any) => !viewingApps || a.internshipId === viewingApps.id).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-text-secondary">
                        No applications found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT INTERNSHIP FORM MODAL */}
      <ModalPortal>
        {isFormOpen && (
          <div className="fixed inset-0 z-[9999] bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-premium border border-beige-200 dark:border-neutral-850 space-y-4 text-xs font-semibold animate-scale-up max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-beige-100 dark:border-neutral-850 pb-3">
                <h3 className="text-sm font-bold text-text-primary dark:text-neutral-100 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-mint-500" />
                  {editingId ? 'Edit Internship' : 'Create New Internship'}
                </h3>
                <button onClick={closeForm} className="text-text-secondary hover:text-text-primary dark:text-neutral-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Info */}
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider">Company Info</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Company Name *', key: 'companyName', placeholder: 'e.g. Google' },
                    { label: 'Industry *', key: 'industry', placeholder: 'e.g. Technology' },
                    { label: 'Website', key: 'website', placeholder: 'https://...' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">{label}</label>
                      <input
                        type="text"
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">Company Description</label>
                  <textarea
                    rows={2}
                    value={form.companyDescription}
                    onChange={e => setForm(f => ({ ...f, companyDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                  />
                </div>

                {/* Position Info */}
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider pt-2 border-t border-beige-100 dark:border-neutral-850">Position Details</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Position Title *', key: 'title', placeholder: 'e.g. Backend Developer Intern' },
                    { label: 'Category *', key: 'category', placeholder: 'e.g. Software Engineering' },
                    { label: 'Duration', key: 'duration', placeholder: 'e.g. 3 months' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">{label}</label>
                      <input
                        type="text"
                        value={(form as any)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">Work Mode</label>
                    <select
                      value={form.mode}
                      onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                      className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                    >
                      {['Remote', 'On-site', 'Hybrid'].map(m => (
                        <option key={m} value={m} className="bg-white dark:bg-neutral-850 text-text-primary">{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">Application Deadline *</label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">Required Skills * (comma separated)</label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                    placeholder="e.g. Python, Django, REST APIs"
                    className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                  />
                </div>

                {[
                  { label: 'Responsibilities', key: 'responsibilities' },
                  { label: 'Requirements', key: 'requirements' },
                  { label: 'Benefits (optional)', key: 'benefits' },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold block text-text-primary dark:text-neutral-300">{label}</label>
                    <textarea
                      rows={2}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-beige-200 dark:border-neutral-700 dark:bg-neutral-850 rounded-lg bg-white text-text-primary dark:text-neutral-200 outline-none focus:ring-1 focus:ring-mint-500"
                    />
                  </div>
                ))}

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-beige-100 dark:border-neutral-850">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 py-2.5 border border-beige-200 dark:border-neutral-700 text-text-secondary font-bold rounded-xl hover:bg-beige-50 dark:hover:bg-neutral-850"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-soft"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingId ? 'Update Internship' : 'Create Internship'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
