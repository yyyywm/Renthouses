<template>
  <div class="properties-page">
    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索房源名称、地址..."
          prefix-icon="Search"
          clearable
          style="width: 280px"
        />
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px">
          <el-option label="空置" value="空置" />
          <el-option label="已租" value="已租" />
          <el-option label="维护中" value="维护中" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加房源
      </el-button>
    </div>

    <el-card>
      <el-table :data="filteredList" style="width: 100%" row-key="id">
        <el-table-column prop="name" label="房源名称" min-width="150">
          <template #default="{ row }">
            <div class="property-name">
              <el-icon><HomeFilled /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="monthly_rent" label="月租金" width="120" align="center">
          <template #default="{ row }">
            <span class="rent-amount">¥{{ row.monthly_rent.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积" width="100" align="center">
          <template #default="{ row }">{{ row.area }}m²</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前租客" min-width="140" align="center">
          <template #default="{ row }">
            <template v-if="row.tenant_name">
              <div class="tenant-info">
                <el-icon><User /></el-icon>
                <span>{{ row.tenant_name }}</span>
              </div>
            </template>
            <span v-else class="text-muted">-</span>
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
      <el-empty description="暂无房源数据">
        <el-button type="primary" @click="handleAdd">添加房源</el-button>
      </el-empty>
    </el-card>

    <!-- 表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑房源' : '添加房源'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入房源名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select v-model="form.type" placeholder="选择类型">
                <el-option label="整租" value="整租" />
                <el-option label="合租" value="合租" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="选择状态">
                <el-option label="空置" value="空置" />
                <el-option label="已租" value="已租" />
                <el-option label="维护中" value="维护中" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月租金" prop="monthly_rent">
              <el-input-number v-model="form.monthly_rent" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积" prop="area">
              <el-input-number v-model="form.area" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="房源描述（选填）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '添加房源' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProperties, createProperty, updateProperty, deleteProperty } from '@/api/properties.js'
import dayjs from 'dayjs'
import { Plus, HomeFilled, User, Edit, Delete } from '@element-plus/icons-vue'

const properties = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const searchKeyword = ref('')
const filterStatus = ref('')

const form = ref({
  name: '',
  address: '',
  type: '整租',
  status: '空置',
  monthly_rent: 0,
  area: 0,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入房源名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  monthly_rent: [{ required: true, message: '请输入租金', trigger: 'blur' }]
}

const filteredList = computed(() => {
  return properties.value.filter(p => {
    if (filterStatus.value && p.status !== filterStatus.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      if (!p.name.toLowerCase().includes(keyword) && !p.address.toLowerCase().includes(keyword)) {
        return false
      }
    }
    return true
  })
})

const getStatusType = (status) => {
  const types = { '空置': 'success', '已租': 'primary', '维护中': 'warning' }
  return types[status] || 'info'
}

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD')

const loadData = async () => {
  loading.value = true
  const res = await getProperties()
  loading.value = false
  if (res.code === 0) properties.value = res.data
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { name: '', address: '', type: '整租', status: '空置', monthly_rent: 0, area: 0, description: '' }
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
    const res = await deleteProperty(row.id)
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
    res = await updateProperty(form.value.id, form.value)
  } else {
    res = await createProperty(form.value)
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
.properties-page {
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

.property-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-name .el-icon {
  color: var(--primary-color);
}

.rent-amount {
  font-weight: 600;
  color: #52c41a;
}

.tenant-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-primary);
}

.tenant-info .el-icon {
  color: var(--primary-color);
}

.text-muted {
  color: #909399;
}

.empty-card {
  margin-top: 20px;
}

.empty-card :deep(.el-card__body) {
  padding: 40px;
}
</style>
