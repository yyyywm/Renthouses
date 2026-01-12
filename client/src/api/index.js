import axios from 'axios'
import { getToken, removeToken, removeUser } from '@/utils/auth.js'
import { ElMessage } from 'element-plus'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器 - 自动携带Token
api.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      const { status, data } = error.response

      // Token无效或过期
      if (status === 401) {
        removeToken()
        removeUser()
        ElMessage.error(data.message || '登录已过期，请重新登录')
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
      }

      return { code: 1, message: data.message || error.message }
    }
    console.error('API Error:', error)
    return { code: 1, message: error.message }
  }
)

export default api
