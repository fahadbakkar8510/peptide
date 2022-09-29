import * as THREE from 'three'
import { backColor, fogHex, fogDensity, lightAHex, lightBHex, lightCHex } from './constants'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { PhysicsInterface } from './PhysicsWorld'

export interface ThreeInterface {
  addResidue(id: string, radius: number, pos: THREE.Vector3): void
  transform(id: string, pos_x: number, pos_y: number, pos_z: number, quat_x: number, quat_y: number, quat_z: number, quat_w: number): void
  transformP2P(id: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void
  animate(): void
}

export class ThreeWorld implements ThreeInterface {
  private canvas: THREE.PerspectiveCamera
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private prevRender: number | null = null
  private meshMap: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>()
  private orbitControls: OrbitControls

  constructor(canvas: any) {
    this.canvas = canvas

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
  }

  addResidue(id: string, radius: number, pos: THREE.Vector3): void {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    sphere.position.copy(pos.clone())
    this.meshMap.set(id, sphere)
    this.scene.add(sphere)
  }

  // This is the method that will be called by the physics world instance
  // after getting world transform information from the physics engine. 
  public transform(id: string, pos_x: number, pos_y: number, pos_z: number, quat_x: number, quat_y: number, quat_z: number, quat_w: number) {
    const pos3 = new THREE.Vector3(pos_x, pos_y, pos_z)
    const quat3 = new THREE.Quaternion(quat_x, quat_y, quat_z, quat_w)
    let mesh = this.meshMap.get(id)
    if (mesh) {
      mesh.position.copy(pos3)
      mesh.quaternion.copy(quat3)
    }
  }

  public transformP2P(id: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    const pos1 = new THREE.Vector3(x1, y1, z1)
    const pos2 = new THREE.Vector3(x2, y2, z2)
    let mesh = this.meshMap.get(id)
    if (mesh) {
      // mesh.position.copy(pos3)
      // mesh.quaternion.copy(quat3)
    }
  }

  public animate() {
    requestAnimationFrame((t) => {
      this.animate()
      this.renderer.render(this.scene, this.camera)
    })
  }
}
