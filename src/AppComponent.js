import React, { Component } from 'react'
import axios from 'axios';
import LoadBundle from './LoadBundlesUtils';
import * as internalCache from './internalCache';
import pathToRegexp from 'path-to-regexp';
import './app.css';
import _ from 'lodash';

export default class AppComponent extends Component {
    constructor(props){
        super(props);
        this.state= {
            loading:true,
            component:null,
            appDetail:null,
            error:false,
            menuData:null,
            specs:null
        }
        this.routeErrorJSX = <div>Unable to load route</div>;
        this.getComponent = this.getComponent.bind(this);
        this.loadMenu = this.loadMenu.bind(this);
        this.getSpecs = this.getSpecs.bind(this);
        this.loadRoute = this.loadRoute.bind(this);
        this.currentBundle = 0;
    }

    getSpecs(props,callback){
        let self = this;
        if (internalCache.appSpecs && (internalCache.appSpecs.length > 0 || !_.isUndefined(internalCache.appSpecs.specs))){
            callback(internalCache.appSpecs)
        }else{
            axios.get(props.apiGwUrl+'/apigw/v1/register/UI',{withCredentials:true}).then((res) => {
                internalCache.appSpecs = res.data;
                callback(res.data);
            }, (error) => {
                self.setState({ loading: false, component: <div>Unable to load component</div>, error: true });
            })
        }
    }

    getComponent(name, props, menuData, isMenu, specsData, componentName, apiGwUrl){
        let self = this;
        this.setState({ loading:true});
        LoadBundle(name, specsData, apiGwUrl, props.token, function (result, appDetail) {
                if (result) {
                    if (isMenu) {
                        self.currentBundle++;
                        if (self.currentBundle === menuData.length) {
                            self.setState({
                                loading: false,
                                menuData,
                                error: false
                            });
                        }
                    } else if (componentName){
                        if (eval(appDetail.library)) {
                            let component = React.createElement(eval(appDetail.library)[componentName], self.props);
                            self.setState({
                                loading: false,
                                component,
                                appDetail: appDetail,
                                error: false
                            });
                            return;
                        }else{
                            self.setState({ loading: false, component: <div>Unable to load component</div>, error: true });
                        }
                    } else {
                        if (eval(appDetail.library)) {
                            //let component = React.createElement(eval(appDetail.library).App, self.dataProps);

                            let routeData = eval(appDetail.library).Routes;
                            let component = null;
                            let path = window.location.pathname.replace(self.props.routeUrl, '')
                            routeData.some((route) => {
                                if (path === '' || path==='/'){
                                    component = React.createElement(route.component, self.props);
                                    return;
                                }else{
                                    if (self.props.match.params){
                                        let re = pathToRegexp(route.path);
                                        let params = re.exec(self.props.match.params[0])
                                        let props = Object.assign({}, self.props,self.props);
                                        props.match.params = params;
                                        component = React.createElement(route.component, props);
                                        return;
                                    }
                                }
                            });

                            self.setState({
                                loading: false,
                                component,
                                appDetail: appDetail,
                                error: false
                            });
                        } else {
                            setTimeout(function () {
                                //let component = React.createElement(eval(appDetail.library).App, self.dataProps);
                                let routeData = eval(appDetail.library).Routes;
                                let component = null;
                                routeData.some((route) => {
                                    if (self.props.match.url && self.props.match.url === self.props.routeUrl) {
                                        component = React.createElement(route.component, self.props);
                                        return;
                                    }else{
                                        if (self.props.match.params) {
                                            let re = pathToRegexp(route.path);
                                            let params = re.exec(self.props.match.params[0])
                                            let props = Object.assign({}, self.props);
                                            props.match.params = params;
                                            component = React.createElement(route.component, props);
                                            return;
                                        }
                                    }
                                });

                                self.setState({
                                    loading: false,
                                    component,
                                    appDetail: appDetail,
                                    error: false
                                });
                            }, 5000)
                        }
                    }
                } else {
                    self.setState({ loading: false, component: <div>Unable to load component</div>, error: true });
                }
            });
    }

    loadMenu(menuName, specsData, dataProps, apiGwUrl){
        let self = this;
            let menuData = [];
        Array.isArray(specsData) && specsData.forEach((service)=>{
                service.spec.navigation.forEach((navigation)=>{
                    if (navigation.menuName === menuName){
                        let obj = Object.assign({},{
                            'tabs': navigation.tabs,
                            'microService': service.service_name,
                            'routes': service.spec.sharedRoutes
                        })
                        menuData.push(obj);
                    }
                })
            });

            if(menuData.length>0){
                menuData.forEach((data) => {
                    self.getComponent(data.microService, dataProps, menuData, true, specsData, null, apiGwUrl);
                })
            }else{
                this.setState({
                    loading: false,
                    menuData:[]
                });
            }
    }

    loadRoute(specsData, dataProps, apiGwUrl){
        if (Array.isArray(specsData)){
            let self = this;
            this.setState({ loading: true });
            var isRouteFound = false;

            specsData.some((service)=>{
            
                let routes = service.spec.sharedRoutes;
                routes.some((route) => {
                if (dataProps.match.params) {
                    let re = pathToRegexp(route);
                    let params = null;
                  if (dataProps.match.params[0].startsWith('/')){
                      params = re.exec(dataProps.match.params[0])
                    }else{
                      params = re.exec('/' + dataProps.match.params[0])
                    }
                    if(params){
                        LoadBundle(service.spec.name, specsData, apiGwUrl, dataProps.token, function (result, appDetail) {
                            if(result){
                                let routeData = eval(appDetail.library).Routes;
                                let component = null;
                                routeData.some((appRoute) => {
                                    if (appRoute.path === route) {
                                        let props = Object.assign({}, dataProps);
                                        props.match.params = params;
                                        component = React.createElement(appRoute.component, props);
                                        isRouteFound = true;
                                        self.setState({
                                            loading: false,
                                            component,
                                            appDetail: appDetail,
                                            error: false
                                        });
                                        return true;
                                    }
                                });

                                if (!isRouteFound){
                                    self.setState({ loading: false, component: <div>Unable to load route</div>, error: true });
                                }
                            }else{
                                self.setState({ loading: false, component: <div>Unable to load route</div>, error: true });
                            }
                        }); 
                    }else{
                        self.setState({ loading: false, component: <div>Unable to load route</div>, error: true });
                    }
                }    
                if(isRouteFound)
                    return true;
                });
                if(isRouteFound)
                    return true;
            });
        }else{
            this.setState({ loading: false, component: <div>Unable to load route</div>, error: true });
        }
    }

    componentDidMount(){
        let appName = this.props.appName;
        let menuName = this.props.menuName;
        let loadInternalRoute = this.props.loadInternalRoute;
        let componentName = this.props.componentName;
        let self = this;
        
        this.getSpecs(this.props,function(response){
            let apiGwUrl = response.cdn;
            let specsData = response.specs;
            if (!apiGwUrl) {
                apiGwUrl = self.props.apiGwUrl;
                specsData = response;
            }
            if (appName && componentName) {
                self.getComponent(appName, self.props, null, false, specsData, componentName, apiGwUrl)
            } else if (appName) {
                self.getComponent(appName, self.props, null, false, specsData, null, apiGwUrl);
            }  else if (menuName) {
                self.loadMenu(menuName, specsData, self.props, apiGwUrl);
            } else if (loadInternalRoute){
                self.loadRoute(specsData, self.props, apiGwUrl);
            } 
        });
    }

    componentWillReceiveProps(nextProps){
        let appName = nextProps.appName;
        let menuName = nextProps.menuName;
        let loadInternalRoute = nextProps.loadInternalRoute;
        let componentName = nextProps.componentName;
        let self = this;
        this.currentBundle = 0;
        this.getSpecs(nextProps,function (response) {
            let apiGwUrl = response.cdn;
            let specsData = response.specs;
            if (!apiGwUrl) {
                apiGwUrl = nextProps.apiGwUrl;
                specsData = response;
            }
            if (appName && componentName) {
                self.getComponent(appName, nextProps, null, false, specsData, componentName, apiGwUrl)
            } else if (appName) {
                self.getComponent(appName, nextProps, null, false, specsData, null, apiGwUrl);
            } else if (menuName) {
                self.loadMenu(menuName, specsData, nextProps, apiGwUrl);
            } else if (loadInternalRoute){
                self.loadRoute(specsData, nextProps, apiGwUrl);
            }
        });
    }


    render() {
        if (this.state.loading){
            return (
                this.props.loaderComponent ? this.props.loaderComponent : <div className='lmask'>loading...</div>
            )
        }else if(!this.state.error){
            if (!this.props.overrideComponent){
                return (
                    <div>
                        {this.state.component}
                    </div>
                )
            }else{
               let component = React.createElement(this.props.overrideComponent,{
                   appDetail: this.state.appDetail, routeUrl: this.props.routeUrl, menuData: this.state.menuData, componentLoaded: internalCache.componentLoaded, ...this.props
               })
                return component;
            }
        } else if (this.state.error && this.props.overrideComponent){
            let component = React.createElement(this.props.overrideComponent, {
                appDetail: [], routeUrl: this.props.routeUrl, menuData: [], componentLoaded: [], ...this.props
            });
            return component;
        }else{
            return (
                this.props.notFound ? this.props.notFound():
                <div>
                    {this.state.component || 'Unable to load component'}
                </div>
            )
        }
        
    }
}
