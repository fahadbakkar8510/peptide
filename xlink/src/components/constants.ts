import * as THREE from 'three'

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

export const tempColor1 = new THREE.Color()
export const floorColor = new THREE.Color(0x111111)
export const backColor = new THREE.Color(0x666666)

export const tempPos1 = new THREE.Vector3()
export const normalVecX = new THREE.Vector3(1, 0, 0)
export const normalVecY = new THREE.Vector3(0, 1, 0)
export const normalVecZ = new THREE.Vector3(0, 0, 1)
export const startPos = new THREE.Vector3(-8, 2, 0)

export const tempQuat1 = new THREE.Quaternion()

export const tempScale1 = new THREE.Vector3()

export const tempMultiMatrix1 = new THREE.Matrix4()
export const tempMatrix1 = new THREE.Matrix4()
export const tempMatrix2 = new THREE.Matrix4()

export const raycaster = new THREE.Raycaster()

export const gravity = 2
export const fogDensity = 0.002
export const residueRadius = 0.1 // for the moment, we'll just have a single common radius. we'll want at least the option to specify radii per amino acid later.
export const socketRadius = residueRadius / 5
export const socketLength = residueRadius
export const crossSocketLength = socketLength * 2
export const ballRadius = residueRadius / 5 * 2

export const cameraPosZ = 10
export const frameRate = 60
export const friction = 50
export const linearDamping = .8
export const rotationDamping = .8

export const residueInstCnt = 10
export const socketInstCnt = 1000
export const ballInstCnt = 1000

export const commonResidueMass = 1
export const commonSocketMass = 1
export const commonBallMass = 1

export const scalingFactor = 20
