/**
 * Created by jack on 16-4-16.
 */
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

const PATH = require('./setting');
const baseWebpackConfig = require('./base');
const isProduction = process.env.NODE_ENV === 'production';

const webpackConfig = Object.assign({}, baseWebpackConfig, {
	devtool: isProduction ? 'cheap-source-map' : 'module-source-map',
	entry: {
		common: ['vue', 'vue-router', 'vuex'],
		app: [PATH.SOURCE_PATH + '/client-entry.js']
	},
	output: Object.assign({}, baseWebpackConfig.output, {
		filename: '[name].[hash:8].js',
		// The JSONP function used by webpack for asnyc loading of chunks.
		// Must Using different identifier, when having multiple webpack instances on a single page.
		// If not, that will cause reference error.
		jsonpFunction: 'blogJsonp'
	}),
	plugins: baseWebpackConfig.plugins.concat([
		// Common Chunk Plugin should be used when project has several entries for common lib file.
		new webpack.optimize.CommonsChunkPlugin({
			name: 'common',
			filename: 'common.[hash:8].js'
		}),
		/*
		 * DllReferencePlugin is used to package project library file, which will not be compile every time.
		 * That plugin will improve local build efficiency.
		 * But that cause another problem that file can't be automatically injected into index.html.
		 * That problem causes the plugin is useless.
		 new webpack.DllReferencePlugin({
		 context: path.join(__dirname),
		 manifest: require(PATH.DIST_PATH + '/VueStuff.manifest.json')
		 }),*/
		new VueSSRClientPlugin(),
		/* replace by VueSSRClientPlugin
		new HtmlWebpackPlugin({
			favicon: PATH.SOURCE_PATH + '/client/assets/img/favicon.ico',
			filename: 'index.temp.html',
			template: PATH.SOURCE_PATH + '/index.html'
		}), */
		// create another 404.html file
		new HtmlWebpackPlugin({
			favicon: PATH.SOURCE_PATH + '/client/assets/img/favicon.ico',
			filename: '404.html',
			template: PATH.SOURCE_PATH + '/404.html',
			inject: false
		}),
		new CopyWebpackPlugin([
			{
				from: PATH.SOURCE_PATH + '/client/assets/img/logo',
				to: 'assets/img/logo'
			}
		]),
		new CopyWebpackPlugin([
			{ from: PATH.SOURCE_PATH + '/manifest.json' }
		]),
		new CopyWebpackPlugin([
			{ from: PATH.SOURCE_PATH + '/service-worker.js' }
		]),
		// Define NODE_ENV
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
		})
	])
});

if (isProduction) {
	webpackConfig.plugins.unshift(new CleanPlugin([`${PATH.DIST_PATH}/client`], { root: process.cwd() }));
	webpackConfig.plugins.push(new webpack.DefinePlugin({
		'process.env': {
			NODE_ENV: '"production"'
		}
	}));
	webpackConfig.plugins.push(new webpack.LoaderOptionsPlugin({
		minimize: true
	}));
	webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
		sourceMap: true
	}));
} else {
	webpackConfig.entry['app'].unshift('webpack-hot-middleware/client?path=/__webpack_hmr&reload=true&timeout=20000');
	webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = webpackConfig;
