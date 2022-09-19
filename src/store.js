import Vue from "vue";
import Vuex from "vuex";
import { Dimensioning } from "./dimensioning";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  FogExp2,
  Mesh,
  DirectionalLight,
  AmbientLight,
  SphereGeometry,
  AxesHelper,
  BoxGeometry,
  ShadowMaterial,
  InstancedMesh,
  DynamicDrawUsage,
  MeshLambertMaterial,
  sRGBEncoding,
  CylinderGeometry,
  Vector2,
} from "three";
import { AmmoPhysics } from "./ammo.physics";
import { OrbitControls } from "./OrbitControls";
import { addPeptideConstraint } from "./constraint";
import {
  acidHex,
  ballHex,
  socketHex,
  fogHex,
  lightAHex,
  lightBHex,
  lightCHex,
  tempColor,
  hoverColor,
  activeColor,
  floorColor,
  backColor,
  acidColor,
  normalVecZ,
  tempMultiMatrix,
  tempMatrix1,
  tempMatrix2,
  raycaster,
  acidMass,
  ballMass,
  socketMass,
} from "./constants";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    width: 0,
    height: 0,
    camera: null,
    controls: null,
    scene: null,
    renderer: null,
    pyramids: [],
    controlInfo: {},
    pointer: new Vector2(),
    acidInstMeshes: [],
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
      state.scene.background = backColor;
      state.scene.fog = new FogExp2(fogHex, 0.002);

      // lights
      const lightA = new DirectionalLight(lightAHex);
      lightA.position.set(1, 1, 1);
      state.scene.add(lightA);
      const lightB = new DirectionalLight(lightBHex);
      lightB.position.set(-1, -1, -1);
      state.scene.add(lightB);
      const lightC = new AmbientLight(lightCHex);
      state.scene.add(lightC);

      // Floor
      const floor = new Mesh(
        new BoxGeometry(1000, 5, 1000),
        new ShadowMaterial({ color: floorColor })
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
      const distance = Dimensioning.cmToMeasureRaw({
        cm: state.controlInfo.distance,
      });
      const height = Dimensioning.cmToMeasureRaw({
        cm: 10,
      });

      // Prepare to draw peptides.
      const acidGeometry = new SphereGeometry(aminoAcidRadius, 30, 30);
      const ballGeometry = new SphereGeometry(aminoAcidRadius / 5, 6, 6);
      const aAcids = state.controlInfo.chains.a.split("");
      const chainALength =
        (aminoAcidRadius * 2 + jointLength) * (aAcids.length - 1);

      // Add chain a acids.
      const aAcidMaterial = new MeshLambertMaterial({});
      const aAcidInstMesh = new InstancedMesh(
        acidGeometry,
        aAcidMaterial,
        aAcids.length
      );
      aAcidInstMesh.instanceMatrix.setUsage(DynamicDrawUsage);
      aAcidInstMesh.castShadow = true;
      aAcidInstMesh.receiveShadow = true;
      state.acidInstMeshes.push(aAcidInstMesh);
      state.scene.add(aAcidInstMesh);

      // Add chain a balls.
      const aBallMaterial = new MeshLambertMaterial({});
      const aBallInstMesh = new InstancedMesh(
        ballGeometry,
        aBallMaterial,
        (aAcids.length - 1) * 2
      );
      aBallInstMesh.instanceMatrix.setUsage(DynamicDrawUsage);
      aBallInstMesh.castShadow = true;
      aBallInstMesh.receiveShadow = true;
      state.scene.add(aBallInstMesh);

      // Add chain a sockets.
      const aSocketGeometry = new CylinderGeometry(
        aminoAcidRadius / 10,
        aminoAcidRadius / 10,
        jointLength
      );
      const aSocketMaterial = new MeshLambertMaterial({});
      const aSocketInstMesh = new InstancedMesh(
        aSocketGeometry,
        aSocketMaterial,
        aAcids.length - 1
      );
      aSocketInstMesh.instanceMatrix.setUsage(DynamicDrawUsage);
      aSocketInstMesh.castShadow = true;
      aSocketInstMesh.receiveShadow = true;
      state.scene.add(aSocketInstMesh);

      // Set position of the elements.
      aAcids.forEach((char, index) => {
        const acidPosX =
          -chainALength / 2 + (aminoAcidRadius * 2 + jointLength) * index;
        const startBallIndex = index * 2 - 1;
        const startBallPosX = acidPosX - aminoAcidRadius;
        const endBallIndex = startBallIndex + 1;
        const endBallPosX = acidPosX + aminoAcidRadius;
        const jointPosX = acidPosX + aminoAcidRadius + jointLength / 2;

        aAcidInstMesh.setMatrixAt(
          index,
          tempMatrix1.setPosition(acidPosX, height, distance / 2)
        );
        aAcidInstMesh.setColorAt(index, tempColor.setHex(acidHex));

        if (index > 0) {
          aBallInstMesh.setMatrixAt(
            startBallIndex,
            tempMatrix1.setPosition(startBallPosX, height, distance / 2)
          );
          aBallInstMesh.setColorAt(startBallIndex, tempColor.setHex(ballHex));
        }

        if (index < aAcids.length - 1) {
          aBallInstMesh.setMatrixAt(
            endBallIndex,
            tempMatrix1.setPosition(endBallPosX, height, distance / 2)
          );
          aBallInstMesh.setColorAt(endBallIndex, tempColor.setHex(ballHex));

          aSocketInstMesh.setMatrixAt(
            index,
            tempMultiMatrix.multiplyMatrices(
              tempMatrix1.setPosition(jointPosX, height, distance / 2),
              tempMatrix2.makeRotationAxis(normalVecZ, Math.PI / 2)
            )
          );
          aSocketInstMesh.setColorAt(index, tempColor.setHex(socketHex));
        }
      });

      const aAcidBodies = state.ammoPhysics.addMesh(aAcidInstMesh, acidMass)
        .bodies;
      const aBallBodies = state.ammoPhysics.addMesh(aBallInstMesh, ballMass)
        .bodies;
      const aSocketBodies = state.ammoPhysics.addMesh(
        aSocketInstMesh,
        socketMass
      ).bodies;
      addPeptideConstraint({
        ammoPhysics: state.ammoPhysics,
        acidBodies: aAcidBodies,
        ballBodies: aBallBodies,
        socketBodies: aSocketBodies,
        acidRadius: aminoAcidRadius,
        jointLength,
      });
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
        state.camera.position.set(
          Dimensioning.cmToMeasureRaw({ cm: x }),
          Dimensioning.cmToMeasureRaw({ cm: y }),
          Dimensioning.cmToMeasureRaw({ cm: z })
        );
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
    SET_POINTER(state, pointer) {
      state.pointer = pointer;
    },
  },
  actions: {
    INIT_SCENE({ state, commit }, { width, height, el }) {
      return new Promise(async (resolve) => {
        // AmmoPhysics
        state.ammoPhysics = await AmmoPhysics({ gravity: 98 });

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

        // Handle raycaster.
        if (state.acidInstMeshes.length) {
          state.acidInstMeshes.forEach((acidInstMesh) => {
            for (let i = 0; i < acidInstMesh.count; i++) {
              acidInstMesh.setColorAt(i, acidColor);
              acidInstMesh.instanceColor.needsUpdate = true;
            }
          });

          raycaster.setFromCamera(state.pointer, state.camera);
          const intersects = raycaster.intersectObjects(
            state.acidInstMeshes,
            true
          );

          if (intersects.length) {
            intersects[0].object.setColorAt(
              intersects[0].instanceId,
              hoverColor
            );
            intersects[0].object.instanceColor.needsUpdate = true;
          }
        }

        state.renderer.render(state.scene, state.camera);
      });
    },
  },
});
