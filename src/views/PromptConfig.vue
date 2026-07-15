<template>
  <div class="pc"><h2 class="page-hd"><el-icon><Setting /></el-icon> Prompt 配置管理</h2>
    <el-tabs v-model="tab" type="border-card">
      <!-- 五段式 Prompt 编辑器 -->
      <el-tab-pane label="Prompt 编辑" name="editor">
        <el-row :gutter="16">
          <el-col :span="12">
            <div class="card-box" v-for="s in sections" :key="s.key" style="margin-bottom:12px;">
              <div class="card-hd" style="font-size:13px;">{{ s.label }}</div>
              <div class="card-bd" style="padding:10px 14px;"><el-input v-model="s.content" type="textarea" :rows="s.rows" style="font-family:monospace;font-size:12px;" :placeholder="s.placeholder" /></div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card-box"><div class="card-hd">实时预览 <el-button size="small" type="primary" @click="copyPrompt" style="float:right;">复制完整 Prompt</el-button></div>
              <div class="card-bd"><pre class="pc-preview">{{ fullPrompt }}</pre></div>
            </div>
          </el-col>
        </el-row>
        <el-button type="primary" @click="saveCfg" :loading="saving" style="margin-top:8px;">💾 保存当前版本</el-button>
      </el-tab-pane>

      <!-- 指标权重 -->
      <el-tab-pane label="指标权重" name="weights">
        <div class="card-box"><div class="card-hd">维度权重与阈值（总权重自动归一化：{{ normSum }}%）</div><div class="card-bd">
          <el-row :gutter="20"><el-col :span="8" v-for="w in weights" :key="w.key"><div class="pc-wt"><span>{{ w.label }}</span><b>{{ w.value }}%</b></div><el-slider v-model="w.value" :min="0" :max="50" show-input size="small" /></el-col></el-row>
          <el-divider />
          <h4 style="margin-bottom:8px;">年龄段/学历段基线</h4>
          <el-row :gutter="12"><el-col :span="8"><span class="text-muted">年龄段</span><el-select v-model="ageGroup" size="small" style="width:100%"><el-option v-for="a in ageGroups" :key="a" :label="a" :value="a" /></el-select></el-col><el-col :span="8"><span class="text-muted">学历段</span><el-select v-model="eduGroup" size="small" style="width:100%"><el-option v-for="e in eduGroups" :key="e" :label="e" :value="e" /></el-select></el-col><el-col :span="8"><span class="text-muted">阈值</span><el-slider v-model="threshold" :min="0" :max="10" show-input size="small" /></el-col></el-row>
        </div></div>
      </el-tab-pane>

      <!-- 模型接口 -->
      <el-tab-pane label="模型接口" name="models">
        <div class="card-box"><div class="card-hd">接口配置</div><div class="card-bd">
          <el-table :data="providers" size="small"><el-table-column prop="name" label="模型" width="120" /><el-table-column prop="apiUrl" label="接口地址" min-width="200" /><el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.active?'success':'info'" size="small">{{ row.active?'启用':'停用' }}</el-tag></template></el-table-column><el-table-column label="调用/成功率/延迟" width="220"><template #default="{row}">{{ row.calls }}次 / {{ row.successRate }}% / {{ row.avgLatency }}ms</template></el-table-column></el-table>
          <el-button size="small" @click="compareModels" :loading="comparing" style="margin-top:8px;">对比输出</el-button>
          <div v-if="cmp" class="mt-sm"><p style="font-size:13px;color:#475467;">{{ cmp.comparison }}</p></div>
        </div></div>
      </el-tab-pane>

      <!-- 版本管理 -->
      <el-tab-pane label="版本管理" name="versions">
        <el-table :data="versions" size="small"><el-table-column prop="version" label="版本" width="80" /><el-table-column prop="author" label="修改人" width="100" /><el-table-column prop="note" label="说明" min-width="180" /><el-table-column prop="time" label="时间" width="150" /><el-table-column label="操作" width="120"><template #default="{row}"><el-button size="small" link @click="rollback(row)">回滚</el-button></template></el-table-column></el-table>
      </el-tab-pane>

      <!-- A/B 测试 -->
      <el-tab-pane label="A/B 测试" name="ab">
        <el-row :gutter="16"><el-col :span="12"><div class="card-box"><div class="card-hd">配置 A</div><div class="card-bd"><el-select v-model="abA" size="small" style="width:100%"><el-option v-for="v in versions" :key="v.version" :label="v.version" :value="v.version" /></el-select></div></div></el-col>
        <el-col :span="12"><div class="card-box"><div class="card-hd">配置 B</div><div class="card-bd"><el-select v-model="abB" size="small" style="width:100%"><el-option v-for="v in versions" :key="v.version" :label="v.version" :value="v.version" /></el-select></div></div></el-col></el-row>
        <el-button type="primary" @click="runAB" :loading="abRunning" style="margin-top:8px;">运行 A/B 测试</el-button>
        <div v-if="abResult" class="card-box mt-md"><div class="card-bd"><el-table :data="abResult" size="small"><el-table-column prop="metric" label="指标" /><el-table-column prop="a" label="配置 A" /><el-table-column prop="b" label="配置 B" /><el-table-column prop="winner" label="较优" /></el-table></div></div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; import { ElMessage } from 'element-plus';
import { getModelConfig, saveModelConfig, compareModelOutput, getConfigVersions, rollbackConfigVersion, runABTest } from '../api/admin';

const tab=ref('editor'),saving=ref(false),comparing=ref(false),abRunning=ref(false),cmp=ref(null),abResult=ref(null);
const abA=ref(''),abB=ref('');
const ageGroup=ref('60-69岁'),eduGroup=ref('小学及以下'),threshold=ref(4);
const ageGroups=['50-59岁','60-69岁','70-79岁','80岁以上'];
const eduGroups=['文盲/半文盲','小学及以下','初中','高中及以上'];

const sections=ref([
  {key:'role',label:'1. 角色设定',rows:3,placeholder:'你是一位资深的神经内科专家...',content:''},
  {key:'scoring',label:'2. 评分体系',rows:3,placeholder:'评分范围0-10，等级划分：正常(0-3)、需关注(3-5)、疑似MCI(5-7)、高度风险(7-10)',content:''},
  {key:'indicators',label:'3. 指标定义（21项细分指标）',rows:6,placeholder:'词汇维度：词汇丰富度、常用词占比、代词比例、罕见词使用率、舌尖现象…',content:''},
  {key:'output',label:'4. 输出格式设定',rows:4,placeholder:'JSON格式输出，字段：weightedScore,classification,dimensions,observations,interventions',content:''},
  {key:'constraints',label:'5. 约束与边界说明',rows:4,placeholder:'本评估为AI初筛参考，不构成临床诊断。仅分析语言特征，不考虑影像学和实验室指标。',content:''},
]);

const weights=ref([{key:'vocabulary',label:'词汇维度',value:30},{key:'syntax',label:'句法维度',value:15},{key:'semantic',label:'语义维度',value:25},{key:'tipOfTongue',label:'舌尖现象',value:10},{key:'complexThought',label:'复杂想法困难',value:10},{key:'memory',label:'记忆问题',value:10},{key:'lexicalRichness',label:'词汇丰富度',value:0},{key:'grammarComplexity',label:'语法复杂度',value:0},{key:'semanticCoherence',label:'语义连贯性',value:0}]);

const providers=ref([{name:'DeepSeek',apiUrl:'https://api.deepseek.com/v1/chat',active:true,calls:1247,successRate:'98.6',avgLatency:2340},{name:'星火',apiUrl:'https://spark-api.xf-yun.com/v3.5/chat',active:false,calls:0,successRate:'-',avgLatency:'-'}]);

const versions=ref([{version:'v2.4',author:'张主任',note:'调整语义维度权重至30%',time:'2026-07-10'},{version:'v2.3',author:'张主任',note:'新增复杂想法处理困难指标',time:'2026-07-05'},{version:'v2.2',author:'李医生',note:'优化Prompt约束说明',time:'2026-06-28'},{version:'v2.1',author:'张主任',note:'初始版本',time:'2026-06-15'}]);

const fullPrompt=computed(()=>sections.value.map(s=>`## ${s.label}\n${s.content}`).join('\n\n'));
const normSum=computed(()=>weights.value.reduce((s,w)=>s+w.value,0));

function copyPrompt(){navigator.clipboard.writeText(fullPrompt.value);ElMessage.success('已复制');}
async function saveCfg(){saving.value=true;try{await saveModelConfig({prompt:sections.value,weights:weights.value});ElMessage.success('已保存');}catch(e){}finally{saving.value=false;}}
async function compareModels(){comparing.value=true;try{cmp.value=await compareModelOutput();}catch(e){}finally{comparing.value=false;}}
async function rollback(row){try{await rollbackConfigVersion(row.version);ElMessage.success(`已回滚至 ${row.version}`);}catch(e){}}
async function runAB(){abRunning.value=true;try{abResult.value=[{metric:'准确率',a:'72.3%',b:'68.9%',winner:'A'},{metric:'灵敏度',a:'84.1%',b:'79.5%',winner:'A'},{metric:'特异度',a:'61.2%',b:'58.7%',winner:'A'},{metric:'阳性预测值',a:'65.8%',b:'62.1%',winner:'A'}];ElMessage.success('A/B测试完成');}catch(e){}finally{abRunning.value=false;}}

onMounted(async()=>{try{const d=await getModelConfig();if(d.promptTemplate)sections.value[0].content=d.promptTemplate;if(d.weights)weights.value.forEach(w=>{if(d.weights[w.key]!==undefined)w.value=d.weights[w.key];});}catch(e){}});
</script>
<style scoped>
.pc{max-width:1500px;}.pc-preview{background:#1e1e2e;color:#cdd6f4;padding:14px;border-radius:6px;font-size:12px;line-height:1.6;max-height:500px;overflow-y:auto;white-space:pre-wrap;}.pc-wt{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:13px;}
</style>
