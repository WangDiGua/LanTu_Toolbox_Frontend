import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, Download, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Pagination } from '../components/Pagination';
import { formatDate } from '../utils';
import { logAuditApi } from '../api';
import { useToast } from '../components/Toast';

export const LogAudit: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await logAuditApi.getList({
        page,
        pageSize: 10,
        keyword: searchTerm
      });
      if (res.code === 200) {
        setLogs(res.data.records || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (e: any) {
      toastError(e.message || '加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) loadLogs();
      else setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleExport = async () => {
    try {
      await logAuditApi.export({ keyword: searchTerm });
      toastSuccess('日志导出成功');
    } catch (e: any) {
      toastError(e.message || '导出失败');
    }
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">日志审计</h1>
            <p className="text-slate-500 dark:text-slate-400">查看系统操作记录与安全审计追踪。</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
             <div className="p-4 border-b border-slate-100 flex gap-4 dark:border-slate-800">
                <Input 
                  placeholder="搜索日志内容..." 
                  leftIcon={<Search size={16} />} 
                  className="max-w-md dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="secondary" onClick={handleExport} className="dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Download size={16} className="mr-2" /> 导出日志
                </Button>
             </div>
             
             <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">事件类型</th>
                        <th className="px-6 py-4">严重程度</th>
                        <th className="px-6 py-4">触发用户</th>
                        <th className="px-6 py-4">IP 地址</th>
                        <th className="px-6 py-4">时间</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 size={20} className="animate-spin inline-block" />
                      </td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">暂无数据</td></tr>
                    ) : logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" />
                                {log.event}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    log.severity === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                    {log.severity}
                                </span>
                            </td>
                            <td className="px-6 py-4">{log.user}</td>
                            <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                            <td className="px-6 py-4">{formatDate(log.timestamp)}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
             
             <div className="border-t border-slate-100 p-2 dark:border-slate-800">
               <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
             </div>
        </div>
    </div>
  );
};
