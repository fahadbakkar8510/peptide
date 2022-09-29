<template>
  <div ref='canvas'></div>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import { DescWorld } from './desc.world'
import { ThreeWorld } from './three.world'
import { PhysicsWorld } from './physics.world'
import * as THREE from 'three'
import { tempPos1 } from './constants';

const canvas = ref()

onMounted(() => {
  init()
})

async function init() {
  // first set up descriptions of the world
  const threeWorld = new ThreeWorld(canvas)
  const physicsWorld = new PhysicsWorld()
  await physicsWorld.init()
  const descWorld = new DescWorld(threeWorld, physicsWorld)

  // populate with insulin A and B chains.
  descWorld.addPeptide('A', 'GIVEQCCTSICSLYQNLENYCN', tempPos1.clone().set(-3, 1, 0.2))
  descWorld.addPeptide('B', 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT', tempPos1.clone().set(-3, 1, -0.2))
  descWorld.addCrossLinks('A:C6-A:C11;A:C7-B:C7;A:C21-B:C19')
}
</script>
