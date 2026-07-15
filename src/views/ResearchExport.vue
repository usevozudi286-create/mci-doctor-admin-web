<template>
  <div class="re"><h2 class="page-hd"><el-icon><Download /></el-icon> 科研数据导出</h2>
    <div class="filter-bar">
      <el-row :gutter="10" align="middle">
        <el-col :span="6"><el-date-picker v-model="dr" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" /></el-col>
        <el-col :span="3"><el-select v-model="riskF" placeholder="风险等级" clearable><el-option label="全部" value="" /><el-option label="需关注" value="attention" /><el-option label="疑似MCI" value="suspected_mci" /><el-option label="高度风险" value="high_risk" /></el-select></el-col>
        <el-col :span="auto"><el-switch v-model="mask" active-text="脱敏" /></el-col>
        <el-col :span="auto"><el-button type="primary" @click="load" :loading="loading">预览数据</el-button></el-col>
        <el-col :span="auto"><el-button type="success" @click="exportCSV" :disabled="!preview.length">导出 CSV</el-button></el-col>
        <el-col :span="auto"><el-button type="warning" @click="exportExcel" :disabled="!preview.length">导出 Excel</el-button></el-col>
      </el-row>
    </div>

    <div class="table-card">
      <el-table :data="preview" v-loading="loading" stripe max-height="500">
        <el-table-column v-for="col in columns" :key="col" :prop="col" :label="colLabel(col)" :width="col==='createdAt'?150:col==='classification'?120:undefined" />
      </el-table>
      <div class="text-muted" style="padding:10px 16px;">共 {{ total }} 条记录 · 脱敏规则：姓名保留姓氏、手机号中间四位隐藏、不导出 openid 和语音文件地址</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'; import { ElMessage } from 'element-plus'; import { exportResearchData } from '../api/admin';

const dr=ref(null),riskF=ref(''),mask=ref(true),preview=ref([]),total=ref(0),loading=ref(false),columns=ref([]);

function colLabel(c){const m={patientName:'患者',age:'年龄',gender:'性别',weightedScore:'总分',classification:'风险等级',createdAt:'筛查时间',education:'教育',dialect:'方言'};return m[c]||c;}

async function load(){loading.value=true;try{const d=await exportResearchData();preview.value=d.preview||[];total.value=d.total||0;columns.value=d.availableFields||Object.keys(preview.value[0]||{});}catch(e){ElMessage.error('加载失败');}finally{loading.value=false;}}
function exportCSV(){ElMessage.success('CSV 导出中（Mock）');}
function exportExcel(){ElMessage.success('Excel 导出中（Mock）');}
</script>
<style scoped>.re{max-width:1500px;}</style>
