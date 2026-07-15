<template>
  <div id="app">
    <router-view v-if="$route.path === '/login'" />

    <el-container v-else class="admin-root">
      <el-aside width="220px" class="aside desktop-aside">
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
                <el-avatar :size="30" icon="UserFilled" />
                <span class="tu-name">{{ doctorName }}</span>
                <span class="tu-dept">{{ doctorDept }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="info"><el-icon><User /></el-icon>个人信息</el-dropdown-item>
                  <el-dropdown-item command="pwd"><el-icon><Lock /></el-icon>修改密码</el-dropdown-item>
                  <el-dropdown-item command="logout" divided><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
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

    <el-drawer v-model="drawerVisible" direction="ltr" size="280px" :with-header="false" class="mobile-drawer">
      <SideNav @navigate="drawerVisible = false" />
    </el-drawer>

    <el-dialog v-model="infoShow" title="个人信息" width="400px">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="姓名">{{ authStore.doctor?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ authStore.doctor?.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="机构">{{ authStore.doctor?.hospital || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ authStore.doctor?.role === 'admin' ? '主任医师' : '医生' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="pwdShow" title="修改密码" width="380px">
      <el-form :model="pwd" label-width="80px">
        <el-form-item label="原密码"><el-input v-model="pwd.old" type="password" show-password /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="pwd.nw" type="password" show-password placeholder="至少6位" /></el-form-item>
        <el-form-item label="确认密码"><el-input v-model="pwd.cf" type="password" show-password /></el-form-item>
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
  Lock,
  Menu,
  Opportunity,
  Setting,
  SwitchButton,
  TrendCharts,
  User
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
      h('div', {
        class: 'aside-logo',
        onClick: () => {
          router.push('/dashboard')
          emit('navigate')
        }
      }, [
        h('span', { class: 'alo-icon' }, '🧠'),
        h('div', null, [
          h('div', { class: 'alo-t' }, '认知筛查'),
          h('div', { class: 'alo-s' }, '医生专业端')
        ])
      ]),
      h(ElMenu, {
        defaultActive: active.value,
        router: true,
        class: 'aside-menu',
        onSelect: () => emit('navigate')
      }, () => menuItems.map(item => h(ElMenuItem, { index: item.path }, () => [
        h(ElIcon, null, () => h(item.icon)),
        h('span', null, item.label)
      ])))
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
    ElMessage.warning('新密码至少6位')
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
  background: #1a2332;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.side-nav {
  height: 100%;
  background: #1a2332;
  display: flex;
  flex-direction: column;
}

.aside-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.alo-icon {
  font-size: 26px;
}

.alo-t {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.alo-s {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.aside-menu {
  border: none !important;
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.aside-menu :deep(.el-menu-item) {
  height: 42px;
  line-height: 42px;
  margin: 2px 0;
  border-radius: 8px;
  font-size: 14px;
}

.topbar {
  background: #fff;
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
    background: #1a2332;
  }
}
</style>
