import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { initDatabase } from './database.js'
import userRoutes from './routes/users.js'
import propertyRoutes from './routes/properties.js'
import tenantRoutes from './routes/tenants.js'
import contractRoutes from './routes/contracts.js'
import rentRoutes from './routes/rents.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 配置multer（临时文件上传后立即转换并删除）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 JPG/PNG/GIF/WEBP 格式的图片'))
    }
  }
})

// 初始化数据库
initDatabase()

// API 路由
app.use('/api/users', userRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/tenants', tenantRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/rents', rentRoutes)

// 文件上传接口 - 返回 base64 数据存储到数据库
app.post('/api/upload/contract', upload.single('contract'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, message: '请选择文件' })
    }

    // 直接从内存读取并转换为 base64
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    res.json({
      code: 0,
      data: {
        image: base64Data,
        filename: req.file.originalname
      },
      message: '上传成功'
    })
  } catch (err) {
    res.status(500).json({ code: 1, message: '上传失败' })
  }
})

// 路由列表
app.get('/api/routes', (req, res) => {
  const routes = [
    { method: 'GET', path: '/api/properties', description: '获取房源列表' },
    { method: 'GET', path: '/api/properties/:id', description: '获取单个房源' },
    { method: 'POST', path: '/api/properties', description: '创建房源' },
    { method: 'PUT', path: '/api/properties/:id', description: '更新房源' },
    { method: 'DELETE', path: '/api/properties/:id', description: '删除房源' },
    { method: 'GET', path: '/api/tenants', description: '获取租客列表' },
    { method: 'GET', path: '/api/tenants/:id', description: '获取单个租客' },
    { method: 'POST', path: '/api/tenants', description: '创建租客' },
    { method: 'PUT', path: '/api/tenants/:id', description: '更新租客' },
    { method: 'DELETE', path: '/api/tenants/:id', description: '删除租客' },
    { method: 'GET', path: '/api/contracts', description: '获取合同列表' },
    { method: 'GET', path: '/api/contracts/:id', description: '获取单个合同' },
    { method: 'POST', path: '/api/contracts', description: '创建合同' },
    { method: 'PUT', path: '/api/contracts/:id', description: '更新合同' },
    { method: 'DELETE', path: '/api/contracts/:id', description: '删除合同' },
    { method: 'POST', path: '/api/upload/contract', description: '上传合同图片' },
    { method: 'GET', path: '/api/rents', description: '获取租金记录列表' },
    { method: 'GET', path: '/api/rents/:id', description: '获取单条记录' },
    { method: 'POST', path: '/api/rents', description: '创建租金记录' },
    { method: 'PUT', path: '/api/rents/:id', description: '更新租金记录' },
    { method: 'DELETE', path: '/api/rents/:id', description: '删除租金记录' },
    { method: 'GET', path: '/api/routes', description: '获取路由列表' }
  ]
  res.json({ code: 0, data: routes })
})

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client/dist')))

// SPA 路由支持
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`合同图片存储: 数据库 BASE64 编码`)
})
