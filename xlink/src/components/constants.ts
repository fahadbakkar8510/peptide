import {
  Color,
  Matrix4,
  Quaternion,
  Raycaster,
  TextureLoader,
  Vector3,
} from 'three'

export const acidHex = 0x3d9970
export const ballHex = 0xff851b
export const socketHex = 0x001f3f
export const bondSocketHex = 0xff0000
export const fogHex = 0x001f3f
export const lightAHex = 0xffffff
export const lightBHex = 0x002288
export const lightCHex = 0x222222

export const acidHexStr = '#3d9970'
export const hoverHexStr = '#2ecc40'
export const activeHexStr = '#01ff70'

export const tempColor1 = new Color()
export const floorColor = new Color(0x111111)
export const backColor = new Color(0x666666)

export const tempPos1 = new Vector3()
export const tempPos2 = new Vector3()
export const normalVecX = new Vector3(1, 0, 0)
export const normalVecY = new Vector3(0, 1, 0)
export const normalVecZ = new Vector3(0, 0, 1)

export const tempQuat1 = new Quaternion()

export const tempScale1 = new Vector3()

export const tempMultiMatrix1 = new Matrix4()
export const tempMatrix1 = new Matrix4()
export const tempMatrix2 = new Matrix4()

export const raycaster = new Raycaster()

export const acidMass = 1
export const ballMass = 1
export const socketMass = 1

export const textureLoader = new TextureLoader()
export const maxTextureImageUnits = 15
export const floatingHeight = 20
export const gravity = 2
export const fogDensity = 0.002
export const residueRadius = 0.1 // for the moment, we'll just have a single common radius. we'll want at least the option to specify radii per amino acid later.
export const socketRadius = residueRadius / 5
export const socketLength = residueRadius
export const ballRadius = residueRadius / 5 * 2

export const frameRate = 60
export const friction = 50
export const linearDamping = .8
export const rotationDamping = .8
