import { LinearFilter, Sprite, SpriteMaterial, Texture } from "three";

export const getFloat = (val) => {
  let floatVal = parseFloat(val);
  if (!floatVal) floatVal = 0;
  return floatVal;
};

export const getTextMaterial = ({ text }) => {
  const textCanvas = document.createElement("canvas");
  const ctx = textCanvas.getContext("2d");
  textCanvas.width = Math.ceil(ctx.measureText(text).width + 16);
  textCanvas.height = 34;
  ctx.font = "24px grobold";
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 8;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 3;
  ctx.strokeText(text, 8, 26);
  ctx.fillStyle = "black";
  ctx.fillText(text, 8, 26);
  const spriteMap = new Texture(
    ctx.getImageData(0, 0, textCanvas.width, textCanvas.height)
  );
  // return spriteMap;
  spriteMap.minFilter = LinearFilter;
  spriteMap.generateMipmaps = false;
  spriteMap.needsUpdate = true;
  const textMaterial = new SpriteMaterial({ map: spriteMap });
  return textMaterial;
  // const sprite = new Sprite(textMaterial);
  // sprite.scale.set((0.12 * textCanvas.width) / textCanvas.height, 0.12, 1);
  // sprite.position.y = 0.7;
  // return sprite;
};
