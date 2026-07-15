import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { noAuth: true } },

  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '专业工作台' } },
  { path: '/patients', name: 'Patients', component: () => import('../views/Patients.vue'), meta: { title: '患者档案' } },
  { path: '/reports', name: 'Reports', component: () => import('../views/Reports.vue'), meta: { title: '全量报告' } },
  { path: '/reports/:id', name: 'ReportDetail', component: () => import('../views/ReportDetail.vue'), meta: { title: '报告详情' } },
  { path: '/clinical', name: 'ClinicalAssessment', component: () => import('../views/ClinicalAssessment.vue'), meta: { title: '临床评估' } },
  { path: '/intervention', name: 'InterventionPlan', component: () => import('../views/InterventionPlan.vue'), meta: { title: '干预方案' } },
  { path: '/prompt-config', name: 'PromptConfig', component: () => import('../views/PromptConfig.vue'), meta: { title: 'Prompt 配置' } },
  { path: '/research-export', name: 'ResearchExport', component: () => import('../views/ResearchExport.vue'), meta: { title: '科研导出' } },
  { path: '/communication', name: 'DoctorCommunication', component: () => import('../views/DoctorCommunication.vue'), meta: { title: '医患沟通' } },
  { path: '/institution', name: 'InstitutionDashboard', component: () => import('../views/InstitutionDashboard.vue'), meta: { title: '机构看板' } },

  { path: '/model-config', redirect: '/prompt-config' },
  { path: '/messages', redirect: '/communication' },
  { path: '/institution-stats', redirect: '/institution' },
  { path: '/alerts', redirect: '/dashboard' },
  { path: '/followup', redirect: '/communication' },

  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.noAuth) next()
  else if (!authStore.token) next('/login')
  else next()
})

router.afterEach((to) => {
  if (to.meta.title) document.title = `${to.meta.title} - 认知筛查医生专业端`
})

export default router
