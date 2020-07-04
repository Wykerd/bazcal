const webpack = require('webpack');
const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isEnvProduction = argv.mode === 'production';

    const plugins = [
        new webpack.ProgressPlugin(),
        new webpack.optimize.ModuleConcatenationPlugin()
    ];

    const optimization = {
        minimizer: [
            new TerserJSPlugin({
                cache: false,
                terserOptions: {
                    mangle: { keep_classnames: true },
                    compress: { keep_classnames: true },
                    keep_classnames: true,
                    output: { comments: false },
                },
            }),
        ],
    };

    const mode = isEnvProduction ? 'production' : 'development';

    const resolve = {
        extensions: [".js"]
    };

    const module = {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            [
                                "@babel/preset-env",
                                {
                                    "useBuiltIns": "usage",
                                    "corejs": 3
                                }
                            ]
                        ],
                        "plugins": ["@babel/plugin-transform-react-jsx"]
                    }
                }
            }
        ]
    }

    const node = {
        fs: 'empty',
        dns: 'mock',
        tls: 'mock',
        child_process: 'empty',
        dgram: 'empty',
        __dirname: true,
        process: true,
        path: 'empty',
        Buffer: true,
        zlib: 'empty',
    };

    const config = {
        target: 'web',
        name: 'runtime',
        entry: [path.resolve(__dirname, './client_micro.js')],
        mode,
        devtool: 'source-map',
        resolve,
        node,
        optimization,
        module,
        output: {
            path: path.resolve(__dirname, '../static/runtime'),
            filename: isEnvProduction ? 'bscript.js' : 'bscript.dev.js',
            chunkFilename: isEnvProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
        },
        plugins
    }

    const ui_config = {
        target: 'web',
        name: 'ui',
        entry: [path.resolve(__dirname, './ui.js')],
        mode,
        devtool: 'source-map',
        resolve,
        node,
        optimization,
        module,
        output: {
            path: path.resolve(__dirname, '../static/bot'),
            filename: isEnvProduction ? 'index.[contenthash:8].js' : 'index.dev.js',
            chunkFilename: isEnvProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
            publicPath: isEnvProduction ? '/bot' : undefined
        },
        plugins: [
            ...plugins, 
            new HtmlWebpackPlugin({
                title: 'BScript Web Runtime',
            }),
            new webpack.DefinePlugin({
                BAZCAL_API_URL: JSON.stringify('http://localhost:9696')
            })
        ],
    }

    if (!isEnvProduction) {
        ui_config.devServer = {
            port: 9110,
            historyApiFallback: {
                index: 'index.html'
            }
        };

        ui_config.devtool = 'inline-source-map';
    }

    return [config, ui_config];
}