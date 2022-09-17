import Vue from "vue";
import Vuex from "vuex";
import { Dimensioning } from "./dimensioning";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  FogExp2,
  MeshPhongMaterial,
  Mesh,
  DirectionalLight,
  AmbientLight,
  Vector3,
  SphereGeometry,
  AxesHelper,
  CatmullRomCurve3,
  TubeGeometry,
  BoxGeometry,
  ShadowMaterial,
  InstancedMesh,
  DynamicDrawUsage,
  Matrix4,
  MeshLambertMaterial,
  sRGBEncoding,
} from "three";
import { AmmoPhysics } from "./AmmoPhysics";
import { OrbitControls } from "./OrbitControls";

Vue.use(Vuex);
const matrix = new Matrix4();
const color = new Color();

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
      state.renderer.shadowMap.enabled = true;
      state.renderer.outputEncoding = sRGBEncoding;
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
      state.camera.position.z = Dimensioning.cmToMeasureRaw({ cm: 50 });
    },
    INITIALIZE_CONTROLS(state) {
      state.controls = new OrbitControls(
        state.camera,
        state.renderer.domElement
      );
      state.controls.rotateSpeed = 1.0;
      state.controls.zoomSpeed = 1.2;
      state.controls.panSpeed = 0.8;
      state.controls.enableZoom = true;
      state.controls.enablePan = true;
    },
    INITIALIZE_SCENE(state) {
      state.scene = new Scene();
      state.scene.background = new Color(0x666666);
      state.scene.fog = new FogExp2(0xcccccc, 0.002);

      // lights
      const lightA = new DirectionalLight(0xffffff);
      lightA.position.set(1, 1, 1);
      state.scene.add(lightA);
      const lightB = new DirectionalLight(0x002288);
      lightB.position.set(-1, -1, -1);
      state.scene.add(lightB);
      const lightC = new AmbientLight(0x222222);
      state.scene.add(lightC);

      // Floor
      const floor = new Mesh(
        new BoxGeometry(1000, 5, 1000),
        new ShadowMaterial({ color: 0x111111 })
      );
      floor.position.y = -2.5;
      // floor.rotateX(0.3);
      floor.receiveShadow = true;
      state.scene.add(floor);
      state.ammoPhysics.addMesh(floor);

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
        cm: 10,
      });

      const geometry = new SphereGeometry(aminoAcidRadius, 30, 30);

      // Add chain A acids.
      const aAcidMaterial = new MeshLambertMaterial({});
      const aAcids = state.controlInfo.chains.a.split("");
      const chainALength =
        (aminoAcidRadius * 2 + jointLength) * (aAcids.length - 1);
      const aAcidInstMesh = new InstancedMesh(
        geometry,
        aAcidMaterial,
        aAcids.length
      );
      aAcidInstMesh.instanceMatrix.setUsage(DynamicDrawUsage);
      aAcidInstMesh.castShadow = true;
      aAcidInstMesh.receiveShadow = true;
      state.chainObjects.a = aAcidInstMesh;
      state.scene.add(aAcidInstMesh);

      aAcids.forEach((char, index) => {
        aAcidInstMesh.setMatrixAt(
          index,
          matrix.setPosition(
            -chainALength / 2 + (aminoAcidRadius * 2 + jointLength) * index,
            height,
            distance / 2
          )
        );
        aAcidInstMesh.setColorAt(index, color.setHex(0xffff00));
      });

      state.ammoPhysics.addMesh(aAcidInstMesh, 1);

      // // Add chain A joints.
      // const aJointSpline = new CatmullRomCurve3([
      //   new Vector3(-chainALength / 2, height, distance / 2),
      //   new Vector3(chainALength / 2, height, distance / 2),
      // ]);
      // const aJointGeometry = new TubeGeometry(aJointSpline, 30, jointRadius);
      // const aJointMaterial = new MeshPhongMaterial({
      //   color: 0xff0000,
      //   flatShading: true,
      // });
      // const aJointMesh = new Mesh(aJointGeometry, aJointMaterial);
      // // aJointMesh.updateMatrix();
      // // aJointMesh.matrixAutoUpdate = false;
      // state.scene.add(aJointMesh);
    },
    RESIZE(state, { width, height }) {
      state.width = width;
      state.height = height;
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(width, height);
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
    },
    SHOW_AXIS_LINES(state) {
      state.scene.add(...state.axisLines);
    },
    // HIDE_PYRAMIDS(state) {
    //   state.scene.remove(...state.pyramids);
    // },
    // SHOW_PYRAMIDS(state) {
    //   state.scene.add(...state.pyramids);
    // },
  },
  actions: {
    INIT_SCENE({ state, commit }, { width, height, el }) {
      return new Promise(async (resolve) => {
        // AmmoPhysics
        state.ammoPhysics = await AmmoPhysics();

        commit("SET_VIEWPORT_SIZE", { width, height });
        commit("INITIALIZE_RENDERER", el);
        commit("INITIALIZE_CAMERA");
        commit("INITIALIZE_CONTROLS");
        commit("INITIALIZE_SCENE");

        resolve();
      });
    },
    ANIMATE({ state, dispatch }) {
      window.requestAnimationFrame(() => {
        dispatch("ANIMATE");
        state.renderer.render(state.scene, state.camera);
      });
    },
  },
});
