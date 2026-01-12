<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1>欢迎回来，管理员</h1>
        <p>今天是 {{ currentDate }}，祝您工作顺利</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, index) in statCards" :key="index">
        <div class="stat-bg-icon">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'" v-if="stat.trend !== undefined">
          <el-icon><component :is="stat.trend > 0 ? 'TrendCharts' : 'Bottom'" /></el-icon>
          <span>{{ Math.abs(stat.trend) }}%</span>
        </div>
      </div>
    </div>

    <!-- 数据展示区 -->
    <div class="data-section">
      <el-row :gutter="20">
        <!-- 最近房源 -->
        <el-col :span="12">
          <el-card class="data-card">
            <template #header>
              <div class="card-header">
                <span>最近房源</span>
                <el-button type="primary" link @click="$router.push('/properties')">
                  查看更多 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="list-content">
              <div v-if="recentProperties.length === 0" class="empty-tip">
                <el-icon size="48"><OfficeBuilding /></el-icon>
                <p>暂无房源数据</p>
              </div>
              <div v-else class="list-item" v-for="item in recentProperties" :key="item.id">
                <div class="item-icon">
                  <el-icon><HomeFilled /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-address">{{ item.address }}</div>
                </div>
                <el-tag :type="getStatusType(item.status)" size="small">{{ item.status }}</el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 最近租金记录 -->
        <el-col :span="12">
          <el-card class="data-card">
            <template #header>
              <div class="card-header">
                <span>最近租金记录</span>
                <el-button type="primary" link @click="$router.push('/rents')">
                  查看更多 <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="list-content">
              <div v-if="recentRents.length === 0" class="empty-tip">
                <el-icon size="48"><Money /></el-icon>
                <p>暂无租金记录</p>
              </div>
              <div v-else class="list-item" v-for="item in recentRents" :key="item.id">
                <div class="item-icon rent">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.property_name }}</div>
                  <div class="item-address">{{ item.tenant_name }}</div>
                </div>
                <div class="item-amount">¥{{ item.amount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>快捷操作</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button type="primary" @click="$router.push('/properties')">
            <el-icon><Plus /></el-icon>
            添加房源
          </el-button>
          <el-button type="success" @click="$router.push('/tenants')">
            <el-icon><UserFilled /></el-icon>
            添加租客
          </el-button>
          <el-button type="warning" @click="$router.push('/contracts')">
            <el-icon><Document /></el-icon>
            创建合同
          </el-button>
          <el-button type="info" @click="$router.push('/rents')">
            <el-icon><Money /></el-icon>
            记录收款
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProperties } from '@/api/properties.js'
import { getTenants } from '@/api/tenants.js'
import { getRents } from '@/api/rents.js'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  HomeFilled, User, Money, ArrowRight, OfficeBuilding,
  Plus, UserFilled, Document, TrendCharts, Bottom
} from '@element-plus/icons-vue'

dayjs.locale('zh-cn')

const properties = ref([])
const tenants = ref([])
const rents = ref([])

const currentDate = computed(() => dayjs().format('YYYY年M月D日 dddd'))

const statCards = computed(() => {
  const thisMonth = dayjs().format('YYYY-MM')
  const thisMonthRent = rents.value
    .filter(r => r.pay_date && r.pay_date.startsWith(thisMonth) && r.status === '已支付')
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  return [
    {
      label: '房源总数',
      value: properties.value.length,
      icon: 'HomeFilled',
      trend: 12
    },
    {
      label: '空置房源',
      value: properties.value.filter(p => p.status === '空置').length,
      icon: 'OfficeBuilding',
      trend: -5
    },
    {
      label: '租客数量',
      value: tenants.value.length,
      icon: 'User',
      trend: 8
    },
    {
      label: '本月收款',
      value: `¥${thisMonthRent.toLocaleString()}`,
      icon: 'Money',
      trend: 15
    }
  ]
})

const recentProperties = computed(() => properties.value.slice(0, 5))
const recentRents = computed(() => rents.value.slice(0, 5))

const getStatusType = (status) => {
  const types = {
    '空置': 'success',
    '已租': 'primary',
    '维护中': 'warning'
  }
  return types[status] || 'info'
}

onMounted(async () => {
  const [propRes, tenantRes, rentRes] = await Promise.all([
    getProperties(),
    getTenants(),
    getRents()
  ])

  if (propRes.code === 0) properties.value = propRes.data
  if (tenantRes.code === 0) tenants.value = tenantRes.data
  if (rentRes.code === 0) rents.value = rentRes.data
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  margin-bottom: 24px;
}

.welcome-content h1 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.welcome-content p {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: var(--box-shadow-light);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-duration);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-base);
}

.stat-bg-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6bb3f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-card:nth-child(2) .stat-bg-icon {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.stat-card:nth-child(3) .stat-bg-icon {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}

.stat-card:nth-child(4) .stat-bg-icon {
  background: linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-trend {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.stat-trend.up {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
}

.stat-trend.down {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

/* 数据区域 */
.data-section {
  margin-bottom: 24px;
}

.data-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-weight: 500;
  font-size: 16px;
}

.list-content {
  min-height: 200px;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-placeholder);
}

.empty-tip p {
  margin-top: 12px;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-light);
  gap: 12px;
}

.list-item:last-child {
  border-bottom: none;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.item-icon.rent {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-address {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-amount {
  font-size: 16px;
  font-weight: 600;
  color: #52c41a;
}

/* 快捷操作 */
.quick-actions .action-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  height: 48px;
  padding: 0 24px;
  border-radius: var(--border-radius-base);
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .data-section .el-row {
    margin: 0 !important;
  }

  .data-section .el-col {
    margin-bottom: 16px;
    padding: 0 !important;
  }
}
</style>
