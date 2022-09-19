import {
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  MeshLambertMaterial,
  SphereGeometry,
} from "three";

export const getSphereInstMesh = ({ radius, count }) => {
  const geometry = new SphereGeometry(radius);
  const material = new MeshLambertMaterial({});
  const instMesh = new InstancedMesh(geometry, material, count);
  instMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  instMesh.castShadow = true;
  instMesh.receiveShadow = true;
  return instMesh;
};

export const getCylinderInstMesh = ({
  topRadius,
  bottomRadius,
  height,
  count,
}) => {
  const geometry = new CylinderGeometry(topRadius, bottomRadius, height);
  const material = new MeshLambertMaterial({});
  const instMesh = new InstancedMesh(geometry, material, count);
  instMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  instMesh.castShadow = true;
  instMesh.receiveShadow = true;
  return instMesh;
};
