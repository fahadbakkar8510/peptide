import {
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";
import { textureLoader } from "./constants";
import { getTextMaterial } from "./common";

export const getAcidInstMesh = ({ radius, chars }) => {
  const geometry = new SphereGeometry(radius);

  const material = new MeshStandardMaterial({
    map: textureLoader.load("favicon.ico"),
  });

  material.onBeforeCompile = (shader) => {
    const textureValues = [];
    chars.forEach((char) =>
      textureValues.push(getTextMaterial({ text: char }))
    );

    shader.uniforms.textures = {
      type: "tv",
      value: textureValues,
    };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#define STANDARD",
        `#define STANDARD
                  varying vec3 vTint;
                  varying float vTextureIndex;`
      )
      .replace(
        "#include <common>",
        `#include <common>
              attribute vec3 tint;
              attribute float textureIndex;`
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
              vTint = tint;
              vTextureIndex=textureIndex;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#define STANDARD",
        `#define STANDARD
                  uniform sampler2D textures[${chars.length}];
                  varying vec3 vTint;
                  varying float vTextureIndex;`
      )
      .replace(
        "#include <fog_fragment>",
        `#include <fog_fragment>
              float x = vTextureIndex;
              vec4 col;
              col = texture2D(textures[0], vUv ) * step(-0.1, x) * step(x, 0.1);
              ${[...Array(chars.length - 1).keys()]
                .map(
                  (i) => `
              col += texture2D(textures[${i + 1}], vUv ) * step(${i +
                    0.9}, x) * step(x, ${i + 1.1});
              `
                )
                .join("")}
              gl_FragColor = col;
              `
      );
  };

  const mesh = new InstancedMesh(geometry, material, chars.length);
  const textures = [];

  for (let i = 0; i < chars.length; i++) {
    textures.push(i);
  }

  geometry.setAttribute(
    "textureIndex",
    new InstancedBufferAttribute(new Float32Array(textures), 1)
  );

  return mesh;
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
