<script lang="ts" setup>
import { computed } from 'vue';
import { RouterView } from 'vue-router';

import { preferences } from '@vben/preferences';

import loginBg from '#/assets/login.png';


</script>

<template>
  <div class="login-page">
    <div class="login-left">
      <img :src="loginBg" alt="login background" class="login-left-bg" />
    </div>
    <div class="login-right">
      <div class="login-panel">
        <div class="login-form-wrapper">
          <RouterView />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f5f7;
}

.login-left {
  flex: 1.4;
  min-width: 0;
}

.login-left-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.login-right {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.login-panel {
  width: 360px;
  max-width: 90%;
}

.login-header {
  margin-bottom: 32px;
}

.login-app-name {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #222222;
}

.login-form-wrapper {
  background-color: transparent;
}
</style>
