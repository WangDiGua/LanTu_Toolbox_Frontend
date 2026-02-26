import React, { useState, useEffect, useRef } from 'react';
import { Shield, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { Role } from '../../types';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { cn } from '../../utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { roleApi, menuApi } from '../../api';

interface PermissionItem {
    id: string;
    label: string;
}

const roleSchema = z.object({
    name: z.string().min(2, '角色名称至少2个字符').max(20, '角色名称过长'),
    description: z.string().max(100, '描述不能超过100个字符').optional(),
});

type RoleFormInputs = z.infer<typeof roleSchema>;

export const RoleManagement: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);

    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
    
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [permRole, setPermRole] = useState<Role | null>(null);
    const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
    const [permLoading, setPermLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RoleFormInputs>({
        resolver: zodResolver(roleSchema),
        defaultValues: { name: '', description: '' }
    });

    const loadRoles = async () => {
        setLoading(true);
        try {
            const res = await roleApi.getList();
            if (res.code === 200) {
                setRoles(res.data.records || []);
            }
        } catch (e: any) {
            toastError(e.message || '加载角色列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    const handleCreate = () => {
        reset({ name: '', description: '' });
        setCurrentRoleId(null);
        setModalMode('create');
        setIsRoleModalOpen(true);
    };

    const handleEdit = (role: Role) => {
        reset({ name: role.name, description: role.description });
        setCurrentRoleId(role.id);
        setModalMode('edit');
        setIsRoleModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('确定要删除此角色吗？关联的用户可能会失去权限。')) {
            setLoading(true);
            try {
                await roleApi.delete(id);
                success('角色已删除');
                loadRoles();
            } catch (e: any) {
                toastError(e.message || '删除失败');
                setLoading(false);
            }
        }
    };

    const onSubmit = async (data: RoleFormInputs) => {
        setLoading(true);
        try {
            if (modalMode === 'create') {
                await roleApi.create(data);
                success('角色创建成功');
            } else if (currentRoleId) {
                await roleApi.update(currentRoleId, data);
                success('角色更新成功');
            }
            setIsRoleModalOpen(false);
            loadRoles();
        } catch (e: any) {
            toastError(e.message || '操作失败');
            setLoading(false);
        }
    };

    const openPermModal = async (role: Role) => {
        setPermLoading(true);
        setIsPermModalOpen(true);
        setPermRole(role);
        try {
            const res = await menuApi.getAllPermissions();
            if (res.code === 200 && res.data) {
                setAllPermissions(res.data);
            }
        } catch (e: any) {
            toastError(e.message || '获取权限列表失败');
        } finally {
            setPermLoading(false);
        }
    };

    const togglePermission = (permId: string) => {
        if (!permRole) return;
        const newPerms = permRole.permissions.includes(permId)
            ? permRole.permissions.filter(p => p !== permId)
            : [...permRole.permissions, permId];
        setPermRole({ ...permRole, permissions: newPerms });
    };

    const savePermissions = async () => {
        if (permRole) {
            setLoading(true);
            try {
                await roleApi.updatePermissions(permRole.id, permRole.permissions);
                success('权限配置已更新');
                setIsPermModalOpen(false);
                loadRoles();
            } catch (e: any) {
                toastError(e.message || '保存失败');
                setLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            {loading && roles.length === 0 ? (
                <div className="text-center py-12 text-slate-400">加载中...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => (
                        <div key={role.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group dark:bg-slate-900 dark:border-slate-800 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors dark:bg-indigo-900/20 dark:text-indigo-400">
                                    <Shield size={20} />
                                </div>
                                
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(role)} className="h-7 px-2">
                                        <Edit2 size={12} className="mr-1" /> 编辑
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(role.id)} className="h-7 px-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30">
                                        <Trash2 size={12} className="mr-1" /> 删除
                                    </Button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 dark:text-white">{role.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 h-10 dark:text-slate-400 line-clamp-2">{role.description}</p>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between dark:border-slate-800">
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded dark:bg-slate-800 dark:text-slate-400">
                                    {role.permissions?.includes('*') ? '全部权限' : `${role.permissions?.length || 0} 个权限点`}
                                </span>
                                <span 
                                    onClick={() => openPermModal(role)}
                                    className="text-xs text-indigo-600 cursor-pointer hover:underline dark:text-indigo-400"
                                >
                                    配置权限 &rarr;
                                </span>
                            </div>
                        </div>
                    ))}
                     <div 
                        onClick={handleCreate}
                        className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all min-h-[200px] dark:border-slate-800"
                    >
                        <Plus size={32} className="mb-2" />
                        <span className="font-medium">创建新角色</span>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                title={modalMode === 'create' ? '创建新角色' : '编辑角色'}
                size="sm"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input 
                        label="角色名称" 
                        {...register('name')}
                        error={errors.name?.message}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">角色描述</label>
                        <textarea 
                            className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            rows={3}
                            {...register('description')}
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsRoleModalOpen(false)}>取消</Button>
                        <Button type="submit" isLoading={loading}>保存</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isPermModalOpen}
                onClose={() => setIsPermModalOpen(false)}
                title={`配置权限 - ${permRole?.name || ''}`}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsPermModalOpen(false)}>取消</Button>
                        <Button onClick={savePermissions} isLoading={loading} disabled={permLoading}>确认修改</Button>
                    </>
                }
            >
                {permLoading ? (
                    <div className="text-center py-12 text-slate-400">加载权限数据...</div>
                ) : (
                    <div className="space-y-4">
                        {permRole?.permissions?.includes('*') ? (
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    该角色为超级管理员，拥有系统所有权限，无需单独配置。
                                </p>
                            </div>
                        ) : allPermissions.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">暂无可配置的权限</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {allPermissions.map(perm => {
                                    const isChecked = permRole?.permissions?.includes(perm.id) || false;
                                    return (
                                        <div 
                                            key={perm.id} 
                                            className={cn(
                                                "p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors",
                                                isChecked 
                                                    ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300" 
                                                    : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                                            )}
                                            onClick={() => togglePermission(perm.id)}
                                        >
                                            <span className="text-sm font-medium">{perm.label}</span>
                                            {isChecked && <Check size={16} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
