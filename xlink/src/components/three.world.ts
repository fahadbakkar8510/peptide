import * as THREE from 'three'
import { backColor, fogHex, fogDensity, lightAHex, lightBHex, lightCHex, acidHexStr, tempMatrix1, residueInstCnt, floorColor, socketInstCnt, tempColor1, bondSocketHex, socketHex, ballHex, ballInstCnt, cameraPosZ, commonResidueMass, commonSocketMass, commonBallMass, startPos, tempMultiMatrix1, tempMatrix2, normalVecZ } from './constants'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { Residue, Socket, Ball } from './desc.world'
import { getTextTexture } from './common'
import type { PhysicsInterface } from './physics.world'
import { DragControls } from './drag.controls'

export class DynamicInstMesh extends THREE.InstancedMesh {
  public index: number = 0
}

export interface ThreeInterface {
  animate(): void
  addResidue(info: Residue): void
  addSocket(info: Socket): void
  addBall(info: Ball): void
  updateStartPos(): void
  updateDragControls(): void
}

export class ThreeWorld implements ThreeInterface {
  private physicsWorld: PhysicsInterface
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private orbitControls: OrbitControls
  private residueInstMeshes: Map<string, DynamicInstMesh> = new Map<string, DynamicInstMesh>()
  private socketInstMeshes: Map<string, DynamicInstMesh> = new Map<string, DynamicInstMesh>()
  private ballInstMeshes: Map<string, DynamicInstMesh> = new Map<string, DynamicInstMesh>()
  private instIndexes: Map<string, number> = new Map<string, number>()
  private startPos: THREE.Vector3 = startPos.clone()
  private dragControls: DragControls | undefined

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
    this.physicsWorld.addMesh('floor', floorMesh, 0)

    // Animate
    this.animate()
  }

  animate() {
    requestAnimationFrame((t) => {
      this.animate()
      this.renderer.render(this.scene, this.camera)
    })
  }

  addResidue(info: Residue) {
    let residueInstMesh: DynamicInstMesh | undefined = this.residueInstMeshes.get(info.name)
    let index = 0

    if (residueInstMesh) {
      index = ++residueInstMesh.index
      // console.log('residue instance index: ', index)
      this.instIndexes.set(info.id, index)
    } else {
      residueInstMesh = new DynamicInstMesh(
        new THREE.SphereGeometry(info.radius),
        new THREE.MeshStandardMaterial({ map: getTextTexture(info.name, acidHexStr) }),
        residueInstCnt
      )
      residueInstMesh.name = info.name
      this.scene.add(residueInstMesh)
      this.residueInstMeshes.set(info.name, residueInstMesh)
      this.instIndexes.set(info.id, 0)
    }
  }

  addSocket(info: Socket) {
    let socketInstMesh: DynamicInstMesh | undefined = this.socketInstMeshes.get(info.name)
    let index = 0

    if (socketInstMesh) {
      index = ++socketInstMesh.index
      // console.log('socket instance index: ', index)
      this.instIndexes.set(info.id, index)
    } else {
      socketInstMesh = new DynamicInstMesh(
        new THREE.CylinderGeometry(info.radius, info.radius, info.length),
        new THREE.MeshLambertMaterial(),
        socketInstCnt
      )
      this.scene.add(socketInstMesh)
      this.socketInstMeshes.set(info.name, socketInstMesh)
      this.instIndexes.set(info.id, 0)
    }

    socketInstMesh.setColorAt(index, tempColor1.setHex(info.isBond ? bondSocketHex : socketHex))
  }

  addBall(info: Ball) {
    let ballInstMesh: DynamicInstMesh | undefined = this.ballInstMeshes.get(info.name)
    let index = 0

    if (ballInstMesh) {
      index = ++ballInstMesh.index
      // console.log('ball instance index: ', index)
      this.instIndexes.set(info.id, index)
    } else {
      ballInstMesh = new DynamicInstMesh(
        new THREE.SphereGeometry(info.radius),
        new THREE.MeshLambertMaterial(),
        ballInstCnt
      )
      this.scene.add(ballInstMesh)
      this.ballInstMeshes.set(info.name, ballInstMesh)
      this.instIndexes.set(info.id, 0)
    }

    ballInstMesh.setColorAt(index, tempColor1.setHex(ballHex))

    // Update all matrices.
    const ball = info
    const socket1 = ball.socket1
    const residue1 = socket1.residue
    const socket2 = ball.socket2
    const residue2 = socket2.residue
    const socket1Mesh = this.socketInstMeshes.get(socket1.name)
    const residue1Mesh = this.residueInstMeshes.get(residue1.name)
    const socket2Mesh = this.socketInstMeshes.get(socket2.name)
    const residue2Mesh = this.residueInstMeshes.get(residue2.name)
    if (!socket1Mesh || !socket2Mesh || !residue1Mesh || !residue2Mesh) {
      console.log('meshes are not prepared.')
      return
    }
    const residue1InstIndex = this.instIndexes.get(residue1.id)
    !ball.isBond && residue1Mesh?.setMatrixAt(
      residue1InstIndex!,
      tempMultiMatrix1.multiplyMatrices(
        tempMatrix1.setPosition(this.startPos.clone()),
        tempMatrix2.makeRotationAxis(normalVecZ, 0)
      )
    )
    const socket1X = this.startPos.x + residue1.radius + socket1.length / 2
    const socket1InstIndex = this.instIndexes.get(socket1.id)
    socket1Mesh?.setMatrixAt(
      socket1InstIndex!,
      tempMultiMatrix1.multiplyMatrices(
        tempMatrix1.setPosition(this.startPos.clone().setX(socket1X)),
        tempMatrix2.makeRotationAxis(normalVecZ, Math.PI / 2)
      )
    )
    const ballX = socket1X + socket1.length / 2 + ball.radius
    ballInstMesh?.setMatrixAt(
      index,
      tempMultiMatrix1.multiplyMatrices(
        tempMatrix1.setPosition(this.startPos.clone().setX(ballX)),
        tempMatrix2.makeRotationAxis(normalVecZ, Math.PI / 2)
      )
    )
    const socket2X = ballX + ball.radius + socket2.length / 2
    const socket2InstIndex = this.instIndexes.get(socket2.id)
    socket2Mesh?.setMatrixAt(
      socket2InstIndex!,
      tempMultiMatrix1.multiplyMatrices(
        tempMatrix1.setPosition(this.startPos.clone().setX(socket2X)),
        tempMatrix2.makeRotationAxis(normalVecZ, Math.PI / 2)
      )
    )
    const residue2X = socket2X + socket2.length / 2 + residue2.radius
    const residue2InstIndex = this.instIndexes.get(residue2.id)
    !ball.isBond && residue2Mesh?.setMatrixAt(
      residue2InstIndex!,
      tempMultiMatrix1.multiplyMatrices(
        tempMatrix1.setPosition(this.startPos.clone().setX(residue2X)),
        tempMatrix2.makeRotationAxis(normalVecZ, 0)
      )
    )
    this.startPos.setX(this.startPos.x + residue1.radius + socket1.length + 2 * ball.radius + socket2.length + residue2.radius)

    // Add physics.
    if (residue1Mesh && residue1InstIndex !== undefined) {
      residue1Mesh.index = residue1InstIndex
      residue1Mesh.userData.physicsBodies = this.physicsWorld.addMesh(residue1.id, residue1Mesh, residue1.mass)
    } else {
      console.log("can't add physics for residue 1.")
    }

    if (socket1Mesh && socket1InstIndex !== undefined) {
      socket1Mesh.index = socket1InstIndex
      this.physicsWorld.addMesh(socket1.id, socket1Mesh, socket1.mass)
    } else {
      console.log("can't add physics for socket 1.")
    }

    this.physicsWorld.addMesh(ball.id, ballInstMesh, ball.mass)

    if (socket2Mesh && socket2InstIndex !== undefined) {
      socket2Mesh.index = socket2InstIndex
      this.physicsWorld.addMesh(socket2.id, socket2Mesh, socket2.mass)
    } else {
      console.log("can't add physics for socket 2.")
    }

    if (residue2Mesh && residue2InstIndex !== undefined) {
      residue2Mesh.index = residue2InstIndex
      residue1Mesh.userData.physicsBodies = this.physicsWorld.addMesh(residue2.id, residue2Mesh, residue2.mass)
    } else {
      console.log("can't add physics for residue 2.")
    }

    // Add constraint.
    this.physicsWorld.generateConstraint(ball)
  }

  updateStartPos() {
    this.startPos.set(startPos.x, startPos.y, this.startPos.z + 0.4)
  }

  updateDragControls() {
    const arrResidueInstMesh: Array<DynamicInstMesh> = []
    this.residueInstMeshes.forEach(instMesh => {
      arrResidueInstMesh.push(instMesh)
    })
    // console.log('updateDragControls: ', arrResidueInstMesh, this.camera, this.renderer.domElement, this.physicsWorld.ammo)

    if (this.dragControls) {
      this.dragControls.dispose()
      this.dragControls = undefined
    }

    this.dragControls = new DragControls(
      arrResidueInstMesh,
      this.camera,
      this.renderer.domElement,
      this.physicsWorld.ammo!
    )
  }
}
