<template>
  <div class="stats-page">
    <h2 class="page-hd">
      <el-icon><TrendCharts /></el-icon>
      机构统计
    </h2>

    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-value blue">{{ stats.totalScreenings }}</div>
        <div class="metric-label">筛查总量</div>
      </div>
      <div class="metric-card">
        <div class="metric-value orange">{{ stats.positiveRate }}</div>
        <div class="metric-label">初筛阳性率</div>
      </div>
      <div class="metric-card">
        <div class="metric-value green">{{ stats.revisitRate }}</div>
        <div class="metric-label">复诊占比</div>
      </div>
      <div class="metric-card">
        <div class="metric-value red">{{ monthlyTotal }}</div>
        <div class="metric-label">本月筛查</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="14">
        <div class="card-box">
          <div class="card-hd">
            <el-icon><TrendCharts /></el-icon>
            月度筛查趋势
          </div>
          <div class="card-bd">
            <div ref="trendRef" class="chart"></div>
          </div>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="card-box">
          <div class="card-hd">
            <el-icon><PieChart /></el-icon>
            风险分布
          </div>
          <div class="card-bd">
            <div ref="pieRef" class="chart"></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="card-box">
      <div class="card-hd">
        <el-icon><Document /></el-icon>
        科室工作总结
      </div>
      <div class="card-bd">
        <p class="summary">{{ stats.departmentSummary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { Document, PieChart, TrendCharts } from '@element-plus/icons-vue'
import { getInstitutionStats } from '../api/admin'

const stats = ref({
  totalScreenings: 0,
  positiveRate: '',
  revisitRate: '',
  monthlyTrend: [],
  classificationDist: {},
  departmentSummary: ''
})

const trendRef = ref(null)
const pieRef = ref(null)
let trendChart = null
let pieChart = null

const monthlyTotal = computed(() => {
  const trend = stats.value.monthlyTrend
  return trend.length ? trend[trend.length - 1].total : 0
})

async function load() {
  try {
    stats.value = await getInstitutionStats()
    await nextTick()
    renderTrend()
    renderPie()
  } catch (error) {
    console.error(error)
  }
}

function renderTrend() {
  if (!trendRef.value) return
  if (!trendChart) trendChart = echarts.init(trendRef.value)
  const data = stats.value.monthlyTrend

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      confine: true,
      appendToBody: true,
      position(point) {
        return [point[0] + 14, 12]
      }
    },
    grid: {
      left: 48,
      right: 28,
      top: 36,
      bottom: 58,
      containLabel: true
    },
    legend: {
      data: ['筛查总量', '阳性数'],
      bottom: 8,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.month),
      axisLabel: { margin: 12 }
    },
    yAxis: { type: 'value', name: '例', nameGap: 18 },
    series: [
      {
        name: '筛查总量',
        type: 'bar',
        data: data.map(item => item.total),
        barMaxWidth: 32,
        itemStyle: { color: '#2c6fce', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '阳性数',
        type: 'bar',
        data: data.map(item => item.positive),
        barMaxWidth: 32,
        itemStyle: { color: '#e04b4b', borderRadius: [4, 4, 0, 0] }
      }
    ]
  })
}

function renderPie() {
  if (!pieRef.value) return
  if (!pieChart) pieChart = echarts.init(pieRef.value)
  const distribution = stats.value.classificationDist
  const labelMap = {
    normal: '正常',
    attention: '需关注',
    suspected_mci: '疑似MCI',
    mild_risk: '轻度',
    moderate_risk: '中度',
    high_risk: '高度',
    confirmed_impairment: '确认障碍'
  }

  pieChart.setOption({
    tooltip: { trigger: 'item', confine: true },
    series: [
      {
        type: 'pie',
        radius: ['44%', '70%'],
        data: Object.entries(distribution)
          .filter(([, value]) => value > 0)
          .map(([key, value]) => ({ name: labelMap[key] || key, value })),
        label: { show: false },
        emphasis: { label: { show: true } }
      }
    ]
  })
}

onMounted(load)
</script>

<style scoped>
.stats-page {
  max-width: 1500px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.metric-card {
  min-height: 96px;
  background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
  border: 1px solid #e4eaf2;
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(24, 49, 83, 0.06);
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: #2c6fce;
  opacity: .18;
}

.metric-value {
  font-size: 32px;
  line-height: 1;
  font-weight: 800;
}

.metric-label {
  margin-top: 10px;
  color: #667085;
  font-size: 14px;
}

.blue { color: #2c6fce; }
.orange { color: #e6a23c; }
.green { color: #0ea882; }
.red { color: #e04b4b; }

.chart {
  height: 320px;
}

.summary {
  margin: 0;
  line-height: 1.8;
  color: #475467;
}

@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
