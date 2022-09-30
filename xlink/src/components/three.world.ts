import * as THREE from 'three'
import { backColor, fogHex, fogDensity, lightAHex, lightBHex, lightCHex, acidHexStr, tempMatrix1, residueInstCnt, floorColor, socketInstCnt, tempColor1, bondSocketHex, socketHex, ballHex, ballInstCnt, cameraPosZ, commonResidueMass, commonSocketMass, commonBallMass } from './constants'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { Residue, Socket, Ball } from './desc.world'
import { getTextTexture } from './common'
import type { PhysicsInterface } from './physics.world'

export class DynamicInstMesh extends THREE.InstancedMesh {
  public index: number = 0
}

export interface ThreeInterface {
  animate(): void
  addResidue(info: Residue): DynamicInstMesh
  addSocket(info: Socket): DynamicInstMesh
  addBall(info: Ball): DynamicInstMesh
}

export class ThreeWorld implements ThreeInterface {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private orbitControls: OrbitControls
  private residueInstMeshes: Map<string, any> = new Map<string, any>()
  private socketInstMeshes: Map<string, any> = new Map<string, any>()
  private ballInstMeshes: Map<string, any> = new Map<string, any>()
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
    this.camera.position.z = cameraPosZ

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
      // console.log('residue instance index: ', index)
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
    this.physicsWorld.addMesh(residueInstMesh, commonResidueMass)
    return residueInstMesh
  }

  addSocket(info: Socket) {
    const socketName = 'temp'
    let socketInstMesh: DynamicInstMesh = this.socketInstMeshes.get(socketName)
    let index = 0

    if (socketInstMesh) {
      index = ++socketInstMesh.index
      // console.log('socket instance index: ', index)
    } else {
      socketInstMesh = new DynamicInstMesh(
        new THREE.CylinderGeometry(info.radius, info.radius, info.length),
        new THREE.MeshLambertMaterial(),
        socketInstCnt
      )
      this.scene.add(socketInstMesh)
      this.socketInstMeshes.set(socketName, socketInstMesh)
    }

    socketInstMesh.setMatrixAt(index, info.matrix)
    socketInstMesh.setColorAt(index, tempColor1.setHex(info.isBond ? bondSocketHex : socketHex))
    this.physicsWorld.addMesh(socketInstMesh, commonSocketMass)
    return socketInstMesh
  }

  addBall(info: Ball) {
    const ballName = 'temp'
    let ballInstMesh: DynamicInstMesh = this.ballInstMeshes.get(ballName)
    let index = 0

    if (ballInstMesh) {
      index = ++ballInstMesh.index
      // console.log('socket instance index: ', index)
    } else {
      ballInstMesh = new DynamicInstMesh(
        new THREE.SphereGeometry(info.radius),
        new THREE.MeshLambertMaterial(),
        ballInstCnt
      )
      this.scene.add(ballInstMesh)
      this.ballInstMeshes.set(ballName, ballInstMesh)
    }

    ballInstMesh.setMatrixAt(index, info.matrix)
    ballInstMesh.setColorAt(index, tempColor1.setHex(ballHex))
    this.physicsWorld.addMesh(ballInstMesh, commonBallMass)
    return ballInstMesh
  }
}
