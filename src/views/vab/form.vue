<!-- 用户端表单页（仅渲染，样式自定义） -->
<template>
  <div class="user-form">
    <!-- 用VForm渲染器加载配置 -->
    <v-form-render
      :form-config="formConfig"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { VFormRender } from 'vform3-builds';
import 'vform3-builds/dist/render.style.css';

const formConfig = ref({});

// 从数据库获取配置（仅包含字段、顺序、校验等数据）
onMounted(async () => {
  const res = await api.getFormConfig({ schemeId: '当前方案ID' });
  formConfig.value = res.data.config; // 这里的config就是管理端配置的JSON
});

const handleSubmit = (data) => {
  console.log('用户提交数据：', data);
};
</script>

<style scoped>
/* 自定义用户端表单样式（和管理端完全不同） */
.user-form {
  width: 600px;
  margin: 50px auto;
  padding: 30px;
  border: 1px solid #eee;
  border-radius: 8px;
}

/* 覆盖默认组件样式 */
:deep(.el-input) {
  width: 300px;
}
:deep(.el-form-item__label) {
  color: #333;
  font-weight: bold;
}
</style>
