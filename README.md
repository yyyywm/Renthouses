# 房屋管理系统

基于 Vue 3 + Express + SQLite 的轻量级房屋租赁管理解决方案。

## 功能模块

| 模块 | 功能 |
|------|------|
| 数据概览 | 房源统计、租客统计、本月收款、快捷入口 |
| 房源管理 | 房源列表、添加/编辑/删除、状态管理（空置/已租/维护中） |
| 租客管理 | 租客列表、添加/编辑/删除、查看租住房源 |
| 合同管理 | 合同上传（图片）、关联房源与租客、有效期管理 |
| 租金记录 | 收款记录、状态筛选、统计图表 |

## 技术栈

- **前端**: Vue 3 + Element Plus + Axios + Vue Router
- **后端**: Express.js + better-sqlite3 + JWT
- **构建**: Vite

## 项目结构

```
houses_manage/
├── client/                 # 前端 Vue 3 项目
│   ├── src/
│   │   ├── api/           # API 请求封装
│   │   ├── router/        # 路由配置
│   │   ├── views/         # 页面组件
│   │   ├── utils/         # 工具函数
│   │   └── main.js        # 入口文件
│   └── package.json
├── server/                 # 后端 Express 项目
│   ├── routes/            # API 路由
│   ├── middleware/        # 中间件（认证）
│   ├── database.js        # 数据库初始化
│   └── index.js           # 服务入口
├── .gitignore
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
# 安装前端依赖
cd client
npm install

# 安装后端依赖
cd ../server
npm install
```

### 启动服务

**开发模式**

```bash
# 启动前端（端口 5173）
cd client
npm run dev

# 启动后端（端口 5000）
cd server
npm start
```

**生产模式**

```bash
# 构建前端
cd client
npm run build

# 启动后端（会自动服务静态文件）
cd ../server
npm start
```

访问 http://localhost:5000

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/users/login | 用户登录 |
| POST | /api/users/register | 用户注册 |
| GET | /api/properties | 房源列表 |
| POST | /api/properties | 添加房源 |
| PUT | /api/properties/:id | 更新房源 |
| DELETE | /api/properties/:id | 删除房源 |
| GET | /api/tenants | 租客列表 |
| POST | /api/tenants | 添加租客 |
| GET | /api/contracts | 合同列表 |
| POST | /api/contracts | 创建合同 |
| GET | /api/rents | 租金记录 |
| POST | /api/rents | 记录收款 |
| POST | /api/upload/contract | 上传合同图片 |

## 配置说明

### 环境变量

在 `server/` 目录下创建 `.env` 文件：

```env
PORT=5000
JWT_SECRET=your-secret-key
```

### 数据库

数据存储在 `server/houses.db`，无需额外配置。

## 许可证

MIT
