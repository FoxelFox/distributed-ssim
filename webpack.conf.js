const path = require('path');
const ThreadsPlugin = require('threads-plugin');

module.exports = {
	entry: './src/client/main.ts',
	module: {
		rules: [{
			test: /\.ts$/,
			loader: "ts-loader",
			options: {
				compilerOptions: {
		 			module: "esnext"
		 		}
			}
		}]
	},
	resolve: {
		extensions: [ '.ts', ".js"]
	},
	output: {
		filename: 'main.js',
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [
		new ThreadsPlugin({path: "/"})
	]
};