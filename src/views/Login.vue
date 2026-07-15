<template>
  <div class="login-page">
    <div class="login-bg"></div>
    <div class="login-box">
      <div class="login-brand">
        <div class="brand-icon">🧠</div>
        <h1>认知障碍筛查</h1>
        <p>医生专业端</p>
      </div>
      <el-form ref="fRef" :model="f" :rules="rules" label-position="top" @submit.prevent="login">
        <el-form-item label="账号" prop="username">
          <el-input v-model="f.username" placeholder="请输入账号" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="f.password" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" size="large" @keyup.enter="login" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="login" class="login-btn">登 录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-hint">
        <el-icon><InfoFilled /></el-icon>
        <span>开发演示账号：admin / admin123</span>
      </div>
      <div class="login-footer">认知障碍筛查系统 · 医生端 v2.0</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, InfoFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import { doctorLogin } from '../api/admin';

const router = useRouter();
const authStore = useAuthStore();
const fRef = ref(null);
const loading = ref(false);
const f = reactive({ username: 'admin', password: 'admin123' });
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function login() {
  if (!fRef.value) return;
  const ok = await fRef.value.validate().catch(() => false);
  if (!ok) return;
  loading.value = true;
  try {
    const d = await doctorLogin(f.username, f.password);
    if (d?.token) {
      authStore.login(d.token, d.doctorInfo);
      ElMessage.success(`欢迎回来，${d.doctorInfo.name}`);
      router.push('/dashboard');
    }
  } catch (e) {
    ElMessage.error(e.message || '登录失败');
  } finally { loading.value = false; }
}
</script>

<style scoped>
.login-page {
  height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #eef2f7; position: relative; overflow: hidden;
}
.login-bg {
  position: absolute; top: -40%; right: -20%; width: 70%; height: 160%;
  background: linear-gradient(160deg, #dce8f5 0%, #e8f0f8 40%, #f0f4f8 100%);
  border-radius: 0 0 0 60%; transform: rotate(-8deg);
}
.login-box {
  position: relative; z-index: 1; width: 400px; background: #fff;
  border-radius: 12px; padding: 44px 40px 32px;
  box-shadow: 0 2px 24px rgba(0,0,0,0.06), 0 8px 48px rgba(0,0,0,0.04);
}
.login-brand { text-align: center; margin-bottom: 32px; }
.brand-icon { font-size: 40px; margin-bottom: 8px; }
.login-brand h1 { font-size: 22px; font-weight: 700; color: #1d2939; margin: 0; }
.login-brand p { font-size: 14px; color: #7c8ca5; margin: 4px 0 0; }
.login-btn { width: 100%; height: 44px; font-size: 16px; font-weight: 600; }
.login-hint {
  display: flex; align-items: center; gap: 6px; margin-top: 16px;
  font-size: 12px; color: #7c8ca5; justify-content: center;
}
.login-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #b0bac9; }
</style>
