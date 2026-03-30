<template>
  <web-view :src="url"></web-view>
</template>

<script>
export default {
  onLoad(options) {
    this.url = decodeURIComponent(options.url);
  },
  data() {
    return {
      url: ""
    };
  }
};
</script>