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
