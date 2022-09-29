import * as THREE from 'three'
import { backColor, fogHex, fogDensity, lightAHex, lightBHex, lightCHex, acidHexStr, tempMatrix1, residueInstCnt, floorColor } from './constants'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { Residue } from './desc.world'
import { getTextTexture } from './common'
import type { PhysicsInterface } from './physics.world'

export class DynamicInstMesh extends THREE.InstancedMesh {
  public index: number = 0
}

export interface ThreeInterface {
  animate(): void
  addResidue(info: Residue): any
}

export class ThreeWorld implements ThreeInterface {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private orbitControls: OrbitControls
  private residueInstMeshes: Map<string, any> = new Map<string, any>()
  private physicsWorld: PhysicsInterface

  constructor(canvas: any, physicsWorld: PhysicsInterface) {
    this.physicsWorld = physicsWorld

    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = backColor
    this.scene.fog = new THREE.FogExp2(fogHex, fogDensity)

    // Lights
    const lightA = new THREE.DirectionalLight(lightAHex)
    lightA.position.set(1, 1, 1)
    this.scene.add(lightA)

    const lightB = new THREE.DirectionalLight(lightBHex)
    lightB.position.set(-1, -1, -1)
    this.scene.add(lightB)

    const lightC = new THREE.AmbientLight(lightCHex)
    this.scene.add(lightC)

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.z = 5

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = false
    this.renderer.outputEncoding = THREE.sRGBEncoding
    canvas.value.appendChild(this.renderer.domElement)

    // Orbit Controls
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)

    // Axes Helper
    this.scene.add(new THREE.AxesHelper(100))

    // Add floor
    const floorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1000, 1, 1000),
      new THREE.ShadowMaterial({ color: floorColor })
    )
    floorMesh.position.y = -0.5
    // floorMesh.rotateX(0.3)
    floorMesh.receiveShadow = true
    this.scene.add(floorMesh)
    this.physicsWorld.addMesh(floorMesh, 0)

    // Animate
    this.animate()
  }

  public animate() {
    requestAnimationFrame((t) => {
      this.animate()
      this.renderer.render(this.scene, this.camera)
    })
  }

  addResidue(info: Residue) {
    let residueInstMesh: DynamicInstMesh = this.residueInstMeshes.get(info.name)
    let index = 0

    if (residueInstMesh) {
      index = ++residueInstMesh.index
      console.log('residue instance index: ', index)
    } else {
      residueInstMesh = new DynamicInstMesh(
        new THREE.SphereGeometry(info.radius),
        new THREE.MeshStandardMaterial({ map: getTextTexture(info.name, acidHexStr) }),
        residueInstCnt
      )
      this.scene.add(residueInstMesh)
      this.residueInstMeshes.set(info.name, residueInstMesh)
    }

    residueInstMesh.setMatrixAt(index, tempMatrix1.setPosition(info.pos))
    this.physicsWorld.addMesh(residueInstMesh, 1)
    return residueInstMesh
  }
}
