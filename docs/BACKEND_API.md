# VectorAdmin Pro 后端接口文档 (V4.0 - 权限增强版)

**技术栈**: Python (FastAPI/Flask) + MySQL (SQLAlchemy) + JWT + Celery (异步任务)
**通用响应格式**:
```json
{
  "code": 200, // 200:成功, 400:业务错误, 401:未登录, 403:无权限, 500:系统错误
  "data": {},  // 业务数据
  "message": "success" // 提示信息
}
```

**权限说明**:
- 所有需要登录的接口必须在 Header 中携带 `Authorization: Bearer <token>`
- 后端必须验证每个接口的权限，返回 403 表示无权限
- 权限标识格式: `模块:操作`，如 `vector:manage`、`system:view`
- `*` 表示拥有所有权限（仅 admin 角色）

---

## 1. 认证模块 (Auth Module)

### 1.1 发送验证码
- **URL**: `GET /api/auth/captcha`
- **权限**: 无需登录
- **涉及表**: `xl_captchas`
- **请求参数**: 无
- **响应字段**:
  - `key` (String): 验证码唯一标识 (UUID)
  - `image` (String): Base64 编码的图片数据
- **后端逻辑**:
  1. 生成 UUID (`key`) 和 4位随机字符 (`code`)。
  2. 生成验证码图片并转 Base64。
  3. **SQL**: `INSERT INTO xl_captchas (uuid, code, expire_at) VALUES (:key, :code, NOW() + INTERVAL 5 MINUTE)`。
  4. **SQL**: `DELETE FROM xl_captchas WHERE expire_at < NOW()` (懒惰清理)。

### 1.2 用户登录
- **URL**: `POST /api/auth/login`
- **权限**: 无需登录
- **涉及表**: `xl_users`, `xl_captchas`, `xl_system_logs`
- **请求字段**:
  - `username` (String): 用户名
  - `password` (String): 密码 (明文，后端校验时加密比对)
  - `captcha` (String): 用户输入的验证码
  - `key` (String): 验证码 UUID
- **响应字段**:
  - `token` (String): JWT Token
- **后端逻辑**:
  1. **验证码校验**: `SELECT code FROM xl_captchas WHERE uuid = :key`。比对失败返回 400。
  2. **查询用户**: `SELECT * FROM xl_users WHERE username = :username AND is_deleted = 0`。
  3. **状态校验**: 若 `status != 1`，返回 403 "账户已被停用"。
  4. **密码校验**: `bcrypt.checkpw(password, user.password_hash)`。
  5. **生成 Token**: Payload `{ sub: user.id, role: user.role_key, exp: ... }`。
  6. **更新登录时间**: `UPDATE xl_users SET last_login_time = NOW() WHERE id = :user_id`。
  7. **记录日志**: `INSERT INTO xl_system_logs (type, action, user_id, ...) VALUES ('login', 'USER_LOGIN', ...)`。
  8. **删除验证码**: `DELETE FROM xl_captchas WHERE uuid = :key`。

### 1.3 获取个人信息与菜单（核心接口）
- **URL**: `GET /api/auth/me`
- **权限**: 需要登录
- **涉及表**: `xl_users`, `xl_menus`, `xl_roles`
- **请求参数**: Header `Authorization: Bearer <token>`
- **响应字段**:
  ```json
  {
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "email": "admin@example.com",
      "phone": "13800138000",
      "avatar": null,
      "role": "admin",
      "roleKey": "admin",
      "permissions": ["*"],
      "status": "active"
    },
    "menus": [
      {
        "id": 1,
        "parentId": 0,
        "title": "仪表盘",
        "path": "/dashboard",
        "icon": "LayoutDashboard",
        "sort": 1,
        "isVisible": true,
        "perms": "dashboard:view",
        "roles": ["admin", "editor", "viewer"],
        "children": []
      }
    ]
  }
  ```
- **后端逻辑**:
  1. **解析 Token**: 获取 `user_id` 和 `role`。
  2. **查询用户**: 
     ```sql
     SELECT id, username, nickname, email, phone, avatar, role_key, status 
     FROM xl_users WHERE id = :user_id AND is_deleted = 0
     ```
  3. **查询角色权限**: 
     ```sql
     SELECT permissions FROM xl_roles WHERE role_key = :role_key
     ```
     - 解析 JSON 字段获取权限数组
     - admin 角色返回 `["*"]`
  4. **查询菜单**: 
     ```sql
     SELECT * FROM xl_menus WHERE is_visible = 1 AND is_deleted = 0 ORDER BY sort ASC
     ```
  5. **权限过滤菜单**: 
     - 遍历菜单项，解析 `roles` (JSON字段)
     - 若 `user.role_key == 'admin'` 或 `user.role_key in menu.roles`，则保留
  6. **构建树形结构**: 将扁平数据按 `parent_id` 转换为树形结构
  7. **组装响应**: 返回 user（含 permissions）和 menus

---

## 2. 个人中心 (Profile Module)

### 2.1 获取个人信息
- **URL**: `GET /api/profile`
- **权限**: 需要登录
- **涉及表**: `xl_users`
- **逻辑**: 复用 `/auth/me` 逻辑，仅返回 `user` 对象。

### 2.2 保存个人信息
- **URL**: `PUT /api/profile`
- **权限**: 需要登录
- **涉及表**: `xl_users`
- **请求字段**:
  - `email` (String)
  - `phone` (String)
  - `gender` (String): 'male'/'female'/'other'
  - `age` (Int)
  - `avatar` (String)
- **后端逻辑**:
  1. **SQL**: `UPDATE xl_users SET email=:email, phone=:phone, gender=:gender, age=:age, avatar=:avatar WHERE id=:current_user_id`。
  2. 禁止修改 `username` 和 `role_key`。

---

## 3. 仪表盘 (Dashboard Module)

### 3.1 业务统计 (卡片与趋势)
- **URL**: `GET /api/dashboard/stats`
- **权限**: `dashboard:view`
- **涉及表**: `xl_vectors`, `xl_system_logs`
- **响应字段**:
  - `totalVectors` (Int): `SELECT SUM(doc_count) FROM xl_vectors`
  - `dailyQueries` (Int): `SELECT COUNT(*) FROM xl_system_logs WHERE action = 'VECTOR_SEARCH' AND created_at > CURDATE()`
  - `trend` (Array): 近7天数据

### 3.2 系统控制台接口
1. **系统资源监控** (`GET /api/dashboard/resources`)
   - **权限**: `dashboard:view`
   - **响应**: `{ cpu: 45, memory: 60, disk: 30 }`

2. **后台任务队列** (`GET /api/dashboard/tasks`)
   - **权限**: `dashboard:view`
   - **涉及表**: `xl_tasks`

3. **执行任务进度** (`GET /api/dashboard/tasks/:id`)
   - **权限**: `dashboard:view`
   - **涉及表**: `xl_tasks`

4. **集群节点状态** (`GET /api/dashboard/nodes`)
   - **权限**: `dashboard:view`
   - 调用 Milvus/ChromaDB 健康检查接口

---

## 4. 向量管理 (Vector Module)

### 4.1 向量列表查询
- **URL**: `GET /api/vectors`
- **权限**: `vector:view`
- **涉及表**: `xl_vectors`
- **请求参数**: `page`, `pageSize`, `keyword`, `status`

### 4.2 启用/禁用切换
- **URL**: `PUT /api/vectors/:id/status`
- **权限**: `vector:manage`
- **涉及表**: `xl_vectors`
- **请求字段**: `isEnabled` (Boolean)

### 4.3 删除向量 (可多选)
- **URL**: `DELETE /api/vectors`
- **权限**: `vector:manage`
- **涉及表**: `xl_vectors`, `xl_tasks`
- **请求字段**: `ids` (Array<String>)

### 4.4 编辑向量
- **URL**: `PUT /api/vectors/:id`
- **权限**: `vector:manage`
- **涉及表**: `xl_vectors`
- **请求字段**: `title` (String)

### 4.5 配置定时任务
- **URL**: `POST /api/vectors/:id/sync-config`
- **权限**: `vector:manage`
- **涉及表**: `xl_vectors`
- **请求字段**: `enabled` (Boolean), `expression` (String - Cron)

### 4.6 导出向量 (Excel)
- **URL**: `GET /api/vectors/export`
- **权限**: `vector:view`
- **涉及表**: `xl_vectors`
- **请求参数**: `ids` (String, comma separated)

### 4.7 添加向量 (向导 - 辅助接口)
1. **查数据库列表**: `GET /api/vectors/wizard/databases`
   - **权限**: `vector:manage`
   - **涉及表**: `xl_db_connections`

2. **查表列表**: `GET /api/vectors/wizard/tables`
   - **权限**: `vector:manage`
   - **请求参数**: `dbId`

3. **查字段列表**: `GET /api/vectors/wizard/fields`
   - **权限**: `vector:manage`
   - **请求参数**: `tableId`

### 4.8 添加向量 (向导 - 提交接口)
- **URL**: `POST /api/vectors/create`
- **权限**: `vector:manage`
- **涉及表**: `xl_vectors`, `xl_tasks`
- **请求字段**:
  - `title`: 集合名称
  - `dbId`: 源数据库ID
  - `tableIds`: 表名数组
  - `fieldKeys`: 选中字段数组
  - `joinConfig`: 多表关联 JSON
  - `advancedConfig`: 索引配置 JSON

### 4.9 校验集合名称重复
- **URL**: `POST /api/vectors/check-name`
- **权限**: `vector:manage`
- **涉及表**: `xl_vectors`

---

## 5. 向量搜索 (Search Module)

### 5.1 向量库列表 (下拉框)
- **URL**: `GET /api/vectors/simple-list`
- **权限**: `vector:view`
- **涉及表**: `xl_vectors`

### 5.2 向量检索
- **URL**: `POST /api/search/vector`
- **权限**: `vector:search`
- **涉及表**: `xl_vectors`, `xl_system_logs`
- **请求字段**: `vectorId`, `query`, `type`, `topK`

---

## 6. 知识库模块 (Knowledge Base Module)

### 6.1 知识库配置列表
- **URL**: `GET /api/kb/config`
- **权限**: `kb:view`
- **涉及表**: `xl_knowledge_bases`

### 6.2 创建/编辑知识库
- **URL**: `POST /api/kb/config` 或 `PUT /api/kb/config/:id`
- **权限**: `kb:config`
- **涉及表**: `xl_knowledge_bases`

### 6.3 知识库检索
- **URL**: `POST /api/kb/retrieval`
- **权限**: `kb:retrieval`
- **请求字段**: `kbId`, `query`, `topK`

---

## 7. 工具模块 (Tools Module)

### 7.1 大模型输出清洁
- **URL**: `POST /api/tools/llm-clean`
- **权限**: `tools:clean`
- **请求字段**: `content` (String): 待清洁的文本
- **响应字段**: `result` (String): 清洁后的文本

---

## 8. 系统配置 (System Settings)

> 所有系统设置接口仅限 admin 角色访问

### 8.1 菜单管理
1. **查询菜单列表**: `GET /api/settings/menus`
   - **权限**: `system:view` (仅 admin)
   - **涉及表**: `xl_menus`

2. **菜单编辑**: `PUT /api/settings/menus/:id`
   - **权限**: `system:menus` (仅 admin)
   - **涉及表**: `xl_menus`
   - **请求字段**: `title`, `path`, `icon`, `sort`, `is_visible`, `roles` (JSON), `perms`

3. **新增菜单**: `POST /api/settings/menus`
   - **权限**: `system:menus` (仅 admin)
   - **涉及表**: `xl_menus`

4. **删除菜单**: `DELETE /api/settings/menus/:id`
   - **权限**: `system:menus` (仅 admin)
   - **涉及表**: `xl_menus`

### 8.2 角色管理
1. **列表**: `GET /api/settings/roles`
   - **权限**: `system:roles` (仅 admin)
   - **涉及表**: `xl_roles`

2. **配置权限**: `PUT /api/settings/roles/:id/permissions`
   - **权限**: `system:roles` (仅 admin)
   - **涉及表**: `xl_roles`
   - **请求字段**: `permissions` (JSON Array)

3. **编辑**: `PUT /api/settings/roles/:id`
   - **权限**: `system:roles` (仅 admin)

4. **删除**: `DELETE /api/settings/roles/:id`
   - **权限**: `system:roles` (仅 admin)

5. **新增**: `POST /api/settings/roles`
   - **权限**: `system:roles` (仅 admin)

### 8.3 用户管理
1. **列表**: `GET /api/settings/users`
   - **权限**: `system:users` (仅 admin)
   - **涉及表**: `xl_users`

2. **编辑**: `PUT /api/settings/users/:id`
   - **权限**: `system:users` (仅 admin)

3. **停用/启用**: `PUT /api/settings/users/:id/status`
   - **权限**: `system:users` (仅 admin)

4. **删除**: `DELETE /api/settings/users/:id`
   - **权限**: `system:users` (仅 admin)

5. **新增**: `POST /api/settings/users`
   - **权限**: `system:users` (仅 admin)

### 8.4 系统安全 (IP)
1. **列表**: `GET /api/settings/ips`
   - **权限**: `system:security` (仅 admin)
   - **涉及表**: `xl_ip_security`

2. **封禁/解封**: `PUT /api/settings/ips/:id/status`
   - **权限**: `system:security` (仅 admin)

3. **添加封禁**: `POST /api/settings/ips`
   - **权限**: `system:security` (仅 admin)

### 8.5 系统日志
1. **列表**: `GET /api/settings/logs`
   - **权限**: `system:logs` (仅 admin)
   - **涉及表**: `xl_system_logs`

2. **详情**: `GET /api/settings/logs/:id`
   - **权限**: `system:logs` (仅 admin)

3. **删除**: `DELETE /api/settings/logs`
   - **权限**: `system:logs` (仅 admin)

---

## 9. API 文档模块

### 9.1 获取 API 文档
- **URL**: `GET /api/api-docs`
- **权限**: `api:view`
- **响应**: 返回系统 API 文档内容

---

## 附录：权限标识对照表

| 权限标识 | 说明 | 对应路由 |
|---------|------|---------|
| `*` | 所有权限 | 仅 admin |
| `dashboard:view` | 查看仪表盘 | `/dashboard` |
| `vector:view` | 查看向量列表 | `/vector` |
| `vector:manage` | 管理向量（增删改） | `/vector` |
| `vector:search` | 向量搜索 | `/vector-search` |
| `kb:view` | 查看知识库 | `/kb/*` |
| `kb:config` | 配置知识库 | `/kb/config` |
| `kb:retrieval` | 知识库检索 | `/kb/retrieval` |
| `tools:view` | 查看工具 | `/tools/*` |
| `tools:clean` | 使用清洁工具 | `/tools/llm-clean` |
| `api:view` | 查看 API 文档 | `/api-docs` |
| `system:view` | 查看系统设置 | `/settings/*` |
| `system:menus` | 菜单管理 | `/settings/menus` |
| `system:roles` | 角色管理 | `/settings/roles` |
| `system:users` | 用户管理 | `/settings/users` |
| `system:security` | 系统安全 | `/settings/security` |
| `system:logs` | 系统日志 | `/settings/logs` |

---

## 附录：角色默认权限

| 角色 | 权限列表 |
|------|---------|
| `admin` | `["*"]` |
| `editor` | `["dashboard:view", "vector:view", "vector:manage", "vector:search", "kb:view", "kb:config", "kb:retrieval", "tools:view", "tools:clean", "api:view"]` |
| `viewer` | `["dashboard:view", "vector:view", "vector:search", "kb:view", "kb:retrieval", "api:view"]` |
