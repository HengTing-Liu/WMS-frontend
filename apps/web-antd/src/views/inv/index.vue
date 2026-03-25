<template>
  <Page auto-content-height :title="$t('page.inv.title')">
    <div class="inv-dashboard">
      <Row :gutter="16">
        <Col :span="6">
          <Card hoverable @click="$router.push('/inv/qrcode-detail')">
            <div class="stat-card">
              <div class="icon-wrapper blue">
                <IconifyIcon icon="material-symbols:qr-code" class="icon" />
              </div>
              <div class="content">
                <div class="title">{{ $t('page.inv.qrcodeDetail.title') }}</div>
                <div class="desc">{{ $t('page.inv.qrcodeDetail.desc') }}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { Page } from '@vben/common-ui';
import { Card, Col, Row } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
</script>

<style scoped lang="less">
.inv-dashboard {
  padding: 16px;

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;

    .icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.blue {
        background: #e6f4ff;
        color: #1677ff;
      }

      &.green {
        background: #f6ffed;
        color: #52c41a;
      }

      &.orange {
        background: #fff7e6;
        color: #fa8c16;
      }

      &.purple {
        background: #f9f0ff;
        color: #722ed1;
      }

      .icon {
        font-size: 32px;
      }
    }

    .content {
      flex: 1;
      min-width: 0;

      .title {
        font-size: 16px;
        font-weight: 500;
        color: #1f1f1f;
        margin-bottom: 4px;
      }

      .desc {
        font-size: 13px;
        color: #666;
      }
    }
  }
}
</style>
