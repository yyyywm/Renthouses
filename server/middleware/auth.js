import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'houses-manage-secret-key-2024'

// 生成Token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// 验证Token中间件
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1, message: '未登录或Token无效' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 1, message: 'Token已过期' })
    }
    return res.status(401).json({ code: 1, message: 'Token验证失败' })
  }
}

// 可选认证中间件（不强制要求登录）
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
    } catch (err) {
      // Token无效时不阻断请求
    }
  }
  next()
}

export default { generateToken, authMiddleware, optionalAuth }
