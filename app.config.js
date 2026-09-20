module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins ?? []), '@rnmapbox/maps'],
});
