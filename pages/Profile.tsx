import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, MapPin, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { authApi } from '../api';
import { APP_CONFIG } from '../config';
import { cn } from '../utils';

export const Profile: React.FC = () => {
  const { state, dispatch } = useStore();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [changingPassword, setChangingPassword] = useState(false);
  
  const user = state.user || { 
    username: 'Guest', 
    email: 'guest@example.com', 
    role: 'viewer', 
    roleKey: 'viewer',
    nickname: '',
    phone: '',
    avatar: '',
    gender: '',
    age: 0,
    bio: '',
    location: '',
    createdAt: ''
  };

  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    phone: '',
    gender: '',
    age: '',
    bio: '',
    location: ''
  });

  useEffect(() => {
    if (state.user) {
      setFormData({
        nickname: state.user.nickname || '',
        email: state.user.email || '',
        phone: state.user.phone || '',
        gender: state.user.gender || '',
        age: state.user.age?.toString() || '',
        bio: state.user.bio || '',
        location: state.user.location || ''
      });
    }
  }, [state.user]);

  const displayRole = user.role || user.roleKey || 'viewer';
  const displayAvatar = user.avatar || user.username?.substring(0, 2).toUpperCase() || 'GU';
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };
  const displayCreatedAt = formatDate(user.createdAt);

  const genderOptions = [
    { label: '男', value: 'male' },
    { label: '女', value: 'female' },
    { label: '其他', value: 'other' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const updateData: Record<string, any> = {};
    
    if (formData.nickname) updateData.nickname = formData.nickname;
    if (formData.email) updateData.email = formData.email;
    if (formData.phone) updateData.phone = formData.phone;
    if (formData.gender) updateData.gender = formData.gender;
    if (formData.age) updateData.age = parseInt(formData.age, 10);
    if (formData.bio) updateData.bio = formData.bio;
    if (formData.location) updateData.location = formData.location;

    if (Object.keys(updateData).length === 0) {
      toastError('请至少修改一个字段');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.updateProfile(updateData);
      if (res.code === 200) {
        const updatedUser = { ...state.user, ...res.data };
        dispatch({ type: 'SET_USER', payload: updatedUser });
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
        success('个人资料更新成功');
      }
    } catch (e: any) {
      toastError(e.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordForm({
      old_password: '',
      new_password: '',
      confirm_password: ''
    });
    setPasswordErrors({});
    setIsPasswordModalOpen(true);
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordForm.old_password) {
      errors.old_password = '请输入原密码';
    }
    
    if (!passwordForm.new_password) {
      errors.new_password = '请输入新密码';
    } else if (passwordForm.new_password.length < 6) {
      errors.new_password = '密码至少6个字符';
    } else if (passwordForm.new_password.length > 20) {
      errors.new_password = '密码最多20个字符';
    }
    
    if (!passwordForm.confirm_password) {
      errors.confirm_password = '请确认新密码';
    } else if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = '两次输入的密码不一致';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    
    setChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      });
      if (res.code === 200) {
        success('密码修改成功');
        setIsPasswordModalOpen(false);
      }
    } catch (e: any) {
      toastError(e.message || '密码修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">个人中心</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center dark:bg-slate-900 dark:border-slate-800">
                    <div className="relative mb-4 group cursor-pointer">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-md dark:border-slate-700 dark:bg-blue-900 dark:text-blue-300">
                            {displayAvatar}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                      {user.nickname || user.username}
                    </h2>
                    <p className="text-slate-500 text-sm mb-4 dark:text-slate-400">{displayRole}</p>
                    
                    <div className="w-full space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Mail size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                            {user.email}
                        </div>
                         <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Shield size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                            {displayRole}
                        </div>
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <MapPin size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                            {user.location || '未设置'}
                        </div>
                         <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Calendar size={16} className="mr-3 text-slate-400 dark:text-slate-500" />
                            加入时间: {displayCreatedAt}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100 dark:text-white dark:border-slate-800">基本资料</h3>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                              label="用户名" 
                              defaultValue={user.username} 
                              disabled 
                              className="bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" 
                            />
                            <Input 
                              label="显示名称" 
                              value={formData.nickname}
                              onChange={(e) => handleInputChange('nickname', e.target.value)}
                              className="dark:bg-slate-800 dark:text-white dark:border-slate-700" 
                            />
                            <Input 
                              label="电子邮件" 
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className="dark:bg-slate-800 dark:text-white dark:border-slate-700" 
                            />
                            <Input 
                              label="手机号码" 
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="未设置"
                              className="dark:bg-slate-800 dark:text-white dark:border-slate-700" 
                            />
                            
                            <div>
                                <Select 
                                    label="性别"
                                    options={genderOptions}
                                    value={formData.gender}
                                    onChange={(val) => handleInputChange('gender', val as string)}
                                />
                            </div>
                            <Input 
                              label="年龄" 
                              type="number" 
                              value={formData.age}
                              onChange={(e) => handleInputChange('age', e.target.value)}
                              placeholder="未设置"
                              className="dark:bg-slate-800 dark:text-white dark:border-slate-700" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">个人简介</label>
                            <textarea 
                                className="block w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px] text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="暂无简介"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-300">所在地</label>
                            <Input 
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              placeholder="未设置"
                              className="dark:bg-slate-800 dark:text-white dark:border-slate-700" 
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} isLoading={loading}>
                              {loading ? '保存中...' : '保存更改'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100 dark:text-white dark:border-slate-800">安全设置</h3>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center dark:bg-slate-800">
                                <Lock size={24} className="text-slate-500 dark:text-slate-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-800 dark:text-white">登录密码</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">定期更换密码可以保护账号安全</p>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={openPasswordModal}>
                            修改密码
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <Modal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            title="修改密码"
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>取消</Button>
                    <Button onClick={handleChangePassword} isLoading={changingPassword}>确认修改</Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="relative">
                    <Input 
                        label="原密码" 
                        type={showOldPassword ? 'text' : 'password'}
                        value={passwordForm.old_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        error={passwordErrors.old_password}
                        placeholder="请输入原密码"
                    />
                    <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                    >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                <div className="relative">
                    <Input 
                        label="新密码" 
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        error={passwordErrors.new_password}
                        placeholder="6-20个字符"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                    >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                <div className="relative">
                    <Input 
                        label="确认新密码" 
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        error={passwordErrors.confirm_password}
                        placeholder="请再次输入新密码"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600"
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
