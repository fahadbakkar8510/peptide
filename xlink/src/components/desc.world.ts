// This class handles the abstract descriptions
// This is where we translate a textual description of a world into objects that should
// be rendered in 3D and simulated in the physics engine.

import { nanoid } from 'nanoid'
import type { ThreeInterface } from './three.world'
import type { PhysicsInterface } from './physics.world'
import { residueRadius, socketRadius, socketLength, ballRadius } from './constants'
import { getAlphaOnly } from './common'
import type * as THREE from 'three'
import type { DynamicInstMesh } from './three.world'

export class Residue {
  public id: string
  public name: string
  public radius: number
  public pos: THREE.Vector3

  constructor(id: string, name: string, radius: number, pos: THREE.Vector3) {
    this.id = id
    this.name = name
    this.radius = radius
    this.pos = pos
  }
}

export class Socket {
  public id: string
  public residueId: string
  public radius: number
  public length: number

  constructor(id: string, residueId: string, radius: number, length: number) {
    this.id = id
    this.residueId = residueId
    this.radius = radius
    this.length = length
  }
}

export class Ball {
  public id: string
  public socket1Id: string
  public socket2Id: string
  public radius: number

  constructor(id: string, socket1Id: string, socket2Id: string, radius: number) {
    this.id = id
    this.socket1Id = socket1Id
    this.socket2Id = socket2Id
    this.radius = radius
  }
}

export class Joint {
  public socket1: Socket
  public ball: Ball
  public socket2: Socket

  constructor(socket1: Socket, ball: Ball, socket2: Socket) {
    this.socket1 = socket1
    this.ball = ball
    this.socket2 = socket2
  }
}

export class Peptide extends Array<Residue> { }

export class Peptides extends Map<string, Peptide> { }

export class Joints extends Array<Joint> { }

export interface DescInterface {
  addPeptide(name: string, sequence: string, startPos: THREE.Vector3): void
  addCrossLinks(crossLinkStr: string): void
}

export class DescWorld implements DescInterface {
  // the peptide map
  private peptides: Peptides = new Peptides()
  private joints: Joints = new Joints()

  // reference to three world
  private threeWorld: ThreeInterface

  constructor(threeWorld: ThreeInterface) {
    this.threeWorld = threeWorld
  }

  public addPeptide(name: string, sequence: string, startPos: THREE.Vector3) {
    let peptide = new Peptide()
    this.peptides.set(name, peptide)
    let prevResidue: Residue

    sequence.split('').forEach((c, i) => {
      const residue = new Residue(this.newID(), c, residueRadius, startPos.clone().setX(startPos.x + (2 * socketLength + residueRadius) * i))
      this.threeWorld.addResidue(residue)
      peptide.push(residue)

      if (prevResidue) {
        const socket1 = new Socket(this.newID(), prevResidue.id, socketRadius, socketLength)
        const socket2 = new Socket(this.newID(), residue.id, socketRadius, socketLength)
        const ball = new Ball(this.newID(), socket1.id, socket2.id, ballRadius)
        const joint = new Joint(socket1, ball, socket2)
        this.joints.push(joint)
      }

      prevResidue = residue
    })
  }

  public addCrossLinks(crossLinkStr: string) {
    // the syntax is "name:num-name:num"
    // where name is a peptide name and num is a residue number
    const crossLinks = crossLinkStr.split(";")

    crossLinks.forEach(crossLink => {
      const acids = crossLink.split("-")
      const acid1Locs = acids[0].split(":")
      const chain1 = acid1Locs[0]
      const acid1Char = getAlphaOnly(acid1Locs[1])
      const acid1Num = parseInt(acid1Locs[1].match(/(\d+)/)![0])
      const residue1 = this.peptides.get(chain1)?.[acid1Num - 1]
      if (acid1Char !== residue1?.name) return
      const acid2Locs = acids[1].split(":")
      const chain2 = acid2Locs[0]
      const acid2Char = getAlphaOnly(acid2Locs[1])
      const acid2Num = parseInt(acid2Locs[1].match(/(\d+)/)![0])
      const residue2 = this.peptides.get(chain2)?.[acid2Num - 1]
      if (acid2Char !== residue2?.name) return

      const socket1 = new Socket(this.newID(), residue1.id, socketRadius, socketLength)
      const socket2 = new Socket(this.newID(), residue2.id, socketRadius, socketLength)
      const ball = new Ball(this.newID(), socket1.id, socket2.id, ballRadius)
      const joint = new Joint(socket1, ball, socket2)
      this.joints.push(joint)
    })
  }

  private newID(): string {
    return nanoid(8)
  }
}
