// This class handles the abstract descriptions
// This is where we translate a textual description of a world into objects that should
// be rendered in 3D and simulated in the physics engine.
import { nanoid } from 'nanoid'

export interface ThreeInterface {
    addResidue(id: string, radius: number, x: number, y: number, z: number): void;
    transform(id: string, pos_x: number, pos_y: number, pos_z: number, quat_x: number, quat_y: number, quat_z: number, quat_w: number): void;
    transformP2P(id: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void;
    animate(physicsWorld: PhysicsInterface): void;
}

export interface PhysicsInterface {
    addResidue(id: string, radius: number, x: number, y: number, z: number, mass: number): void;
    addP2PConstraint(p2pId: string, id1: string, id2: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): void;
    stepSimulation(deltaTime: number): void;
    init(threeWorld: ThreeInterface): Promise<void>;
}

export class Residue {
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
    public id: string;
    public name: string
}

export class Peptide extends Array<Residue> {}
export class Peptides extends Map<string, Peptide> {}

export class DescWorld {
    private radius = 0.1; // for the moment, we'll just have a single common radius
    // later we'll want at least the option to specifyradii per amino acid    

    // the peptide map
    private peptides: Peptides = new Peptides();
    private p2pConstraint: Array<string> = new Array<string>(); 

    // reference to three world
    private threeWorld: ThreeInterface;
    // reference to physics world
    private physicsWorld: PhysicsInterface;

    constructor(threeWorld: ThreeInterface, stepable: PhysicsInterface) {
        this.threeWorld = threeWorld;
        this.physicsWorld = stepable;
    }

    public async start(): Promise<void> {
        await this.physicsWorld.init(this.threeWorld);
        let y = 0;
        this.peptides.forEach((peptide, key) => {
            let x = 0;
            peptide.forEach((residue, index) => {
                let mass = (index > 0) ? 1 : 0;
                this.threeWorld.addResidue(residue.id, this.radius, x, y, 0);
                this.physicsWorld.addResidue(residue.id, this.radius, x, y, 0, mass);
                x += 2 * this.radius;
                if (index > 0) {
                    let id = this.newID();
                    this.p2pConstraint.push(id);
                    this.physicsWorld.addP2PConstraint(id, peptide[index - 1].id, residue.id, 0, -2 * this.radius, 0, 0, 2 * this.radius, 0);
                }
            });
            //y += 2 * this.radius;
        });

        this.threeWorld.animate(this.physicsWorld);
    }

    public addPeptide(name: string, sequence: string) {
        let peptide = new Peptide();
        this.peptides.set(name, peptide);

        // iterate over each character of sequence
        for (const c of sequence) {
            peptide.push(new Residue(this.newID(), c));
        }
    }

    public addCrosslinks(crosslinks: string) {
        // the syntax is "name:num-name:num"
        // where name is a peptide name and num is a residue number

    }

    private newID(): string {
        return nanoid(8);
    }

}