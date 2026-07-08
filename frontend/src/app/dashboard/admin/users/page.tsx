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
  Users,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  UserX,
  UserCheck,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';

const userFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'DOCTOR', 'TA', 'STUDENT']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Fetch Users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsersList'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      setIsAddModalOpen(false);
      addToast('User registered successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to create user', 'error');
    },
  });

  // Edit User Mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormValues> & { isActive?: boolean } }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      setEditingUser(null);
      addToast('User profile updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || 'Failed to edit user', 'error');
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsersList'] });
      addToast('User deleted from platform', 'success');
    },
  });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  const onAddSubmit = (data: UserFormValues) => {
    createUserMutation.mutate(data);
    resetAdd();
  };

  const onEditSubmit = (data: UserFormValues) => {
    if (!editingUser) return;
    // Strip empty password
    const payload: Partial<UserFormValues> = { ...data };
    if (!payload.password) delete payload.password;
    editUserMutation.mutate({ id: editingUser.id, data: payload });
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    resetEdit({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
    });
  };

  // Toggle Activation
  const toggleActivation = (user: any) => {
    editUserMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  const filteredUsers = users.filter(
    (u: any) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Upper header action controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">User Registry Directory</h2>
          <p className="text-xs text-text-secondary">View and adjust academic credentials</p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-mint-500 hover:bg-mint-400 text-white rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="w-4 h-4" /> Register New Account
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full py-2.5 pl-10 pr-4 text-xs font-semibold text-text-primary"
        />
      </div>

      {/* User Directory Table Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-beige-200">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-beige-200 text-text-secondary text-xs">
          No users match your criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-soft border border-beige-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-beige-100/50 border-b border-beige-200 font-bold text-text-secondary">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige-100 font-semibold text-text-primary">
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-beige-50/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-mint-50 text-mint-500 rounded-lg flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-bold text-text-primary">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        user.role === 'ADMIN'
                          ? 'bg-rose-50 text-rose-500'
                          : user.role === 'DOCTOR'
                          ? 'bg-mint-50 text-mint-500'
                          : user.role === 'TA'
                          ? 'bg-teal-50 text-teal-500'
                          : 'bg-indigo-50 text-indigo-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="text-[10px] text-mint-500 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 fill-current text-mint-100" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-secondary flex items-center gap-1">
                          <X className="w-3.5 h-3.5 text-text-secondary" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleActivation(user)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          user.isActive
                            ? 'border-beige-200 text-text-secondary hover:text-rose-500 hover:bg-rose-50'
                            : 'border-mint-200 text-mint-500 hover:bg-mint-50'
                        }`}
                        title={user.isActive ? 'Deactivate user' : 'Reactivate user'}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => startEdit(user)}
                        className="p-1.5 border border-beige-200 text-text-secondary hover:text-text-primary rounded-lg hover:bg-beige-100 transition-colors"
                        title="Edit profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete user ${user.name}? This cannot be undone.`)) {
                            deleteUserMutation.mutate(user.id);
                          }
                        }}
                        className="p-1.5 border border-beige-200 text-text-secondary hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hard delete"
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

      {/* ADD ACCOUNT MODAL */}
      {isAddModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Register Platform User</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Full Name</label>
                  <input {...registerAdd('name')} type="text" placeholder="Dr. Alan Turing" className="w-full px-3 py-2 text-xs" />
                  {errorsAdd.name && <span className="text-[10px] text-rose-500">{errorsAdd.name.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Email Address</label>
                  <input {...registerAdd('email')} type="email" placeholder="alan@lms.com" className="w-full px-3 py-2 text-xs" />
                  {errorsAdd.email && <span className="text-[10px] text-rose-500">{errorsAdd.email.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Password</label>
                  <input {...registerAdd('password')} type="password" placeholder="••••••••" className="w-full px-3 py-2 text-xs" />
                  {errorsAdd.password && <span className="text-[10px] text-rose-500">{errorsAdd.password.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Portal Role</label>
                  <select {...registerAdd('role')} className="w-full px-3 py-2 text-xs">
                    <option value="STUDENT">STUDENT</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="TA">TA</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {errorsAdd.role && <span className="text-[10px] text-rose-500">{errorsAdd.role.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {editingUser && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[5px] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-premium border border-beige-200 animate-slide-up space-y-4">
              <div className="flex justify-between items-center border-b border-beige-100 pb-2">
                <h3 className="text-sm font-bold text-text-primary">Update Profile Registry</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Full Name</label>
                  <input {...registerEdit('name')} type="text" className="w-full px-3 py-2 text-xs" />
                  {errorsEdit.name && <span className="text-[10px] text-rose-500">{errorsEdit.name.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Email Address</label>
                  <input {...registerEdit('email')} type="email" className="w-full px-3 py-2 text-xs" />
                  {errorsEdit.email && <span className="text-[10px] text-rose-500">{errorsEdit.email.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Password (Leave blank to keep same)</label>
                  <input {...registerEdit('password')} type="password" placeholder="••••••••" className="w-full px-3 py-2 text-xs" />
                  {errorsEdit.password && <span className="text-[10px] text-rose-500">{errorsEdit.password.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-primary block">Portal Role</label>
                  <select {...registerEdit('role')} className="w-full px-3 py-2 text-xs">
                    <option value="STUDENT">STUDENT</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="TA">TA</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {errorsEdit.role && <span className="text-[10px] text-rose-500">{errorsEdit.role.message}</span>}
                </div>

                <button
                  type="submit"
                  disabled={editUserMutation.isPending}
                  className="w-full py-2.5 bg-mint-500 hover:bg-mint-400 text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  {editUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply Updates'}
                </button>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
