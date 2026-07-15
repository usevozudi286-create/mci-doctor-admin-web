/**
 * 状态映射工具
 * 统一管理风险等级、随访状态的标签和颜色
 */

/* 风险等级 */
export const RISK_MAP = {
  normal:               { label: '正常', color: '#0ea882' },
  attention:            { label: '需关注', color: '#e6a23c' },
  suspected_mci:        { label: '疑似MCI', color: '#e6930c' },
  mild_risk:            { label: '轻度MCI风险', color: '#e6a23c' },
  moderate_risk:        { label: '中度MCI风险', color: '#e04b4b' },
  high_risk:            { label: '高度MCI风险', color: '#d43030' },
  confirmed_impairment: { label: '确认认知障碍', color: '#7c8ca5' },
};

export const RISK_TAG_TYPE = {
  normal: 'success', attention: 'warning', suspected_mci: 'warning',
  mild_risk: 'warning', moderate_risk: 'danger', high_risk: 'danger',
  confirmed_impairment: 'info',
};

export function riskLabel(cls) { return RISK_MAP[cls]?.label || cls || '-'; }
export function riskColor(cls) { return RISK_MAP[cls]?.color || '#7c8ca5'; }
export function riskTagType(cls) { return RISK_TAG_TYPE[cls] || 'info'; }

/* 随访状态 */
export const FOLLOWUP_MAP = {
  pending:   { label: '待处理', color: '#e04b4b', tagType: 'danger' },
  contacted: { label: '已联系', color: '#e6a23c', tagType: 'warning' },
  referred:  { label: '已转诊', color: '#2c6fce', tagType: '' },
  closed:    { label: '已关闭', color: '#0ea882', tagType: 'success' },
};

export function followUpLabel(s) { return FOLLOWUP_MAP[s]?.label || '未处理'; }
export function followUpColor(s) { return FOLLOWUP_MAP[s]?.color || '#b0bac9'; }
export function followUpTagType(s) { return FOLLOWUP_MAP[s]?.tagType || 'info'; }

/* 分数颜色 */
export function scoreColor(v) {
  if (v == null) return '#b0bac9';
  if (v >= 5.5) return '#e04b4b';
  if (v >= 3.5) return '#e6a23c';
  return '#0ea882';
}

/* 子指标颜色 */
export function subScoreBg(v) {
  if (v == null) return '#f0f2f5';
  if (v < 2) return '#fef0f0';
  if (v < 3) return '#fdf6ec';
  return '#e6f7f3';
}
