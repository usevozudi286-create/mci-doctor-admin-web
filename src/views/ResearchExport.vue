<template>
  <div class="research-page">
    <h2 class="page-hd">
      <el-icon><Download /></el-icon>
      科研数据导出
    </h2>

    <section class="export-panel">
      <div class="panel-head">
        <div>
          <h3>样本筛选与脱敏导出</h3>
          <p>按时间、风险等级筛选筛查报告，导出前自动处理姓名、手机号、OpenID 等敏感信息。</p>
        </div>
        <el-tag type="success" effect="plain">伦理合规演示版</el-tag>
      </div>

      <div class="filters">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="date-picker"
        />

        <el-select v-model="riskLevel" placeholder="风险等级" clearable class="risk-select">
          <el-option label="全部风险" value="" />
          <el-option label="正常" value="normal" />
          <el-option label="需关注" value="attention" />
          <el-option label="疑似 MCI" value="suspected_mci" />
          <el-option label="轻度 MCI 风险" value="mild_risk" />
          <el-option label="中度 MCI 风险" value="moderate_risk" />
          <el-option label="高度 MCI 风险" value="high_risk" />
        </el-select>

        <el-switch
          v-model="deidentify"
          active-text="开启脱敏"
          inactive-text="原始字段"
          inline-prompt
          class="mask-switch"
        />

        <el-button type="primary" :loading="loading" @click="loadData">
          预览数据
        </el-button>
        <el-button type="success" :disabled="!rows.length" @click="exportCSV">
          导出 CSV
        </el-button>
        <el-button type="warning" :disabled="!rows.length" @click="exportExcel">
          导出 Excel
        </el-button>
      </div>

      <div class="summary-grid">
        <div class="summary-item">
          <span>符合条件样本</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="summary-item">
          <span>当前预览</span>
          <strong>{{ rows.length }}</strong>
        </div>
        <div class="summary-item">
          <span>脱敏状态</span>
          <strong>{{ deidentify ? '已开启' : '未开启' }}</strong>
        </div>
        <div class="summary-item">
          <span>导出格式</span>
          <strong>CSV / Excel</strong>
        </div>
      </div>
    </section>

    <section class="table-card result-card">
      <div class="result-head">
        <div>
          <h3>数据预览</h3>
          <p>{{ privacyText }}</p>
        </div>
        <el-button text type="primary" :disabled="!rows.length" @click="copyPreview">
          复制预览
        </el-button>
      </div>

      <el-table :data="rows" v-loading="loading" stripe border max-height="560">
        <el-table-column
          v-for="col in columns"
          :key="col"
          :prop="col"
          :label="columnLabel(col)"
          :min-width="columnWidth(col)"
          show-overflow-tooltip
        />
      </el-table>

      <div class="table-foot">
        共 {{ total }} 条记录。脱敏规则：姓名仅保留姓氏，手机号隐藏中间四位，不导出 OpenID、就诊号和语音文件地址。
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { exportResearchData } from '../api/admin';

const dateRange = ref(null);
const riskLevel = ref('');
const deidentify = ref(true);
const loading = ref(false);
const rows = ref([]);
const total = ref(0);
const columns = ref([]);

const privacyText = computed(() => {
  if (!rows.value.length) return '暂无数据，请先点击“预览数据”。';
  return deidentify.value
    ? '隐私校验通过：当前预览数据不包含姓名全称、手机号、OpenID 或语音地址。'
    : '当前为原始字段演示模式，正式科研导出建议开启脱敏。';
});

function buildParams() {
  return {
    startDate: dateRange.value?.[0] || '',
    endDate: dateRange.value?.[1] || '',
    riskLevel: riskLevel.value,
    deidentify: deidentify.value
  };
}

async function loadData() {
  loading.value = true;
  try {
    const data = await exportResearchData(buildParams());
    rows.value = data.records || data.preview || [];
    total.value = data.total || rows.value.length;
    columns.value = data.fields || Object.keys(rows.value[0] || {});
    if (!rows.value.length) {
      ElMessage.info('没有符合条件的数据，可以调整筛选条件');
    }
  } catch (error) {
    ElMessage.error(error.message || '数据加载失败');
  } finally {
    loading.value = false;
  }
}

function columnLabel(key) {
  const labels = {
    sampleId: '样本编号',
    patientName: '患者姓名',
    age: '年龄',
    ageRange: '年龄段',
    gender: '性别',
    education: '教育程度',
    dialect: '方言',
    weightedScore: '综合评分',
    classification: '风险等级',
    classificationLabel: '风险标签',
    vocabularyScore: '词汇得分',
    syntaxScore: '句法得分',
    semanticScore: '语义得分',
    fluencyScore: '流畅度',
    logicScore: '逻辑得分',
    pauseCount: '停顿次数',
    repeatCount: '重复次数',
    hesitationCount: '迟疑次数',
    transcript: '脱敏转写文本',
    clinicalDiagnosis: '临床标签',
    mmseScore: 'MMSE',
    mocaScore: 'MoCA',
    createdAt: '筛查时间'
  };
  return labels[key] || key;
}

function columnWidth(key) {
  if (['transcript'].includes(key)) return 260;
  if (['createdAt', 'classificationLabel'].includes(key)) return 150;
  if (['sampleId'].includes(key)) return 130;
  return 110;
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\r?\n/g, ' ');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildCSV() {
  const header = columns.value.map(columnLabel);
  const body = rows.value.map(row => columns.value.map(col => csvEscape(row[col])).join(','));
  return '\ufeff' + [header.join(','), ...body].join('\n');
}

function exportCSV() {
  if (!rows.value.length) return;
  downloadBlob(buildCSV(), `科研脱敏数据_${Date.now()}.csv`, 'text/csv;charset=utf-8');
  ElMessage.success('CSV 已导出');
}

function exportExcel() {
  if (!rows.value.length) return;
  const header = columns.value.map(col => `<th>${columnLabel(col)}</th>`).join('');
  const body = rows.value.map(row => {
    const cells = columns.value.map(col => `<td>${String(row[col] ?? '').replace(/</g, '&lt;')}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  const html = `
    <html>
      <head><meta charset="utf-8" /></head>
      <body><table border="1"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body>
    </html>
  `;
  downloadBlob('\ufeff' + html, `科研脱敏数据_${Date.now()}.xls`, 'application/vnd.ms-excel;charset=utf-8');
  ElMessage.success('Excel 已导出');
}

async function copyPreview() {
  if (!rows.value.length) return;
  await navigator.clipboard.writeText(buildCSV().replace(/^\ufeff/, ''));
  ElMessage.success('预览数据已复制');
}

onMounted(loadData);
</script>

<style scoped>
.research-page {
  max-width: 1500px;
}

.export-panel,
.result-card {
  background: #ffffff;
  border: 1px solid #e4e8ee;
  border-radius: 10px;
  box-shadow: 0 6px 22px rgba(20, 35, 55, 0.06);
  margin-bottom: 16px;
}

.export-panel {
  padding: 18px;
}

.panel-head,
.result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-head h3,
.result-head h3 {
  margin: 0;
  color: #1d2939;
  font-size: 17px;
}

.panel-head p,
.result-head p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.6;
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.date-picker {
  width: 320px;
}

.risk-select {
  width: 180px;
}

.mask-switch {
  min-width: 120px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.summary-item {
  padding: 12px;
  border-radius: 8px;
  background: #f6f9fc;
  border: 1px solid #edf1f6;
}

.summary-item span {
  display: block;
  color: #667085;
  font-size: 12px;
}

.summary-item strong {
  display: block;
  margin-top: 5px;
  color: #1d2939;
  font-size: 18px;
}

.result-card {
  overflow: hidden;
}

.result-head {
  padding: 16px 18px 0;
}

.table-foot {
  padding: 12px 16px;
  color: #667085;
  font-size: 13px;
  border-top: 1px solid #edf1f6;
}

@media (max-width: 768px) {
  .filters {
    align-items: stretch;
  }

  .date-picker,
  .risk-select,
  .filters .el-button {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-head,
  .result-head {
    display: block;
  }
}
</style>
