import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Database, Activity, AlertTriangle, CheckCircle, Cpu, HardDrive, Server, Network, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { cn } from '../utils';
import { motion } from 'framer-motion';
import { Chart } from '../components/Chart';
import * as echarts from 'echarts';
import { useStore } from '../store';
import { dashboardApi, taskApi, sseClient, SSEMessage, TaskEvent } from '../api';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/Button';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'console'>('stats');
  const { state } = useStore();
  const isDark = state.themeMode === 'dark';
  
  const [statsData, setStatsData] = useState<any>({ trend: [] });
  const [resources, setResources] = useState<any>({});
  const [nodes, setNodes] = useState<any[]>([]);
  
  const [taskList, setTaskList] = useState<any[]>([]);
  const [taskTotal, setTaskTotal] = useState(0);
  const [taskPage, setTaskPage] = useState(1);
  const [taskLoading, setTaskLoading] = useState(false);
  const taskPageSize = 10;
  
  const loadTaskList = async () => {
    setTaskLoading(true);
    try {
      const res = await taskApi.getList({ page: taskPage, pageSize: taskPageSize });
      if (res.code === 200 && res.data) {
        const records = Array.isArray(res.data) ? res.data : (res.data.records || []);
        setTaskList(records);
        setTaskTotal(res.data.total || records.length);
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setTaskLoading(false);
    }
  };
  
  useEffect(() => {
    loadTaskList();
  }, [taskPage]);
  
  useEffect(() => {
    const handleSSEMessage = (message: SSEMessage) => {
      if (message.type === 'task_update') {
        const updatedTask = message.data as TaskEvent;
        setTaskList(prev => {
          const exists = prev.some(t => String(t.id) === String(updatedTask.id));
          if (exists) {
            return prev.map(t => 
              String(t.id) === String(updatedTask.id) 
                ? { ...t, ...updatedTask }
                : t
            );
          }
          return [updatedTask as any, ...prev];
        });
      } else if (message.type === 'tasks_list') {
        loadTaskList();
      }
    };

    const unsubscribe = sseClient.subscribe(handleSSEMessage);
    return () => unsubscribe();
  }, [taskPage]);
  
  useEffect(() => {
      const loadData = async () => {
          try {
              if (activeTab === 'stats') {
                  const res = await dashboardApi.getStats();
                  if(res.code === 200) setStatsData(res.data);
              } else {
                  const resRes = await dashboardApi.getResources();
                  if(resRes.code === 200) setResources(resRes.data);
                  
                  const resNodes = await dashboardApi.getNodes();
                  if(resNodes.code === 200) {
                      const nodesData = resNodes.data as any;
                      if (Array.isArray(nodesData)) {
                          setNodes(nodesData);
                      } else if (nodesData && Array.isArray(nodesData.records)) {
                          setNodes(nodesData.records);
                      } else if (nodesData && Array.isArray(nodesData.list)) {
                          setNodes(nodesData.list);
                      } else {
                          setNodes([]);
                      }
                  }
              }
          } catch (e) {
              console.error(e);
          }
      };
      loadData();
  }, [activeTab]);

  // --- Chart Options Configuration ---
  
  // Bar Chart: Vector Ingestion
  const barOption = useMemo<echarts.EChartsOption>(() => ({
      backgroundColor: 'transparent',
      tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#1e293b' }
      },
      grid: {
          top: '15%',
          right: '5%',
          bottom: '10%',
          left: '10%',
          containLabel: false
      },
      xAxis: {
          type: 'category',
          data: statsData.trend?.map((item: any) => item.name) || [],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b' }
      },
      yAxis: {
          type: 'value',
          splitLine: { 
              lineStyle: { 
                  type: 'dashed',
                  color: isDark ? '#334155' : '#e2e8f0' 
              } 
          },
          axisLabel: { color: '#64748b' }
      },
      series: [
          {
              name: '新增向量',
              type: 'bar',
              barWidth: '40%',
              data: statsData.trend?.map((item: any) => item.vectors) || [],
              itemStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: '#3b82f6' },
                      { offset: 1, color: '#60a5fa' }
                  ]),
                  borderRadius: [4, 4, 0, 0]
              }
          }
      ]
  }), [isDark, statsData]);

  // Line Chart: Query Performance
  const lineOption = useMemo<echarts.EChartsOption>(() => ({
      backgroundColor: 'transparent',
      tooltip: {
          trigger: 'axis',
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          textStyle: { color: isDark ? '#f8fafc' : '#1e293b' }
      },
      grid: {
          top: '15%',
          right: '5%',
          bottom: '10%',
          left: '10%',
          containLabel: false
      },
      xAxis: {
          type: 'category',
          boundaryGap: false,
          data: statsData.trend?.map((item: any) => item.name) || [],
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b' }
      },
      yAxis: {
          type: 'value',
          splitLine: { 
              lineStyle: { 
                  type: 'dashed',
                  color: isDark ? '#334155' : '#e2e8f0' 
              } 
          },
          axisLabel: { color: '#64748b' }
      },
      series: [
          {
              name: '查询延迟 (ms)',
              type: 'line',
              smooth: true,
              showSymbol: false,
              symbolSize: 8,
              data: statsData.trend?.map((item: any) => item.queries) || [],
              itemStyle: {
                  color: '#8b5cf6'
              },
              areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                      { offset: 1, color: 'rgba(139, 92, 246, 0.01)' }
                  ])
              },
              lineStyle: {
                  width: 3,
                  shadowColor: 'rgba(139, 92, 246, 0.3)',
                  shadowBlur: 10,
                  shadowOffsetY: 5
              }
          }
      ]
  }), [isDark, statsData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-1 bg-slate-200 p-1 rounded-lg w-fit dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === 'stats' 
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50'
          )}
        >
          业务统计
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === 'console' 
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50'
          )}
        >
          系统控制台
        </button>
      </div>

      {activeTab === 'stats' && (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="向量总数" value={statsData.totalVectors || '-'} icon={<Database className="text-blue-500" />} trend={statsData.totalVectorsTrend || '0%'} type="vectors" />
                <StatCard title="每日查询" value={statsData.dailyQueries || '-'} icon={<Activity className="text-purple-500" />} trend={statsData.dailyQueriesTrend || '0%'} type="queries" />
                <StatCard title="活跃节点" value={statsData.activeNodes || '-'} icon={<CheckCircle className="text-green-500" />} trend={statsData.activeNodesTrend || '0%'} type="nodes" />
                <StatCard title="索引错误" value={statsData.errors || '0'} icon={<AlertTriangle className="text-red-500" />} trend={statsData.errorsTrend || '0%'} type="errors" />
            </div>

            {/* Charts with ECharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 dark:text-white">向量入库趋势</h3>
                    <div className="h-80 w-full">
                        <Chart options={barOption} loading={!statsData.trend} />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 dark:text-white">查询延迟 (ms)</h3>
                    <div className="h-80 w-full">
                         <Chart options={lineOption} loading={!statsData.trend} />
                    </div>
                </motion.div>
            </div>
        </motion.div>
      )}

      {activeTab === 'console' && (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            {/* Left Column: System Resources */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                {/* Resource Monitor */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-800 mb-4 dark:text-white flex items-center">
                        <Activity size={18} className="mr-2 text-blue-500" /> 
                        系统资源监控
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <ResourceGauge label="CPU 使用率" value={resources.cpu || 0} icon={<Cpu size={20} />} color="text-blue-500" />
                        <ResourceGauge label="内存占用" value={resources.memory || 0} icon={<HardDrive size={20} />} color="text-purple-500" />
                        <ResourceGauge label="磁盘 I/O" value={resources.disk || 0} icon={<Server size={20} />} color="text-green-500" />
                    </div>
                </div>

                {/* Task List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-white">后台任务队列</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                共 {taskTotal} 条记录
                            </span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={loadTaskList}
                                isLoading={taskLoading}
                                className="text-xs"
                            >
                                <RefreshCw size={12} className="mr-1" /> 刷新
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
                        {taskLoading ? (
                            <div className="p-8 text-center text-slate-400">
                                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                                加载中...
                            </div>
                        ) : taskList.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">暂无任务记录</div>
                        ) : (
                            taskList.map((task: any) => (
                                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors dark:hover:bg-slate-800">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-1">
                                            <h4 className="font-medium text-sm text-slate-900 mr-3 dark:text-slate-200">{task.name}</h4>
                                            <StatusBadge status={task.status} />
                                        </div>
                                        <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 mt-2 dark:bg-slate-700">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${task.progress}%` }}
                                                transition={{ duration: 0.5 }}
                                                className={cn("h-1.5 rounded-full", 
                                                    task.status === 'Completed' ? 'bg-green-500' : 
                                                    task.status === 'Failed' ? 'bg-red-500' : 'bg-blue-500'
                                                )}
                                            ></motion.div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono ml-4 whitespace-nowrap">
                                        {task.startTime || task.start_time ? new Date(task.startTime || task.start_time).toLocaleString('zh-CN', { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit',
                                            hour: '2-digit', 
                                            minute: '2-digit'
                                        }) : '-'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {taskTotal > taskPageSize && (
                        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                            <Pagination 
                                currentPage={taskPage} 
                                totalPages={Math.ceil(taskTotal / taskPageSize)} 
                                onPageChange={setTaskPage} 
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Right Column: Node Status & Terminal */}
            <motion.div variants={itemVariants} className="space-y-6">
                {/* Active Nodes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-800 mb-4 dark:text-white flex items-center">
                        <Network size={18} className="mr-2 text-indigo-500" />
                        集群节点状态
                    </h3>
                    <div className="space-y-3">
                        {nodes.map(node => (
                            <div key={node.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full", node.status === 'active' ? 'bg-green-500' : 'bg-yellow-500')}></div>
                                    <div>
                                        <div className="text-xs font-mono font-medium dark:text-slate-200">{node.id}</div>
                                        <div className="text-[10px] text-slate-400">{node.ip}</div>
                                    </div>
                                </div>
                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded", 
                                    parseInt(node.load) > 80 ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-slate-600 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                                )}>
                                    Load: {node.load}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Console Terminal */}
                <div className="bg-slate-900 rounded-xl overflow-hidden flex flex-col h-[280px] shadow-lg">
                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono ml-2">root@vector-admin:~</span>
                    </div>
                    <div className="p-4 text-xs font-mono text-slate-300 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="text-green-400 mb-1">$ systemctl status vector-engine</div>
                        <div className="mb-1 opacity-80">[INFO] Vector engine running on port 8080</div>
                        <div className="mb-1 opacity-80">[INFO] Connected to storage cluster (Node A, Node B)</div>
                        <div className="text-blue-400 mb-1 animate-pulse">_ cursor blinking...</div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
      )}
    </div>
  );
};

const ResourceGauge = ({ label, value, icon, color }: any) => (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
        <div className={cn("mb-2 p-2 rounded-full bg-white dark:bg-slate-700 shadow-sm", color)}>
            {icon}
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}%</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 dark:bg-slate-700 overflow-hidden">
            <div className={cn("h-full rounded-full opacity-80", color.replace('text-', 'bg-'))} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);

const StatCard = ({ title, value, icon, trend, type }: { title: string; value: string | number; icon: React.ReactNode; trend: string; type: 'vectors' | 'queries' | 'nodes' | 'errors' }) => {
    const getTrendStyle = () => {
        if (trend === '0%') {
            return {
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-500 dark:text-slate-400',
                icon: <Minus size={12} />
            };
        }
        if (trend.startsWith('+')) {
            if (type === 'errors') {
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    text: 'text-red-600 dark:text-red-400',
                    icon: <TrendingUp size={12} />
                };
            }
            return {
                bg: 'bg-green-50 dark:bg-green-900/20',
                text: 'text-green-600 dark:text-green-400',
                icon: <TrendingUp size={12} />
            };
        }
        if (trend.startsWith('-')) {
            if (type === 'errors') {
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    text: 'text-green-600 dark:text-green-400',
                    icon: <TrendingDown size={12} />
                };
            }
            return {
                bg: 'bg-red-50 dark:bg-red-900/20',
                text: 'text-red-600 dark:text-red-400',
                icon: <TrendingDown size={12} />
            };
        }
        return {
            bg: 'bg-slate-100 dark:bg-slate-800',
            text: 'text-slate-500 dark:text-slate-400',
            icon: <Minus size={12} />
        };
    };

    const style = getTrendStyle();

    return (
        <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all cursor-default dark:bg-slate-900 dark:border-slate-800"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-50 rounded-lg dark:bg-slate-800">{icon}</div>
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1", style.bg, style.text)}>
                    {style.icon}
                    {trend}
                </span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1 dark:text-white">{value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
        </motion.div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
        'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        'Failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase", styles[status] || 'bg-gray-100 text-gray-800')}>
            {status}
        </span>
    );
};