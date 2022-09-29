import * as THREE from 'three'
import { backColor, fogHex, fogDensity, lightAHex, lightBHex, lightCHex, acidHexStr, tempMatrix1, instanceCount } from './constants';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { Residue } from './desc.world'
import { getTextTexture } from './common';

export class DynamicInstMesh extends THREE.InstancedMesh {
  public index: number = 0
}

export class InstMeshInfo {
  public instMesh: any
  public index: number

  constructor(instMesh: any, index: number) {
    this.instMesh = instMesh
    this.index = index
  }
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
  private residueInstMeshes: Map<string, any>

  constructor(canvas: any) {
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

    this.residueInstMeshes = new Map<string, any>()

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

    if (residueInstMesh) {
      const index = ++residueInstMesh.index
      console.log('index: ', index)
      residueInstMesh.setMatrixAt(index, tempMatrix1.setPosition(info.pos))
      return new InstMeshInfo(residueInstMesh, index)
    } else {
      residueInstMesh = new DynamicInstMesh(
        new THREE.SphereGeometry(info.radius),
        new THREE.MeshStandardMaterial({ map: getTextTexture(info.name, acidHexStr) }),
        instanceCount
      )
      residueInstMesh.setMatrixAt(0, tempMatrix1.setPosition(info.pos))
      this.scene.add(residueInstMesh)
      this.residueInstMeshes.set(info.name, residueInstMesh)
      return new InstMeshInfo(residueInstMesh, 0)
    }
  }
}
