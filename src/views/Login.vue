<template>
  <div class="login-page">
    <div class="login-bg"></div>

    <section class="login-panel">
      <div class="brand">
        <div class="brand-mark">
          <el-icon><FirstAidKit /></el-icon>
        </div>
        <div>
          <h1>认知筛查医生专业端</h1>
          <p>临床评估、随访管理与科研支撑工作台</p>
        </div>
      </div>

      <el-tabs v-model="activeTab" stretch class="auth-tabs">
        <el-tab-pane label="账号登录" name="login">
          <el-form
            ref="loginRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            @submit.prevent="handleLogin"
          >
            <el-form-item label="账号" prop="username">
              <el-input
                v-model.trim="loginForm.username"
                :prefix-icon="User"
                placeholder="请输入医生账号"
                size="large"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                :prefix-icon="Lock"
                type="password"
                show-password
                placeholder="请输入密码"
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="医生注册" name="register">
          <el-form
            ref="registerRef"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            @submit.prevent="handleRegister"
          >
            <el-row :gutter="14">
              <el-col :xs="24" :sm="12">
                <el-form-item label="账号" prop="username">
                  <el-input
                    v-model.trim="registerForm.username"
                    :prefix-icon="User"
                    placeholder="设置登录账号"
                    size="large"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="姓名" prop="name">
                  <el-input
                    v-model.trim="registerForm.name"
                    placeholder="医生姓名"
                    size="large"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="所在医院 / 机构" prop="hospital">
              <el-input
                v-model.trim="registerForm.hospital"
                placeholder="例如：记忆门诊中心"
                size="large"
              />
            </el-form-item>

            <el-form-item label="科室" prop="department">
              <el-input
                v-model.trim="registerForm.department"
                placeholder="例如：神经内科"
                size="large"
              />
            </el-form-item>

            <el-row :gutter="14">
              <el-col :xs="24" :sm="12">
                <el-form-item label="密码" prop="password">
                  <el-input
                    v-model="registerForm.password"
                    :prefix-icon="Lock"
                    type="password"
                    show-password
                    placeholder="至少 6 位"
                    size="large"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input
                    v-model="registerForm.confirmPassword"
                    :prefix-icon="Lock"
                    type="password"
                    show-password
                    placeholder="再次输入密码"
                    size="large"
                    @keyup.enter="handleRegister"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleRegister"
            >
              注册并进入系统
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="hint">
        <el-icon><InfoFilled /></el-icon>
        <span>演示账号：admin / admin123。注册账号当前用于演示，保存在本浏览器。</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { FirstAidKit, InfoFilled, Lock, User } from '@element-plus/icons-vue';
import { doctorLogin, doctorRegister } from '../api/admin';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('login');
const loading = ref(false);
const loginRef = ref(null);
const registerRef = ref(null);

const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
});

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  department: '神经内科',
  hospital: '认知障碍筛查中心'
});

const loginRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const registerRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号至少 3 个字符', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入医生姓名', trigger: 'blur' }],
  hospital: [{ required: true, message: '请输入医院或机构', trigger: 'blur' }],
  department: [{ required: true, message: '请输入科室', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
};

function enterSystem(data, message) {
  authStore.login(data.token, data.doctorInfo);
  ElMessage.success(message || `欢迎，${data.doctorInfo.name}`);
  router.push('/dashboard');
}

async function handleLogin() {
  const ok = await loginRef.value?.validate().catch(() => false);
  if (!ok) return;

  loading.value = true;
  try {
    const data = await doctorLogin(loginForm.username, loginForm.password);
    enterSystem(data, `欢迎回来，${data.doctorInfo.name}`);
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请检查账号和密码');
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  const ok = await registerRef.value?.validate().catch(() => false);
  if (!ok) return;

  loading.value = true;
  try {
    const data = await doctorRegister({ ...registerForm });
    enterSystem(data, '注册成功，已进入医生端');
  } catch (error) {
    ElMessage.error(error.message || '注册失败，请稍后再试');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #eef3f8;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: -30% -10% auto auto;
  width: 68vw;
  height: 120vh;
  background:
    radial-gradient(circle at 30% 30%, rgba(80, 153, 214, 0.18), transparent 34%),
    linear-gradient(145deg, #d7e8f4 0%, #edf4f8 58%, #f7fafc 100%);
  border-bottom-left-radius: 45%;
  transform: rotate(-8deg);
}

.login-panel {
  position: relative;
  z-index: 1;
  width: min(94vw, 500px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(218, 226, 235, 0.9);
  border-radius: 14px;
  padding: 34px;
  box-shadow: 0 20px 70px rgba(26, 43, 66, 0.14);
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.brand-mark {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #fff;
  font-size: 24px;
  background: #2f80c2;
}

.brand h1 {
  margin: 0;
  color: #1d2939;
  font-size: 22px;
  line-height: 1.25;
}

.brand p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
}

.auth-tabs :deep(.el-tabs__header) {
  margin-bottom: 22px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 600;
}

.hint {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  margin-top: 18px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .login-page {
    align-items: flex-start;
    padding: 18px 12px;
  }

  .login-bg {
    width: 100vw;
    height: 72vh;
  }

  .login-panel {
    width: 100%;
    padding: 24px 18px;
    border-radius: 12px;
  }

  .brand {
    align-items: flex-start;
  }

  .brand h1 {
    font-size: 19px;
  }
}
</style>
