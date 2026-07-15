<template>
  <div class="institution-page">
    <h2 class="page-hd">
      <el-icon><TrendCharts /></el-icon>
      机构看板
    </h2>

    <el-tabs v-model="tab" type="border-card" class="dashboard-tabs">
      <el-tab-pane label="临床统计" name="clinical">
        <div class="metric-grid metric-grid-six">
          <div class="metric-card" v-for="item in clinicalCards" :key="item.label">
            <div class="metric-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </div>

        <div class="metric-grid metric-grid-four">
          <div class="metric-card compact" v-for="item in qualityCards" :key="item.label">
            <div class="metric-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :span="14">
            <div class="card-box">
              <div class="card-hd">月度筛查趋势</div>
              <div class="card-bd">
                <div ref="trendRef" class="chart"></div>
              </div>
            </div>
          </el-col>
          <el-col :span="10">
            <div class="card-box">
              <div class="card-hd">人群特征分布</div>
              <div class="card-bd">
                <div ref="pieRef" class="chart"></div>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="模型性能" name="model">
        <div class="metric-grid metric-grid-four">
          <div class="metric-card" v-for="item in modelCards" :key="item.label">
            <div class="metric-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="metric-label">{{ item.label }}</div>
          </div>
        </div>

        <el-row :gutter="16">
          <el-col :span="12">
            <div class="card-box">
              <div class="card-hd">准确率 / 灵敏度 / 特异度趋势</div>
              <div class="card-bd">
                <div ref="perfRef" class="chart small-chart"></div>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card-box">
              <div class="card-hd">假阳性 / 假阴性案例统计</div>
              <div class="card-bd">
                <el-table :data="fpCases" size="small">
                  <el-table-column prop="id" label="案例ID" width="92" />
                  <el-table-column prop="aiScore" label="AI评分" width="80" />
                  <el-table-column prop="aiClass" label="AI分类" min-width="110" />
                  <el-table-column prop="clinical" label="临床诊断" min-width="110" />
                  <el-table-column label="差异" width="92">
                    <template #default="{ row }">
                      <el-tag :type="row.type === 'fp' ? 'danger' : 'warning'" size="small">
                        {{ row.type === 'fp' ? '假阳性' : '假阴性' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="科研支撑" name="research">
        <el-table :data="researchProjects" stripe>
          <el-table-column prop="name" label="研究项目" min-width="220" />
          <el-table-column prop="samples" label="样本量" width="100" />
          <el-table-column prop="completeness" label="完成度" width="180">
            <template #default="{ row }">
              <el-progress :percentage="row.completeness" />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === '进行中' ? 'success' : 'info'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" link @click="viewProject(row)">查看</el-button>
              <el-button size="small" link @click="exportProject(row)">导出</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="card-box mt-md">
          <div class="card-hd">自动生成基线特征表</div>
          <div class="card-bd">
            <el-table :data="baselineTable" size="small">
              <el-table-column prop="feature" label="特征" />
              <el-table-column prop="normal" label="正常组(n=172)" />
              <el-table-column prop="risk" label="风险组(n=156)" />
              <el-table-column prop="pValue" label="P值" />
            </el-table>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { TrendCharts } from '@element-plus/icons-vue'

const tab = ref('clinical')
const trendRef = ref(null)
const pieRef = ref(null)
const perfRef = ref(null)

let trendChart = null
let pieChart = null
let perfChart = null

const clinicalCards = ref([
  { label: '月筛查人次', value: 328, color: '#2c6fce' },
  { label: '报告解读量', value: 286, color: '#0ea882' },
  { label: '随访人次', value: 145, color: '#e6a23c' },
  { label: '咨询量', value: 52, color: '#7c8ca5' },
  { label: '转诊量', value: 38, color: '#e04b4b' },
  { label: '复诊占比', value: '41.2%', color: '#2c6fce' }
])

const qualityCards = ref([
  { label: '初筛-临床诊断符合率', value: '68.5%', color: '#0ea882' },
  { label: '灵敏度', value: '84.1%', color: '#2c6fce' },
  { label: '特异度', value: '61.2%', color: '#e6a23c' },
  { label: '阳性预测值', value: '65.8%', color: '#2c6fce' }
])

const modelCards = ref([
  { label: '准确率', value: '72.3%', color: '#2c6fce' },
  { label: '灵敏度(本月)', value: '83.5%', color: '#0ea882' },
  { label: '特异度(本月)', value: '62.8%', color: '#e6a23c' },
  { label: '平均响应', value: '2.3s', color: '#7c8ca5' }
])

const fpCases = ref([
  { id: 'RPT-042', aiScore: 4.2, aiClass: '需关注', clinical: 'MCI', type: 'fn' },
  { id: 'RPT-078', aiScore: 7.8, aiClass: '高度风险', clinical: '正常老化', type: 'fp' },
  { id: 'RPT-091', aiScore: 3.1, aiClass: '正常', clinical: 'MCI', type: 'fn' },
  { id: 'RPT-105', aiScore: 6.5, aiClass: '疑似MCI', clinical: '抑郁', type: 'fp' }
])

const researchProjects = ref([
  { name: 'MCI语言标志物识别研究', samples: 286, completeness: 85, status: '进行中' },
  { name: '方言差异对筛查准确率影响', samples: 142, completeness: 60, status: '进行中' },
  { name: '社区老年认知障碍流行病学调查', samples: 512, completeness: 100, status: '已完成' }
])

const baselineTable = ref([
  { feature: '年龄(岁)', normal: '68.3±7.2', risk: '73.5±8.1', pValue: '<0.01' },
  { feature: '教育年限', normal: '9.2±3.1', risk: '6.4±3.8', pValue: '<0.01' },
  { feature: 'MMSE得分', normal: '27.1±2.3', risk: '22.8±4.1', pValue: '<0.001' },
  { feature: '女性比例', normal: '54.1%', risk: '62.8%', pValue: '0.04' }
])

const chartTooltip = {
  trigger: 'axis',
  confine: true,
  appendToBody: true,
  position(point) {
    return [point[0] + 14, 12]
  }
}

const chartGrid = {
  left: 48,
  right: 28,
  top: 36,
  bottom: 58,
  containLabel: true
}

function renderTrend() {
  if (!trendRef.value) return
  trendChart = echarts.init(trendRef.value)
  trendChart.setOption({
    tooltip: chartTooltip,
    grid: chartGrid,
    legend: {
      data: ['筛查', '阳性'],
      bottom: 8,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      axisLabel: { margin: 12 }
    },
    yAxis: { type: 'value', name: '人次', nameGap: 18 },
    series: [
      {
        name: '筛查',
        type: 'bar',
        data: [42, 38, 51, 45, 55, 48, 49],
        barMaxWidth: 28,
        itemStyle: { color: '#2c6fce', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '阳性',
        type: 'bar',
        data: [8, 9, 12, 10, 14, 11, 13],
        barMaxWidth: 28,
        itemStyle: { color: '#e04b4b', borderRadius: [4, 4, 0, 0] }
      }
    ]
  })
}

function renderPie() {
  if (!pieRef.value) return
  pieChart = echarts.init(pieRef.value)
  pieChart.setOption({
    tooltip: { trigger: 'item', confine: true },
    series: [
      {
        type: 'pie',
        radius: ['44%', '70%'],
        data: [
          { name: '60-69岁', value: 142 },
          { name: '70-79岁', value: 128 },
          { name: '50-59岁', value: 38 },
          { name: '80岁以上', value: 20 }
        ]
      }
    ]
  })
}

function renderPerformance() {
  if (!perfRef.value) return
  perfChart = echarts.init(perfRef.value)
  perfChart.setOption({
    tooltip: chartTooltip,
    grid: chartGrid,
    legend: {
      data: ['准确率', '灵敏度', '特异度'],
      bottom: 8,
      left: 'center',
      itemWidth: 12,
      itemHeight: 8
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      axisLabel: { margin: 12 }
    },
    yAxis: { type: 'value', name: '%', min: 50, max: 90, nameGap: 18 },
    series: [
      { name: '准确率', type: 'line', data: [70, 71, 72, 72.5, 72, 72.3, 72.3], smooth: true, itemStyle: { color: '#2c6fce' } },
      { name: '灵敏度', type: 'line', data: [82, 83, 83.5, 84, 84, 83.5, 84.1], smooth: true, itemStyle: { color: '#0ea882' } },
      { name: '特异度', type: 'line', data: [58, 59, 60, 60.5, 61, 61.2, 61.2], smooth: true, itemStyle: { color: '#e6a23c' } }
    ]
  })
}

function viewProject(row) {
  ElMessage.info(`查看项目：${row.name}`)
}

function exportProject(row) {
  ElMessage.info(`导出数据：${row.name}`)
}

onMounted(async () => {
  await nextTick()
  renderTrend()
  renderPie()
  renderPerformance()
})
</script>

<style scoped>
.institution-page {
  max-width: 1500px;
}

.dashboard-tabs {
  border-radius: 8px;
  overflow: hidden;
}

.metric-grid {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.metric-grid-six {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric-grid-four {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.metric-card.compact {
  min-height: 84px;
}

.metric-value {
  font-size: 32px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0;
}

.metric-label {
  margin-top: 10px;
  color: #667085;
  font-size: 14px;
  line-height: 1.4;
}

.chart {
  height: 320px;
}

.small-chart {
  height: 300px;
}

@media (max-width: 900px) {
  .metric-grid-six,
  .metric-grid-four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
