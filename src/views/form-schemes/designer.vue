<template>
  <div class="designer-page">
    <div class="topbar">
      <el-page-header @back="goBack">
        <template #content>
          <span>{{ isNew ? "新建方案" : "编辑方案" }}</span>
        </template>
      </el-page-header>

      <div class="grow" />

      <el-button
        :loading="saving"
        type="primary"
        @click="onSubmit"
      > 保存 </el-button>
      <el-button @click="goBack">返回</el-button>
    </div>

    <div class="form-wrap">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="96px"
      >
        <el-form-item
          label="方案名称"
          prop="name"
        >
          <el-input
            v-model="form.name"
            placeholder="例如：11.11京东珀莱雅222本845回900"
          />
        </el-form-item>

        <el-form-item
          label="关联模板"
          prop="templateId"
        >
          <el-select
            v-model="form.templateId"
            placeholder="请选择模板"
            filterable
            class="w-56"
          >
            <el-option
              v-for="tpl in templateOptions"
              :key="tpl.id"
              :label="`${tpl.name}（${tpl.teamName}）`"
              :value="tpl.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="方案说明">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="可选，给自己/团队看的备注说明"
          />
        </el-form-item>

        <el-form-item
          label="状态"
          prop="status"
        >
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="2">草稿</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getScheme, createScheme, updateScheme } from "@/api/form-schemes";
import { getFormTemplates } from "@/api/form-template";

const route = useRoute();
const router = useRouter();

const id = ref(route.query.id ? String(route.query.id) : null);
const isNew = computed(() => route.query.mode === "new" || !id.value);

const formRef = ref();
const saving = ref(false);

const form = ref({
  name: "",
  templateId: "",
  description: "",
  status: 1, // 默认启用
});

const rules = {
  name: [{ required: true, message: "请输入方案名称", trigger: "blur" }],
  templateId: [{ required: true, message: "请选择模板", trigger: "change" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};

const templateOptions = ref([]);

// 加载模板列表供选择
async function loadTemplates () {
  try {
    const resp = await getFormTemplates({ pageSize: 100 });
    templateOptions.value = Array.isArray(resp?.list) ? resp.list : [];
  } catch (e) {
    console.error(e);
    ElMessage.error("加载模板列表失败：" + (e.message || "接口异常"));
  }
}

// 加载方案详情（编辑模式）
async function loadDetail () {
  if (isNew.value || !id.value) return;
  try {
    const detail = await getScheme(id.value);
    form.value = {
      name: detail.name ?? "",
      templateId: detail.templateId ?? "",
      description: detail.description ?? "",
      status: typeof detail.status === "number" ? detail.status : 1,
    };
  } catch (e) {
    console.error(e);
    ElMessage.error("加载方案失败：" + (e.message || "接口异常"));
  }
}

onMounted(async () => {
  await loadTemplates();
  await loadDetail();
});

function onSubmit () {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      const payload = {
        name: form.value.name,
        templateId: form.value.templateId,
        description: form.value.description || null,
        status: form.value.status,
      };

      if (isNew.value) {
        await createScheme(payload);
        ElMessage.success("方案创建成功");
        goBack();
      } else if (id.value) {
        await updateScheme(id.value, payload);
        ElMessage.success("方案更新成功");
      }
    } catch (e) {
      console.error(e);
      ElMessage.error("保存失败：" + (e.message || "接口异常"));
    } finally {
      saving.value = false;
    }
  });
}

function goBack () {
  // 返回上一个页面（一般是方案列表）
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
.form-wrap {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 24px;
  box-sizing: border-box;
}
</style>
