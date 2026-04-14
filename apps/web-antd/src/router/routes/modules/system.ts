import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      order: 1000,
      title: '绯荤粺璁剧疆',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        meta: {
          title: '鐢ㄦ埛绠＄悊',
        },
        name: 'User',
        path: '/user',
        component: () => import('#/views/system/user/index.vue'),
      },
      {
        meta: {
          title: '瑙掕壊绠＄悊',
        },
        name: 'RoleManager',
        path: '/role',
        component: () => import('#/views/system/role/index.vue'),
      },
      {
        meta: {
          title: '閮ㄩ棬绠＄悊',
        },
        name: 'DepartmentManager',
        path: '/dept',
        component: () => import('#/views/system/dept/index.vue'),
      },
      {
        meta: {
          title: '鑿滃崟绠＄悊',
        },
        name: 'Management',
        path: '/menu',
        component: () => import('#/views/system/menu/index.vue'),
      },
      {
        meta: {
          title: '鏉冮檺绠＄悊',
        },
        name: 'SysPermission',
        path: '/permission',
        component: () => import('#/views/system/permission/index.vue'),
      },
      {
        meta: {
          title: '低代码管理',
        },
        name: 'LowcodeManager',
        path: '/lowcode',
        children: [
          {
            meta: { title: '琛ㄥ厓鏁版嵁' },
            name: 'TableMeta',
            path: 'table',
            component: () => import('#/views/system/tableMeta/index.vue'),
          },
          {
            meta: { title: '字段元数据' },
            name: 'ColumnMeta',
            path: 'column',
            component: () => import('#/views/system/columnMeta/index.vue'),
          },
          {
            meta: { title: '分组元数据' },
            name: 'GroupMeta',
            path: 'group',
            component: () => import('#/views/system/groupMeta/index.vue'),
          },
          {
            meta: { title: '操作元数据' },
            name: 'OperationMeta',
            path: 'operation',
            component: () => import('#/views/system/operationMeta/index.vue'),
          },
          {
            meta: { title: '鍙戝竷绠＄悊' },
            name: 'MetaPublish',
            path: 'publish',
            component: () => import('#/views/system/metaPublish/index.vue'),
          },

        ],
      },
      {
        meta: {
          title: '鏃ュ織绠＄悊',
        },
        name: 'LogManager',
        path: '/log',
        children: [
          {
            meta: {
              title: '鎿嶄綔鏃ュ織',
            },
            name: 'OperLog',
            path: '/log/oper',
            component: () => import('#/views/system/operlog/index.vue'),
          },
          {
            meta: {
              title: '鐧诲綍鏃ュ織',
            },
            name: 'LoginLog',
            path: '/log/login',
            component: () => import('#/views/system/logininfor/index.vue'),
          },
        ],
      },
      {
        meta: {
          hideInMenu: true,
          title: '鏁版嵁鏉冮檺',
        },
        name: 'RoleDataScope',
        path: '/role/dataScope/:roleId',
        component: () => import('#/views/system/roleManager/dataScope.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          ignoreAccess: true,
          title: '鍒嗛厤鐢ㄦ埛',
        },
        name: 'RoleAssignUser',
        path: '/role/assignUser/:roleId',
        component: () => import('#/views/system/roleManager/assignUser.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '鍒嗛厤瑙掕壊',
        },
        name: 'UserAssignRole',
        path: '/user/assignRole/:userId',
        component: () => import('#/views/system/user/assignRole.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '浜у搧鍒嗙被',
        },
        name: 'ProductCategory',
        path: '/productCategory',
        component: () => import('#/views/system/productCategory/index.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '浜у搧鍒嗙被-鏂板',
        },
        name: 'ProductCategoryAdd',
        path: 'productCategory/add',
        component: () => import('#/views/system/productCategory/add.vue'),
      },
      {
        meta: {
          hideInMenu: true,
          title: '娴嬭瘯鏁版嵁',
        },
        name: 'Testing',
        path: '/Testing',
        component: () => import('#/views/system/Testing/index.vue'),
      },
    ],
  },
];

export default routes;


