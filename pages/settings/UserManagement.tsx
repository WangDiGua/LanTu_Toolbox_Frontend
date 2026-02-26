import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Power, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Permission } from '../../components/Permission';
import { useToast } from '../../components/Toast';
import { User } from '../../types';
import { formatDate, cn } from '../../utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { userApi } from '../../api';

const userSchema = z.object({
    username: z.string()
        .min(2, '用户名至少2个字符')
        .max(20, '用户名最多20个字符')
        .regex(/^[a-z0-9]+$/, '用户名只能包含小写字母和数字'),
    nickname: z.string()
        .max(20, '昵称最多20个字符')
        .optional()
        .or(z.literal('')),
    email: z.string().email('请输入有效的邮箱地址'),
    phone: z.string()
        .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
        .optional()
        .or(z.literal('')),
    gender: z.enum(['male', 'female', 'other'], { required_error: '请选择性别' }),
    age: z.coerce.number()
        .min(1, '年龄必须大于0')
        .max(120, '年龄不能超过120岁')
        .optional(),
    bio: z.string()
        .max(100, '简介最多100个字符')
        .optional()
        .or(z.literal('')),
    location: z.string()
        .max(50, '地点最多50个字符')
        .optional()
        .or(z.literal('')),
    roleKey: z.enum(['admin', 'editor', 'viewer'], { required_error: '请选择角色' }),
    status: z.coerce.number(),
});

type UserFormInputs = z.infer<typeof userSchema>;

export const UserManagement: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentEditId, setCurrentEditId] = useState<number | null>(null);

    // Delete Confirmation Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<UserFormInputs>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            username: '',
            nickname: '',
            email: '',
            phone: '',
            gender: 'other',
            age: undefined,
            bio: '',
            location: '',
            roleKey: 'viewer',
            status: 1
        }
    });

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await userApi.getList({ 
                keyword: searchTerm, 
                status: statusFilter 
            });
            if (res.code === 200) {
                setUsers(res.data.records || []);
            }
        } catch (e: any) {
            toastError(e.message || '加载用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [searchTerm, statusFilter]);

    const handleCreate = () => {
        reset({
            username: '',
            nickname: '',
            email: '',
            phone: '',
            gender: 'other',
            age: undefined,
            bio: '',
            location: '',
            roleKey: 'viewer',
            status: 1
        });
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        reset({
            username: user.username,
            nickname: user.nickname || '',
            email: user.email,
            phone: user.phone || '',
            gender: user.gender || 'other',
            age: user.age,
            bio: user.bio || '',
            location: user.location || '',
            roleKey: (user.roleKey || 'viewer') as 'admin' | 'editor' | 'viewer',
            status: user.status
        });
        setCurrentEditId(user.id);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setDeleteTargetId(user.id);
        setDeleteTargetName(user.nickname || user.username);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        setIsDeleteModalOpen(false);
        setLoading(true);
        try {
            await userApi.delete(deleteTargetId);
            success('用户已永久删除');
            loadUsers();
        } catch (e: any) {
            toastError(e.message || '删除失败');
            setLoading(false);
        } finally {
            setDeleteTargetId(null);
            setDeleteTargetName('');
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: number) => {
        const newStatus = currentStatus === 1 ? 0 : 1;
        try {
            await userApi.toggleStatus(id, newStatus);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
            success(`用户已${newStatus === 1 ? '启用' : '停用'}`);
        } catch (e: any) {
            toastError(e.message || '操作失败');
        }
    };

    const onSubmit = async (data: UserFormInputs) => {
        setLoading(true);
        try {
            if (modalMode === 'create') {
                await userApi.create(data);
                success('用户创建成功');
            } else if (currentEditId) {
                await userApi.update(currentEditId, data);
                success('用户信息更新成功');
            }
            setIsModalOpen(false);
            loadUsers();
        } catch (e: any) {
            toastError(e.message || '操作失败');
            setLoading(false);
        }
    };

    const getRoleLabel = (roleKey: string) => {
        const roleMap: Record<string, string> = {
            'admin': '管理员',
            'editor': '编辑',
            'viewer': '访客'
        };
        return roleMap[roleKey] || roleKey;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-4 w-full md:w-auto flex-1">
                    <Input 
                        placeholder="搜索用户名或邮箱..." 
                        leftIcon={<Search size={16}/>} 
                        className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="w-40">
                        <Select 
                            value={statusFilter ?? ''}
                            onChange={(val) => setStatusFilter(val === '' ? null : Number(val))}
                            options={[
                                { label: '全部', value: '' },
                                { label: '正常', value: 1 },
                                { label: '禁用', value: 0 },
                            ]}
                        />
                    </div>
                </div>
                <Button onClick={handleCreate}><Plus size={16} className="mr-2" /> 新增用户</Button>
            </div>
            
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                            <tr>
                                <th className="px-4 py-3">用户</th>
                                <th className="px-4 py-3">昵称</th>
                                <th className="px-4 py-3">手机号码</th>
                                <th className="px-4 py-3">性别/年龄</th>
                                <th className="px-4 py-3">角色</th>
                                <th className="px-4 py-3">状态</th>
                                <th className="px-4 py-3">简介</th>
                                <th className="px-4 py-3">地点</th>
                                <th className="px-4 py-3">创建时间</th>
                                <th className="px-4 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400">加载中...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400">暂无数据</td></tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-2 dark:bg-blue-900 dark:text-blue-300">
                                                {user.username.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900 dark:text-slate-200">{user.username}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{user.nickname || '-'}</td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{user.phone || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'} / {user.age || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                                            user.roleKey === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                            user.roleKey === 'editor' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                        )}>
                                            {getRoleLabel(user.roleKey || 'viewer')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.status === 1 ? (
                                            <span className="inline-flex items-center text-green-600 text-xs dark:text-green-400">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> 正常
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-slate-400 text-xs">
                                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-1.5"></span> 停用
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-500 truncate max-w-[100px] block" title={user.bio}>{user.bio || '-'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-500 truncate max-w-[80px] block" title={user.location}>{user.location || '-'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Permission permissions={['system:users:edit']}>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    onClick={() => handleEdit(user)} 
                                                    className="h-7 px-2"
                                                    title="编辑"
                                                >
                                                    <Edit2 size={12} className="mr-1" /> 编辑
                                                </Button>
                                            </Permission>
                                            
                                            <Permission permissions={['system:users:toggle']}>
                                                <Button 
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleToggleStatus(user.id, user.status)} 
                                                    className={cn("h-7 px-2 transition-colors", user.status === 1 ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20" : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20")}
                                                    title={user.status === 1 ? "停用" : "启用"}
                                                >
                                                    <Power size={12} className="mr-1" /> {user.status === 1 ? "停用" : "启用"}
                                                </Button>
                                            </Permission>

                                            {user.username !== 'admin' && (
                                                <Permission permissions={['system:users:delete']}>
                                                    <Button 
                                                        size="sm"
                                                        variant="danger"
                                                        onClick={() => handleDelete(user)} 
                                                        className="h-7 px-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={12} className="mr-1" /> 删除
                                                    </Button>
                                                </Permission>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'create' ? '新增用户' : '编辑用户'}
                size="md"
            >
                <form id="userForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input 
                                label="用户名" 
                                {...register('username')}
                                error={errors.username?.message}
                                disabled={modalMode === 'edit'}
                                className={cn(modalMode === 'edit' && 'bg-slate-50 text-slate-500 cursor-not-allowed')}
                            />
                            {modalMode === 'create' && (
                                <p className="text-xs text-slate-400 mt-1">只能包含小写字母和数字</p>
                            )}
                        </div>
                        <Input 
                            label="昵称" 
                            {...register('nickname')}
                            error={errors.nickname?.message}
                            placeholder="选填"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="手机号码" 
                            {...register('phone')}
                            error={errors.phone?.message}
                        />
                        <Input 
                            label="电子邮箱" 
                            type="email"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Controller
                                name="gender"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        label="性别"
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { label: '男', value: 'male' },
                                            { label: '女', value: 'female' },
                                            { label: '其他', value: 'other' },
                                        ]}
                                        error={errors.gender?.message}
                                    />
                                )}
                            />
                        </div>
                        <Input 
                            label="年龄" 
                            type="number" 
                            {...register('age')}
                            error={errors.age?.message}
                        />
                    </div>
                    <Input 
                        label="地点" 
                        {...register('location')}
                        error={errors.location?.message}
                        placeholder="选填，如：北京市"
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">简介</label>
                        <textarea 
                            {...register('bio')}
                            placeholder="选填，最多100字"
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                        />
                        {errors.bio?.message && (
                            <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Controller
                                name="roleKey"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        label="角色权限"
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { label: '只读访客 (Viewer)', value: 'viewer' },
                                            { label: '编辑人员 (Editor)', value: 'editor' },
                                            { label: '管理员 (Admin)', value: 'admin' },
                                        ]}
                                        error={errors.roleKey?.message}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        label="账号状态"
                                        value={field.value?.toString()}
                                        onChange={(val) => field.onChange(parseInt(val, 10))}
                                        options={[
                                            { label: '正常', value: '1' },
                                            { label: '停用', value: '0' },
                                        ]}
                                        error={errors.status?.message}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                        <Button type="submit" isLoading={loading}>保存</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="确认删除"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>取消</Button>
                        <Button variant="danger" onClick={confirmDelete}>确认删除</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-start text-sm dark:bg-red-900/20 dark:text-red-300">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                        <p>此操作将永久删除该用户及其所有数据，无法恢复。</p>
                    </div>
                    <div className="text-center py-2">
                        <p className="text-slate-600 dark:text-slate-300">
                            确定要删除用户 <span className="font-bold text-red-600">"{deleteTargetName}"</span> 吗？
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
