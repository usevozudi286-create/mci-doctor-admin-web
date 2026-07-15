<template>
  <div class="ca"><h2 class="page-hd"><el-icon><EditPen /></el-icon> 临床评估</h2>
    <!-- 选择患者 -->
    <div class="filter-bar">
      <el-row :gutter="10" align="middle">
        <el-col :span="6"><el-select v-model="selUserId" filterable placeholder="选择患者" @change="loadAssessment" style="width:100%"><el-option v-for="p in patientList" :key="p.userId" :label="p.name+' · '+p.age+'岁 · '+p.gender" :value="p.userId" /></el-select></el-col>
        <el-col :span="auto"><el-button type="primary" :disabled="!selUserId" @click="loadAssessment">加载评估</el-button></el-col>
      </el-row>
    </div>

    <template v-if="data">
      <el-row :gutter="16">
        <el-col :span="14">
          <!-- AI 初筛结果 -->
          <div class="card-box"><div class="card-hd"><el-icon><Cpu /></el-icon> AI 初筛结果</div><div class="card-bd">
            <template v-if="data.latestReport">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="加权总分"><b :style="{color:scoreColor(data.latestReport.weightedScore)}">{{ data.latestReport.weightedScore }}</b> / 10</el-descriptions-item>
                <el-descriptions-item label="风险等级"><el-tag :color="riskColor(data.latestReport.classification)" effect="dark" size="small">{{ riskLabel(data.latestReport.classification) }}</el-tag></el-descriptions-item>
                <el-descriptions-item label="筛查时间">{{ fmtDate(data.latestReport.createdAt) }}</el-descriptions-item>
              </el-descriptions>
              <div style="margin-top:12px;"><strong>AI 核心观察：</strong><p v-for="(o,i) in (data.latestReport.observations||[]).slice(0,3)" :key="i" style="margin:4px 0;font-size:13px;color:#475467;">{{ i+1 }}. {{ o.text }}</p></div>
            </template>
            <div v-else class="text-muted">该患者暂无筛查报告</div>
          </div></div>

          <!-- 医生诊断结论 -->
          <div class="card-box"><div class="card-hd"><el-icon><Checked /></el-icon> 医生诊断结论</div><div class="card-bd">
            <el-form :model="dx" label-width="120px">
              <el-form-item label="诊断结论"><el-select v-model="dx.conclusion" style="width:100%"><el-option label="正常" value="normal" /><el-option label="MCI 倾向" value="mci_tendency" /><el-option label="阿尔茨海默倾向" value="ad_tendency" /><el-option label="建议进一步检查" value="further_check" /></el-select></el-form-item>
              <el-row :gutter="16">
                <el-col :span="12"><el-form-item label="MMSE 得分"><el-input-number v-model="dx.mmseScore" :min="0" :max="30" placeholder="0-30" style="width:100%" /></el-form-item></el-col>
                <el-col :span="12"><el-form-item label="MoCA 得分"><el-input-number v-model="dx.mocaScore" :min="0" :max="30" placeholder="0-30" style="width:100%" /></el-form-item></el-col>
              </el-row>
              <el-form-item label="临床备注"><el-input v-model="dx.clinicalNote" type="textarea" :rows="3" placeholder="医生临床观察备注..." /></el-form-item>
              <el-form-item label="评估医生"><el-input v-model="dx.assessedBy" placeholder="医生签名" style="width:200px" /></el-form-item>
              <el-form-item><el-button type="primary" @click="saveAssessment" :loading="saving">💾 保存评估</el-button><el-button @click="printRef" :disabled="!dx.conclusion" type="success" style="margin-left:8px;">🖨 打印评估参考单</el-button></el-form-item>
            </el-form>
          </div></div>
        </el-col>

        <el-col :span="10">
          <!-- 历史报告 -->
          <div class="card-box"><div class="card-hd"><el-icon><Clock /></el-icon> 历次报告（{{ data.allReports?.length || 0 }}次）</div><div class="card-bd" style="max-height:400px;overflow-y:auto;">
            <div v-for="r in data.allReports" :key="r._id" style="padding:10px 0;border-bottom:1px solid #f0f2f5;display:flex;justify-content:space-between;align-items:center;">
              <div><b>{{ r.weightedScore }}</b> / 10 <el-tag :color="riskColor(r.classification)" effect="dark" size="small" style="margin-left:8px;">{{ riskLabel(r.classification) }}</el-tag></div>
              <span class="text-muted">{{ fmtDate(r.createdAt) }}</span>
            </div>
          </div></div>
        </el-col>
      </el-row>
    </template>
    <div v-else class="empty-state"><el-empty description="请选择患者以加载评估数据" /></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'; import { ElMessage } from 'element-plus';
import { getPatientList, getClinicalAssessment, saveClinicalAssessment } from '../api/admin';
import { riskLabel, riskColor, scoreColor } from '../utils/status'; import { fmtDate } from '../utils/format';

const selUserId=ref(''),patientList=ref([]),data=ref(null),saving=ref(false);
const dx=reactive({conclusion:'',mmseScore:'',mocaScore:'',clinicalNote:'',assessedBy:'张主任',assessedAt:null});

async function loadAssessment(){if(!selUserId.value)return;try{data.value=await getClinicalAssessment(selUserId.value);const d=data.value.diagnosis||{};dx.conclusion=d.conclusion||'';dx.mmseScore=d.mmseScore||'';dx.mocaScore=d.mocaScore||'';dx.clinicalNote=d.clinicalNote||'';dx.assessedBy=d.assessedBy||'张主任';}catch(e){ElMessage.error('加载失败');}}
async function saveAssessment(){saving.value=true;try{await saveClinicalAssessment({userId:selUserId.value,...dx,assessedAt:new Date().toISOString()});ElMessage.success('评估已保存');}catch(e){ElMessage.error('保存失败');}finally{saving.value=false;}}
function printRef(){ElMessage.info('打印评估参考单（Mock）');}
onMounted(async()=>{try{const d=await getPatientList({page:1,pageSize:200});patientList.value=d.patients||[];}catch(e){}});
</script>
<style scoped>.ca{max-width:1500px;}</style>
