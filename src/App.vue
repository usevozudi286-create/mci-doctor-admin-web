<template>
  <div id="app">
    <router-view v-if="$route.path === '/login'" />
    <el-container v-else class="admin-root">
      <el-aside width="220px" class="aside">
        <div class="aside-logo" @click="$router.push('/dashboard')">
          <span class="alo-icon">🧠</span>
          <div>
            <div class="alo-t">认知筛查</div>
            <div class="alo-s">医生专业端</div>
          </div>
        </div>
        <el-menu :default-active="active" router class="aside-menu">
          <el-menu-item index="/dashboard"><el-icon><DataBoard /></el-icon><span>专业工作台</span></el-menu-item>
          <el-menu-item index="/patients"><el-icon><User /></el-icon><span>患者档案</span></el-menu-item>
          <el-menu-item index="/reports"><el-icon><Document /></el-icon><span>全量报告</span></el-menu-item>
          <el-menu-item index="/clinical"><el-icon><EditPen /></el-icon><span>临床评估</span></el-menu-item>
          <el-menu-item index="/intervention"><el-icon><Opportunity /></el-icon><span>干预方案</span></el-menu-item>
          <el-menu-item index="/prompt-config"><el-icon><Setting /></el-icon><span>Prompt 配置</span></el-menu-item>
          <el-menu-item index="/research-export"><el-icon><Download /></el-icon><span>科研导出</span></el-menu-item>
          <el-menu-item index="/communication"><el-icon><ChatDotRound /></el-icon><span>医患沟通</span></el-menu-item>
          <el-menu-item index="/institution"><el-icon><TrendCharts /></el-icon><span>机构看板</span></el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="topbar" height="56px">
          <div class="top-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">工作台</el-breadcrumb-item>
              <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="top-right">
            <span class="top-time">{{ time }}</span>
            <el-divider direction="vertical" />
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
        <el-main class="main-area"><router-view /></el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="infoShow" title="个人信息" width="400px">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="姓名">{{ authStore.doctor?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ authStore.doctor?.department || '-' }}</el-descriptions-item>
        <el-descriptions-item label="医院">{{ authStore.doctor?.hospital || '-' }}</el-descriptions-item>
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
        <el-button @click="pwdShow=false">取消</el-button>
        <el-button type="primary" @click="changePwd" :loading="pwdLoad">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from './stores/auth';

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore();
const active = computed(() => route.path);
const doctorName = computed(() => authStore.doctor?.name || '医生');
const doctorDept = computed(() => authStore.doctor?.department || '');

const pageTitle = computed(() => {
  const m = {
    '/dashboard': '专业工作台', '/patients': '患者档案', '/reports': '全量报告',
    '/clinical': '临床评估', '/intervention': '干预方案', '/prompt-config': 'Prompt 配置',
    '/research-export': '科研导出', '/communication': '医患沟通', '/institution': '机构看板'
  };
  if (route.path.startsWith('/reports/')) return '报告详情';
  return m[route.path] || '';
});

const time = ref(''); let tmr = null;
function tick() { time.value = new Date().toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', weekday:'short' }); }

const infoShow = ref(false); const pwdShow = ref(false); const pwdLoad = ref(false);
const pwd = reactive({ old: '', nw: '', cf: '' });

function userCmd(c) {
  if (c === 'logout') { authStore.logout(); router.push('/login'); }
  else if (c === 'info') infoShow.value = true;
  else if (c === 'pwd') { pwdShow.value = true; pwd.old = ''; pwd.nw = ''; pwd.cf = ''; }
}
function changePwd() {
  if (!pwd.old || !pwd.nw) { ElMessage.warning('请填写完整'); return; }
  if (pwd.nw.length < 6) { ElMessage.warning('新密码至少6位'); return; }
  if (pwd.nw !== pwd.cf) { ElMessage.warning('两次密码不一致'); return; }
  pwdLoad.value = true;
  setTimeout(() => { pwdLoad.value = false; pwdShow.value = false; ElMessage.success('密码修改成功'); }, 500);
}

onMounted(() => { tick(); tmr = setInterval(tick, 30000); });
onUnmounted(() => clearInterval(tmr));
</script>

<style scoped>
.admin-root { height: 100vh; }
.aside { background: #1a2332; display: flex; flex-direction: column; overflow: hidden; }
.aside-logo { display: flex; align-items: center; gap: 10px; padding: 18px 20px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06); }
.alo-icon { font-size: 26px; }
.alo-t { color: #fff; font-size: 15px; font-weight: 600; line-height: 1.3; }
.alo-s { color: rgba(255,255,255,0.5); font-size: 11px; }
.aside-menu { border: none !important; flex: 1; padding-top: 8px; overflow-y: auto; }
.aside-menu .el-menu-item { height: 42px; line-height: 42px; margin: 2px 8px; border-radius: 8px; font-size: 14px; }

.topbar { background: #fff; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e4e8ee; padding: 0 20px; }
.top-left { display: flex; align-items: center; }
.top-right { display: flex; align-items: center; gap: 6px; }
.top-time { font-size: 13px; color: #7c8ca5; }
.top-user { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
.tu-name { color: #1d2939; font-weight: 500; }
.tu-dept { color: #7c8ca5; font-size: 12px; }
.main-area { background: #f0f4f8; padding: 20px; overflow-y: auto; }
</style>
