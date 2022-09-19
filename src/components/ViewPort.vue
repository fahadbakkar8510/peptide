<template>
  <div class="viewport"></div>
</template>

<script>
import { mapMutations, mapActions } from "vuex"

export default {
  data() {
    return {
      height: 0
    }
  },
  methods: {
    ...mapMutations(["RESIZE", "SET_POINTER"]),
    ...mapActions(["INIT_SCENE", "ANIMATE"]),
  },
  mounted() {
    this.$el.addEventListener('pointermove', (event) => {
      this.SET_POINTER({ x: (event.clientX / this.$el.offsetWidth) * 2 - 1, y: -(event.clientY / this.$el.offsetHeight) * 2 + 1 })
    })
    this.INIT_SCENE({
      width: this.$el.offsetWidth,
      height: this.$el.offsetHeight,
      el: this.$el,
    }).then(() => {
      this.ANIMATE()
      window.addEventListener(
        "resize",
        () => {
          this.RESIZE({
            width: this.$el.offsetWidth,
            height: this.$el.offsetHeight
          })
        },
        true
      )
    })
  },
}
</script>

<style>
.viewport {
  height: 100%;
  width: 100%;
}
</style>
