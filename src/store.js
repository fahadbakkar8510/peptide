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
  AxesHelper,
  BoxGeometry,
  ShadowMaterial,
  sRGBEncoding,
  Vector2,
} from "three";
import { AmmoPhysics } from "./ammo.physics";
import { OrbitControls } from "./orbit.controls";
import { addBondConstraint, addPeptideConstraint } from "./constraints";
import {
  ballHex,
  socketHex,
  fogHex,
  lightAHex,
  lightBHex,
  lightCHex,
  tempColor,
  floorColor,
  backColor,
  normalVecZ,
  tempMultiMatrix,
  tempMatrix1,
  tempMatrix2,
  raycaster,
  acidMass,
  ballMass,
  socketMass,
  maxTextureImageUnits,
  floatingHeight,
  gravity,
} from "./constants";
import {
  getAcidInstMeshes,
  getCylinderInstMesh,
  getSphereInstMesh,
} from "./meshes";
import { getTextTexture } from "./common";

Vue.use(Vuex);

const formPeptide = ({
  chars,
  acidRadius,
  jointLength,
  acidInstMeshes,
  ballInstMesh,
  socketInstMesh,
  y,
  z,
}) => {
  const chainLength = (acidRadius * 2 + jointLength) * (chars.length - 1);

  chars.forEach((char, index) => {
    const acidPosX = -chainLength / 2 + (acidRadius * 2 + jointLength) * index;
    const startBallIndex = index * 2 - 1;
    const startBallPosX = acidPosX - acidRadius;
    const endBallIndex = startBallIndex + 1;
    const endBallPosX = acidPosX + acidRadius;
    const jointPosX = acidPosX + acidRadius + jointLength / 2;
    const acidInstMeshIndex = parseInt(index / maxTextureImageUnits);
    const acidIndex = index % maxTextureImageUnits;

    acidInstMeshes[acidInstMeshIndex].setMatrixAt(
      acidIndex,
      tempMatrix1.setPosition(acidPosX, y, z)
    );

    if (index > 0) {
      ballInstMesh.setMatrixAt(
        startBallIndex,
        tempMatrix1.setPosition(startBallPosX, y, z)
      );
      ballInstMesh.setColorAt(startBallIndex, tempColor.setHex(ballHex));
    }

    if (index < chars.length - 1) {
      ballInstMesh.setMatrixAt(
        endBallIndex,
        tempMatrix1.setPosition(endBallPosX, y, z)
      );
      ballInstMesh.setColorAt(endBallIndex, tempColor.setHex(ballHex));

      socketInstMesh.setMatrixAt(
        index,
        tempMultiMatrix.multiplyMatrices(
          tempMatrix1.setPosition(jointPosX, y, z),
          tempMatrix2.makeRotationAxis(normalVecZ, Math.PI / 2)
        )
      );
      socketInstMesh.setColorAt(index, tempColor.setHex(socketHex));
    }
  });
};

const generatePeptide = ({ state, chars, acidRadius, jointLength, y, z }) => {
  const socketRadius = acidRadius / 10;

  // Add acids.
  const { acidInstMeshes, textTextures } = getAcidInstMeshes({
    radius: acidRadius,
    chars,
  });
  textTextures[0][0] = getTextTexture({ text: "A", backColor: "#ff0000" });
  state.acidInstMeshes.push(...acidInstMeshes);
  state.scene.add(...acidInstMeshes);

  // Add balls.
  const ballInstMesh = getSphereInstMesh({
    radius: acidRadius / 5,
    count: (chars.length - 1) * 2,
  });
  state.scene.add(ballInstMesh);

  // Add sockets.
  const socketInstMesh = getCylinderInstMesh({
    topRadius: socketRadius,
    bottomRadius: socketRadius,
    height: jointLength,
    count: chars.length - 1,
  });
  state.scene.add(socketInstMesh);

  // Form peptide.
  formPeptide({
    chars,
    acidRadius,
    jointLength,
    acidInstMeshes,
    ballInstMesh,
    socketInstMesh,
    y,
    z,
  });

  // Add constraint.
  let acidBodies = [];
  acidInstMeshes.forEach((acidInstMesh, index) => {
    const individualMasses = [];
    if (index === 0) {
      individualMasses.push(0);
    }
    // if (index === acidInstMeshes.length - 1) {
    //   individualMasses[acidInstMesh.count - 1] = 0;
    // }

    acidBodies.push(
      ...state.ammoPhysics.addMesh({
        mesh: acidInstMesh,
        mass: acidMass,
        individualMasses,
      }).bodies
    );
  });
  const ballBodies = state.ammoPhysics.addMesh({
    mesh: ballInstMesh,
    mass: ballMass,
  }).bodies;
  const socketBodies = state.ammoPhysics.addMesh({
    mesh: socketInstMesh,
    mass: socketMass,
  }).bodies;

  addPeptideConstraint({
    ammoPhysics: state.ammoPhysics,
    acidBodies,
    ballBodies,
    socketBodies,
    acidRadius,
    jointLength,
  });

  return {
    acidInstMeshes,
    ballInstMesh,
    socketInstMesh,
    acidBodies,
    ballBodies,
    socketBodies,
  };
};

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
      state.renderer.shadowMap.enabled = false;
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
      const floorMesh = new Mesh(
        new BoxGeometry(1000, 5, 1000),
        new ShadowMaterial({ color: floorColor })
      );
      floorMesh.position.y = -2.5;
      // floorMesh.rotateX(0.3);
      floorMesh.receiveShadow = true;
      state.scene.add(floorMesh);
      state.ammoPhysics.addMesh({ mesh: floorMesh });

      // AxesHelper
      state.scene.add(new AxesHelper(100));
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
        cm: floatingHeight,
      });

      // Generate a peptide.
      const aAcids = state.controlInfo.chains.a.split("");
      const aPeptideInfo = generatePeptide({
        state,
        chars: aAcids,
        acidRadius: aminoAcidRadius,
        jointLength,
        y: height,
        z: distance / 2,
      });

      // Generate b peptide.
      const bAcids = state.controlInfo.chains.b.split("");
      const bPeptideInfo = generatePeptide({
        state,
        chars: bAcids,
        acidRadius: aminoAcidRadius,
        jointLength,
        y: height,
        z: -distance / 2,
      });

      addBondConstraint({
        state,
        aPeptideInfo,
        bPeptideInfo,
        crossLinks: state.controlInfo.cross_links,
        acidRadius: aminoAcidRadius,
        jointLength: jointLength / 2,
        y: height,
        z: -distance / 2,
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
        state.ammoPhysics = await AmmoPhysics({ gravity });

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
          // state.acidInstMeshes.forEach((acidInstMeshes) => {
          //   for (let i = 0; i < acidInstMeshes.count; i++) {
          //     acidInstMeshes.setColorAt(i, acidColor);
          //     acidInstMeshes.instanceColor.needsUpdate = true;
          //   }
          // });

          raycaster.setFromCamera(state.pointer, state.camera);
          const intersects = raycaster.intersectObjects(
            state.acidInstMeshes,
            true
          );

          if (intersects.length) {
            console.log(intersects[0].object);
            intersects[0].object.setColorAt(
              intersects[0].instanceId,
              tempColor.setHex(0xff0000)
            );
            intersects[0].object.instanceColor.needsUpdate = true;
          }
        }

        state.renderer.render(state.scene, state.camera);
      });
    },
  },
});
