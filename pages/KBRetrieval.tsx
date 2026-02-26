import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Zap, Loader2 } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { searchApi, vectorApi } from '../api';
import { cn } from '../utils';

interface KnowledgeBase {
    id: string;
    name: string;
}

export const KBRetrieval: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'semantic' | 'hybrid'>('semantic');
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const loadKnowledgeBases = async () => {
      try {
        const res = await vectorApi.getList({ pageSize: 100 });
        if (res.code === 200) {
          const list = res.data.records || [];
          setKnowledgeBases(list.map((item: any) => ({
            id: String(item.id),
            name: item.title
          })));
          if (list.length > 0) {
            setSelectedKB(String(list[0].id));
          }
        }
      } catch (e: any) {
        console.error('Failed to load knowledge bases:', e);
      }
    };
    loadKnowledgeBases();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      toastError('请输入查询内容');
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const res = await searchApi.search({
        collectionId: selectedKB,
        query,
        type: searchMode === 'hybrid' ? 'hybrid' : 'dense',
        topK: 10,
        page: 1
      });
      
      if (res.code === 200) {
        const data = res.data;
        setResults(data.list || []);
        toastSuccess(`检索完成，找到 ${data.total || 0} 条结果`);
      }
    } catch (e: any) {
      toastError(e.message || '检索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">知识库检索</h1>
            <p className="text-slate-500 dark:text-slate-400">在已配置的知识库中进行精确或语义检索测试。</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex gap-2">
                    <Input 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="输入查询语句，例如：什么是向量数据库？" 
                        leftIcon={<Search size={18} />} 
                        className="h-12 text-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button size="lg" onClick={handleSearch} disabled={loading} className="w-32">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : '检索'}
                    </Button>
                </div>
                
                <div className="flex gap-4 justify-center text-sm text-slate-500">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="mode" 
                          checked={searchMode === 'semantic'} 
                          onChange={() => setSearchMode('semantic')}
                        /> 语义检索
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="mode" 
                          checked={searchMode === 'hybrid'} 
                          onChange={() => setSearchMode('hybrid')}
                        /> 混合检索
                    </label>
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={cn("p-2 rounded border", searchMode === 'semantic' ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "border-slate-200 dark:border-slate-700")}>
                            <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">语义检索</div>
                            <p className="text-slate-500 dark:text-slate-400">基于向量相似度，理解语义含义。适合模糊查询。</p>
                            <p className="mt-1 text-slate-400 dark:text-slate-500 italic">例：搜索"性能优化"可匹配"系统调优方法"</p>
                        </div>
                        <div className={cn("p-2 rounded border", searchMode === 'hybrid' ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800" : "border-slate-200 dark:border-slate-700")}>
                            <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">混合检索</div>
                            <p className="text-slate-500 dark:text-slate-400">语义 + 关键词匹配，结果更精准。适合专业术语。</p>
                            <p className="mt-1 text-slate-400 dark:text-slate-500 italic">例：搜索"MySQL索引"精确匹配关键词</p>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {hasSearched && (
            <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                    <Zap size={18} className="mr-2 text-yellow-500" /> 检索结果
                </h3>
                {loading ? (
                  <div className="bg-white p-8 rounded-lg border border-slate-200 flex items-center justify-center dark:bg-slate-900 dark:border-slate-800">
                    <Loader2 size={24} className="animate-spin text-slate-400" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-400 dark:bg-slate-900 dark:border-slate-800">
                    未找到相关结果
                  </div>
                ) : results.map((res) => (
                    <div key={res.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
                        <p className="text-slate-800 mb-3 leading-relaxed dark:text-slate-200">{res.content}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 pt-3 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText size={14} /> 
                                <span>{res.source || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded dark:bg-green-900/20 dark:text-green-400">Score: {res.score?.toFixed(2) || '-'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
