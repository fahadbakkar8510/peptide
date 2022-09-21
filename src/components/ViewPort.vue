<template>
  <div class="viewport" v-bind:style="{cursor: selectedCursor}"></div>
</template>

<script>
import { mapMutations, mapActions } from "vuex"

export default {
  data() {
    return {
      height: 0,
      selectedCursor: 'default'
    }
  },
  methods: {
    ...mapMutations(["RESIZE", "SET_POINTER", "SET_MOUSE_DOWN"]),
    ...mapActions(["INIT_SCENE", "ANIMATE"]),
  },
  mounted() {
    this.$el.addEventListener('pointermove', (event) => {
      this.SET_POINTER({ x: (event.clientX / this.$el.offsetWidth) * 2 - 1, y: -(event.clientY / this.$el.offsetHeight) * 2 + 1 })
    })
    this.$el.addEventListener('mousedown', (event) => {
      this.SET_MOUSE_DOWN(true)
    })
    this.$el.addEventListener('mouseup', (event) => {
      this.SET_MOUSE_DOWN(false)
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
    this.$store.subscribe((mutation, state) => {
      switch (mutation.type) {
        case 'SET_CURSOR':
          this.selectedCursor = state.cursor
          break;
      }
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
