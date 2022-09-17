<template>
  <div class="flex flex-col absolute w-64 h-auto pin-r pin-b bg-grey-darkest text-white rounded mr-2 mb-2 z-10">
    <div class="p-2 mt-1">
      Control Panel
    </div>
    <div class="bg-grey-dark h-full p-3 rounded-b flex flex-col border border-grey-darkest">
      <div class="border-b border-grey-darkest mb-2 pb-2 w-100">
        <p class="flex items-center justify-between mb-1">
          A Chain
          <input class="w-32" ref="chain_a" type="text" v-model="chains.a" />
        </p>
        <p class="flex items-center justify-between mb-1">
          B Chain
          <input class="w-32" ref="chain_b" type="text" v-model="chains.b" />
        </p>
        <p class="flex items-center justify-between mb-1">
          Joint Length
          <input class="w-32" ref="joint_length" type="number" v-model="jointLength" />
        </p>
        <p class="flex items-center justify-between mb-1">
          Joint Radius
          <input class="w-32" ref="joint_radius" type="number" v-model="jointRadius" />
        </p>
        <p class="flex items-center justify-between mb-1">
          Distance
          <input class="w-32" ref="distance" type="number" v-model="distance" />
        </p>
        <p class="flex items-center justify-between mb-1">
          Amino Acid Radius
          <input class="w-32" ref="amino_acid_radius" type="number" v-model="aminoAcidRadius" />
        </p>
        <p class="flex items-center">
          <button class="bg-grey-light cursor-pointer shadow p-2 mx-auto" @click="generatePeptides">
            Generate peptides
          </button>
        </p>
        <!-- <p class="mb-1 text-grey-light font-bold">
          Scenery
        </p>
        <p class="flex items-center justify-between mb-1">
          Pyramids
          <input type="checkbox" name="pyramids" id="pyramids" v-model="pyramidsVisible" @click="togglePyramids" />
        </p>
        <p class="flex items-center justify-between">
          Axis Lines
          <input type="checkbox" name="axis-lines" id="axis-lines" v-model="axisLinesVisible"
            @click="toggleAxisLines" />
        </p> -->
      </div>
      <div v-if="CAMERA_POSITION" class="border-b border-grey-darkest mb-2 pb-2">
        <p class="mb-1 text-grey-light font-bold">
          Camera Position
        </p>
        <p class="flex justify-between w-full mb-2 text-grey-light">
          X:<span class="text-white">{{ CAMERA_POSITION.x }}</span>
        </p>
        <p class="flex justify-between w-full mb-2 text-grey-light">
          Y:<span class="text-white">{{ CAMERA_POSITION.y }}</span>
        </p>
        <p class="flex justify-between w-full mb-2 text-grey-light">
          Z:<span class="text-white">{{ CAMERA_POSITION.z }}</span>
        </p>
        <p class="flex items-center">
          <button class="bg-grey-light cursor-pointer shadow p-2 mx-auto" @click="resetCameraPosition">
            Reset Camera
          </button>
        </p>
      </div>
      <!-- <div class="flex justify-around">
        <a href="https://threejs.org/examples/?q=controls#misc_controls_trackball" target="_blank"
          class="text-grey-light no-underline hover:text-grey-lighter">Original &#8599;
        </a>
        <a href="https://github.com/SRLabs/Vue-Three-Demo" target="_blank"
          class="text-grey-light no-underline hover:text-grey-lighter">Github &#8599;
        </a>
      </div> -->
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex"
export default {
  data() {
    return {
      chains: { a: 'KEEP', b: 'QUALITY' },
      jointLength: 0.5,
      jointRadius: 0.1,
      distance: 6,
      aminoAcidRadius: 1,
      // axisLinesVisible: true,
      // pyramidsVisible: true,
    }
  },
  computed: {
    ...mapGetters([
      "CAMERA_POSITION",
    ])
  },
  methods: {
    ...mapMutations([
      "SET_CAMERA_POSITION",
      "RESET_CAMERA_ROTATION",
      "SET_CONTROL_INFO",
      "GENERATE_PEPTIDES",
      // "HIDE_AXIS_LINES",
      // "SHOW_AXIS_LINES",
      // "HIDE_PYRAMIDS",
      // "SHOW_PYRAMIDS",
    ]),
    generatePeptides() {
      if (!this.chains.a) {
        this.$refs.chain_a.focus()
        return
      }
      if (!this.chains.b) {
        this.$refs.chain_b.focus()
        return
      }
      if (this.jointLength <= 0) {
        this.$refs.joint_length.focus()
        return
      }
      if (this.jointRadius <= 0) {
        this.$refs.joint_radius.focus()
        return
      }
      if (this.distance <= 0) {
        this.$refs.distance.focus()
        return
      }
      if (this.aminoAcidRadius <= 0) {
        this.$refs.amino_acid_radius.focus()
        return
      }
      this.SET_CONTROL_INFO({
        chains: this.chains,
        joint_length: this.jointLength,
        distance: this.distance,
        amino_acid_radius: this.aminoAcidRadius,
        joint_radius: this.jointRadius,
      })
      this.GENERATE_PEPTIDES()
    },
    resetCameraPosition() {
      this.SET_CAMERA_POSITION({ x: 0, y: 0, z: 500 })
      this.RESET_CAMERA_ROTATION()
    },
    // toggleAxisLines() {
    //   if (this.axisLinesVisible) {
    //     this.HIDE_AXIS_LINES()
    //     this.axisLinesVisible = false
    //   } else {
    //     this.SHOW_AXIS_LINES()
    //     this.axisLinesVisible = true
    //   }
    // },
    // togglePyramids() {
    //   if (this.pyramidsVisible) {
    //     this.HIDE_PYRAMIDS()
    //     this.pyramidsVisible = false
    //   } else {
    //     this.SHOW_PYRAMIDS()
    //     this.pyramidsVisible = true
    //   }
    // },
  },
  mounted() {
    this.SET_CONTROL_INFO({
      chains: this.chains,
      joint_length: this.jointLength,
      distance: this.distance,
      amino_acid_radius: this.aminoAcidRadius
    })
  },
}
</script>
