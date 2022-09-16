export let config = {
  dimUnit: "cm",
  scale: 1,
};

export class Configuration {
  constructor() {}

  static getData() {
    return config;
  }

  static setValue(key, value) {
    config[key] = value;
  }

  static getStringValue(key) {
    return String(Configuration.getData()[key]);
  }

  static getNumericValue(key) {
    return Number(Configuration.getData()[key]);
  }
}
