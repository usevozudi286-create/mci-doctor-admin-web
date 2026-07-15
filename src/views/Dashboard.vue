<template>
  <div class="db">
    <h2 class="page-hd"><el-icon><DataBoard /></el-icon> 首页仪表盘</h2>

    <!-- 指标卡片 -->
    <div class="db-cards">
      <div class="dbc" v-for="c in cards" :key="c.k"><div class="dbc-v" :style="{color:c.color}">{{ c.v }}</div><div class="dbc-l">{{ c.l }}</div></div>
    </div>

    <el-row :gutter="16">
      <!-- 饼图 -->
      <el-col :span="13">
        <div class="card-box"><div class="card-hd"><el-icon><PieChart /></el-icon> 风险等级分布</div><div class="card-bd"><div ref="pieRef" class="db-chart"></div></div></div>
      </el-col>
      <!-- 最近报告 -->
      <el-col :span="11">
        <div class="card-box"><div class="card-hd"><el-icon><Clock /></el-icon> 最近筛查</div><div class="card-bd" style="padding:0;">
          <el-table :data="latest" size="small" style="width:100%" max-height="370">
            <el-table-column label="患者" width="80"><template #default="{row}">{{ maskName(row.patientName) }}</template></el-table-column>
            <el-table-column label="总分" width="60" sortable><template #default="{row}"><b :style="{color:scoreColor(row.weightedScore)}">{{ row.weightedScore }}</b></template></el-table-column>
            <el-table-column label="风险等级" width="130"><template #default="{row}"><el-tag :color="riskColor(row.classification)" effect="dark" size="small">{{ riskLabel(row.classification) }}</el-tag></template></el-table-column>
            <el-table-column label="时间" min-width="100"><template #default="{row}">{{ fmtShort(row.createdAt) }}</template></el-table-column>
          </el-table>
        </div></div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { DataBoard, PieChart, Clock } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { getDashboardStats } from '../api/admin';
import { riskLabel, riskColor, scoreColor } from '../utils/status';
import { maskName, fmtShort } from '../utils/format';

const cards = ref([{k:'patients',l:'累计患者',v:0,color:'#2c6fce'},{k:'reports',l:'累计报告',v:0,color:'#0ea882'},{k:'screenings',l:'累计筛查',v:0,color:'#e6a23c'},{k:'highRisk',l:'高风险患者',v:0,color:'#e04b4b'},{k:'today',l:'今日新增',v:0,color:'#7c8ca5'},{k:'pending',l:'待随访',v:0,color:'#2c6fce'}]);
const latest = ref([]);
const pieRef = ref(null); let pieCh = null;

async function load() {
  try {
    const d = await getDashboardStats();
    cards.value[0].v = d.patientCount || 0;
    cards.value[1].v = d.reportCount || 0;
    cards.value[2].v = d.screeningCount || 0;
    cards.value[3].v = d.highRiskCount || 0;
    cards.value[4].v = d.todayCount || 0;
    cards.value[5].v = d.latestReports?.filter(r => r.followUpStatus === 'pending').length || 0;
    latest.value = d.latestReports || [];
    if (d.riskDistribution) renderPie(d.riskDistribution);
  } catch (e) { console.error(e); }
}

function renderPie(dist) {
  if (!pieRef.value) return; if (!pieCh) pieCh = echarts.init(pieRef.value);
  const m = { normal:'正常',attention:'需关注',suspected_mci:'疑似MCI',mild_risk:'轻度风险',moderate_risk:'中度风险',high_risk:'高度风险',confirmed_impairment:'确认障碍' };
  const colors = ['#0ea882','#e6a23c','#e6930c','#f0c060','#e87a7a','#e04b4b','#7c8ca5'];
  pieCh.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}份 ({d}%)' },
    legend: { orient: 'vertical', right: 8, top: 'center', textStyle: { fontSize: 12 } },
    series: [{ type: 'pie', radius: ['44%','70%'], center: ['36%','52%'],
      data: Object.entries(dist).filter(([,v])=>v>0).map(([k,v],i)=>({name:m[k]||k,value:v,itemStyle:{color:colors[i]}})),
      label: { show: false }, emphasis: { label: { show: true } } }]
  });
}

function handleResize() { pieCh?.resize(); }
onMounted(() => { load(); window.addEventListener('resize', handleResize); });
onUnmounted(() => { window.removeEventListener('resize', handleResize); pieCh?.dispose(); });
</script>

<style scoped>
.db { max-width: 1500px; }
.db-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 16px; }
.dbc { background: #fff; border-radius: 8px; padding: 18px 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); border: 1px solid #e4e8ee; transition: box-shadow 0.2s; }
.dbc:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.dbc-v { font-size: 30px; font-weight: 700; }
.dbc-l { font-size: 13px; color: #7c8ca5; margin-top: 4px; }
.db-chart { height: 350px; }
</style>
