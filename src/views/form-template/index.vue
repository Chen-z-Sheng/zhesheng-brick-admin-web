<template>
  <div class="designer-page">
    <div class="topbar">
      <el-page-header @back="goBack">
        <template #content>
          <span>{{ isNew ? "新建模板" : "编辑模板" }}</span>
        </template>
      </el-page-header>

      <div class="grow" />

      <el-input
        v-model="meta.name"
        placeholder="模板名称"
        class="w-56"
      />
      <el-input
        v-model="meta.teamName"
        placeholder="团队名称"
        class="w-40"
      />
      <el-input
        v-model="meta.description"
        placeholder="模板描述"
        class="w-72"
      />

      <el-button
        :loading="saving"
        type="primary"
        @click="save"
      >保存</el-button>
      <el-button @click="preview">预览</el-button>
    </div>

    <div class="designer-wrap">
      <fc-designer
        ref="designerRef"
        class="designer-root"
      />
    </div>

    <el-dialog
      v-model="previewing"
      width="70%"
      title="表单预览"
      destroy-on-close
    >
      <div
        v-if="!hasFormCreate"
        class="preview-missing"
      >
        未检测到 form-create 渲染器。请确认 main.js 已：
        <pre>import formCreate from '@form-create/element-ui'
          app.use(formCreate)</pre>
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
import { getFormTemplate, createFormTemplate, updateFormTemplate } from "@/api/form-template";

const route = useRoute();
const router = useRouter();

const id = ref(route.query.id ? String(route.query.id) : null);
const isNew = computed(() => route.query.mode === "new" || !id.value);

const designerRef = ref(null);
const meta = ref({ name: "", teamName: "", description: "" });
const saving = ref(false);

// 预览相关（全部纯 JS）
const previewing = ref(false);
const formData = ref({});
const previewRule = ref([]);
const previewOption = ref({});

// 检测是否已注册 form-create
const hasFormCreate = !!(
  typeof window !== "undefined" &&
  (window.formCreate || window.$formCreate)
);

// 清洗规则：去掉纯空白 html 节点与空容器
function cleanRule (nodes) {
  if (!Array.isArray(nodes)) return [];
  const CONTAINER_TYPES = new Set(["row", "col", "group", "tab", "tabs", "card", "grid"]);
  const getHtml = (n) =>
    (n && n.props ? (n.props.innerHTML ?? n.props.html ?? n.children ?? "") : (n && n.children) || "");
  const isEmptyHtml = (n) =>
    n && n.type === "html" && typeof getHtml(n) === "string" && /^\s*$/.test(getHtml(n));

  function deep (arr) {
    return (arr || [])
      .filter((n) => n && !isEmptyHtml(n))
      .map((n) => {
        const copy = { ...n };
        if (Array.isArray(copy.children)) copy.children = deep(copy.children).filter(Boolean);
        if (copy && copy.props && Array.isArray(copy.props.children)) {
          copy.props = { ...copy.props, children: deep(copy.props.children).filter(Boolean) };
        }
        if (copy && copy.options && Array.isArray(copy.options.children)) {
          copy.options = { ...copy.options, children: deep(copy.options.children).filter(Boolean) };
        }
        return copy;
      })
      .filter((n) => {
        const hasKids =
          (Array.isArray(n.children) && n.children.length > 0) ||
          (n && n.props && Array.isArray(n.props.children) && n.props.children.length > 0) ||
          (n && n.options && Array.isArray(n.options.children) && n.options.children.length > 0);
        return !CONTAINER_TYPES.has(n.type) || hasKids;
      });
  }
  return deep(nodes);
}

onMounted(async () => {
  if (!isNew.value && id.value) {
    try {
      const detail = await getFormTemplate(id.value);
      meta.value = {
        name: (detail && detail.name) || "",
        teamName: (detail && detail.teamName) || "",
        description: (detail && detail.description) || "",
      };
      await nextTick();
      const safeRule = cleanRule((detail && detail.ruleJson) || []);
      const safeOpt = (detail && detail.optionJson) || {};
      if (designerRef.value && designerRef.value.setRule) designerRef.value.setRule(safeRule);
      if (designerRef.value && designerRef.value.setOption) designerRef.value.setOption(safeOpt);
    } catch (e) {
      ElMessage.error("加载模板失败：" + (e && e.message ? e.message : "接口异常"));
    }
  }
  if (route.query.preview === "true") preview();
});

async function save () {
  const rawRule = (designerRef.value && designerRef.value.getRule) ? designerRef.value.getRule() : [];
  const rawOption = (designerRef.value && designerRef.value.getOption) ? designerRef.value.getOption() : {};
  const rule = cleanRule(rawRule);
  const option = rawOption;

  if (!meta.value.name || !meta.value.teamName) {
    ElMessage.warning("请填写模板名称和团队名称");
    return;
  }

  saving.value = true;
  try {
    if (isNew.value) {
      await createFormTemplate({ ...meta.value, ruleJson: rule, optionJson: option });
      ElMessage.success("模板创建成功");
      router.back();
    } else {
      await updateFormTemplate(id.value, { ...meta.value, ruleJson: rule, optionJson: option });
      ElMessage.success("模板更新成功");
    }
  } catch (e) {
    ElMessage.error("保存失败：" + (e && e.message ? e.message : "接口异常"));
  } finally {
    saving.value = false;
  }
}

function preview () {
  if (!hasFormCreate) {
    ElMessage.warning("未注册 form-create 渲染器，无法预览");
    previewing.value = true;
    return;
  }
  const rawRule = (designerRef.value && designerRef.value.getRule) ? designerRef.value.getRule() : [];
  previewRule.value = cleanRule(rawRule);
  previewOption.value = (designerRef.value && designerRef.value.getOption) ? designerRef.value.getOption() : {};
  previewing.value = true;
}

function goBack () {
  router.back();
}
</script>

<style scoped lang="scss">
.designer-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}
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

.designer-wrap {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  height: calc(100vh - 120px); /* 顶部工具栏大约 60~80px，自行微调 */
  box-sizing: border-box;
}
.designer-root {
  width: 100%;
  height: 100%; /* 关键：改成 100% 高度 */
  display: block;
}

/* ② 取消我们之前的“兜底 min-height”，避免把右侧面板也一起拉高 */
:deep(.fc-designer),
:deep(.fc-container),
:deep(.form-create) {
  min-height: 0; /* 原来是 700px，这里显式归零 */
}

/* ③ 右侧配置面板：去掉 el-collapse 默认的大内边距/底部空白 */
:deep(.fc-designer .fc-right) {
  overflow: auto; /* 只在右侧滚动，避免整页拉长 */
  /* 可选：把 Collapse 的全局变量调小（Element Plus 2.x 支持） */
  --el-collapse-content-spacing: 0px;
}
:deep(.fc-designer .fc-right .el-collapse-item__wrap),
:deep(.fc-designer .fc-right .el-collapse-item__content) {
  padding-bottom: 0 !important;
}

/* ④ el-form 间距收紧（已经写过，这里加强“最后一项无间距”） */
:deep(.fc-designer .fc-right .el-form .el-form-item) {
  margin-bottom: 8px;
}
:deep(.fc-designer .fc-right .el-form .el-form-item:last-child) {
  margin-bottom: 0;
}
/* 某些面板用 row/gutter 叠加了额外空隙 */
:deep(.fc-designer .fc-right .el-row) {
  margin-bottom: 0;
}
:deep(.fc-designer .fc-right .el-divider) {
  margin: 8px 0;
}

/* ⑤ 解决 el-scrollbar 把内容“强行拉满”的问题 */
:deep(.fc-designer .fc-right .el-scrollbar__view) {
  min-height: auto !important; /* Element Plus 默认是 100% */
}

/* ⑥ 防止某些“隐藏块”占位（个别版本用 visibility 隐藏） */
:deep(.fc-designer .fc-right [style*="visibility: hidden"]) {
  display: none !important;
}
</style>
