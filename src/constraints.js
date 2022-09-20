import { getAlphaOnly, getAngle } from "./common";

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
  y,
  z,
}) => {
  // console.log(aPeptideInfo, bPeptideInfo, crossLinks);
  const peptideInfos = {
    a: aPeptideInfo,
    b: bPeptideInfo,
  };
  crossLinks = crossLinks.split(";");

  crossLinks.forEach((crossLink) => {
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
    // console.log("acids: ", acids);
    // console.log("acid0Locs: ", acid0Locs);
    // console.log("chain0: ", chain0);
    // console.log("acid0Char: ", acid0Char);
    // console.log("acid0Num: ", acid0Num);
    // console.log("acid1Locs: ", acid1Locs);
    // console.log("chain1: ", chain1);
    // console.log("acid1Char: ", acid1Char);
    // console.log("acid1Num: ", acid1Num);
    // console.log(
    //   getAngle({ A: { x: 1, y: 1 }, B: { x: 3, y: 1 }, C: { x: 3, y: -2 } })
    // );
  });
};
