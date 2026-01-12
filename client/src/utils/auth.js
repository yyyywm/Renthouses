// Token 管理工具

const TOKEN_KEY = 'houses_token'
const USER_KEY = 'houses_user'

// 保存Token
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

// 获取Token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

// 移除Token
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// 保存用户信息
export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// 获取用户信息
export function getUser() {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

// 移除用户信息
export function removeUser() {
  localStorage.removeItem(USER_KEY)
}

// 清除所有认证信息
export function clearAuth() {
  removeToken()
  removeUser()
}

// 判断是否已登录
export function isLoggedIn() {
  return !!getToken()
}

// 登出
export function logout() {
  clearAuth()
  window.location.href = '/login'
}

// 获取当前用户信息
export async function getCurrentUser() {
  const token = getToken()
  if (!token) return null

  try {
    const res = await fetch('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const data = await res.json()
    if (data.code === 0) {
      setUser(data.data)
      return data.data
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
  return null
}
