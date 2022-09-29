<template>
  <div ref='canvas'></div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import { DescWorld } from './DescWorld'
import { ThreeWorld } from './ThreeWorld'
import { PhysicsWorld } from './PhysicsWorld'

const canvas = ref()

onMounted(() => {
  init()
})

async function init() {
  // first set up descriptions of the world
  const threeWorld = new ThreeWorld(canvas)
  const phyWorld = new PhysicsWorld()
  const descWorld = new DescWorld(threeWorld, phyWorld)

  // populate with insulin A and B chains.
  descWorld.addPeptide('A', 'GIVEQCCTSICSLYQNLENYCN')
  descWorld.addPeptide('B', 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT')
  descWorld.addCrossLinks('A:C6-A:C11;A:C7-B:C7;A:C21-B:C19')

  // Start
  await descWorld.start()
}
</script>
