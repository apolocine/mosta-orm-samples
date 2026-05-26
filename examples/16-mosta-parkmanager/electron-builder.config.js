module.exports = {
  appId: "com.mostajs.parkmanager",
  productName: "MostaParkManager",
  directories: {
    output: "bin/dist"
  },
  files: [
    "main.js",
    "package.json",
    "assets/**/*",
    "node_modules/selfsigned/**/*",
    "node_modules/node-forge/**/*",
    "node_modules/@types/node-forge/**/*"
  ],
  extraResources: [
    {
      from: "bin/standalone",
      to: "app",
      filter: ["**/*", "**/.*", "**/.*/**"]
    }
  ],
  win: {
    target: ["nsis", "portable"],
    icon: "assets/icon.ico"
  },
  linux: {
    target: "AppImage",
    icon: "assets/icon.png",
    category: "Utility"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Mosta ParkManager"
  },
  portable: {
    artifactName: "${productName}-${version}-portable.${ext}"
  },
  npmRebuild: false,
  nodeGypRebuild: false,
  asar: true
};
