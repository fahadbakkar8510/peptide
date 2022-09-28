import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { DescWorld } from './DescWorld'
import type { PhysicsInterface } from './PhysicsWorld'

export interface ThreeInterface {
  addResidue(id: string, radius: number, x: number, y: number, z: number): void
  transform(id: string, pos_x: number, pos_y: number, pos_z: number, quat_x: number, quat_y: number, quat_z: number, quat_w: number): void
  transformP2P(id: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void
  animate(physicsWorld: PhysicsInterface): void
}

export class ThreeWorld implements ThreeInterface {
  private descWorld: DescWorld | undefined = undefined
  private canvas: THREE.PerspectiveCamera
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private prevRender: number | null = null
  // Map each peptide name to an array of meshes (one for each residue)
  private meshMap: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>()

  constructor(canvas: any) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    canvas.value.appendChild(this.renderer.domElement)

    // add orbit controls
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.camera.position.z = 5
  }

  addResidue(id: string, radius: number, x: number, y: number, z: number): void {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
    sphere.position.set(x, y, z)
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

  public animate(physicsWorld: PhysicsInterface) {
    requestAnimationFrame((t) => {
      if (this.prevRender === null) {
        this.prevRender = t
      }
      physicsWorld.stepSimulation((t - this.prevRender) / 1000)
      this.renderer.render(this.scene, this.camera)
      this.prevRender = t
      this.animate(physicsWorld)
    })
  }
}
