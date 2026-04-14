<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm, z } from '#/adapter/form';
import {getUser, getUserId,getDeptTree,userAdd,userEdit } from '#/api';

const data = ref();
const title = ref<string>();
const postsArr = ref<{label:string,value:number}[]>([]);
const rolesArr = ref<{label:string,value:number}[]>([]);
// 获取用户和角色信息
const getRoleInfoList=async()=> {
    let res
    if(data.value.title=='用户新增'){
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
      title.value = data.value?.title ;
      getRoleInfoList()
      formApi.setValues({
        ...data.value,
      });
      const isAdd = data.value.title === '用户新增';
      formApi.updateSchema([
        {
          fieldName: 'userName',
          disabled: !isAdd,
          rules: isAdd ? 'required' : undefined,
        },
        {
          fieldName: 'password',
          disabled: !isAdd,
          rules: isAdd ? 'required' : undefined,
        },
      ]);
      modalApi.setState({ loading: false });
    }
  },
});
const onSubmit=async(values: Record<string, any>) => {
  modalApi.lock();
  let res
  if(data.value.title=='用户新增'){
      res=await userAdd(values);
    }else{
      values.userId=data.value.userId
      res=await userEdit(values);
    }
  if(res.code==200){
    message.success('操作成功');
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
        placeholder: '请输入',
      },
      fieldName: 'nickName',
      label: '用户昵称',
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
      label: '归属部门',
    },
  
    {
      component: 'InputNumber',
      componentProps: {},
      fieldName: 'phonenumber',
      label: '手机号码',
      // 已取消必填与格式校验，由后端兜底
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
      // 已取消必填与格式校验，由后端兜底
    },
     {
      component: 'Input',
      fieldName: 'userName',
      label: '用户名称',
      componentProps: {
        autocomplete: 'new-password',
        name: 'new-username',
      },
    },
    {
      component: 'InputPassword',
      fieldName: 'password',
      label: '用户密码',
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
            label: '男',
            value: '0',
          },
          {
            label: '女',
            value: '1',
          }, 
          {
            label: '未知',
            value: '2',
          },
        ],
     },
      fieldName: 'sex',
      label: '用户性别',
      // rules: 'required',
    },
     {
    component: 'RadioGroup',
      componentProps: {
        options: [
          {
            label: '正常',
            value: '0',
          },
          {
            label: '停用',
            value: '1',
          },
        ],
      },
      fieldName: 'status',
      label: '状态',
    },
     {
      component: 'Select',
      componentProps: {
        placeholder: '请输入',
        options: postsArr,
        mode: 'multiple',
      },
   
      fieldName: 'postIds',
      label: '岗位',
      // rules: 'required',
    },
     {
      component: 'Select',
     componentProps: {
        placeholder: '请输入',
        options: rolesArr,
        mode: 'multiple',
      },
      fieldName: 'roleIds',
      label: '角色',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入',
      },
       formItemClass: 'col-span-2 items-baseline',
      fieldName: 'remarks',
      label: '备注',
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
