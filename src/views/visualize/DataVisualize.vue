<template>
  <div>
    <component :is="currentVisualizationComponent" />
  </div>
</template>

<script>
import WeightVisualize from './WeightVisualize.vue';
import Default from './Default.vue';

export default {
  computed: {
    currentVisualizationComponent() {
      const dataType = this.$store.state.visualize.dataType;
      if (dataType === 'dynamicWeighing') {
        return WeightVisualize;
      }
      return Default;
    },
  },
};
</script>