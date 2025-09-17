module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Exclude react-native-reanimated plugin for now
      // 'react-native-reanimated/plugin'
    ],
  };
};