import React, { useState, useEffect } from 'react';
import { Search, Database, FileText, Loader2, Zap, Settings, ChevronDown, ChevronUp, Copy, Check, Braces } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Pagination } from '../components/Pagination';
import { cn } from '../utils';
import { searchApi, vectorApi } from '../api';
import { SearchParams } from '../api/modules/vector';
import { useToast } from '../components/Toast';

interface Collection {
    id: string;
    name: string;
    alias: string;
    count: number;
}

const isJsonLike = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

const tryParseJson = (str: string): any | null => {
    if (!str || typeof str !== 'string') return null;
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
};

export const VectorSearch: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState<'dense' | 'hybrid'>('dense');
  const [topK, setTopK] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const res = await vectorApi.getList({ pageSize: 100 });
        if (res.code === 200) {
          const list = res.data.records || [];
          const enabledList = list.filter((item: any) => 
            item.isEnabled === true || item.isEnabled === 1
          );
          setCollections(enabledList.map((item: any) => ({
            id: String(item.id),
            name: item.title,
            alias: item.alias || item.collectionName || item.title,
            count: item.vectorCount || 0
          })));
          if (enabledList.length > 0) {
            setSelectedCollection(String(enabledList[0].id));
          }
        }
      } catch (e: any) {
        console.error('Failed to load collections:', e);
      }
    };
    loadCollections();
  }, []);

  useEffect(() => {
    if (hasSearched && results.length > 0) {
        handleSearch();
    }
  }, [page]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!selectedCollection) {
      toastError('请先选择一个向量库');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const params: SearchParams = {
        collectionId: selectedCollection,
        query,
        type: searchType,
        topK,
        page
      };
      
      const res = await searchApi.search(params);
      
      if (res.code === 200) {
        const data = res.data;
        setResults(data.list || []);
        setTotalPages(Math.ceil((data.total || 0) / topK) || 1);
        toastSuccess(`搜索完成，找到 ${data.total || 0} 条结果`);
      }
    } catch (e: any) {
      toastError(e.message || '搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toastSuccess('已复制到剪贴板');
  };

  const renderResultContent = (result: any, index: number) => {
    const content = result.content || result.text || '';
    const parsedJson = tryParseJson(content);
    const isJson = parsedJson !== null || isJsonLike(content);
    
    if (isJson && parsedJson) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                        <Braces size={12} />
                        <span className="font-medium">JSON 数据</span>
                    </div>
                    <button 
                        onClick={() => copyToClipboard(JSON.stringify(parsedJson, null, 2), `json-${index}`)}
                        className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                        {copiedId === `json-${index}` ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === `json-${index}` ? '已复制' : '复制'}
                    </button>
                </div>
                <div className="bg-slate-800 dark:bg-slate-950 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(parsedJson, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }
    
    if (isJsonLike(content) && !parsedJson) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <Braces size={12} />
                    <span className="font-medium">JSON 格式（解析失败）</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300 break-all">
                    {content}
                </p>
            </div>
        );
    }
    
    return (
        <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">
            {content}
        </p>
    );
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                  <Database size={16} className="mr-2 text-blue-500" /> 向量库列表
              </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {collections.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">暂无向量库</div>
              ) : collections.map(col => (
                  <button
                      key={col.id}
                      onClick={() => setSelectedCollection(col.id)}
                      className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group",
                          selectedCollection === col.id 
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" 
                              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      )}
                  >
                      <div className="truncate font-medium">{col.name}</div>
                      <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full truncate max-w-[80px]",
                          selectedCollection === col.id ? "bg-blue-100 dark:bg-blue-800" : "bg-slate-100 text-slate-400 dark:bg-slate-700"
                      )}>{col.alias}</span>
                  </button>
              ))}
          </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <div className="relative">
                  <Input 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="输入查询语句，例如：系统如何处理并发请求？" 
                      className="pr-24 h-12 text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="absolute right-1 top-1 bottom-1">
                      <Button onClick={handleSearch} disabled={loading} className="h-full px-6">
                          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                          <span className="ml-2">搜索</span>
                      </Button>
                  </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                   <div className="flex gap-4">
                       <label className="flex items-center cursor-pointer hover:text-blue-600">
                         <input 
                           type="radio" 
                           name="search_type" 
                           checked={searchType === 'dense'} 
                           onChange={() => setSearchType('dense')}
                           className="mr-1" 
                         /> 语义检索 (Dense)
                       </label>
                       <label className="flex items-center cursor-pointer hover:text-blue-600">
                         <input 
                           type="radio" 
                           name="search_type" 
                           checked={searchType === 'hybrid'} 
                           onChange={() => setSearchType('hybrid')}
                           className="mr-1" 
                         /> 混合检索 (Hybrid)
                       </label>
                   </div>
                   <button 
                       onClick={() => setShowSettings(!showSettings)}
                       className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                   >
                       <Settings size={12} />
                       <span>参数设置</span>
                       {showSettings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                   </button>
              </div>
              
              {showSettings && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                      <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Top K:</label>
                              <input 
                                  type="number" 
                                  value={topK}
                                  onChange={(e) => setTopK(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                                  className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 transition-all dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:focus:border-blue-400"
                                  min={1}
                                  max={100}
                              />
                              <span className="text-xs text-slate-400">条结果/页</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <input 
                                  type="range" 
                                  value={topK}
                                  onChange={(e) => setTopK(parseInt(e.target.value))}
                                  min={1}
                                  max={50}
                                  className="w-32 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600"
                              />
                              <span className="text-xs text-slate-400">快速调节</span>
                          </div>
                      </div>
                  </div>
              )}
              
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <div className="font-medium mb-2 text-slate-600 dark:text-slate-300">检索类型说明：</div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className={cn("p-2 rounded border", searchType === 'dense' ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "border-slate-200 dark:border-slate-700")}>
                          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">语义检索 (Dense)</div>
                          <p className="text-slate-500 dark:text-slate-400">基于向量相似度，理解语义含义。适合模糊查询、概念搜索。</p>
                      </div>
                      <div className={cn("p-2 rounded border", searchType === 'hybrid' ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "border-slate-200 dark:border-slate-700")}>
                          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">混合检索 (Hybrid)</div>
                          <p className="text-slate-500 dark:text-slate-400">结合语义检索 + 关键词匹配，结果更精准。适合专业术语搜索。</p>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0 dark:bg-slate-900 dark:border-slate-800">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center dark:border-slate-800">
                   <h3 className="font-semibold text-slate-800 dark:text-white flex items-center">
                       <Zap size={16} className="mr-2 text-yellow-500" /> 检索结果
                   </h3>
                   {results.length > 0 && (
                       <span className="text-xs text-slate-500 dark:text-slate-400">
                           共 {results.length} 条结果
                       </span>
                   )}
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {loading ? (
                     <div className="h-full flex items-center justify-center text-slate-400">
                       <Loader2 size={24} className="animate-spin" />
                     </div>
                   ) : !hasSearched ? (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400">
                           <Search size={48} className="mb-4 opacity-20" />
                           <p>请在上方输入内容开始测试向量检索效果</p>
                       </div>
                   ) : results.length === 0 ? (
                       <div className="h-full flex items-center justify-center text-slate-400">未找到相关结果</div>
                   ) : (
                       results.map((res, index) => (
                           <div key={res.id || index} className="p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/30 hover:border-blue-100 transition-all group dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-blue-900/10 dark:hover:border-blue-800">
                               <div className="flex justify-between items-start mb-3">
                                   <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                       <span className="bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center dark:bg-slate-800 dark:border-slate-600">
                                           <FileText size={12} className="mr-1" /> {res.source || 'Unknown'}
                                       </span>
                                       {res.id && (
                                           <span className="font-mono opacity-70">ID: {res.id}</span>
                                       )}
                                   </div>
                                   <div className="flex items-center gap-2">
                                       {res.distance !== undefined && (
                                           <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-400">
                                               Distance: {res.distance?.toFixed(4)}
                                           </span>
                                       )}
                                       <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded dark:bg-green-900/20 dark:text-green-400">
                                           Score: {res.score?.toFixed(4) || '-'}
                                       </span>
                                   </div>
                               </div>
                               {renderResultContent(res, index)}
                           </div>
                       ))
                   )}
               </div>

               {results.length > 0 && totalPages > 1 && (
                   <div className="border-t border-slate-100 p-2 dark:border-slate-800">
                       <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                   </div>
               )}
          </div>
      </div>
    </div>
  );
};
