<template>
  <div class="rents-page">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索房源、租客..."
          prefix-icon="Search"
          clearable
          style="width: 280px"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="已支付" value="已支付" />
          <el-option label="未支付" value="未支付" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        记录收款
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon paid">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ stats.paidAmount }}</div>
          <div class="stat-label">已收款</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon unpaid">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ stats.unpaidAmount }}</div>
          <div class="stat-label">未收款</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon><Wallet /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">¥{{ stats.totalAmount }}</div>
          <div class="stat-label">总金额</div>
        </div>
      </div>
    </div>

    <el-card>
      <el-table :data="filteredList" style="width: 100%" row-key="id">
        <el-table-column prop="property_name" label="房源" min-width="150">
          <template #default="{ row }">
            <div class="rent-info">
              <el-icon class="info-icon"><HomeFilled /></el-icon>
              <div class="info-detail">
                <div class="info-name">{{ row.property_name }}</div>
                <div class="info-address">{{ row.tenant_name }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="130" align="center">
          <template #default="{ row }">
            <span class="amount-value">¥{{ row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pay_date" label="支付日期" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.remark">{{ row.remark }}</span>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="150" align="center">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 空状态 -->
    <el-card v-if="filteredList.length === 0 && !loading" class="empty-card">
      <el-empty description="暂无租金记录">
        <el-button type="primary" @click="handleAdd">记录收款</el-button>
      </el-empty>
    </el-card>

    <!-- 表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑记录' : '记录收款'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="合同" prop="contract_id">
          <el-select v-model="form.contract_id" placeholder="选择合同" style="width: 100%" @change="handleContractChange">
            <el-option
              v-for="c in activeContracts"
              :key="c.id"
              :label="c.property_name + ' - ' + c.tenant_name"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付日期" prop="pay_date">
              <el-date-picker v-model="form.pay_date" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="已支付" value="已支付" />
                <el-option label="未支付" value="未支付" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="添加备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '记录收款' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRents, createRent, updateRent, deleteRent } from '@/api/rents.js'
import { getContracts } from '@/api/contracts.js'
import dayjs from 'dayjs'
import { Plus, HomeFilled, Edit, Delete, CircleCheck, Clock, Wallet } from '@element-plus/icons-vue'

const rents = ref([])
const contracts = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const searchKeyword = ref('')
const filterStatus = ref('')

const form = ref({
  contract_id: null,
  amount: 0,
  pay_date: '',
  status: '已支付',
  remark: ''
})

const rules = {
  contract_id: [{ required: true, message: '请选择合同', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  pay_date: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const activeContracts = computed(() => {
  return contracts.value.filter(c => c.status === '生效')
})

const filteredList = computed(() => {
  return rents.value.filter(r => {
    if (filterStatus.value && r.status !== filterStatus.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      if (!r.property_name.toLowerCase().includes(keyword) && !r.tenant_name.toLowerCase().includes(keyword)) {
        return false
      }
    }
    return true
  })
})

const stats = computed(() => {
  const paid = rents.value.filter(r => r.status === '已支付').reduce((sum, r) => sum + (r.amount || 0), 0)
  const unpaid = rents.value.filter(r => r.status === '未支付').reduce((sum, r) => sum + (r.amount || 0), 0)
  return {
    paidAmount: paid.toLocaleString(),
    unpaidAmount: unpaid.toLocaleString(),
    totalAmount: (paid + unpaid).toLocaleString()
  }
})

const getStatusType = (status) => {
  const types = { '已支付': 'success', '未支付': 'warning' }
  return types[status] || 'info'
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const loadData = async () => {
  loading.value = true
  const [rentRes, contractRes] = await Promise.all([
    getRents(),
    getContracts()
  ])
  loading.value = false
  if (rentRes.code === 0) rents.value = rentRes.data
  if (contractRes.code === 0) contracts.value = contractRes.data
}

const handleContractChange = (contractId) => {
  const contract = contracts.value.find(c => c.id === contractId)
  if (contract && !isEdit.value) {
    form.value.amount = contract.monthly_rent
    if (!form.value.pay_date) {
      form.value.pay_date = dayjs().format('YYYY-MM-DD')
    }
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    contract_id: null,
    amount: 0,
    pay_date: dayjs().format('YYYY-MM-DD'),
    status: '已支付',
    remark: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该记录吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await deleteRent(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  let res
  if (isEdit.value) {
    res = await updateRent(form.value.id, form.value)
  } else {
    res = await createRent(form.value)
  }
  submitting.value = false

  if (res.code === 0) {
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.rents-page {
  max-width: 1400px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  gap: 12px;
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--box-shadow-light);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-icon.paid {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.stat-icon.unpaid {
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
}

.stat-icon.total {
  background: var(--primary-light);
  color: var(--primary-color);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 表格 */
.rent-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  color: var(--primary-color);
  font-size: 20px;
}

.info-detail {
  flex: 1;
}

.info-name {
  font-weight: 500;
  color: var(--text-primary);
}

.info-address {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.amount-value {
  font-weight: 600;
  color: #52c41a;
  font-size: 15px;
}

.text-placeholder {
  color: var(--text-placeholder);
}

.empty-card {
  margin-top: 20px;
}

.empty-card :deep(.el-card__body) {
  padding: 40px;
}
</style>
