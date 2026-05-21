<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { addDept, editDept } from '#/api';
import { getDeptTree } from '#/api/system/dept';
import type { DeptApi, DeptSaveBody } from '#/api';

type DeptTreeNode = DeptApi.DeptTreeNode;

const data = ref<{
  record?: DeptTreeNode;
  onSuccess?: () => void;
}>();
const title = ref('');
const deptTreeOptions = ref<DeptTreeNode[]>([]);

const isEdit = computed(() => !!data.value?.record);

/** 转为 TreeSelect 所需格式：兼容若依 treeselect {id,label} 与低代码 {deptId,deptName} */
function toTreeSelectData(nodes: any[]): { title: string; value: number; children?: any[] }[] {
  return nodes.map((node: any) => ({
    title: node.deptName ?? node.label ?? '',
    value: node.deptId ?? node.id ?? 0,
    children: node.children?.length ? toTreeSelectData(node.children) : undefined,
  }));
}

/** 上级部门树形下拉数据 */
const parentDeptTreeData = computed(() => toTreeSelectData(deptTreeOptions.value));

const [Modal, modalApi] = useVbenModal({
  footerClass: 'justify-center',
  showCancelButton: true,
  showConfirmButton: true,
  openAutoFocus: false,
  destroyOnClose: true,
  centered: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await formApi.validateAndSubmitForm();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<{ record?: DeptTreeNode; onSuccess?: () => void }>();
    data.value = payload ?? undefined;
    title.value = isEdit.value ? '修改部门' : '新增部门';
    const record = data.value?.record;

    // 自获取部门树，用于上级部门下拉
    getDeptTree()
      .then((treeRes: any) => {
        deptTreeOptions.value = Array.isArray(treeRes)
          ? treeRes
          : Array.isArray(treeRes?.data)
            ? treeRes.data
            : [];
      })
      .catch(() => {
        deptTreeOptions.value = [];
      })
      .finally(() => {
        formApi.resetForm();
      if (record) {
        formApi.setValues({
          parentId: record.parentId ?? 0,
          deptName: record.deptName,
          deptCategory: record.deptCategory ?? '',
          orderNum: record.orderNum,
          leader: record.leader,
          phone: record.phone,
          email: record.email,
          status: record.status ?? '0',
          remarks: record.remarks ?? '',
        });
      } else {
        formApi.setValues({ parentId: undefined, orderNum: 0, status: '0' });
      }

      formApi.updateSchema?.([
        {
          component: 'TreeSelect' as const,
          fieldName: 'parentId',
          label: '上级部门',
          componentProps: {
            treeData: parentDeptTreeData.value,
            placeholder: '请选择上级部门',
            class: 'w-full',
            showSearch: true,
            treeNodeFilterProp: 'title',
            allowClear: true,
            treeDefaultExpandAll: true,
          },
        },
        {
          component: 'Input',
          fieldName: 'deptName',
          label: '部门名称',
          rules: 'required',
          componentProps: { placeholder: '请输入部门名称' },
        },
        {
          component: 'Input',
          fieldName: 'deptCategory',
          label: '部门分类',
          componentProps: { placeholder: '请输入部门分类' },
        },
        {
          component: 'InputNumber',
          fieldName: 'orderNum',
          label: '显示排序',
          componentProps: { min: 0, placeholder: '0' },
        },
        { component: 'Input', fieldName: 'leader', label: '负责人', componentProps: { placeholder: '请输入负责人' } },
        { component: 'Input', fieldName: 'phone', label: '联系电话', componentProps: { placeholder: '请输入联系电话' } },
        { component: 'Input', fieldName: 'email', label: '邮箱', componentProps: { placeholder: '请输入邮箱' } },
        {
          component: 'Select',
          fieldName: 'status',
          label: '状态',
          componentProps: {
            options: [
              { label: '正常', value: '0' },
              { label: '停用', value: '1' },
            ],
            placeholder: '请选择',
          },
        },
      ]);
    });
  },
});

const onSubmit = async (values: Record<string, any>) => {
  modalApi.lock();
  try {
    const parentId = isEdit.value
      ? (data.value?.record?.parentId ?? 0)
      : Number(values.parentId) ?? 0;
    const body: DeptSaveBody = {
      parentId: Number(parentId) || 0,
      deptName: values.deptName,
      deptFullPath: values.deptFullPath || undefined,
      deptCategory: values.deptCategory || undefined,
      orderNum: Number(values.orderNum) ?? 0,
      leader: values.leader || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      status: values.status ?? '0',
      remarks: values.remarks || undefined,
    };
    if (isEdit.value && data.value?.record) {
      body.deptId = data.value.record.deptId;
    }
    const res = (await (isEdit.value ? editDept(body) : addDept(body))) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '操作成功');
      data.value?.onSuccess?.();
      modalApi.close();
    } else {
      message.error(res?.msg ?? '操作失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '操作失败');
  } finally {
    modalApi.unlock();
  }
};

defineExpose({ modalApi });

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  commonConfig: { componentProps: { class: 'w-full' } },
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  schema: [
    {
      component: 'TreeSelect',
      fieldName: 'parentId',
      label: '上级部门',
      componentProps: {
        treeData: [],
        placeholder: '请选择上级部门',
        showSearch: true,
        treeNodeFilterProp: 'title',
        allowClear: true,
        treeDefaultExpandAll: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'deptName',
      label: '部门名称',
      rules: 'required',
      componentProps: { placeholder: '请输入部门名称' },
    },
    {
      component: 'Input',
      fieldName: 'deptCategory',
      label: '部门分类',
      componentProps: { placeholder: '请输入部门分类' },
    },
    {
      component: 'InputNumber',
      fieldName: 'orderNum',
      label: '显示排序',
      componentProps: { min: 0, placeholder: '0' },
    },
    { component: 'Input', fieldName: 'leader', label: '负责人', componentProps: { placeholder: '请输入负责人' } },
    { component: 'Input', fieldName: 'phone', label: '联系电话', componentProps: { placeholder: '请输入联系电话' } },
    { component: 'Input', fieldName: 'email', label: '邮箱', componentProps: { placeholder: '请输入邮箱' } },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        options: [
          { label: '正常', value: '0' },
          { label: '停用', value: '1' },
        ],
        placeholder: '请选择',
      },
    },
  ],
});
</script>

<template>
  <Modal :title="title" class="w-[600px]">
    <Form />
  </Modal>
</template>
