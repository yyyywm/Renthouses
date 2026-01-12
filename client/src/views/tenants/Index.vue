<template>
  <div class="tenants-page">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索租客姓名、电话..."
          prefix-icon="Search"
          clearable
          style="width: 280px"
        />
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加租客
      </el-button>
    </div>

    <el-card>
      <el-table :data="filteredList" style="width: 100%" row-key="id">
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="tenant-name">
              <el-avatar :size="32" class="tenant-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="id_card" label="身份证号" width="180" show-overflow-tooltip />
        <el-table-column prop="emergency_contact" label="紧急联系人" width="150">
          <template #default="{ row }">
            <span v-if="row.emergency_contact">{{ row.emergency_contact }}</span>
            <span v-else class="text-placeholder">未填写</span>
          </template>
        </el-table-column>
        <el-table-column label="租住房源" min-width="180">
          <template #default="{ row }">
            <template v-if="row.property_name">
              <div class="property-info">
                <el-icon><HomeFilled /></el-icon>
                <div class="property-detail">
                  <div class="property-name">{{ row.property_name }}</div>
                  <div class="property-address">{{ row.property_address }}</div>
                </div>
              </div>
            </template>
            <span v-else class="text-placeholder">暂无租住</span>
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
      <el-empty description="暂无租客数据">
        <el-button type="primary" @click="handleAdd">添加租客</el-button>
      </el-empty>
    </el-card>

    <!-- 表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑租客' : '添加租客'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入租客姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input v-model="form.id_card" placeholder="请输入身份证号（选填）" />
        </el-form-item>
        <el-form-item label="紧急联系人">
          <el-input v-model="form.emergency_contact" placeholder="请输入紧急联系人（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '添加租客' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTenants, createTenant, updateTenant, deleteTenant } from '@/api/tenants.js'
import dayjs from 'dayjs'
import { Plus, User, HomeFilled, Edit, Delete } from '@element-plus/icons-vue'

const tenants = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const searchKeyword = ref('')

const form = ref({
  name: '',
  phone: '',
  id_card: '',
  emergency_contact: ''
})

const rules = {
  name: [{ required: true, message: '请输入租客姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const filteredList = computed(() => {
  if (!searchKeyword.value) return tenants.value
  const keyword = searchKeyword.value.toLowerCase()
  return tenants.value.filter(t =>
    t.name.toLowerCase().includes(keyword) ||
    t.phone.includes(keyword)
  )
})

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const loadData = async () => {
  loading.value = true
  const res = await getTenants()
  loading.value = false
  if (res.code === 0) tenants.value = res.data
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { name: '', phone: '', id_card: '', emergency_contact: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await deleteTenant(row.id)
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
    res = await updateTenant(form.value.id, form.value)
  } else {
    res = await createTenant(form.value)
  }
  submitting.value = false

  if (res.code === 0) {
    ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
    dialogVisible.value = false
    loadData()
  } else {
    ElMessage.error(res.message || '操作失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.tenants-page {
  max-width: 1400px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tenant-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tenant-avatar {
  background: var(--primary-light);
  color: var(--primary-color);
}

.property-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-info .el-icon {
  color: var(--primary-color);
  font-size: 18px;
}

.property-detail {
  flex: 1;
  min-width: 0;
}

.property-name {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.property-address {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
