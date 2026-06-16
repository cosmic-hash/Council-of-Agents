/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "@mintplex-labs/piper-tts-web",
      "onnxruntime-web",
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^onnxruntime-node$/,
      })
    );

    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@mintplex-labs/piper-tts-web",
        "onnxruntime-web",
      ];
    }

    return config;
  },
};

export default nextConfig;
