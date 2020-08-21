import path from 'path';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import WebpackShellPluginNext from 'webpack-shell-plugin-next';
import nodeExternals from 'webpack-node-externals';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const ENTRY_FILE = 'index.ts';
const DIST_FOLDER = 'dist';
const DEV_FOLDER = 'dev';
const BUNDLE_FILENAME = 'index.js';
const INSPECT_PORT = 5858;

const createConfiguration: webpack.ConfigurationFactory = (e, options) => {
  const env = e as Record<string, boolean>;
  const isDev = options.mode !== 'production';

  const plugins: webpack.Plugin[] = [
    new webpack.DefinePlugin({
      __WEBPACK__: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'package.json',
          transform: (content): string => {
            const pkg: any = JSON.parse(content.toString());
            delete pkg.devDependencies;
            pkg.scripts = { start: `node ${BUNDLE_FILENAME}` };
            pkg.main = BUNDLE_FILENAME;
            return JSON.stringify(pkg);
          },
        },
      ],
    }),
  ];

  if (isDev) {
    if (env?.watch) {
      plugins.push(
        new WebpackShellPluginNext({
          onBuildStart: {
            scripts: [
              `nodemon --inspect=0.0.0.0:${INSPECT_PORT} ${DEV_FOLDER}/${BUNDLE_FILENAME} --watch ${DEV_FOLDER}/${BUNDLE_FILENAME}`,
            ],
            blocking: false,
            parallel: true,
          },
        }),
      );
    }
  }

  return {
    entry: `./src/${ENTRY_FILE}`,
    devtool: isDev ? 'eval-source-map' : false,
    output: {
      path: path.join(__dirname, isDev ? DEV_FOLDER : DIST_FOLDER),
      filename: BUNDLE_FILENAME,
    },
    externals: [nodeExternals()],
    target: 'node',
    node: {
      __dirname: false,
    },
    plugins,
    resolve: {
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
      plugins: [new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, 'tsconfig.json') })],
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        { test: /\.js$/, loader: 'babel-loader' },
        { test: /\.ts$/, loader: 'ts-loader' },
      ],
    },
  };
};

export default createConfiguration;
