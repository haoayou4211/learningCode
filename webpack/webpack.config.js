/*
 webpack.config.js  webpack配置文件
  作用：指示webpack 干哪些活（当你运行webpack指令时，会加载里面的配置）

  所有构件工具都是基于nodeJs平台运行的，模块化默认采用commonjs

  // loader: 1.下载  2.使用（配置loader
  // plugins: 1. 下载  2. 引用  3.使用
 */

  // 用resolve来拼接绝对路径
  const { resolve } = require('path')
  const htmlWebpackPlugin = require('html-webpack-plugin')

  module.exports = {
    // webpack配置
    // 入口
    entry: './src/index.js',
    // 输出
    output: {
      filename: 'index.js',
      // 输出路径
      // __dirname nodejs的变量，代表当前文件的目录的绝对路径
      path: resolve(__dirname, 'build')
    },
    // loader的配置
    module: {
      rules: [
        // // 详细的loader的配置
        // //的不同的文件必须配置不同的loader处理
        {
          // 匹配哪些文件
          test: /\.css$/,
          // 使用哪些loader进行处理
          use: [
            // user数组中的loader执行顺序：从右往左，从下往上依次执行
            // 创建style标签，将js中的样式资源插入进行，添加到head中生效
            'style-loader',
            // 将css文件变成commonjs模块加载到js中，里面内容是样式字符串
            'css-loader'
          ]
        },
        {
          // 匹配哪些文件
          test: /\.less$/,
          // 使用哪些loader进行处理
          use: [
            // user数组中的loader执行顺序：从右往左，从下往上依次执行
            // 创建style标签，将js中的样式资源插入进行，添加到head中生效
            'style-loader',
            // 将css文件变成commonjs模块加载到js中，里面内容是样式字符串
            'css-loader',
            // less-loader 和 less
            'less-loader'
          ]
        },
        {
          // 处理不了html中的图片
          test: /\.(jpg|png|gif)$/,
          // url-loader 依赖与 file-loader
          loader: 'url-loader',
          options:{
            limit: 8 * 1024,
            name: '[hash:10].[ext]',
            // 关闭es6模块化
            esModule: false,
            outputPath: 'imgs'
          }
        },
        {
          // 处理不了html中的图片
          test: /\.html$/,
          // 处理html中的img图片（负责引入img,从而能被url-loader处理)
          loader: 'html-loader'
        },
        {
          // 处理其他资源
          exclude: /\.(html|js|css|less|jpg|png|gif)/,
          loader: 'file-loader',
          options: {
            name: '[hash:10].[ext]'
          }
        }
      ]
    },
    // plugins的配置
    plugins:[
      // 详细的plugins的配置
      // html-webpack-plugin 插件
      // 默认是创建一个空html文件，自动引入打包输出的所有资源（JS/CSS)
      new htmlWebpackPlugin({
        // 复制 './src/index.html' 文件，并自动引入打包输出的所有资源
        template: './src/index.html'
      })
    ],
    // 模式
    mode: "development", // 开发环境
    // mode: "production", // 生产环境
    devServer: {
      contentBase: resolve(__dirname, 'build'),
      // 启动gzip压缩
      compress: true,
      // 端口号
      port: 3000,
      // 是否自动打开浏览器
      open: true
    }

  }