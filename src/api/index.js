import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import router from '../router'

/**
 * API 请求封装
 *
 * 微信云函数的 HTTP 访问方式：
 * 通过云开发 HTTP API 调用云函数
 *
 * 开发阶段前端使用 mock 数据
 * 生产阶段配置真实的云函数 HTTP 触发器 URL
 */

// TODO: 上线时替换为实际的云函数 HTTP 触发器地址
const API_BASE = import.meta.env.VITE_API_BASE || ''

const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：附加 Token
http.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理错误
http.interceptors.response.use(
  (response) => {
    const res = response.data
    // 云函数返回格式 { code, message, data }
    if (res.code !== 0) {
      // 401 未登录
      if (res.code === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data
  },
  (error) => {
    console.error('API请求异常:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 调用微信云函数
 *
 * 开发阶段使用 mock 数据
 * 生产阶段通过 HTTP 调用
 *
 * @param {string} funcName - 云函数名
 * @param {Object} params - 请求参数（包含 action 字段）
 * @returns {Promise}
 */
export async function callCloudFunction(funcName, params = {}) {
  // 开发阶段：返回 mock 数据
  if (import.meta.env.DEV) {
    console.log(`[DEV] 调用云函数: ${funcName}`, params)
    return getMockData(funcName, params)
  }

  // 生产阶段：实际 HTTP 调用
  return http.post(`/api/${funcName}`, params)
}

// ============================================================
// Mock 数据（开发阶段使用）
// ============================================================

function getMockData(funcName, params) {
  const { action } = params

  if (funcName === 'admin' && action === 'login') {
    return Promise.resolve({
      token: 'mock-jwt-token-xxx',
      doctor: {
        id: 'doc_001',
        name: '张医生',
        department: '神经内科',
        hospital: '某某社区卫生中心',
        role: 'doctor'
      }
    })
  }

  if (funcName === 'admin-report') {
    return getMockReportData(action, params)
  }

  return Promise.resolve(null)
}

function getMockReportData(action, params) {
  switch (action) {
    case 'getDashboardStats':
      return Promise.resolve({
        totalPatients: 328,
        totalScreenings: 512,
        highRiskCount: 45,
        todayScreenings: 8,
        pendingAlerts: 12,
        pendingFollowUps: 23,
        dailyTrend: generateMockTrend(30),
        classificationDist: {
          normal: 120,
          mild_risk: 89,
          moderate_risk: 56,
          high_risk: 45,
          confirmed_impairment: 18
        },
        dimensionAverages: {
          vocabulary: 3.2,
          syntax: 4.1,
          semantic: 3.5,
          fluency: 3.8,
          logic: 3.0
        }
      })

    case 'getPatientList':
      return Promise.resolve({
        patients: generateMockPatients(),
        total: 328,
        page: params.page || 1,
        pageSize: params.pageSize || 20
      })

    case 'getReportList':
      return Promise.resolve({
        reports: generateMockReports(),
        total: 156,
        page: params.page || 1,
        pageSize: params.pageSize || 20
      })

    default:
      return Promise.resolve(null)
  }
}

function generateMockTrend(days) {
  const trend = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    trend.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10) + 2
    })
  }
  return trend
}

function generateMockPatients() {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
  const riskLevels = ['normal', 'mild_risk', 'moderate_risk', 'high_risk']
  const educations = ['小学', '初中', '高中', '大专', '本科']
  const dialects = ['普通话', '四川话', '广东话', '上海话']

  return Array.from({ length: 20 }, (_, i) => ({
    userId: `user_${1000 + i}`,
    name: `${surnames[i % surnames.length]}${i % 3 === 0 ? '某' : '某某'}`,
    age: 60 + Math.floor(Math.random() * 30),
    gender: i % 2 === 0 ? '男' : '女',
    education: educations[Math.floor(Math.random() * educations.length)],
    dialect: dialects[Math.floor(Math.random() * dialects.length)],
    lastScreeningAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000).toISOString(),
    lastScore: Math.round((Math.random() * 12) * 10) / 10,
    lastClassification: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    screeningCount: Math.floor(Math.random() * 8) + 1
  }))
}

function generateMockReports() {
  const riskLevels = [
    { level: 'normal', label: '正常', color: '#67C23A' },
    { level: 'mild_risk', label: '轻度MCI风险', color: '#E6A23C' },
    { level: 'moderate_risk', label: '中度MCI风险', color: '#F56C6C' },
    { level: 'high_risk', label: '高度MCI风险', color: '#F56C6C' }
  ]

  return Array.from({ length: 20 }, (_, i) => {
    const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)]
    return {
      _id: `report_${2000 + i}`,
      userId: `user_${1000 + Math.floor(Math.random() * 50)}`,
      patientName: `患者${i + 1}`,
      patientAge: 65 + Math.floor(Math.random() * 25),
      patientGender: i % 2 === 0 ? '男' : '女',
      weightedScore: Math.round((Math.random() * 12) * 10) / 10,
      classification: risk.level,
      classificationLabel: { label: risk.label, color: risk.color },
      dimensions: {
        vocabulary: { compositeScore: Math.round(Math.random() * 5 * 10) / 10 },
        syntax: { compositeScore: Math.round(Math.random() * 5 * 10) / 10 },
        semantic: { compositeScore: Math.round(Math.random() * 5 * 10) / 10 },
        fluency: { compositeScore: Math.round(Math.random() * 5 * 10) / 10 },
        logic: { compositeScore: Math.round(Math.random() * 5 * 10) / 10 }
      },
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 3600 * 1000).toISOString()
    }
  })
}

export default http
