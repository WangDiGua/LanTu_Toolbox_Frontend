import React, { useState, useEffect } from 'react';
import { Database, Table as TableIcon, CheckCircle2, ArrowRight, ArrowLeft, Loader2, CheckSquare, Square, Link as LinkIcon, AlertCircle, Plus, Trash2, Settings, ChevronDown, ChevronUp, Info, Cpu, Play, Minimize2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Pagination } from './Pagination';
import { cn, delay } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useStore } from '../store';
import { vectorApi, taskApi } from '../api';
import { DatabaseItem, TableItem, FieldItem } from '../types';

// --- Props ---
interface VectorWizardProps {
  onFinish: (data: any) => void;
  onCancel: () => void;
  databases: DatabaseItem[];
  getTables: (dbId: string) => TableItem[]; // Deprecated, now fetching internally
  getFields: (tableId: string) => FieldItem[]; // Deprecated
}

// Join Config Types
type JoinType = 'LEFT' | 'RIGHT' | 'INNER' | 'FULL';
type ConditionOperator = '=' | '!=' | '>' | '<' | '>=' | '<=';
type ConditionLogic = 'AND' | 'OR';

interface JoinCondition {
    leftFieldId: string;
    rightFieldId: string;
    operator: ConditionOperator;
}

interface TableJoin {
    id: string;
    leftTableId: string;
    rightTableId: string;
    joinType: JoinType;
    conditions: JoinCondition[];
    conditionLogic: ConditionLogic;
}

interface JoinConfig {
    baseTableId: string;
    joins: TableJoin[];
}

// New: Advanced Config Types
interface AdvancedConfig {
    indexType: 'HNSW' | 'IVF_FLAT' | 'FLAT';
    metric: 'COSINE' | 'L2' | 'IP';
    dimensions: number;
}

export const VectorWizard: React.FC<VectorWizardProps> = ({ 
    onFinish, 
    onCancel, 
    databases, 
    // getTables, // Not used
    // getFields 
}) => {
  const { error: toastError, info: toastInfo } = useToast();
  const { dispatch } = useStore();
  
  // Wizard State
  const [step, setStep] = useState(0); 
  const [data, setData] = useState({
      title: '',
      alias: '',
      description: '',
      dbId: '',
      tableIds: [] as string[],
      fieldKeys: [] as string[] 
  });
  
  // Async Data State
  const [tables, setTables] = useState<TableItem[]>([]);
  const [fieldsMap, setFieldsMap] = useState<Record<string, FieldItem[]>>({});
  const [primaryKeysMap, setPrimaryKeysMap] = useState<Record<string, string>>({});
  const [fetchingTables, setFetchingTables] = useState(false);
  const [fetchingFields, setFetchingFields] = useState(false);
  const [checkingPrimaryKeys, setCheckingPrimaryKeys] = useState(false);

  // Feature States
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [joinConfig, setJoinConfig] = useState<JoinConfig>({
      baseTableId: '',
      joins: []
  });

  // Advanced Config State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedConfig>({
      indexType: 'HNSW',
      metric: 'COSINE',
      dimensions: 512
  });

  // Pagination State
  const [dbPage, setDbPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [progress, setProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'completed'>('idle');

  // --- Helpers & Logic ---

  // Fetch Tables when DB changes
  useEffect(() => {
      if (data.dbId) {
          setFetchingTables(true);
          vectorApi.getTables(data.dbId).then(res => {
              if (res.code === 200) {
                  const tableData = (res.data as any[]).map((t: any, index: number) => ({
                      id: t.tableName || t.id || String(index + 1),
                      name: t.tableName || t.name,
                      rows: t.tableRows || t.rows || 0,
                      hasPrimaryKey: t.hasPrimaryKey ?? true,
                      comment: t.tableComment || t.comment || '',
                      engine: t.engine || '',
                      type: t.tableType || t.type || ''
                  }));
                  setTables(tableData);
              }
          }).finally(() => setFetchingTables(false));
      } else {
          setTables([]);
      }
  }, [data.dbId]);

  // Fetch Fields for selected tables
  useEffect(() => {
      const fetchFields = async () => {
          const newTables = data.tableIds.filter(tid => !fieldsMap[tid]);
          if (newTables.length > 0 && data.dbId) {
              setFetchingFields(true);
              const newFieldsMap = { ...fieldsMap };
              for (const tid of newTables) {
                  try {
                      const res = await vectorApi.getFields(data.dbId, tid);
                      if(res.code === 200) {
                          const fieldData = (res.data as any[]).map((f: any, index: number) => ({
                              id: f.columnName || f.id || String(index + 1),
                              name: f.columnName || f.name,
                              type: f.dataType || f.type || 'unknown',
                              isPrimaryKey: f.isPrimaryKey ?? false
                          }));
                          newFieldsMap[tid] = fieldData;
                      }
                  } catch (e) {}
              }
              setFieldsMap(newFieldsMap);
              setFetchingFields(false);
          }
      };
      fetchFields();
  }, [data.tableIds, data.dbId]);

  const checkNameAndProceed = async () => {
      if (!data.title || data.title.trim() === '') {
          toastError('请输入集合名称');
          return;
      }
      
      if (!data.alias || data.alias.trim() === '') {
          toastError('请输入别名');
          return;
      }
      
      const nameRegex = /^[a-zA-Z0-9_]+$/;
      if (!nameRegex.test(data.title)) {
          toastError('名称格式错误：仅允许输入英文字母、数字和下划线');
          return;
      }

      if (/^\d+$/.test(data.title)) {
          toastError('集合名称不能为纯数字');
          return;
      }

      setIsCheckingName(true);
      try {
          const res = await vectorApi.checkName(data.title);
          if (res.code === 200) {
              if (res.data && res.data.exists) {
                  toastError('该向量集名称已存在，请更换');
                  return;
              }
              setStep(1);
          } else {
              toastError(res.message || '校验失败');
          }
      } catch (e: any) {
          toastError(e.message || '校验失败');
      } finally {
          setIsCheckingName(false);
      }
  };

  const handleNextStep = () => {
      if (step === 0) {
          checkNameAndProceed();
      } else if (step === 1) {
          checkPrimaryKeysAndProceed();
      } else if (step === 2) {
          if (data.tableIds.length > 1) {
              if (!joinConfig.leftTableId && data.tableIds.length >= 2) {
                  setJoinConfig(prev => ({
                      ...prev,
                      leftTableId: data.tableIds[0],
                      rightTableId: data.tableIds[1]
                  }));
              }
              setStep(3);
          } else {
              setStep(4);
          }
      } else {
          setStep(prev => prev + 1);
      }
  };

  const checkPrimaryKeysAndProceed = async () => {
      if (!data.dbId || data.tableIds.length === 0) {
          toastError('请先选择数据库和数据表');
          return;
      }
      
      setCheckingPrimaryKeys(true);
      try {
          const res = await vectorApi.getPrimaryKeys(data.dbId, data.tableIds);
          if (res.code === 200) {
              const pkMap = res.data as Record<string, { columnName: string; dataType: string } | null>;
              const tablesWithoutPK: string[] = [];
              const newPkMap: Record<string, string> = {};
              
              for (const tableId of data.tableIds) {
                  const pkInfo = pkMap[tableId];
                  if (!pkInfo || !pkInfo.columnName) {
                      tablesWithoutPK.push(tableId);
                  } else {
                      newPkMap[tableId] = pkInfo.columnName;
                  }
              }
              
              if (tablesWithoutPK.length > 0) {
                  toastError(`以下表没有主键，无法进行向量化：${tablesWithoutPK.join(', ')}`);
                  setCheckingPrimaryKeys(false);
                  return;
              }
              
              setPrimaryKeysMap(newPkMap);
              
              const initialFieldKeys: string[] = [];
              data.tableIds.forEach(tableId => {
                  const pkField = newPkMap[tableId];
                  if (pkField) {
                      initialFieldKeys.push(`${tableId}:${pkField}`);
                  }
              });
              setData(prev => ({ ...prev, fieldKeys: initialFieldKeys }));
              
              setStep(2);
          } else {
              toastError(res.message || '主键查询失败');
          }
      } catch (e: any) {
          toastError(e.message || '主键查询失败');
      } finally {
          setCheckingPrimaryKeys(false);
      }
  };

  const handlePrevStep = () => {
      if (step === 4) {
          if (data.tableIds.length > 1) setStep(3);
          else setStep(2);
      } else {
          setStep(prev => prev - 1);
      }
  };

  const startVectorization = async () => {
    setProcessStatus('processing');
    
    try {
      const joinConfigData = data.tableIds.length > 1 && joinConfig.joins.length > 0 ? {
        baseTableId: joinConfig.baseTableId,
        joins: joinConfig.joins.map(j => ({
          id: j.id,
          leftTableId: j.leftTableId,
          rightTableId: j.rightTableId,
          joinType: j.joinType,
          conditionLogic: j.conditionLogic,
          conditions: j.conditions.map(c => ({
            leftFieldId: c.leftFieldId,
            rightFieldId: c.rightFieldId,
            operator: c.operator
          }))
        }))
      } : null;
      
      const vectorData = {
        title: data.title,
        alias: data.alias,
        description: data.description,
        collectionName: data.title,
        dbId: data.dbId,
        tableIds: data.tableIds,
        fieldKeys: data.fieldKeys,
        primaryKeys: primaryKeysMap,
        joinConfig: joinConfigData,
        advancedConfig: {
          indexType: advancedConfig.indexType,
          metric: advancedConfig.metric,
          dimensions: advancedConfig.dimensions
        }
      };
      
      const res = await vectorApi.create(vectorData);
      
      if (res.code === 200) {
        toastInfo('向量创建任务已提交，正在后台处理...');
        setProcessStatus('completed');
      } else {
        toastError(res.message || '向量化启动失败');
        setProcessStatus('idle');
      }
    } catch (e: any) {
      toastError(e.message || '向量化启动失败');
      setProcessStatus('idle');
    }
  };

  const handleRunInBackground = () => {
      onCancel();
  };

  const handleFinish = () => {
      onCancel();
  };

  // --- Renders ---

  const renderStep0 = () => (
      <div className="flex flex-col justify-center items-center h-full">
          <div className="w-full max-w-md space-y-4">
            <h3 className="text-xl font-medium text-slate-800 mb-6 text-center">首先，请为向量集命名</h3>
            <Input 
                label="向量集合标识" 
                placeholder="例如：product_kb_v1" 
                value={data.title}
                onChange={(e) => setData({...data, title: e.target.value})}
                autoFocus
                className="text-lg py-3 font-mono"
            />
            <Input 
                label="别名" 
                placeholder="请输入别名（不超过20字）" 
                value={data.alias}
                onChange={(e) => {
                    if (e.target.value.length <= 20) {
                        setData({...data, alias: e.target.value});
                    }
                }}
                maxLength={20}
            />
            <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">描述 <span className="text-slate-400 font-normal">(选填)</span></label>
                <textarea 
                    placeholder="请输入描述（不超过50字）" 
                    value={data.description}
                    onChange={(e) => {
                        if (e.target.value.length <= 50) {
                            setData({...data, description: e.target.value});
                        }
                    }}
                    maxLength={50}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                />
                <div className="text-xs text-slate-400 text-right">{data.description.length}/50</div>
            </div>
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex items-start">
                <AlertCircle size={14} className="mr-2 mt-0.5 shrink-0" />
                <span>命名规范：仅允许使用英文字母、数字和下划线。系统将自动检查名称唯一性。</span>
            </div>
          </div>
      </div>
  );

  const renderStep1 = () => {
    const dbStartIndex = (dbPage - 1) * ITEMS_PER_PAGE;
    const currentDbs = databases.slice(dbStartIndex, dbStartIndex + ITEMS_PER_PAGE);
    const totalDbPages = Math.ceil(databases.length / ITEMS_PER_PAGE);

    // Use fetched tables
    const tableStartIndex = (tablePage - 1) * ITEMS_PER_PAGE;
    const currentTables = tables.slice(tableStartIndex, tableStartIndex + ITEMS_PER_PAGE);
    const totalTablePages = Math.ceil(tables.length / ITEMS_PER_PAGE);

    const toggleTable = (tbl: TableItem) => {
        // Requirement: Check Primary Key
        if (tbl.hasPrimaryKey === false) {
            toastError(`表 ${tbl.name} 没有主键，无法选择`);
            return;
        }

        setData(prev => {
            const isSelected = prev.tableIds.includes(tbl.id);
            const newTableIds = isSelected 
                ? prev.tableIds.filter(tid => tid !== tbl.id)
                : [...prev.tableIds, tbl.id];
            return { ...prev, tableIds: newTableIds, fieldKeys: [] }; 
        });
    };

    return (
        <div className="grid grid-cols-2 gap-8 h-full">
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
                    <span>1. 选择数据库 (单选)</span>
                    <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{databases.length} 个</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {currentDbs.map(db => (
                        <div 
                            key={db.id}
                            onClick={() => {
                                if (data.dbId !== db.id) {
                                    setData({...data, dbId: db.id, tableIds: [], fieldKeys: []});
                                    setTablePage(1);
                                }
                            }}
                            className={cn(
                                "flex items-center p-4 rounded-lg cursor-pointer transition-all border",
                                data.dbId === db.id 
                                    ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm ring-1 ring-blue-100" 
                                    : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600"
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0", 
                                data.dbId === db.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                            )}>
                                <Database size={20} />
                            </div>
                            <div>
                                <div className="font-medium">{db.name}</div>
                                <div className="text-xs opacity-70 uppercase mt-0.5">{db.type}</div>
                            </div>
                            {data.dbId === db.id && <CheckCircle2 size={20} className="ml-auto text-blue-600" />}
                        </div>
                    ))}
                </div>
                <div className="border-t border-slate-200 bg-slate-50">
                    <Pagination currentPage={dbPage} totalPages={totalDbPages} onPageChange={setDbPage} className="py-2" />
                </div>
            </div>

            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 font-semibold text-slate-700 flex justify-between items-center">
                    <span>2. 选择数据表 (多选)</span>
                    {data.dbId && <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{tables.length} 个</span>}
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {!data.dbId ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Database size={48} className="mb-4 text-slate-200" />
                            <p>请先从左侧选择一个数据库</p>
                        </div>
                    ) : fetchingTables ? (
                        <div className="h-full flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2"/>加载中...</div>
                    ) : (
                        currentTables.length > 0 ? currentTables.map(tbl => {
                            const isSelected = data.tableIds.includes(tbl.id);
                            return (
                                <div 
                                    key={tbl.id}
                                    onClick={() => toggleTable(tbl)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border",
                                        isSelected
                                            ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm ring-1 ring-blue-100" 
                                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600"
                                    )}
                                >
                                    <div className="flex items-center flex-1 min-w-0">
                                        <div className={cn("mr-3 transition-colors shrink-0", isSelected ? "text-blue-600" : "text-slate-400")}>
                                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </div>
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0", 
                                            isSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                        )}>
                                            <TableIcon size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{tbl.name}</div>
                                            {tbl.comment && (
                                                <div className="text-xs text-slate-400 truncate mt-0.5">{tbl.comment}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        {tbl.engine && (
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{tbl.engine}</span>
                                        )}
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{tbl.rows?.toLocaleString() || 0} 行</span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="h-full flex items-center justify-center text-slate-400">该数据库暂无数据表</div>
                        )
                    )}
                </div>
                {data.dbId && tables.length > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50">
                        <Pagination currentPage={tablePage} totalPages={totalTablePages} onPageChange={setTablePage} className="py-2" />
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderStep2 = () => {
    const selectedTables = tables.filter(t => data.tableIds.includes(t.id));
    
    const toggleField = (tableId: string, fieldId: string) => {
        const key = `${tableId}:${fieldId}`;
        const isPrimaryKey = primaryKeysMap[tableId] === fieldId;
        
        if (isPrimaryKey) {
            return;
        }
        
        const newKeys = data.fieldKeys.includes(key) 
            ? data.fieldKeys.filter(k => k !== key) 
            : [...data.fieldKeys, key];
        setData({...data, fieldKeys: newKeys});
    };
    
    const totalFieldsCount = selectedTables.reduce((acc, t) => acc + (fieldsMap[t.id]?.length || 0), 0);
    const selectableFieldsCount = selectedTables.reduce((acc, t) => {
        const pkField = primaryKeysMap[t.id];
        const fields = fieldsMap[t.id] || [];
        return acc + fields.filter(f => f.id !== pkField).length;
    }, 0);
    const isAllSelected = selectableFieldsCount > 0 && data.fieldKeys.length === totalFieldsCount;

    const toggleAll = () => {
        if (isAllSelected) {
            const pkKeys: string[] = [];
            selectedTables.forEach(t => {
                const pkField = primaryKeysMap[t.id];
                if (pkField) pkKeys.push(`${t.id}:${pkField}`);
            });
            setData({...data, fieldKeys: pkKeys});
        } else {
            const allKeys: string[] = [];
            selectedTables.forEach(t => fieldsMap[t.id]?.forEach(f => allKeys.push(`${t.id}:${f.id}`)));
            setData({...data, fieldKeys: allKeys});
        }
    };

    return (
      <div className="h-full flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="font-semibold text-slate-700">勾选需要向量化的字段 (已选 {data.fieldKeys.length})</span>
                <button onClick={toggleAll} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                    {isAllSelected ? '取消全选' : '全选所有字段'}
                </button>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar">
               {selectedTables.length === 0 ? (
                   <div className="flex items-center justify-center h-full text-slate-400">未选择数据表</div>
               ) : fetchingFields ? (
                   <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mr-2"/>加载字段中...</div>
               ) : (
                   <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100 sticky top-0 backdrop-blur-sm z-10">
                           <tr>
                               <th className="px-6 py-3 w-16">选择</th>
                               <th className="px-6 py-3">字段名称</th>
                               <th className="px-6 py-3">数据类型</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                           {selectedTables.map((table) => {
                               const tableFields = fieldsMap[table.id] || [];
                               const pkField = primaryKeysMap[table.id];
                               if (tableFields.length === 0) return null;
                               return (
                                   <React.Fragment key={table.id}>
                                        <tr className="bg-slate-100/60">
                                            <td colSpan={3} className="px-6 py-2 font-semibold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                                <TableIcon size={12} /> {table.name}
                                            </td>
                                        </tr>
                                        {tableFields.map(field => {
                                            const key = `${table.id}:${field.id}`;
                                            const isChecked = data.fieldKeys.includes(key);
                                            const isPrimaryKey = pkField === field.id;
                                            return (
                                                <tr 
                                                    key={key} 
                                                    onClick={() => toggleField(table.id, field.id)}
                                                    className={cn(
                                                        "transition-colors",
                                                        isPrimaryKey ? "bg-amber-50/50 cursor-default" : "hover:bg-slate-50 cursor-pointer",
                                                        isChecked && !isPrimaryKey && "bg-blue-50/30"
                                                    )}
                                                >
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="checkbox" 
                                                            className={cn(
                                                                "rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4",
                                                                isPrimaryKey ? "cursor-not-allowed bg-amber-100 border-amber-300 text-amber-600" : "cursor-pointer"
                                                            )}
                                                            checked={isChecked}
                                                            disabled={isPrimaryKey}
                                                            onChange={() => toggleField(table.id, field.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            {field.name}
                                                            {isPrimaryKey && (
                                                                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-normal">主键</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                        <span className="bg-slate-100/50 rounded px-2 py-1">{field.type}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                   </React.Fragment>
                               );
                           })}
                       </tbody>
                   </table>
               )}
           </div>
      </div>
    );
  };

  const renderStep3 = () => {
      const selectedTables = tables.filter(t => data.tableIds.includes(t.id));
      
      const generateJoinId = () => `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const getTableFields = (tableId: string) => {
          return tableId ? (fieldsMap[tableId] || []) : [];
      };
      
      const getTableName = (tableId: string) => {
          const table = selectedTables.find(t => t.id === tableId);
          return table?.name || '未知表';
      };
      
      const getAvailableTablesForJoin = (excludeIds: string[]) => {
          return selectedTables.filter(t => !excludeIds.includes(t.id));
      };
      
      const getConnectedTableIds = () => {
          const connected = new Set<string>();
          if (joinConfig.baseTableId) {
              connected.add(joinConfig.baseTableId);
          }
          joinConfig.joins.forEach(j => {
              connected.add(j.leftTableId);
              connected.add(j.rightTableId);
          });
          return Array.from(connected);
      };
      
      const addJoin = () => {
          const connectedIds = getConnectedTableIds();
          const newJoin: TableJoin = {
              id: generateJoinId(),
              leftTableId: joinConfig.baseTableId || connectedIds[0] || '',
              rightTableId: '',
              joinType: 'LEFT',
              conditions: [{ leftFieldId: '', rightFieldId: '', operator: '=' }],
              conditionLogic: 'AND'
          };
          setJoinConfig(prev => ({
              ...prev,
              joins: [...prev.joins, newJoin]
          }));
      };
      
      const removeJoin = (joinId: string) => {
          setJoinConfig(prev => ({
              ...prev,
              joins: prev.joins.filter(j => j.id !== joinId)
          }));
      };
      
      const updateJoin = (joinId: string, updates: Partial<TableJoin>) => {
          setJoinConfig(prev => ({
              ...prev,
              joins: prev.joins.map(j => 
                  j.id === joinId ? { ...j, ...updates } : j
              )
          }));
      };
      
      const addCondition = (joinId: string) => {
          setJoinConfig(prev => ({
              ...prev,
              joins: prev.joins.map(j => 
                  j.id === joinId 
                      ? { ...j, conditions: [...j.conditions, { leftFieldId: '', rightFieldId: '', operator: '=' }] }
                      : j
              )
          }));
      };
      
      const removeCondition = (joinId: string, conditionIndex: number) => {
          setJoinConfig(prev => ({
              ...prev,
              joins: prev.joins.map(j => 
                  j.id === joinId 
                      ? { ...j, conditions: j.conditions.filter((_, i) => i !== conditionIndex) }
                      : j
              )
          }));
      };
      
      const updateCondition = (joinId: string, conditionIndex: number, updates: Partial<JoinCondition>) => {
          setJoinConfig(prev => ({
              ...prev,
              joins: prev.joins.map(j => 
                  j.id === joinId 
                      ? { 
                          ...j, 
                          conditions: j.conditions.map((c, i) => 
                              i === conditionIndex ? { ...c, ...updates } : c
                          )
                      }
                      : j
              )
          }));
      };
      
      const getJoinTypeIcon = (type: JoinType) => {
          switch (type) {
              case 'LEFT': return '⟕';
              case 'RIGHT': return '⟖';
              case 'INNER': return '⟗';
              case 'FULL': return '⟗';
              default: return '⟕';
          }
      };
      
      const getJoinTypeLabel = (type: JoinType) => {
          switch (type) {
              case 'LEFT': return '左关联 (LEFT JOIN)';
              case 'RIGHT': return '右关联 (RIGHT JOIN)';
              case 'INNER': return '内连接 (INNER JOIN)';
              case 'FULL': return '全连接 (FULL JOIN)';
              default: return '左关联';
          }
      };

      return (
        <div className="flex flex-col items-center py-6 max-w-5xl mx-auto">
            <h3 className="text-xl font-medium text-slate-800 mb-2 text-center dark:text-white">多表关联规则配置</h3>
            <p className="text-slate-500 mb-6 text-center text-sm">定义表之间的连接方式，支持左关联、右关联、内连接等多种关联类型。</p>
            
            <div className="w-full space-y-6">
                {/* Step 1: Select Base Table */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">1</div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">选择主表（基表）</label>
                    </div>
                    <Select 
                        value={joinConfig.baseTableId}
                        onChange={(val) => setJoinConfig({ ...joinConfig, baseTableId: val as string, joins: [] })}
                        placeholder="请选择主表"
                        options={selectedTables.map(t => ({ label: t.name, value: t.id }))}
                    />
                    <p className="text-xs text-slate-400 mt-2">主表是关联查询的起点，其他表将围绕主表进行关联</p>
                </div>
                
                {/* Step 2: Define Joins */}
                {joinConfig.baseTableId && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">2</div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">定义表关联关系</label>
                            </div>
                            <Button size="sm" variant="secondary" onClick={addJoin}>
                                <Plus size={14} className="mr-1"/> 添加关联
                            </Button>
                        </div>
                        
                        {/* Join Cards */}
                        <div className="space-y-4">
                            {joinConfig.joins.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg dark:border-slate-700">
                                    <LinkIcon size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">点击"添加关联"开始配置表关联</p>
                                    <p className="text-xs mt-1">支持多个表之间的复杂关联关系</p>
                                </div>
                            ) : (
                                joinConfig.joins.map((join, joinIndex) => {
                                    const leftFields = getTableFields(join.leftTableId);
                                    const rightFields = getTableFields(join.rightTableId);
                                    const connectedIds = getConnectedTableIds();
                                    const availableRightTables = getAvailableTablesForJoin([]);
                                    
                                    return (
                                        <div key={join.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-400 bg-slate-200 px-2 py-0.5 rounded dark:bg-slate-700">关联 {joinIndex + 1}</span>
                                                    <span className="text-lg" title={getJoinTypeLabel(join.joinType)}>{getJoinTypeIcon(join.joinType)}</span>
                                                </div>
                                                <button 
                                                    onClick={() => removeJoin(join.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            
                                            {/* Join Type Selection */}
                                            <div className="grid grid-cols-4 gap-2 mb-4">
                                                {(['LEFT', 'RIGHT', 'INNER', 'FULL'] as JoinType[]).map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => updateJoin(join.id, { joinType: type })}
                                                        className={cn(
                                                            "px-2 py-2 text-xs rounded-lg border transition-all text-center",
                                                            join.joinType === type 
                                                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                                                                : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:text-slate-400"
                                                        )}
                                                    >
                                                        <span className="text-base block mb-0.5">{getJoinTypeIcon(type)}</span>
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            {/* Table Selection */}
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 mb-1 block dark:text-slate-400">左表</label>
                                                    <Select 
                                                        value={join.leftTableId}
                                                        onChange={(val) => updateJoin(join.id, { 
                                                            leftTableId: val as string,
                                                            conditions: [{ leftFieldId: '', rightFieldId: '', operator: '=' }]
                                                        })}
                                                        options={connectedIds.map(id => ({ 
                                                            label: getTableName(id), 
                                                            value: id 
                                                        }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 mb-1 block dark:text-slate-400">右表（待关联表）</label>
                                                    <Select 
                                                        value={join.rightTableId}
                                                        onChange={(val) => updateJoin(join.id, { 
                                                            rightTableId: val as string,
                                                            conditions: [{ leftFieldId: '', rightFieldId: '', operator: '=' }]
                                                        })}
                                                        options={[
                                                            { label: '请选择', value: '' },
                                                            ...availableRightTables.map(t => ({ 
                                                                label: t.name, 
                                                                value: t.id 
                                                            }))
                                                        ]}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Join Conditions */}
                                            {join.leftTableId && join.rightTableId && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs text-slate-500 dark:text-slate-400">关联条件</label>
                                                        <div className="flex items-center gap-2">
                                                            {join.conditions.length > 1 && (
                                                                <select
                                                                    value={join.conditionLogic}
                                                                    onChange={(e) => updateJoin(join.id, { conditionLogic: e.target.value as ConditionLogic })}
                                                                    className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                                                                >
                                                                    <option value="AND">AND</option>
                                                                    <option value="OR">OR</option>
                                                                </select>
                                                            )}
                                                            <button 
                                                                onClick={() => addCondition(join.id)}
                                                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                                                            >
                                                                <Plus size={12} className="mr-0.5" /> 添加条件
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        {join.conditions.map((cond, condIndex) => (
                                                            <div key={condIndex} className="flex items-center gap-2">
                                                                {condIndex > 0 && (
                                                                    <span className="text-xs text-slate-400 w-8 text-center">
                                                                        {join.conditionLogic}
                                                                    </span>
                                                                )}
                                                                <div className="flex-1">
                                                                    <Select 
                                                                        value={cond.leftFieldId}
                                                                        onChange={(val) => updateCondition(join.id, condIndex, { leftFieldId: val as string })}
                                                                        placeholder="左表字段"
                                                                        options={leftFields.map(f => ({ 
                                                                            label: `${f.name} (${f.type})`, 
                                                                            value: f.id 
                                                                        }))}
                                                                    />
                                                                </div>
                                                                <select
                                                                    value={cond.operator}
                                                                    onChange={(e) => updateCondition(join.id, condIndex, { operator: e.target.value as ConditionOperator })}
                                                                    className="w-16 text-sm border border-slate-200 rounded px-1.5 py-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
                                                                >
                                                                    <option value="=">=</option>
                                                                    <option value="!=">≠</option>
                                                                    <option value=">">&gt;</option>
                                                                    <option value="<">&lt;</option>
                                                                    <option value=">=">≥</option>
                                                                    <option value="<=">≤</option>
                                                                </select>
                                                                <div className="flex-1">
                                                                    <Select 
                                                                        value={cond.rightFieldId}
                                                                        onChange={(val) => updateCondition(join.id, condIndex, { rightFieldId: val as string })}
                                                                        placeholder="右表字段"
                                                                        options={rightFields.map(f => ({ 
                                                                            label: `${f.name} (${f.type})`, 
                                                                            value: f.id 
                                                                        }))}
                                                                    />
                                                                </div>
                                                                {join.conditions.length > 1 && (
                                                                    <button 
                                                                        onClick={() => removeCondition(join.id, condIndex)}
                                                                        className="text-slate-400 hover:text-red-500"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {/* Join Preview */}
                        {joinConfig.joins.length > 0 && (
                            <div className="mt-4 p-3 bg-slate-100 rounded-lg dark:bg-slate-900">
                                <div className="text-xs text-slate-500 mb-2 dark:text-slate-400">关联预览</div>
                                <div className="font-mono text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
                                    {getTableName(joinConfig.baseTableId)}
                                    {joinConfig.joins.map(join => {
                                        const conditions = join.conditions
                                            .map(c => {
                                                const leftField = getTableFields(join.leftTableId).find(f => f.id === c.leftFieldId);
                                                const rightField = getTableFields(join.rightTableId).find(f => f.id === c.rightFieldId);
                                                return leftField && rightField 
                                                    ? `${leftField.name} ${c.operator} ${rightField.name}` 
                                                    : null;
                                            })
                                            .filter(Boolean)
                                            .join(` ${join.conditionLogic} `);
                                        
                                        return (
                                            <span key={join.id}>
                                                <br />
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    {join.joinType === 'LEFT' ? 'LEFT JOIN' : 
                                                     join.joinType === 'RIGHT' ? 'RIGHT JOIN' :
                                                     join.joinType === 'INNER' ? 'INNER JOIN' : 'FULL JOIN'}
                                                </span>
                                                {' '}{getTableName(join.rightTableId)}
                                                {conditions && <span className="text-slate-500"> ON {conditions}</span>}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Help Info */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <p><strong>左关联 (LEFT JOIN):</strong> 返回左表所有记录，右表无匹配则为 NULL</p>
                            <p><strong>右关联 (RIGHT JOIN):</strong> 返回右表所有记录，左表无匹配则为 NULL</p>
                            <p><strong>内连接 (INNER JOIN):</strong> 只返回两表都有匹配的记录</p>
                            <p><strong>全连接 (FULL JOIN):</strong> 返回两表所有记录，无匹配则为 NULL</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const renderStep4 = () => (
      <div className="flex flex-col items-center justify-center text-center px-8 py-8">
          {processStatus === 'idle' && (
              <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="max-w-lg w-full py-8">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600 ring-8 ring-blue-50/50">
                      <Database size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">{data.title}</h3>
                  <div className="bg-slate-50 rounded-xl p-6 mb-6 text-left border border-slate-100 space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">来源数据库:</span> <span className="font-medium text-slate-800">{databases.find(d => d.id === data.dbId)?.name}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">来源数据表:</span> <span className="font-medium text-slate-800">{data.tableIds.length} 个表</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">包含字段总数:</span> <span className="font-medium text-blue-600">{data.fieldKeys.length} 个</span></div>
                      {/* Show Join Info if applicable */}
                      {data.tableIds.length > 1 && joinConfig.joins.length > 0 && (
                          <div className="border-t border-slate-200 pt-3 mt-3">
                              <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">关联数量:</span> <span className="font-medium text-slate-800">{joinConfig.joins.length} 个关联</span></div>
                              <div className="text-xs text-slate-400">
                                  {joinConfig.joins.map((join, i) => {
                                      const leftTableName = tables.find(t => t.id === join.leftTableId)?.name || '未知表';
                                      const rightTableName = tables.find(t => t.id === join.rightTableId)?.name || '未知表';
                                      const joinTypeLabel = join.joinType === 'LEFT' ? '左关联' : 
                                                           join.joinType === 'RIGHT' ? '右关联' :
                                                           join.joinType === 'INNER' ? '内连接' : '全连接';
                                      return (
                                          <div key={i} className="truncate mt-1">
                                               🔗 {leftTableName} {joinTypeLabel} {rightTableName}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      )}
                  </div>
                  
                  {/* Advanced Config Section */}
                  <div className="mb-8 w-full border-t border-slate-100 pt-4">
                      <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center justify-center w-full py-2 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                      >
                          <Settings size={14} className="mr-1.5" /> 高级配置
                          {showAdvanced ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                      </button>
                      
                      <AnimatePresence>
                          {showAdvanced && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                  <div className="bg-slate-50 rounded-xl p-5 mt-2 border border-slate-100 text-left space-y-4 shadow-inner">
                                      {/* Index Type */}
                                      <div>
                                          <Select 
                                              label="选择索引类型"
                                              value={advancedConfig.indexType}
                                              onChange={(val) => setAdvancedConfig({...advancedConfig, indexType: val as any})}
                                              options={[
                                                  { label: 'HNSW (高精度，快速)', value: 'HNSW' },
                                                  { label: 'IVF_FLAT (低内存)', value: 'IVF_FLAT' },
                                                  { label: 'FLAT (无索引)', value: 'FLAT' },
                                              ]}
                                          />
                                      </div>

                                      {/* Metric Type */}
                                      <div>
                                          <Select 
                                              label="距离度量方式"
                                              value={advancedConfig.metric}
                                              onChange={(val) => setAdvancedConfig({...advancedConfig, metric: val as any})}
                                              options={[
                                                  { label: 'Cosine Similarity (余弦相似度)', value: 'COSINE' },
                                                  { label: 'Euclidean Distance (欧式距离)', value: 'L2' },
                                                  { label: 'Inner Product (内积)', value: 'IP' },
                                              ]}
                                          />
                                      </div>

                                      {/* Dimensions */}
                                      <div>
                                          <Input 
                                              label="向量维度"
                                              type="number"
                                              value={advancedConfig.dimensions}
                                              onChange={(e) => setAdvancedConfig({...advancedConfig, dimensions: parseInt(e.target.value) || 512})}
                                              placeholder="512"
                                          />
                                          <p className="mt-1 text-xs text-slate-500">默认 512 维，推荐配置</p>
                                      </div>
                                  </div>
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>

                  <Button size="lg" onClick={startVectorization} className="w-full h-12 text-lg shadow-lg shadow-blue-500/20">
                      <Play size={18} className="mr-2 fill-current" />
                      确认并开始转换
                  </Button>
              </motion.div>
          )}
          {processStatus === 'processing' && (
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="w-full max-w-md">
                   <div className="mb-8"><Loader2 size={64} className="mx-auto text-blue-600 animate-spin" /></div>
                   <h3 className="text-xl font-semibold text-slate-800 mb-2">正在进行向量化处理...</h3>
                   <div className="w-full bg-slate-100 rounded-full h-4 mb-6 overflow-hidden">
                       <motion.div className="bg-blue-600 h-4 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
                   </div>
                   
                   {/* Background Run Button */}
                   <Button variant="secondary" onClick={handleRunInBackground} className="w-full">
                       <Minimize2 size={16} className="mr-2" />
                       转入后台运行
                   </Button>
                   <p className="text-xs text-slate-400 mt-2">您可以关闭窗口，任务将在控制台继续运行。</p>
              </motion.div>
          )}
          {processStatus === 'completed' && (
              <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}>
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 ring-8 ring-green-50/50">
                      <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">处理完成！</h3>
                  <Button size="lg" variant="secondary" onClick={handleFinish} className="w-48 border-green-200 hover:bg-green-50 text-green-700">
                      关闭
                  </Button>
              </motion.div>
          )}
      </div>
  );

  return (
    <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-hidden">
             <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="h-full overflow-hidden">
                    <div className="h-full overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
                        {step === 0 && renderStep0()}
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                        {step === 4 && renderStep4()}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Footer */}
        {processStatus !== 'completed' && (
            <div className="flex justify-between w-full items-center mt-6 pt-4 border-t border-slate-100">
                <div className="flex space-x-2">
                    {[0, 1, 2, 3, 4].map(s => {
                        if (s === 3 && data.tableIds.length <= 1) return null;
                        return (
                             <div key={s} className={cn("w-2.5 h-2.5 rounded-full transition-colors", step >= s ? "bg-blue-600" : "bg-slate-200")} />
                        );
                    })}
                    <span className="ml-2 text-sm text-slate-400">
                        {step === 0 ? 'Start' : step === 4 ? 'Confirm' : `Step ${step}`}
                    </span>
                </div>

                <div className="flex gap-3">
                    {/* Hide cancel button during processing to force user to use the specific buttons */}
                    {processStatus === 'idle' && step === 0 ? (
                        <Button variant="secondary" onClick={onCancel}>取消</Button>
                    ) : (
                        processStatus === 'idle' && <Button variant="secondary" onClick={handlePrevStep}>
                            <ArrowLeft size={16} className="mr-2" /> 上一步
                        </Button>
                    )}
                    
                    {step < 4 && (
                        <Button 
                            onClick={handleNextStep}
                            isLoading={isCheckingName || checkingPrimaryKeys}
                            disabled={
                                (step === 0 && !data.title) ||
                                (step === 1 && data.tableIds.length === 0) ||
                                (step === 2 && data.fieldKeys.length === 0) ||
                                (step === 3 && data.tableIds.length > 1 && joinConfig.joins.some(j => 
                                    !j.leftTableId || 
                                    !j.rightTableId || 
                                    j.conditions.some(c => !c.leftFieldId || !c.rightFieldId)
                                ))
                            }
                        >
                            下一步 <ArrowRight size={16} className="ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

// Helper for generic field map access
function getFields(tableId: string): FieldItem[] {
    // This function is inside component scope in real usage via fieldsMap, 
    // but here used inside JSX render function scope. 
    // To make it compile without complexity, we rely on fieldsMap state in scope.
    // Since getFields helper was inside JSX map, it needs access to fieldsMap state.
    // The implementation above inside renderStep3 uses fieldsMap directly.
    return [];
}