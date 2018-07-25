# react-classname-prefix-with-lookup
A Webpack loader that prefixes classes with custom prefix in React components. You can use lookup css files and if class presents then only it will update with prefix.

MyComponent.js

```jsx
class MyComponent extends React.Component {
  render () {
    return <div className='myclass'></div>
  }
}

export default MyComponent
```

Output:

```jsx
class MyComponent extends React.Component {
  render () {
    return <div className='your_prefix-myclass'></div>
  }
}

export default MyComponent
```

Also works with [classnames](https://github.com/JedWatson/classnames) module!

## Installation
```
$ npm install react-classname-prefix-with-lookup --save-dev 
```

## Usage

```javascript
module: {
 loaders: [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [{
              loader: 'babel-loader'
           },
           {
              loader: path.resolve('react-classnames-prefix.js'),
              options:{
                prefix:'prefix-',
                fileName: ['./src/main.css','./src/style.css']
              }
    }]
  },
 ],
},
```

## Recommendation
* Use it with [postcss-prefix-webpack](https://github.com/nagendertank/postcss-prefix-webpack) for css files

## Credits
 Plugin based on 
 - [react-classname-prefix-loader](https://github.com/vezetvsem/react-classname-prefix-loader) create by [vezetvsem](https://github.com/vezetvsem).
