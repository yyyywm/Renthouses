import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../database.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password) {
      return res.status(400).json({ code: 1, message: '用户名和密码不能为空' })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ code: 1, message: '用户名长度需为3-20位' })
    }

    if (password.length < 6) {
      return res.status(400).json({ code: 1, message: '密码长度需至少6位' })
    }

    // 检查用户是否存在
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existingUser) {
      return res.status(400).json({ code: 1, message: '用户名已存在' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const result = db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run(username, hashedPassword, role || 'user')

    const token = generateToken({
      id: result.lastInsertRowid,
      username,
      role: role || 'user'
    })

    res.json({
      code: 0,
      data: {
        user: { id: result.lastInsertRowid, username, role: role || 'user' },
        token
      },
      message: '注册成功'
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ code: 1, message: '注册失败' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ code: 1, message: '用户名和密码不能为空' })
    }

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user) {
      return res.status(401).json({ code: 1, message: '用户名或密码错误' })
    }

    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ code: 1, message: '用户名或密码错误' })
    }

    // 生成Token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    })

    res.json({
      code: 0,
      data: {
        user: { id: user.id, username: user.username, role: user.role },
        token
      },
      message: '登录成功'
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ code: 1, message: '登录失败' })
  }
})

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }
    res.json({ code: 0, data: user })
  } catch (err) {
    res.status(500).json({ code: 1, message: '获取用户信息失败' })
  }
})

// 修改密码
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 1, message: '旧密码和新密码都不能为空' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ code: 1, message: '新密码长度需至少6位' })
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ code: 1, message: '用户不存在' })
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password)
    if (!validPassword) {
      return res.status(401).json({ code: 1, message: '旧密码错误' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id)

    res.json({ code: 0, message: '密码修改成功' })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ code: 1, message: '密码修改失败' })
  }
})

// 创建默认管理员（如果没有）
router.post('/init-admin', async (req, res) => {
  try {
    const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
    if (admin) {
      return res.json({ code: 0, message: '管理员已存在' })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)
    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run('admin', hashedPassword, 'admin')

    res.json({ code: 0, message: '默认管理员创建成功，用户名: admin，密码: admin123' })
  } catch (err) {
    res.status(500).json({ code: 1, message: '初始化失败' })
  }
})

export default router
