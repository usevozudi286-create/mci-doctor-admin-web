<template>
  <div class="al">
    <h2 class="page-hd"><el-icon><WarningFilled /></el-icon> 高风险预警</h2>
    <div class="db-cards">
      <div class="dbc"><div class="dbc-v" style="color:#e04b4b">{{ st.unprocessed }}</div><div class="dbc-l">未处理</div></div>
      <div class="dbc"><div class="dbc-v" style="color:#e6a23c">{{ st.contacted }}</div><div class="dbc-l">已联系</div></div>
      <div class="dbc"><div class="dbc-v" style="color:#2c6fce">{{ st.closed }}</div><div class="dbc-l">已关闭</div></div>
      <div class="dbc"><div class="dbc-v" style="color:#0ea882">{{ highTotal }}</div><div class="dbc-l">高风险总数</div></div>
    </div>
    <div class="filter-bar">
      <el-row :gutter="10" align="middle">
        <el-col :span="3"><el-select v-model="ff" placeholder="随访状态" clearable @change="load"><el-option label="全部" value="" /><el-option label="未处理" value="pending" /><el-option label="已联系" value="contacted" /><el-option label="已转诊" value="referred" /><el-option label="已关闭" value="closed" /></el-select></el-col>
        <el-col :span="5"><el-input v-model="kw" placeholder="搜索患者" clearable @clear="load" @keyup.enter="load"><template #prefix><el-icon><Search /></el-icon></template></el-input></el-col>
        <el-col :span="auto"><el-button type="primary" @click="load">刷新</el-button></el-col>
        <el-col :span="auto"><el-tag type="danger" effect="plain">高风险 {{ total }} 条</el-tag></el-col>
      </el-row>
    </div>
    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="患者" width="85"><template #default="{ row }">{{ maskName(row.patientName||row.profile?.name) }}</template></el-table-column>
        <el-table-column label="年龄" width="50"><template #default="{ row }">{{ row.patientAge||row.profile?.age }}</template></el-table-column>
        <el-table-column label="总分" width="60" sortable><template #default="{ row }"><b :style="{color:scoreColor(row.weightedScore)}">{{ row.weightedScore }}</b></template></el-table-column>
        <el-table-column label="风险等级" width="125"><template #default="{ row }"><el-tag :color="riskColor(row.classification)" effect="dark" size="small">{{ riskLabel(row.classification) }}</el-tag></template></el-table-column>
        <el-table-column label="随访" width="80"><template #default="{ row }"><el-tag :type="followUpTagType(row.followUpStatus)" size="small">{{ followUpLabel(row.followUpStatus)||'未处理' }}</el-tag></template></el-table-column>
        <el-table-column label="核心观察" min-width="240" show-overflow-tooltip><template #default="{ row }">{{ row.observations?.[0]?.text||'-' }}</template></el-table-column>
        <el-table-column label="时间" width="150"><template #default="{ row }">{{ fmtDate(row.createdAt) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="210">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="go(row)">查看</el-button>
            <el-dropdown @command="c=>handle(row,c)">
              <el-button type="warning" link size="small">处理 <el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown><el-dropdown-menu><el-dropdown-item command="contacted">已联系</el-dropdown-item><el-dropdown-item command="referred">已转诊</el-dropdown-item><el-dropdown-item command="closed">已关闭</el-dropdown-item></el-dropdown-menu></template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="ps" :total="total" layout="total,prev,pager,next" @current-change="load" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'; import { useRouter } from 'vue-router'; import { Search, ArrowDown } from '@element-plus/icons-vue'; import { ElMessage } from 'element-plus';
import { getHighRiskReports, updateFollowUp } from '../api/admin'; import { riskLabel, riskColor, scoreColor, followUpLabel, followUpTagType } from '../utils/status'; import { maskName, fmtDate } from '../utils/format';

const router=useRouter(); const list=ref([]),loading=ref(false),page=ref(1),ps=ref(20),total=ref(0),ff=ref(''),kw=ref(''),highTotal=ref(0);
const st=reactive({unprocessed:0,contacted:0,closed:0});

async function load(){loading.value=true;try{const d=await getHighRiskReports({followUpStatus:ff.value||'',keyword:kw.value||'',page:page.value,pageSize:ps.value});list.value=d.reports||[];total.value=d.total||0;highTotal.value=d.total||0;st.unprocessed=(d.reports||[]).filter(r=>!r.followUpStatus||r.followUpStatus==='pending').length;st.contacted=(d.reports||[]).filter(r=>r.followUpStatus==='contacted').length;st.closed=(d.reports||[]).filter(r=>r.followUpStatus==='closed').length;}finally{loading.value=false;}}
function go(r){router.push(`/reports/${r.reportId||r._id}`);}
async function handle(r,st){try{await updateFollowUp({reportId:r.reportId||r._id,followUpStatus:st,followUpTime:new Date().toISOString(),doctorName:'张主任'});r.followUpStatus=st;ElMessage.success('已更新');load();}catch(e){ElMessage.error('失败');}}

onMounted(()=>load());
</script>
<style scoped>
.al{max-width:1500px;}
.db-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
.dbc{background:#fff;border-radius:8px;padding:18px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);border:1px solid #e4e8ee;text-align:center;}
.dbc-v{font-size:30px;font-weight:700;}.dbc-l{font-size:13px;color:#7c8ca5;margin-top:4px;}
</style>
