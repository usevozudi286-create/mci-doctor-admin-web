<template>
  <div class="dc"><h2 class="page-hd"><el-icon><ChatDotRound /></el-icon> 医患沟通</h2>
    <el-tabs v-model="tab" type="border-card">
      <el-tab-pane label="高危预警" name="alerts">
        <el-table :data="alerts" stripe>
          <el-table-column label="患者" width="80"><template #default="{row}">{{ maskName(row.patientName) }}</template></el-table-column>
          <el-table-column prop="score" label="总分" width="60" />
          <el-table-column label="风险" width="110"><template #default="{row}"><el-tag :color="riskColor(row.classification)" effect="dark" size="small">{{ riskLabel(row.classification) }}</el-tag></template></el-table-column>
          <el-table-column prop="coreIssue" label="核心异常" min-width="200" />
          <el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="alertTag(row.status)" size="small">{{ alertLabel(row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="时间" width="140"><template #default="{row}">{{ fmtDate(row.time) }}</template></el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{row}">
              <el-dropdown @command="(cmd) => updateAlert(row, cmd)">
                <el-button size="small">处理</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="viewed">已查看</el-dropdown-item>
                    <el-dropdown-item command="contacted">已联系</el-dropdown-item>
                    <el-dropdown-item command="arranged">已安排就诊</el-dropdown-item>
                    <el-dropdown-item command="excluded">已排除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="家属咨询" name="consult">
        <div v-if="!consults.length" class="empty-state"><el-empty description="暂无咨询" /></div>
        <div v-for="c in consults" :key="c.id" class="msg-card mb-md" @click="openConsult(c)">
          <div class="msg-tag"><el-tag size="small">{{ c.patientName }}</el-tag></div>
          <div class="msg-body"><div class="msg-title">{{ c.title }}</div><div class="msg-preview">{{ c.content.slice(0,100) }}</div></div>
          <div class="msg-meta">{{ fmtDate(c.time) }}</div>
        </div>
        <div class="text-muted" style="margin-top:8px;">⚠ 线上咨询仅提供科普与就医指导，不开展线上诊疗，不开具处方。</div>
      </el-tab-pane>
      <el-tab-pane label="随访管理" name="followup">
        <el-table :data="followUps" stripe>
          <el-table-column label="患者" width="80"><template #default="{row}">{{ maskName(row.patientName) }}</template></el-table-column>
          <el-table-column label="周期" width="100"><template #default="{row}">{{ row.cycle }}</template></el-table-column>
          <el-table-column label="下次随访" width="110"><template #default="{row}">{{ fmtDate(row.nextDate) }}</template></el-table-column>
          <el-table-column label="随访内容" min-width="200"><template #default="{row}">{{ row.content }}</template></el-table-column>
          <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="fuTag(row.status)" size="small">{{ fuLabel(row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="100"><template #default="{row}"><el-button size="small" link @click="editFu(row)">记录</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="依从性管理" name="compliance">
        <el-table :data="complianceList" stripe>
          <el-table-column label="患者" width="80"><template #default="{row}">{{ row.patientName }}</template></el-table-column>
          <el-table-column label="筛查完成率" width="110"><template #default="{row}"><el-progress :percentage="row.screeningRate" :color="row.screeningRate>70?'#0ea882':'#e04b4b'" /></template></el-table-column>
          <el-table-column label="随访到场率" width="110"><template #default="{row}"><el-progress :percentage="row.followUpRate" :color="row.followUpRate>70?'#0ea882':'#e04b4b'" /></template></el-table-column>
          <el-table-column label="方案执行率" width="110"><template #default="{row}"><el-progress :percentage="row.planRate" :color="row.planRate>70?'#0ea882':'#e04b4b'" /></template></el-table-column>
          <el-table-column label="标记" width="80"><template #default="{row}">
            <el-tag v-if="row.screeningRate<50||row.followUpRate<50" type="danger" size="small">需加强</el-tag>
            <span v-else class="text-muted">正常</span>
          </template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'; import { ElMessage } from 'element-plus';
import { riskLabel, riskColor, followUpLabel, followUpTagType } from '../utils/status'; import { maskName, fmtDate } from '../utils/format';

const tab=ref('alerts');

const alerts=ref([
  {id:'a1',patientName:'张秀英',score:9.8,classification:'high_risk',coreIssue:'舌尖现象显著+记忆问题严重',status:'unviewed',time:new Date().toISOString()},
  {id:'a2',patientName:'王桂芳',score:7.5,classification:'suspected_mci',coreIssue:'语义连贯性下降+复杂想法表达困难',status:'contacted',time:new Date(Date.now()-86400000).toISOString()},
  {id:'a3',patientName:'陈秀兰',score:8.2,classification:'attention',coreIssue:'记忆提取困难+词汇丰富度下降',status:'viewed',time:new Date(Date.now()-172800000).toISOString()}
]);

const consults=ref([{id:'c1',patientName:'王桂芳',title:'我母亲记忆力下降明显',content:'医生您好，我母亲最近总是记不住事情，昨天连午饭吃了什么都想不起来了，请问需要做什么检查？',time:new Date(Date.now()-86400000).toISOString()}]);

const followUps=ref([
  {patientName:'张秀英',cycle:'每2周',nextDate:new Date(Date.now()+14*86400000).toISOString(),content:'认知变化评估+用药情况+生活能力',status:'pending'},
  {patientName:'陈秀兰',cycle:'每月',nextDate:new Date(Date.now()+30*86400000).toISOString(),content:'记忆测试+情绪评估+家属反馈',status:'contacted'}
]);

const complianceList=ref([
  {patientName:'张秀英',screeningRate:100,followUpRate:80,planRate:65},
  {patientName:'王桂芳',screeningRate:60,followUpRate:40,planRate:30},
  {patientName:'陈秀兰',screeningRate:100,followUpRate:90,planRate:85},
  {patientName:'李德明',screeningRate:33,followUpRate:20,planRate:15}
]);

function alertTag(s){const m={unviewed:'danger',viewed:'warning',contacted:'',arranged:'success',excluded:'info'};return m[s]||'info';}
function alertLabel(s){const m={unviewed:'未查看',viewed:'已查看',contacted:'已联系',arranged:'已安排就诊',excluded:'已排除'};return m[s]||s;}
function updateAlert(row,st){row.status=st;ElMessage.success('已更新');}
function openConsult(c){ElMessage.info('查看咨询详情（Mock）');}
function editFu(row){ElMessage.info('编辑随访记录（Mock）');}
function fuLabel(s){return followUpLabel(s);}
function fuTag(s){return followUpTagType(s);}
</script>
<style scoped>.dc{max-width:1300px;}.msg-card{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#fff;border-radius:8px;border:1px solid #e4e8ee;cursor:pointer;}.msg-card:hover{box-shadow:0 2px 8px rgba(0,0,0,0.06);}.msg-body{flex:1;}.msg-title{font-weight:600;margin-bottom:4px;}.msg-preview{font-size:13px;color:#7c8ca5;}</style>
