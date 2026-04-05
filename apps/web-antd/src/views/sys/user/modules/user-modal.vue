<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import {
  Form,
  FormItem,
  Input,
  Modal,
  Switch,
  Textarea,
  Select,
  SelectOption,
  TreeSelect,
  message,
} from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue/es/form';

import {
  createUser,
  updateUser,
  getUserWithRoles,
  getAllRoles,
  getDeptTree,
  type SysUserResult,
  type RoleResult,
  type DeptResult,
} from '#/api/sys/user';

const props = defineProps<{
  userId?: number;
}>();

const emit = defineEmits<{
  success: [];
  cancel: [];
}>();

const visible = defineModel<boolean>('open', { required: true });

const formRef = ref<FormInstance>();
const loading = ref(false);
const isEdit = computed(() => !!props.userId);
const rolesOptions = ref<RoleResult[]>([]);
const deptTreeData = ref<DeptResult[]>([]);
const selectedRoleIds = ref<number[]>([]);

const modalTitle = computed(() =>
  isEdit.value ? '编辑用户' : '新增用户'
);

const formData = reactive<Record<string, any>>({
  user_id: undefined,
  user_name: '',
  nick_name: '',
  dept_id: undefined,
  email: '',
  phonenumber: '',
  sex: '0',
  status: '0',
  role_ids: [],
  remark: '',
});

const formRules = {
  user_name: [
    { required: true, message: '请输入用户账号', trigger: 'blur' },
    { max: 30, message: '用户账号最多30个字符', trigger: 'blur' },
  ],
  nick_name: [
    { required: true, message: '请输入用户姓名', trigger: 'blur' },
    { max: 30, message: '用户姓名最多30个字符', trigger: 'blur' },
  ],
  status: [
    { required: true, message: '请选择账号状态', trigger: 'change' },
  ],
};

// 加载角色列表
async function loadRoles() {
  try {
    rolesOptions.value = await getAllRoles();
  } catch {
    message.error('加载角色列表失败');
  }
}

// 加载部门树
async function loadDepts() {
  try {
    deptTreeData.value = await getDeptTree();
  } catch {
    message.error('加载部门列表失败');
  }
}

// 加载用户详情
async function loadDetail(id: number) {
  try {
    const res = await getUserWithRoles(id);
    Object.assign(formData, {
      user_id: res.userId || res.user_id,
      user_name: res.userName || res.user_name,
      nick_name: res.nickName || res.nick_name,
      dept_id: res.deptId || res.dept_id,
      email: res.email || '',
      phonenumber: res.phonenumber || res.phonenumber || '',
      sex: String(res.sex ?? '0'),
      status: String(res.status ?? '0'),
      remark: res.remark || '',
    });
    // 处理角色
    if (res.roles && Array.isArray(res.roles)) {
      selectedRoleIds.value = res.roles.map((r: any) => r.roleId || r.roleId);
      formData.role_ids = [...selectedRoleIds.value];
    } else if (res.roleIds && Array.isArray(res.roleIds)) {
      selectedRoleIds.value = res.roleIds;
      formData.role_ids = [...selectedRoleIds.value];
    }
  } catch {
    message.error('加载用户详情失败');
  }
}

// 打开弹窗
const open = async (id?: number) => {
  visible.value = true;
  resetForm();
  await Promise.all([loadRoles(), loadDepts()]);
  if (id) {
    await loadDetail(id);
  }
};

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    const submitData = {
      ...formData,
      role_ids: selectedRoleIds.value,
    };

    if (isEdit.value) {
      await updateUser(submitData);
      message.success('更新成功');
    } else {
      await createUser(submitData);
      message.success('创建成功');
    }

    visible.value = false;
    emit('success');
  } catch (error: any) {
    if (error?.errorFields) {
      // 表单验证失败
    } else {
      message.error(error?.message || '操作失败');
    }
  } finally {
    loading.value = false;
  }
};

// 取消
const handleCancel = () => {
  visible.value = false;
  resetForm();
  emit('cancel');
};

// 重置表单
const resetForm = () => {
  formData.user_id = undefined;
  formData.user_name = '';
  formData.nick_name = '';
  formData.dept_id = undefined;
  formData.email = '';
  formData.phonenumber = '';
  formData.sex = '0';
  formData.status = '0';
  formData.role_ids = [];
  formData.remark = '';
  selectedRoleIds.value = [];
  formRef.value?.resetFields();
};

// 监听角色选择变化
watch(selectedRoleIds, (val) => {
  formData.role_ids = val;
});

// 暴露方法
defineExpose({
  open,
});
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="modalTitle"
    :confirm-loading="loading"
    width="680px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
    >
      <FormItem label="用户账号" name="user_name">
        <Input
          v-model:value="formData.user_name"
          placeholder="请输入用户账号"
          :maxlength="30"
          :disabled="isEdit"
        />
      </FormItem>

      <FormItem label="用户姓名" name="nick_name">
        <Input
          v-model:value="formData.nick_name"
          placeholder="请输入用户姓名"
          :maxlength="30"
        />
      </FormItem>

      <FormItem label="所属部门" name="dept_id">
        <TreeSelect
          v-model:value="formData.dept_id"
          :tree-data="deptTreeData"
          placeholder="请选择所属部门"
          allow-clear
          tree-default-expand-all
          :field-names="{ label: 'deptName', value: 'deptId', children: 'children' }"
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="手机号码">
        <Input
          v-model:value="formData.phonenumber"
          placeholder="请输入手机号码"
          :maxlength="11"
        />
      </FormItem>

      <FormItem label="用户邮箱">
        <Input
          v-model:value="formData.email"
          placeholder="请输入用户邮箱"
          :maxlength="50"
        />
      </FormItem>

      <FormItem label="用户性别" name="sex">
        <Select v-model:value="formData.sex" placeholder="请选择性别">
          <SelectOption value="0">男</SelectOption>
          <SelectOption value="1">女</SelectOption>
          <SelectOption value="2">未知</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="账号状态" name="status">
        <Switch
          v-model:checked="formData.status"
          checked-value="0"
          un-checked-value="1"
          checked-children="启用"
          un-checked-children="停用"
        />
      </FormItem>

      <FormItem label="分配角色">
        <Select
          v-model:value="selectedRoleIds"
          mode="multiple"
          placeholder="请选择角色"
          :options="rolesOptions.map(r => ({ label: r.roleName, value: r.roleId }))"
          :field-names="{ label: 'roleName', value: 'roleId' }"
          allow-clear
          style="width: 100%"
        />
      </FormItem>

      <FormItem label="备注">
        <Textarea
          v-model:value="formData.remark"
          placeholder="请输入备注"
          :rows="3"
          :maxlength="500"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
