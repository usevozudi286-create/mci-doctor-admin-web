<template>
  <div class="pt"><h2 class="page-hd"><el-icon><User /></el-icon> 患者档案</h2>
    <!-- 高级筛选 -->
    <div class="filter-bar">
      <el-collapse>
        <el-collapse-item title="高级检索" name="1">
          <el-row :gutter="10" style="margin-bottom:10px;">
            <el-col :span="4"><el-input v-model="f.name" placeholder="姓名" size="small" clearable /></el-col>
            <el-col :span="4"><el-input v-model="f.outpatientId" placeholder="门诊号" size="small" clearable /></el-col>
            <el-col :span="4"><el-input v-model="f.inpatientId" placeholder="住院号" size="small" clearable /></el-col>
            <el-col :span="4"><el-input v-model="f.idCard" placeholder="身份证号" size="small" clearable /></el-col>
            <el-col :span="4"><el-select v-model="f.riskLevel" placeholder="风险等级" size="small" clearable style="width:100%"><el-option label="正常" value="normal" /><el-option label="需关注" value="attention" /><el-option label="疑似MCI" value="suspected_mci" /><el-option label="高度风险" value="high_risk" /></el-select></el-col>
            <el-col :span="4"><el-select v-model="f.clinicalLabel" placeholder="临床诊断" size="small" clearable style="width:100%"><el-option label="MCI" value="mci" /><el-option label="阿尔茨海默" value="ad" /><el-option label="正常老化" value="normal_aging" /><el-option label="抑郁相关" value="depression" /></el-select></el-col>
          </el-row>
          <el-row :gutter="10" style="margin-bottom:10px;">
            <el-col :span="4"><el-select v-model="f.ageRange" placeholder="年龄段" size="small" clearable style="width:100%"><el-option label="50-59岁" value="50-59" /><el-option label="60-69岁" value="60-69" /><el-option label="70-79岁" value="70-79" /><el-option label="80岁以上" value="80+" /></el-select></el-col>
            <el-col :span="4"><el-select v-model="f.gender" placeholder="性别" size="small" clearable style="width:100%"><el-option label="男" value="男" /><el-option label="女" value="女" /></el-select></el-col>
            <el-col :span="4"><el-select v-model="f.followUpStatus" placeholder="随访状态" size="small" clearable style="width:100%"><el-option label="待处理" value="pending" /><el-option label="已联系" value="contacted" /><el-option label="已关闭" value="closed" /></el-select></el-col>
            <el-col :span="4"><el-select v-model="f.group" placeholder="分组" size="small" clearable style="width:100%"><el-option label="门诊组" value="outpatient" /><el-option label="科研组" value="research" /><el-option label="随访组" value="followup" /></el-select></el-col>
            <el-col :span="4"><el-date-picker v-model="f.dateRange" type="daterange" size="small" range-separator="至" start-placeholder="开始" end-placeholder="结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" /></el-col>
            <el-col :span="4"><el-button type="primary" size="small" @click="load"><el-icon><Search /></el-icon> 检索</el-button><el-button size="small" @click="showGroupDialog=true">分组管理</el-button><el-button size="small" type="warning">同步院内就诊信息</el-button></el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe @row-click="openDetail" style="cursor:pointer">
        <el-table-column type="index" label="#" width="40" />
        <el-table-column label="姓名" width="80"><template #default="{row}">{{ mask(row.name) }}</template></el-table-column>
        <el-table-column prop="age" label="年龄" width="50" />
        <el-table-column prop="gender" label="性别" width="50" />
        <el-table-column label="门诊号" width="100"><template #default="{row}">{{ row.outpatientId||'-' }}</template></el-table-column>
        <el-table-column prop="screeningCount" label="筛查次数" width="75" />
        <el-table-column label="最近筛查" width="140"><template #default="{row}">{{ fmt(row.lastScreeningAt) }}</template></el-table-column>
        <el-table-column label="得分" width="55"><template #default="{row}"><b :style="{color:scoreColor(row.lastScore)}">{{ row.lastScore??'-' }}</b></template></el-table-column>
        <el-table-column label="风险等级" width="120"><template #default="{row}"><el-tag :color="riskColor(row.lastClassification)" effect="dark" size="small">{{ riskLabel(row.lastClassification) }}</el-tag></template></el-table-column>
        <el-table-column label="临床诊断" width="110"><template #default="{row}"><el-tag v-if="row.clinicalLabel" size="small" type="warning">{{ row.clinicalLabel }}</el-tag><span v-else class="text-muted">-</span></template></el-table-column>
        <el-table-column label="随访" width="70"><template #default="{row}"><el-tag :type="fuTag(row.followUpStatus)" size="small">{{ fuLabel(row.followUpStatus)||'-' }}</el-tag></template></el-table-column>
        <el-table-column label="分组" width="70"><template #default="{row}"><span class="text-muted">{{ row.group||'-' }}</span></template></el-table-column>
        <el-table-column label="操作" fixed="right" width="160"><template #default="{row}"><el-button type="primary" link size="small" @click.stop="openDetail(row)">详情</el-button><el-button link size="small" @click.stop="$router.push({path:'/reports',query:{userId:row.userId}})">报告</el-button><el-button link size="small" @click.stop="$router.push({path:'/clinical',query:{userId:row.userId}})">评估</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="ps" :total="total" layout="total,prev,pager,next" @current-change="load" />
    </div>

    <el-drawer v-model="drawer" :title="'患者档案 · '+ (detail?.patient?.name||'')" size="780px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small" style="margin-bottom:12px">
          <el-descriptions-item label="姓名">{{ detail.patient.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detail.patient.gender }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ detail.patient.age }}岁</el-descriptions-item>
          <el-descriptions-item label="教育">{{ detail.patient.education }}</el-descriptions-item>
          <el-descriptions-item label="门诊号">{{ detail.patient.outpatientId||'未关联' }}</el-descriptions-item>
          <el-descriptions-item label="住院号">{{ detail.patient.inpatientId||'未关联' }}</el-descriptions-item>
          <el-descriptions-item label="方言">{{ detail.patient.dialect }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detail.patient.kinshipPhone||'未绑定' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-bottom:6px;">📈 评分趋势</h4>
        <div ref="trendRef" style="height:200px;margin-bottom:12px;"></div>
        <h4 style="margin-bottom:6px;">📋 筛查历史</h4>
        <el-table :data="detail.reports" size="small" max-height="300">
          <el-table-column label="时间" width="140"><template #default="{row}">{{ fmt(row.createdAt) }}</template></el-table-column>
          <el-table-column prop="weightedScore" label="总分" width="55" />
          <el-table-column label="风险" width="120"><template #default="{row}"><el-tag :color="riskColor(row.classification)" effect="dark" size="small">{{ riskLabel(row.classification) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{row}"><el-button type="primary" link size="small" @click="goRpt(row.reportId)">查看</el-button></template></el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <el-dialog v-model="showGroupDialog" title="分组管理" width="500px">
      <el-table :data="groups" size="small"><el-table-column prop="name" label="分组名称" /><el-table-column prop="count" label="患者数" /><el-table-column label="操作"><template #default="{row}"><el-button size="small" link>编辑</el-button><el-button size="small" link type="danger">删除</el-button></template></el-table-column></el-table>
      <el-button size="small" type="primary" style="margin-top:8px;">新建分组</el-button>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'; import { useRouter } from 'vue-router'; import { Search } from '@element-plus/icons-vue';
import * as echarts from 'echarts'; import { getPatientList, getPatientDetail } from '../api/admin';
import { riskLabel, riskColor, scoreColor } from '../utils/status'; import { maskName as mask, fmtDate as fmt } from '../utils/format';

const router=useRouter();
const list=ref([]),loading=ref(false),page=ref(1),ps=ref(20),total=ref(0);
const drawer=ref(false),detail=ref(null),trendRef=ref(null),showGroupDialog=ref(false); let trendCh=null;

const f=reactive({name:'',outpatientId:'',inpatientId:'',idCard:'',riskLevel:'',clinicalLabel:'',ageRange:'',gender:'',followUpStatus:'',group:'',dateRange:null});
const groups=ref([{name:'门诊组',count:86},{name:'科研组',count:42},{name:'随访组',count:35}]);

function fuLabel(s){const m={pending:'待处理',contacted:'已联系',referred:'已转诊',closed:'已关闭'};return m[s]||'';}
function fuTag(s){const m={pending:'danger',contacted:'warning',referred:'',closed:'success'};return m[s]||'info';}

async function load(){loading.value=true;try{const d=await getPatientList({keyword:f.name||'',page:page.value,pageSize:ps.value});list.value=d.patients||[];total.value=d.total||0;}finally{loading.value=false;}}
async function openDetail(row){try{const d=await getPatientDetail(row.userId);detail.value={...d,patient:{...d.patient,outpatientId:'OPT'+String(10000+parseInt(row.userId.split('_')[2]||0)),inpatientId:Math.random()>0.5?'INP'+String(20000+parseInt(row.userId.split('_')[2]||0)):'未关联'}};drawer.value=true;await nextTick();renderTrend();}catch(e){}}
function goRpt(rid){drawer.value=false;router.push(`/reports/${rid}`);}
function renderTrend(){if(!trendRef.value||!detail.value?.reports?.length)return;if(!trendCh)trendCh=echarts.init(trendRef.value);const reps=[...detail.value.reports].sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));trendCh.setOption({tooltip:{trigger:'axis'},grid:{left:36,right:20,top:12,bottom:20},xAxis:{type:'category',data:reps.map(r=>new Date(r.createdAt).toLocaleDateString('zh-CN',{month:'short',day:'numeric'})),axisLabel:{fontSize:11}},yAxis:{type:'value',name:'总分',min:0,max:10},series:[{type:'line',data:reps.map(r=>r.weightedScore),smooth:true,areaStyle:{opacity:0.15},itemStyle:{color:'#2c6fce'},markLine:{silent:true,symbol:'none',data:[{yAxis:3.5,lineStyle:{color:'#e6a23c',type:'dashed'},label:{formatter:'关注线'}},{yAxis:5.5,lineStyle:{color:'#e04b4b',type:'dashed'},label:{formatter:'高风险线'}}]}}]});}
onMounted(()=>load());
</script>
<style scoped>.pt{max-width:1600px;}</style>
