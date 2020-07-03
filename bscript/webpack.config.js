const webpack = require('webpack');
const path = require('path');
const TerserJSPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isEnvProduction = argv.mode === 'production';

    const config = {
        target: 'web',
        entry: [path.resolve(__dirname, './builtins.js'), path.resolve(__dirname, './bz_cache_web.js'), path.resolve(__dirname, './bz_micro.js'), path.resolve(__dirname, './client_micro.js')],
        mode: isEnvProduction ? 'production' : 'development',
        devtool: 'source-map',
        resolve: {
            extensions: [".js"]
        },
        node: {
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
        },
        optimization: {
            minimizer: [
                new TerserJSPlugin({
                    cache: false,
                    terserOptions: {
                        mangle: { keep_classnames: false },
                        compress: { keep_classnames: false },
                        keep_classnames: false,
                        output: { comments: false },
                    },
                }),
            ],
        },
        externals: {
            opencv: 'cv'
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules)/,
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
                            ]
                        }
                    }
                }
            ]
        },
        output: {
            path: path.resolve(__dirname, '../static'),
            filename: isEnvProduction ? 'bscript.js' : 'bscript.dev.js',
            chunkFilename: isEnvProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
        },
        plugins: [
            new webpack.ProgressPlugin(),
            new webpack.optimize.ModuleConcatenationPlugin()
        ]
    }


    if (!isEnvProduction) {
        config.devtool = 'inline-source-map';
    }

    return config;
}