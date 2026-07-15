<template>
  <div class="dm"><h2 class="page-hd"><el-icon><ChatDotRound /></el-icon> 消息沟通</h2>
    <div class="filter-bar"><el-row :gutter="10" align="middle">
      <el-radio-group v-model="filterType"><el-radio-button label="all">全部</el-radio-button><el-radio-button label="alert">筛查异常</el-radio-button><el-radio-button label="family">家属留言</el-radio-button><el-radio-button label="system">系统通知</el-radio-button></el-radio-group>
      <span class="text-muted" style="margin-left:12px;">未读 {{ msgs.filter(m=>!m.read).length }} 条</span>
    </el-row></div>

    <div v-if="!filtered.length" class="empty-state"><el-empty description="暂无消息" /></div>
    <div class="msg-list">
      <div v-for="m in filtered" :key="m.id" class="msg-card" :class="{unread:!m.read}" @click="openMsg(m)">
        <div class="msg-tag"><el-tag :type="m.type==='alert'?'danger':m.type==='family'?'warning':'info'" size="small">{{ m.type==='alert'?'筛查异常':m.type==='family'?'家属留言':'系统通知' }}</el-tag></div>
        <div class="msg-body"><div class="msg-title">{{ m.title }}</div><div class="msg-preview">{{ m.content.slice(0,80) }}...</div></div>
        <div class="msg-meta"><div>{{ fmtDate(m.createdAt) }}</div><div v-if="m.patientName" class="text-muted">{{ m.patientName }}</div></div>
      </div>
    </div>

    <el-dialog v-model="showDetail" :title="curMsg?.title" width="520px">
      <template v-if="curMsg"><p style="line-height:1.7;color:#475467;">{{ curMsg.content }}</p><p v-if="curMsg.patientName" class="text-muted mt-sm">关联患者：{{ curMsg.patientName }}</p>
        <el-divider />
        <el-form><el-form-item label="医生回复"><el-input v-model="reply" type="textarea" :rows="3" placeholder="回复建议（仅科普，不替代面诊）" /></el-form-item></el-form>
      </template>
      <template #footer><el-button @click="showDetail=false">关闭</el-button><el-button type="primary" @click="sendReply" :loading="replying">发送回复</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'; import { ElMessage } from 'element-plus';
import { getDoctorMessages, replyDoctorMessage } from '../api/admin'; import { fmtDate } from '../utils/format';

const msgs=ref([]),filterType=ref('all'),showDetail=ref(false),curMsg=ref(null),reply=ref(''),replying=ref(false);
const filtered=computed(()=>filterType.value==='all'?msgs.value:msgs.value.filter(m=>m.type===filterType.value));

function openMsg(m){curMsg.value=m;reply.value='';showDetail.value=true;m.read=true;}
async function sendReply(){replying.value=true;try{await replyDoctorMessage({msgId:curMsg.value.id,content:reply.value});ElMessage.success('回复已发送（科普建议，不替代面诊）');showDetail.value=false;}catch(e){ElMessage.error('发送失败');}finally{replying.value=false;}}
onMounted(async()=>{try{const d=await getDoctorMessages();msgs.value=d.messages||[];}catch(e){}});
</script>
<style scoped>
.dm{max-width:1000px;}.msg-list{display:flex;flex-direction:column;gap:10px;}
.msg-card{display:flex;align-items:center;gap:14px;padding:14px 18px;background:#fff;border-radius:8px;border:1px solid #e4e8ee;cursor:pointer;transition:box-shadow 0.2s;}.msg-card:hover{box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.msg-card.unread{border-left:3px solid #2c6fce;}.msg-body{flex:1;}.msg-title{font-weight:600;color:#1d2939;margin-bottom:4px;}.msg-preview{font-size:13px;color:#7c8ca5;}.msg-meta{text-align:right;font-size:12px;color:#b0bac9;}
</style>
