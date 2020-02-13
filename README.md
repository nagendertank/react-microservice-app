# react-microservice-app [![Build Status](https://travis-ci.org/nagendertank/react-microservice-app.svg?branch=master)](https://travis-ci.org/nagendertank/react-microservice-app)

## Installation
```
$ npm install react-microservice-app --save-dev 
```

## Usage
Load microservice via route
```jsx
import {AppComponent} from 'react-microservice-app'

<Route exact path={"/abc/**"}
    component={(props) => <AppComponent menuName="abc" overrideComponent={LoadMenuTabs} routeUrl="/abc" apiGwUrl={'http://layout_server'} {...props}/>}  fallbackComponent={optionalFallbackComponent}/>

```
## Note
This project is in progress and will share all the information once ready. More updates will be soon.

