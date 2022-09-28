// This class handles the abstract descriptions
// This is where we translate a textual description of a world into objects that should
// be rendered in 3D and simulated in the physics engine.
import { nanoid } from 'nanoid'
import type { ThreeInterface } from './ThreeWorld'
import type { PhysicsInterface } from './PhysicsWorld'

export interface DescInterface {
  start(): void
  addPeptide(name: string, sequence: string): void
  addCrossLinks(crossLinks: string): void
}

export class Residue {
  public id: string
  public name: string

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
  }
}

export class Joint {
  public residue1Id: string
  public residue2Id: string
  public ballId: string
  public socket1Id: string
  public socket2Id: string

  constructor(residue1Id: string, residue2Id: string, ballId: string, socket1Id: string, socket2Id: string) {
    this.residue1Id = residue1Id
    this.residue2Id = residue2Id
    this.ballId = ballId
    this.socket1Id = socket1Id
    this.socket2Id = socket2Id
  }
}

export class Peptide extends Array<Residue> { }
export class Peptides extends Map<string, Peptide> { }
export class Joints extends Array<Joint> { }

export class DescWorld implements DescInterface {
  private radius = 0.1 // for the moment, we'll just have a single common radius.
  // we'll want at least the option to specify radii per amino acid later. 

  // the peptide map
  private peptides: Peptides = new Peptides()
  private p2pConstraint: Array<string> = new Array<string>()

  // reference to three world
  private threeWorld: ThreeInterface

  // reference to physics world
  private physicsWorld: PhysicsInterface

  constructor(threeWorld: ThreeInterface, physicsWorld: PhysicsInterface) {
    this.threeWorld = threeWorld
    this.physicsWorld = physicsWorld
  }

  public async start(): Promise<void> {
    await this.physicsWorld.init(this.threeWorld)
    let y = 0
    this.peptides.forEach((peptide, key) => {
      let x = 0
      peptide.forEach((residue, index) => {
        let mass = (index > 0) ? 1 : 0
        this.threeWorld.addResidue(residue.id, this.radius, x, y, 0)
        this.physicsWorld.addResidue(residue.id, this.radius, x, y, 0, mass)
        x += 2 * this.radius
        if (index > 0) {
          let id = this.newID()
          this.p2pConstraint.push(id)
          this.physicsWorld.addP2PConstraint(id, peptide[index - 1].id, residue.id, 0, -2 * this.radius, 0, 0, 2 * this.radius, 0)
        }
      })
      y += 2 * this.radius
    })

    this.threeWorld.animate(this.physicsWorld)
  }

  public addPeptide(name: string, sequence: string) {
    let peptide = new Peptide()
    this.peptides.set(name, peptide)

    // iterate over each character of sequence
    for (const c of sequence) {
      peptide.push(new Residue(this.newID(), c))
    }
  }

  public addCrossLinks(crossLinks: string) {
    // the syntax is "name:num-name:num"
    // where name is a peptide name and num is a residue number
  }

  private newID(): string {
    return nanoid(8)
  }
}
