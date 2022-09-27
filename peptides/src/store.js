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
import { DragControls } from "./drag.controls";
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
  hoverHexStr,
  acidHexStr,
  tempPos1,
  tempPos2,
  activeHexStr,
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
    iteration: state.iteration++,
  });
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
  const acidBodies = [];
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

  state.acidInstMeshes.push(...acidInstMeshes);
  state.acidChunkTextures.push(textTextures);

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
    orbitControls: null,
    dragControls: null,
    scene: null,
    renderer: null,
    pyramids: [],
    controlInfo: {},
    pointer: new Vector2(),
    acidInstMeshes: [],
    acidChunkTextures: [],
    mouseDown: false,
    hoverTextureKeys: [],
    hoverAcidMesh: null,
    hoverAcidInstId: null,
    iteration: 0,
    cursor: null,
    prevPos: null,
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
      state.orbitControls = new OrbitControls(
        state.camera,
        state.renderer.domElement
      );
      state.orbitControls.rotateSpeed = 1.0;
      state.orbitControls.zoomSpeed = 1.2;
      state.orbitControls.panSpeed = 0.8;
      state.orbitControls.enableZoom = true;
      state.orbitControls.enablePan = true;
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

      // // Floor
      // const floorMesh = new Mesh(
      //   new BoxGeometry(1000, 5, 1000),
      //   new ShadowMaterial({ color: floorColor })
      // );
      // floorMesh.position.y = -2.5;
      // // floorMesh.rotateX(0.3);
      // floorMesh.receiveShadow = true;
      // state.scene.add(floorMesh);
      // state.ammoPhysics.addMesh({ mesh: floorMesh });

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

      state.dragControls = new DragControls(
        [...aPeptideInfo.acidInstMeshes, ...bPeptideInfo.acidInstMeshes],
        state.camera,
        state.renderer.domElement,
        state.ammoPhysics.AmmoLib
      );
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
        state.orbitControls.target.set(0, 0, 0);
      }
    },
    SET_POINTER(state, pointer) {
      state.pointer = pointer;
    },
    SET_LEFT_MOUSE_DOWN(state, flag) {
      // console.log("mousedown: ", flag);
      state.mouseDown = flag;

      if (state.hoverTextureKeys.length === 3) {
        state.acidChunkTextures[state.hoverTextureKeys[0]][
          state.hoverTextureKeys[1]
        ][state.hoverTextureKeys[2]] = getTextTexture({
          text: state.hoverAcidMesh.chars[state.hoverAcidInstId],
          backColor: flag ? activeHexStr : hoverHexStr,
        });
      }
    },
    SET_CURSOR(state, cursor) {
      state.cursor = cursor;
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
    ANIMATE({ state, dispatch, commit }) {
      window.requestAnimationFrame(() => {
        dispatch("ANIMATE");

        // Handle raycaster.
        raycaster.setFromCamera(state.pointer, state.camera);
        const intersects = raycaster.intersectObjects(
          state.acidInstMeshes,
          false
        );

        if (intersects.length) {
          if (state.mouseDown) {
          } else {
            const hoverAcidInstMesh = intersects[0].object;
            const selPeptideIteration = hoverAcidInstMesh.iteration;
            const selAcidInstMeshIndex = hoverAcidInstMesh.instMeshIndex;
            const hoverAcidInstId = intersects[0].instanceId;
            state.hoverAcidInstId = hoverAcidInstId;
            const selAcidChar = hoverAcidInstMesh.chars[hoverAcidInstId];

            if (state.hoverAcidMesh != hoverAcidInstMesh) {
              // console.log("Hover in from other.");
              if (state.hoverTextureKeys.length === 3) {
                state.acidChunkTextures[state.hoverTextureKeys[0]][
                  state.hoverTextureKeys[1]
                ][state.hoverTextureKeys[2]] = getTextTexture({
                  text: selAcidChar,
                  backColor: acidHexStr,
                });
              }

              state.acidChunkTextures[selPeptideIteration][
                selAcidInstMeshIndex
              ][hoverAcidInstId] = getTextTexture({
                text: selAcidChar,
                backColor: hoverHexStr,
              });
              state.hoverTextureKeys = [
                selPeptideIteration,
                selAcidInstMeshIndex,
                hoverAcidInstId,
              ];
              state.hoverAcidMesh = hoverAcidInstMesh;
              state.orbitControls.enableRotate = false;
              commit("SET_CURSOR", "pointer");
            }
          }
        } else {
          if (
            !state.mouseDown &&
            state.hoverAcidMesh &&
            state.hoverTextureKeys.length === 3
          ) {
            // console.log("hover out");
            const selAcidChar =
              state.hoverAcidMesh.chars[state.hoverTextureKeys[2]];
            state.acidChunkTextures[state.hoverTextureKeys[0]][
              state.hoverTextureKeys[1]
            ][state.hoverTextureKeys[2]] = getTextTexture({
              text: selAcidChar,
              backColor: acidHexStr,
            });
            state.hoverTextureKeys = [];
            state.hoverAcidMesh = null;
            state.orbitControls.enableRotate = true;
            commit("SET_CURSOR", "default");
          }
        }

        state.renderer.render(state.scene, state.camera);
      });
    },
  },
});
