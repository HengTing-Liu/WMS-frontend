<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Select, Button } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import {
  addProductCategory,
  updateProductCategory,
  submitTestAdd,
  getFormSchema,
  getProductCategoryList,
  getBrandStatus,
} from '#/api';
import type { FormSchemaResponse } from '#/api/system/productCategory';
import type {
  AsyncLinkageConfig,
  FormSchemaItem,
  LinkageRule,
  FormKey,
  FormOptionsMap,
  AsyncLinkageGlobalConfig,
  LinkageEngineContext,
} from '#/utils/formLinkage';
import {
  executeLinkage as executeLinkageEngine,
  enhanceSchemaWithLinkage as enhanceSchemaWithLinkageEngine,
  loadAsyncLinkageData as loadAsyncLinkageDataEngine,
  setupLinkageWatch as setupLinkageWatchEngine,
} from '#/utils/formLinkage';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.query.id);
const editingId = ref<string | number | undefined>(undefined);
const loading = ref(true);

const languageValue = ref<string>('中文');
const languageOptions = ref([
  { label: '中文', value: '中文' },
  { label: '英语', value: '英语' },
  { label: '韩语', value: '韩语' },
]);

// 联动规则（由后端配置）
const linkageRules = ref<LinkageRule[]>([]);
const asyncLinkageGlobalConfig = ref<AsyncLinkageGlobalConfig | null>(null);

// 存储各区块表单实例，供联动引擎使用
const formInstanceMap = reactive<Record<FormKey, any>>({
  basic: null,
  category: null,
  application: null,
  other: null,
});

function onLanguageChange(value: any) {
  message.info(`当前语言：${value ?? ''}`);
}

const noActionButtons = {
  submitButtonOptions: { show: false },
  resetButtonOptions: { show: false },
};

function normalizeFormSchema(
  res: FormSchemaResponse | null,
): {
  basicSchema: FormSchemaItem[];
  categorySchema: FormSchemaItem[];
  applicationSchema: FormSchemaItem[];
  otherSchema: FormSchemaItem[];
  linkageRules: LinkageRule[];
} {
  const empty: any[] = [];
  const emptyRules: LinkageRule[] = [];
  if (!res) {
    return {
      basicSchema: empty,
      categorySchema: empty,
      applicationSchema: empty,
      otherSchema: empty,
      linkageRules: emptyRules,
    };
  }

  const parsedLinkageRules = Array.isArray((res as any).linkageRules)
    ? ((res as any).linkageRules as LinkageRule[])
    : emptyRules;

  if (res.sections && Array.isArray(res.sections)) {
    const map: Record<string, any[]> = {
      basic: [],
      category: [],
      application: [],
      other: [],
    };
    res.sections.forEach((s) => {
      if (s.key && map[s.key] !== undefined && Array.isArray(s.schema)) {
        map[s.key] = s.schema;
      }
    });

    return {
      basicSchema: enhanceSchemaWithLinkage(map.basic ?? empty, 'basic', parsedLinkageRules),
      categorySchema: enhanceSchemaWithLinkage(map.category ?? empty, 'category', parsedLinkageRules),
      applicationSchema: enhanceSchemaWithLinkage(map.application ?? empty, 'application', parsedLinkageRules),
      otherSchema: enhanceSchemaWithLinkage(map.other ?? empty, 'other', parsedLinkageRules),
      linkageRules: parsedLinkageRules,
    };
  }

  const basic = Array.isArray(res.basicSchema) ? res.basicSchema : empty;
  const category = Array.isArray(res.categorySchema) ? res.categorySchema : empty;
  const application = Array.isArray(res.applicationSchema) ? res.applicationSchema : empty;
  const other = Array.isArray(res.otherSchema) ? res.otherSchema : empty;

  return {
    basicSchema: enhanceSchemaWithLinkage(basic, 'basic', parsedLinkageRules),
    categorySchema: enhanceSchemaWithLinkage(category, 'category', parsedLinkageRules),
    applicationSchema: enhanceSchemaWithLinkage(application, 'application', parsedLinkageRules),
    otherSchema: enhanceSchemaWithLinkage(other, 'other', parsedLinkageRules),
    linkageRules: parsedLinkageRules,
  };
}

const formOptionsBasic = reactive({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal' as const,
  wrapperClass: 'grid-cols-5 gap-x-6 gap-y-5',
  ...noActionButtons,
  schema: [] as any[],
});
const formOptionsCategory = reactive({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal' as const,
  wrapperClass: 'grid-cols-5 gap-x-6 gap-y-5',
  ...noActionButtons,
  schema: [] as any[],
});
const formOptionsApplication = reactive({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal' as const,
  wrapperClass: 'grid-cols-5 gap-x-6 gap-y-5',
  ...noActionButtons,
  schema: [] as any[],
});
const formOptionsOther = reactive<{
  commonConfig: object;
  layout: 'horizontal';
  wrapperClass: string;
  submitButtonOptions: object;
  resetButtonOptions: object;
  schema: any[];
  handleSubmit?: () => Promise<void>;
  handleReset?: () => Promise<void>;
}>({
  commonConfig: { componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-5 gap-x-6 gap-y-5',
  submitButtonOptions: { show: true, content: '保存' },
  resetButtonOptions: { show: true, content: '取消' },
  schema: [],
});
const [BaseForm, baseFormApi] = useVbenForm(formOptionsBasic);
const [CategoryForm, categoryFormApi] = useVbenForm(formOptionsCategory);
const [ApplicationForm, applicationFormApi] = useVbenForm(formOptionsApplication);
const [OtherInfoForm, otherInfoFormApi] = useVbenForm(formOptionsOther);
// 把实例挂到映射表，供联动引擎使用
formInstanceMap.basic = baseFormApi;
formInstanceMap.category = categoryFormApi;
formInstanceMap.application = applicationFormApi;
formInstanceMap.other = otherInfoFormApi;

// schema 配置映射表（给联动引擎使用）
const formOptionsMap: FormOptionsMap = {
  basic: formOptionsBasic,
  category: formOptionsCategory,
  application: formOptionsApplication,
  other: formOptionsOther,
};
const currentSchemas = reactive({
  basicSchema: [] as any[],
  categorySchema: [] as any[],
  applicationSchema: [] as any[],
  otherSchema: [] as any[],
});

// 应用信息：新增一行的模板（与后端 application1 / recommandDilution1 结构一致）
const APPLICATION_ROW_OPTIONS = [
  { label: 'WB', value: 'WB' },
  { label: 'IF/ICC', value: 'IF/ICC' },
  { label: 'ELISA', value: 'ELISA' },
  { label: 'FC', value: 'FC' },
];

function buildApplicationRowSchema(n: number): any[] {
  return [
    {
      component: 'Select',
      fieldName: `application${n}`,
      label: 'Application',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: 'WB',
        options: [...APPLICATION_ROW_OPTIONS],
      },
    },
    {
      component: 'Input',
      fieldName: `recommandDilution${n}`,
      label: 'RecommandDilution',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '1:500 - 1:1000',
      },
    },
  ];
}

function handleAddApplicationRow() {
  const schema = formOptionsApplication.schema;
  const addIdx = schema.findIndex((i: any) => i.fieldName === 'addApplication');
  if (addIdx === -1) return;

  const applicationFields = schema.filter(
    (i: any) => typeof i.fieldName === 'string' && /^application\d+$/.test(i.fieldName),
  );
  const nextN = applicationFields.length + 1;
  const newRow = buildApplicationRowSchema(nextN);

  const newSchema = [
    ...schema.slice(0, addIdx),
    ...newRow,
    ...schema.slice(addIdx),
  ];
  formOptionsApplication.schema = newSchema;
  currentSchemas.applicationSchema = newSchema;
}

function getLinkageContext(): LinkageEngineContext {
  return {
    linkageRules,
    asyncLinkageGlobalConfig,
    formInstanceMap,
    formOptionsMap,
  };
}

// 对外暴露的本地封装：页面仍然调用同名函数，内部委托给公共联动引擎
function enhanceSchemaWithLinkage(
  schema: FormSchemaItem[],
  formKey: FormKey,
  rules: LinkageRule[],
): any[] {
  const ctx = getLinkageContext();
  return enhanceSchemaWithLinkageEngine(ctx, schema, formKey, rules);
}

function setupLinkageWatch() {
  const ctx: Pick<LinkageEngineContext, 'linkageRules' | 'formInstanceMap'> = {
    linkageRules,
    formInstanceMap,
  };
  setupLinkageWatchEngine(ctx);
}

async function executeFieldLinkage(formKey: FormKey, field: string, value: any) {
  await executeLinkageEngine({ linkageRules, formInstanceMap }, formKey, field, value);
}

formOptionsOther.handleSubmit = async () => {
  const [baseValid, categoryValid, appValid, otherValid] = await Promise.all([
    baseFormApi?.validate(),
    categoryFormApi?.validate(),
    applicationFormApi?.validate(),
    otherInfoFormApi?.validate(),
  ]);
  const allValid = baseValid?.valid && categoryValid?.valid && appValid?.valid && otherValid?.valid;
  if (!allValid) {
    message.warning('请按提示完善必填项');
    return;
  }
  const [baseValues, categoryValues, appValues, otherValues] = await Promise.all([
    baseFormApi?.getValues() ?? {},
    categoryFormApi?.getValues() ?? {},
    applicationFormApi?.getValues() ?? {},
    otherInfoFormApi?.getValues() ?? {},
  ]);
  const payload = {
    id: isEdit.value ? editingId.value : undefined,
    basic: baseValues,
    category: categoryValues,
    application: appValues,
    other: otherValues,
  };
  try {
    await submitTestAdd({
      basicSchema: currentSchemas.basicSchema,
      categorySchema: currentSchemas.categorySchema,
      applicationSchema: currentSchemas.applicationSchema,
      otherSchema: currentSchemas.otherSchema,
    });
    if (isEdit.value) {
      await updateProductCategory(payload);
    } else {
      await addProductCategory(payload);
    }
    message.success('保存成功');
    router.push({ name: 'ProductCategory' });
  } catch (e: any) {
    message.error(e?.message || '保存失败');
  }
};

formOptionsOther.handleReset = async () => {
  await Promise.all([
    baseFormApi?.resetForm?.(),
    categoryFormApi?.resetForm?.(),
    applicationFormApi?.resetForm?.(),
    otherInfoFormApi?.resetForm?.(),
  ]);
  router.push({ name: 'ProductCategory' });
};

onMounted(async () => {
  // 1. 只把「获取表单配置」放到 loading 里，保证一定能结束
  loading.value = true;
  try {
    const res = await getFormSchema();
    const normalized = normalizeFormSchema(res ?? null);

    formOptionsBasic.schema = normalized.basicSchema;
    formOptionsCategory.schema = normalized.categorySchema;
    formOptionsApplication.schema = normalized.applicationSchema;
    formOptionsOther.schema = normalized.otherSchema;

    currentSchemas.basicSchema = normalized.basicSchema;
    currentSchemas.categorySchema = normalized.categorySchema;
    currentSchemas.applicationSchema = normalized.applicationSchema;

    // 为「添加应用信息」按钮绑定点击事件，动态增加一行 Application + RecommandDilution
    const addAppItem = formOptionsApplication.schema.find(
      (i: any) => i.fieldName === 'addApplication',
    );
    if (addAppItem?.componentProps) {
      // 点击事件：新增一行 Application + RecommandDilution
      addAppItem.componentProps.onClick = handleAddApplicationRow;
      // 尽量兼容多种按钮实现方式，把常见的文本属性都设置一遍
      const text = addAppItem.componentProps.children || '添加应用信息';
      addAppItem.componentProps.children = text;
      (addAppItem.componentProps as any).content = text;
      (addAppItem.componentProps as any).text = text;
      (addAppItem.componentProps as any).title = text;
    }
    currentSchemas.otherSchema = normalized.otherSchema;

    linkageRules.value = normalized.linkageRules;
    asyncLinkageGlobalConfig.value = (res as any)?.asyncLinkageConfig ?? null;

    if (res?.languageOptions && Array.isArray(res.languageOptions) && res.languageOptions.length > 0) {
      languageOptions.value = res.languageOptions;
    }

    // 初始化联动监听（本地联动 + 异步联动的触发）
    setupLinkageWatch();

    // 一级联动：页面加载后调用 /api/test/brandStatus，把返回数据赋给「品牌」和「产品分类」下拉
    try {
      // 品牌选项
      const brandOptions = await getBrandStatus();
      const brandItem = formOptionsBasic.schema.find((i: any) => i.fieldName === 'brand');
      const baseProps = brandItem?.componentProps ?? {};
      await baseFormApi?.updateSchema?.([
        {
          fieldName: 'brand',
          componentProps: {
            ...baseProps,
            options: Array.isArray(brandOptions) ? brandOptions : [],
          },
        },
      ]);

      // 产品分类选项（复用同一个接口，约定通过 scene 区分）
      const categoryOptions = await getBrandStatus({ scene: 'productCategory' });
      const categoryItem = formOptionsBasic.schema.find((i: any) => i.fieldName === 'productCategory');
      const categoryBaseProps = categoryItem?.componentProps ?? {};
      await baseFormApi?.updateSchema?.([
        {
          fieldName: 'productCategory',
          componentProps: {
            ...categoryBaseProps,
            options: Array.isArray(categoryOptions) ? categoryOptions : [],
          },
        },
      ]);
    } catch (e) {
      console.warn('加载品牌/产品分类选项失败', e);
    }
  } catch (e: any) {
    message.error(e?.message || '加载表单配置失败');
  } finally {
    loading.value = false;
  }

  // 2. 再单独去获取列表第一条数据做编辑回显，不影响 loading 状态
  if (isEdit.value) {
    try {
      const listRes = await getProductCategoryList({
        pageNum: 1,
        pageSize: 1,
      });
      const firstRow = listRes?.rows?.[0];

      if (firstRow && typeof firstRow === 'object') {
        const formValues = {
          id: firstRow.id,
          catalogNo: firstRow.catalog_no, // 货号
          productName: firstRow.name, // 名称
          brand: firstRow.brand, // 品牌
          productStatus: firstRow.cp_status, // 产品状态
          sellStatus: firstRow.ks_status, // 可售状态
          productCategory: firstRow.fl, // 产品分类
          cjr: firstRow.cjr, // 创建人
          createTime: firstRow.createTime ?? firstRow.create_time, // 创建时间
          customerType: firstRow.lx, // 客户类型
        } as Record<string, any>;

        editingId.value = formValues.id as string | number | undefined;

        await baseFormApi?.setValues?.(formValues);
        await categoryFormApi?.setValues?.(formValues);
        await applicationFormApi?.setValues?.(formValues);
        await otherInfoFormApi?.setValues?.(formValues);

        // 确保编辑初始状态也触发一次联动（例如根据产品状态自动改可售状态等）
        if (formValues.productStatus) {
          await executeFieldLinkage('basic', 'productStatus', formValues.productStatus);
        }
      }
    } catch (e: any) {
      message.error(e?.message || '加载编辑数据失败');
    }
  }
});
</script>

<template>
  <div class="p-5 bg-white">
    <div class="mb-4 text-base font-semibold">
      {{ isEdit ? '产品分类-编辑' : '产品分类-新增' }}
    </div>
    <div class="mb-4 flex items-center">
      <span class="mr-2 text-sm">语言：</span>
      <Select v-model:value="languageValue" :options="languageOptions" class="w-[200px]" placeholder="请选择语言"
        @change="onLanguageChange" />
    </div>

    <template v-if="loading">
      <div class="py-8 text-center text-gray-500">加载表单配置中...</div>
    </template>
    <template v-else>
      <div class="mb-4 mt-2 flex items-center text-sm font-medium">
        <span class="mr-2 h-3 w-1 rounded-sm bg-[#ffb400]" />
        <span>基本信息</span>
      </div>
      <BaseForm />

      <div class="mb-4 mt-6 flex items-center text-sm font-medium">
        <span class="mr-2 h-3 w-1 rounded-sm bg-[#ffb400]" />
        <span>分类属性</span>
      </div>
      <CategoryForm />

      <div class="mb-4 mt-6 flex items-center justify-between text-sm font-medium">
        <div class="flex items-center">
          <span class="mr-2 h-3 w-1 rounded-sm bg-[#ffb400]" />
          <span>应用信息</span>
        </div>
        <Button type="text" @click="handleAddApplicationRow">添加应用信息</Button>
      </div>
      <ApplicationForm />

      <div class="mb-4 mt-6 flex items-center text-sm font-medium">
        <span class="mr-2 h-3 w-1 rounded-sm bg-[#ffb400]" />
        <span>其他信息</span>
      </div>
      <OtherInfoForm />
    </template>
  </div>
</template>

<style scoped></style>
