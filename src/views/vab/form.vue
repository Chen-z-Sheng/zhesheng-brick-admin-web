<template>
  <div style="height:100vh;display:flex;flex-direction:column;">
    <div style="padding:8px;border-bottom:1px solid #eee;display:flex;gap:8px;">
      <el-button type="primary" @click="handleSave">保存表单</el-button>
      <el-button @click="handleLoad">载入示例</el-button>
      <el-button @click="handlePreview">预览</el-button>
    </div>
    <fc-designer ref="designerRef" style="flex:1;" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const designerRef = ref(null)

function handleSave() {
  const rule = designerRef.value?.getRule?.() || []
  const option = designerRef.value?.getOption?.() || {}
  localStorage.setItem('formTpl', JSON.stringify({ rule, option }))
  ElMessage.success('已保存到 localStorage（接后端即可）')
}

function handleLoad() {
  const raw = localStorage.getItem('formTpl')
  if (raw) {
    const { rule, option } = JSON.parse(raw)
    designerRef.value?.setRule(rule || [])
    designerRef.value?.setOption(option || {})
    ElMessage.success('已从本地载入')
    return
  }
  const demo = {
    rule: [{ type: 'input', field: 'title', title: '标题', props: { placeholder: '请输入标题' } }],
    option: { submitBtn: true, resetBtn: true, labelWidth: '100px' }
  }
  designerRef.value?.setRule(demo.rule)
  designerRef.value?.setOption(demo.option)
  ElMessage.success('已载入示例')
}

function handlePreview() {
  const rule = designerRef.value?.getRule?.() || []
  const option = designerRef.value?.getOption?.() || {}
  sessionStorage.setItem('formPreview', JSON.stringify({ rule, option }))
  window.open('/preview', '_blank')
}
</script>
