import { Color, Matrix4, Raycaster, TextureLoader, Vector3 } from "three";

export const dimInch = "inch";
export const dimFeetAndInch = "ft";
export const dimMeter = "m";
export const dimCentiMeter = "cm";
export const dimMilliMeter = "mm";

export const decimals = 1000;
export const cmPerFoot = 30.48;
export const pixelsPerFoot = 15.0;
export const cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
export const pixelsPerCm = 1.0 / cmPerPixel;

export const acidHex = 0x3d9970;
export const acidHexStr = "#3d9970";
export const ballHex = 0xff851b;
export const socketHex = 0x001f3f;
export const fogHex = 0x001f3f;
export const lightAHex = 0xffffff;
export const lightBHex = 0x002288;
export const lightCHex = 0x222222;

export const tempColor = new Color();
export const hoverColor = new Color(0x2ecc40);
export const activeColor = new Color(0x01ff70);
export const floorColor = new Color(0x111111);
export const backColor = new Color(0x666666);
export const acidColor = new Color(acidHex);

export const normalVecX = new Vector3(1, 0, 0);
export const normalVecY = new Vector3(0, 1, 0);
export const normalVecZ = new Vector3(0, 0, 1);

export const tempMultiMatrix = new Matrix4();
export const tempMatrix1 = new Matrix4();
export const tempMatrix2 = new Matrix4();

export const raycaster = new Raycaster();

export const acidMass = 1;
export const ballMass = 0.5;
export const socketMass = 0.5;

export const textureLoader = new TextureLoader();

export const maxTextureImageUnits = 8;
