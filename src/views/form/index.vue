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

    <!-- 设计器视口 -->
    <div class="viewport">
      <div class="scale" :style="scaleStyle">
        <fc-designer ref="designerRef" class="root" />
      </div>
    </div>

    <!-- 预览弹窗（需要已注册 form-create 渲染器） -->
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
import { getTemplateDetail, createTemplate, updateTemplate } from "@/api/formTemplate";

const route = useRoute();
const router = useRouter();

/** 路由参数：/form?mode=new 或 /form?id=xxx[&preview=true] */
const id = ref(route.query.id ? String(route.query.id) : null);
const isNew = computed(() => route.query.mode === "new" || !id.value);

const designerRef = ref(null);
const meta = ref({ name: "", teamName: "", description: "" });
const saving = ref(false);

/** 设计器缩放，不改布局逻辑，简单稳定 */
const scale = ref(0.9);
const scaleStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: "top center",
}));

/** 预览相关（仅在已注册 form-create 时可用） */
const previewing = ref(false);
const formData = ref({});
const previewRule = ref([]);
const previewOption = ref({});
const hasFormCreate = !!(
  typeof window !== "undefined" &&
  (window.formCreate || window.$formCreate)
);

onMounted(async () => {
  // 编辑态：拉详情并填入设计器
  if (!isNew.value && id.value) {
    try {
      const detail = await getTemplateDetail(id.value);
      meta.value = {
        name: detail.name || "",
        teamName: detail.teamName || "",
        description: detail.description || "",
      };
      await nextTick();
      designerRef.value?.setRule?.(detail.rule_json || []);
      designerRef.value?.setOption?.(detail.option_json || {});
    } catch (e) {
      ElMessage.error("加载模板失败：" + (e?.message || "接口异常"));
    }
  }

  // URL 带 preview=true 时，初始化后立即预览
  if (route.query.preview === "true") {
    preview();
  }
});

/** 保存（新建/编辑复用） */
async function save() {
  const rule = designerRef.value?.getRule?.() || [];
  const option = designerRef.value?.getOption?.() || [];

  if (!meta.value.name || !meta.value.teamName) {
    ElMessage.warning("请填写模板名称和团队名称");
    return;
  }

  saving.value = true;
  try {
    if (isNew.value) {
      await createTemplate({
        name: meta.value.name,
        teamName: meta.value.teamName,
        description: meta.value.description,
        rule_json: rule,
        option_json: option,
      });
      ElMessage.success("模板创建成功");
      // 返回列表或停留本页均可，这里选择返回列表
      router.back();
    } else {
      await updateTemplate(id.value, {
        name: meta.value.name,
        teamName: meta.value.teamName,
        description: meta.value.description,
        rule_json: rule,
        option_json: option,
      });
      ElMessage.success("模板更新成功");
    }
  } catch (e) {
    ElMessage.error("保存失败：" + (e?.message || "接口异常"));
  } finally {
    saving.value = false;
  }
}

/** 预览（无渲染器时给出提示） */
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
.designer-page {
  display: flex;
  flex-direction: column;
  padding: 12px;
  height: 100%;
}
.topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.viewport {
  height: calc(100vh - 120px);
  min-height: 480px;
  overflow: auto;
  display: grid;
  place-content: start center;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.scale {
  width: 100%;
  height: 100%;
}
.root {
  width: 100%;
  min-height: 560px;
  display: block;
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
.grow {
  flex: 1;
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
