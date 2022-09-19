import {
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshLambertMaterial,
  SphereGeometry,
} from "three";
import { getTextMaterial } from "./common";

export const getAcidInstMesh = ({ radius, chars }) => {
  const geometry = new SphereGeometry(radius);
  const material = new MeshLambertMaterial({});
  const instMesh = new InstancedMesh(geometry, material, chars.length);
  instMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  instMesh.castShadow = true;
  instMesh.receiveShadow = true;
  return instMesh;
};

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
