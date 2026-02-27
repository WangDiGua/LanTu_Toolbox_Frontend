import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Trash2, 
  Eye, 
  Database,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Pagination } from '../components/Pagination';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate, cn } from '../utils';
import { SyncLog, SyncLogStats } from '../types';
import { syncLogApi } from '../api';

export const SyncLogs: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'full' | 'incremental'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'running' | 'success' | 'failed'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'manual' | 'scheduled' | 'api'>('all');
  const [viewLog, setViewLog] = useState<SyncLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SyncLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState<SyncLogStats>({ total: 0, running: 0, success: 0, failed: 0, todayAdded: 0 });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await syncLogApi.getList({
        page,
        pageSize: 10,
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        method: methodFilter === 'all' ? undefined : methodFilter,
        searchTerm: searchTerm || undefined
      });
      if (res.code === 200) {
        setLogs(res.data.records || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      }
    } catch (e: any) {
      toastError(e.message || '加载日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await syncLogApi.getStats();
      if (res.code === 200) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [page, typeFilter, statusFilter, methodFilter, searchTerm]);

  const openDetail = (log: SyncLog) => {
    setViewLog(log);
    setIsDetailOpen(true);
  };

  const openDeleteConfirm = (log: SyncLog) => {
    setDeleteTarget(log);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await syncLogApi.delete(deleteTarget.id);
      success('日志已删除');
      setDeleteTarget(null);
      loadLogs();
      loadStats();
    } catch (e: any) {
      toastError(e.message || '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '待执行', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock };
      case 'running':
        return { label: '执行中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Loader2 };
      case 'success':
        return { label: '成功', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle };
      case 'failed':
        return { label: '失败', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle };
      default:
        return { label: '-', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: AlertCircle };
    }
  };

  const getSyncTypeText = (type: string) => {
    if (type === 'full') return '全量同步';
    if (type === 'incremental') return '增量同步';
    return type || '-';
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'manual':
        return '手动触发';
      case 'scheduled':
        return '定时任务';
      case 'api':
        return 'API调用';
      default:
        return method || '-';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}min`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">同步向量</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">查看和管理向量同步任务日志</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { loadLogs(); loadStats(); }}>
            <RefreshCw size={16} className="mr-2" /> 刷新
          </Button>
          <Button variant="primary" onClick={() => navigate('/vector')}>
            <Database size={16} className="mr-2" /> 向量管理
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">总任务数</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Activity size={20} className="text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">执行中</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.running}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">成功</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.success}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">失败</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.failed}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle size={20} className="text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">今日新增</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.todayAdded}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Clock size={20} className="text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-3 items-center">
            <Input 
              placeholder="搜索向量名称、集合名称..." 
              leftIcon={<Search size={16}/>} 
              className="w-64 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="w-32">
              <Select 
                value={typeFilter}
                onChange={(val) => setTypeFilter(val as any)}
                options={[
                  { label: '所有类型', value: 'all' },
                  { label: '全量同步', value: 'full' },
                  { label: '增量同步', value: 'incremental' },
                ]}
              />
            </div>
            <div className="w-32">
              <Select 
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as string)}
                options={[
                  { label: '所有状态', value: 'all' },
                  { label: '待执行', value: 'pending' },
                  { label: '执行中', value: 'running' },
                  { label: '成功', value: 'success' },
                  { label: '失败', value: 'failed' },
                ]}
              />
            </div>
            <div className="w-32">
              <Select 
                value={methodFilter}
                onChange={(val) => setMethodFilter(val as string)}
                options={[
                  { label: '所有方式', value: 'all' },
                  { label: '手动触发', value: 'manual' },
                  { label: '定时任务', value: 'scheduled' },
                  { label: 'API调用', value: 'api' },
                ]}
              />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-auto">
              共 {total} 条记录
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
              <tr>
                <th className="px-4 py-3">任务 ID</th>
                <th className="px-4 py-3">向量名称</th>
                <th className="px-4 py-3">集合名称</th>
                <th className="px-4 py-3">同步类型</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">触发方式</th>
                <th className="px-4 py-3">开始时间</th>
                <th className="px-4 py-3">耗时</th>
                <th className="px-4 py-3">记录数</th>
                <th className="px-4 py-3">失败数</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    暂无同步日志
                  </td>
                </tr>
              ) : logs.map(log => {
                const statusConfig = getStatusConfig(log.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{log.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{log.vectorTitle || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{log.collectionName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        log.taskType === 'full' 
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : log.taskType === 'incremental'
                          ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {log.taskType === 'full' ? '全量同步' : log.taskType === 'incremental' ? '增量同步' : log.taskType || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium",
                        statusConfig.color
                      )}>
                        <StatusIcon size={12} className={log.status === 'running' ? 'animate-spin' : ''} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{getMethodText(log.triggerType)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {formatDate(log.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                      {formatDuration(log.durationMs)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <span className="text-slate-500 dark:text-slate-400">{log.processedRecords}</span>
                      <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                      <span className="text-slate-700 dark:text-slate-300">{log.totalRecords}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <span className={log.failedRecords > 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-slate-500 dark:text-slate-400"}>
                        {log.failedRecords}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openDetail(log)} 
                          className="h-7 px-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                          <Eye size={14} className="mr-1" /> 详情
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => openDeleteConfirm(log)} 
                          className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={14} className="mr-1" /> 删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="同步日志详情"
        size="lg"
        footer={<Button onClick={() => setIsDetailOpen(false)}>关闭</Button>}
      >
        {viewLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">任务 ID</span>
                <span className="font-mono text-slate-900 dark:text-white">{viewLog.id}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">状态</span>
                <span className={cn("font-medium", getStatusConfig(viewLog.status).color, "px-2 py-0.5 rounded text-xs")}>
                  {getStatusConfig(viewLog.status).label}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">向量名称</span>
                <span className="font-medium text-slate-900 dark:text-white">{viewLog.vectorTitle || '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">集合名称</span>
                <span className="text-slate-900 dark:text-white">{viewLog.collectionName || '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">同步类型</span>
                <span className="text-slate-900 dark:text-white">{getSyncTypeText(viewLog.taskType)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">触发方式</span>
                <span className="text-slate-900 dark:text-white">{getMethodText(viewLog.triggerType)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">开始时间</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatDate(viewLog.startedAt)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">结束时间</span>
                <span className="font-mono text-slate-900 dark:text-white">{viewLog.finishedAt ? formatDate(viewLog.finishedAt) : '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">耗时</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatDuration(viewLog.durationMs)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">总记录数</span>
                <span className="font-mono text-slate-900 dark:text-white">{viewLog.totalRecords}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">已处理</span>
                <span className="font-mono text-slate-900 dark:text-white">{viewLog.processedRecords}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">失败数</span>
                <span className={cn("font-mono", viewLog.failedRecords > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white")}>
                  {viewLog.failedRecords}
                </span>
              </div>
            </div>
            
            {viewLog.errorMessage && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-800">
                <span className="text-red-600 dark:text-red-400 block text-xs mb-1 font-medium">错误信息</span>
                <p className="text-red-700 dark:text-red-300 text-sm">{viewLog.errorMessage}</p>
              </div>
            )}
            
            {viewLog.errorStack && (
              <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1 font-medium">错误堆栈</span>
                <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-xs overflow-auto max-h-[200px] mt-2">
                  {viewLog.errorStack}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="删除同步日志"
        message="确定要删除该条同步日志吗？此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
        loading={isDeleting}
      />
    </div>
  );
};
