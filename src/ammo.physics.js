async function AmmoPhysics({ gravity }) {
  if ("Ammo" in window === false) {
    console.error("AmmoPhysics: Couldn't find Ammo.js");
    return;
  }

  const AmmoLib = await Ammo();
  const frameRate = 60;
  const worldTransform = new AmmoLib.btTransform();

  const collisionConfiguration = new AmmoLib.btDefaultCollisionConfiguration();
  const physicsDispatcher = new AmmoLib.btCollisionDispatcher(
    collisionConfiguration
  );
  const physicsBroadphase = new AmmoLib.btDbvtBroadphase();
  const physicsSolver = new AmmoLib.btSequentialImpulseConstraintSolver();
  const physicsWorld = new AmmoLib.btDiscreteDynamicsWorld(
    physicsDispatcher,
    physicsBroadphase,
    physicsSolver,
    collisionConfiguration
  );
  physicsWorld.setGravity(new AmmoLib.btVector3(0, -gravity, 0));

  function getShape(geometry) {
    const parameters = geometry.parameters;
    let shape = null,
      radius,
      radiusTop,
      radiusBottom,
      sx,
      sy,
      sz;

    switch (geometry.type) {
      case "BoxGeometry":
        sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
        sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
        sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;
        shape = new AmmoLib.btBoxShape(new AmmoLib.btVector3(sx, sy, sz));
        shape.setMargin(0.05);
        break;

      case "SphereGeometry":
      case "IcosahedronGeometry":
        radius = parameters.radius !== undefined ? parameters.radius : 1;
        shape = new AmmoLib.btSphereShape(radius);
        shape.setMargin(0.05);
        break;

      case "CylinderGeometry":
        radiusTop =
          parameters.radiusTop !== undefined ? parameters.radiusTop : 1;
        radiusBottom =
          parameters.radiusBottom !== undefined ? parameters.radiusBottom : 1;
        sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
        shape = new AmmoLib.btCylinderShape(
          new AmmoLib.btVector3(radiusTop, radiusBottom, sy)
        );
        shape.setMargin(0.05);
        break;
    }

    return shape;
  }

  const meshes = [];
  const meshMap = new WeakMap();

  function addMesh({ mesh, mass = 0, individualMasses = [] }) {
    const shape = getShape(mesh.geometry);

    if (shape !== null) {
      if (mesh.isInstancedMesh) {
        return handleInstancedMesh({ mesh, mass, shape, individualMasses });
      } else if (mesh.isMesh) {
        return handleMesh({ mesh, mass, shape });
      }
    }
  }

  function handleMesh({ mesh, mass, shape }) {
    const position = mesh.position;
    const quaternion = mesh.quaternion;

    const transform = new AmmoLib.btTransform();
    transform.setIdentity();
    transform.setOrigin(
      new AmmoLib.btVector3(position.x, position.y, position.z)
    );
    transform.setRotation(
      new AmmoLib.btQuaternion(
        quaternion.x,
        quaternion.y,
        quaternion.z,
        quaternion.w
      )
    );

    const motionState = new AmmoLib.btDefaultMotionState(transform);

    const localInertia = new AmmoLib.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
      mass,
      motionState,
      shape,
      localInertia
    );

    const body = new AmmoLib.btRigidBody(rbInfo);
    body.setFriction(50);
    body.setDamping(0.8, 0.8);
    physicsWorld.addRigidBody(body);
    mesh.userData.physicsBody = body;

    if (mass > 0) {
      meshes.push(mesh);
      meshMap.set(mesh, body);
    }

    return { body };
  }

  function handleInstancedMesh({ mesh, mass, shape, individualMasses }) {
    const array = mesh.instanceMatrix.array;
    const bodies = [];

    for (let i = 0; i < mesh.count; i++) {
      const index = i * 16;
      const realMass =
        individualMasses[i] === undefined ? mass : individualMasses[i];

      const transform = new AmmoLib.btTransform();
      transform.setFromOpenGLMatrix(array.slice(index, index + 16));

      const motionState = new AmmoLib.btDefaultMotionState(transform);

      const localInertia = new AmmoLib.btVector3(0, 0, 0);
      shape.calculateLocalInertia(realMass, localInertia);

      const rbInfo = new AmmoLib.btRigidBodyConstructionInfo(
        realMass,
        motionState,
        shape,
        localInertia
      );

      const body = new AmmoLib.btRigidBody(rbInfo);
      physicsWorld.addRigidBody(body);

      bodies.push(body);
    }

    mesh.userData.physicsBodies = bodies;

    if (mass > 0) {
      meshes.push(mesh);
      meshMap.set(mesh, bodies);
    }

    return { bodies };
  }

  function setMeshPosition(mesh, position, index = 0) {
    if (mesh.isInstancedMesh) {
      const bodies = meshMap.get(mesh);
      const body = bodies[index];

      body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
      body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

      worldTransform.setIdentity();
      worldTransform.setOrigin(
        new AmmoLib.btVector3(position.x, position.y, position.z)
      );
      body.setWorldTransform(worldTransform);
    } else if (mesh.isMesh) {
      const body = meshMap.get(mesh);

      body.setAngularVelocity(new AmmoLib.btVector3(0, 0, 0));
      body.setLinearVelocity(new AmmoLib.btVector3(0, 0, 0));

      worldTransform.setIdentity();
      worldTransform.setOrigin(
        new AmmoLib.btVector3(position.x, position.y, position.z)
      );
      body.setWorldTransform(worldTransform);
    }
  }

  let lastTime = 0;

  function step() {
    const time = performance.now();

    if (lastTime > 0) {
      const delta = (time - lastTime) / 1000;

      // console.time("physicsWorld.step");
      physicsWorld.stepSimulation(delta, 10);
      // console.timeEnd("physicsWorld.step");
    }

    lastTime = time;

    for (let i = 0, l = meshes.length; i < l; i++) {
      const mesh = meshes[i];

      if (mesh.isInstancedMesh) {
        const array = mesh.instanceMatrix.array;
        const bodies = meshMap.get(mesh);

        for (let j = 0; j < bodies.length; j++) {
          const body = bodies[j];

          const motionState = body.getMotionState();
          motionState.getWorldTransform(worldTransform);

          const position = worldTransform.getOrigin();
          const quaternion = worldTransform.getRotation();

          compose(position, quaternion, array, j * 16);
        }

        mesh.instanceMatrix.needsUpdate = true;
      } else if (mesh.isMesh) {
        const body = meshMap.get(mesh);

        const motionState = body.getMotionState();
        motionState.getWorldTransform(worldTransform);

        const position = worldTransform.getOrigin();
        const quaternion = worldTransform.getRotation();
        mesh.position.set(position.x(), position.y(), position.z());
        mesh.quaternion.set(
          quaternion.x(),
          quaternion.y(),
          quaternion.z(),
          quaternion.w()
        );
      }
    }

    detectCollision();
  }

  function detectCollision() {
    let dispatcher = physicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();

    for (let i = 0; i < numManifolds; i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      let numContacts = contactManifold.getNumContacts();

      for (let j = 0; j < numContacts; j++) {
        let contactPoint = contactManifold.getContactPoint(j);
        let distance = contactPoint.getDistance();
        // if (distance > 0) continue;
        // console.log({ manifoldIndex: i, contactIndex: j, distance: distance });
      }
    }
  }

  // animate

  setInterval(step, 1000 / frameRate);

  return {
    AmmoLib,
    physicsWorld,
    addMesh,
    setMeshPosition,
  };
}

function compose(position, quaternion, array, index) {
  const x = quaternion.x(),
    y = quaternion.y(),
    z = quaternion.z(),
    w = quaternion.w();
  const x2 = x + x,
    y2 = y + y,
    z2 = z + z;
  const xx = x * x2,
    xy = x * y2,
    xz = x * z2;
  const yy = y * y2,
    yz = y * z2,
    zz = z * z2;
  const wx = w * x2,
    wy = w * y2,
    wz = w * z2;

  array[index + 0] = 1 - (yy + zz);
  array[index + 1] = xy + wz;
  array[index + 2] = xz - wy;
  array[index + 3] = 0;

  array[index + 4] = xy - wz;
  array[index + 5] = 1 - (xx + zz);
  array[index + 6] = yz + wx;
  array[index + 7] = 0;

  array[index + 8] = xz + wy;
  array[index + 9] = yz - wx;
  array[index + 10] = 1 - (xx + yy);
  array[index + 11] = 0;

  array[index + 12] = position.x();
  array[index + 13] = position.y();
  array[index + 14] = position.z();
  array[index + 15] = 1;
}

export { AmmoPhysics };
