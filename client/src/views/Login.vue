<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <el-icon size="40"><House /></el-icon>
        </div>
        <h1>房屋管理系统</h1>
        <p>Property Management System</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="isRegister" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="isRegister ? handleRegister() : handleLogin()"
          >
            {{ isRegister ? '注 册' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-button link @click="toggleMode">
          {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
        </el-button>
      </div>

      <div class="login-tips">
        <p>默认管理员: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House } from '@element-plus/icons-vue'
import { login, register } from '@/api/users.js'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const loading = ref(false)
const isRegister = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名需为3-20位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const toggleMode = () => {
  isRegister.value = !isRegister.value
  form.password = ''
  form.confirmPassword = ''
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const res = await login(form.username, form.password)
  loading.value = false

  if (res.code === 0) {
    ElMessage.success('登录成功')
    // 强制刷新页面以更新路由守卫状态
    window.location.href = route.query.redirect || '/'
  } else {
    ElMessage.error(res.message || '登录失败')
  }
}

const handleRegister = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  const res = await register(form.username, form.password, 'user')
  loading.value = false

  if (res.code === 0) {
    ElMessage.success('注册成功，请登录')
    // 切换到登录模式
    isRegister.value = false
    form.password = ''
    form.confirmPassword = ''
  } else {
    ElMessage.error(res.message || '注册失败')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4a90d9 0%, #6bb3f0 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.login-header p {
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 20px;
}

.login-footer {
  text-align: center;
  margin-bottom: 16px;
}

.login-tips {
  text-align: center;
  font-size: 12px;
  color: #909399;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.login-tips p {
  margin: 0;
}
</style>
