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
  const v1 = { x: A.x - B.x, y: A.y - B.y };
  const v2 = { x: C.x - B.x, y: C.y - B.y };
  if (v1.x === 0 && v1.y === 0 && v2.x === 0 && v2.y === 0) return 0;
  const radians = Math.acos(
    (v1.x * v2.x + v1.y * v2.y) /
      (Math.sqrt(v1.x * v1.x + v1.y * v1.y) *
        Math.sqrt(v2.x * v2.x + v2.y * v2.y))
  );
  let degree = (radians * 180) / Math.PI;
  let isNegative = false;
  if (v1.x * v2.x >= 0) {
    if (v1.x >= 0) {
      if (v1.y * v2.y >= 0) {
        if (v1.y >= 0) {
        }
      }
    }
  } else {
    if (v1.x >= 0) {
      if (v1.y * v2.y >= 0) {
        if (v1.y >= 0) {
        }
      }
    }
  }
  if (isNegative) degree = 360 - degree;
  return degree;
};
