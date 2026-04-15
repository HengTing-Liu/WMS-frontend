<template>
  <Drawer
    :title="`按钮管理 - ${parentName}`"
    v-model:open="visible"
    width="700px"
    :body-style="{ padding: 0 }"
    :footer-style="{ textAlign: 'right' }"
    @close="handleClose"
  >
    <div class="p-4">
      <div class="mb-4 flex items-center justify-between">
        <span class="text-sm text-gray-500">管理当前菜单下的按钮权限</span>
        <Button type="primary" @click="handleAdd">新增按钮</Button>
      </div>

      <Table :columns="columns" :data-source="buttonList" :loading="loading" row-key="menuId" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === '0' ? 'processing' : 'default'">
              {{ record.status === '0' ? '正常' : '停用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <span class="flex items-center gap-2">
              <Button type="link" class="p-0" @click="handleEdit(record)">编辑</Button>
              <Popconfirm title="是否确认删除该按钮？" ok-text="确认" cancel-text="取消" @confirm="handleDelete(record)">
                <Button type="link" danger class="p-0">删除</Button>
              </Popconfirm>
            </span>
          </template>
        </template>
      </Table>
    </div>

    <Modal
      :title="isEdit ? '编辑按钮' : '新增按钮'"
      v-model:open="modalVisible"
      :confirm-loading="submitting"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
      width="520px"
    >
      <Form ref="formRef" :model="formData" :rules="rules" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <FormItem label="按钮名称" name="menuName">
          <AutoComplete
            v-model:value="formData.menuName"
            :options="buttonNameOptions.map((v) => ({ value: v }))"
            placeholder="例如：新增，支持自定义输入"
            allow-clear
            @select="handleMenuNameSelect"
            @change="handleMenuNameChange"
          />
        </FormItem>
        <FormItem label="权限标识" name="perms">
          <Input v-model:value="formData.perms" placeholder="例如：system:user:add" />
        </FormItem>
        <FormItem label="显示排序" name="orderNum">
          <InputNumber v-model:value="formData.orderNum" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="状态" name="status">
          <RadioGroup v-model:value="formData.status">
            <Radio value="0">正常</Radio>
            <Radio value="1">停用</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Modal>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Drawer, Table, Button, Tag, Popconfirm, Modal, Form, FormItem, Input, InputNumber, RadioGroup, Radio, AutoComplete, message } from 'ant-design-vue';
import { getButtonList, addMenu, updateMenu, deleteMenu, type MenuItem } from '#/api';

const visible = ref(false);
const loading = ref(false);
const parentId = ref<number>(0);
const parentName = ref('');
const parentPerms = ref('');
const permPrefix = ref('');
const buttonList = ref<MenuItem[]>([]);

const buttonNameOptions = ['新增', '编辑', '删除', '查询', '导出', '导入'];
const buttonNameToSuffix: Record<string, string> = {
  新增: 'add',
  编辑: 'edit',
  删除: 'delete',
  查询: 'query',
  导出: 'export',
  导入: 'import',
};

function getPermPrefix(perms?: string) {
  if (!perms) return '';
  return perms.split(':').slice(0, 2).join(':');
}

const columns = [
  { title: '按钮名称', dataIndex: 'menuName', key: 'menuName' },
  { title: '权限标识', dataIndex: 'perms', key: 'perms' },
  { title: '排序', dataIndex: 'orderNum', key: 'orderNum', width: 80, align: 'center' as const },
  { title: '状态', key: 'status', width: 80, align: 'center' as const },
  { title: '操作', key: 'action', width: 120, align: 'center' as const },
];

const emit = defineEmits<{
  (e: 'success'): void;
}>();

async function loadButtons() {
  loading.value = true;
  try {
    const res = (await getButtonList(parentId.value)) as any;
    const list: MenuItem[] = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.rows)
        ? res.data.rows
        : Array.isArray(res?.rows)
          ? res.rows
          : Array.isArray(res)
            ? res
            : [];
    buttonList.value = list ?? [];
  } catch (e: any) {
    message.error(e?.message ?? '加载失败');
  } finally {
    loading.value = false;
  }
}

const open = async (row: MenuItem) => {
  parentId.value = row.menuId;
  parentName.value = row.menuName;
  parentPerms.value = row.perms || '';
  permPrefix.value = getPermPrefix(row.perms);
  visible.value = true;
  await loadButtons();
};

const handleClose = () => {
  buttonList.value = [];
};

// Modal
const modalVisible = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const formRef = ref();
const formData = reactive({
  menuId: undefined as number | undefined,
  menuName: '',
  perms: '',
  orderNum: 0,
  status: '0',
});

const rules = computed(() => ({
  menuName: [{ required: true, message: '请输入按钮名称', trigger: 'blur' }],
  perms: [{ required: true, message: '请输入权限标识', trigger: 'blur' }],
  orderNum: [{ required: true, message: '请输入排序', trigger: 'blur', type: 'number' as const }],
}));

function resetForm() {
  formData.menuId = undefined;
  formData.menuName = '';
  formData.perms = '';
  formData.orderNum = 0;
  formData.status = '0';
}

const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  modalVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
};

function fillPerm(name: string) {
  if (!permPrefix.value) return;
  const suffix = buttonNameToSuffix[name];
  if (suffix) {
    formData.perms = `${permPrefix.value}:${suffix}`;
  } else if (name) {
    // 自定义：如果当前权限标识为空或是内置生成的，则自动补上前缀
    const builtInPerm = Object.values(buttonNameToSuffix).some((s) => formData.perms === `${permPrefix.value}:${s}`);
    if (!formData.perms || builtInPerm) {
      formData.perms = `${permPrefix.value}:`;
    }
  }
}

const handleMenuNameSelect = (val: string) => {
  fillPerm(val);
};

const handleMenuNameChange = (val: string) => {
  if (buttonNameToSuffix[val]) {
    fillPerm(val);
  }
};

const handleEdit = (record: MenuItem) => {
  isEdit.value = true;
  resetForm();
  formData.menuId = record.menuId;
  formData.menuName = record.menuName;
  formData.perms = record.perms;
  formData.orderNum = record.orderNum ?? 0;
  formData.status = record.status ?? '0';
  modalVisible.value = true;
  setTimeout(() => formRef.value?.clearValidate(), 0);
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    const payload = {
      ...formData,
      parentId: parentId.value,
      menuType: 'F',
      icon: '#',
      path: '',
      component: '',
      visible: '0',
      isFrame: '1',
      isCache: '0',
      query: '',
      routeName: '',
    };

    if (isEdit.value) {
      await updateMenu(payload);
      message.success('修改成功');
    } else {
      await addMenu(payload);
      message.success('新增成功');
    }

    modalVisible.value = false;
    await loadButtons();
    emit('success');
  } catch (e: any) {
    if (e?.errorFields) return;
    message.error(isEdit.value ? '修改失败' : '新增失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (record: MenuItem) => {
  try {
    const res = (await deleteMenu(record.menuId)) as { code?: number; msg?: string };
    if (res?.code === 200) {
      message.success(res?.msg ?? '删除成功');
      await loadButtons();
      emit('success');
    } else {
      message.error(res?.msg ?? '删除失败');
    }
  } catch (e: any) {
    message.error(e?.message ?? '删除失败');
  }
};

defineExpose({ open });
</script>
