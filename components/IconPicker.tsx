import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { cn } from '../utils';

const AVAILABLE_ICONS = [
    // 导航与布局
    { name: 'LayoutDashboard', label: '仪表盘', category: '导航' },
    { name: 'Home', label: '首页', category: '导航' },
    { name: 'Menu', label: '菜单', category: '导航' },
    { name: 'Grid', label: '网格', category: '导航' },
    { name: 'Layout', label: '布局', category: '导航' },
    { name: 'Sidebar', label: '侧边栏', category: '导航' },
    { name: 'Navigation', label: '导航', category: '导航' },
    { name: 'Compass', label: '指南针', category: '导航' },
    { name: 'Map', label: '地图', category: '导航' },
    { name: 'MapPin', label: '地图标记', category: '导航' },
    
    // 数据与存储
    { name: 'Database', label: '数据库', category: '数据' },
    { name: 'Server', label: '服务器', category: '数据' },
    { name: 'Cloud', label: '云', category: '数据' },
    { name: 'HardDrive', label: '硬盘', category: '数据' },
    { name: 'Archive', label: '归档', category: '数据' },
    { name: 'DatabaseBackup', label: '数据库备份', category: '数据' },
    { name: 'Data', label: '数据', category: '数据' },
    { name: 'Binary', label: '二进制', category: '数据' },
    { name: 'Storage', label: '存储', category: '数据' },
    
    // 文件与文件夹
    { name: 'File', label: '文件', category: '文件' },
    { name: 'FileText', label: '文本文件', category: '文件' },
    { name: 'FilePlus', label: '添加文件', category: '文件' },
    { name: 'FileMinus', label: '删除文件', category: '文件' },
    { name: 'FileCheck', label: '文件检查', category: '文件' },
    { name: 'FileX', label: '文件错误', category: '文件' },
    { name: 'FileEdit', label: '编辑文件', category: '文件' },
    { name: 'FileSearch', label: '搜索文件', category: '文件' },
    { name: 'FileCode', label: '代码文件', category: '文件' },
    { name: 'FileJson', label: 'JSON文件', category: '文件' },
    { name: 'FileSpreadsheet', label: '表格文件', category: '文件' },
    { name: 'Folder', label: '文件夹', category: '文件' },
    { name: 'FolderOpen', label: '打开文件夹', category: '文件' },
    { name: 'FolderPlus', label: '新建文件夹', category: '文件' },
    { name: 'FolderArchive', label: '归档文件夹', category: '文件' },
    
    // 用户与权限
    { name: 'User', label: '用户', category: '用户' },
    { name: 'Users', label: '用户组', category: '用户' },
    { name: 'UserPlus', label: '添加用户', category: '用户' },
    { name: 'UserMinus', label: '删除用户', category: '用户' },
    { name: 'UserCheck', label: '用户验证', category: '用户' },
    { name: 'UserX', label: '用户错误', category: '用户' },
    { name: 'UserCircle', label: '用户头像', category: '用户' },
    { name: 'Contact', label: '联系人', category: '用户' },
    { name: 'Shield', label: '盾牌', category: '用户' },
    { name: 'ShieldCheck', label: '安全验证', category: '用户' },
    { name: 'ShieldAlert', label: '安全警告', category: '用户' },
    { name: 'Lock', label: '锁', category: '用户' },
    { name: 'Unlock', label: '解锁', category: '用户' },
    { name: 'Key', label: '钥匙', category: '用户' },
    { name: 'KeyRound', label: '圆钥匙', category: '用户' },
    { name: 'LogIn', label: '登录', category: '用户' },
    { name: 'LogOut', label: '登出', category: '用户' },
    
    // 设置与工具
    { name: 'Settings', label: '设置', category: '设置' },
    { name: 'Settings2', label: '设置2', category: '设置' },
    { name: 'Sliders', label: '滑块', category: '设置' },
    { name: 'SlidersHorizontal', label: '水平滑块', category: '设置' },
    { name: 'Wrench', label: '扳手', category: '设置' },
    { name: 'WrenchIcon', label: '工具', category: '设置' },
    { name: 'Cog', label: '齿轮', category: '设置' },
    { name: 'Cpu', label: 'CPU', category: '设置' },
    { name: 'CircuitBoard', label: '电路板', category: '设置' },
    
    // 搜索与过滤
    { name: 'Search', label: '搜索', category: '搜索' },
    { name: 'SearchCode', label: '搜索代码', category: '搜索' },
    { name: 'SearchX', label: '清除搜索', category: '搜索' },
    { name: 'Filter', label: '筛选', category: '搜索' },
    { name: 'FilterX', label: '清除筛选', category: '搜索' },
    { name: 'SortAsc', label: '升序', category: '搜索' },
    { name: 'SortDesc', label: '降序', category: '搜索' },
    
    // 编辑与操作
    { name: 'Edit', label: '编辑', category: '编辑' },
    { name: 'Edit2', label: '编辑2', category: '编辑' },
    { name: 'Edit3', label: '编辑3', category: '编辑' },
    { name: 'Pen', label: '笔', category: '编辑' },
    { name: 'PenTool', label: '画笔', category: '编辑' },
    { name: 'Pencil', label: '铅笔', category: '编辑' },
    { name: 'Eraser', label: '橡皮擦', category: '编辑' },
    { name: 'Copy', label: '复制', category: '编辑' },
    { name: 'Clipboard', label: '剪贴板', category: '编辑' },
    { name: 'ClipboardCopy', label: '复制到剪贴板', category: '编辑' },
    { name: 'ClipboardPaste', label: '粘贴', category: '编辑' },
    { name: 'Scissors', label: '剪刀', category: '编辑' },
    { name: 'Trash', label: '垃圾桶', category: '编辑' },
    { name: 'Trash2', label: '删除', category: '编辑' },
    { name: 'Plus', label: '加号', category: '编辑' },
    { name: 'Minus', label: '减号', category: '编辑' },
    { name: 'X', label: '关闭', category: '编辑' },
    { name: 'Check', label: '勾选', category: '编辑' },
    { name: 'CheckCircle', label: '成功', category: '编辑' },
    { name: 'XCircle', label: '失败', category: '编辑' },
    { name: 'AlertCircle', label: '警告圆', category: '编辑' },
    { name: 'AlertTriangle', label: '警告三角', category: '编辑' },
    
    // 图表与统计
    { name: 'BarChart', label: '柱状图', category: '图表' },
    { name: 'BarChart2', label: '柱状图2', category: '图表' },
    { name: 'BarChart3', label: '柱状图3', category: '图表' },
    { name: 'BarChartHorizontal', label: '横向柱状图', category: '图表' },
    { name: 'LineChart', label: '折线图', category: '图表' },
    { name: 'PieChart', label: '饼图', category: '图表' },
    { name: 'TrendingUp', label: '趋势上升', category: '图表' },
    { name: 'TrendingDown', label: '趋势下降', category: '图表' },
    { name: 'Activity', label: '活动', category: '图表' },
    { name: 'Analytics', label: '分析', category: '图表' },
    { name: 'DollarSign', label: '美元', category: '图表' },
    { name: 'Percent', label: '百分比', category: '图表' },
    { name: 'Hash', label: '井号', category: '图表' },
    
    // 通讯与消息
    { name: 'Mail', label: '邮件', category: '通讯' },
    { name: 'MailOpen', label: '打开邮件', category: '通讯' },
    { name: 'MailPlus', label: '新建邮件', category: '通讯' },
    { name: 'MessageSquare', label: '消息', category: '通讯' },
    { name: 'MessageCircle', label: '圆形消息', category: '通讯' },
    { name: 'Send', label: '发送', category: '通讯' },
    { name: 'Bell', label: '铃铛', category: '通讯' },
    { name: 'BellRing', label: '响铃', category: '通讯' },
    { name: 'BellPlus', label: '添加提醒', category: '通讯' },
    { name: 'BellOff', label: '静音', category: '通讯' },
    { name: 'Phone', label: '电话', category: '通讯' },
    { name: 'PhoneCall', label: '通话', category: '通讯' },
    { name: 'PhoneOff', label: '挂断', category: '通讯' },
    { name: 'Voicemail', label: '语音信箱', category: '通讯' },
    
    // 书籍与文档
    { name: 'Book', label: '书本', category: '文档' },
    { name: 'BookOpen', label: '打开的书', category: '文档' },
    { name: 'BookMarked', label: '带书签的书', category: '文档' },
    { name: 'BookCopy', label: '复制书籍', category: '文档' },
    { name: 'Bookmark', label: '书签', category: '文档' },
    { name: 'Notebook', label: '笔记本', category: '文档' },
    { name: 'NotebookPen', label: '编辑笔记', category: '文档' },
    { name: 'NotebookTabs', label: '标签笔记', category: '文档' },
    { name: 'Scroll', label: '卷轴', category: '文档' },
    { name: 'FileText', label: '文本文档', category: '文档' },
    
    // 开发与代码
    { name: 'Code', label: '代码', category: '开发' },
    { name: 'Code2', label: '代码2', category: '开发' },
    { name: 'Terminal', label: '终端', category: '开发' },
    { name: 'SquareTerminal', label: '终端窗口', category: '开发' },
    { name: 'GitBranch', label: 'Git分支', category: '开发' },
    { name: 'GitCommit', label: 'Git提交', category: '开发' },
    { name: 'GitMerge', label: 'Git合并', category: '开发' },
    { name: 'GitPullRequest', label: 'PR', category: '开发' },
    { name: 'Github', label: 'GitHub', category: '开发' },
    { name: 'Gitlab', label: 'GitLab', category: '开发' },
    { name: 'Braces', label: '大括号', category: '开发' },
    { name: 'Brackets', label: '方括号', category: '开发' },
    { name: 'Parentheses', label: '圆括号', category: '开发' },
    { name: 'Variable', label: '变量', category: '开发' },
    { name: 'FunctionSquare', label: '函数', category: '开发' },
    { name: 'Package', label: '包', category: '开发' },
    { name: 'Box', label: '盒子', category: '开发' },
    { name: 'Layers', label: '图层', category: '开发' },
    { name: 'Component', label: '组件', category: '开发' },
    { name: 'Puzzle', label: '拼图', category: '开发' },
    
    // 多媒体
    { name: 'Image', label: '图片', category: '多媒体' },
    { name: 'ImagePlus', label: '添加图片', category: '多媒体' },
    { name: 'Images', label: '图片组', category: '多媒体' },
    { name: 'Video', label: '视频', category: '多媒体' },
    { name: 'VideoOff', label: '关闭视频', category: '多媒体' },
    { name: 'Film', label: '电影', category: '多媒体' },
    { name: 'Music', label: '音乐', category: '多媒体' },
    { name: 'Music2', label: '音乐2', category: '多媒体' },
    { name: 'Mic', label: '麦克风', category: '多媒体' },
    { name: 'MicOff', label: '静音麦克风', category: '多媒体' },
    { name: 'Headphones', label: '耳机', category: '多媒体' },
    { name: 'Speaker', label: '扬声器', category: '多媒体' },
    { name: 'Volume', label: '音量', category: '多媒体' },
    { name: 'Volume1', label: '音量1', category: '多媒体' },
    { name: 'Volume2', label: '音量2', category: '多媒体' },
    { name: 'VolumeX', label: '静音', category: '多媒体' },
    { name: 'Camera', label: '相机', category: '多媒体' },
    { name: 'CameraOff', label: '关闭相机', category: '多媒体' },
    { name: 'Webcam', label: '摄像头', category: '多媒体' },
    
    // 时间与日期
    { name: 'Clock', label: '时钟', category: '时间' },
    { name: 'Clock1', label: '时钟1点', category: '时间' },
    { name: 'Clock3', label: '时钟3点', category: '时间' },
    { name: 'Clock6', label: '时钟6点', category: '时间' },
    { name: 'Clock9', label: '时钟9点', category: '时间' },
    { name: 'Clock12', label: '时钟12点', category: '时间' },
    { name: 'Calendar', label: '日历', category: '时间' },
    { name: 'CalendarDays', label: '日历天', category: '时间' },
    { name: 'CalendarPlus', label: '添加日程', category: '时间' },
    { name: 'CalendarCheck', label: '日程完成', category: '时间' },
    { name: 'CalendarX', label: '取消日程', category: '时间' },
    { name: 'CalendarRange', label: '日期范围', category: '时间' },
    { name: 'Timer', label: '计时器', category: '时间' },
    { name: 'TimerOff', label: '关闭计时', category: '时间' },
    { name: 'Hourglass', label: '沙漏', category: '时间' },
    { name: 'History', label: '历史', category: '时间' },
    
    // 网络与连接
    { name: 'Globe', label: '地球', category: '网络' },
    { name: 'Globe2', label: '地球2', category: '网络' },
    { name: 'Wifi', label: 'WiFi', category: '网络' },
    { name: 'WifiOff', label: '断开WiFi', category: '网络' },
    { name: 'Link', label: '链接', category: '网络' },
    { name: 'Link2', label: '链接2', category: '网络' },
    { name: 'Link2Off', label: '断开链接', category: '网络' },
    { name: 'ExternalLink', label: '外链', category: '网络' },
    { name: 'Unlink', label: '取消链接', category: '网络' },
    { name: 'Chain', label: '链条', category: '网络' },
    { name: 'Earth', label: '地球', category: '网络' },
    { name: 'EarthLock', label: '锁定地球', category: '网络' },
    { name: 'Signal', label: '信号', category: '网络' },
    { name: 'SignalHigh', label: '高信号', category: '网络' },
    { name: 'SignalLow', label: '低信号', category: '网络' },
    { name: 'SignalMedium', label: '中信号', category: '网络' },
    
    // 箭头与方向
    { name: 'ArrowUp', label: '向上', category: '箭头' },
    { name: 'ArrowDown', label: '向下', category: '箭头' },
    { name: 'ArrowLeft', label: '向左', category: '箭头' },
    { name: 'ArrowRight', label: '向右', category: '箭头' },
    { name: 'ArrowUpRight', label: '右上', category: '箭头' },
    { name: 'ArrowDownLeft', label: '左下', category: '箭头' },
    { name: 'ArrowUpLeft', label: '左上', category: '箭头' },
    { name: 'ArrowDownRight', label: '右下', category: '箭头' },
    { name: 'ArrowUpCircle', label: '向上圆', category: '箭头' },
    { name: 'ArrowDownCircle', label: '向下圆', category: '箭头' },
    { name: 'ChevronUp', label: '上尖括号', category: '箭头' },
    { name: 'ChevronDown', label: '下尖括号', category: '箭头' },
    { name: 'ChevronLeft', label: '左尖括号', category: '箭头' },
    { name: 'ChevronRight', label: '右尖括号', category: '箭头' },
    { name: 'MoveUp', label: '上移', category: '箭头' },
    { name: 'MoveDown', label: '下移', category: '箭头' },
    { name: 'MoveLeft', label: '左移', category: '箭头' },
    { name: 'MoveRight', label: '右移', category: '箭头' },
    { name: 'CornerUpLeft', label: '左上角', category: '箭头' },
    { name: 'CornerUpRight', label: '右上角', category: '箭头' },
    { name: 'CornerDownLeft', label: '左下角', category: '箭头' },
    { name: 'CornerDownRight', label: '右下角', category: '箭头' },
    
    // 媒体控制
    { name: 'Play', label: '播放', category: '控制' },
    { name: 'Pause', label: '暂停', category: '控制' },
    { name: 'Stop', label: '停止', category: '控制' },
    { name: 'SkipBack', label: '后退', category: '控制' },
    { name: 'SkipForward', label: '前进', category: '控制' },
    { name: 'FastForward', label: '快进', category: '控制' },
    { name: 'Rewind', label: '快退', category: '控制' },
    { name: 'Repeat', label: '重复', category: '控制' },
    { name: 'Repeat1', label: '重复一次', category: '控制' },
    { name: 'Shuffle', label: '随机', category: '控制' },
    { name: 'RefreshCw', label: '刷新', category: '控制' },
    { name: 'RefreshCcw', label: '逆时针刷新', category: '控制' },
    { name: 'RotateCcw', label: '逆时针旋转', category: '控制' },
    { name: 'RotateCw', label: '顺时针旋转', category: '控制' },
    
    // 设备
    { name: 'Monitor', label: '显示器', category: '设备' },
    { name: 'MonitorOff', label: '关闭显示器', category: '设备' },
    { name: 'MonitorSmartphone', label: '多设备', category: '设备' },
    { name: 'Smartphone', label: '手机', category: '设备' },
    { name: 'SmartphoneCharging', label: '充电中', category: '设备' },
    { name: 'Tablet', label: '平板', category: '设备' },
    { name: 'Laptop', label: '笔记本', category: '设备' },
    { name: 'Laptop2', label: '笔记本2', category: '设备' },
    { name: 'Tv', label: '电视', category: '设备' },
    { name: 'Tv2', label: '电视2', category: '设备' },
    { name: 'Printer', label: '打印机', category: '设备' },
    { name: 'Usb', label: 'USB', category: '设备' },
    { name: 'Bluetooth', label: '蓝牙', category: '设备' },
    { name: 'BluetoothOff', label: '关闭蓝牙', category: '设备' },
    { name: 'Battery', label: '电池', category: '设备' },
    { name: 'BatteryCharging', label: '充电', category: '设备' },
    { name: 'BatteryLow', label: '低电量', category: '设备' },
    { name: 'BatteryWarning', label: '电量警告', category: '设备' },
    { name: 'Plug', label: '插头', category: '设备' },
    { name: 'PlugZap', label: '电源', category: '设备' },
    
    // 天气与自然
    { name: 'Sun', label: '太阳', category: '天气' },
    { name: 'SunMedium', label: '中等太阳', category: '天气' },
    { name: 'SunDim', label: '暗淡太阳', category: '天气' },
    { name: 'Moon', label: '月亮', category: '天气' },
    { name: 'MoonStar', label: '星月', category: '天气' },
    { name: 'Cloud', label: '云', category: '天气' },
    { name: 'CloudSun', label: '多云', category: '天气' },
    { name: 'CloudMoon', label: '夜间多云', category: '天气' },
    { name: 'CloudRain', label: '下雨', category: '天气' },
    { name: 'CloudSnow', label: '下雪', category: '天气' },
    { name: 'CloudLightning', label: '雷电', category: '天气' },
    { name: 'CloudFog', label: '雾', category: '天气' },
    { name: 'CloudDrizzle', label: '毛毛雨', category: '天气' },
    { name: 'CloudOff', label: '无云', category: '天气' },
    { name: 'Rain', label: '雨', category: '天气' },
    { name: 'Snowflake', label: '雪花', category: '天气' },
    { name: 'Wind', label: '风', category: '天气' },
    { name: 'Thermometer', label: '温度计', category: '天气' },
    { name: 'ThermometerSun', label: '温度', category: '天气' },
    { name: 'Umbrella', label: '雨伞', category: '天气' },
    
    // 表情与符号
    { name: 'Smile', label: '微笑', category: '表情' },
    { name: 'SmilePlus', label: '添加微笑', category: '表情' },
    { name: 'Meh', label: '无表情', category: '表情' },
    { name: 'Frown', label: '皱眉', category: '表情' },
    { name: 'Laugh', label: '大笑', category: '表情' },
    { name: 'Heart', label: '心形', category: '表情' },
    { name: 'HeartHandshake', label: '握手心', category: '表情' },
    { name: 'HeartPulse', label: '心跳', category: '表情' },
    { name: 'HeartOff', label: '空心', category: '表情' },
    { name: 'Star', label: '星星', category: '表情' },
    { name: 'StarHalf', label: '半星', category: '表情' },
    { name: 'StarOff', label: '空星', category: '表情' },
    { name: 'ThumbsUp', label: '点赞', category: '表情' },
    { name: 'ThumbsDown', label: '踩', category: '表情' },
    { name: 'Award', label: '奖杯', category: '表情' },
    { name: 'Trophy', label: '奖杯', category: '表情' },
    { name: 'Medal', label: '奖章', category: '表情' },
    { name: 'Crown', label: '皇冠', category: '表情' },
    { name: 'Sparkles', label: '闪光', category: '表情' },
    { name: 'Flame', label: '火焰', category: '表情' },
    { name: 'Zap', label: '闪电', category: '表情' },
    { name: 'ZapOff', label: '关闭闪电', category: '表情' },
    
    // 标签与标记
    { name: 'Tag', label: '标签', category: '标记' },
    { name: 'Tags', label: '标签组', category: '标记' },
    { name: 'Flag', label: '旗帜', category: '标记' },
    { name: 'FlagOff', label: '取消旗帜', category: '标记' },
    { name: 'FlagTriangleRight', label: '右三角旗', category: '标记' },
    { name: 'FlagTriangleLeft', label: '左三角旗', category: '标记' },
    { name: 'Pin', label: '大头针', category: '标记' },
    { name: 'PinOff', label: '取消固定', category: '标记' },
    { name: 'Circle', label: '圆', category: '标记' },
    { name: 'CircleDot', label: '圆点', category: '标记' },
    { name: 'CircleCheck', label: '圆勾', category: '标记' },
    { name: 'CircleX', label: '圆叉', category: '标记' },
    { name: 'CircleAlert', label: '圆警告', category: '标记' },
    { name: 'CircleHelp', label: '圆问号', category: '标记' },
    { name: 'CirclePlus', label: '圆加', category: '标记' },
    { name: 'CircleMinus', label: '圆减', category: '标记' },
    { name: 'CircleSlash', label: '圆斜杠', category: '标记' },
    { name: 'Square', label: '方框', category: '标记' },
    { name: 'SquareCheck', label: '方勾', category: '标记' },
    { name: 'SquareX', label: '方叉', category: '标记' },
    { name: 'Triangle', label: '三角', category: '标记' },
    { name: 'TriangleAlert', label: '三角警告', category: '标记' },
    { name: 'Diamond', label: '菱形', category: '标记' },
    { name: 'Hexagon', label: '六边形', category: '标记' },
    { name: 'Octagon', label: '八边形', category: '标记' },
    
    // 上传下载
    { name: 'Download', label: '下载', category: '传输' },
    { name: 'DownloadCloud', label: '云端下载', category: '传输' },
    { name: 'Upload', label: '上传', category: '传输' },
    { name: 'UploadCloud', label: '云端上传', category: '传输' },
    { name: 'CloudDownload', label: '云下载', category: '传输' },
    { name: 'CloudUpload', label: '云上传', category: '传输' },
    { name: 'Share', label: '分享', category: '传输' },
    { name: 'Share2', label: '分享2', category: '传输' },
    { name: 'Share3', label: '分享3', category: '传输' },
    { name: 'Forward', label: '转发', category: '传输' },
    { name: 'Reply', label: '回复', category: '传输' },
    { name: 'ReplyAll', label: '回复全部', category: '传输' },
    
    // 其他
    { name: 'Info', label: '信息', category: '其他' },
    { name: 'HelpCircle', label: '帮助', category: '其他' },
    { name: 'LifeBuoy', label: '救生圈', category: '其他' },
    { name: 'Lightbulb', label: '灯泡', category: '其他' },
    { name: 'LightbulbOff', label: '关灯', category: '其他' },
    { name: 'Eye', label: '眼睛', category: '其他' },
    { name: 'EyeOff', label: '闭眼', category: '其他' },
    { name: 'Scan', label: '扫描', category: '其他' },
    { name: 'ScanLine', label: '扫描线', category: '其他' },
    { name: 'Focus', label: '聚焦', category: '其他' },
    { name: 'Crosshair', label: '十字准星', category: '其他' },
    { name: 'Target', label: '目标', category: '其他' },
    { name: 'Cross', label: '十字', category: '其他' },
    { name: 'MinusCircle', label: '减号圆', category: '其他' },
    { name: 'PlusCircle', label: '加号圆', category: '其他' },
    { name: 'List', label: '列表', category: '其他' },
    { name: 'ListOrdered', label: '有序列表', category: '其他' },
    { name: 'ListChecks', label: '检查列表', category: '其他' },
    { name: 'ListFilter', label: '过滤列表', category: '其他' },
    { name: 'ListTree', label: '树形列表', category: '其他' },
    { name: 'TreeDeciduous', label: '落叶树', category: '其他' },
    { name: 'TreePine', label: '松树', category: '其他' },
    { name: 'Building', label: '建筑', category: '其他' },
    { name: 'Building2', label: '建筑2', category: '其他' },
    { name: 'Factory', label: '工厂', category: '其他' },
    { name: 'Store', label: '商店', category: '其他' },
    { name: 'Landmark', label: '地标', category: '其他' },
    { name: 'Home', label: '家', category: '其他' },
    { name: 'HomeIcon', label: '首页图标', category: '其他' },
    { name: 'Bed', label: '床', category: '其他' },
    { name: 'Armchair', label: '扶手椅', category: '其他' },
    { name: 'DoorOpen', label: '开门', category: '其他' },
    { name: 'DoorClosed', label: '关门', category: '其他' },
    { name: 'KeyRound', label: '圆钥匙', category: '其他' },
    { name: 'Fingerprint', label: '指纹', category: '其他' },
    { name: 'ScanFace', label: '人脸识别', category: '其他' },
    { name: 'IdCard', label: '身份证', category: '其他' },
    { name: 'Badge', label: '徽章', category: '其他' },
    { name: 'Ticket', label: '票据', category: '其他' },
    { name: 'CreditCard', label: '信用卡', category: '其他' },
    { name: 'Wallet', label: '钱包', category: '其他' },
    { name: 'Banknote', label: '钞票', category: '其他' },
    { name: 'Coins', label: '硬币', category: '其他' },
    { name: 'PiggyBank', label: '存钱罐', category: '其他' },
    { name: 'ShoppingBag', label: '购物袋', category: '其他' },
    { name: 'ShoppingCart', label: '购物车', category: '其他' },
    { name: 'Basket', label: '篮子', category: '其他' },
    { name: 'Package', label: '包裹', category: '其他' },
    { name: 'PackagePlus', label: '添加包裹', category: '其他' },
    { name: 'PackageCheck', label: '包裹检查', category: '其他' },
    { name: 'PackageX', label: '包裹错误', category: '其他' },
    { name: 'Truck', label: '卡车', category: '其他' },
    { name: 'Plane', label: '飞机', category: '其他' },
    { name: 'Car', label: '汽车', category: '其他' },
    { name: 'Bike', label: '自行车', category: '其他' },
    { name: 'Bus', label: '公交车', category: '其他' },
    { name: 'Train', label: '火车', category: '其他' },
    { name: 'Ship', label: '船', category: '其他' },
    { name: 'Rocket', label: '火箭', category: '其他' },
    { name: 'Satellite', label: '卫星', category: '其他' },
    { name: 'Radar', label: '雷达', category: '其他' },
];

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
    label?: string;
}

const IconComponent = ({ name, size = 20 }: { name: string; size?: number }) => {
    const Icon = (Icons as any)[name];
    if (!Icon) return <Icons.HelpCircle size={size} />;
    return <Icon size={size} />;
};

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('全部');

    const categories = ['全部', ...new Set(AVAILABLE_ICONS.map(icon => icon.category))];

    const filteredIcons = AVAILABLE_ICONS.filter(icon => {
        const matchSearch = icon.name.toLowerCase().includes(search.toLowerCase()) || icon.label.includes(search);
        const matchCategory = selectedCategory === '全部' || icon.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const selectedIcon = AVAILABLE_ICONS.find(icon => icon.name === value);

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600"
            >
                <div className="flex items-center gap-2">
                    {value ? (
                        <>
                            <IconComponent name={value} size={18} />
                            <span className="text-slate-700 dark:text-slate-300">
                                {selectedIcon?.label || value}
                            </span>
                        </>
                    ) : (
                        <span className="text-slate-400">选择图标</span>
                    )}
                </div>
                <Icons.ChevronDown size={16} className="text-slate-400" />
            </button>

            {isOpen && (
                <div 
                    className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg dark:bg-slate-800 dark:border-slate-700"
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="relative">
                            <Icons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="搜索图标..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-2 py-0.5 text-xs rounded-full transition-colors",
                                        selectedCategory === cat
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2" style={{ overscrollBehavior: 'contain' }}>
                        <div className="grid grid-cols-4 gap-1">
                            {filteredIcons.map(icon => (
                                <button
                                    key={icon.name}
                                    type="button"
                                    onClick={() => {
                                        onChange(icon.name);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-2 rounded-md transition-colors",
                                        value === icon.name
                                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                            : "hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-700 dark:text-slate-400"
                                    )}
                                    title={`${icon.label} (${icon.name})`}
                                >
                                    <IconComponent name={icon.name} size={20} />
                                    <span className="text-xs mt-1 truncate w-full text-center">{icon.label}</span>
                                </button>
                            ))}
                        </div>
                        {filteredIcons.length === 0 && (
                            <div className="text-center py-4 text-slate-400 text-sm">
                                未找到匹配的图标
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export { IconComponent, AVAILABLE_ICONS };
