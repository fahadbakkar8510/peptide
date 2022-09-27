import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import type { DescWorld, ThreeInterface, PhysicsInterface } from './DescWorld';

export class ThreeWorld implements ThreeInterface {
    private descWorld: DescWorld | undefined = undefined;
    private canvas: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private prev_render: number | null = null;
    // Map each peptide name to an array of meshes (one for each residue)
    private meshmap: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>();

    constructor(canvas: any) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        canvas.value.appendChild(this.renderer.domElement);

        // add orbit controls
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.camera.position.z = 5;
    }

    addResidue(id: string, radius: number, x: number, y: number, z: number): void
    {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        sphere.position.set(x, y, z);
        this.meshmap.set(id, sphere);
        this.scene.add(sphere);
    }

    // This is the method that will be called by the physics world instance
    // after getting world transform information from the physics engine. 
    public transform(id: string, pos_x: number, pos_y: number, pos_z: number, quat_x: number, quat_y: number, quat_z: number, quat_w: number) {
        const pos3 = new THREE.Vector3(pos_x, pos_y, pos_z);
        const quat3 = new THREE.Quaternion(quat_x, quat_y, quat_z, quat_w);
        let mesh = this.meshmap.get(id);
        if (mesh) {
            mesh.position.copy(pos3);
            mesh.quaternion.copy(quat3);
        }
    }

    public transformP2P(id: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
        const pos1 = new THREE.Vector3(x1, y1, z1);
        const pos2 = new THREE.Vector3(x2, y2, z2);
        let mesh = this.meshmap.get(id);
        if (mesh) {
            //mesh.position.copy(pos3);
            //mesh.quaternion.copy(quat3);
        }
    }

    public animate(physicsWorld: PhysicsInterface) {
        requestAnimationFrame((t) => {
            if (this.prev_render === null) {
                this.prev_render = t;
            }
            physicsWorld.stepSimulation((t - this.prev_render) / 1000);
            this.renderer.render(this.scene, this.camera);
            this.prev_render = t;
            this.animate(physicsWorld);
        });
    }

}