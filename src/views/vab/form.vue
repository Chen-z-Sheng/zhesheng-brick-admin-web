<template>
  <div class="template-list">
    <div class="toolbar">
      <el-input v-model="q" placeholder="搜索模板名称或团队名称" clearable class="w-64" />
      <div class="grow" />
      <el-button type="primary" @click="goCreate">新建模板</el-button>
    </div>

    <el-empty v-if="filtered.length === 0" description="暂无模板">
      <template #extra>
        <el-button type="primary" @click="goCreate">去新建</el-button>
      </template>
    </el-empty>

    <div v-else class="grid">
      <el-card v-for="item in filtered" :key="item.id" class="card" shadow="hover">
        <template #header>
          <div class="card-hd">
            <b class="name">{{ item.name }}</b>
            <span class="team">{{ item.teamName }}</span>
          </div>
        </template>
        <div class="desc">{{ item.description || "无描述" }}</div>
        <div class="ops">
          <el-button size="small" type="primary" @click="goEdit(item.id)">编辑</el-button>
          <el-button size="small" @click="goPreview(item.id)">预览</el-button>
          <el-popconfirm title="确认删除此模板？" @confirm="doRemove(item.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getTemplates, deleteTemplate } from "@/api/formTemplate"; // 确保API文件存在

const router = useRouter();
const q = ref("");
const list = ref([]);

// 加载模板列表（带错误处理，避免接口失败卡死）
async function load() {
  try {
    list.value = await getTemplates(); // 调用获取模板列表接口
  } catch (err) {
    ElMessage.error("加载模板失败：" + (err.message || "服务器异常"));
    list.value = []; // 出错时清空列表，避免渲染混乱
  }
}

// 页面挂载时加载列表
onMounted(load);

// 搜索过滤逻辑（不区分大小写）
const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  if (!keyword) return list.value;
  return list.value.filter((item) =>
    [item.name, item.teamName, item.description].some((field) =>
      field?.toLowerCase().includes(keyword)
    )
  );
});

// 跳转到新建模板页（路由路径需与你的路由配置一致）
function goCreate() {
  router.push({ path: '/form', query: { mode: 'new' } })
}

// 跳转到编辑模板页（携带模板ID动态传参）
function goEdit(templateId) {
  router.push({ path: '/form', query: { id: String(templateId) } })
}

// 跳转到预览模板页
function goPreview(templateId) {
  router.push({ path: '/form', query: { id: String(templateId), preview: 'true' } })
}

// 删除模板（调用接口+刷新列表）
async function doRemove(templateId) {
  try {
    await deleteTemplate(templateId); // 调用删除模板接口
    ElMessage.success("删除成功！");
    load(); // 删除后重新加载列表，实时更新视图
  } catch (err) {
    ElMessage.error("删除失败：" + (err.message || "操作异常"));
  }
}
</script>

<style scoped>
/* 布局样式：确保页面美观且响应式 */
.template-list {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 120px);
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.grow {
  flex: 1; /* 自动填充剩余空间，实现按钮右对齐 */
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* 响应式卡片布局 */
  gap: 24px;
}

.card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-4px); /* hover轻微上浮，提升交互体验 */
}

.card-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #1989fa; /* 主色调，与Element Plus一致 */
}

.team {
  font-size: 12px;
  color: #666;
  background-color: #f0f2f5;
  padding: 2px 10px;
  border-radius: 16px;
}

.desc {
  margin: 16px 0;
  color: #666;
  flex: 1; /* 让描述区占满中间空间，按钮区靠底 */
  line-height: 1.6;
  font-size: 14px;
}

.ops {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}
</style>
