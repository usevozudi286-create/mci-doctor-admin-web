/**
 * 格式化工具
 */

/** 日期时间 → yyyy-MM-dd HH:mm */
export function fmtDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** 日期 → yyyy-MM-dd */
export function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** 短日期 → MM-dd HH:mm */
export function fmtShort(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** 姓名脱敏 */
export function maskName(n) {
  if (!n) return '***';
  if (n.length <= 1) return n;
  return n[0] + '*'.repeat(n.length - 1);
}
