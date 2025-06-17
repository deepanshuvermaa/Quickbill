module.exports = ({ config }) => {
  return {
    ...config,
    name: "QuickBill - POS & Billing",
    slug: "quickbill-pos",
    version: "1.0.0",
    android: {
      ...config.android,
      package: "com.quickbill.pos",
      versionCode: 1
    },
    ios: {
      ...config.ios,
      bundleIdentifier: "com.quickbill.pos",
      buildNumber: "1"
    }
  };
};