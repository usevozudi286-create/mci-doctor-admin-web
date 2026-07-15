<template>
  <div class="fu">
    <h2 class="page-hd"><el-icon><Clock /></el-icon> 随访管理</h2>
    <div class="db-cards">
      <div class="dbc"><div class="dbc-v" style="color:#e04b4b">{{ st.pending }}</div><div class="dbc-l">待处理</div></div>
      <div class="dbc"><div class="dbc-v" style="color:#e6a23c">{{ st.contacted }}</div><div class="dbc-l">已联系</div></div>
      <div class="dbc"><div class="dbc-v" style="color:#2c6fce">{{ st.referred }}</div><div class="dbc-l">已转诊</div></div>
      <div class="dbc"><div class="dbc-v" style="color:#0ea882">{{ st.closed }}</div><div class="dbc-l">已关闭</div></div>
    </div>
    <div class="filter-bar flex-between">
      <el-row :gutter="10">
        <el-col :span="10"><el-select v-model="ff" placeholder="随访状态" clearable @change="load"><el-option label="全部" value="" /><el-option label="待处理" value="pending" /><el-option label="已联系" value="contacted" /><el-option label="已转诊" value="referred" /><el-option label="已关闭" value="closed" /></el-select></el-col>
        <el-col :span="10"><el-input v-model="kw" placeholder="搜索患者" clearable @clear="load" @keyup.enter="load"><template #prefix><el-icon><Search /></el-icon></template></el-input></el-col>
      </el-row>
      <el-button type="primary" @click="load">刷新</el-button>
    </div>
    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="患者" width="85"><template #default="{ row }">{{ maskName(row.patientName||row.profile?.name) }}</template></el-table-column>
        <el-table-column label="年龄" width="50"><template #default="{ row }">{{ row.patientAge||row.profile?.age }}</template></el-table-column>
        <el-table-column label="总分" width="60"><template #default="{ row }"><b :style="{color:scoreColor(row.weightedScore)}">{{ row.weightedScore }}</b></template></el-table-column>
        <el-table-column label="风险" width="125"><template #default="{ row }"><el-tag :color="riskColor(row.classification)" effect="dark" size="small">{{ riskLabel(row.classification) }}</el-tag></template></el-table-column>
        <el-table-column label="随访状态" width="80"><template #default="{ row }"><el-tag :type="followUpTagType(row.followUpStatus)" size="small">{{ followUpLabel(row.followUpStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="备注" min-width="260" show-overflow-tooltip><template #default="{ row }">{{ row.followUpNote||'暂无' }}</template></el-table-column>
        <el-table-column prop="doctorName" label="处理人" width="70" />
        <el-table-column label="随访时间" width="150"><template #default="{ row }">{{ fmtDate(row.followUpTime) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="go(row)">查看</el-button>
            <el-button link size="small" @click="edit(row)">编辑</el-button>
            <el-dropdown @command="c=>handle(row,c)"><el-button type="warning" link size="small">状态 <el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown><el-dropdown-menu><el-dropdown-item command="contacted">已联系</el-dropdown-item><el-dropdown-item command="referred">已转诊</el-dropdown-item><el-dropdown-item command="closed">已关闭</el-dropdown-item></el-dropdown-menu></template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="ps" :total="total" layout="total,prev,pager,next" @current-change="load" />
    </div>

    <el-dialog v-model="edShow" title="编辑随访" width="460px"><el-form :model="ef" label-width="80px"><el-form-item label="状态"><el-select v-model="ef.s" style="width:100%"><el-option label="待处理" value="pending" /><el-option label="已联系" value="contacted" /><el-option label="已转诊" value="referred" /><el-option label="已关闭" value="closed" /></el-select></el-form-item><el-form-item label="备注"><el-input v-model="ef.n" type="textarea" :rows="4" placeholder="记录随访内容..." /></el-form-item></el-form><template #footer><el-button @click="edShow=false">取消</el-button><el-button type="primary" @click="saveEd" :loading="edLoad">保存</el-button></template></el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'; import { useRouter, useRoute } from 'vue-router'; import { Search, ArrowDown } from '@element-plus/icons-vue'; import { ElMessage } from 'element-plus';
import { getFollowUpList, updateFollowUp } from '../api/admin'; import { riskLabel, riskColor, scoreColor, followUpLabel, followUpTagType } from '../utils/status'; import { maskName, fmtDate } from '../utils/format';

const router=useRouter(),route=useRoute(); const list=ref([]),loading=ref(false),page=ref(1),ps=ref(20),total=ref(0),ff=ref(''),kw=ref(''),edShow=ref(false),edLoad=ref(false); const ef=reactive({rid:'',s:'pending',n:''});
const st=reactive({pending:0,contacted:0,referred:0,closed:0});

async function load(){loading.value=true;try{const d=await getFollowUpList({followUpStatus:ff.value||'',keyword:kw.value||'',page:page.value,pageSize:ps.value});list.value=d.reports||[];total.value=d.total||0;const r=d.reports||[];st.pending=r.filter(x=>x.followUpStatus==='pending').length;st.contacted=r.filter(x=>x.followUpStatus==='contacted').length;st.referred=r.filter(x=>x.followUpStatus==='referred').length;st.closed=r.filter(x=>x.followUpStatus==='closed').length;}finally{loading.value=false;}}
function go(r){router.push(`/reports/${r.reportId||r._id}`);}
function edit(r){ef.rid=r.reportId||r._id;ef.s=r.followUpStatus||'pending';ef.n=row.followUpNote||'';edShow.value=true;}
async function handle(r,st){try{await updateFollowUp({reportId:r.reportId||r._id,followUpStatus:st,followUpTime:new Date().toISOString(),doctorName:'张主任'});r.followUpStatus=st;ElMessage.success('已更新');load();}catch(e){ElMessage.error('失败');}}
async function saveEd(){edLoad.value=true;try{await updateFollowUp({reportId:ef.rid,followUpStatus:ef.s,followUpNote:ef.n,followUpTime:new Date().toISOString(),doctorName:'张主任'});ElMessage.success('已保存');edShow.value=false;load();}finally{edLoad.value=false;}}

onMounted(()=>{load();if(route.query.reportId){ef.rid=route.query.reportId;setTimeout(()=>edShow.value=true,300);}});
</script>
<style scoped>
.fu{max-width:1500px;}
.db-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
.dbc{background:#fff;border-radius:8px;padding:18px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.05);border:1px solid #e4e8ee;text-align:center;}
.dbc-v{font-size:30px;font-weight:700;}.dbc-l{font-size:13px;color:#7c8ca5;margin-top:4px;}
</style>
