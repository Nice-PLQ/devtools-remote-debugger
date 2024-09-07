<template>
  <div class="tips">
    {{ $t('useTitle') }}
    <div class="code">
      &lt;script src=&quot;https://path/to/cdp.js&quot;&gt;&lt;/script&gt;
    </div>
    <div class="notice">
      <div class="title">{{ $t('notice') }}</div>
      <div>{{ $t('notice_1') }}</div>
      <ul>
        <li>{{ $t('notice_2') }}<code>crossorigin="anonymous"</code></li>
        <li>{{ $t('notice_3') }}<code>crossorigin="anonymous"</code></li>
        <li>{{ $t('notice_4') }}<code>Access-Control-Allow-Origin</code></li>
      </ul>
    </div>
  </div>
</template>

<style>
  .tips {
    padding-top: 100px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  input {
    position: absolute;
    clip: rect(0, 0, 0, 0);
  }

  .notice {
    text-align: left;
    margin-top: 64px;
    font-size: 14px;
  }

  .notice .title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .notice li {
    margin-bottom: 8px;
  }

  .notice code {
    color: #0052D9;
    padding: 0 4px;
  }

  .code {
    padding: 16px;
    background-color: #f1f1f1;
    border-radius: 4px;
    margin: 16px 0;
    color: #717171;
  }
</style>
