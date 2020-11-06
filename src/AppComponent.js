import React, { Component } from 'react'
import axios from 'axios';
import LoadBundle from './LoadBundlesUtils';
import * as internalCache from './internalCache';
import pathToRegexp from 'path-to-regexp';
import './app.css';
import _ from 'lodash';
import {axiosInstance} from './axiosInstance'

export default class AppComponent extends Component {
    constructor(props){
        super(props);
        this.state= {
            loading:true,
            component:null,
            appDetail:null,
            error:false,
            errorComponent: null,
            menuData:null,
            specs:null,
            hasError: false
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
        const api = this.props.customAxiosInstance ? this.props.customAxiosInstance : axiosInstance
        if (internalCache.appSpecs && (internalCache.appSpecs.length > 0 || !_.isUndefined(internalCache.appSpecs.specs))){
            callback(internalCache.appSpecs)
        }else{
            api.get(props.apiGwUrl+'/apigw/v1/register/UI').then((res) => {
                internalCache.appSpecs = res.data;
                callback(res.data);
            }, (error) => {
                self.setState({ loading: false, errorComponent: <div>Unable to load component</div>, error: true });
            })
        }
    }

    getComponent(name, props, menuData, isMenu, specsData, componentName, apiGwUrl){
        let self = this;
        this.setState({ loading:true});
        LoadBundle(name, specsData, apiGwUrl, props.token, function (result, appDetail) {
                if (result) {
                    let appModule = window[appDetail.library];
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
                        if (appModule) {
                            let component = appModule[componentName];
                            self.setState({
                                loading: false,
                                component,
                                appDetail: appDetail,
                                error: false
                            });
                            return;
                        }else{
                            self.setState({ loading: false, errorComponent: <div>Unable to load component</div>, error: true });
                        }
                    } else {
                        if (appModule) {
                            //let component = React.createElement(eval(appDetail.library).App, self.dataProps);

                            let routeData = appModule.Routes;
                            let component = null;
                            let path = window.location.pathname.replace(self.props.routeUrl, '')
                            routeData.some((route) => {
                                if (path === '' || path==='/'){
                                    component = route.component;
                                    return;
                                }else{
                                    if (self.props.match.params){
                                        let re = pathToRegexp(route.path);
                                        let params = re.exec(self.props.match.params[0])
                                        let props = Object.assign({}, self.props,self.props);
                                        props.match.params = params;
                                        component = route.component;
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
                                let routeData = appModule.Routes;
                                let component = null;
                                routeData.some((route) => {
                                    if (self.props.match.url && self.props.match.url === self.props.routeUrl) {
                                        component = route.component;
                                        return;
                                    }else{
                                        if (self.props.match.params) {
                                            let re = pathToRegexp(route.path);
                                            let params = re.exec(self.props.match.params[0])
                                            let props = Object.assign({}, self.props);
                                            props.match.params = params;
                                            component = route.component;
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
                    self.setState({ loading: false, errorComponent: <div>Unable to load component</div>, error: true });
                }
            });
    }

    loadMenu(menuName, specsData, dataProps, apiGwUrl){
        let self = this;
            let tabData = [],
                menuData = [];
        Array.isArray(specsData) && specsData.forEach((service)=>{
                if(service.spec.navigation && service.spec.navigation.length>=0) {
                    if(service.spec.navigation[0].tabs) {
                        service.spec.navigation.forEach((navigation)=>{
                        if (navigation.menuName === menuName){
                                if(navigation.tabs) {
                                    let obj = Object.assign({},{
                                        'tabs': navigation.tabs,
                                        'microService': service.service_name,
                                        'routes': service.spec.sharedRoutes
                                    });
                                    
                                    tabData.push(obj);
                                }
                            }
                        });
                    }  else if(service.spec.navigation[0].menuName === menuName){
                        //No tabs available, so load the first component and return
                        let obj = Object.assign({},{
                            'componentName' : service.spec.navigation[0].componentName,
                            'microService': service.service_name,
                            'routes': service.spec.sharedRoutes,
                        });

                        menuData.push(obj);
                        return;
                    }
                }
            });

            if(menuData.length > 0 || tabData.length > 0) {
                menuData.forEach((data) => {
                    self.getComponent(data.microService, dataProps, [data], null, specsData, data.componentName, apiGwUrl);
                });

                tabData.forEach((data) => {
                    self.getComponent(data.microService, dataProps, tabData, true, specsData, null, apiGwUrl);
                });
            } else {
                this.setState({ loading: false, menuData: [] });
            }
    }

    loadRoute(specsData, dataProps, apiGwUrl){
        if (Array.isArray(specsData)) {
            let self = this;
            this.setState({
                loading: true
            });
            let isRouteComponentFound = false,
                isRouteFoundInSpec = false,
                validSpec = undefined,
                params = null;

            isRouteFoundInSpec = specsData.some((service) => {

                let routes = service.spec.sharedRoutes;
                return routes.some((route) => {
                    if (dataProps.match.params) {
                        let re = pathToRegexp(route);
                        params = null;

                        if (dataProps.match.params[0].startsWith('/')) {
                            params = re.exec(dataProps.match.params[0])
                        } else {
                            params = re.exec('/' + dataProps.match.params[0])
                        }
                        if (params) {
                            validSpec = service.spec;
                            return true;  //Exit loop if route found
                        }
                    }
                }); //Exit loop if route found
            });

            if(isRouteFoundInSpec) {
                //Error handling will fail here if there are multiple JS bundles..
                LoadBundle(validSpec.name, specsData, apiGwUrl, dataProps.token, function (result, appDetail) {
                    if(result){
                        let appModule = window[appDetail.library];
                        let routeData = appModule && appModule.Routes || [];
                        let component = null;
                        routeData.some((appRoute) => {
                            let curRoute = dataProps.match.params[0];
                            if (appRoute.path === (curRoute.startsWith('/') ? curRoute : '/'+curRoute)) {
                                let props = Object.assign({}, dataProps);
                                props.match.params = params;
                                //Currently not supporting passing of context to component based on routes
                                component = appRoute.component;
                                isRouteComponentFound = true;
                                self.setState({
                                    loading: false,
                                    component,
                                    appDetail: appDetail,
                                    error: false
                                });
                                return true;
                            }
                        });

                        if (!isRouteComponentFound){
                            self.setState({ loading: false, errorComponent: self.routeErrorJSX, error: true });
                        }
                    }else{
                        self.setState({ loading: false, errorComponent: <div>Unable to load resource</div>, error: true });
                    }
                }); 
            } else this.setState({ loading: false, errorComponent: this.routeErrorJSX, error: true });  //Show error if route is not in sharedRoutes
        }else{
            this.setState({ loading: false, errorComponent: this.routeErrorJSX, error: true });
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

    componentDidCatch(error, info) {
        console.log(error);
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
      }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallbackComponent ? this.props.fallbackComponent : 
                <h2 style={{ textAlign: 'center', padding: '10px' }}>An error has occurred while loading the page.</h2>
            )
        }
        if (this.state.loading){
            return (
                this.props.loaderComponent ? this.props.loaderComponent : <div className='lmask'>loading...</div>
            )
        }else if(!this.state.error){
            if (!this.props.overrideComponent){
                return (
                    <div>
                        {React.createElement(this.state.component, { ...this.props, ...this.state.appDetail })}
                    </div>
                )
            }else{
               let component = React.createElement(this.props.overrideComponent,{
                error:false, appDetail: this.state.appDetail, routeUrl: this.props.routeUrl, menuData: this.state.menuData, componentLoaded: internalCache.componentLoaded, ...this.props
               })
                return component;
            }
        } else if (this.state.error && this.props.overrideComponent){
            let component = React.createElement(this.props.overrideComponent, {
                error:true, appDetail: [], routeUrl: this.props.routeUrl, menuData: [], componentLoaded: [], ...this.props
            });
            return component;
        }else{
            return (
                this.props.fallbackComponent ? this.props.fallbackComponent:
                <div>
                    {this.state.errorComponent || 'Unable to load component'}
                </div>
            )
        }
        
    }
}
