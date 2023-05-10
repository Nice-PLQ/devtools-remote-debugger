<template>
  <section class="main">
    <el-table :data="targets">
      <el-table-column prop="favicon" :label="$t('favicon')">
        <template #default="{ row }">
          <img class="favicon" v-if="row.favicon" :src="row.favicon" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" :label="$t('title')" />
      <el-table-column prop="pageUrl" :label="$t('pageUrl')">
        <template #default="{ row }">
          <a :href="row.pageUrl" target="_blank">{{ row.pageUrl }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="ua" label="UserAgent" />
      <el-table-column prop="time" :label="$t('time')" />
      <el-table-column prop="action" :label="$t('action')">
        <template #header>
          <el-button type="default" round @click="getData">{{ $t('refresh') }}</el-button>
        </template>
        <template #default="{ row }">
          <el-button type="primary" @click="onClick(row.id)">{{ $t('debugBtn') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script>
import uuid from 'string-random';
import dayjs from 'dayjs';

export default {
  data() {
    return {
      pageDomain: 'all',
      targets: [],
    };
  },
  mounted() {
    this.getData();
    setInterval(this.getData, 5000);
  },
  methods: {
    onChange(value) {
      this.pageDomain = value;
      this.currentTargets = this.filter(this.targets);
    },
    onClick(id) {
      const domain = process.env.DEBUG_HOST.replace(/^(http|https):\/\//ig, '');
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = encodeURIComponent(`${domain}/remote/debug/devtools/${uuid()}?clientId=${id}`);
      const url = `${location.protocol}//${domain}/remote/debug/front_end/devtools_app.html?${protocol}=${wsUrl}`;
      window.open(url);
    },
    getData() {
      const url = `${process.env.DEBUG_HOST}/remote/debug/json`;
      return fetch(url, {
        method: 'GET',
      }).then(res => res.json())
        .then((res) => {
          this.targets = res.targets.map(item => ({
            ...item,
            title: item.title || '-',
            time: dayjs(Number(item.time)).format('YYYY-MM-DD HH:mm:ss'),
          }));
        });
    },
  },
};
</script>

<style>
.main {
  padding: 16px;
}

.favicon {
  width: 36px;
}
</style>
