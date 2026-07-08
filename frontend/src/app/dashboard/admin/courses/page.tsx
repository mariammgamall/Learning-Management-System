'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../../utils/api';
import { useToastStore } from '../../../../hooks/useToastStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ModalPortal from '@/components/ModalPortal';
import {
  BookOpen,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  UserCheck,
  X,
  Search,
  User,
  GraduationCap,
} from 'lucide-react';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  doctorId: z.string().uuid('Please select a head Doctor'),
  isPublished: z.boolean().optional().default(false),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function AdminCourses() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [taAssignCourse, setTaAssignCourse] = useState<any>(null);
  const [selectedTaId, setSelectedTaId] = useState('');

  // Fetch Courses
  const { data: courses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['adminCoursesList'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    },
  });

  // Fetch Doctors
  const { data: doctorsRes } = useQuery({
    queryKey: ['adminDoctorsList'],
    queryFn: async () => {
      const response = await api.get('/users/role/DOCTOR');
      return response.data;
    },
  });
  const doctors = doctorsRes || [];

  // Fetch TAs
  const { data: tasRes } = useQuery({
    queryKey: ['adminTasList'],
    queryFn: async () => {
      const response = await api.get('/users/role/TA');
      return response.data;
    },
  });
  const tas = tasRes || [];

  // Create Course Mutation
  const createCourse = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const response = await api.post('/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoursesList'] });
      setIsAddOpen(false);
      addToast('Course registered successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create course', 'error');
    },
  });

  // Edit Course Mutation
  const editCourse = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseFormValues> }) => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoursesList'] });
      setEditingCourse(null);
      addToast('Course updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to edit course', 'error');
    },
  });

  // Delete Course Mutation
  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoursesList'] });
      addToast('Course deleted successfully!', 'success');
    },
  });

  // Assign TA Mutation
  const assignTA = useMutation({
    mutationFn: async ({ courseId, taId }: { courseId: string; taId: string }) => {
      const response = await api.post(`/courses/${courseId}/assign-ta`, { taId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoursesList'] });
      setTaAssignCourse(null);
      setSelectedTaId('');
      addToast('TA successfully assigned to course', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'TA assignment failed', 'error');
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
  });

  const onAddSubmit = (data: CourseFormValues) => {
    createCourse.mutate(data);
    resetAdd();
  };

  const onEditSubmit = (data: CourseFormValues) => {
    if (!editingCourse) return;
    editCourse.mutate({ id: editingCourse.id, data });
  };

  const startEdit = (course: any) => {
    setEditingCourse(course);
    resetEdit({
      title: course.title,
      code: course.code,
      description: course.description,
      doctorId: course.doctorId,
      isPublished: course.isPublished,
    });
  };

  const filteredCourses = courses.filter(
    (c: any) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upper Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Course Registry Ledger</h2>
          <p className="text-xs text-text-secondary">Register curriculum courses and assign personnel</p>
        </div>
        
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="w-4 h-4" /> Create Course Profile
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search by code or course title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full py-2.5 pl-10 pr-4 text-xs font-semibold text-text-primary"
        />
      </div>

      {/* Table grid directory */}
      {isCoursesLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-beige-200">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
          No courses currently registered.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-beige-200 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-beige-100/50 border-b border-beige-200 font-bold text-text-secondary">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Head Instructor (Doctor)</th>
                  <th className="px-6 py-4">Assigned TAs</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100 font-semibold text-text-primary">
                {filteredCourses.map((course: any) => (
                  <tr key={course.id} className="hover:bg-beige-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 bg-mint-100 text-mint-500 rounded-full text-[9px] font-extrabold uppercase">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-text-primary truncate max-w-xs">
                      {course.title}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-mint-400" />
                        <span>{course.doctor?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {course.tas?.length === 0 ? (
                          <span className="text-[10px] text-text-secondary italic">None</span>
                        ) : (
                          course.tas.map((taJob: any) => (
                            <span key={taJob.id} className="px-2 py-0.5 bg-beige-200 text-text-primary rounded-md text-[9px]">
                              {taJob.ta?.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.isPublished ? (
                        <span className="text-[9px] font-extrabold bg-mint-50 text-mint-500 px-2.5 py-0.5 rounded-full">
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold bg-beige-200 text-text-secondary px-2.5 py-0.5 rounded-full">
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => setTaAssignCourse(course)}
                        className="p-1.5 border border-beige-200 text-text-secondary hover:text-mint-500 hover:bg-mint-50 rounded-lg transition-colors"
                        title="Assign TA to course"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => startEdit(course)}
                        className="p-1.5 border border-beige-200 text-text-secondary hover:text-text-primary rounded-lg hover:bg-beige-100 transition-colors"
                        title="Edit course"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete course ${course.code}? This will remove all nested lectures, assignments, and submissions.`)) {
                            deleteCourse.mutate(course.id);
                          }
                        }}
                        className="p-1.5 border border-beige-200 text-text-secondary hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hard delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {isAddOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Create Academic Course</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Course Title</label>
                  <input {...registerAdd('title')} type="text" placeholder="Advanced Database Engineering" className="w-full px-3 py-2 text-xs" />
                  {errorsAdd.title && <span className="text-[10px] text-rose-500">{errorsAdd.title.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Course Code</label>
                  <input {...registerAdd('code')} type="text" placeholder="CS402" className="w-full px-3 py-2 text-xs" />
                  {errorsAdd.code && <span className="text-[10px] text-rose-500">{errorsAdd.code.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Course Description (HTML allowed)</label>
                  <textarea {...registerAdd('description')} rows={3} placeholder="<p>Understand SQL, indexing, transaction logs...</p>" className="w-full px-3 py-2 text-xs" />
                  {errorsAdd.description && <span className="text-[10px] text-rose-500">{errorsAdd.description.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Head Doctor (Instructor)</label>
                  <select {...registerAdd('doctorId')} className="w-full px-3 py-2 text-xs">
                    <option value="">Select head instructor...</option>
                    {doctors.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.name}</option>
                    ))}
                  </select>
                  {errorsAdd.doctorId && <span className="text-[10px] text-rose-500">{errorsAdd.doctorId.message}</span>}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input {...registerAdd('isPublished')} type="checkbox" id="add-is-pub" className="w-4 h-4 rounded text-mint-500 border-beige-300" />
                  <label htmlFor="add-is-pub" className="text-xs text-text-primary font-bold">Publish course catalog instantly</label>
                </div>

                <button
                  type="submit"
                  disabled={createCourse.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {createCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Course'}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* EDIT COURSE MODAL */}
      {editingCourse && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Update Course Ledger</h3>
                <button onClick={() => setEditingCourse(null)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Course Title</label>
                  <input {...registerEdit('title')} type="text" className="w-full px-3 py-2 text-xs" />
                  {errorsEdit.title && <span className="text-[10px] text-rose-500">{errorsEdit.title.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Course Code</label>
                  <input {...registerEdit('code')} type="text" disabled className="w-full px-3 py-2 text-xs opacity-60" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Course Description</label>
                  <textarea {...registerEdit('description')} rows={3} className="w-full px-3 py-2 text-xs" />
                  {errorsEdit.description && <span className="text-[10px] text-rose-500">{errorsEdit.description.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Head Doctor (Instructor)</label>
                  <select {...registerEdit('doctorId')} className="w-full px-3 py-2 text-xs">
                    {doctors.map((doc: any) => (
                      <option key={doc.id} value={doc.id}>{doc.name}</option>
                    ))}
                  </select>
                  {errorsEdit.doctorId && <span className="text-[10px] text-rose-500">{errorsEdit.doctorId.message}</span>}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input {...registerEdit('isPublished')} type="checkbox" id="edit-is-pub" className="w-4 h-4 rounded text-mint-500" />
                  <label htmlFor="edit-is-pub" className="text-xs text-text-primary font-bold">Publish course registry</label>
                </div>

                <button
                  type="submit"
                  disabled={editCourse.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {editCourse.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply Updates'}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ASSIGN TA MODAL */}
      {taAssignCourse && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-mint-500" />
                  <h3 className="text-xs font-bold text-text-primary">Assign Teaching Assistant</h3>
                </div>
                <button onClick={() => setTaAssignCourse(null)} className="text-text-secondary hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-text-secondary block">Assigned Course:</span>
                  <span className="text-xs font-bold text-text-primary block">{taAssignCourse.code}: {taAssignCourse.title}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Select Teaching Assistant (TA)</label>
                  <select
                    value={selectedTaId}
                    onChange={(e) => setSelectedTaId(e.target.value)}
                    className="w-full px-3 py-2 text-xs"
                  >
                    <option value="">Choose a TA...</option>
                    {tas.map((ta: any) => (
                      <option key={ta.id} value={ta.id}>{ta.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (!selectedTaId) return addToast('Please select a TA first', 'error');
                    assignTA.mutate({ courseId: taAssignCourse.id, taId: selectedTaId });
                  }}
                  disabled={assignTA.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {assignTA.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm TA Allocation'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
