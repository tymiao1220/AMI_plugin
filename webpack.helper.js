module.exports = function (config) {
    
    config.resolve.extensions = ['.ts', '.js', '.json'];
    config.module.rules.push({
        resource: {
            test: /\.scss$/,
            include: [/node_modules/]
        },
        use:[{
                loader: "style-loader" // creates style nodes from JS strings
            }, {
                loader: "css-loader" // translates CSS into CommonJS
            }, {
                loader: "sass-loader" // compiles Sass to CSS
            }]
    });
    config.module.rules.push({
        resource: {
            test: /\.js$/   ///node_modules(\/|\\)dicom-parser\.js(\/|\\).*.js$/,
         //   include: //[/node_modules(\/|\\)dicom-parser\.js(\/|\\)/]
        },
        use: [
            {
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                }
            }
        ]
    });
    config.module.rules.push({
        resource: {
            test: /\.ts$/   ///node_modules(\/|\\)dicom-parser\.js(\/|\\).*.js$/,
         //   include: //[/node_modules(\/|\\)dicom-parser\.js(\/|\\)/]
        },
        use: [
            {
                loader: 'ts-loader'
            }
        ]
    });
    config.module.rules.push({
        resource: {
            test: /\.(html)$/,
        },
        use: [{
                loader: 'html-loader',
                options: {
                  attrs: [':data-src']
                }
              }]    
    });
    config.module.rules.push({
        resource: {
            test: /\.pug$/,
        },
        use: [{
                loader: 'pug-loader'
              }]    
    });
    config.module.rules.push({
        
            test: /\.styl$/,
        
            loader: 'style-loader!css-loader!stylus-loader'
           
    });
    return config;
};