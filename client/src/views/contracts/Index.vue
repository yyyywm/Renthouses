<template>
  <div class="contracts-page">
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
          <el-option label="生效" value="生效" />
          <el-option label="已到期" value="已到期" />
          <el-option label="已终止" value="已终止" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        上传合同
      </el-button>
    </div>

    <!-- 合同卡片列表 -->
    <div v-if="filteredList.length > 0" class="contract-grid">
      <div v-for="contract in filteredList" :key="contract.id" class="contract-card" @click="handleView(contract)">
        <!-- 卡片头部 - 关联信息展示 -->
        <div class="card-header">
          <!-- 房源信息 -->
          <div class="association-item property-item">
            <div class="item-icon">
              <el-icon><HomeFilled /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-title">{{ contract.property_name }}</div>
              <div class="item-sub">{{ contract.address }}</div>
            </div>
          </div>
          <!-- 连接线 -->
          <div class="connection-line">
            <el-icon><Right /></el-icon>
          </div>
          <!-- 租客信息 -->
          <div class="association-item tenant-item">
            <div class="item-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-title">{{ contract.tenant_name }}</div>
              <div class="item-sub">{{ contract.tenant_phone }}</div>
            </div>
          </div>
        </div>

        <!-- 合同图片预览 -->
        <div class="card-image" @click.stop>
          <el-image
            v-if="contract.contract_image"
            :src="contract.contract_image"
            fit="cover"
            :preview-src-list="[contract.contract_image]"
            @click.stop
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon size="40"><Document /></el-icon>
                <span>暂无图片</span>
              </div>
            </template>
          </el-image>
          <div v-else class="image-placeholder">
            <el-icon size="40"><Document /></el-icon>
            <span>未上传合同</span>
          </div>
          <div class="image-badge">
            <el-tag :type="getStatusType(contract.status)" size="small">{{ contract.status }}</el-tag>
          </div>
        </div>

        <!-- 卡片底部 - 租期和租金 -->
        <div class="card-footer">
          <div class="lease-info">
            <span class="date">{{ contract.start_date }}</span>
            <el-icon><Right /></el-icon>
            <span class="date">{{ contract.end_date }}</span>
          </div>
          <div class="rent-info">
            <span class="rent-amount">¥{{ contract.monthly_rent?.toLocaleString() }}</span>
            <span class="rent-label">/月</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="card-actions">
          <el-button type="primary" link size="small" @click.stop="handleEdit(contract)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" link size="small" @click.stop="handleDelete(contract)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-card v-if="filteredList.length === 0 && !loading" class="empty-card">
      <el-empty description="暂无合同数据">
        <el-button type="primary" @click="handleAdd">上传合同</el-button>
      </el-empty>
    </el-card>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑合同' : '上传合同'" width="800px" class="contract-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="14">
            <div class="form-block">
              <div class="block-header">
                <el-icon><Connection /></el-icon>
                <span>关联信息</span>
              </div>
              <el-form-item label="房源" prop="property_id">
                <el-select v-model="form.property_id" placeholder="请选择房源" style="width: 100%" @change="handlePropertyChange">
                  <el-option
                    v-for="p in properties"
                    :key="p.id"
                    :label="p.name + ' - ' + p.address"
                    :value="p.id"
                  >
                    <span>{{ p.name }}</span>
                    <span style="color: #909399; font-size: 12px; margin-left: 8px;">{{ p.address }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="租客" prop="tenant_id">
                <el-select v-model="form.tenant_id" placeholder="请选择租客" style="width: 100%">
                  <el-option
                    v-for="t in tenants"
                    :key="t.id"
                    :label="t.name + ' (' + t.phone + ')'"
                    :value="t.id"
                  />
                </el-select>
              </el-form-item>
              <div class="form-inline">
                <el-form-item label="租期" prop="date_range" class="date-range-item">
                  <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    style="width: 100%"
                    @change="handleDateRangeChange"
                  />
                </el-form-item>
              </div>
              <div class="form-inline">
                <el-form-item label="租金" prop="monthly_rent" class="rent-item">
                  <el-input v-model="monthlyRentDisplay" placeholder="0.00" @blur="handleRentInput('monthly_rent')">
                    <template #append>元/月</template>
                  </el-input>
                </el-form-item>
                <el-form-item label="押金" class="deposit-item">
                  <el-input v-model="depositDisplay" placeholder="0.00" @blur="handleRentInput('deposit')">
                    <template #append>元</template>
                  </el-input>
                </el-form-item>
              </div>
              <el-form-item label="状态">
                <el-select v-model="form.status" style="width: 100%">
                  <el-option label="生效" value="生效" />
                  <el-option label="已到期" value="已到期" />
                  <el-option label="已终止" value="已终止" />
                </el-select>
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="10">
            <div class="upload-block">
              <div class="block-header">
                <el-icon><Picture /></el-icon>
                <span>合同图片</span>
              </div>
              <el-upload
                class="contract-uploader"
                :show-file-list="false"
                :auto-upload="false"
                accept="image/*"
                :on-change="handleImageChange"
              >
                <el-image v-if="previewImage" :src="previewImage" fit="contain" class="preview-image">
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon size="40"><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
                <div v-else class="upload-placeholder">
                  <el-icon size="48"><Plus /></el-icon>
                  <span>上传合同图片</span>
                  <span class="upload-tip">支持 JPG/PNG/GIF</span>
                </div>
              </el-upload>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '确认上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 合同详情查看弹窗 -->
    <el-dialog v-model="detailVisible" title="合同详情" width="800px">
      <div v-if="currentContract" class="contract-detail">
        <!-- 关联信息展示 -->
        <div class="detail-association">
          <div class="association-block">
            <div class="block-icon property">
              <el-icon><HomeFilled /></el-icon>
            </div>
            <div class="block-info">
              <div class="block-label">房源</div>
              <div class="block-value">{{ currentContract.property_name }}</div>
              <div class="block-sub">{{ currentContract.address }}</div>
            </div>
          </div>
          <div class="association-arrow">
            <el-icon size="24"><Right /></el-icon>
          </div>
          <div class="association-block">
            <div class="block-icon tenant">
              <el-icon><User /></el-icon>
            </div>
            <div class="block-info">
              <div class="block-label">租客</div>
              <div class="block-value">{{ currentContract.tenant_name }}</div>
              <div class="block-sub">{{ currentContract.tenant_phone }}</div>
            </div>
          </div>
        </div>

        <!-- 合同图片 -->
        <div class="detail-image" v-if="currentContract.contract_image">
          <el-image
            :src="currentContract.contract_image"
            :preview-src-list="[currentContract.contract_image]"
            fit="contain"
          />
        </div>
        <el-empty v-else description="暂无合同图片" />

        <!-- 合同信息 -->
        <div class="detail-info">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="月租金">¥{{ currentContract.monthly_rent?.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="押金">¥{{ currentContract.deposit?.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(currentContract.status)">{{ currentContract.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始日期">{{ currentContract.start_date }}</el-descriptions-item>
            <el-descriptions-item label="结束日期">{{ currentContract.end_date }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentContract.created_at }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getContracts, createContract, updateContract, deleteContract } from '@/api/contracts.js'
import { getProperties } from '@/api/properties.js'
import { getTenants } from '@/api/tenants.js'
import { uploadContractImage } from '@/api/upload.js'
import { Plus, HomeFilled, User, Right, Document, Edit, Delete, Picture, Connection } from '@element-plus/icons-vue'

const contracts = ref([])
const properties = ref([])
const tenants = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentContract = ref(null)
const formRef = ref(null)
const searchKeyword = ref('')
const filterStatus = ref('')

// 日期范围
const dateRange = ref([])

// 图片上传相关
const selectedFile = ref(null)
const previewImage = ref('')
const uploadProgress = ref(0)

// 金额输入显示用
const monthlyRentDisplay = ref('')
const depositDisplay = ref('')

const form = ref({
  property_id: null,
  tenant_id: null,
  contract_image: '',
  start_date: '',
  end_date: '',
  monthly_rent: 0,
  deposit: 0,
  status: '生效'
})

const rules = {
  property_id: [{ required: true, message: '请选择房源', trigger: 'change' }],
  tenant_id: [{ required: true, message: '请选择租客', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  monthly_rent: [{ required: true, message: '请输入租金', trigger: 'blur' }]
}

const filteredList = computed(() => {
  return contracts.value.filter(c => {
    if (filterStatus.value && c.status !== filterStatus.value) return false
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      if (!c.property_name?.toLowerCase().includes(keyword) &&
          !c.tenant_name?.toLowerCase().includes(keyword)) {
        return false
      }
    }
    return true
  })
})

const getStatusType = (status) => {
  const types = { '生效': 'success', '已到期': 'warning', '已终止': 'danger' }
  return types[status] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const [contractRes, propertyRes, tenantRes] = await Promise.all([
      getContracts(),
      getProperties(),
      getTenants()
    ])
    if (contractRes.code === 0) contracts.value = contractRes.data
    if (propertyRes.code === 0) properties.value = propertyRes.data
    if (tenantRes.code === 0) tenants.value = tenantRes.data
  } finally {
    loading.value = false
  }
}

const handlePropertyChange = (propertyId) => {
  const property = properties.value.find(p => p.id === propertyId)
  if (property && !isEdit.value) {
    form.value.monthly_rent = property.monthly_rent
    monthlyRentDisplay.value = property.monthly_rent?.toString() || ''
  }
}

// 处理日期范围变化
const handleDateRangeChange = (val) => {
  if (val) {
    form.value.start_date = val[0]
    form.value.end_date = val[1]
  } else {
    form.value.start_date = ''
    form.value.end_date = ''
  }
}

// 处理金额输入
const handleRentInput = (field) => {
  const value = field === 'monthly_rent' ? monthlyRentDisplay.value : depositDisplay.value
  const num = parseFloat(value)
  form.value[field] = isNaN(num) ? 0 : num
  // 重新格式化显示
  if (field === 'monthly_rent') {
    monthlyRentDisplay.value = form.value.monthly_rent?.toFixed(2) || '0.00'
  } else {
    depositDisplay.value = form.value.deposit?.toFixed(2) || '0.00'
  }
}

const handleImageChange = (file) => {
  const isImage = file.raw.type.startsWith('image/')
  const isLt10M = file.raw.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return
  }

  selectedFile.value = file.raw
  previewImage.value = URL.createObjectURL(file.raw)
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    property_id: null,
    tenant_id: null,
    contract_image: '',
    start_date: '',
    end_date: '',
    monthly_rent: 0,
    deposit: 0,
    status: '生效'
  }
  dateRange.value = []
  monthlyRentDisplay.value = ''
  depositDisplay.value = ''
  selectedFile.value = null
  previewImage.value = ''
  dialogVisible.value = true
}

const handleView = (row) => {
  currentContract.value = row
  detailVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dateRange.value = row.start_date && row.end_date ? [row.start_date, row.end_date] : []
  monthlyRentDisplay.value = row.monthly_rent?.toString() || ''
  depositDisplay.value = row.deposit?.toString() || ''
  previewImage.value = row.contract_image || ''
  selectedFile.value = null
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除该合同吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await deleteContract(row.id)
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
  try {
    // 如果有新图片，先上传获取 base64 数据
    if (selectedFile.value) {
      const uploadRes = await uploadContractImage(selectedFile.value)
      if (uploadRes.code === 0) {
        // 直接存储 base64 数据到数据库
        form.value.contract_image = uploadRes.data.image
      } else {
        ElMessage.error('图片上传失败')
        submitting.value = false
        return
      }
    }

    // 提交表单
    let res
    if (isEdit.value) {
      res = await updateContract(form.value.id, form.value)
    } else {
      res = await createContract(form.value)
    }

    if (res.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '上传成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.contracts-page {
  max-width: 1400px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
}

/* 卡片网格布局 */
.contract-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.contract-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #ebeef5;
}

.contract-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 卡片头部 - 关联信息 */
.card-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  gap: 8px;
}

.association-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  padding: 8px;
  border-radius: 8px;
}

.property-item {
  background: rgba(64, 158, 255, 0.1);
}

.tenant-item {
  background: rgba(103, 194, 58, 0.1);
}

.item-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.property-item .item-icon {
  background: var(--primary-color);
  color: #fff;
}

.tenant-item .item-icon {
  background: #67c23a;
  color: #fff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-sub {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connection-line {
  color: var(--primary-color);
  flex-shrink: 0;
}

/* 图片预览 */
.card-image {
  height: 180px;
  position: relative;
  background: #f5f7fa;
}

.card-image :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
}

.image-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
}

.lease-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.rent-info {
  display: flex;
  align-items: baseline;
}

.rent-amount {
  font-size: 18px;
  font-weight: 600;
  color: #52c41a;
}

.rent-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 2px;
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  border-top: 1px solid #f0f2f5;
}

/* 空状态 */
.empty-card {
  margin-top: 20px;
}

.empty-card :deep(.el-card__body) {
  padding: 40px;
}

/* 弹窗样式 */
.contract-dialog :deep(.el-dialog__body) {
  padding: 24px 24px 0;
}

.form-block,
.upload-block {
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
  height: 100%;
}

.block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.block-header .el-icon {
  color: var(--primary-color);
}

.form-inline {
  margin-bottom: 4px;
}

.date-range-item {
  width: 100%;
}

.rent-item {
  flex: 1.2;
}

.deposit-item {
  flex: 1;
}

.form-block .el-form-item {
  margin-bottom: 16px;
}

.form-block .el-form-item:last-child {
  margin-bottom: 0;
}

.form-block .el-input-group__append {
  padding: 0 12px;
  background: #fff;
}

.upload-block {
  display: flex;
  flex-direction: column;
}

.upload-block .block-header {
  flex-shrink: 0;
}

.contract-uploader {
  flex: 1;
  min-height: 280px;
}

.contract-uploader :deep(.el-upload) {
  width: 100%;
  height: 100%;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contract-uploader :deep(.el-upload:hover) {
  border-color: var(--primary-color);
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #8c939d;
  padding: 20px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.upload-progress {
  margin-top: 12px;
}

/* 详情弹窗 */
.contract-detail {
  padding: 0 20px;
}

.detail-association {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  border-radius: 12px;
}

.association-block {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-radius: 10px;
}

.association-block:first-child {
  background: rgba(64, 158, 255, 0.1);
}

.association-block:last-child {
  background: rgba(103, 194, 58, 0.1);
}

.block-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.association-block:first-child .block-icon {
  background: var(--primary-color);
  color: #fff;
}

.association-block:last-child .block-icon {
  background: #67c23a;
  color: #fff;
}

.block-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.block-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.block-sub {
  font-size: 13px;
  color: var(--text-secondary);
}

.association-arrow {
  color: var(--primary-color);
}

.detail-image {
  margin-bottom: 24px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.detail-image :deep(.el-image) {
  max-height: 400px;
}

.detail-info {
  margin-top: 20px;
}
</style>
