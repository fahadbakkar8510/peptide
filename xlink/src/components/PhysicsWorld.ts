import Ammo from 'ammojs-typed'
import type { ThreeInterface } from './ThreeWorld'
import type { DescWorld } from './DescWorld'

export interface PhysicsInterface {
  addResidue(id: string, radius: number, x: number, y: number, z: number, mass: number): void
  addP2PConstraint(p2pId: string, id1: string, id2: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void
  stepSimulation(deltaTime: number): void
  init(threeWorld: ThreeInterface): Promise<void>
}

export class PhysicsWorld implements PhysicsInterface {
  private world: Ammo.btDiscreteDynamicsWorld | undefined = undefined
  private descWorld: DescWorld | undefined = undefined
  private threeWorld: ThreeInterface | undefined = undefined
  private ammo: typeof Ammo | undefined = undefined
  private bodyMap: Map<string, Ammo.btRigidBody> = new Map<string, Ammo.btRigidBody>()
  private p2pMap: Map<string, Ammo.btPoint2PointConstraint> = new Map<string, Ammo.btPoint2PointConstraint>()

  constructor() {

  }

  public async init(threeWorld: ThreeInterface): Promise<void> {
    let self = this
    return new Promise<void>(async (resolve, reject) => {
      this.threeWorld = threeWorld
      window.addEventListener('DOMContentLoaded', async () => {
        Ammo.bind(window)().then((ammo) => {
          this.ammo = ammo
          let collisionConfiguration_ = new ammo.btDefaultCollisionConfiguration()
          let dispatcher_ = new ammo.btCollisionDispatcher(collisionConfiguration_)
          this.world = new ammo.btDiscreteDynamicsWorld(
            dispatcher_,
            new ammo.btDbvtBroadphase(),
            new ammo.btSequentialImpulseConstraintSolver(),
            new ammo.btDefaultCollisionConfiguration()
          )
          this.world.setGravity(new ammo.btVector3(0, -1, 0))
          resolve()
        })
      })
    })
  }

  addResidue(id: string, radius: number, x: number, y: number, z: number, mass: number): void {
    let ammo: typeof Ammo = this.ammo!
    const sphereShape = new ammo.btSphereShape(radius)
    const sphereBody = new ammo.btRigidBody(
      new ammo.btRigidBodyConstructionInfo(
        mass,
        new ammo.btDefaultMotionState(),
        sphereShape,
        new ammo.btVector3(0, 0, 0)))
    sphereBody.setRestitution(0.5)
    sphereBody.setFriction(0.5)
    sphereBody.setDamping(0.1, 0.1)
    sphereBody.setActivationState(4)
    this.bodyMap.set(id, sphereBody)
    this.world?.addRigidBody(sphereBody)
  }

  addP2PConstraint(p2pId: string, id1: string, id2: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void {
    let ammo: typeof Ammo = this.ammo!
    let body1 = this.bodyMap.get(id1)
    let body2 = this.bodyMap.get(id2)
    if (body1 && body2) {
      let pointConstraint = new ammo.btPoint2PointConstraint(body1, body2, new ammo.btVector3(x1, y1, z1), new ammo.btVector3(x2, y2, z2))
      this.p2pMap.set(p2pId, pointConstraint)
      this.world!.addConstraint(pointConstraint, true)
    }
  }

  stepSimulation(deltaTime: number): void {
    this.world?.stepSimulation(deltaTime, 10)
    let transform = new this.ammo!.btTransform()
    this.bodyMap.forEach((body, id) => {
      body.getMotionState().getWorldTransform(transform)
      let pos = transform.getOrigin()
      let quat = transform.getRotation()
      let x = pos.x()
      let y = pos.y()
      let z = pos.z()
      let qx = quat.x()
      let qy = quat.y()
      let qz = quat.z()
      let qw = quat.w()
      this.threeWorld!.transform(id, x, y, z, qx, qy, qz, qw)
    })
    this.p2pMap.forEach((p2p, id) => {
      let pivotA = p2p.getPivotInA()
      let pivotB = p2p.getPivotInB()
      let x1 = pivotA.x()
      let y1 = pivotA.y()
      let z1 = pivotA.z()
      let x2 = pivotB.x()
      let y2 = pivotB.y()
      let z2 = pivotB.z()
      this.threeWorld!.transformP2P(id, x1, y1, z1, x2, y2, z2)
    })
  }
}
