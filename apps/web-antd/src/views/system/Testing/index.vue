<template>
    <div class="p-5 bg-white">
        <Form />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
// 按你的要求，这两行保持不变，从 #/api 聚合导出中拿方法和类型
import { getTestFieldList } from '#/api';
import type { TestingApi } from '#/api';

type FieldItem = TestingApi.FieldItem;

// 用 ref 来持有 schema，直接改 ref 才能真正新增字段
const schemaRef = ref<any[]>([]);

// 1. 创建一个表单，把 schemaRef 传进去
const [Form, formApi] = useVbenForm({
    handleSubmit: async (values: Record<string, any>) => {
        console.log('提交值:', values);
        message.success('已提交，控制台查看数据');
    },
    commonConfig: {
        componentProps: { class: 'w-full' },
    },
    showDefaultActions: true,
    wrapperClass: 'grid-cols-1 md:grid-cols-2',
    schema: schemaRef as any,
});

// 2. 把后端 data 映射成 schema
function fieldsToSchema(fields: FieldItem[]) {
    // console.log(fields, 44444444);
    return fields.map((item) => {
        // console.log(item, 55555555);
        const base: any = {
            component: item.component,
            fieldName: item.field, // name / age / sex
            label: item.label,
            formItemClass: 'col-span-1',
            componentProps: {
                disabled: item.disabled,
                placeholder: `请输入/选择${item.label}`,
            },
        };
        // console.log(base, 66666666);
        if (item.component === 'Select' && item.options) {
            base.componentProps = {
                ...base.componentProps,
                options: item.options,
            };
        }
        // console.log(base, 77777777);
        return base;
    });
}

// 3. 真实接口请求 + 渲染
async function loadSchema() {
    try {
        const res = await getTestFieldList();
        // console.log(res, 11111111);
        if (res.code !== 200) {
          message.error(res.msg || '接口请求失败');
          return;
        }

        const fields = Array.isArray(res.data) ? (res.data as FieldItem[]) : [];
        // console.log(fields, 22222222);
        if (!fields.length) {
            message.warning('接口未返回表单字段');
            return;
        }

        const schema = fieldsToSchema(fields);
        // console.log(schema, '33333333最终的schema');
        // 直接替换 schemaRef，表单会自动重新渲染
        schemaRef.value = schema;

        const defaults: Record<string, any> = {};
        fields.forEach((f) => {
            if (f.defaultValue !== undefined) {
                defaults[f.field] = f.defaultValue;
            }
        });
        if (Object.keys(defaults).length && formApi.setValues) {
            await formApi.setValues(defaults);
        }
    } catch (e: any) {
        console.error('加载表单失败:', e);
        message.error(e?.message ?? '加载表单失败');
    }
}

onMounted(() => {
    loadSchema();
});
</script>

<style scoped>
:deep(.ant-form-item) {
    margin-bottom: 16px;
}
</style>