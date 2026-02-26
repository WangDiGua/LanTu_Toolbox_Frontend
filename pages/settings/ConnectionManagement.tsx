import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Edit2, Trash2, Power, Database, 
    Server, RefreshCw, CheckCircle, XCircle, AlertTriangle,
    Eye, EyeOff
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { formatDate, cn } from '../../utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { connectionApi, Connection, SupportedDatabase } from '../../api/modules/connection';

const connectionSchema = z.object({
    name: z.string().min(2, '名称至少2个字符').max(50, '名称最多50个字符'),
    type: z.string().min(1, '请选择数据库类型'),
    host: z.string().min(1, '请输入主机地址'),
    port: z.coerce.number().min(1, '请输入端口').max(65535, '端口最大65535'),
    username: z.string().min(1, '请输入用户名'),
    password: z.string().min(1, '请输入密码'),
    description: z.string().max(200, '描述最多200个字符').optional().or(z.literal('')),
});

type ConnectionFormInputs = z.infer<typeof connectionSchema>;

export const ConnectionManagement: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentEditId, setCurrentEditId] = useState<number | null>(null);
    
    const [supportedTypes, setSupportedTypes] = useState<SupportedDatabase[]>([]);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = useForm<ConnectionFormInputs>({
        resolver: zodResolver(connectionSchema),
        defaultValues: {
            name: '',
            type: '',
            host: '',
            port: 3306,
            username: '',
            password: '',
            description: '',
        },
    });

    const selectedType = watch('type');

    const loadConnections = async () => {
        setLoading(true);
        try {
            const res = await connectionApi.getList({
                name: searchTerm || undefined,
                type: typeFilter === 'all' ? undefined : typeFilter,
            });
            if (res.code === 200) {
                setConnections(res.data.records || []);
            }
        } catch (e: any) {
            toastError(e.message || '加载失败');
        } finally {
            setLoading(false);
        }
    };

    const loadSupportedTypes = async () => {
        try {
            const res = await connectionApi.getSupportedTypes();
            if (res.code === 200) {
                setSupportedTypes(res.data || []);
            }
        } catch (e: any) {
            console.error('加载支持的数据库类型失败', e);
        }
    };

    useEffect(() => {
        loadSupportedTypes();
    }, []);

    useEffect(() => {
        loadConnections();
    }, [searchTerm, typeFilter]);

    useEffect(() => {
        const selected = supportedTypes.find(t => t.type === selectedType);
        if (selected) {
            reset(prev => ({ ...prev, port: selected.defaultPort }));
        }
    }, [selectedType, supportedTypes]);

    const openCreateModal = () => {
        reset({
            name: '',
            type: 'mysql',
            host: '',
            port: 3306,
            username: '',
            password: '',
            description: '',
        });
        setCurrentEditId(null);
        setModalMode('create');
        setTestResult(null);
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const openEditModal = async (conn: Connection) => {
        setCurrentEditId(conn.id);
        setModalMode('edit');
        setTestResult(null);
        setShowPassword(false);
        
        reset({
            name: conn.name,
            type: conn.type,
            host: conn.host,
            port: conn.port,
            username: conn.username,
            password: '',
            description: conn.description || '',
        });
        
        setIsModalOpen(true);
    };

    const handleTestConnection = async () => {
        const formData = watch();
        if (!formData.type || !formData.host || !formData.port || !formData.username || !formData.password) {
            toastError('请先填写完整的连接信息');
            return;
        }

        setTestingConnection(true);
        setTestResult(null);
        try {
            await connectionApi.test({
                type: formData.type,
                host: formData.host,
                port: formData.port,
                username: formData.username,
                password: formData.password,
            });
            setTestResult({ success: true, message: '连接成功' });
        } catch (e: any) {
            setTestResult({ success: false, message: e.message || '连接失败' });
        } finally {
            setTestingConnection(false);
        }
    };

    const onSubmit = async (data: ConnectionFormInputs) => {
        setLoading(true);
        try {
            if (modalMode === 'create') {
                await connectionApi.create({
                    name: data.name,
                    type: data.type,
                    host: data.host,
                    port: data.port,
                    username: data.username,
                    password: data.password,
                    description: data.description,
                });
                success('连接创建成功');
            } else if (currentEditId) {
                const updateData: any = { ...data };
                if (!updateData.password) {
                    delete updateData.password;
                }
                await connectionApi.update(currentEditId, updateData);
                success('连接更新成功');
            }
            setIsModalOpen(false);
            loadConnections();
        } catch (e: any) {
            toastError(e.message || '操作失败');
            setLoading(false);
        }
    };

    const handleEnable = async (conn: Connection) => {
        setLoading(true);
        try {
            await connectionApi.enable(conn.id);
            success(`连接 "${conn.name}" 已启用`);
            loadConnections();
        } catch (e: any) {
            toastError(e.message || '启用失败');
            setLoading(false);
        }
    };

    const handleDisable = async (conn: Connection) => {
        setLoading(true);
        try {
            await connectionApi.disable(conn.id);
            success(`连接 "${conn.name}" 已禁用`);
            loadConnections();
        } catch (e: any) {
            toastError(e.message || '禁用失败');
            setLoading(false);
        }
    };

    const handleDelete = (conn: Connection) => {
        setDeleteTarget(conn);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleteModalOpen(false);
        setLoading(true);
        try {
            await connectionApi.delete(deleteTarget.id);
            success('连接已删除');
            loadConnections();
        } catch (e: any) {
            toastError(e.message || '删除失败');
            setLoading(false);
        } finally {
            setDeleteTarget(null);
        }
    };

    const getTypeLabel = (type: string) => {
        const found = supportedTypes.find(t => t.type === type);
        return found?.name || type.toUpperCase();
    };

    const getTypeIcon = (type: string) => {
        return <Database size={16} />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">数据源连接</h1>
                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">管理数据库连接配置，支持多种数据库类型</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus size={18} className="mr-2" /> 新建连接
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                <div className="p-4 border-b border-slate-100 flex gap-4 dark:border-slate-800">
                    <div className="flex-1 max-w-sm">
                        <Input 
                            placeholder="搜索连接名称..." 
                            leftIcon={<Search size={16} />} 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="w-40">
                        <Select 
                            value={typeFilter} 
                            onChange={(val) => setTypeFilter(val)}
                            options={[
                                { label: '全部类型', value: 'all' },
                                ...supportedTypes.map(t => ({ label: t.name, value: t.type }))
                            ]}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3">状态</th>
                                <th className="px-4 py-3">连接名称</th>
                                <th className="px-4 py-3">数据库类型</th>
                                <th className="px-4 py-3">主机地址</th>
                                <th className="px-4 py-3">端口</th>
                                <th className="px-4 py-3">用户名</th>
                                <th className="px-4 py-3">描述</th>
                                <th className="px-4 py-3">创建时间</th>
                                <th className="px-4 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">加载中...</td></tr>
                            ) : connections.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">暂无数据</td></tr>
                            ) : connections.map(conn => (
                                <tr key={conn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="px-4 py-3">
                                        {conn.isEnabled ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                <CheckCircle size={12} className="mr-1" /> 已启用
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                未启用
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Server size={14} className="text-slate-400" />
                                            <span className="font-medium text-slate-800 dark:text-slate-200">{conn.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            {getTypeIcon(conn.type)}
                                            <span>{getTypeLabel(conn.type)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{conn.host}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{conn.port}</td>
                                    <td className="px-4 py-3 text-xs">{conn.username}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[150px]" title={conn.description}>{conn.description || '-'}</td>
                                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{formatDate(conn.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="secondary"
                                                onClick={() => openEditModal(conn)} 
                                                className="h-7 px-2"
                                            >
                                                <Edit2 size={12} className="mr-1" /> 编辑
                                            </Button>
                                            {conn.isEnabled ? (
                                                <Button 
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleDisable(conn)} 
                                                    className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                >
                                                    <Power size={12} className="mr-1" /> 禁用
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleEnable(conn)} 
                                                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                >
                                                    <Power size={12} className="mr-1" /> 启用
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(conn)} 
                                                className="h-7 px-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                                                disabled={conn.isEnabled === 1}
                                                title={conn.isEnabled ? '启用中的连接无法删除' : '删除'}
                                            >
                                                <Trash2 size={12} className="mr-1" /> 删除
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'create' ? '新建连接' : '编辑连接'}
                size="md"
            >
                <form id="connectionForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="连接名称" 
                            {...register('name')}
                            error={errors.name?.message}
                            placeholder="例如：生产环境MySQL"
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">数据库类型</label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select 
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={supportedTypes.map(t => ({ label: t.name, value: t.type }))}
                                        error={errors.type?.message}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input 
                            label="主机地址" 
                            {...register('host')}
                            error={errors.host?.message}
                            placeholder="localhost 或 IP"
                        />
                        <Input 
                            label="端口" 
                            type="number"
                            {...register('port')}
                            error={errors.port?.message}
                        />
                        <Input 
                            label="用户名" 
                            {...register('username')}
                            error={errors.username?.message}
                        />
                    </div>
                    <div className="relative">
                        <Input 
                            label="密码" 
                            type={showPassword ? 'text' : 'password'}
                            {...register('password')}
                            error={errors.password?.message}
                            placeholder={modalMode === 'edit' ? '留空则不修改密码' : ''}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">描述</label>
                        <textarea 
                            className="block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            rows={2}
                            {...register('description')}
                            placeholder="选填"
                        />
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={cn(
                            "p-3 rounded-lg flex items-center gap-2 text-sm",
                            testResult.success ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                        )}>
                            {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            {testResult.message}
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleTestConnection}
                            isLoading={testingConnection}
                        >
                            <RefreshCw size={14} className="mr-2" /> 测试连接
                        </Button>
                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                            <Button type="submit" isLoading={loading}>保存</Button>
                        </div>
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
                        <p>此操作将永久删除该连接配置，无法恢复。</p>
                    </div>
                    <div className="text-center py-2">
                        <p className="text-slate-600 dark:text-slate-300">
                            确定要删除连接 <span className="font-bold text-red-600">"{deleteTarget?.name}"</span> 吗？
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
