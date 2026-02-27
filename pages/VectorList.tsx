import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, FileText, ToggleLeft, ToggleRight, Layers, Table as TableIcon, Clock, CalendarClock, User as UserIcon, AlertTriangle, Link as LinkIcon, CheckSquare, Download, Database, ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Permission } from '../components/Permission';
import { VectorWizard } from '../components/VectorWizard';
import { CronGenerator } from '../components/CronGenerator';
import { VectorItem, DatabaseItem, TableItem, FieldItem } from '../types';
import { vectorApi } from '../api'; // Real API
import { cn, formatDate, getNextCronRunTime } from '../utils';
import { useToast } from '../components/Toast';

export const VectorList: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [items, setItems] = useState<VectorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'indexed' | 'pending' | 'error'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<Partial<VectorItem>>({});

  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [currentSyncItem, setCurrentSyncItem] = useState<VectorItem | null>(null);
  const [syncForm, setSyncForm] = useState({ 
    enabled: false, 
    expression: '',
    syncMode: 'full' as 'full' | 'incremental',
    incrementalField: ''
  });

  // Delete Verification Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');
  const [userInputName, setUserInputName] = useState('');

  // Batch Delete Modal State
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [batchDeleteConfirmText, setBatchDeleteConfirmText] = useState('');

  // Wizard Data State (fetched from API inside component or passed down)
  const [wizardDbs, setWizardDbs] = useState<DatabaseItem[]>([]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
        const res = await vectorApi.getList({
            page,
            pageSize: 10,
            keyword: searchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter
        });
        if(res.code === 200) {
            const records = res.data.records || [];
            const mappedItems = records.map((item: any) => ({
                id: String(item.id),
                title: item.title,
                alias: item.alias || '',
                description: item.description || '',
                collectionName: item.collectionName || '',
                sourceType: item.sourceType || '',
                content: item.collectionName || '',
                dimensions: item.dimensions,
                source: `${item.dbName || ''}.${(item.tableNames || []).join(',')}`,
                status: item.status,
                isMultiTable: item.isMultiTable === 1 || item.isMultiTable === true,
                joinRules: item.joinRules,
                selectedFields: (item.selectedFields || []).join(', '),
                advancedConfig: item.advancedConfig,
                dbName: item.dbName,
                tableNames: item.tableNames,
                isEnabled: item.isEnabled === 1 || item.isEnabled === true,
                cronConfig: item.cronExpression ? {
                    enabled: item.isCronEnabled === 1 || item.isCronEnabled === true,
                    expression: item.cronExpression,
                    syncMode: item.syncMode || 'full',
                    incrementalField: item.incrementalField || ''
                } : undefined,
                lastSyncAt: item.lastSyncAt,
                nextSyncAt: item.nextSyncAt,
                lastSyncValue: item.lastSyncValue,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                createdBy: item.createdBy,
                updatedBy: item.updatedBy
            }));
            setItems(mappedItems);
            setTotalPages(res.data.totalPages || 1);
        }
    } catch (e: any) {
        toastError(e.message || '加载失败');
    } finally {
        setLoading(false);
        setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, searchTerm, statusFilter]);

  // Load Wizard Dependencies when modal opens
  const prepareWizard = async () => {
      try {
          const res = await vectorApi.getDatabases();
          if (res.code === 200) {
              const dbs = (res.data as any[]).map((db: any) => ({
                  id: db.databaseName || db.name,
                  name: db.databaseName || db.name,
                  type: db.defaultCharacterSet || db.type || 'utf8mb4'
              }));
              setWizardDbs(dbs);
          }
      } catch (e) {
          toastError('无法加载数据库列表');
      }
  };

  // --- Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) setSelectedIds(items.map(i => i.id));
      else setSelectedIds([]);
  };

  const handleSelectRow = (id: string) => {
      selectedIds.includes(id) 
        ? setSelectedIds(selectedIds.filter(i => i !== id)) 
        : setSelectedIds([...selectedIds, id]);
  };

  const handleBatchDelete = () => {
      setBatchDeleteConfirmText('');
      setIsBatchDeleteModalOpen(true);
  };

  const confirmBatchDelete = async () => {
      if (batchDeleteConfirmText !== '我确认删除') {
          toastError('请输入"我确认删除"以继续');
          return;
      }
      setIsBatchDeleteModalOpen(false);
      setLoading(true);
      try {
          await vectorApi.batchDelete(selectedIds);
          toastSuccess('批量删除成功');
          loadData();
      } catch (e: any) {
          toastError(e.message);
          setLoading(false);
      }
  };

  // Excel (CSV) Export via API
  const handleExport = async () => {
      try {
          const res = await vectorApi.exportExcel(selectedIds);
          // Create download link from Blob
          const url = window.URL.createObjectURL(new Blob([res as any]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `vectors_export_${Date.now()}.xlsx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          toastSuccess('导出成功');
      } catch (e) {
          toastError('导出失败');
      }
  };

  const initDelete = (item: VectorItem) => {
      setDeleteTargetId(item.id);
      setDeleteTargetName(item.title);
      setUserInputName('');
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
      if (userInputName !== deleteTargetName) {
          toastError('输入的集合名称不正确');
          return;
      }
      if (!deleteTargetId) return;

      setIsDeleteModalOpen(false);
      setLoading(true);
      try {
          await vectorApi.delete(deleteTargetId);
          toastSuccess('删除成功');
          loadData();
      } catch (e: any) {
          toastError(e.message);
          setLoading(false);
      } finally {
          setDeleteTargetId(null);
          setDeleteTargetName('');
      }
  };

  const handleToggleEnable = async (item: VectorItem) => {
      try {
          await vectorApi.toggleStatus(item.id, !item.isEnabled);
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, isEnabled: !item.isEnabled } : i));
          toastSuccess(`向量集已${!item.isEnabled ? '启用' : '禁用'}`);
      } catch (e: any) {
          toastError(e.message);
      }
  };

  const handleEdit = (item: VectorItem) => {
    setCurrentItem({ ...item });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setCurrentItem({});
    setModalMode('create');
    setIsModalOpen(true);
    prepareWizard();
  };

  // Sync Handlers
  const handleOpenSync = (item: VectorItem) => {
      setCurrentSyncItem(item);
      setSyncForm({
          enabled: item.cronConfig?.enabled || false,
          expression: item.cronConfig?.expression || '0 2 * * *',
          syncMode: item.cronConfig?.syncMode || 'full',
          incrementalField: item.cronConfig?.incrementalField || ''
      });
      setIsSyncModalOpen(true);
  };

  const handleSaveSync = async () => {
      if (!currentSyncItem) return;
      if (syncForm.enabled && !syncForm.expression.trim()) {
          toastError('启用定时任务时，Cron 表达式不能为空');
          return;
      }
      if (syncForm.enabled && syncForm.syncMode === 'incremental' && !syncForm.incrementalField.trim()) {
          toastError('增量同步模式下，增量字段不能为空');
          return;
      }

      setLoading(true);
      try {
          const res = await vectorApi.configureSync(currentSyncItem.id, {
            enabled: syncForm.enabled,
            expression: syncForm.expression,
            syncMode: syncForm.syncMode,
            incrementalField: syncForm.syncMode === 'incremental' ? syncForm.incrementalField : undefined
          });
          // Update Local State
          setItems(prev => prev.map(i => 
              i.id === currentSyncItem.id 
                ? { ...i, cronConfig: { ...syncForm }, nextSyncAt: res.data?.nextSyncAt } 
                : i
          ));
          setIsSyncModalOpen(false);
          toastSuccess(`同步任务已${syncForm.enabled ? '更新并启动' : '关闭'}`);
      } catch (e: any) {
          toastError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleTriggerSync = async () => {
      if (!currentSyncItem) return;
      setLoading(true);
      try {
          const res = await vectorApi.triggerSync(currentSyncItem.id);
          toastSuccess(`同步任务已启动，任务ID: ${res.data?.taskId}`);
          setIsSyncModalOpen(false);
      } catch (e: any) {
          toastError(e.message);
      } finally {
          setLoading(false);
      }
  };

  const handleSaveEdit = async () => {
      if (modalMode === 'edit' && currentItem.id) {
          if(!currentItem.title?.trim()) {
              toastError('标题不能为空');
              return;
          }
          // Check for duplicate name before saving
          try {
              // Usually the backend checkName would exclude self, or update API handles it.
              // Assuming update API handles validation or we skip check for simple edit.
              await vectorApi.update(currentItem.id, { title: currentItem.title });
              setItems(prev => prev.map(item => item.id === currentItem.id ? { ...item, title: currentItem.title! } as VectorItem : item));
              toastSuccess('更新成功');
              setIsModalOpen(false);
          } catch (e: any) {
              toastError(e.message);
          }
      }
  };

  const handleWizardFinish = async (data: any) => {
      setIsModalOpen(false);
      loadData();
  };

  // Helper to render join rules
  const renderJoinRules = (joinRules: any) => {
    if (!joinRules) return <span className="text-slate-300 dark:text-slate-600">-</span>;
    
    try {
        let rules: any = joinRules;
        
        if (typeof joinRules === 'string') {
            rules = JSON.parse(joinRules);
        }
        
        if (rules.joins && Array.isArray(rules.joins)) {
            const joinTypeColors: Record<string, string> = {
                'LEFT': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                'RIGHT': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                'INNER': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                'FULL': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
            };
            
            const operatorSymbols: Record<string, string> = {
                '=': '=',
                '!=': '≠',
                '>': '>',
                '<': '<',
                '>=': '≥',
                '<=': '≤'
            };
            
            return (
                <div className="space-y-2 max-w-[280px]">
                    {/* Base Table */}
                    <div className="flex items-center gap-1.5">
                        <Database size={12} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">主表:</span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                            {rules.baseTableId}
                        </span>
                    </div>
                    
                    {/* Joins */}
                    {rules.joins.map((join: any, index: number) => {
                        const conditionsText = join.conditions?.map((c: any) => {
                            const leftField = c.leftFieldId?.split(':').pop() || c.leftFieldId;
                            const rightField = c.rightFieldId?.split(':').pop() || c.rightFieldId;
                            return `${leftField} ${operatorSymbols[c.operator] || c.operator} ${rightField}`;
                        }).join(` ${join.conditionLogic || 'AND'} `) || '';
                        
                        return (
                            <div key={join.id || index} className="flex flex-col gap-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                        joinTypeColors[join.joinType] || joinTypeColors['LEFT']
                                    )}>
                                        {join.joinType}
                                    </span>
                                    <ArrowRight size={10} className="text-slate-400" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {join.rightTableId}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate" title={conditionsText}>
                                    ON {conditionsText}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        
        if (rules.conditions && Array.isArray(rules.conditions)) {
            return (
                <div className="flex items-center gap-1.5">
                    <span className="text-xs bg-purple-50 text-purple-600 rounded px-1.5 py-0.5 border border-purple-100 font-medium whitespace-nowrap dark:bg-purple-900/30 dark:text-purple-300">
                        {rules.type === 'one_to_one' ? '1:1' : '1:N'}
                    </span>
                    <LinkIcon size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-mono">
                        {rules.conditions.length || 0} 条件
                    </span>
                </div>
            );
        }
        
        return <span className="text-slate-300 dark:text-slate-600">-</span>;
    } catch (e) {
        return <span className="text-red-400 text-xs">Error</span>;
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">向量管理</h1>
            <div className="flex gap-2">
                <Button 
                    variant="secondary" 
                    onClick={handleExport}
                    disabled={selectedIds.length === 0}
                    title={selectedIds.length === 0 ? "请先选择要导出的数据" : "导出选中的数据"}
                >
                    <Download size={18} className="mr-2" /> 导出 Excel
                </Button>
                <Button onClick={handleCreate}>
                    <Plus size={18} className="mr-2" /> 添加向量
                </Button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            {/* Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center dark:border-slate-800">
                <div className="flex-1 max-w-sm">
                    <Input placeholder="搜索标题..." leftIcon={<Search size={16} />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="w-40">
                     <Select 
                        value={statusFilter} 
                        onChange={(val) => setStatusFilter(val as any)}
                        leftIcon={<Filter size={16} />}
                        options={[
                            { label: '所有状态', value: 'all' },
                            { label: '已索引', value: 'indexed' },
                            { label: '处理中', value: 'pending' },
                            { label: '错误', value: 'error' },
                        ]}
                     />
                </div>
                <Permission permissions={['vector:delete']}>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={handleBatchDelete}
                        disabled={selectedIds.length === 0}
                        title={selectedIds.length === 0 ? "请先选择要删除的数据" : `删除选中的 ${selectedIds.length} 项`}
                        className="flex items-center gap-2"
                    >
                        <Trash2 size={14} />
                        <span>批量删除</span>
                        {selectedIds.length > 0 && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">{selectedIds.length}</span>
                        )}
                    </Button>
                </Permission>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" onChange={handleSelectAll} checked={items.length > 0 && selectedIds.length === items.length} /></th>
                            <th className="px-4 py-4">ID</th>
                            <th className="px-4 py-4">集合名称</th>
                            <th className="px-4 py-4">别名</th>
                            <th className="px-4 py-4">描述</th>
                            <th className="px-4 py-4">来源</th>
                            <th className="px-4 py-4">类型</th>
                            <th className="px-4 py-4">已选字段</th>
                            <th className="px-4 py-4">关联规则</th>
                            <th className="px-4 py-4">创建人</th>
                            <th className="px-4 py-4">创建时间</th>
                            <th className="px-4 py-4">状态</th>
                            <th className="px-4 py-4">启用</th>
                            <th className="px-4 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={14} className="px-6 py-12 text-center text-slate-400">加载中...</td></tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className={cn("hover:bg-slate-50 transition-colors dark:hover:bg-slate-800", selectedIds.includes(item.id) && "bg-blue-50/50 dark:bg-blue-900/10")}>
                                <td className="px-4 py-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={selectedIds.includes(item.id)} onChange={() => handleSelectRow(item.id)} /></td>
                                <td className="px-4 py-4 text-xs font-mono text-slate-500">{item.id}</td>
                                <td className="px-4 py-4">
                                    <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <FileText size={14} className="text-slate-400" />
                                        {item.title}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="text-sm text-slate-700 dark:text-slate-300">{(item as any).alias || item.title}</div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="text-xs text-slate-500 truncate max-w-[150px]" title={(item as any).description}>{(item as any).description || '-'}</div>
                                </td>
                                <td className="px-4 py-4">
                                     <div className="text-xs text-slate-500 truncate max-w-[120px]" title={item.source}>{item.source}</div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5 text-xs font-medium">
                                        {item.isMultiTable ? <Layers size={14} className="text-purple-500"/> : <TableIcon size={14} className="text-blue-500"/>}
                                        {item.isMultiTable ? '多表' : '单表'}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1.5" title={item.selectedFields}>
                                        <CheckSquare size={14} className="text-slate-400" />
                                        <span className="text-xs text-slate-500 truncate max-w-[100px]">{item.selectedFields}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    {renderJoinRules(item.joinRules)}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1 text-xs">
                                        <UserIcon size={12} className="text-slate-400"/> {item.createdBy}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-xs font-mono text-slate-500">
                                    {formatDate(item.createdAt)}
                                </td>
                                <td className="px-4 py-4">
                                     <span className={cn(
                                         "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                         item.status === 'indexed' 
                                           ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                                           : item.status === 'error' 
                                             ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" 
                                             : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                     )}>
                                       {item.status === 'indexed' ? '已索引' : item.status === 'error' ? '错误' : '处理中'}
                                     </span>
                                </td>
                                <td className="px-4 py-4">
                                    <button onClick={() => handleToggleEnable(item)} className={cn("flex items-center text-xs hover:underline", item.isEnabled ? "text-green-600" : "text-slate-400")}>
                                        {item.isEnabled ? <ToggleRight size={20} className="mr-1"/> : <ToggleLeft size={20} className="mr-1"/>}
                                    </button>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {item.cronConfig?.enabled && (
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-1",
                                                item.cronConfig.syncMode === 'incremental'
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                            )}>
                                                {item.cronConfig.syncMode === 'incremental' ? '增量' : '全量'}
                                            </span>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => handleOpenSync(item)}
                                            className={cn("h-7 px-2", item.cronConfig?.enabled ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30" : "")}
                                            title={item.cronConfig?.enabled ? `定时任务开启中: ${item.cronConfig.expression}` : "配置定时同步"}
                                        >
                                            <CalendarClock size={12} className="mr-1" /> {item.cronConfig?.enabled ? '已启用' : '定时同步'}
                                        </Button>
                                        <Permission permissions={['vector:delete']}>
                                            <Button 
                                                size="sm" 
                                                variant="danger" 
                                                onClick={() => initDelete(item)}
                                                className="h-7 px-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                                                title="删除"
                                            >
                                                <Trash2 size={12} className="mr-1" /> 删除
                                            </Button>
                                        </Permission>
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

        {/* Wizard / Edit Modal */}
        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? `添加向量` : '编辑向量'}
            size={modalMode === 'create' ? 'full' : 'md'}
            footer={modalMode === 'edit' ? (
                <>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                    <Button onClick={handleSaveEdit}>保存</Button>
                </>
            ) : null}
        >
            {modalMode === 'edit' ? (
                <div className="space-y-5">
                    <Input label="向量标题" value={currentItem.title} onChange={(e) => setCurrentItem({...currentItem, title: e.target.value})} />
                    <Input label="ID" value={currentItem.id} disabled className="bg-slate-50 dark:bg-slate-800" />
                    <Input label="来源" value={currentItem.source} disabled className="bg-slate-50 dark:bg-slate-800" />
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                         <p>创建人: {currentItem.createdBy}</p>
                         <p>创建时间: {formatDate(currentItem.createdAt!)}</p>
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start"><span className="mr-2">⚠️</span> 为了保证数据一致性，仅允许修改标题。</div>
                </div>
            ) : (
                <div className="h-full w-full max-w-7xl mx-auto">
                   {/* Pass real databases and fetchers to wizard */}
                   <VectorWizard 
                        onFinish={handleWizardFinish}
                        onCancel={() => setIsModalOpen(false)}
                        databases={wizardDbs}
                        getTables={(dbId) => []} // Wizard will fetch via API internally or we should restructure Wizard to be async
                        getFields={(tableId) => []} // Same here
                   />
                </div>
            )}
        </Modal>

        {/* Sync, Delete Modals (unchanged logic mostly, just api calls above) */}
        {/* Sync Configuration Modal */}
        <Modal
            isOpen={isSyncModalOpen}
            onClose={() => setIsSyncModalOpen(false)}
            title="配置定时同步任务"
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setIsSyncModalOpen(false)}>取消</Button>
                    <Button variant="secondary" onClick={handleTriggerSync} isLoading={loading}>
                        立即同步
                    </Button>
                    <Button onClick={handleSaveSync} isLoading={loading}>
                        保存配置
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {currentSyncItem && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">最后同步时间</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {currentSyncItem.lastSyncAt ? formatDate(currentSyncItem.lastSyncAt) : '从未同步'}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">下次同步时间</p>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {syncForm.enabled && syncForm.expression ? (
                                    getNextCronRunTime(syncForm.expression) 
                                        ? formatDate(getNextCronRunTime(syncForm.expression)!.toISOString()) 
                                        : '表达式无效'
                                ) : '-'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                    <div>
                        <h4 className="font-medium text-slate-800 dark:text-white">启用定时同步</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">开启后，系统将按照配置的时间自动更新向量索引。</p>
                    </div>
                    <div 
                        className={cn(
                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out",
                            syncForm.enabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                        )}
                        onClick={() => setSyncForm({...syncForm, enabled: !syncForm.enabled})}
                    >
                        <div className={cn(
                            "w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200",
                            syncForm.enabled ? "translate-x-6" : "translate-x-0"
                        )} />
                    </div>
                </div>
                
                <div className={cn("transition-opacity duration-200", syncForm.enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                     <CronGenerator 
                        value={syncForm.expression}
                        onChange={(val) => setSyncForm({...syncForm, expression: val})}
                     />
                </div>

                <div className={cn("transition-opacity duration-200", syncForm.enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">同步模式</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSyncForm({...syncForm, syncMode: 'full'})}
                                    className={cn(
                                        "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                        syncForm.syncMode === 'full'
                                            ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                    )}
                                >
                                    全量同步
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSyncForm({...syncForm, syncMode: 'incremental'})}
                                    className={cn(
                                        "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                        syncForm.syncMode === 'incremental'
                                            ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                    )}
                                >
                                    增量同步
                                </button>
                            </div>
                        </div>

                        {syncForm.syncMode === 'incremental' && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    增量字段 <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={syncForm.incrementalField}
                                    onChange={(e) => setSyncForm({...syncForm, incrementalField: e.target.value})}
                                    placeholder="如: updated_at, id, create_time"
                                    className="dark:bg-slate-800 dark:border-slate-700"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                    请输入用于增量同步的字段名，系统将根据该字段的值判断数据是否需要更新
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs p-3 rounded-lg flex items-start">
                    <Info size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">同步说明：</p>
                        <ul className="list-disc pl-4 space-y-1 opacity-90">
                            <li>全量同步：每次同步时重新处理所有数据。</li>
                            <li>增量同步：仅同步数据源中指定字段值发生变化的数据行。</li>
                            <li>执行耗时：取决于数据变更量，建议避开业务高峰期。</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Modal>

        {/* Delete Verification Modal */}
        <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="确认删除"
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>取消</Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={userInputName !== deleteTargetName}>
                        确认删除
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-start text-sm dark:bg-red-900/20 dark:text-red-300">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>此操作将永久删除该向量集合及其所有索引数据，无法恢复。</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                        请输入集合名称 <span className="font-mono font-bold text-red-600">"{deleteTargetName}"</span> 以确认删除:
                    </label>
                    <Input 
                        value={userInputName}
                        onChange={(e) => setUserInputName(e.target.value)}
                        placeholder="输入集合名称"
                        className="font-mono"
                    />
                </div>
            </div>
        </Modal>

        {/* Batch Delete Confirmation Modal */}
        <Modal
            isOpen={isBatchDeleteModalOpen}
            onClose={() => setIsBatchDeleteModalOpen(false)}
            title="批量删除确认"
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setIsBatchDeleteModalOpen(false)}>取消</Button>
                    <Button variant="danger" onClick={confirmBatchDelete} disabled={batchDeleteConfirmText !== '我确认删除'}>
                        确认删除
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-start text-sm dark:bg-red-900/20 dark:text-red-300">
                    <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>此操作将永久删除选中的向量集合及其所有索引数据，无法恢复。</p>
                </div>
                <div className="text-center py-2">
                    <p className="text-slate-600 dark:text-slate-300">
                        确定要删除选中的 <span className="font-bold text-red-600 text-lg">{selectedIds.length}</span> 个向量集合吗？
                    </p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">
                        请输入 <span className="font-mono font-bold text-red-600">"我确认删除"</span> 以确认操作:
                    </label>
                    <Input 
                        value={batchDeleteConfirmText}
                        onChange={(e) => setBatchDeleteConfirmText(e.target.value)}
                        placeholder="我确认删除"
                        className="font-mono"
                    />
                </div>
            </div>
        </Modal>
    </div>
  );
};

// Simple Info Icon for the modal content
const Info = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);