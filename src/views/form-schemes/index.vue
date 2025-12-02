<template>
  <div class="scheme-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="q"
        clearable
        placeholder="搜索方案名称"
        class="w-64"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-select
        v-model="status"
        clearable
        placeholder="状态"
        class="w-40"
        @change="onSearch"
      >
        <el-option :value="1" label="启用" />
        <el-option :value="2" label="草稿" />
        <el-option :value="0" label="停用" />
      </el-select>

      <div class="grow" />

      <el-button type="primary" @click="goCreate">新建方案</el-button>
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="list"
      border
      header-row-class-name="table-header"
      size="small"
    >
      <el-table-column
        prop="name"
        label="方案名称"
        min-width="220"
        show-overflow-tooltip
      />
      <el-table-column
        prop="templateName"
        label="关联模板"
        min-width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span v-if="row.templateName">
            {{ row.templateName }}
            <span v-if="row.teamName" class="tpl-team"> （{{ row.teamName }}） </span>
          </span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="goEdit(row.id)">
            编辑
          </el-button>
          <el-popconfirm title="确认删除此方案？" @confirm="doRemove(row.id)">
            <template #reference>
              <el-button size="small" type="danger" link> 删除 </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <el-empty v-if="!loading && list.length === 0" description="暂无方案" class="mt-4">
      <template #extra>
        <el-button type="primary" @click="goCreate">去新建</el-button>
      </template>
    </el-empty>

    <!-- 分页 -->
    <div class="pager" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="onPageChange"
        @size-change="onPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getSchemes, deleteScheme } from "@/api/form-schemes"; // 按你实际路径改

const router = useRouter();

const q = ref("");
const status = ref(); // 0/1/2，可选
const list = ref([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 加载列表（带分页 & 简单筛选）
async function load() {
  loading.value = true;
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      // 后端如果支持关键词筛选，可以传个 keyword 或 name，看你 BasePage 怎么设计的
      keyword: q.value || undefined,
      status: status.value ?? undefined,
    };
    const resp = await getSchemes(params);
    console.log("getSchemes =>", resp);
    list.value = Array.isArray(resp?.list) ? resp.list : [];
    if (resp?.pagination) {
      pagination.value = {
        page: Number(resp.pagination.page) || pagination.value.page,
        pageSize: Number(resp.pagination.pageSize) || pagination.value.pageSize,
        total: Number(resp.pagination.total) || 0,
      };
    }
  } catch (err) {
    console.error(err);
    ElMessage.error("加载方案失败：" + (err.message || "服务器异常"));
    list.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function onSearch() {
  pagination.value.page = 1;
  load();
}

function onPageChange(page) {
  pagination.value.page = page;
  load();
}

function onPageSizeChange(size) {
  pagination.value.pageSize = size;
  pagination.value.page = 1;
  load();
}

function goCreate() {
  router.push({ path: "/form-schemes/edit", query: { mode: "new" } });
}

function goEdit(id) {
  router.push({
    path: "/form-schemes/edit",
    query: { id: String(id) },
  });
}

async function doRemove(id) {
  try {
    await deleteScheme(id);
    ElMessage.success("删除成功！");
    // 如果当前页删到空了，自动回到上一页
    if (list.value.length === 1 && pagination.value.page > 1) {
      pagination.value.page -= 1;
    }
    load();
  } catch (err) {
    console.error(err);
    ElMessage.error("删除失败：" + (err.message || "操作异常"));
  }
}

// 状态相关
function statusText(v) {
  switch (v) {
    case 0:
      return "停用";
    case 1:
      return "启用";
    case 2:
      return "草稿";
    default:
      return String(v ?? "");
  }
}

function statusTagType(v) {
  switch (v) {
    case 0:
      return "info";
    case 1:
      return "success";
    case 2:
      return "warning";
    default:
      return "default";
  }
}

function formatTime(v) {
  if (!v) return "";
  try {
    const d = typeof v === "string" ? new Date(v) : v;
    if (Number.isNaN(d.getTime())) return String(v);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${mi}`;
  } catch {
    return String(v);
  }
}
</script>

<style scoped>
.scheme-page {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 120px);
}
.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.grow {
  flex: 1;
}
.w-64 {
  width: 260px;
}
.w-40 {
  width: 180px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.tpl-team {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}
.text-muted {
  color: #bbb;
}
.mt-4 {
  margin-top: 16px;
}
</style>
