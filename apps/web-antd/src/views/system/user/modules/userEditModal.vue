<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm, z } from '#/adapter/form';
import {getUser, getUserId,userAdd,userEdit, getDeptTree } from '#/api';

const data = ref();
const title = ref<string>();
const postsArr = ref<{label:string,value:number}[]>([]);
const rolesArr = ref<{label:string,value:number}[]>([]);
// 获取用户和角色信息
const getRoleInfoList=async()=> {
    let res
    if(data.value?.isAdd){
       res=await getUser();
    }else{
       res=await getUserId(data.value?.userId);
       formApi.setValues({
       roleIds:res.roleIds || [],
       postIds:res.postIds || [],
      });
    }
    postsArr.value=res.posts?.map((item:{postName:string,postId:number})=>{
      return {
        label: item.postName,
        value: item.postId,
      }
    }) || [];
    rolesArr.value=res.roles?.map((item:{roleName:string,roleId:number})=>{
      return {
        label: item.roleName,
        value: item.roleId,
      }
    }) || [];
}
const [Modal, modalApi] = useVbenModal({
  footerClass: 'justify-center',
  showCancelButton: true,
  showConfirmButton: true,
  openAutoFocus: false,
  draggable: true,
  destroyOnClose:true,
  centered: true,
   fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await formApi.validateAndSubmitForm();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      modalApi.setState({ loading: true });
      data.value = modalApi.getData<Record<string, any>>();
      title.value = data.value?.isAdd ? $t('page.system.user.addTitle') : $t('page.system.user.editTitle'); isAdd.value = data.value?.isAdd ?? false;
      getRoleInfoList()
      formApi.setValues({
        ...data.value,
      });
      formApi.updateSchema([
        {
          disabled: !isAdd.value,
          fieldName: 'userName',
        }, {
          disabled: !isAdd.value,
          fieldName: 'password',
        },
      ]);
      modalApi.setState({ loading: false });
    }
  },
});
const onSubmit=async(values: Record<string, any>) => {
  modalApi.lock();
  let res
  if(data.value?.isAdd){
      res=await userAdd(values);
    }else{
      values.userId=data.value.userId
      res=await userEdit(values);
    }
  if(res.code==200){
    message.success($t('page.message.operationSuccess'));
    data.value?.onSuccess?.();
    modalApi.close();
  }else{
    message.error(res.msg);
  }
    modalApi.unlock();
}
const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  // 所有表单项共用，可单独在表单内覆盖
  commonConfig: {
    componentProps: {
      class: 'w-full',
      autocomplete: 'off',
    },
  },
  showDefaultActions: false,
  schema: [
    {
      // 组件需要在 #/adapter.ts内注册，并加上类型
      component: 'Input',
      componentProps: {
        placeholder: () => $t('page.common.pleaseInput'),
      },
      fieldName: 'nickName',
      label: () => $t('page.system.user.nickName'),
      rules: 'required',
    },
     {
      component: 'ApiTreeSelect',
      componentProps: {
        api: getDeptTree,
        labelField: 'label',
        valueField: 'id',
        childrenField: 'children',
      },
      fieldName: 'deptId',
      label: () => $t('page.common.belongDept'),
    },
  
    {
      component: 'InputNumber',
      componentProps: {
      },
      fieldName: 'phonenumber',
      label: () => $t('page.system.user.phonenumber'),
      rules: z.coerce.string().regex(/^1[3-9]\d{9}$/, { message: $t('page.common.validPhone') }),
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: () => $t('page.common.email'),
      rules: z.string().email({ message: $t('page.common.validEmail') }),
    },
     {
      component: 'Input',
      fieldName: 'userName',
      label: () => $t('page.system.user.userName'),
      componentProps: {
        autocomplete: 'new-password',
        name: 'new-username',
      },
    },
    {
      component: 'InputPassword',
      fieldName: 'password',
      label: () => $t('page.common.userPassword'),
      componentProps: {
        autocomplete: 'new-password',
        name: 'new-password',
      },
    },
     {
      component: 'Select',
      componentProps: {
        options: [
          {
            label: () => $t('page.system.user.sex_0'),
          },
          {
            label: () => $t('page.system.user.sex_1'),
          }, 
          {
            label: () => $t('page.system.user.sex_2'),
          },
        ],
     },
      fieldName: 'sex',
      label: () => $t('page.system.user.sex'),
      // rules: 'required',
    },
     {
    component: 'RadioGroup',
      componentProps: {
        options: [
          {
            label: () => $t('page.system.user.status_0'),
          },
          {
            label: () => $t('page.system.user.status_1'),
          },
        ],
      },
      fieldName: 'status',
      label: () => $t('page.common.status'),
    },
     {
      component: 'Select',
      componentProps: {
        placeholder: () => $t('page.common.pleaseInput'),
        options: postsArr,
        mode: 'multiple',
      },
   
      fieldName: 'postIds',
      label: () => $t('page.common.post'),
      // rules: 'required',
    },
     {
      component: 'Select',
     componentProps: {
        placeholder: () => $t('page.common.pleaseInput'),
        options: rolesArr,
        mode: 'multiple',
      },
      fieldName: 'roleIds',
      label: () => $t('page.common.role'),
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: () => $t('page.common.pleaseInput'),
      },
       formItemClass: 'col-span-2 items-baseline',
      fieldName: 'remark',
      label: () => $t('page.common.remark'),
    },
    
  ],
    // 大屏一行显示3个，中屏一行显示2个，小屏一行显示1个
 wrapperClass: 'grid-cols-1 md:grid-cols-2',
});


</script>
<template>
  <Modal :title="title" class="w-[700px]">
     <div>
       <Form />
     </div>
  </Modal>
</template>
