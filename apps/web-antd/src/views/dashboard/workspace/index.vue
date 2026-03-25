<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { $t } from '@vben/locales';
import { openWindow } from '@vben/utils';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();
const router = useRouter();

const projectItems = computed<WorkbenchProjectItem[]>(() => [
  {
    color: '',
    content: $t('page.workspace.projectItems.github.content'),
    date: '2021-04-01',
    group: $t('page.workspace.projectItems.github.group'),
    icon: 'carbon:logo-github',
    title: 'Github',
    url: 'https://github.com',
  },
  {
    color: '#3fb27f',
    content: $t('page.workspace.projectItems.vue.content'),
    date: '2021-04-01',
    group: $t('page.workspace.projectItems.vue.group'),
    icon: 'ion:logo-vue',
    title: 'Vue',
    url: 'https://vuejs.org',
  },
  {
    color: '#e18525',
    content: $t('page.workspace.projectItems.html5.content'),
    date: '2021-04-01',
    group: $t('page.workspace.projectItems.html5.group'),
    icon: 'ion:logo-html5',
    title: 'Html5',
    url: 'https://developer.mozilla.org/zh-CN/docs/Web/HTML',
  },
  {
    color: '#bf0c2c',
    content: $t('page.workspace.projectItems.angular.content'),
    date: '2021-04-01',
    group: $t('page.workspace.projectItems.angular.group'),
    icon: 'ion:logo-angular',
    title: 'Angular',
    url: 'https://angular.io',
  },
  {
    color: '#00d8ff',
    content: $t('page.workspace.projectItems.react.content'),
    date: '2021-04-01',
    group: $t('page.workspace.projectItems.react.group'),
    icon: 'bx:bxl-react',
    title: 'React',
    url: 'https://reactjs.org',
  },
  {
    color: '#EBD94E',
    content: $t('page.workspace.projectItems.javascript.content'),
    date: '2021-04-01',
    group: $t('page.workspace.projectItems.javascript.group'),
    icon: 'ion:logo-javascript',
    title: 'Js',
    url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript',
  },
]);

const quickNavItems = computed<WorkbenchQuickNavItem[]>(() => [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: $t('page.workspace.nav.home'),
    url: '/',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:grid-outline',
    title: $t('page.workspace.nav.dashboard'),
    url: '/dashboard',
  },
  {
    color: '#e18525',
    icon: 'ion:layers-outline',
    title: $t('page.workspace.component'),
    url: '/demos/features/icons',
  },
  {
    color: '#3fb27f',
    icon: 'ion:settings-outline',
    title: $t('page.workspace.systemManagement'),
    url: '/demos/features/login-expired',
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:key-outline',
    title: $t('page.workspace.permissionManagement'),
    url: '/demos/access/page-control',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: $t('page.workspace.chart'),
    url: '/analytics',
  },
]);

const todoItems = computed<WorkbenchTodoItem[]>(() => [
  {
    completed: false,
    content: $t('page.workspace.todo.codeReview.content'),
    date: '2024-07-30 11:00:00',
    title: $t('page.workspace.todo.codeReview.title'),
  },
  {
    completed: true,
    content: $t('page.workspace.todo.performance.content'),
    date: '2024-07-30 11:00:00',
    title: $t('page.workspace.todo.performance.title'),
  },
  {
    completed: false,
    content: $t('page.workspace.todo.security.content'),
    date: '2024-07-30 11:00:00',
    title: $t('page.workspace.todo.security.title'),
  },
  {
    completed: false,
    content: $t('page.workspace.todo.updateDeps.content'),
    date: '2024-07-30 11:00:00',
    title: $t('page.workspace.todo.updateDeps.title'),
  },
  {
    completed: false,
    content: $t('page.workspace.todo.fixUI.content'),
    date: '2024-07-30 11:00:00',
    title: $t('page.workspace.todo.fixUI.title'),
  },
]);

const trendItems = computed<WorkbenchTrendItem[]>(() => [
  {
    avatar: 'svg:avatar-1',
    content: $t('page.workspace.trend.vue.content'),
    date: $t('page.workspace.trend.vue.date'),
    title: $t('page.workspace.trend.vue.title'),
  },
  {
    avatar: 'svg:avatar-2',
    content: $t('page.workspace.trend.follow.content'),
    date: $t('page.workspace.trend.follow.date'),
    title: $t('page.workspace.trend.follow.title'),
  },
  {
    avatar: 'svg:avatar-3',
    content: $t('page.workspace.trend.post.content'),
    date: $t('page.workspace.trend.post.date'),
    title: $t('page.workspace.trend.post.title'),
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('page.workspace.trend.article.content'),
    date: $t('page.workspace.trend.article.date'),
    title: $t('page.workspace.trend.article.title'),
  },
  {
    avatar: 'svg:avatar-1',
    content: $t('page.workspace.trend.reply.content'),
    date: $t('page.workspace.trend.reply.date'),
    title: $t('page.workspace.trend.reply.title'),
  },
  {
    avatar: 'svg:avatar-2',
    content: $t('page.workspace.trend.close.content'),
    date: $t('page.workspace.trend.close.date'),
    title: $t('page.workspace.trend.close.title'),
  },
  {
    avatar: 'svg:avatar-3',
    content: $t('page.workspace.trend.post2.content'),
    date: $t('page.workspace.trend.post2.date'),
    title: $t('page.workspace.trend.post2.title'),
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('page.workspace.trend.push.content'),
    date: $t('page.workspace.trend.push.date'),
    title: $t('page.workspace.trend.push.title'),
  },
  {
    avatar: 'svg:avatar-4',
    content: $t('page.workspace.trend.article2.content'),
    date: $t('page.workspace.trend.article2.date'),
    title: $t('page.workspace.trend.article2.title'),
  },
]);

function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('http')) {
    openWindow(nav.url);
    return;
  }
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('Navigation failed:', error);
    });
  } else {
    console.warn(`Unknown URL for navigation item: ${nav.title} -> ${nav.url}`);
  }
}
</script>

<template>
  <div class="p-5" style="">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        {{ $t('page.workspace.greeting', { name: userStore.userInfo?.realName || '' }) }}
      </template>
      <template #description> {{ $t('page.workspace.weather') }} </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject :items="projectItems" :title="$t('page.workspace.project')" @click="navTo" />
        <WorkbenchTrends :items="trendItems" class="mt-5" :title="$t('page.workspace.trends')" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          :title="$t('page.workspace.quickNav')"
          @click="navTo"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" :title="$t('page.workspace.todoList')" />
        <AnalysisChartCard class="mt-5" :title="$t('page.dashboard.visitSource')">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
