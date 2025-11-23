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
import { getForms, deleteForm } from "@/api/form";

const router = useRouter();
const q = ref("");
const list = ref([]); // 渲染用数组

// 加载模板列表
async function load() {
  try {
    const resp = await getForms(); // resp = { list, pagination }
    console.log("getForms =>", resp);
    list.value = Array.isArray(resp?.list) ? resp.list : [];
  } catch (err) {
    ElMessage.error("加载模板失败：" + (err.message || "服务器异常"));
    list.value = [];
  }
}
onMounted(load);

// 客户端过滤（不区分大小写）
const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  if (!keyword) return list.value;
  return list.value.filter((item) =>
    [item.name, item.teamName, item.description].some((field) =>
      String(field ?? "")
        .toLowerCase()
        .includes(keyword)
    )
  );
});

function goCreate() {
  router.push({ path: "/form", query: { mode: "new" } });
}
function goEdit(id) {
  router.push({ path: "/form", query: { id: String(id) } });
}
function goPreview(id) {
  router.push({ path: "/form", query: { id: String(id), preview: "true" } });
}
async function doRemove(id) {
  try {
    await deleteForm(id);
    ElMessage.success("删除成功！");
    load();
  } catch (err) {
    ElMessage.error("删除失败：" + (err.message || "操作异常"));
  }
}
</script>

<style scoped>
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
  flex: 1;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}
.card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
}
.card:hover {
  transform: translateY(-4px);
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
  color: #1989fa;
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
  flex: 1;
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
