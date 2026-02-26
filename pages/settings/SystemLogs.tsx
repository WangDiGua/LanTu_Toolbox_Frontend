import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, Search, Trash2, Eye, Filter, Clock, Calendar } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Modal } from '../../components/Modal';
import { Pagination } from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SystemLog } from '../../types';
import { formatDate, cn } from '../../utils';
import { logApi } from '../../api';

export const SystemLogs: React.FC = () => {
    const { success, error: toastError } = useToast();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'login' | 'operation' | 'error'>('all');
    const [methodFilter, setMethodFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    const [viewLog, setViewLog] = useState<SystemLog | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [isRetentionOpen, setIsRetentionOpen] = useState(false);
    const [retentionDays, setRetentionDays] = useState(30);
    const initialLoadRef = useRef(true);

    const [deleteTarget, setDeleteTarget] = useState<SystemLog | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const res = await logApi.getList({
                page,
                pageSize: 10,
                type: typeFilter === 'all' ? undefined : typeFilter,
                method: methodFilter === 'all' ? undefined : methodFilter,
                status: statusFilter === 'all' ? undefined : statusFilter
            });
            if (res.code === 200) {
                setLogs(res.data.records || []);
                setTotalPages(res.data.totalPages || 1);
            }
        } catch (e: any) {
            toastError(e.message || '加载日志列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [page, typeFilter, methodFilter, statusFilter]);

    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }
        const timer = setTimeout(() => {
            if (page === 1) loadLogs();
            else setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const openDetail = (log: SystemLog) => {
        setViewLog(log);
        setIsDetailOpen(true);
    };

    const openDeleteConfirm = (log: SystemLog) => {
        setDeleteTarget(log);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await logApi.delete(deleteTarget.id);
            success('日志已删除');
            setDeleteTarget(null);
            loadLogs();
        } catch (e: any) {
            toastError(e.message || '删除失败');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveRetention = async () => {
        setLoading(true);
        try {
            await logApi.setRetention(retentionDays);
            success(`日志保留策略已更新：自动删除 ${retentionDays} 天前的日志`);
            setIsRetentionOpen(false);
        } catch (e: any) {
            toastError(e.message || '保存失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3 items-center overflow-x-auto pb-2">
                <Input 
                    placeholder="搜索操作、用户或模块..." 
                    leftIcon={<Search size={16}/>} 
                    className="w-48 shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="w-28 shrink-0">
                     <Select 
                        value={typeFilter}
                        onChange={(val) => setTypeFilter(val as any)}
                        options={[
                            { label: '所有类型', value: 'all' },
                            { label: '登录日志', value: 'login' },
                            { label: '操作日志', value: 'operation' },
                            { label: '系统异常', value: 'error' },
                        ]}
                    />
                </div>
                <div className="w-28 shrink-0">
                     <Select 
                        value={methodFilter}
                        onChange={(val) => setMethodFilter(val as string)}
                        options={[
                            { label: '所有方法', value: 'all' },
                            { label: 'GET', value: 'GET' },
                            { label: 'POST', value: 'POST' },
                            { label: 'PUT', value: 'PUT' },
                            { label: 'DELETE', value: 'DELETE' },
                        ]}
                    />
                </div>
                <div className="w-28 shrink-0">
                     <Select 
                        value={statusFilter}
                        onChange={(val) => setStatusFilter(val as string)}
                        options={[
                            { label: '所有状态', value: 'all' },
                            { label: '成功', value: 'success' },
                            { label: '失败', value: 'failed' },
                        ]}
                    />
                </div>
                <div className="flex gap-2 ml-auto shrink-0">
                    <Button variant="secondary" onClick={() => setIsRetentionOpen(true)} title="设置日志自动删除规则">
                        <Clock size={16} className="mr-2 text-slate-500" /> 保留策略
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                            <tr>
                                <th className="px-4 py-3">状态</th>
                                <th className="px-4 py-3">类型</th>
                                <th className="px-4 py-3">请求</th>
                                <th className="px-4 py-3">操作行为</th>
                                <th className="px-4 py-3">操作人 / IP</th>
                                <th className="px-4 py-3">响应</th>
                                <th className="px-4 py-3">时间</th>
                                <th className="px-4 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">加载中...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">暂无数据</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-4 py-3">
                                        {log.status === 'success' ? 
                                            <CheckCircle size={16} className="text-green-500" /> : 
                                            <AlertCircle size={16} className="text-red-500" />
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded uppercase font-bold",
                                            log.type === 'login' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                            log.type === 'error' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : 
                                            "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                        )}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs px-1.5 py-0.5 rounded font-mono font-bold",
                                                log.requestMethod === 'GET' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                                log.requestMethod === 'POST' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                log.requestMethod === 'PUT' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                log.requestMethod === 'DELETE' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                                "bg-slate-100 text-slate-700"
                                            )}>
                                                {log.requestMethod || '-'}
                                            </span>
                                            <span className="text-xs text-slate-500 truncate max-w-[150px]" title={log.requestPath}>
                                                {log.requestPath || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                        <span className="truncate max-w-[120px] block" title={log.action}>{log.action}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900 dark:text-slate-200 text-xs">{log.username || '-'}</span>
                                            <span className="text-xs text-slate-400 font-mono">{log.ip || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-xs font-mono",
                                                log.responseCode && log.responseCode >= 400 ? "text-red-600" : "text-slate-600 dark:text-slate-400"
                                            )}>
                                                {log.responseCode || '-'}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {log.responseTime ? `${log.responseTime}ms` : '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{formatDate(log.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button 
                                                size="sm" 
                                                variant="secondary"
                                                onClick={() => openDetail(log)} 
                                                className="h-7 px-2"
                                            >
                                                <Eye size={12} className="mr-1" /> 查看
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="danger"
                                                onClick={() => openDeleteConfirm(log)} 
                                                className="h-7 px-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
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
                <div className="border-t border-slate-200 dark:border-slate-800">
                     <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            </div>

            <Modal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                title="日志详情"
                size="lg"
                footer={<Button onClick={() => setIsDetailOpen(false)}>关闭</Button>}
            >
                {viewLog && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">Log ID</span>
                                <span className="font-mono">{viewLog.id}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">时间</span>
                                <span className="font-mono">{formatDate(viewLog.createdAt)}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">操作人 / IP</span>
                                <span>{viewLog.username || '-'} ({viewLog.ip || '-'})</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">类型 / 状态</span>
                                <span>{viewLog.type} - {viewLog.status}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">请求方法</span>
                                <span className="font-mono font-bold">{viewLog.requestMethod || '-'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">请求路径</span>
                                <span className="font-mono text-xs break-all">{viewLog.requestPath || '-'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">响应状态码</span>
                                <span className={cn(
                                    "font-mono font-bold",
                                    viewLog.responseCode && viewLog.responseCode >= 400 ? "text-red-600" : "text-green-600"
                                )}>{viewLog.responseCode || '-'}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">响应时间</span>
                                <span className="font-mono">{viewLog.responseTime ? `${viewLog.responseTime}ms` : '-'}</span>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                            <span className="text-slate-500 block text-xs mb-1">操作行为</span>
                            <span className="font-medium">{viewLog.action}</span>
                        </div>
                        
                        {viewLog.requestParams && (
                            <div>
                                <span className="text-sm font-medium text-slate-700 mb-2 block dark:text-slate-300">请求参数</span>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-auto max-h-[200px]">
                                    <pre>{viewLog.requestParams}</pre>
                                </div>
                            </div>
                        )}
                        
                        {viewLog.userAgent && (
                            <div className="p-3 bg-slate-50 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                <span className="text-slate-500 block text-xs mb-1">User Agent</span>
                                <span className="text-xs break-all">{viewLog.userAgent}</span>
                            </div>
                        )}
                        
                        {viewLog.details && (
                            <div>
                                <span className="text-sm font-medium text-slate-700 mb-2 block dark:text-slate-300">详细信息</span>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-auto max-h-[300px]">
                                    <pre>{viewLog.details}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isRetentionOpen}
                onClose={() => setIsRetentionOpen(false)}
                title="日志保留策略设置"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsRetentionOpen(false)}>取消</Button>
                        <Button onClick={handleSaveRetention} isLoading={loading}>保存设置</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg flex gap-3 text-sm text-blue-700 border border-blue-100">
                        <Info size={18} className="shrink-0 mt-0.5" />
                        <p>系统将在每日凌晨 02:00 自动执行清理任务，永久删除超过保留期限的日志数据。</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">保留期限</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[7, 30, 90, 180].map(days => (
                                <div 
                                    key={days}
                                    onClick={() => setRetentionDays(days)}
                                    className={cn(
                                        "cursor-pointer border rounded-lg p-3 text-center transition-all",
                                        retentionDays === days 
                                            ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500" 
                                            : "hover:bg-slate-50 border-slate-200"
                                    )}
                                >
                                    <span className="font-bold text-lg">{days}</span> <span className="text-xs">天</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3">
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input 
                                    type="radio" 
                                    name="retention" 
                                    checked={retentionDays === 0} 
                                    onChange={() => setRetentionDays(0)}
                                 />
                                 <span className="text-sm text-slate-600 dark:text-slate-400">永久保留 (不推荐，可能占用大量存储空间)</span>
                             </label>
                        </div>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="删除日志"
                message={`确定要删除该条日志吗？此操作不可恢复。`}
                confirmText="删除"
                cancelText="取消"
                type="danger"
                loading={isDeleting}
            />
        </div>
    );
};
