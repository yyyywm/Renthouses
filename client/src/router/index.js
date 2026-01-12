import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn, getToken } from '@/utils/auth.js'
import { getCurrentUser } from '@/utils/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'properties',
        name: 'Properties',
        component: () => import('@/views/properties/Index.vue')
      },
      {
        path: 'tenants',
        name: 'Tenants',
        component: () => import('@/views/tenants/Index.vue')
      },
      {
        path: 'contracts',
        name: 'Contracts',
        component: () => import('@/views/contracts/Index.vue')
      },
      {
        path: 'rents',
        name: 'Rents',
        component: () => import('@/views/rents/Index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const hasToken = isLoggedIn()

  if (requiresAuth && !hasToken) {
    // 需要登录但没有Token，跳转登录页
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'Login' && hasToken) {
    // 已登录但访问登录页，跳转首页
    next({ path: '/' })
    return
  }

  // 验证Token有效性
  if (hasToken) {
    try {
      await getCurrentUser()
    } catch (e) {
      // Token无效，清除并跳转登录
      localStorage.removeItem('houses_token')
      localStorage.removeItem('houses_user')
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
