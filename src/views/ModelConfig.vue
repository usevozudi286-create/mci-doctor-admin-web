<template>
  <div class="mc"><h2 class="page-hd"><el-icon><Setting /></el-icon> 模型配置</h2>
    <el-row :gutter="16">
      <!-- Prompt 模板 -->
      <el-col :span="14">
        <div class="card-box"><div class="card-hd"><el-icon><Edit /></el-icon> Prompt 模板编辑</div><div class="card-bd">
          <el-input v-model="prompt" type="textarea" :rows="10" placeholder="编辑五段式 Prompt..." style="font-family:monospace;font-size:13px;" />
          <div class="text-muted mt-sm">可用变量：#{dimensions} #{dialogue} #{profile}</div>
        </div></div>

        <!-- 指标权重 -->
        <div class="card-box"><div class="card-hd"><el-icon><TrendCharts /></el-icon> 指标权重调节</div><div class="card-bd">
          <el-row :gutter="20">
            <el-col :span="8" v-for="w in weightList" :key="w.key">
              <div style="margin-bottom:10px;"><span style="font-size:13px;">{{ w.label }}</span><span style="float:right;font-weight:600;">{{ w.value }}%</span></div>
              <el-slider v-model="w.value" :min="0" :max="50" show-input size="small" @input="onWeightChange" />
            </el-col>
          </el-row>
          <div class="text-muted mt-sm">总和：{{ weightSum }}%（建议保持 100%）</div>
        </div></div>
      </el-col>

      <!-- 模型对比 -->
      <el-col :span="10">
        <div class="card-box"><div class="card-hd"><el-icon><Switch /></el-icon> 模型选择与对比</div><div class="card-bd">
          <el-select v-model="activeModel" style="width:100%;margin-bottom:12px;"><el-option label="DeepSeek" value="deepseek" /><el-option label="星火" value="xinghuo" /></el-select>
          <el-button type="primary" @click="compare" :loading="comparing" style="width:100%">对比模型输出</el-button>
          <template v-if="cmpResult">
            <el-divider />
            <div v-for="(v,k) in cmpResult" :key="k" v-if="k!=='comparison'" style="padding:8px;background:#f8fafc;border-radius:6px;margin-bottom:8px;">
              <strong>{{ k==='deepseek'?'DeepSeek':'星火' }}</strong>
              <span style="float:right;">分数: <b>{{ v.weightedScore }}</b> · {{ v.classification }} · 延迟: {{ v.latency }}s</span>
            </div>
            <p style="font-size:13px;color:#475467;margin-top:8px;">{{ cmpResult?.comparison }}</p>
          </template>
        </div></div>
        <el-button type="primary" @click="saveCfg" :loading="saving" style="width:100%;margin-top:8px;">💾 保存配置</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; import { ElMessage } from 'element-plus';
import { getModelConfig, saveModelConfig, compareModelOutput } from '../api/admin';

const prompt=ref(''),activeModel=ref('deepseek'),cmpResult=ref(null),comparing=ref(false),saving=ref(false);
const weightList=ref([{key:'tipOfTongue',label:'舌尖现象',value:25},{key:'memory',label:'记忆问题',value:30},{key:'complexThought',label:'思维困难',value:15},{key:'lexicalComplexity',label:'词汇复杂度',value:10},{key:'syntacticComplexity',label:'句法复杂度',value:10},{key:'semanticCoherence',label:'语义连贯性',value:10}]);
const weightSum=computed(()=>weightList.value.reduce((s,w)=>s+w.value,0));

function onWeightChange(){}
async function compare(){comparing.value=true;try{cmpResult.value=await compareModelOutput();}catch(e){ElMessage.error('对比失败');}finally{comparing.value=false;}}
async function saveCfg(){saving.value=true;try{await saveModelConfig({prompt:prompt.value,weights:weightList.value,model:activeModel.value});ElMessage.success('配置已保存');}catch(e){ElMessage.error('保存失败');}finally{saving.value=false;}}

onMounted(async()=>{try{const d=await getModelConfig();prompt.value=d.promptTemplate;activeModel.value=d.model;if(d.weights){weightList.value.forEach(w=>{if(d.weights[w.key]!==undefined)w.value=d.weights[w.key];});}}catch(e){}});
</script>
<style scoped>.mc{max-width:1500px;}</style>
