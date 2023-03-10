import { LinearFilter, Texture } from "three"

export const getFloat = (val: string) => {
  let floatVal = parseFloat(val)
  if (!floatVal) floatVal = 0
  return floatVal
}

export const getTextTexture = (text: string, backColor: string) => {
  const textCanvas = document.createElement("canvas")
  const ctx = textCanvas.getContext("2d")
  const measureText = ctx!.measureText(text)
  const width = 100
  textCanvas.width = width
  textCanvas.height = Math.ceil(
    (measureText.fontBoundingBoxAscent * width) / measureText.width
  )

  if (backColor) {
    ctx!.fillStyle = backColor
    ctx!.fillRect(0, 0, textCanvas.width, textCanvas.height)
  }

  ctx!.font = `50px bold arial`
  ctx!.strokeStyle = "#ff0000"
  ctx!.lineWidth = 1
  ctx!.lineJoin = "miter"
  ctx!.miterLimit = 1
  ctx!.strokeText(text, 20, 80)
  ctx!.fillStyle = "black"
  ctx!.fillText(text, 20, 80)
  const texture = new Texture(textCanvas)
  texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

export const chunk = (arr: Array<any>, chunkSize: number) => {
  const tempArr = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    tempArr.push(arr.slice(i, i + chunkSize))
  }
  return tempArr
}

export const getAlphaOnly = (str: string) => {
  var alpha = ""
  for (var i = 0; i < str.length; i++) {
    if (str[i] >= "A" && str[i] <= "z") alpha += str[i]
  }
  return alpha
}
