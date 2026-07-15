<template>
  <div class="rd" v-loading="loading">
    <div class="rd-nav"><el-button link @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button><span class="rd-nav-div">/</span><span class="rd-nav-t">报告详情</span><el-tag v-if="rpt" :color="riskColor(rpt.classification)" effect="dark" size="small" class="rd-nav-tag">{{ riskLabel(rpt.classification) }}</el-tag></div>

    <template v-if="rpt">
      <!-- ========== 1. 综合概览 ========== -->
      <div class="card-box"><div class="card-hd"><el-icon><DataAnalysis /></el-icon> 综合评估概览</div><div class="card-bd">
        <div class="rd-summary">
          <div class="rds-left">
            <div class="rds-name">{{ mask(pt?.name||rpt.profile?.name) }} · {{ pt?.gender||rpt.profile?.gender }} · {{ pt?.age||rpt.profile?.age }}岁</div>
            <div class="rds-meta">筛查时间：{{ fmtDt(rpt.createdAt) }} · 编号：{{ rpt.screeningId||'-' }} · {{ pt?.education||rpt.profile?.education }} · {{ pt?.dialect||rpt.profile?.dialect }}</div>
          </div>
          <div class="rds-score"><div class="rds-ring" :style="{borderColor:scoreColor(rpt.weightedScore)}"><span class="rds-num">{{ rpt.weightedScore }}</span><span class="rds-total">/ 10</span></div><div class="rds-sl">加权总分</div></div>
          <div class="rds-risk"><el-tag :color="riskColor(rpt.classification)" effect="dark" size="large" style="font-size:15px;padding:8px 18px;">{{ riskLabel(rpt.classification) }}</el-tag><div style="margin-top:6px;font-size:12px;color:#7c8ca5;">AI 初步结论</div></div>
        </div>
        <el-alert type="warning" :closable="false" show-icon style="margin-top:12px;" title="本结果为 AI 初筛参考，不构成临床诊断，最终诊断需由执业医师判定。" />
        <div v-if="rpt.observations?.length" style="margin-top:8px;"><strong>核心异常高亮：</strong><span v-for="(o,i) in rpt.observations.filter(o=>o.riskLevel==='high')" :key="i" style="margin-left:8px;"><el-tag type="danger" size="small">{{ o.text.slice(0,40) }}...</el-tag></span></div>
      </div></div>

      <el-row :gutter="16">
        <el-col :span="16">
          <!-- ========== 2. 三大核心指标 ========== -->
          <div class="card-box"><div class="card-hd"><el-icon><WarningFilled /></el-icon> 核心临床指标</div><div class="card-bd">
            <div v-for="ci in coreIndicators" :key="ci.key" class="rd-ci">
              <div class="rd-ci-hd"><span class="rd-ci-name">{{ ci.label }}</span><span class="rd-ci-score" :style="{color:scoreColor(ci.score)}">{{ ci.score }}</span></div>
              <div class="rd-ci-desc">{{ ci.mechanism }}</div>
              <div class="rd-ci-evd"><el-icon><ChatLineSquare /></el-icon> {{ ci.evidence }}</div>
            </div>
          </div></div>

          <!-- ========== 3. 三维语言特征 ========== -->
          <div class="card-box"><div class="card-hd"><el-icon><Grid /></el-icon> 三维语言特征细分</div><div class="card-bd">
            <el-tabs v-model="dimTab" type="card" size="small">
              <el-tab-pane v-for="dim in dimDetail" :key="dim.key" :label="dim.label" :name="dim.key">
                <div class="rd-subgrid"><div v-for="si in dim.subs" :key="si.key" class="rd-subitem"><div class="rd-sub-n">{{ si.label }}</div><div class="rd-sub-v" :style="{background:subBg(si.value)}">{{ si.value }}</div><div class="rd-sub-d">{{ si.desc }}</div></div></div>
              </el-tab-pane>
            </el-tabs>
          </div></div>

          <!-- ========== 4. 副语言特征 ========== -->
          <div class="card-box"><div class="card-hd"><el-icon><Microphone /></el-icon> 副语言特征统计</div><div class="card-bd">
            <el-row :gutter="12"><el-col :span="4" v-for="ps in paraStats" :key="ps.k"><div class="rd-ps"><div class="rd-ps-v">{{ ps.v }}</div><div class="rd-ps-l">{{ ps.l }}</div></div></el-col></el-row>
          </div></div>

          <!-- ========== 5. 原始语音与转写 ========== -->
          <div class="card-box"><div class="card-hd"><el-icon><Headset /></el-icon> 原始语音与转写回溯</div><div class="card-bd">
            <div class="rd-voice-bar"><el-button-group><el-button size="small" type="primary"><el-icon><VideoPlay /></el-icon> 播放</el-button><el-button size="small">1x</el-button><el-button size="small">1.5x</el-button></el-button-group><el-slider v-model="voiceProgress" size="small" style="width:200px;margin:0 12px;" /><span class="text-muted">02:34 / 05:18</span></div>
            <div class="rd-transcript" style="margin-top:10px;background:#fafbfc;border-radius:6px;padding:14px;max-height:300px;overflow-y:auto;font-size:13px;line-height:1.8;">
              <span v-for="(seg,i) in transcriptSegs" :key="i" :class="seg.cls">{{ seg.text }}</span>
            </div>
            <el-button size="small" @click="editTranscript=true" style="margin-top:8px;">✏ 人工校正转写</el-button>
            <el-button size="small" type="warning" @click="ElMessage.info('重新提交AI分析（Mock）')" style="margin-top:8px;margin-left:8px;">🔄 重新提交 AI 分析</el-button>
          </div></div>
        </el-col>

        <el-col :span="8">
          <!-- ========== 6. 纵向趋势 ========== -->
          <div class="card-box"><div class="card-hd"><el-icon><TrendCharts /></el-icon> 纵向趋势</div><div class="card-bd">
            <el-radio-group v-model="trendRange" size="small" style="margin-bottom:8px;"><el-radio-button label="7d">7天</el-radio-button><el-radio-button label="30d">30天</el-radio-button><el-radio-button label="90d">90天</el-radio-button><el-radio-button label="all">全周期</el-radio-button></el-radio-group>
            <div ref="trendRef" style="height:200px;"></div>
          </div></div>

          <!-- ========== 7. MMSE/MoCA 对比 ========== -->
          <div class="card-box"><div class="card-hd"><el-icon><EditPen /></el-icon> 量表对比</div><div class="card-bd">
            <el-row :gutter="12"><el-col :span="12"><div class="rd-scale"><div class="rd-scale-t">MMSE</div><div class="rd-scale-v">{{ scaleScores.mmse||'--' }}</div><div class="rd-scale-r">/ 30</div></div></el-col><el-col :span="12"><div class="rd-scale"><div class="rd-scale-t">MoCA</div><div class="rd-scale-v">{{ scaleScores.moca||'--' }}</div><div class="rd-scale-r">/ 30</div></div></el-col></el-row>
            <el-button size="small" @click="$router.push('/clinical')" style="width:100%;margin-top:8px;">录入量表数据</el-button>
          </div></div>

          <!-- ========== 随访 ========== -->
          <div class="card-box"><div class="card-hd">📋 医生随访</div><div class="card-bd">
            <div v-if="rpt.followUpStatus"><el-tag :type="fuTag(rpt.followUpStatus)" size="small">{{ fuLabel(rpt.followUpStatus) }}</el-tag><span v-if="rpt.doctorName" class="text-muted" style="margin-left:6px;">{{ rpt.doctorName }} · {{ fmtDt(rpt.followUpTime) }}</span></div>
            <el-form :model="fu" label-position="top" size="small" style="margin-top:8px;"><el-form-item label="状态"><el-select v-model="fu.s" style="width:100%"><el-option label="待处理" value="pending" /><el-option label="已联系" value="contacted" /><el-option label="已转诊" value="referred" /><el-option label="已关闭" value="closed" /></el-select></el-form-item><el-form-item label="备注"><el-input v-model="fu.n" type="textarea" :rows="2" /></el-form-item><el-button type="primary" size="small" @click="saveFu" :loading="saving" style="width:100%">保存</el-button></el-form>
          </div></div>

          <!-- ========== 对话证据链 ========== -->
          <div class="card-box"><div class="card-hd">💬 对话证据链<el-tag size="small" style="margin-left:6px;">{{ scr?.topics?.length||0 }}轮</el-tag></div><div class="card-bd" style="max-height:400px;overflow-y:auto;padding:8px 12px;">
            <div v-if="!scr?.topics?.length" class="empty-state"><el-empty :image-size="50" description="暂无" /></div>
            <div v-for="(t,i) in scr?.topics" :key="i" style="padding:8px 0;border-bottom:1px solid #f0f2f5;"><div style="font-size:11px;color:#7c8ca5;">{{ t.topicLabel }}</div><div style="font-size:12px;color:#2c6fce;margin:4px 0;">🤖 {{ t.aiQuestion }}</div><div v-if="t.userText" style="font-size:12px;color:#475467;">👤 {{ t.userText }}</div></div>
          </div></div>
        </el-col>
      </el-row>

      <!-- ========== 8. 干预建议 ========== -->
      <div class="card-box" v-if="rpt.interventions?.length"><div class="card-hd"><el-icon><Opportunity /></el-icon> 干预建议</div><div class="card-bd"><div v-for="(item,i) in rpt.interventions" :key="i" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f2f5;"><el-tag :type="item.priority===1?'danger':item.priority===2?'warning':''" size="small" effect="dark">P{{item.priority}}</el-tag><span style="flex:1;font-size:13px;">{{ item.text }}</span><el-tag v-if="item.isNav" type="success" size="small" effect="plain">🏥</el-tag></div></div></div>
    </template>
    <div v-else-if="!loading" class="empty-state"><el-empty description="未找到报告" /></div>

    <!-- 转写编辑弹窗 -->
    <el-dialog v-model="editTranscript" title="人工校正转写文本" width="700px"><el-input v-model="transcriptText" type="textarea" :rows="15" style="font-size:13px;line-height:1.8;" /><template #footer><el-button @click="editTranscript=false">取消</el-button><el-button type="primary" @click="saveTranscript">保存校正</el-button></template></el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, nextTick } from 'vue'; import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ChatLineSquare } from '@element-plus/icons-vue'; import { ElMessage } from 'element-plus'; import * as echarts from 'echarts';
import { getReportDetail, updateFollowUp } from '../api/admin';
import { riskLabel, riskColor, scoreColor, subScoreBg as subBg } from '../utils/status'; import { maskName as mask, fmtDateTime as fmtDt } from '../utils/format';

const route=useRoute(),router=useRouter(); const rid=computed(()=>route.params.id);
const rpt=ref(null),scr=ref(null),pt=ref(null),loading=ref(true),saving=ref(false);
const fu=reactive({s:'',n:''}); const trendRef=ref(null); let trendCh=null;
const dimTab=ref('vocabulary'),trendRange=ref('30d'),editTranscript=ref(false),transcriptText=ref(''),voiceProgress=ref(45);

const scaleScores=ref({mmse:'24',moca:'21'});

// 三大核心指标
const coreIndicators=computed(()=>{if(!rpt.value?.dimensions)return[];const d=rpt.value.dimensions;return [
  {key:'tipOfTongue',label:'舌尖现象',score:d.vocabulary?.tipOfTongue??'-',mechanism:'提示颞顶叶语言中枢相关功能下降风险。舌尖现象增多反映词汇提取通路效率降低，是MCI的早期语言标志物之一。',evidence:'对话第3轮出现典型找词停顿"那个...就是那个..."'},
  {key:'complexThought',label:'复杂想法处理困难',score:d.syntax?.complexThought??'-',mechanism:'反映前额叶执行功能与语言组织协同能力下降。患者在表达复杂语义关系时出现句子结构简化或断裂。',evidence:'第4轮描述看病经历时句子不完整，缺少主从复合句'},
  {key:'memory',label:'记忆问题',score:d.semantic?.memoryIssues??'-',mechanism:'提示海马-内嗅皮层相关近期记忆提取障碍。患者对近期事件细节回忆困难，影响叙事连贯性。',evidence:'记忆话题中无法准确回忆当天早餐内容'}
];});

// 三维细分指标
const dimDetail=computed(()=>{if(!rpt.value?.dimensions)return[];const d=rpt.value.dimensions;return [
  {key:'vocabulary',label:'词汇维度',subs:[
    {key:'lexicalComplexity',label:'词汇丰富度',value:d.vocabulary?.lexicalComplexity??'-',desc:'反映词汇网络的完整性和多样性'},
    {key:'wordPhraseRatio',label:'常用词占比',value:parseFloat((3.5+Math.random()).toFixed(1)),desc:'高频词汇使用比例，升高提示词汇贫乏'},
    {key:'pronounRatio',label:'代词比例',value:parseFloat((2.5+Math.random()).toFixed(1)),desc:'代词替代实词的比例，升高提示命名困难'},
    {key:'rareWords',label:'罕见词使用率',value:parseFloat((1.5+Math.random()*2).toFixed(1)),desc:'低频词汇使用频率，下降提示词汇退化'},
  ]},{key:'syntax',label:'句法维度',subs:[
    {key:'avgLength',label:'句子平均长度',value:parseFloat((2+Math.random()*2).toFixed(1)),desc:'每句平均字数，缩短提示语法简化'},
    {key:'grammarComplexity',label:'语法复杂度',value:d.syntax?.syntacticComplexity??'-',desc:'从句嵌套层数和结构多样性'},
    {key:'sentenceVariety',label:'句式多样性',value:parseFloat((2+Math.random()*2).toFixed(1)),desc:'不同句式类型的使用范围'},
    {key:'grammarErrors',label:'语法错误次数',value:parseFloat((1+Math.random()).toFixed(1)),desc:'语法错误频率，升高提示语言组织障碍'},
  ]},{key:'semantic',label:'语义维度',subs:[
    {key:'semanticCoherence',label:'语义连贯性',value:d.semantic?.semanticCoherence??'-',desc:'话题维持和逻辑衔接能力'},
    {key:'narrativeLogic',label:'叙事逻辑性',value:parseFloat((2+Math.random()*2).toFixed(1)),desc:'事件叙述的因果和时间顺序组织'},
    {key:'infoDensity',label:'信息密度',value:d.semantic?.semanticDensity??'-',desc:'单位语言中的有效信息量'},
    {key:'topicDeviation',label:'主题偏离程度',value:parseFloat((1.5+Math.random()*2).toFixed(1)),desc:'话题偏离频率，升高提示注意力分散'},
  ]}];});

// 副语言特征
const paraStats=ref([{k:'duration',v:'318s',l:'语音总时长'},{k:'speed',v:'142',l:'语速(字/分)'},{k:'pauses',v:'23',l:'停顿总次数'},{k:'longPauses',v:'7',l:'长停顿(>2s)'},{k:'repeats',v:'15',l:'重复词汇'},{k:'hesitations',v:'9',l:'迟疑表达'}]);

// 转写文本分段
const transcriptSegs=ref([{text:'我早上一般喝点粥配点咸菜',cls:''},{text:'，',cls:'pause'},{text:'中午随便热点剩菜吃',cls:''},{text:'，',cls:'pause'},{text:'晚上等娃儿下班回来一起做。',cls:''},{text:'胃口嘛',cls:'hesitate'},{text:'，',cls:'pause'},{text:'还行',cls:''},{text:'，',cls:'pause'},{text:'就是有时候一个人吃饭',cls:''},{text:'也',cls:'repeat'},{text:'也',cls:'repeat'},{text:'不想弄。',cls:''}]);

function fuLabel(s){const m={pending:'待处理',contacted:'已联系',referred:'已转诊',closed:'已关闭'};return m[s]||'未处理';}
function fuTag(s){const m={pending:'danger',contacted:'warning',referred:'',closed:'success'};return m[s]||'info';}

async function load(){loading.value=true;try{const d=await getReportDetail(rid.value);rpt.value=d.report;scr.value=d.screening;pt.value=d.patient;fu.s=d.report?.followUpStatus||'';fu.n=d.report?.followUpNote||'';transcriptText.value=(scr.value?.topics||[]).map(t=>t.userText).filter(Boolean).join('\n');await nextTick();renderTrend();}catch(e){ElMessage.error(e.message);}finally{loading.value=false;}}
async function saveFu(){saving.value=true;try{await updateFollowUp({reportId:rid.value,followUpStatus:fu.s,followUpNote:fu.n,followUpTime:new Date().toISOString(),doctorName:'张主任'});rpt.value.followUpStatus=fu.s;ElMessage.success('已保存');}catch(e){}finally{saving.value=false;}}
function saveTranscript(){ElMessage.success('转写文本已校正');editTranscript.value=false;}
function renderTrend(){if(!trendRef.value)return;if(!trendCh)trendCh=echarts.init(trendRef.value);const now=new Date();const pts=[];for(let i=11;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i*8);pts.push({date:d.toLocaleDateString('zh-CN',{month:'short',day:'numeric'}),score:parseFloat((1.5+Math.random()*4+(i<6?1:0)).toFixed(1))});}
trendCh.setOption({tooltip:{trigger:'axis'},grid:{left:30,right:10,top:8,bottom:20},xAxis:{type:'category',data:pts.map(p=>p.date),axisLabel:{fontSize:10}},yAxis:{type:'value',name:'总分',min:0,max:10},series:[{type:'line',data:pts.map(p=>p.score),smooth:true,areaStyle:{opacity:0.15},itemStyle:{color:'#2c6fce'}}]});}

function handleResize(){trendCh?.resize();}
onMounted(()=>{load();window.addEventListener('resize',handleResize);});
onUnmounted(()=>{window.removeEventListener('resize',handleResize);trendCh?.dispose();});
</script>

<style scoped>
.rd{max-width:1600px;}.rd-nav{display:flex;align-items:center;gap:6px;margin-bottom:12px;font-size:13px;color:#7c8ca5;}.rd-nav-t{color:#1d2939;font-weight:600;}.rd-nav-tag{margin-left:8px;}
.rd-summary{display:flex;align-items:center;gap:24px;}.rds-left{flex:1;}.rds-name{font-size:20px;font-weight:700;color:#1d2939;}.rds-meta{font-size:13px;color:#7c8ca5;margin-top:2px;}
.rds-score{text-align:center;}.rds-ring{width:80px;height:80px;border-radius:50%;border:4px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;}.rds-num{font-size:26px;font-weight:700;}.rds-total{font-size:10px;color:#7c8ca5;}.rds-sl{font-size:11px;color:#7c8ca5;margin-top:2px;}
.rd-ci{padding:12px 0;border-bottom:1px solid #f0f2f5;}.rd-ci:last-child{border:none;}.rd-ci-hd{display:flex;justify-content:space-between;align-items:center;}.rd-ci-name{font-weight:600;font-size:15px;}.rd-ci-score{font-size:22px;font-weight:700;}.rd-ci-desc{font-size:13px;color:#475467;line-height:1.5;margin-top:4px;}.rd-ci-evd{font-size:12px;color:#7c8ca5;margin-top:4px;display:flex;align-items:flex-start;gap:4px;}
.rd-subgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}.rd-subitem{background:#f8fafc;border-radius:6px;padding:12px;text-align:center;}.rd-sub-n{font-size:12px;color:#7c8ca5;}.rd-sub-v{font-size:22px;font-weight:700;display:inline-block;padding:4px 12px;border-radius:12px;margin:6px 0;}.rd-sub-d{font-size:11px;color:#b0bac9;}
.rd-ps{text-align:center;padding:10px;background:#f8fafc;border-radius:6px;}.rd-ps-v{font-size:20px;font-weight:700;color:#2c6fce;}.rd-ps-l{font-size:12px;color:#7c8ca5;margin-top:2px;}
.rd-scale{text-align:center;padding:16px;background:#f8fafc;border-radius:8px;}.rd-scale-t{font-size:12px;color:#7c8ca5;}.rd-scale-v{font-size:32px;font-weight:700;color:#2c6fce;}.rd-scale-r{font-size:12px;color:#b0bac9;}
.rd-voice-bar{display:flex;align-items:center;}
.transcript-pause{color:#b0bac9;}.transcript-repeat{text-decoration:underline;color:#e6a23c;}.transcript-hesitate{background:#fdf6ec;padding:1px 3px;border-radius:3px;}
</style>
