export const getFloat = (val) => {
  let floatVal = parseFloat(val);
  if (!floatVal) floatVal = 0;
  return floatVal;
};
