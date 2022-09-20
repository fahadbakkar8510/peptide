import { getAlphaOnly } from "./common";
import {
  ballHex,
  ballMass,
  socketHex,
  socketMass,
  tempColor,
} from "./constants";
import { getCylinderInstMesh, getSphereInstMesh } from "./meshes";

export const addPeptideConstraint = ({
  ammoPhysics,
  acidBodies,
  ballBodies,
  socketBodies,
  acidRadius,
  jointLength,
}) => {
  const ammo = ammoPhysics.AmmoLib;
  const physicsWorld = ammoPhysics.physicsWorld;
  let acidPivot, ballPivot, socketPivot, p2p;
  ballPivot = new ammo.btVector3(0, 0, 0);

  acidBodies.forEach((acidBody, index) => {
    const startBallIndex = index * 2 - 1;
    const endBallIndex = startBallIndex + 1;

    if (index > 0) {
      acidPivot = new ammo.btVector3(-acidRadius, 0, 0);
      p2p = new ammo.btPoint2PointConstraint(
        ballBodies[startBallIndex],
        acidBody,
        ballPivot,
        acidPivot
      );
      physicsWorld.addConstraint(p2p, true);

      socketPivot = new ammo.btVector3(0, jointLength / 2, 0);
      p2p = new ammo.btPoint2PointConstraint(
        socketBodies[index - 1],
        ballBodies[startBallIndex],
        socketPivot,
        ballPivot
      );
      physicsWorld.addConstraint(p2p, true);
    }

    if (index < acidBodies.length - 1) {
      acidPivot = new ammo.btVector3(acidRadius, 0, 0);
      p2p = new ammo.btPoint2PointConstraint(
        acidBody,
        ballBodies[endBallIndex],
        acidPivot,
        ballPivot
      );
      physicsWorld.addConstraint(p2p, true);

      socketPivot = new ammo.btVector3(0, -jointLength / 2, 0);
      p2p = new ammo.btPoint2PointConstraint(
        ballBodies[endBallIndex],
        socketBodies[index],
        ballPivot,
        socketPivot
      );
      physicsWorld.addConstraint(p2p, true);
    }
  });
};

export const addBondConstraint = ({
  state,
  aPeptideInfo,
  bPeptideInfo,
  crossLinks,
  acidRadius,
  jointLength,
}) => {
  crossLinks = crossLinks.split(";");
  let p2p;
  const ammo = state.ammoPhysics.AmmoLib;
  const physicsWorld = state.ammoPhysics.physicsWorld;
  const socketRadius = acidRadius / 10;
  let acidAPivot = new ammo.btVector3(0, 0, -acidRadius);
  let acidBPivot = new ammo.btVector3(0, 0, acidRadius);
  let acidSamePivot = new ammo.btVector3(0, acidRadius, 0);
  let ballPivot = new ammo.btVector3(0, 0, 0);
  let socketAPivot = new ammo.btVector3(0, -jointLength / 2, 0);
  let socketBPivot = new ammo.btVector3(0, jointLength / 2, 0);

  // Add balls.
  const ballInstMesh = getSphereInstMesh({
    radius: acidRadius / 5,
    count: crossLinks.length * 2,
  });
  state.scene.add(ballInstMesh);
  for (let i = 0; i < ballInstMesh.count; i++) {
    ballInstMesh.setColorAt(i, tempColor.setHex(ballHex));
  }

  // Add sockets.
  const socketInstMesh = getCylinderInstMesh({
    topRadius: socketRadius,
    bottomRadius: socketRadius,
    height: jointLength,
    count: crossLinks.length,
  });
  state.scene.add(socketInstMesh);
  for (let i = 0; i < socketInstMesh.count; i++) {
    socketInstMesh.setColorAt(i, tempColor.setHex(socketHex));
  }

  // Add meshes to the physics.
  const ballBodies = state.ammoPhysics.addMesh({
    mesh: ballInstMesh,
    mass: ballMass,
  }).bodies;
  const socketBodies = state.ammoPhysics.addMesh({
    mesh: socketInstMesh,
    mass: socketMass,
  }).bodies;
  const acidABodies = aPeptideInfo.acidBodies;
  const acidBBodies = bPeptideInfo.acidBodies;

  crossLinks.forEach((crossLink, index) => {
    const acids = crossLink.split("-");
    const acid0Locs = acids[0].split(":");
    const chain0 = acid0Locs[0].toLowerCase();
    const acid0Char = getAlphaOnly(acid0Locs[1]);
    const acid0Num = parseInt(acid0Locs[1].match(/(\d+)/)[0]);
    if (acid0Char !== state.controlInfo.chains[chain0][acid0Num - 1]) return;
    const acid1Locs = acids[1].split(":");
    const chain1 = acid1Locs[0].toLowerCase();
    const acid1Char = getAlphaOnly(acid1Locs[1]);
    const acid1Num = parseInt(acid1Locs[1].match(/(\d+)/)[0]);
    if (acid1Char !== state.controlInfo.chains[chain1][acid1Num - 1]) return;
    const aBallIndex = index * 2;
    const bBallIndex = aBallIndex + 1;

    if (chain0 === chain1) {
      const acidBodies = chain0 === "a" ? acidABodies : acidBBodies;
      const acid0Index = acid0Num - 1;
      const acid1Index = acid1Num - 1;

      p2p = new ammo.btPoint2PointConstraint(
        acidBodies[acid0Index],
        ballBodies[aBallIndex],
        acidSamePivot,
        ballPivot
      );
      physicsWorld.addConstraint(p2p, true);

      p2p = new ammo.btPoint2PointConstraint(
        ballBodies[aBallIndex],
        socketBodies[index],
        ballPivot,
        socketAPivot
      );
      physicsWorld.addConstraint(p2p, true);

      p2p = new ammo.btPoint2PointConstraint(
        socketBodies[index],
        ballBodies[bBallIndex],
        socketBPivot,
        ballPivot
      );
      physicsWorld.addConstraint(p2p, true);

      p2p = new ammo.btPoint2PointConstraint(
        ballBodies[bBallIndex],
        acidBodies[acid1Index],
        ballPivot,
        acidSamePivot
      );
      physicsWorld.addConstraint(p2p, true);
    } else {
      let acidAIndex, acidBIndex;

      if (chain0 === "a") {
        acidAIndex = acid0Num;
        acidBIndex = acid1Num;
      } else {
        acidAIndex = acid1Num;
        acidBIndex = acid0Num;
      }

      acidAIndex -= 1;
      acidBIndex -= 1;

      p2p = new ammo.btPoint2PointConstraint(
        acidABodies[acidAIndex],
        ballBodies[aBallIndex],
        acidAPivot,
        ballPivot
      );
      physicsWorld.addConstraint(p2p, true);

      p2p = new ammo.btPoint2PointConstraint(
        ballBodies[aBallIndex],
        socketBodies[index],
        ballPivot,
        socketAPivot
      );
      physicsWorld.addConstraint(p2p, true);

      p2p = new ammo.btPoint2PointConstraint(
        socketBodies[index],
        ballBodies[bBallIndex],
        socketBPivot,
        ballPivot
      );
      physicsWorld.addConstraint(p2p, true);

      p2p = new ammo.btPoint2PointConstraint(
        ballBodies[bBallIndex],
        acidBBodies[acidBIndex],
        ballPivot,
        acidBPivot
      );
      physicsWorld.addConstraint(p2p, true);
    }
  });
};
