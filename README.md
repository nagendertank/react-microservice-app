# react-microservice-app ![Build Status](https://travis-ci.org/nagendertank/react-microservice-app.svg?branch=master)
A utility component for react app to load microfrontends.

## Installation
```
$ npm install react-microservice-app --save-dev 
```

## Usage
Load microservice via route
```jsx
import {AppComponent} from 'react-microservice-app'

<Route exact path={"/abc/**"}
    component={(props) => <AppComponent menuName="abc" overrideComponent={LoadMenuTabs} routeUrl="/abc" apiGwUrl={'http://layout_server'} {...props}/>} />

```


