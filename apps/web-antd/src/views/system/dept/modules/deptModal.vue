<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { addDept, editDept } from '#/api';
import type { DeptApi, DeptSaveBody } from '#/api';

type DeptTreeNode = DeptApi.DeptTreeNode;

const data = ref<{
  record?: DeptTreeNode;       // 编辑时的当前部门
  parent?: DeptTreeNode;       // 行内“新增”时的上级部门
  addType?: 'top' | 'row';     // 顶部新增 / 行内新增，用于区分上级部门下拉禁用与否
  deptTreeOptions?: DeptTreeNode[]; // 部门树，弹框内上级部门树形下拉
  onSuccess?: () => void;
}>();
const title = ref('');

const isEdit = computed(() => !!data.value?.record);
/** 顶部新增：上级部门为可操作下拉；行内新增/编辑：上级部门为禁用下拉 */
const isTopLevelAdd = computed(() => data.value?.addType === 'top');

/** 转为 TreeSelect 所需格式：ant-design-vue 默认使用 title / value / children */
function toTreeSelectData(nodes: DeptTreeNode[]): { title: string; value: number; children?: any[] }[] {
  return nodes.map((node) => ({
    title: node.deptName,
    value: node.deptId,
    children: node.children?.length ? toTreeSelectData(node.children) : undefined,
  }));
}

/** 上级部门树形下拉数据 */
const parentDeptTreeData = computed(() => toTreeSelectData(data.value?.deptTreeOptions ?? []));

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
    if (isOpen) {
      const payload = modalApi.getData<{ record?: DeptTreeNode; parent?: DeptTreeNode; addType?: 'top' | 'row'; deptTreeOptions?: DeptTreeNode[]; onSuccess?: () => void }>();
      data.value = payload ?? undefined;
      title.value = isEdit.value ? '修改部门' : '新增部门';
      const record = data.value?.record;
      const parent = data.value?.parent;
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
      } else if (parent) {
        formApi.setValues({ parentId: parent.deptId, orderNum: 0, status: '0' });
      } else {
        formApi.setValues({ parentId: undefined, orderNum: 0, status: '0' });
      }
      // 统一为“上级部门”树形可搜索下拉：顶部新增可操作，行内新增/编辑禁用
      const parentField = {
        component: 'TreeSelect' as const,
        fieldName: 'parentId',
        label: '上级部门',
        componentProps: {
          treeData: parentDeptTreeData.value,
          placeholder: isTopLevelAdd.value ? '请选择上级部门' : '请选择',
          class: 'w-full',
          disabled: !isTopLevelAdd.value,
          showSearch: true,
          treeNodeFilterProp: 'title',
          allowClear: true,
          treeDefaultExpandAll: true,
        },
      };
      formApi.updateSchema?.([
        parentField,
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
        // {
        //   component: 'Textarea',
        //   fieldName: 'remark',
        //   label: '备注',
        //   formItemClass: 'col-span-2',
        //   componentProps: { placeholder: '请输入备注', rows: 3 },
        // },
      ]);
    }
  },
});

const onSubmit = async (values: Record<string, any>) => {
  modalApi.lock();
  try {
    const parentId = isEdit.value
      ? (data.value?.record?.parentId ?? 0)
      : data.value?.parent
        ? data.value.parent.deptId
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
    // {
    //   component: 'Textarea',
    //   fieldName: 'remark',
    //   label: '备注',
    //   formItemClass: 'col-span-2',
    //   componentProps: { placeholder: '请输入备注', rows: 3 },
    // },
  ],
});
</script>

<template>
  <Modal :title="title" class="w-[600px]">
    <Form />
  </Modal>
</template>
