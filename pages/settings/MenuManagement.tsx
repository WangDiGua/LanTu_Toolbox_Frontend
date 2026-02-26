import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Edit2, GripVertical, Save, RotateCcw, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { cn, transformMenuData } from '../../utils';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { IconPicker, IconComponent } from '../../components/IconPicker';
import { useToast } from '../../components/Toast';
import { menuApi, MenuItem, MenuType } from '../../api/modules/system';
import { useStore } from '../../store';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    menu: MenuItem;
    depth: number;
    onToggleVisibility: (id: number, currentVisible: number) => void;
    onToggleRole: (menuId: number, role: string, currentRoles: string[]) => void;
    onEdit: (menu: MenuItem) => void;
    onDelete: (menu: MenuItem) => void;
    allRoles: string[];
}

const SortableItem: React.FC<SortableItemProps> = ({ 
    menu, 
    depth, 
    onToggleVisibility, 
    onToggleRole, 
    onEdit,
    onDelete, 
    allRoles 
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: menu.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const indent = depth * 24;

    const getMenuTypeLabel = (type: string) => {
        switch (type) {
            case 'directory': return '目录';
            case 'menu': return '菜单';
            case 'button': return '按钮';
            default: return type;
        }
    };

    const getMenuTypeStyle = (type: string) => {
        switch (type) {
            case 'directory': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'menu': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'button': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={cn(
                "transition-colors",
                isDragging ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
        >
            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                    >
                        <GripVertical size={16} />
                    </button>
                    <span style={{ paddingLeft: indent }}>
                        {depth > 0 && <span className="text-slate-300 mr-2">└</span>}
                        {menu.title}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                    getMenuTypeStyle(menu.menuType || 'menu')
                )}>
                    {getMenuTypeLabel(menu.menuType || 'menu')}
                </span>
            </td>
            <td className="px-6 py-4 text-slate-500 font-mono text-xs dark:text-slate-400">
                {menu.path || '-'}
            </td>
            <td className="px-6 py-4 text-center">
                <button 
                    onClick={() => onToggleVisibility(menu.id, menu.isVisible)}
                    className={cn(
                        "p-1.5 rounded-full transition-colors",
                        menu.isVisible === 1
                            ? "bg-green-100 text-green-600 hover:bg-green-200" 
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    )}
                    title={menu.isVisible === 1 ? "点击隐藏" : "点击显示"}
                >
                    {menu.isVisible === 1 ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    {allRoles.map(role => (
                        <button
                            key={role}
                            onClick={() => onToggleRole(menu.id, role, menu.roles)}
                            className={cn(
                                "px-2 py-1 rounded text-xs border transition-all",
                                menu.roles?.includes(role)
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-medium dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                    : "bg-transparent border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700"
                            )}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(menu)} className="h-7 px-2">
                        <Edit2 size={12} className="mr-1" /> 编辑
                    </Button>
                    <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => onDelete(menu)} 
                        className="h-7 px-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
                    >
                        <Trash2 size={12} className="mr-1" /> 删除
                    </Button>
                </div>
            </td>
        </tr>
    );
};

export const MenuManagement: React.FC = () => {
    const { success, error: toastError } = useToast();
    const { dispatch } = useStore();
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [originalMenus, setOriginalMenus] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
    const [deletingMenu, setDeletingMenu] = useState<MenuItem | null>(null);
    const [createData, setCreateData] = useState({
        parentId: 0,
        title: '',
        path: '',
        icon: '',
        menuType: 'menu' as MenuType,
        perms: '',
        sort: 1,
        isVisible: 1,
        roles: ['admin'] as string[],
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadMenus = async () => {
        setLoading(true);
        try {
            const res = await menuApi.getList();
            if (res.code === 200) {
                const data = res.data || [];
                setMenus(data);
                setOriginalMenus(JSON.parse(JSON.stringify(data)));
                const transformedMenus = transformMenuData(data as any);
                localStorage.setItem('menus', JSON.stringify(transformedMenus));
                dispatch({ type: 'SET_MENUS', payload: transformedMenus });
            }
        } catch (e: any) {
            toastError(e.message || '加载菜单列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenus();
    }, []);

    useEffect(() => {
        setHasChanges(JSON.stringify(menus) !== JSON.stringify(originalMenus));
    }, [menus, originalMenus]);

    const flattenMenus = (menuList: MenuItem[]): MenuItem[] => {
        const result: MenuItem[] = [];
        menuList.forEach(menu => {
            result.push(menu);
            if (menu.children && menu.children.length > 0) {
                result.push(...flattenMenus(menu.children));
            }
        });
        return result;
    };

    const getAllMenuIds = (menuList: MenuItem[]): number[] => {
        const ids: number[] = [];
        menuList.forEach(menu => {
            ids.push(menu.id);
            if (menu.children && menu.children.length > 0) {
                ids.push(...getAllMenuIds(menu.children));
            }
        });
        return ids;
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const flatMenus = flattenMenus(menus);
        const activeMenu = flatMenus.find(m => m.id === active.id);
        const overMenu = flatMenus.find(m => m.id === over.id);

        if (!activeMenu || !overMenu) return;

        if (activeMenu.parentId !== overMenu.parentId) {
            toastError('只能在同一层级内调整顺序');
            return;
        }

        setMenus(prev => {
            if (activeMenu.parentId === 0) {
                const parentMenus = prev.filter(m => m.parentId === 0);
                const oldIndex = parentMenus.findIndex(m => m.id === active.id);
                const newIndex = parentMenus.findIndex(m => m.id === over.id);
                const reordered = arrayMove(parentMenus, oldIndex, newIndex);
                reordered.forEach((m, idx) => { m.sort = idx + 1; });
                
                const result: MenuItem[] = [];
                reordered.forEach(rm => {
                    const menuWithChildren = prev.find(m => m.id === rm.id);
                    if (menuWithChildren) {
                        result.push({ ...menuWithChildren, sort: rm.sort });
                    }
                });
                return result;
            } else {
                return prev.map(menu => {
                    if (menu.children && menu.children.length > 0) {
                        const children = menu.children.filter(c => true);
                        const oldIndex = children.findIndex(c => c.id === active.id);
                        const newIndex = children.findIndex(c => c.id === over.id);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            const reordered = arrayMove(children, oldIndex, newIndex);
                            reordered.forEach((c, idx) => { c.sort = idx + 1; });
                            return { ...menu, children: reordered };
                        }
                    }
                    return menu;
                });
            }
        });
    };

    const handleSaveSort = async () => {
        const sortData = flattenMenus(menus).map(m => ({
            id: m.id,
            sort: m.sort
        }));

        try {
            await menuApi.batchUpdateSort(sortData);
            success('菜单排序已保存');
            loadMenus();
        } catch (e: any) {
            toastError(e.message || '保存失败');
        }
    };

    const handleReset = () => {
        setMenus(JSON.parse(JSON.stringify(originalMenus)));
    };

    const toggleVisibility = async (id: number, currentVisible: number) => {
        try {
            await menuApi.update(id, { is_visible: currentVisible === 1 ? 0 : 1 } as any);
            success(`菜单已${currentVisible === 1 ? '隐藏' : '显示'}`);
            loadMenus();
        } catch (e: any) {
            toastError(e.message || '操作失败');
        }
    };

    const toggleRole = async (menuId: number, role: string, currentRoles: string[]) => {
        const newRoles = currentRoles.includes(role) 
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];
        try {
            await menuApi.update(menuId, { roles: newRoles });
            success('角色权限已更新');
            loadMenus();
        } catch (e: any) {
            toastError(e.message || '操作失败');
        }
    };

    const openEditModal = (menu: MenuItem) => {
        setEditingMenu({ ...menu });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (editingMenu) {
            setLoading(true);
            try {
                await menuApi.update(editingMenu.id, { 
                    title: editingMenu.title, 
                    path: editingMenu.path,
                    icon: editingMenu.icon,
                    menu_type: editingMenu.menuType,
                    perms: editingMenu.perms,
                } as any);
                success('菜单更新成功');
                setIsEditModalOpen(false);
                loadMenus();
            } catch (e: any) {
                toastError(e.message || '更新失败');
                setLoading(false);
            }
        }
    };

    const openCreateModal = () => {
        const maxSort = Math.max(0, ...menus.filter(m => m.parentId === 0).map(m => m.sort || 0));
        setCreateData({
            parentId: 0,
            title: '',
            path: '',
            icon: '',
            menuType: 'menu',
            perms: '',
            sort: maxSort + 1,
            isVisible: 1,
            roles: ['admin'],
        });
        setIsCreateModalOpen(true);
    };

    const handleCreate = async () => {
        if (!createData.title.trim()) {
            toastError('请输入菜单名称');
            return;
        }
        setLoading(true);
        try {
            await menuApi.create({
                parent_id: createData.parentId,
                title: createData.title,
                path: createData.path,
                icon: createData.icon,
                menu_type: createData.menuType,
                perms: createData.perms,
                sort: createData.sort,
                is_visible: createData.isVisible,
                roles: createData.roles,
            } as any);
            success('菜单创建成功');
            setIsCreateModalOpen(false);
            loadMenus();
        } catch (e: any) {
            toastError(e.message || '创建失败');
            setLoading(false);
        }
    };

    const openDeleteModal = (menu: MenuItem) => {
        setDeletingMenu(menu);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingMenu) return;
        setLoading(true);
        try {
            await menuApi.delete(deletingMenu.id);
            success('菜单已删除');
            setIsDeleteModalOpen(false);
            loadMenus();
        } catch (e: any) {
            toastError(e.message || '删除失败');
            setLoading(false);
        } finally {
            setDeletingMenu(null);
        }
    };

    const allRoles = ['admin', 'editor', 'viewer'];

    const parentMenuOptions = [
        { label: '顶级菜单', value: '0' },
        ...menus.filter(m => m.parentId === 0).map(m => ({ label: m.title, value: String(m.id) })),
    ];

    const renderMenuRows = (menuList: MenuItem[], depth: number = 0): React.ReactNode[] => {
        const rows: React.ReactNode[] = [];
        menuList.forEach(menu => {
            rows.push(
                <SortableItem
                    key={menu.id}
                    menu={menu}
                    depth={depth}
                    onToggleVisibility={toggleVisibility}
                    onToggleRole={toggleRole}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    allRoles={allRoles}
                />
            );
            if (menu.children && menu.children.length > 0) {
                rows.push(...renderMenuRows(menu.children, depth + 1));
            }
        });
        return rows;
    };

    const allMenuIds = getAllMenuIds(menus);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 flex-1">
                    <p>在此配置左侧导航栏的显示状态以及不同角色的访问权限。拖拽左侧手柄可调整菜单顺序。</p>
                </div>
                <Button onClick={openCreateModal} className="ml-4">
                    <Plus size={18} className="mr-2" /> 新增菜单
                </Button>
            </div>

            {hasChanges && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800">
                    <span className="text-sm text-amber-700 dark:text-amber-300">排序已修改，是否保存？</span>
                    <Button size="sm" onClick={handleSaveSort} className="bg-amber-600 hover:bg-amber-700">
                        <Save size={14} className="mr-1" /> 保存排序
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleReset}>
                        <RotateCcw size={14} className="mr-1" /> 重置
                    </Button>
                </div>
            )}
            
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                            <tr>
                                <th className="px-6 py-4">菜单名称</th>
                                <th className="px-6 py-4">类型</th>
                                <th className="px-6 py-4">路由路径</th>
                                <th className="px-6 py-4 text-center">显示状态</th>
                                <th className="px-6 py-4">允许访问的角色</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">加载中...</td></tr>
                            ) : menus.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">暂无数据</td></tr>
                            ) : (
                                <SortableContext items={allMenuIds} strategy={verticalListSortingStrategy}>
                                    {renderMenuRows(menus)}
                                </SortableContext>
                            )}
                        </tbody>
                    </table>
                </DndContext>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="编辑菜单"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>取消</Button>
                        <Button onClick={handleSaveEdit} isLoading={loading}>保存</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">菜单类型</label>
                        <Select 
                            value={editingMenu?.menuType || 'menu'} 
                            onChange={(val) => setEditingMenu(prev => prev ? {...prev, menuType: val as MenuType} : null)}
                            options={[
                                { label: '目录', value: 'directory' },
                                { label: '菜单', value: 'menu' },
                                { label: '按钮', value: 'button' },
                            ]}
                        />
                    </div>
                    <Input 
                        label="菜单名称" 
                        value={editingMenu?.title || ''} 
                        onChange={e => setEditingMenu(prev => prev ? {...prev, title: e.target.value} : null)}
                    />
                    {editingMenu?.menuType !== 'button' && (
                        <Input 
                            label="路由路径" 
                            value={editingMenu?.path || ''} 
                            onChange={e => setEditingMenu(prev => prev ? {...prev, path: e.target.value} : null)}
                            placeholder="例如：/settings/users"
                        />
                    )}
                    {editingMenu?.menuType !== 'button' && (
                        <IconPicker 
                            label="图标"
                            value={editingMenu?.icon || ''} 
                            onChange={(icon) => setEditingMenu(prev => prev ? {...prev, icon} : null)}
                        />
                    )}
                    <Input 
                        label="权限标识" 
                        value={editingMenu?.perms || ''} 
                        onChange={e => setEditingMenu(prev => prev ? {...prev, perms: e.target.value} : null)}
                        placeholder="例如：system:users"
                    />
                </div>
            </Modal>

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="新增菜单"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>取消</Button>
                        <Button onClick={handleCreate} isLoading={loading}>创建</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">上级菜单</label>
                        <Select 
                            value={String(createData.parentId)} 
                            onChange={(val) => setCreateData(prev => ({ ...prev, parentId: parseInt(val) }))}
                            options={parentMenuOptions}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">菜单类型</label>
                        <Select 
                            value={createData.menuType} 
                            onChange={(val) => setCreateData(prev => ({ ...prev, menuType: val as MenuType }))}
                            options={[
                                { label: '目录', value: 'directory' },
                                { label: '菜单', value: 'menu' },
                                { label: '按钮', value: 'button' },
                            ]}
                        />
                    </div>
                    <Input 
                        label="菜单名称" 
                        value={createData.title} 
                        onChange={e => setCreateData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="请输入菜单名称"
                    />
                    {createData.menuType !== 'button' && (
                        <Input 
                            label="路由路径" 
                            value={createData.path} 
                            onChange={e => setCreateData(prev => ({ ...prev, path: e.target.value }))}
                            placeholder="例如：/settings/users"
                        />
                    )}
                    {createData.menuType !== 'button' && (
                        <IconPicker 
                            label="图标"
                            value={createData.icon} 
                            onChange={(icon) => setCreateData(prev => ({ ...prev, icon }))}
                        />
                    )}
                    <Input 
                        label="权限标识" 
                        value={createData.perms} 
                        onChange={e => setCreateData(prev => ({ ...prev, perms: e.target.value }))}
                        placeholder="例如：system:users"
                    />
                    <Input 
                        label="排序" 
                        type="number"
                        value={createData.sort} 
                        onChange={e => setCreateData(prev => ({ ...prev, sort: parseInt(e.target.value) || 1 }))}
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">允许访问的角色</label>
                        <div className="flex gap-2">
                            {allRoles.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => {
                                        setCreateData(prev => ({
                                            ...prev,
                                            roles: prev.roles.includes(role) 
                                                ? prev.roles.filter(r => r !== role)
                                                : [...prev.roles, role]
                                        }));
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded text-sm border transition-all",
                                        createData.roles.includes(role)
                                            ? "bg-blue-50 border-blue-200 text-blue-700 font-medium dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                                            : "bg-transparent border-slate-200 text-slate-400 hover:border-slate-300 dark:border-slate-700"
                                    )}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
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
                        <Button variant="danger" onClick={handleDelete} isLoading={loading}>确认删除</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="bg-red-50 text-red-800 p-3 rounded-lg flex items-start text-sm dark:bg-red-900/20 dark:text-red-300">
                        <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                            <p>此操作将永久删除该菜单，无法恢复。</p>
                            {deletingMenu?.children && deletingMenu.children.length > 0 && (
                                <p className="mt-2 font-medium">注意：该菜单下有 {deletingMenu.children.length} 个子菜单也将被删除！</p>
                            )}
                        </div>
                    </div>
                    <div className="text-center py-2">
                        <p className="text-slate-600 dark:text-slate-300">
                            确定要删除菜单 <span className="font-bold text-red-600">"{deletingMenu?.title}"</span> 吗？
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
