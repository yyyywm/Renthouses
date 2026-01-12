<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo-area">
        <div class="logo-icon">
          <el-icon size="28"><House /></el-icon>
        </div>
        <div class="logo-text">
          <span class="title">房屋管理</span>
          <span class="subtitle">Property Manager</span>
        </div>
      </div>

      <nav class="nav-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" @click="showUserMenu = !showUserMenu">
          <el-avatar :size="36" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-detail">
            <span class="user-name">{{ user?.username || '用户' }}</span>
            <span class="user-role">{{ user?.role === 'admin' ? '管理员' : '普通用户' }}</span>
          </div>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>

        <!-- 用户菜单 -->
        <transition name="slide-up">
          <div v-if="showUserMenu" class="user-menu">
            <div class="user-menu-item" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </div>
          </div>
        </transition>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部Header -->
      <header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="welcome-text">欢迎，{{ user?.username }}</span>
        </div>
      </header>

      <!-- 页面内容 -->
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  House, DataAnalysis, HomeFilled, User, Document, Money,
  ArrowDown, SwitchButton
} from '@element-plus/icons-vue'
import { getUser, logout } from '@/utils/auth.js'

const route = useRoute()
const router = useRouter()
const showUserMenu = ref(false)
const user = ref(null)

const menuItems = [
  { name: '数据概览', path: '/', icon: DataAnalysis },
  { name: '房源管理', path: '/properties', icon: HomeFilled },
  { name: '租客管理', path: '/tenants', icon: User },
  { name: '合同管理', path: '/contracts', icon: Document },
  { name: '租金记录', path: '/rents', icon: Money }
]

const pageTitle = computed(() => {
  const titles = {
    '/': '数据概览',
    '/properties': '房源管理',
    '/tenants': '租客管理',
    '/contracts': '合同管理',
    '/rents': '租金记录'
  }
  return titles[route.path] || '房屋管理系统'
})

const handleLogout = () => {
  logout()
  router.push('/login')
}

onMounted(() => {
  user.value = getUser()
})
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: var(--bg-color);
}

/* 侧边栏样式 */
.sidebar {
  width: 260px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.logo-area {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  border-bottom: 1px solid var(--border-color-light);
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6bb3f0 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-text .title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.logo-text .subtitle {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: var(--border-radius-base);
  color: var(--text-regular);
  text-decoration: none;
  transition: all var(--transition-duration);
}

.nav-item:hover {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.nav-item.active {
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 14px;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color-light);
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--border-radius-base);
  cursor: pointer;
  transition: background-color var(--transition-duration);
}

.user-info:hover {
  background-color: var(--bg-color);
}

.user-avatar {
  background-color: var(--primary-light);
  color: var(--primary-color);
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.user-role {
  font-size: 12px;
  color: var(--text-secondary);
}

.dropdown-icon {
  color: var(--text-secondary);
  font-size: 12px;
}

/* 用户菜单 */
.user-menu {
  position: absolute;
  bottom: 70px;
  left: 20px;
  right: 20px;
  background: var(--card-bg);
  border-radius: var(--border-radius-base);
  box-shadow: var(--box-shadow-base);
  overflow: hidden;
  z-index: 100;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--transition-duration);
}

.user-menu-item:hover {
  background-color: #fff2f0;
  color: #ff4d4f;
}

/* 滑入动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.header {
  height: 70px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.welcome-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
