/**
 * 医生端 API 封装 (v3 - Mock/真实模式自动切换)
 * ============================================
 *
 * 模式判断规则：
 *   VITE_API_BASE 为空 → Mock 模式（答辩演示、本地开发）
 *   VITE_API_BASE 已配置 → 真实模式（调用云函数 HTTP 接口）
 *
 * 配置方式：
 *   修改 .env.development 或 .env.production 中的 VITE_API_BASE
 */

import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import router from '../router';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const USE_MOCK = !API_BASE;

const http = axios.create({
  baseURL: API_BASE, timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) config.headers.Authorization = `Bearer ${authStore.token}`;
  return config;
}, (e) => Promise.reject(e));

http.interceptors.response.use((res) => {
  const d = res.data;
  if (d.code !== 0) {
    if (d.code === 401) { useAuthStore().logout(); router.push('/login'); }
    return Promise.reject(new Error(d.message));
  }
  return d.data;
}, (e) => { console.error('API 请求异常:', e.message); return Promise.reject(e); });

async function callAdmin(action, params = {}) {
  if (USE_MOCK) {
    console.log(`[Mock] admin.${action}`, params);
    await new Promise(r => setTimeout(r, 120 + Math.random() * 200));
    return handleMockAction(action, params);
  }
  console.log(`[Real] POST /api/admin ${action}`);
  const res = await http.post(`/api/admin`, { action, ...params });
  return res;
}

// ========== 公开 API ==========
export async function doctorLogin(u, p) { return callAdmin('doctorLogin', { username: u, password: p }); }
export async function getDashboardStats() { return callAdmin('getDashboardStats'); }
export async function getPatientList(opts = {}) { return callAdmin('getPatientList', { keyword: opts.keyword || '', skip: (opts.page - 1) * (opts.pageSize || 20), limit: opts.pageSize || 20 }); }
export async function getPatientDetail(uid) { return callAdmin('getPatientDetail', { userId: uid }); }
export async function getReportList(opts = {}) { return callAdmin('getReportList', { keyword: opts.keyword || '', classification: opts.classification || '', startDate: opts.startDate || '', endDate: opts.endDate || '', userId: opts.userId || '', skip: (opts.page - 1) * (opts.pageSize || 20), limit: opts.pageSize || 20 }); }
export async function getReportDetail(rid) { return callAdmin('getReportDetail', { reportId: rid }); }
export async function updateFollowUp(d) { return callAdmin('updateFollowUp', { token: useAuthStore().token, ...d }); }
export async function getHighRiskReports(opts = {}) { return callAdmin('getHighRiskReports', { keyword: opts.keyword || '', followUpStatus: opts.followUpStatus || '', skip: (opts.page - 1) * (opts.pageSize || 20), limit: opts.pageSize || 20 }); }
export async function getFollowUpList(opts = {}) { return callAdmin('getFollowUpList', { keyword: opts.keyword || '', followUpStatus: opts.followUpStatus || '', skip: (opts.page - 1) * (opts.pageSize || 20), limit: opts.pageSize || 20 }); }

// ============================================================
// Mock 数据引擎
// ============================================================

const RISK = {
  normal: { label: '正常', color: '#67C23A' },
  mild_risk: { label: '轻度MCI风险', color: '#E6A23C' },
  moderate_risk: { label: '中度MCI风险', color: '#F56C6C' },
  high_risk: { label: '高度MCI风险', color: '#FF4D4F' },
  suspected_mci: { label: '疑似MCI', color: '#E6A23C' },
  attention: { label: '需关注', color: '#F56C6C' },
  confirmed_impairment: { label: '确认认知障碍', color: '#909399' }
};

/* ======== 患者数据 ======== */
const MOCK_USERS = [
  { _openid: 'user_wx_001', _id: 'user_wx_001', profile: { name: '张秀英', age: '73', gender: '女', education: '小学', dialect: '四川话' }, kinshipPhone: '138****8001', createdAt: '2026-01-15T08:30:00Z', updatedAt: '2026-07-10T09:00:00Z' },
  { _openid: 'user_wx_002', _id: 'user_wx_002', profile: { name: '李德明', age: '68', gender: '男', education: '初中', dialect: '普通话' }, kinshipPhone: '138****8002', createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-07-08T14:00:00Z' },
  { _openid: 'user_wx_003', _id: 'user_wx_003', profile: { name: '王桂芳', age: '75', gender: '女', education: '文盲', dialect: '广东话' }, kinshipPhone: '138****8003', createdAt: '2026-01-10T09:00:00Z', updatedAt: '2026-07-12T11:00:00Z' },
  { _openid: 'user_wx_004', _id: 'user_wx_004', profile: { name: '刘建国', age: '70', gender: '男', education: '高中', dialect: '普通话' }, kinshipPhone: '138****8004', createdAt: '2026-03-05T11:00:00Z', updatedAt: '2026-07-09T16:00:00Z' },
  { _openid: 'user_wx_005', _id: 'user_wx_005', profile: { name: '陈秀兰', age: '81', gender: '女', education: '小学', dialect: '上海话' }, kinshipPhone: '138****8005', createdAt: '2026-01-20T13:00:00Z', updatedAt: '2026-07-14T08:00:00Z' },
  { _openid: 'user_wx_006', _id: 'user_wx_006', profile: { name: '杨大勇', age: '65', gender: '男', education: '大专', dialect: '普通话' }, kinshipPhone: '138****8006', createdAt: '2026-04-10T15:00:00Z', updatedAt: '2026-06-30T10:00:00Z' },
  { _openid: 'user_wx_007', _id: 'user_wx_007', profile: { name: '赵美华', age: '78', gender: '女', education: '初中', dialect: '河南话' }, kinshipPhone: '138****8007', createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-07-11T12:00:00Z' },
  { _openid: 'user_wx_008', _id: 'user_wx_008', profile: { name: '黄志强', age: '72', gender: '男', education: '小学', dialect: '四川话' }, kinshipPhone: '138****8008', createdAt: '2026-03-15T14:00:00Z', updatedAt: '2026-07-13T09:00:00Z' },
];

/* ======== 构建维度（含9子指标） ======== */
function buildDimensions(cls, seed) {
  const isHighRisk = cls === 'high_risk' || cls === 'suspected_mci' || cls === 'attention' || cls === 'confirmed_impairment';
  const base = isHighRisk ? 0.4 : 1.0;
  const rand = () => parseFloat((base + Math.random() * 1.2).toFixed(1));

  return {
    vocabulary: {
      rawScore: 5 + Math.floor(Math.random() * 10), weight: 0.25, compositeScore: rand(),
      description: '词汇提取速度与丰富度评估，反映命名能力和词汇多样性',
      tipOfTongue: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)),
      lexicalComplexity: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)),
      wordPhraseRatio: parseFloat((1.5 + Math.random() * 3.5).toFixed(1))
    },
    syntax: {
      rawScore: 6 + Math.floor(Math.random() * 10), weight: 0.10, compositeScore: rand(),
      description: '句法复杂度与语法正确性评估，反映语言组织能力',
      syntacticComplexity: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)),
      complexThought: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)),
      grammaticalAccuracy: parseFloat((1.5 + Math.random() * 3.5).toFixed(1))
    },
    semantic: {
      rawScore: 5 + Math.floor(Math.random() * 11), weight: 0.30, compositeScore: rand(),
      description: '语义连贯性与话题维持能力评估，反映信息组织能力',
      semanticDensity: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)),
      semanticCoherence: parseFloat((1.5 + Math.random() * 3.5).toFixed(1)),
      memoryIssues: parseFloat((1.5 + Math.random() * 3.5).toFixed(1))
    },
    fluency: {
      rawScore: 6 + Math.floor(Math.random() * 10), weight: 0.20, compositeScore: rand(),
      description: '语言流畅度与停顿模式评估'
    },
    logic: {
      rawScore: 5 + Math.floor(Math.random() * 11), weight: 0.15, compositeScore: rand(),
      description: '逻辑推理与因果关系表达评估'
    }
  };
}

/* ======== 构建报告列表 ======== */
function buildMockReports() {
  const reports = [];
  // 贴近用户端真实分类：normal 最常见，attention 和 suspected_mci 次之
  const weightedPool = [
    'normal', 'normal', 'normal', 'normal', 'normal', 'normal', // 30%
    'attention', 'attention', 'attention', 'attention', 'attention', // 25%
    'suspected_mci', 'suspected_mci', 'suspected_mci', 'suspected_mci', // 20%
    'mild_risk', 'mild_risk', // 10%
    'moderate_risk', 'moderate_risk', // 8%
    'high_risk' // 7%
  ];

  // 预定义：确保至少有 3 个高风险预警记录
  const forcedHigh = [
    { userIdx: 0, cls: 'high_risk', score: 10.2, days: 2 },
    { userIdx: 2, cls: 'suspected_mci', score: 7.8, days: 5 },
    { userIdx: 4, cls: 'attention', score: 8.5, days: 10 },
  ];

  forcedHigh.forEach(f => {
    const user = MOCK_USERS[f.userIdx];
    const dims = buildDimensions(f.cls, f.userIdx);
    const wScore = Object.values(dims).reduce((s, d) => s + d.compositeScore, 0);
    reports.push(makeReport(user, 0, f.cls, dims, parseFloat(wScore.toFixed(1)), f.days, 'pending'));
  });

  // 其余用户生成报告（使用加权池）
  MOCK_USERS.forEach((user, idx) => {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const cls = weightedPool[Math.floor(Math.random() * weightedPool.length)];
      const dims = buildDimensions(cls, idx);
      const wScore = Object.values(dims).reduce((s, d) => s + d.compositeScore, 0);
      const days = (i * 35) + Math.floor(Math.random() * 25);
      const fuStatus = ['', 'pending', 'contacted', 'closed', 'referred'][Math.floor(Math.random() * 5)];
      reports.push(makeReport(user, i + 1, cls, dims, parseFloat(wScore.toFixed(1)), days, fuStatus));
    }
  });

  reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return reports;
}

function makeReport(user, i, cls, dims, wScore, daysAgo, fuStatus) {
  const observations = [
    { text: '患者在词汇提取方面表现出轻度困难，偶尔出现找词停顿现象', evidence: '对话第3轮中，患者出现"那个...就是那个..."的典型找词行为', riskLevel: 'medium' },
    { text: '时间定向能力有轻微下降，对近期事件回忆不够准确', evidence: '记忆话题中，患者无法准确回忆当天早餐内容', riskLevel: 'high' },
    { text: '社交意愿保持良好，但社交场景描述内容较为贫乏', evidence: '社交话题中患者表示"不怎么出门"，但能清晰表达原因', riskLevel: 'low' },
    { text: '句法结构基本完整，但在表达复杂思想时出现句子断裂', evidence: '第4轮中患者尝试描述看病经历时句子不完整', riskLevel: 'medium' }
  ];

  const interventions = [
    { text: '建议前往神经内科门诊进行进一步认知评估（MMSE/MoCA量表）', priority: 1, isNav: true, category: '医疗建议' },
    { text: '推荐参加社区认知训练小组，每周2次，每次60分钟', priority: 2, isNav: false, category: '康复训练' },
    { text: '建议家属增加日常交流互动，记录患者语言变化情况', priority: 3, isNav: false, category: '家庭护理' },
    { text: '3个月后复查，跟踪认知功能变化趋势', priority: 3, isNav: false, category: '随访计划' },
    { text: '注意饮食均衡，适量补充B族维生素和Omega-3脂肪酸', priority: 4, isNav: false, category: '营养建议' }
  ];

  const fuNote = fuStatus && fuStatus !== '' ? (fuStatus === 'pending' ? '需安排电话随访' : fuStatus === 'contacted' ? '已电话联系家属，患者自述情况稳定' : fuStatus === 'referred' ? '已转诊至神经内科专家门诊' : '随访已关闭，建议继续观察') : '';

  return {
    _id: `report_${user._openid.split('_')[2]}_${i}`,
    userId: user._openid,
    screeningId: `screening_${user._openid.split('_')[2]}_${i}`,
    weightedScore: wScore,
    classification: cls,
    classificationLabel: RISK[cls] || { label: cls, color: '#909399' },
    dimensions: dims,
    observations,
    interventions: interventions.sort((a, b) => a.priority - b.priority),
    evaluationNotes: '基于 DeepSeek 大语言模型的多维度 MCI 认知障碍风险评估。系统通过分析患者的自然语言对话，从词汇、句法、语义、流畅性和逻辑五个维度进行综合评估。',
    sessionStats: {
      topicCount: 8, totalUserWords: 180 + Math.floor(Math.random() * 450),
      averageResponseLength: 18 + Math.floor(Math.random() * 55)
    },
    profile: { ...user.profile },
    followUpStatus: fuStatus,
    followUpNote: fuNote,
    followUpTime: fuStatus && fuStatus !== '' ? new Date(Date.now() - Math.random() * 12 * 86400000).toISOString() : null,
    doctorName: fuStatus && fuStatus !== '' ? '张主任' : '',
    createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString()
  };
}

const MOCK_REPORTS = buildMockReports();
const HIGH_RISK_CLASSES = ['high_risk', 'suspected_mci', 'attention', 'confirmed_impairment'];

// ========== Mock Action 分发 ==========
function handleMockAction(action, params) {
  switch (action) {
    case 'doctorLogin': {
      if (params.username === 'admin' && params.password === 'admin123') {
        return {
          token: 'admin_token_' + Date.now() + '_' + Math.random().toString(36).slice(2),
          doctorInfo: { id: 'admin_001', name: '张主任', department: '神经内科', hospital: '认知障碍筛查中心', role: 'admin' }
        };
      }
      throw new Error('账号或密码错误');
    }

    case 'getDashboardStats': {
      const dist = { normal: 0, attention: 0, suspected_mci: 0, mild_risk: 0, moderate_risk: 0, high_risk: 0, confirmed_impairment: 0 };
      let highCnt = 0;
      MOCK_REPORTS.forEach(r => {
        dist[r.classification] = (dist[r.classification] || 0) + 1;
        if (HIGH_RISK_CLASSES.includes(r.classification)) highCnt++;
      });
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayCnt = MOCK_REPORTS.filter(r => new Date(r.createdAt) >= today).length;
      const latest = MOCK_REPORTS.slice(0, 10).map(r => ({
        reportId: r._id, userId: r.userId, patientName: r.profile.name,
        weightedScore: r.weightedScore, classification: r.classification,
        classificationLabel: r.classificationLabel, createdAt: r.createdAt,
        followUpStatus: r.followUpStatus, profile: r.profile
      }));

      return {
        patientCount: MOCK_USERS.length, reportCount: MOCK_REPORTS.length,
        screeningCount: MOCK_REPORTS.length, highRiskCount: highCnt,
        todayCount: todayCnt, riskDistribution: dist, latestReports: latest
      };
    }

    case 'getPatientList': {
      const { keyword = '', skip = 0, limit = 20 } = params;
      let list = MOCK_USERS;
      if (keyword) list = list.filter(u => u.profile.name.includes(keyword));
      const total = list.length;
      const patients = list.slice(skip, skip + limit).map(user => {
        const reps = MOCK_REPORTS.filter(r => r.userId === user._openid);
        const latest = reps[0] || null;
        return {
          userId: user._openid, openid: user._openid,
          name: user.profile.name, age: user.profile.age, gender: user.profile.gender,
          education: user.profile.education, dialect: user.profile.dialect,
          kinshipPhone: user.kinshipPhone, createdAt: user.createdAt, updatedAt: user.updatedAt,
          screeningCount: reps.length,
          lastScreeningAt: latest ? latest.createdAt : null,
          lastScore: latest ? latest.weightedScore : null,
          lastClassification: latest ? latest.classification : null
        };
      });
      return { patients, total, page: Math.floor(skip / limit) + 1, pageSize: limit };
    }

    case 'getPatientDetail': {
      const user = MOCK_USERS.find(u => u._openid === params.userId);
      if (!user) throw new Error('患者不存在');
      const reps = MOCK_REPORTS.filter(r => r.userId === params.userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const screenings = reps.map((r, i) => ({
        screeningId: r.screeningId, status: 'completed',
        topics: buildTopics(parseInt(r._id.split('_').pop()) || i),
        openingMessage: '您好呀！今天天气不错，您今天感觉怎么样？我们随便聊聊天。',
        dialect: user.profile.dialect, startedAt: new Date(new Date(r.createdAt).getTime() - 1800000).toISOString(),
        completedAt: r.createdAt, reportId: r._id, topicCount: 8
      }));
      return {
        patient: { userId: user._openid, openid: user._openid, name: user.profile.name, age: user.profile.age, gender: user.profile.gender, education: user.profile.education, dialect: user.profile.dialect, kinshipPhone: user.kinshipPhone, createdAt: user.createdAt, updatedAt: user.updatedAt },
        reports: reps, screenings
      };
    }

    case 'getReportList': {
      const { keyword = '', classification = '', userId = '', skip = 0, limit = 20 } = params;
      let list = [...MOCK_REPORTS];
      if (classification) list = list.filter(r => r.classification === classification);
      if (userId) list = list.filter(r => r.userId === userId);
      if (keyword) list = list.filter(r => r.profile.name.includes(keyword));
      const total = list.length;
      return { reports: list.slice(skip, skip + limit), total, page: Math.floor(skip / limit) + 1, pageSize: limit };
    }

    case 'getHighRiskReports': {
      const { keyword = '', followUpStatus = '', skip = 0, limit = 20 } = params;
      let list = MOCK_REPORTS.filter(r => HIGH_RISK_CLASSES.includes(r.classification));
      if (followUpStatus) list = list.filter(r => r.followUpStatus === followUpStatus || (!r.followUpStatus && followUpStatus === 'pending'));
      if (keyword) list = list.filter(r => r.profile.name.includes(keyword));
      return { reports: list.slice(skip, skip + limit), total: list.length, page: Math.floor(skip / limit) + 1, pageSize: limit };
    }

    case 'getFollowUpList': {
      const { keyword = '', followUpStatus = '', skip = 0, limit = 20 } = params;
      let list = MOCK_REPORTS.filter(r => r.followUpStatus && r.followUpStatus !== '');
      if (followUpStatus) list = list.filter(r => r.followUpStatus === followUpStatus);
      if (keyword) list = list.filter(r => r.profile.name.includes(keyword));
      return { reports: list.slice(skip, skip + limit), total: list.length, page: Math.floor(skip / limit) + 1, pageSize: limit };
    }

    case 'getReportDetail': {
      const report = MOCK_REPORTS.find(r => r._id === params.reportId);
      if (!report) throw new Error('报告不存在');
      const user = MOCK_USERS.find(u => u._openid === report.userId);
      const seed = parseInt(report._id.split('_').pop()) || 0;
      const screening = {
        screeningId: report.screeningId, userId: report.userId, status: 'completed',
        topics: buildTopics(seed),
        openingMessage: '您好呀！今天天气不错，您今天感觉怎么样？我们随便聊聊天。',
        dialect: user ? user.profile.dialect : '普通话',
        startedAt: new Date(new Date(report.createdAt).getTime() - 2000000).toISOString(),
        completedAt: report.createdAt, topicCount: 8
      };
      return {
        report: { ...report, reportId: report._id },
        screening,
        patient: user ? {
          userId: user._openid, name: user.profile.name, age: user.profile.age,
          gender: user.profile.gender, education: user.profile.education,
          dialect: user.profile.dialect, kinshipPhone: user.kinshipPhone
        } : null
      };
    }

    case 'updateFollowUp': {
      const report = MOCK_REPORTS.find(r => r._id === params.reportId);
      if (!report) throw new Error('报告不存在');
      if (params.followUpStatus !== undefined) report.followUpStatus = params.followUpStatus;
      if (params.followUpNote !== undefined) report.followUpNote = params.followUpNote;
      if (params.followUpTime !== undefined) report.followUpTime = params.followUpTime;
      if (params.doctorName !== undefined) report.doctorName = params.doctorName;
      return { reportId: params.reportId, followUpStatus: report.followUpStatus, followUpNote: report.followUpNote, followUpTime: report.followUpTime, doctorName: report.doctorName };
    }

    // ======== 新增专业端 API ========
    case 'getClinicalAssessment': {
      const user = MOCK_USERS.find(u => u._openid === params.userId);
      const reps = MOCK_REPORTS.filter(r => r.userId === params.userId);
      return {
        patient: user ? { userId: user._openid, name: user.profile.name, age: user.profile.age, gender: user.profile.gender, education: user.profile.education, dialect: user.profile.dialect } : null,
        latestReport: reps[0] || null,
        diagnosis: { conclusion: '', mmseScore: '', mocaScore: '', clinicalNote: '', assessedBy: '', assessedAt: null },
        allReports: reps
      };
    }
    case 'saveClinicalAssessment': return { success: true, message: '临床评估已保存', data: params };
    case 'getInterventionPlan': return {
      plan: {
        riskLevel: params.riskLevel || 'mild_risk',
        brainTraining: ['每日记忆训练 15min', '数字广度练习', '词语配对游戏'],
        diet: ['增加深海鱼类摄入', '每日坚果 30g', '控制精制碳水'],
        sleep: ['固定就寝时间 21:30', '睡前避免使用电子设备', '午后不饮浓茶'],
        social: ['每周社区活动 ≥2次', '鼓励与家人视频通话', '参加老年兴趣小组'],
        personalized: '',
        doctorName: '张主任',
        updatedAt: new Date().toISOString()
      }
    };
    case 'saveInterventionPlan': return { success: true, message: '方案已保存' };
    case 'pushInterventionPlan': return { success: true, message: '已下发至患者端和家属端' };
    case 'getModelConfig': return {
      promptTemplate: '你是一位资深的神经内科专家，正在进行MCI认知障碍筛查。请根据以下对话，从#{dimensions}等维度进行评估。\n\n对话记录：\n#{dialogue}\n\n患者信息：#{profile}\n\n请输出JSON格式的评估结果。',
      weights: { tipOfTongue: 25, memory: 30, complexThought: 15, lexicalComplexity: 10, syntacticComplexity: 10, semanticCoherence: 10 },
      model: 'deepseek',
      availableModels: ['deepseek', 'xinghuo']
    };
    case 'saveModelConfig': return { success: true, message: '配置已保存' };
    case 'compareModelOutput': return {
      deepseek: { weightedScore: 4.2, classification: 'mild_risk', latency: 2.3 },
      xinghuo: { weightedScore: 4.8, classification: 'mild_risk', latency: 1.8 },
      comparison: '两个模型在词汇和语义维度评估基本一致，DeepSeek在流畅度评估上更保守。'
    };
    case 'exportResearchData': return {
      preview: MOCK_REPORTS.slice(0, 5).map(r => ({
        patientName: r.profile.name[0] + '*', age: r.profile.age, gender: r.profile.gender,
        weightedScore: r.weightedScore, classification: r.classification, createdAt: r.createdAt
      })),
      total: MOCK_REPORTS.length,
      availableFields: ['patientName','age','gender','education','dialect','weightedScore','classification','dimensions','observations','createdAt']
    };
    case 'getDoctorMessages': return {
      messages: [
        { id: 'm1', type: 'alert', title: '筛查异常提醒', content: '患者张秀英最近一次筛查显示高度MCI风险，建议尽快安排门诊评估。', patientName: '张秀英', createdAt: new Date(Date.now()-86400000).toISOString(), read: false },
        { id: 'm2', type: 'family', title: '家属留言', content: '医生您好，我母亲最近记忆力下降明显，请问需要做什么检查？', patientName: '王桂芳', createdAt: new Date(Date.now()-172800000).toISOString(), read: false },
        { id: 'm3', type: 'system', title: '系统通知', content: '本月高风险筛查报告已生成，请及时查看并跟进。', createdAt: new Date().toISOString(), read: true }
      ],
      unread: 2
    };
    case 'replyDoctorMessage': return { success: true, message: '回复已发送（科普建议，不替代面诊）' };
    case 'getInstitutionStats': return {
      totalScreenings: 328, positiveRate: '23.5%', revisitRate: '41.2%',
      monthlyTrend: [{ month:'1月',total:42,positive:8 },{ month:'2月',total:38,positive:9 },{ month:'3月',total:51,positive:12 },{ month:'4月',total:45,positive:10 },{ month:'5月',total:55,positive:14 },{ month:'6月',total:48,positive:11 },{ month:'7月',total:49,positive:13 }],
      classificationDist: { normal: 172, attention: 48, suspected_mci: 36, mild_risk: 28, moderate_risk: 24, high_risk: 14, confirmed_impairment: 6 },
      departmentSummary: '本季度共完成认知筛查 328 例，初筛阳性率 23.5%，复诊占比 41.2%。高风险患者已全部通知门诊随访。'
    };

    // 新增专业端 Mock
    case 'advancedSearchPatients': return { patients: MOCK_USERS.map(u=>({...u,name:u.profile.name,age:u.profile.age,gender:u.profile.gender,outpatientId:'OPT'+Math.floor(10000+Math.random()*90000),inpatientId:Math.random()>0.5?'INP'+Math.floor(20000+Math.random()*90000):null})), total: MOCK_USERS.length };
    case 'getFullReportDetail': { const r=MOCK_REPORTS[0]; return {report:r,screening:{topics:buildTopics(0)},patient:MOCK_USERS[0],trend:{points:[{date:'2026-05-01',score:3.2},{date:'2026-06-01',score:3.8},{date:'2026-07-01',score:4.5}]}}; }
    case 'saveCorrectedTranscript': return { success: true, message: '转写已校正' };
    case 'reanalyzeReport': return { success: true, message: '重新分析已提交' };
    case 'getPatientTrend': return { points: Array.from({length:6},(_,i)=>({date:new Date(Date.now()-(6-i)*15*86400000).toISOString(),score:parseFloat((2+Math.random()*5).toFixed(1))})) };
    case 'compareReports': return { report1:{weightedScore:3.2,classification:'normal'},report2:{weightedScore:4.5,classification:'mild_risk'},diff:{score:+1.3,indicators:{vocabulary:+0.8,syntax:+0.3,semantic:+1.1}} };
    case 'saveClinicalScaleScores': case 'generateClinicalAdvice': case 'generateReferralNote': case 'scheduleFollowUp': return { success: true, message: '操作成功' };
    case 'getInterventionTemplates': return { templates:[{name:'认知正常预防方案',level:'normal',items:['每周2次记忆游戏','地中海饮食','每日快走30min']},{name:'低风险干预方案',level:'mild_risk',items:['每日认知训练','增加社交活动','定期随访']},{name:'疑似MCI强化方案',level:'suspected_mci',items:['强化记忆训练','神经内科门诊','家属照护培训']}] };
    case 'getInterventionCompliance': return { compliance:{screeningRate:85,followUpRate:70,planRate:55} };
    case 'getPromptConfig': return { promptTemplate:sectionsMock.map(s=>s.content).join('\n'),weights:{vocabulary:30,syntax:15,semantic:25,tipOfTongue:10,complexThought:10,memory:10},model:'deepseek' };
    case 'savePromptConfig': case 'previewPrompt': return { success: true };
    case 'getModelProviders': return [{name:'DeepSeek',active:true,apiUrl:'https://api.deepseek.com/v1'},{name:'星火',active:false,apiUrl:'https://spark-api.xf-yun.com/v3.5'}];
    case 'getConfigVersions': return { versions:[{version:'v2.4',author:'张主任',note:'调整权重',time:'2026-07-10'},{version:'v2.3',author:'张主任',note:'新增指标',time:'2026-07-05'},{version:'v2.2',author:'李医生',note:'优化边界',time:'2026-06-28'}] };
    case 'rollbackConfigVersion': return { success: true, message: `已回滚至 ${params.version}` };
    case 'runABTest': return [{metric:'准确率',a:'72.3%',b:'68.9%',winner:'A'}];
    case 'searchResearchSamples': return { samples:MOCK_REPORTS.slice(0,10).map(r=>({id:r._id,age:r.profile.age,gender:r.profile.gender,score:r.weightedScore,classification:r.classification})), total: MOCK_REPORTS.length, groups:{normal:172,attention:48,suspected_mci:36,high_risk:14} };
    case 'previewDeidentifiedData': return { preview:MOCK_REPORTS.slice(0,5).map(r=>({ageRange:r.profile.age[0]+'0-'+r.profile.age[0]+'9',gender:r.profile.gender,score:r.weightedScore,classification:r.classification})), privacyCheck:'✅ 通过——无敏感字段残留' };
    case 'saveResearchDataset': case 'labelResearchSample': return { success: true };
    case 'getResearchDatasets': return { datasets:[{name:'MCI语言标志物研究',samples:286,completeness:85,status:'进行中'},{name:'方言差异筛查研究',samples:142,completeness:60,status:'进行中'}] };
    case 'getAlertNotifications': return { alerts:[{id:'a1',patientName:'张秀英',score:9.8,classification:'high_risk',status:'unviewed',time:new Date().toISOString()},{id:'a2',patientName:'王桂芳',score:7.5,classification:'suspected_mci',status:'contacted',time:new Date(Date.now()-86400000).toISOString()}] };
    case 'updateAlertStatus': case 'saveFollowUpRecord': return { success: true };
    case 'getComplianceStats': return { patients:[{name:'张秀英',screeningRate:100,followUpRate:80,planRate:65},{name:'王桂芳',screeningRate:60,followUpRate:40,planRate:30}] };
    case 'getModelPerformanceStats': return { accuracy:72.3,sensitivity:84.1,specificity:61.2,monthlyTrend:[{month:'1月',accuracy:70},{month:'4月',accuracy:72.5},{month:'7月',accuracy:72.3}] };
    case 'getResearchSummary': return { projects:3,totalSamples:940,completedStudies:1,ongoingStudies:2 };

    default: throw new Error(`未知操作: ${action}`);
  }
}

// Prompt 配置 Mock 默认内容
const sectionsMock=[{key:'role',content:'你是一位资深的神经内科专家，正在进行MCI认知障碍筛查评估。你的工作目标是基于患者的自然语言对话，从多维度进行认知功能分析。请严格在专业边界内工作——仅分析语言特征，不提供最终临床诊断。'},{key:'scoring',content:'评分范围：0-10分。等级划分：0-3分为正常，3-5分为需关注，5-7分为疑似MCI，7-10分为高度风险。每个维度独立评分后加权汇总。'},{key:'indicators',content:'核心指标：1)舌尖现象 2)复杂想法处理困难 3)记忆问题。词汇维度：词汇丰富度、常用词占比、代词比例、罕见词使用率。句法维度：句子平均长度、语法复杂度、句式多样性、语法错误次数。语义维度：语义连贯性、叙事逻辑性、信息密度、主题偏离程度。'},{key:'output',content:'请以JSON格式输出评估结果。格式：{"weightedScore":number,"classification":string,"dimensions":{...},"observations":[{...}],"interventions":[{...}]}'},{key:'constraints',content:'医学伦理说明：本评估为AI初筛参考，不构成临床诊断，最终诊断需由执业医师判定。异常情况处理：若对话内容不足以评估某维度，标记为"数据不足"。不替代临床诊断的声明。'}];

// ========== 对话生成 ==========
function buildTopics(seed) {
  const defs = [
    { type: 'opening', label: '开场白', q: '您好呀！今天天气不错，您今天感觉怎么样？我们随便聊聊天。', a: '' },
    { type: 'food', label: '饮食习惯', q: '您平时一日三餐都怎么安排的呀？胃口还好吗？', a: '早上一般喝点粥配点咸菜，中午随便热点剩菜吃，晚上等娃儿下班回来一起做。胃口嘛，还行，就是有时候一个人吃饭也不想弄。' },
    { type: 'activity', label: '日常活动', q: '您平时喜欢出门活动活动吗？都做些什么呢？', a: '就是在小区里头转一转，也不远走。以前还打打麻将，现在那个...就是那个...打得少多了，记不住牌了。' },
    { type: 'sleep', label: '睡眠情况', q: '晚上睡得好不好呀？一般几点上床休息？', a: '睡得不太好，有时候半夜醒了就再也睡不着了，就只能躺着听收音机。一般九点多就躺下了，但翻来覆去到十一点都不一定能睡着。' },
    { type: 'mood', label: '情绪状态', q: '您最近心情怎么样？有没有什么让您开心的事？', a: '还行吧，上周孙子来看我了，高兴得很。平时嘛，有时候也会觉得没啥意思，一个人待着就瞎想。' },
    { type: 'memory', label: '记忆能力', q: '您觉得自己记性怎么样？跟前两年比有变化吗？', a: '记性不行了哦，经常找不到钥匙和手机，有时候进了厨房忘了要拿什么。前天早上吃了啥现在都想不太起来了。比以前差多了。' },
    { type: 'social', label: '社交情况', q: '您平时跟街坊邻居走动得多不多？', a: '不怎么走动了，以前还经常一起打牌跳广场舞，现在腿脚不太方便也就不怎么出门了。偶尔楼下碰到打个招呼。' },
    { type: 'routine', label: '日常生活', q: '您每天大概是怎么过的？有什么固定的习惯吗？', a: '早上六点多就醒了，喝杯水看会儿电视，中午吃完饭睡一觉，下午出去转转然后买菜，晚上等娃儿回来。一天就这么过去了。' }
  ];
  return defs.map((t, i) => ({
    topicType: t.type, topicLabel: t.label, aiQuestion: t.q,
    userText: t.a || '', createdAt: new Date(Date.now() - (defs.length - i) * 420000 - seed * 8000).toISOString()
  }));
}

// 新增专业端 API
export async function getClinicalAssessment(userId) { return callAdmin('getClinicalAssessment', { userId }); }
export async function saveClinicalAssessment(data) { return callAdmin('saveClinicalAssessment', data); }
export async function getInterventionPlan(riskLevel) { return callAdmin('getInterventionPlan', { riskLevel }); }
export async function saveInterventionPlan(data) { return callAdmin('saveInterventionPlan', data); }
export async function pushInterventionPlan(data) { return callAdmin('pushInterventionPlan', data); }
export async function getModelConfig() { return callAdmin('getModelConfig'); }
export async function saveModelConfig(data) { return callAdmin('saveModelConfig', data); }
export async function compareModelOutput(data) { return callAdmin('compareModelOutput', data); }
export async function exportResearchData(opts) { return callAdmin('exportResearchData', opts); }
export async function getDoctorMessages() { return callAdmin('getDoctorMessages'); }
export async function replyDoctorMessage(data) { return callAdmin('replyDoctorMessage', data); }
export async function getInstitutionStats() { return callAdmin('getInstitutionStats'); }
// 更多专业端 API
export async function advancedSearchPatients(opts) { return callAdmin('advancedSearchPatients', opts); }
export async function getFullReportDetail(rid) { return callAdmin('getFullReportDetail', { reportId: rid }); }
export async function saveCorrectedTranscript(data) { return callAdmin('saveCorrectedTranscript', data); }
export async function reanalyzeReport(rid) { return callAdmin('reanalyzeReport', { reportId: rid }); }
export async function getPatientTrend(uid, range) { return callAdmin('getPatientTrend', { userId: uid, range }); }
export async function compareReports(rid1, rid2) { return callAdmin('compareReports', { reportId1: rid1, reportId2: rid2 }); }
export async function saveClinicalScaleScores(data) { return callAdmin('saveClinicalScaleScores', data); }
export async function generateClinicalAdvice(data) { return callAdmin('generateClinicalAdvice', data); }
export async function generateReferralNote(data) { return callAdmin('generateReferralNote', data); }
export async function scheduleFollowUp(data) { return callAdmin('scheduleFollowUp', data); }
export async function getInterventionTemplates() { return callAdmin('getInterventionTemplates'); }
export async function getInterventionCompliance(uid) { return callAdmin('getInterventionCompliance', { userId: uid }); }
export async function getPromptConfig() { return callAdmin('getPromptConfig'); }
export async function savePromptConfig(data) { return callAdmin('savePromptConfig', data); }
export async function previewPrompt(data) { return callAdmin('previewPrompt', data); }
export async function getModelProviders() { return callAdmin('getModelProviders'); }
export async function getConfigVersions() { return callAdmin('getConfigVersions'); }
export async function rollbackConfigVersion(ver) { return callAdmin('rollbackConfigVersion', { version: ver }); }
export async function runABTest(data) { return callAdmin('runABTest', data); }
export async function searchResearchSamples(opts) { return callAdmin('searchResearchSamples', opts); }
export async function previewDeidentifiedData(opts) { return callAdmin('previewDeidentifiedData', opts); }
export async function saveResearchDataset(data) { return callAdmin('saveResearchDataset', data); }
export async function labelResearchSample(data) { return callAdmin('labelResearchSample', data); }
export async function getResearchDatasets() { return callAdmin('getResearchDatasets'); }
export async function getAlertNotifications() { return callAdmin('getAlertNotifications'); }
export async function updateAlertStatus(data) { return callAdmin('updateAlertStatus', data); }
export async function saveFollowUpRecord(data) { return callAdmin('saveFollowUpRecord', data); }
export async function getComplianceStats() { return callAdmin('getComplianceStats'); }
export async function getModelPerformanceStats() { return callAdmin('getModelPerformanceStats'); }
export async function getResearchSummary() { return callAdmin('getResearchSummary'); }

export default { doctorLogin, getDashboardStats, getPatientList, getPatientDetail, getReportList, getReportDetail, updateFollowUp, getHighRiskReports, getFollowUpList, getClinicalAssessment, saveClinicalAssessment, getInterventionPlan, saveInterventionPlan, pushInterventionPlan, getModelConfig, saveModelConfig, compareModelOutput, exportResearchData, getDoctorMessages, replyDoctorMessage, getInstitutionStats, advancedSearchPatients, getFullReportDetail, saveCorrectedTranscript, reanalyzeReport, getPatientTrend, compareReports, saveClinicalScaleScores, generateClinicalAdvice, generateReferralNote, scheduleFollowUp, getInterventionTemplates, getInterventionCompliance, getPromptConfig, savePromptConfig, previewPrompt, getModelProviders, getConfigVersions, rollbackConfigVersion, runABTest, searchResearchSamples, previewDeidentifiedData, saveResearchDataset, labelResearchSample, getResearchDatasets, getAlertNotifications, updateAlertStatus, saveFollowUpRecord, getComplianceStats, getModelPerformanceStats, getResearchSummary };
