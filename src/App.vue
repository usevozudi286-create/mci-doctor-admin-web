<template>
  <div id="app">
    <router-view v-if="$route.path === '/login'" />

    <el-container v-else class="admin-root">
      <el-aside width="236px" class="aside desktop-aside">
        <SideNav />
      </el-aside>

      <el-container class="content-shell">
        <el-header class="topbar" height="56px">
          <div class="top-left">
            <el-button class="mobile-menu-btn" text @click="drawerVisible = true">
              <el-icon :size="22"><Menu /></el-icon>
            </el-button>
            <el-breadcrumb class="desktop-breadcrumb" separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">工作台</el-breadcrumb-item>
              <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
            <div class="mobile-title">{{ pageTitle || '医生专业端' }}</div>
          </div>

          <div class="top-right">
            <span class="top-time">{{ time }}</span>
            <el-divider class="desktop-divider" direction="vertical" />
            <el-dropdown trigger="click" @command="userCmd">
              <span class="top-user">
                <el-avatar :size="30" :icon="UserFilled" />
                <span class="tu-name">{{ doctorName }}</span>
                <span class="tu-dept">{{ doctorDept }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="info">
                    <el-icon><User /></el-icon>个人信息
                  </el-dropdown-item>
                  <el-dropdown-item command="pwd">
                    <el-icon><Lock /></el-icon>修改密码
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main class="main-area">
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <el-drawer
      v-model="drawerVisible"
      direction="ltr"
      size="288px"
      :with-header="false"
      class="mobile-drawer"
    >
      <SideNav @navigate="drawerVisible = false" />
    </el-drawer>

    <el-dialog v-model="infoShow" title="个人信息" width="400px">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="姓名">{{ authStore.doctor?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ authStore.doctor?.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="机构">{{ authStore.doctor?.hospital || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          {{ authStore.doctor?.role === 'admin' ? '主任医师' : '医生' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="pwdShow" title="修改密码" width="380px">
      <el-form :model="pwd" label-width="80px">
        <el-form-item label="原密码">
          <el-input v-model="pwd.old" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwd.nw" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="pwd.cf" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdShow = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoad" @click="changePwd">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowDown,
  ChatDotRound,
  DataBoard,
  Document,
  Download,
  EditPen,
  FirstAidKit,
  Lock,
  Menu,
  Opportunity,
  Setting,
  SwitchButton,
  TrendCharts,
  User,
  UserFilled
} from '@element-plus/icons-vue'
import { ElIcon, ElMenu, ElMenuItem, ElMessage } from 'element-plus'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const drawerVisible = ref(false)
const active = computed(() => route.path)
const doctorName = computed(() => authStore.doctor?.name || '张主任')
const doctorDept = computed(() => authStore.doctor?.department || '神经内科')
const doctorHospital = computed(() => authStore.doctor?.hospital || '认知障碍筛查中心')

const menuItems = [
  { path: '/dashboard', label: '专业工作台', icon: DataBoard },
  { path: '/patients', label: '患者档案', icon: User },
  { path: '/reports', label: '全量报告', icon: Document },
  { path: '/clinical', label: '临床评估', icon: EditPen },
  { path: '/intervention', label: '干预方案', icon: Opportunity },
  { path: '/prompt-config', label: 'Prompt 配置', icon: Setting },
  { path: '/research-export', label: '科研导出', icon: Download },
  { path: '/communication', label: '医患沟通', icon: ChatDotRound },
  { path: '/institution', label: '机构看板', icon: TrendCharts }
]

const titleMap = Object.fromEntries(menuItems.map(item => [item.path, item.label]))
const pageTitle = computed(() => {
  if (route.path.startsWith('/reports/')) return '报告详情'
  return titleMap[route.path] || ''
})

const SideNav = defineComponent({
  emits: ['navigate'],
  setup(_, { emit }) {
    return () => h('div', { class: 'side-nav' }, [
      h('button', {
        class: 'aside-logo',
        type: 'button',
        onClick: () => {
          router.push('/dashboard')
          emit('navigate')
        }
      }, [
        h('span', { class: 'alo-icon' }, [
          h(ElIcon, null, () => h(FirstAidKit))
        ]),
        h('span', { class: 'alo-text' }, [
          h('strong', { class: 'alo-t' }, '认知筛查'),
          h('span', { class: 'alo-s' }, '医生专业端')
        ])
      ]),
      h('div', { class: 'nav-section-title' }, '专业功能'),
      h(ElMenu, {
        defaultActive: active.value,
        router: true,
        class: 'aside-menu',
        backgroundColor: 'transparent',
        textColor: '#cbd5e1',
        activeTextColor: '#ffffff',
        onSelect: () => emit('navigate')
      }, () => menuItems.map(item => h(ElMenuItem, { index: item.path }, () => [
        h(ElIcon, { class: 'menu-icon' }, () => h(item.icon)),
        h('span', { class: 'menu-label' }, item.label)
      ]))),
      h('div', { class: 'doctor-card' }, [
        h('div', { class: 'doctor-avatar' }, doctorName.value.slice(0, 1)),
        h('div', { class: 'doctor-meta' }, [
          h('strong', { title: doctorName.value }, doctorName.value),
          h('span', { title: doctorDept.value }, doctorDept.value),
          h('small', { title: doctorHospital.value }, doctorHospital.value)
        ])
      ])
    ])
  }
})

const time = ref('')
let timer = null
function tick() {
  time.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  })
}

const infoShow = ref(false)
const pwdShow = ref(false)
const pwdLoad = ref(false)
const pwd = reactive({ old: '', nw: '', cf: '' })

function userCmd(command) {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'info') {
    infoShow.value = true
  } else if (command === 'pwd') {
    pwdShow.value = true
    pwd.old = ''
    pwd.nw = ''
    pwd.cf = ''
  }
}

function changePwd() {
  if (!pwd.old || !pwd.nw) {
    ElMessage.warning('请填写完整')
    return
  }
  if (pwd.nw.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (pwd.nw !== pwd.cf) {
    ElMessage.warning('两次密码不一致')
    return
  }
  pwdLoad.value = true
  setTimeout(() => {
    pwdLoad.value = false
    pwdShow.value = false
    ElMessage.success('密码修改成功')
  }, 500)
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 30000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.admin-root {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.content-shell {
  min-width: 0;
}

.aside {
  background: #111827;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 10px 0 32px rgba(15, 23, 42, 0.08);
}

.side-nav {
  height: 100%;
  padding: 16px 12px;
  background:
    linear-gradient(180deg, rgba(47, 128, 194, 0.16), rgba(17, 24, 39, 0) 230px),
    #111827;
  display: flex;
  flex-direction: column;
}

.aside-logo {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 18px;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  text-align: left;
}

.alo-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  color: #ffffff;
  font-size: 22px;
  border-radius: 11px;
  background: linear-gradient(135deg, #2f80c2, #35b8a6);
  box-shadow: 0 12px 24px rgba(47, 128, 194, 0.28);
}

.alo-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.alo-t {
  color: #ffffff;
  font-size: 16px;
  line-height: 1.25;
  letter-spacing: 0;
}

.alo-s {
  margin-top: 3px;
  color: #9fb0c7;
  font-size: 12px;
}

.nav-section-title {
  padding: 0 12px 8px;
  color: #718096;
  font-size: 12px;
}

.aside-menu {
  border: none !important;
  flex: 1;
  overflow-y: auto;
}

.aside-menu :deep(.el-menu-item) {
  height: 46px;
  line-height: 46px;
  margin: 4px 0;
  padding: 0 13px !important;
  border-radius: 10px;
  font-size: 14px;
  letter-spacing: 0;
}

.aside-menu :deep(.el-menu-item:hover) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.aside-menu :deep(.el-menu-item.is-active) {
  color: #ffffff !important;
  background: linear-gradient(135deg, #2f80c2, #42a5f5) !important;
  box-shadow: 0 12px 22px rgba(47, 128, 194, 0.24);
}

.aside-menu :deep(.el-menu-item.is-active::before) {
  content: "";
  width: 4px;
  height: 20px;
  border-radius: 2px;
  background: #ffffff;
  margin-right: 9px;
}

.menu-icon {
  margin-right: 10px;
  font-size: 18px;
}

.menu-label {
  white-space: nowrap;
}

.doctor-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.58);
}

.doctor-avatar {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  margin-top: 1px;
  border-radius: 10px;
  color: #dff7ff;
  background: rgba(47, 128, 194, 0.24);
  font-weight: 700;
  font-size: 15px;
  line-height: 1;
}

.doctor-meta {
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.doctor-meta strong {
  display: block;
  overflow: hidden;
  color: #f8fafc;
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doctor-meta span,
.doctor-meta small {
  display: block;
  overflow: hidden;
  color: #94a3b8;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e8ee;
  padding: 0 20px;
  gap: 12px;
}

.top-left,
.top-right,
.top-user {
  display: flex;
  align-items: center;
}

.top-left {
  min-width: 0;
  gap: 8px;
}

.top-right {
  gap: 6px;
}

.mobile-menu-btn,
.mobile-title {
  display: none;
}

.mobile-title {
  font-size: 16px;
  font-weight: 700;
  color: #1d2939;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-time {
  font-size: 13px;
  color: #7c8ca5;
  white-space: nowrap;
}

.top-user {
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
}

.tu-name {
  color: #1d2939;
  font-weight: 500;
  white-space: nowrap;
}

.tu-dept {
  color: #7c8ca5;
  font-size: 12px;
  white-space: nowrap;
}

.main-area {
  background: #f0f4f8;
  padding: 20px;
  overflow: auto;
}

@media (max-width: 768px) {
  .desktop-aside,
  .desktop-breadcrumb,
  .desktop-divider,
  .top-time,
  .tu-dept {
    display: none !important;
  }

  .admin-root {
    height: 100dvh;
  }

  .mobile-menu-btn,
  .mobile-title {
    display: inline-flex;
  }

  .topbar {
    height: 52px !important;
    padding: 0 10px;
  }

  .main-area {
    padding: 12px;
    width: 100%;
  }

  .top-user {
    gap: 6px;
  }

  .tu-name {
    max-width: 58px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(.mobile-drawer .el-drawer__body) {
    padding: 0;
    background: #111827;
  }
}
</style>
