import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 认证状态管理
 *
 * 管理医生登录状态、Token 存储、用户信息
 */
export const useAuthStore = defineStore('auth', () => {
  // ========== 状态 ==========
  const token = ref(localStorage.getItem('admin_token') || '')
  const doctor = ref(JSON.parse(localStorage.getItem('admin_doctor') || 'null'))
  const pendingAlertCount = ref(0)

  // ========== 计算属性 ==========
  const isLoggedIn = computed(() => !!token.value)

  // ========== 方法 ==========

  /**
   * 登录
   * @param {string} loginToken - JWT Token
   * @param {Object} doctorInfo - 医生信息
   */
  function login(loginToken, doctorInfo) {
    token.value = loginToken
    doctor.value = doctorInfo
    localStorage.setItem('admin_token', loginToken)
    localStorage.setItem('admin_doctor', JSON.stringify(doctorInfo))
  }

  /**
   * 退出登录
   */
  function logout() {
    token.value = ''
    doctor.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_doctor')
  }

  /**
   * 检查 Token 是否有效
   */
  function getToken() {
    return token.value
  }

  return {
    token,
    doctor,
    pendingAlertCount,
    isLoggedIn,
    login,
    logout,
    getToken
  }
})
