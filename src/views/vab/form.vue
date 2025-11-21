<template>
  <div class="form-container">
    <el-card
      shadow="never"
      class="form-card"
    >
      <template #header>
        <div class="card-header">
          <span>自定义表单设计</span>
          <div class="header-actions">
            <el-button
              type="primary"
              @click="handleSave"
            >保存表单</el-button>
            <el-button @click="handlePreview">预览</el-button>
          </div>
        </div>
      </template>

      <!-- 自动计算高度：刚好夹在顶部与底部之间 -->
      <div
        ref="viewportRef"
        class="designer-viewport"
      >
        <div
          class="designer-scale"
          :style="scaleStyle"
        >
          <fc-designer
            ref="designerRef"
            class="designer-root"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

const designerRef = ref(null)
const viewportRef = ref(null)

/** 锁定整页滚动（仅本页） */
const origOverflow = { html: '', body: '' }
function lockPageScroll () {
  const html = document.documentElement
  const body = document.body
  origOverflow.html = html.style.overflow
  origOverflow.body = body.style.overflow
  html.style.overflow = 'hidden'
  body.style.overflow = 'hidden'
}
function unlockPageScroll () {
  const html = document.documentElement
  const body = document.body
  html.style.overflow = origOverflow.html
  body.style.overflow = origOverflow.body
}

/** 中间区域缩放（可调） */
const scale = ref(0.9)
const scaleStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top center'
}))

/** 动态高度：保证顶部/底部同时可见 */
let resizeObserver
function layoutViewport () {
  const el = viewportRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const footer = document.querySelector('.app-footer, .layout-footer, .vab-footer, footer, #footer')
  const footerH = footer ? footer.getBoundingClientRect().height : 56
  const gap = 12
  const h = Math.max(420, window.innerHeight - rect.top - footerH - gap)
  el.style.height = h + 'px'
}
function onResize () { layoutViewport() }

onMounted(async () => {
  await new Promise(r => requestAnimationFrame(r))
  await nextTick()

  lockPageScroll()
  layoutViewport()

  const cardBody = document.querySelector('.form-card .el-card__body')
  if (cardBody) cardBody.style.overflow = 'hidden'

  window.addEventListener('resize', onResize, { passive: true })
  const shell = document.getElementById('vue-admin-better')
  if (window.ResizeObserver && shell) {
    resizeObserver = new ResizeObserver(() => layoutViewport())
    resizeObserver.observe(shell)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (resizeObserver) resizeObserver.disconnect()
  unlockPageScroll()
})

/** 保存 / 预览 */
function handleSave () {
  const rule = designerRef.value?.getRule?.() || []
  const option = designerRef.value?.getOption?.() || {}
  localStorage.setItem('formTpl', JSON.stringify({ rule, option }))
  console.log('[formTpl saved]', { rule, option })
  ElMessage.success('已保存到 localStorage（接后端即可）')
}
function handlePreview () {
  const rule = designerRef.value?.getRule?.() || []
  const option = designerRef.value?.getOption?.() || {}
  sessionStorage.setItem('formPreview', JSON.stringify({ rule, option }))
  window.open('/preview', '_blank')
}
</script>

<!-- ❌ 不要再引第三方 CSS：新版包没有 .css 文件，删掉相关 <style src> 即可 -->

<style scoped lang="scss">
.form-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .form-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

/* 视口由 JS 设置高度；grid 让缩放层水平居中 */
.designer-viewport {
  min-height: 420px;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  position: relative;
  display: grid;
  place-content: start center; /* 顶对齐 + 水平居中 */
}

/* 缩放包裹层 */
.designer-scale {
  width: 100%;
  height: 100%;
  will-change: transform;
}

/* 设计器占满缩放层 */
.designer-root {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
}
</style>
