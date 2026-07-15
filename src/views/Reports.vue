<template>
  <div class="rp">
    <h2 class="page-hd"><el-icon><Document /></el-icon> 报告管理</h2>
    <div class="filter-bar">
      <el-row :gutter="10" align="middle">
        <el-col :span="5"><el-input v-model="kw" placeholder="搜索患者" clearable @clear="load" @keyup.enter="load"><template #prefix><el-icon><Search /></el-icon></template></el-input></el-col>
        <el-col :span="3"><el-select v-model="riskF" placeholder="风险等级" clearable @change="load"><el-option label="全部" value="" /><el-option label="正常" value="normal" /><el-option label="需关注" value="attention" /><el-option label="疑似MCI" value="suspected_mci" /><el-option label="轻度风险" value="mild_risk" /><el-option label="中度风险" value="moderate_risk" /><el-option label="高度风险" value="high_risk" /></el-select></el-col>
        <el-col :span="6"><el-date-picker v-model="dr" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" @change="load" /></el-col>
        <el-col :span="auto"><el-button type="primary" @click="load"><el-icon><Search /></el-icon></el-button></el-col>
      </el-row>
    </div>
    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column type="index" label="#" width="46" />
        <el-table-column label="患者" width="80"><template #default="{row}">{{ maskName(row.patientName) }}</template></el-table-column>
        <el-table-column label="年龄" width="55"><template #default="{row}">{{ row.patientAge || row.profile?.age }}</template></el-table-column>
        <el-table-column label="性别" width="55"><template #default="{row}">{{ row.patientGender || row.profile?.gender }}</template></el-table-column>
        <el-table-column label="风险等级" width="130"><template #default="{row}"><el-tag :color="riskColor(row.classification)" effect="dark" size="small">{{ riskLabel(row.classification) }}</el-tag></template></el-table-column>
        <el-table-column label="总分" width="70" sortable><template #default="{row}"><b :style="{color:scoreColor(row.weightedScore)}">{{ row.weightedScore }}</b></template></el-table-column>
        <el-table-column label="维度" min-width="260"><template #default="{row}"><div class="rp-dims" v-if="row.dimensions"><span v-for="(v,k) in row.dimensions" :key="k" class="rp-dim"><span class="rp-dk">{{ dimLabels[k]||k }}</span><span class="rp-dv">{{ v.compositeScore??'-' }}</span></span></div></template></el-table-column>
        <el-table-column label="随访" width="80"><template #default="{row}"><el-tag v-if="row.followUpStatus" :type="followUpTagType(row.followUpStatus)" size="small">{{ followUpLabel(row.followUpStatus) }}</el-tag><span v-else class="text-muted">-</span></template></el-table-column>
        <el-table-column label="时间" width="150"><template #default="{row}">{{ fmtDate(row.createdAt) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="170"><template #default="{row}"><el-button type="primary" link size="small" @click="go(row)">查看报告</el-button><el-button link size="small" @click="goFu(row)">随访</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="ps" :total="total" layout="total,prev,pager,next" @current-change="load" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; import { useRouter, useRoute } from 'vue-router'; import { Search } from '@element-plus/icons-vue';
import { getReportList } from '../api/admin'; import { riskLabel, riskColor, scoreColor, followUpLabel, followUpTagType } from '../utils/status'; import { maskName, fmtDate } from '../utils/format';
const router=useRouter(),route=useRoute();
const list=ref([]),loading=ref(false),page=ref(1),ps=ref(20),total=ref(0),kw=ref(''),riskF=ref(''),dr=ref(null);
const dimLabels={vocabulary:'词汇',syntax:'句法',semantic:'语义',fluency:'流畅',logic:'逻辑'};
async function load(){ loading.value=true; try{const p={keyword:kw.value||'',classification:riskF.value||'',page:page.value,pageSize:ps.value};if(dr.value?.length===2){p.startDate=dr.value[0];p.endDate=dr.value[1];}if(route.query.userId)p.userId=route.query.userId;const d=await getReportList(p);list.value=d.reports||[];total.value=d.total||0;}finally{loading.value=false;} }
function go(row){router.push(`/reports/${row.reportId||row._id}`);}
function goFu(row){router.push({path:'/followup',query:{reportId:row.reportId||row._id,userId:row.userId}});}
onMounted(()=>load());
</script>
<style scoped>.rp{max-width:1500px;}.rp-dims{display:flex;gap:8px;flex-wrap:wrap;}.rp-dim{display:flex;align-items:center;gap:4px;font-size:12px;}.rp-dk{color:#7c8ca5;}.rp-dv{font-weight:600;color:#1d2939;}</style>
