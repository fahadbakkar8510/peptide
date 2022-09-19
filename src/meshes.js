import {
  BoxGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TextureLoader,
} from "three";
import { getTextMaterial } from "./common";

export const getAcidInstMesh = ({ radius, chars }) => {
  const size = radius * 2;
  const geometry = new BoxGeometry(size, size, size, 1, 1, 1);

  const material = [
    new MeshStandardMaterial({
      map: new TextureLoader().load(
        "https://threejs.org/examples/textures/square-outline-textured.png"
      ),
    }),
    new MeshStandardMaterial({
      map: new TextureLoader().load(
        "https://threejs.org/examples/textures/golfball.jpg"
      ),
    }),
    new MeshStandardMaterial({
      map: new TextureLoader().load(
        "https://threejs.org/examples/textures/metal.jpg"
      ),
    }),
    new MeshStandardMaterial({
      map: new TextureLoader().load(
        "https://threejs.org/examples/textures/roughness_map.jpg"
      ),
    }),
    new MeshStandardMaterial({
      map: new TextureLoader().load(
        "https://threejs.org/examples/textures/tri_pattern.jpg"
      ),
    }),
    new MeshStandardMaterial({
      map: new TextureLoader().load(
        "https://threejs.org/examples/textures/water.jpg"
      ),
    }),
  ];

  material.forEach((m, side) => {
    if (side != 2) return;

    m.onBeforeCompile = (shader) => {
      shader.uniforms.textures = {
        type: "tv",
        value: [
          new TextureLoader().load(
            "https://threejs.org/examples/textures/crate.gif"
          ),
          new TextureLoader().load(
            "https://threejs.org/examples/textures/equirectangular.png"
          ),
          new TextureLoader().load(
            "https://threejs.org/examples/textures/colors.png"
          ),
        ],
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
                  uniform sampler2D textures[3];
                  varying vec3 vTint;
                  varying float vTextureIndex;`
        )
        .replace(
          "#include <fog_fragment>",
          `#include <fog_fragment>
              float x = vTextureIndex;
              vec4 col;
              col = texture2D(textures[0], vUv ) * step(-0.1, x) * step(x, 0.1);
              col += texture2D(textures[1], vUv ) * step(0.9, x) * step(x, 1.1);
              col += texture2D(textures[2], vUv ) * step(1.9, x) * step(x, 2.1);
              gl_FragColor = col;
              `
        );
    };
  });

  const mesh = new InstancedMesh(geometry, material, chars.length);
  const textures = [];

  for (let i = 0; i < chars.length; i++) {
    textures.push(Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? 1 : 2);
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
