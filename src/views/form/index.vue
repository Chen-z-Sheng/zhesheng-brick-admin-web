<template>
  <div class="designer-page">
    <!-- 顶部工具栏 -->
    <div class="topbar">
      <el-page-header @back="goBack">
        <template #content>
          <span>{{ isNew ? "新建模板" : "编辑模板" }}</span>
        </template>
      </el-page-header>

      <div class="grow" />

      <el-input v-model="meta.name" placeholder="模板名称" class="w-56" />
      <el-input v-model="meta.teamName" placeholder="团队名称" class="w-40" />
      <el-input v-model="meta.description" placeholder="模板描述" class="w-72" />

      <el-button :loading="saving" type="primary" @click="save">保存</el-button>
      <el-button @click="preview">预览</el-button>
    </div>

    <!-- 设计器区域：不再缩放，不再内滚动，自然铺开 -->
    <div class="designer-wrap">
      <fc-designer ref="designerRef" class="designer-root" />
    </div>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewing" width="70%" title="表单预览" destroy-on-close>
      <div v-if="!hasFormCreate" class="preview-missing">
        未检测到 form-create 渲染器。请在 main.js 注册后再试：
        <pre>
import formCreate from '@form-create/element-ui'
app.use(formCreate)</pre
        >
      </div>
      <form-create
        v-else
        v-model="formData"
        :rule="previewRule"
        :option="previewOption"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getForm, createForm, updateForm } from "@/api/form";

const route = useRoute();
const router = useRouter();

const id = ref(route.query.id ? String(route.query.id) : null);
const isNew = computed(() => route.query.mode === "new" || !id.value);

const designerRef = ref(null);
const meta = ref({ name: "", teamName: "", description: "" });
const saving = ref(false);

// 预览相关
const previewing = ref(false);
const formData = ref({});
const previewRule = ref([]);
const previewOption = ref({});
const hasFormCreate = !!(
  typeof window !== "undefined" &&
  (window.formCreate || window.$formCreate)
);

onMounted(async () => {
  if (!isNew.value && id.value) {
    try {
      const detail = await getForm(id.value);
      meta.value = {
        name: detail.name || "",
        teamName: detail.teamName || "",
        description: detail.description || "",
      };
      await nextTick();
      designerRef.value?.setRule?.(detail.ruleJson || []);
      designerRef.value?.setOption?.(detail.optionJson || {});
    } catch (e) {
      ElMessage.error("加载模板失败：" + (e?.message || "接口异常"));
    }
  }
  if (route.query.preview === "true") preview();
});

async function save() {
  const rule = designerRef.value?.getRule?.() || [];
  const option = designerRef.value?.getOption?.() || {};

  if (!meta.value.name || !meta.value.teamName) {
    ElMessage.warning("请填写模板名称和团队名称");
    return;
  }

  saving.value = true;
  try {
    if (isNew.value) {
      await createForm({ ...meta.value, ruleJson: rule, optionJson: option });
      ElMessage.success("模板创建成功");
      router.back();
    } else {
      await updateForm(id.value, { ...meta.value, ruleJson: rule, optionJson: option });
      ElMessage.success("模板更新成功");
    }
  } catch (e) {
    ElMessage.error("保存失败：" + (e?.message || "接口异常"));
  } finally {
    saving.value = false;
  }
}

function preview() {
  if (!hasFormCreate) {
    ElMessage.warning("未注册 form-create 渲染器，无法预览");
    previewing.value = true;
    return;
  }
  previewRule.value = designerRef.value?.getRule?.() || [];
  previewOption.value = designerRef.value?.getOption?.() || {};
  previewing.value = true;
}

function goBack() {
  router.back();
}
</script>

<style scoped lang="scss">
/* 页面整体用自然流布局，滚动交给页面本身 */
.designer-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

/* 顶部工具栏 */
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.grow {
  flex: 1;
}
.w-56 {
  width: 260px;
}
.w-40 {
  width: 200px;
}
.w-72 {
  width: 320px;
}

/* 设计器外框：留白 + 边框，自动撑高 */
.designer-wrap {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
}

/* 设计器铺满父容器；不给固定高度，最小高度兜底 */
.designer-root {
  width: 100%;
  height: auto;
  min-height: 700px; /* 你也可以改成 80vh 看喜好 */
  display: block;
}

/* 兜底：不同版本内部容器名不同，统一拉满 */
:deep(.fc-designer),
:deep(.fc-container),
:deep(.form-create) {
  min-height: 700px;
}
.preview-missing {
  font-size: 13px;
  color: #666;
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  white-space: pre-wrap;
}
</style>
