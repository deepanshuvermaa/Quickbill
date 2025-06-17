module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      package: "com.quickbill.pos"
    }
  };
};