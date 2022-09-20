import { LinearFilter, Texture } from "three";

export const getFloat = (val) => {
  let floatVal = parseFloat(val);
  if (!floatVal) floatVal = 0;
  return floatVal;
};

export const getTextTexture = ({ text, backColor }) => {
  const textCanvas = document.createElement("canvas");
  const ctx = textCanvas.getContext("2d");
  const measureText = ctx.measureText(text);
  const width = 100;
  textCanvas.width = width;
  textCanvas.height = Math.ceil(
    (measureText.fontBoundingBoxAscent * width) / measureText.width
  );
  if (backColor) {
    ctx.fillStyle = backColor;
    ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
  }
  ctx.font = `50px bold arial`;
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 1;
  ctx.lineJoin = "miter";
  ctx.miterLimit = 1;
  ctx.strokeText(text, 20, 80);
  ctx.fillStyle = "black";
  ctx.fillText(text, 20, 80);
  const texture = new Texture(textCanvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

export const chunk = ({ arr, chunkSize }) => {
  const tempArr = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    tempArr.push(arr.slice(i, i + chunkSize));
  }
  return tempArr;
};

export const getAlphaOnly = (str) => {
  var alpha = "";
  for (var i = 0; i < str.length; i++) {
    if (str[i] >= "A" && str[i] <= "z") alpha += str[i];
  }
  return alpha;
};

export const getAngle = ({ A, B, C }) => {
  const a = { x: A.x - B.x, y: A.y - B.y };
  const b = { x: C.x - B.x, y: C.y - B.y };
  if (a.x === 0 && a.y === 0 && b.x === 0 && b.y === 0) return 0;
  const radians = Math.acos(
    (a.x * b.x + a.y * b.y) /
      (Math.sqrt(a.x * a.x + a.y * a.y) * Math.sqrt(b.x * b.x + b.y * b.y))
  );
  const degree = (radians * 180) / Math.PI;
  return degree;
};
