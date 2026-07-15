<template>
  <div class="ip"><h2 class="page-hd"><el-icon><Opportunity /></el-icon> 干预方案</h2>
    <div class="filter-bar"><el-row :gutter="10" align="middle">
      <el-col :span="4"><el-select v-model="riskLv" @change="load" style="width:100%"><el-option label="轻度MCI风险" value="mild_risk" /><el-option label="中度MCI风险" value="moderate_risk" /><el-option label="高度MCI风险" value="high_risk" /><el-option label="疑似MCI" value="suspected_mci" /></el-select></el-col>
      <el-col :span="auto"><el-button type="primary" @click="load">加载模板</el-button></el-col>
    </el-row></div>

    <template v-if="plan">
      <el-row :gutter="16">
        <el-col :span="12">
          <div class="card-box"><div class="card-hd">🧩 脑力训练</div><div class="card-bd"><el-checkbox-group v-model="plan.brainTraining"><div v-for="item in plan.brainTraining" :key="item" style="margin-bottom:6px;"><el-checkbox :label="item" :value="item">{{ item }}</el-checkbox></div></el-checkbox-group></div></div>
          <div class="card-box"><div class="card-hd">🥗 饮食建议</div><div class="card-bd"><el-checkbox-group v-model="plan.diet"><div v-for="item in plan.diet" :key="item" style="margin-bottom:6px;"><el-checkbox :label="item" :value="item">{{ item }}</el-checkbox></div></el-checkbox-group></div></div>
        </el-col>
        <el-col :span="12">
          <div class="card-box"><div class="card-hd">😴 睡眠建议</div><div class="card-bd"><el-checkbox-group v-model="plan.sleep"><div v-for="item in plan.sleep" :key="item" style="margin-bottom:6px;"><el-checkbox :label="item" :value="item">{{ item }}</el-checkbox></div></el-checkbox-group></div></div>
          <div class="card-box"><div class="card-hd">👥 社交建议</div><div class="card-bd"><el-checkbox-group v-model="plan.social"><div v-for="item in plan.social" :key="item" style="margin-bottom:6px;"><el-checkbox :label="item" :value="item">{{ item }}</el-checkbox></div></el-checkbox-group></div></div>
        </el-col>
      </el-row>
      <div class="card-box"><div class="card-hd">📝 个性化方案</div><div class="card-bd"><el-input v-model="plan.personalized" type="textarea" :rows="3" placeholder="医生自定义干预建议..." /></div></div>
      <div style="display:flex;gap:12px;margin-top:8px;">
        <el-button type="primary" @click="savePlan" :loading="saving">💾 保存方案</el-button>
        <el-button type="success" @click="pushPlan" :loading="pushing">📤 下发至患者端</el-button>
        <span class="text-muted" style="line-height:32px;">家属同步接收 · 仅科普建议，不替代面诊</span>
      </div>
    </template>
    <div v-else class="empty-state"><el-empty description="选择风险等级以加载方案模板" /></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'; import { ElMessage } from 'element-plus';
import { getInterventionPlan, saveInterventionPlan, pushInterventionPlan } from '../api/admin';

const riskLv=ref('mild_risk'),plan=ref(null),saving=ref(false),pushing=ref(false);
async function load(){try{const d=await getInterventionPlan(riskLv.value);plan.value=d.plan;}catch(e){ElMessage.error('加载失败');}}
async function savePlan(){saving.value=true;try{await saveInterventionPlan(plan.value);ElMessage.success('已保存');}catch(e){ElMessage.error('保存失败');}finally{saving.value=false;}}
async function pushPlan(){pushing.value=true;try{await pushInterventionPlan(plan.value);ElMessage.success('已下发至患者端和家属端');}catch(e){ElMessage.error('下发失败');}finally{pushing.value=false;}}
</script>
<style scoped>.ip{max-width:1500px;}</style>
