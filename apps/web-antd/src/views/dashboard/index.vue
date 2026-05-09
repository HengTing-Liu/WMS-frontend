<script lang="ts" setup>
import { Card, Statistic, Row, Col } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
</script>

<template>
  <div class="p-6">
    <!-- 统计卡片 -->
    <Row :gutter="16">
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('page.dashboard.statUserTotal')"
            :value="1128"
            :suffix="$t('page.dashboard.statUserTotalUnit')"
          >
            <template #prefix>
              <IconifyIcon icon="mdi:account" class="text-blue-500" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('page.dashboard.statTodayOrders')"
            :value="93"
            :suffix="$t('page.dashboard.statTodayOrdersUnit')"
          >
            <template #prefix>
              <IconifyIcon icon="mdi:cart" class="text-green-500" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('page.dashboard.statSalesAmount')"
            :value="123456"
            :precision="2"
            :suffix="$t('page.dashboard.statSalesAmountUnit')"
          >
            <template #prefix>
              <IconifyIcon icon="mdi:cash" class="text-yellow-500" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('page.dashboard.statInventoryCount')"
            :value="5678"
            :suffix="$t('page.dashboard.statInventoryCountUnit')"
          >
            <template #prefix>
              <IconifyIcon icon="mdi:package" class="text-purple-500" />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- 欢迎信息 -->
    <Card class="mt-6" :title="$t('page.dashboard.welcomeTitle')">
      <div class="py-4">
        <p class="text-lg"><strong>{{ $t('page.dashboard.systemOverview') }}</strong></p>
        <ul class="list-disc pl-6 mt-2 leading-7">
          <li><strong>{{ $t('page.dashboard.featureUserMgmt') }}</strong> - {{ $t('page.dashboard.featureUserMgmtDesc') }}</li>
          <li><strong>{{ $t('page.dashboard.featureDictMgmt') }}</strong> - {{ $t('page.dashboard.featureDictMgmtDesc') }}</li>
          <li><strong>{{ $t('page.dashboard.featureEnumMgmt') }}</strong> - {{ $t('page.dashboard.featureEnumMgmtDesc') }}</li>
          <li><strong>{{ $t('page.dashboard.featureSerialMgmt') }}</strong> - {{ $t('page.dashboard.featureSerialMgmtDesc') }}</li>
          <li><strong>{{ $t('page.dashboard.featureInboundMgmt') }}</strong> - {{ $t('page.dashboard.featureInboundMgmtDesc') }}</li>
          <li><strong>{{ $t('page.dashboard.featureOutboundMgmt') }}</strong> - {{ $t('page.dashboard.featureOutboundMgmtDesc') }}</li>
          <li><strong>{{ $t('page.dashboard.featureInventoryMgmt') }}</strong> - {{ $t('page.dashboard.featureInventoryMgmtDesc') }}</li>
        </ul>

        <p class="text-lg mt-6"><strong>{{ $t('page.dashboard.quickStart') }}</strong></p>
        <ol class="list-decimal pl-6 mt-2 leading-7">
          <li>{{ $t('page.dashboard.stepConfigBasic') }}</li>
          <li>{{ $t('page.dashboard.stepCreateUser') }}</li>
          <li>{{ $t('page.dashboard.stepConfigSerial') }}</li>
          <li>{{ $t('page.dashboard.stepUseInbound') }}</li>
        </ol>
      </div>
    </Card>

    <!-- 系统信息 -->
    <Card class="mt-6" :title="$t('page.dashboard.systemInfo')">
      <Row :gutter="16">
        <Col :span="8">
          <p><strong>{{ $t('page.dashboard.systemName') }}：</strong>{{ $t('page.dashboard.wmsSystem') }}</p>
        </Col>
        <Col :span="8">
          <p><strong>{{ $t('page.dashboard.systemVersion') }}：</strong>v1.0.0</p>
        </Col>
        <Col :span="8">
          <p><strong>{{ $t('page.dashboard.deployTime') }}：</strong>2026-03-13</p>
        </Col>
      </Row>
    </Card>
  </div>
</template>
