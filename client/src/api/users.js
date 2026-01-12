import { setToken, setUser, removeToken, removeUser, isLoggedIn } from '@/utils/auth.js'

// 登录
export async function login(username, password) {
  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.code === 0) {
      setToken(data.data.token)
      setUser(data.data.user)
    }
    return data
  } catch (err) {
    return { code: 1, message: err.message }
  }
}

// 注册
export async function register(username, password, role = 'user') {
  try {
    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    })
    const data = await res.json()
    if (data.code === 0) {
      setToken(data.data.token)
      setUser(data.data.user)
    }
    return data
  } catch (err) {
    return { code: 1, message: err.message }
  }
}

// 获取当前用户
export async function getUserInfo() {
  if (!isLoggedIn()) return { code: 1, message: '未登录' }

  try {
    const res = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('houses_token')}`
      }
    })
    return await res.json()
  } catch (err) {
    return { code: 1, message: err.message }
  }
}

// 修改密码
export async function changePassword(oldPassword, newPassword) {
  try {
    const res = await fetch('/api/users/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('houses_token')}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    })
    return await res.json()
  } catch (err) {
    return { code: 1, message: err.message }
  }
}

// 初始化管理员
export async function initAdmin() {
  try {
    const res = await fetch('/api/users/init-admin', {
      method: 'POST'
    })
    return await res.json()
  } catch (err) {
    return { code: 1, message: err.message }
  }
}
