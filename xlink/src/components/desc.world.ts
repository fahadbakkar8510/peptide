// This class handles the abstract descriptions
// This is where we translate a textual description of a world into objects that should
// be rendered in 3D and simulated in the physics engine.

import { nanoid } from 'nanoid'
import type { ThreeInterface } from './three.world'
import { residueRadius, socketRadius, socketLength, ballRadius, tempMatrix1, tempPos1, tempMultiMatrix1, tempMatrix2, normalVecY, normalVecX, normalVecZ } from './constants'
import { getAlphaOnly } from './common'

export class Residue {
  public id: string
  public name: string
  public radius: number

  constructor(id: string, name: string, radius: number) {
    this.id = id
    this.name = name
    this.radius = radius
  }
}

export class Socket {
  public id: string
  public residueId: string
  public radius: number
  public length: number
  public isBond: boolean = false

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
  public hasConstraints: boolean = false
  public isBond: boolean = false

  constructor(id: string, socket1Id: string, socket2Id: string, radius: number) {
    this.id = id
    this.socket1Id = socket1Id
    this.socket2Id = socket2Id
    this.radius = radius
  }
}

export class Peptide extends Array<Residue> { }

export class Peptides extends Map<string, Peptide> { }

export class Balls extends Array<Ball> { }

export interface DescInterface {
  addPeptide(name: string, sequence: string): void
  addCrossLinks(crossLinkStr: string): void
}

export class DescWorld implements DescInterface {
  // the peptide map
  private peptides: Peptides = new Peptides()
  private balls: Balls = new Balls()

  // reference to three world
  private threeWorld: ThreeInterface

  constructor(threeWorld: ThreeInterface) {
    this.threeWorld = threeWorld
  }

  addPeptide(name: string, sequence: string) {
    let peptide = new Peptide()
    this.peptides.set(name, peptide)
    let prevResidue: Residue

    sequence.split('').forEach((c, i) => {
      const residue = new Residue(this.newID(), c, residueRadius)
      this.threeWorld.addResidue(residue)
      peptide.push(residue)

      if (prevResidue) {
        const socket1 = new Socket(this.newID(), prevResidue.id, socketRadius, socketLength)
        this.threeWorld.addSocket(socket1)
        const socket2 = new Socket(this.newID(), residue.id, socketRadius, socketLength)
        this.threeWorld.addSocket(socket2)
        const ball = new Ball(this.newID(), socket1.id, socket2.id, ballRadius)
        this.threeWorld.addBall(ball)
        this.balls.push(ball)
      }

      prevResidue = residue
    })
  }

  addCrossLinks(crossLinkStr: string) {
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
      socket1.isBond = true
      this.threeWorld.addSocket(socket1)
      const socket2 = new Socket(this.newID(), residue2.id, socketRadius, socketLength)
      socket2.isBond = true
      this.threeWorld.addSocket(socket2)
      const ball = new Ball(this.newID(), socket1.id, socket2.id, ballRadius)
      ball.isBond = true
      this.threeWorld.addBall(ball)
      this.balls.push(ball)
    })
  }

  private newID(): string {
    return nanoid(8)
  }
}
