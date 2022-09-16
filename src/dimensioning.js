import { Configuration } from "./configuration";
import {
  dimInch,
  dimFeetAndInch,
  dimMeter,
  dimCentiMeter,
  dimMilliMeter,
  decimals,
  cmPerFoot,
  pixelsPerFoot,
  cmPerPixel,
  pixelsPerCm,
} from "./constants";

export class Dimensioning {
  static roundOff({ value, decimals }) {
    return Math.round(decimals * value) / decimals;
  }

  static cmToPixel({ cm, applyScale = true }) {
    if (applyScale) {
      return cm * pixelsPerCm * Configuration.getNumericValue("scale");
    }
    return cm * pixelsPerCm;
  }

  static pixelToCm({ pixel, applyScale = true }) {
    if (applyScale) {
      return (
        pixel * cmPerPixel * (1.0 / Configuration.getNumericValue("scale"))
      );
    }
    return pixel * cmPerPixel;
  }

  /**
   * Converts dimensioning number to cm number.
   * @param measure Dimensioning number to be converted.
   * @returns Float.
   */
  static cmFromMeasureRaw({ measure, unit }) {
    if (!unit) unit = Configuration.getStringValue("dimUnit");

    switch (unit) {
      case dimFeetAndInch:
        return (
          Math.round(decimals * (measure * 30.480016459203095991)) / decimals
        );
      case dimInch:
        return (
          Math.round(decimals * (measure * 2.5400013716002578512)) / decimals
        );
      case dimMilliMeter:
        return (
          Math.round(decimals * (measure * 0.10000005400001014955)) / decimals
        );
      case dimCentiMeter:
        return measure;
      default:
        return Math.round(decimals * 100 * measure) / decimals;
    }
  }

  /**
   * Converts dimensioning number to cm string.
   * @param measure Dimensioning number to be converted.
   * @returns String.
   */
  static cmFromMeasure({ measure, unit }) {
    return Dimensioning.cmFromMeasureRaw(measure, unit) + "cm";
  }

  /**
   * Converts cm to dimensioning number.
   * @param cm CentiMeter value to be converted.
   * @returns Float.
   */
  static cmToMeasureRaw({ cm, power = 1, unit }) {
    if (!unit) unit = Configuration.getStringValue("dimUnit");

    switch (unit) {
      case dimFeetAndInch:
        return cm * Math.pow(0.032808416666669996953, power);
      case dimInch:
        return Math.round(decimals * (cm * Math.pow(0.3937, power))) / decimals;
      case dimMilliMeter:
        return Math.round(decimals * (cm * Math.pow(10, power))) / decimals;
      case dimCentiMeter:
        return Math.round(decimals * cm) / decimals;
      default:
        return Math.round(decimals * (cm * Math.pow(0.01, power))) / decimals;
    }
  }

  /**
   * Converts cm to dimensioning string.
   * @param cm CentiMeter value to be converted.
   * @returns String.
   */
  static cmToMeasure({ cm, power = 1, unit }) {
    if (!unit) unit = Configuration.getStringValue("dimUnit");
    const measureRaw = Dimensioning.cmToMeasureRaw({ cm, power, unit });

    switch (unit) {
      case dimFeetAndInch:
        let floorFeet = Math.floor(measureRaw);
        let remainingFeet = measureRaw - floorFeet;
        let remainingInches = Math.round(remainingFeet * 12);
        return floorFeet + "'" + remainingInches + '"';
      case dimInch:
        return measureRaw + "'";
      case dimMilliMeter:
        return measureRaw + "mm";
      case dimCentiMeter:
        return measureRaw + "cm";
      case dimMeter:
      default:
        return measureRaw + "m";
    }
  }
}
