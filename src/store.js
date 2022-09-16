import Vue from "vue";
import Vuex from "vuex";
import { Dimensioning } from "./dimensioning";
import {
  Scene,
  TrackballControls,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  FogExp2,
  CylinderBufferGeometry,
  MeshPhongMaterial,
  Mesh,
  DirectionalLight,
  AmbientLight,
  LineBasicMaterial,
  Geometry,
  Vector3,
  Line,
  SphereBufferGeometry,
  AxesHelper,
  CatmullRomCurve3,
  TubeBufferGeometry,
} from "three-full";
import { AmmoPhysics } from "./ammo/ammo";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    width: 0,
    height: 0,
    camera: null,
    controls: null,
    scene: null,
    renderer: null,
    axisLines: [],
    pyramids: [],
    controlInfo: {},
    chainObjects: {},
  },
  getters: {
    CAMERA_POSITION: (state) => {
      return state.camera ? state.camera.position : null;
    },
  },
  mutations: {
    SET_CHAINS(state, chains) {
      state.chains = chains;
    },
    SET_JOINT_LENGTH(state, length) {
      state.joint_length = length;
    },
    SET_DISTANCE(state, distance) {
      state.distance = distance;
    },
    SET_AMINO_ACID_RADIUS(state, aminoAcidRadius) {
      state.amino_acid_radius = aminoAcidRadius;
    },
    SET_VIEWPORT_SIZE(state, { width, height }) {
      state.width = width;
      state.height = height;
    },
    SET_CONTROL_INFO(state, controlInfo) {
      state.controlInfo = controlInfo;
    },
    INITIALIZE_RENDERER(state, el) {
      state.renderer = new WebGLRenderer({ antialias: true });
      state.renderer.setPixelRatio(window.devicePixelRatio);
      state.renderer.setSize(state.width, state.height);
      el.appendChild(state.renderer.domElement);
    },
    INITIALIZE_CAMERA(state) {
      state.camera = new PerspectiveCamera(
        // 1. Field of View (degrees)
        60,
        // 2. Aspect ratio
        state.width / state.height,
        // 3. Near clipping plane
        1,
        // 4. Far clipping plane
        1000
      );
      state.camera.position.z = 500;
    },
    INITIALIZE_CONTROLS(state) {
      state.controls = new TrackballControls(
        state.camera,
        state.renderer.domElement
      );
      state.controls.rotateSpeed = 1.0;
      state.controls.zoomSpeed = 1.2;
      state.controls.panSpeed = 0.8;
      state.controls.noZoom = false;
      state.controls.noPan = false;
      state.controls.staticMoving = true;
      state.controls.dynamicDampingFactor = 0.3;
      state.controls.keys = [65, 83, 68];
    },
    INITIALIZE_SCENE(state) {
      state.scene = new Scene();
      state.scene.background = new Color(0xcccccc);
      state.scene.fog = new FogExp2(0xcccccc, 0.002);

      // lights
      var lightA = new DirectionalLight(0xffffff);
      lightA.position.set(1, 1, 1);
      state.scene.add(lightA);
      var lightB = new DirectionalLight(0x002288);
      lightB.position.set(-1, -1, -1);
      state.scene.add(lightB);
      var lightC = new AmbientLight(0x222222);
      state.scene.add(lightC);

      // AxesHelper
      state.scene.add(new AxesHelper(1000));
    },
    GENERATE_PEPTIDES(state) {
      const aminoAcidRadius = Dimensioning.cmToMeasureRaw({
        cm: state.controlInfo.amino_acid_radius,
      });
      const jointLength = Dimensioning.cmToMeasureRaw({
        cm: state.controlInfo.joint_length,
      });
      const jointRadius = Dimensioning.cmToMeasureRaw({
        cm: state.controlInfo.joint_radius,
      });
      const distance = Dimensioning.cmToMeasureRaw({
        cm: state.controlInfo.distance,
      });
      const height = Dimensioning.cmToMeasureRaw({
        cm: 100,
      });
      const geometry = new SphereBufferGeometry(aminoAcidRadius, 30, 30);

      // Add chain A acids.
      const aAcidMaterial = new MeshPhongMaterial({
        color: 0xff0000,
        flatShading: true,
      });
      const aAcids = state.controlInfo.chains.a.split("");
      const chainALength =
        (aminoAcidRadius * 2 + jointLength) * (aAcids.length - 1);
      state.chainObjects.a = [];

      aAcids.forEach((char, index) => {
        const mesh = new Mesh(geometry, aAcidMaterial);
        mesh.position.x =
          -chainALength / 2 + (aminoAcidRadius * 2 + jointLength) * index;
        mesh.position.y = height;
        mesh.position.z = distance / 2;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        state.chainObjects.a.push(mesh);
      });

      state.scene.add(...state.chainObjects.a);

      // Add chain A joints.
      const aJointSpline = new CatmullRomCurve3([
        new Vector3(-chainALength / 2, height, distance / 2),
        new Vector3(chainALength / 2, height, distance / 2),
      ]);
      const aJointGeometry = new TubeBufferGeometry(
        aJointSpline,
        30,
        jointRadius
      );
      const aJointMaterial = new MeshPhongMaterial({
        color: 0xff0000,
        flatShading: true,
      });
      const aJointMesh = new Mesh(aJointGeometry, aJointMaterial);
      // aJointMesh.updateMatrix();
      // aJointMesh.matrixAutoUpdate = false;
      state.scene.add(aJointMesh);

      // Add chain B acids.
      const bAcidMaterial = new MeshPhongMaterial({
        color: 0x00ff00,
        flatShading: true,
      });
      const bAcids = state.controlInfo.chains.b.split("");
      const chainBLength =
        (aminoAcidRadius * 2 + jointLength) * (bAcids.length - 1);
      state.chainObjects.b = [];
      bAcids.forEach((char, index) => {
        const mesh = new Mesh(geometry, bAcidMaterial);
        mesh.position.x =
          -chainBLength / 2 + (aminoAcidRadius * 2 + jointLength) * index;
        mesh.position.y = height;
        mesh.position.z = -distance / 2;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        state.chainObjects.b.push(mesh);
      });
      state.scene.add(...state.chainObjects.b);

      // Add chain B joints.
      const bJointSpline = new CatmullRomCurve3([
        new Vector3(-chainBLength / 2, height, -distance / 2),
        new Vector3(chainBLength / 2, height, -distance / 2),
      ]);
      const bJointGeometry = new TubeBufferGeometry(
        bJointSpline,
        30,
        jointRadius
      );
      const bJointMaterial = new MeshPhongMaterial({
        color: 0x00ff00,
        flatShading: true,
      });
      const bJointMesh = new Mesh(bJointGeometry, bJointMaterial);
      // bJointMesh.updateMatrix();
      // bJointMesh.matrixAutoUpdate = false;
      state.scene.add(bJointMesh);

      state.renderer.render(state.scene, state.camera);
    },
    RESIZE(state, { width, height }) {
      state.width = width;
      state.height = height;
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(width, height);
      state.controls.handleResize();
      state.renderer.render(state.scene, state.camera);
    },
    SET_CAMERA_POSITION(state, { x, y, z }) {
      if (state.camera) {
        state.camera.position.set(x, y, z);
      }
    },
    RESET_CAMERA_ROTATION(state) {
      if (state.camera) {
        state.camera.rotation.set(0, 0, 0);
        state.camera.quaternion.set(0, 0, 0, 1);
        state.camera.up.set(0, 1, 0);
        state.controls.target.set(0, 0, 0);
      }
    },
    HIDE_AXIS_LINES(state) {
      state.scene.remove(...state.axisLines);
      state.renderer.render(state.scene, state.camera);
    },
    SHOW_AXIS_LINES(state) {
      state.scene.add(...state.axisLines);
      state.renderer.render(state.scene, state.camera);
    },
    // HIDE_PYRAMIDS(state) {
    //   state.scene.remove(...state.pyramids);
    //   state.renderer.render(state.scene, state.camera);
    // },
    // SHOW_PYRAMIDS(state) {
    //   state.scene.add(...state.pyramids);
    //   state.renderer.render(state.scene, state.camera);
    // },
  },
  actions: {
    INIT_SCENE({ state, commit }, { width, height, el }) {
      return new Promise(async (resolve) => {
        commit("SET_VIEWPORT_SIZE", { width, height });
        commit("INITIALIZE_RENDERER", el);
        commit("INITIALIZE_CAMERA");
        commit("INITIALIZE_CONTROLS");
        commit("INITIALIZE_SCENE");

        // AmmoPhysics
        state.ammoPhysics = await AmmoPhysics();

        // Initial scene rendering
        state.renderer.render(state.scene, state.camera);

        // Add an event listener that will re-render
        // the scene when the controls are changed
        state.controls.addEventListener("change", () => {
          state.renderer.render(state.scene, state.camera);
        });

        resolve();
      });
    },
    ANIMATE({ state, dispatch }) {
      window.requestAnimationFrame(() => {
        dispatch("ANIMATE");
        state.controls.update();
      });
    },
  },
});
