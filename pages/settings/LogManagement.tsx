import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { SystemLog } from '../../types';
import { formatDate } from '../../utils';

export const LogManagement: React.FC = () => {
    const logs: SystemLog[] = Array.from({ length: 8 }).map((_, i) => ({
        id: i + 1,
        userId: 1,
        username: i % 3 === 0 ? 'admin' : 'system_bot',
        action: i % 2 === 0 ? 'UPDATE_VECTOR' : 'LOGIN',
        module: i % 2 === 0 ? 'VectorModule' : 'auth',
        type: i % 2 === 0 ? 'operation' : 'login' as const,
        ip: `192.168.1.${100 + i}`,
        details: 'Mock log details',
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        status: i === 4 ? 'failed' : 'success' as const
    }));

    return (
        <div className="space-y-4">
            <div className="flex gap-2 mb-4">
                <Button variant="secondary" size="sm" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">全部日志</Button>
                <Button variant="ghost" size="sm" className="dark:text-slate-400">仅错误</Button>
                <Button variant="ghost" size="sm" className="dark:text-slate-400">最近24小时</Button>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                 <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                        <tr>
                            <th className="px-6 py-3">状态</th>
                            <th className="px-6 py-3">操作行为</th>
                            <th className="px-6 py-3">操作人</th>
                            <th className="px-6 py-3">模块</th>
                            <th className="px-6 py-3">时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="px-6 py-3">
                                    {log.status === 'success' ? 
                                        <CheckCircle size={16} className="text-green-500" /> : 
                                        <AlertCircle size={16} className="text-red-500" />
                                    }
                                </td>
                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-300">{log.action}</td>
                                <td className="px-6 py-3">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono dark:bg-slate-800 dark:text-slate-400">
                                        {log.username}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-500 text-xs">{log.module}</td>
                                <td className="px-6 py-3 text-slate-400 text-xs font-mono">{formatDate(log.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
