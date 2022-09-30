import Ammo from 'ammojs-typed'
import { gravity, frameRate, friction, linearDamping, rotationDamping } from './constants'

const meshes: any[] = []
const meshMap: WeakMap<any, any> = new WeakMap<any, any>()
let ammo: typeof Ammo | undefined
let worldTransform: Ammo.btTransform | undefined
let physicsWorld: Ammo.btDiscreteDynamicsWorld | undefined
let lastTime: number = 0

export interface PhysicsInterface {
  init(): Promise<void>
  getShape(geometry: any): any
  addMesh(mesh: any, mass: number): Ammo.btRigidBody | Ammo.btRigidBody[] | undefined
  handleMesh(mesh: any, mass: number, shape: any): Ammo.btRigidBody
  handleInstancedMesh(mesh: any, mass: number, shape: any): Ammo.btRigidBody[]
  setMeshPosition(mesh: any, position: THREE.Vector3, index: number): void
  step(): void
}

export class PhysicsWorld implements PhysicsInterface {
  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // console.log('initial ammo: ', ammo)

      if (ammo) {
        resolve()
        return
      }

      window.addEventListener('DOMContentLoaded', () => {
        Ammo.bind(window)().then(newAmmo => {
          ammo = newAmmo
          // console.log('current ammo: ', ammo)
          worldTransform = new ammo.btTransform()
          const collisionConfiguration = new ammo.btDefaultCollisionConfiguration()
          const physicsDispatcher = new ammo.btCollisionDispatcher(
            collisionConfiguration
          )
          const physicsBroadphase = new ammo.btDbvtBroadphase()
          const physicsSolver = new ammo.btSequentialImpulseConstraintSolver()
          physicsWorld = new ammo.btDiscreteDynamicsWorld(
            physicsDispatcher,
            physicsBroadphase,
            physicsSolver,
            collisionConfiguration
          )
          physicsWorld.setGravity(new ammo.btVector3(0, -gravity, 0))
          setInterval(this.step, 1000 / frameRate)
          resolve()
        })
      })
    })
  }

  getShape(geometry: any) {
    const parameters = geometry.parameters
    let shape = null,
      radius,
      radiusTop,
      radiusBottom,
      sx,
      sy,
      sz

    switch (geometry.type) {
      case "BoxGeometry":
        sx = parameters.width !== undefined ? parameters.width / 2 : 0.5
        sy = parameters.height !== undefined ? parameters.height / 2 : 0.5
        sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5
        shape = new ammo!.btBoxShape(new ammo!.btVector3(sx, sy, sz))
        shape.setMargin(0.05)
        break

      case "SphereGeometry":
      case "IcosahedronGeometry":
        radius = parameters.radius !== undefined ? parameters.radius : 1
        shape = new ammo!.btSphereShape(radius)
        shape.setMargin(0.05)
        break

      case "CylinderGeometry":
        radiusTop =
          parameters.radiusTop !== undefined ? parameters.radiusTop : 1
        radiusBottom =
          parameters.radiusBottom !== undefined ? parameters.radiusBottom : 1
        sy = parameters.height !== undefined ? parameters.height / 2 : 0.5
        shape = new ammo!.btCylinderShape(
          new ammo!.btVector3(radiusTop, sy, radiusBottom)
        )
        shape.setMargin(0.05)
        break
    }

    return shape
  }

  addMesh(mesh: any, mass: number) {
    const shape = this.getShape(mesh.geometry)

    if (shape !== null) {
      if (mesh.isInstancedMesh) {
        return this.handleInstancedMesh(mesh, mass, shape)
      } else if (mesh.isMesh) {
        return this.handleMesh(mesh, mass, shape)
      }
    }
  }

  handleMesh(mesh: any, mass: number, shape: any) {
    const position = mesh.position
    const quaternion = mesh.quaternion

    const transform = new ammo!.btTransform()
    transform.setIdentity()
    transform.setOrigin(
      new ammo!.btVector3(position.x, position.y, position.z)
    )
    transform.setRotation(
      new ammo!.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
    )

    const motionState = new ammo!.btDefaultMotionState(transform)

    const localInertia = new ammo!.btVector3(0, 0, 0)
    shape.calculateLocalInertia(mass, localInertia)

    const rbInfo = new ammo!.btRigidBodyConstructionInfo(
      mass,
      motionState,
      shape,
      localInertia
    )

    const body = new ammo!.btRigidBody(rbInfo)
    body.setFriction(friction)
    body.setDamping(linearDamping, rotationDamping)
    physicsWorld!.addRigidBody(body)
    mesh.userData.physicsBody = body

    // if (mass > 0) {
    meshes.push(mesh)
    meshMap.set(mesh, body)
    // }

    return body
  }

  handleInstancedMesh(mesh: any, mass: number, shape: any) {
    // console.log('mesh instance index: ', mesh.index)
    const array = mesh.instanceMatrix.array
    const bodies: Ammo.btRigidBody[] = meshMap.get(mesh) || []
    // console.log('bodies: ', bodies)

    if (!bodies.length) {
      meshes.push(mesh)
      meshMap.set(mesh, bodies)
    }

    const index = mesh.index * 16
    const transform = new ammo!.btTransform()
    transform.setFromOpenGLMatrix(array.slice(index, index + 16))
    const motionState = new ammo!.btDefaultMotionState(transform)
    const localInertia = new ammo!.btVector3(0, 0, 0)
    shape.calculateLocalInertia(mass, localInertia)
    const rbInfo = new ammo!.btRigidBodyConstructionInfo(
      mass,
      motionState,
      shape,
      localInertia
    )
    const body = new ammo!.btRigidBody(rbInfo)
    body.setFriction(friction)
    body.setDamping(linearDamping, rotationDamping)
    physicsWorld!.addRigidBody(body)
    bodies.push(body)
    mesh.userData.physicsBodies = bodies
    return bodies
  }

  setMeshPosition(mesh: any, position: THREE.Vector3, index: number = 0) {
    if (mesh.isInstancedMesh) {
      const bodies = meshMap.get(mesh)
      const body = bodies[index]

      body.setAngularVelocity(new ammo!.btVector3(0, 0, 0))
      body.setLinearVelocity(new ammo!.btVector3(0, 0, 0))

      worldTransform!.setIdentity()
      worldTransform!.setOrigin(
        new ammo!.btVector3(position.x, position.y, position.z)
      )
      body.setWorldTransform(worldTransform)
    } else if (mesh.isMesh) {
      const body = meshMap.get(mesh)

      body.setAngularVelocity(new ammo!.btVector3(0, 0, 0))
      body.setLinearVelocity(new ammo!.btVector3(0, 0, 0))

      worldTransform!.setIdentity()
      worldTransform!.setOrigin(
        new ammo!.btVector3(position.x, position.y, position.z)
      )
      body.setWorldTransform(worldTransform)
    }
  }

  step() {
    const time = performance.now()

    if (lastTime > 0) {
      const delta = (time - lastTime) / 1000
      // console.time("physicsWorld.step")
      physicsWorld!.stepSimulation(delta, 10)
      // console.timeEnd("physicsWorld.step")
    }

    lastTime = time

    for (let i = 0, l = meshes.length; i < l; i++) {
      const mesh = meshes[i]

      if (mesh.isInstancedMesh) {
        const array = mesh.instanceMatrix.array
        const bodies = meshMap.get(mesh)

        for (let j = 0; j < bodies.length; j++) {
          const body = bodies[j]

          const motionState = body.getMotionState()
          motionState.getWorldTransform(worldTransform)

          const position = worldTransform!.getOrigin()
          const quaternion = worldTransform!.getRotation()

          compose(position, quaternion, array, j * 16)
        }

        mesh.instanceMatrix.needsUpdate = true
      } else if (mesh.isMesh) {
        const body = meshMap.get(mesh)

        const motionState = body.getMotionState()
        motionState.getWorldTransform(worldTransform)

        const position = worldTransform!.getOrigin()
        const quaternion = worldTransform!.getRotation()
        mesh.position.set(position.x(), position.y(), position.z())
        mesh.quaternion.set(
          quaternion.x(),
          quaternion.y(),
          quaternion.z(),
          quaternion.w()
        )
      }
    }

    detectCollision()
  }
}

function compose(position: Ammo.btVector3, quaternion: Ammo.btQuaternion, array: Array<any>, index: number) {
  const x = quaternion.x(),
    y = quaternion.y(),
    z = quaternion.z(),
    w = quaternion.w()
  const x2 = x + x,
    y2 = y + y,
    z2 = z + z
  const xx = x * x2,
    xy = x * y2,
    xz = x * z2
  const yy = y * y2,
    yz = y * z2,
    zz = z * z2
  const wx = w * x2,
    wy = w * y2,
    wz = w * z2

  array[index + 0] = 1 - (yy + zz)
  array[index + 1] = xy + wz
  array[index + 2] = xz - wy
  array[index + 3] = 0

  array[index + 4] = xy - wz
  array[index + 5] = 1 - (xx + zz)
  array[index + 6] = yz + wx
  array[index + 7] = 0

  array[index + 8] = xz + wy
  array[index + 9] = yz - wx
  array[index + 10] = 1 - (xx + yy)
  array[index + 11] = 0

  array[index + 12] = position.x()
  array[index + 13] = position.y()
  array[index + 14] = position.z()
  array[index + 15] = 1
}

function detectCollision() {
  let dispatcher = physicsWorld!.getDispatcher()
  let numManifolds = dispatcher.getNumManifolds()

  for (let i = 0; i < numManifolds; i++) {
    let contactManifold = dispatcher.getManifoldByIndexInternal(i)
    let numContacts = contactManifold.getNumContacts()

    for (let j = 0; j < numContacts; j++) {
      let contactPoint = contactManifold.getContactPoint(j)
      let distance = contactPoint.getDistance()
      // if (distance > 0) continue
      // console.log({ manifoldIndex: i, contactIndex: j, distance: distance })
    }
  }
}
