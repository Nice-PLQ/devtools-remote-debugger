<template>
  <div>
    <el-alert v-if="showWarning" :title="$t('tips')" type="error" />
    <header class="header">
      <div class="title">
        <svg t="1681373640980" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="6973" width="36" height="36" style="margin-right: 16px">
          <path
            d="M510.272 0q137.152-1.152 257.728 68.576 132.576 76.576 201.152 212.576l-424-22.272q-91.424-5.152-168 42.56t-105.728 131.136l-157.728-242.272q73.152-90.848 177.728-140.288t218.848-50.016zM83.424 231.424l192.576 378.848q41.152 81.728 120.576 124t167.424 25.728l-131.424 257.728q-121.152-18.848-220-90.016t-155.712-180.576-56.864-235.136q0-152.576 83.424-280.576zM989.728 328q33.152 85.728 34.016 177.44t-27.712 174.848-87.424 155.424-140.576 119.712q-131.424 76-284.576 68l231.424-356q50.272-74.848 47.136-166.016t-60.864-158.56zM512 339.424q71.424 0 122.016 50.56t50.56 122.016-50.56 122.016-122.016 50.56-122.016-50.56-50.56-122.016 50.56-122.016 122.016-50.56z"
            p-id="6974"></path>
        </svg>
        Devtools Remote Debugger
      </div>
      <div class="operation">
        <div class="debug-demo" @click="openDemo">
          {{ $t('demo') }}
        </div>
        <div class="right" @click="$router.push('/usage')">
          {{ $t('usage') }}
        </div>
        <el-switch v-model="locale" active-text="中文" inactive-text="EN" @change="onLocalChange" />
      </div>
    </header>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data() {
    return {
      locale: false,
      showWarning: false,
    };
  },
  mounted() {
    if (!/(chrome|edg)/ig.test(navigator.userAgent)) {
      this.showWarning = true;
    }
  },
  methods: {
    onLocalChange(val) {
      this.$i18n.locale = val ? 'zh' : 'en';
    },
    openDemo() {
      window.open(`${process.env.DEBUG_HOST}/remote/debug/example/index.html`, 'new', 'height=667,width=375');
    },
  }
};
</script>

<style>
html,
body {
  padding: 0;
  margin: 0;
}

.header {
  height: 64px;
  border-bottom: 3px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  margin-bottom: 32px;
}

.header .title {
  font-size: 24px;
}

.header .title,
.operation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.debug-demo {
  margin-right: 32px;
  cursor: pointer;
}

.right {
  cursor: pointer;
  margin-right: 32px;
}
</style>
