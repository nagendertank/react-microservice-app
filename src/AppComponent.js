import React, { Component } from 'react'
import axios from 'axios';
import LoadBundle from './LoadBundlesUtils';
import * as internalCache from './internalCache';
import pathToRegexp from 'path-to-regexp';
import './app.css'

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
      
        this.getComponent = this.getComponent.bind(this);
        this.loadMenu = this.loadMenu.bind(this);
        this.getSpecs = this.getSpecs.bind(this);
        this.currentBundle = 0;
    }

    getSpecs(callback){
        let self = this;
        if (internalCache.appSpecs && internalCache.appSpecs.length>0){
            callback(internalCache.appSpecs)
        }else{
            axios.get(this.props.apiGwUrl+'/apigw/v1/register/UI').then((res) => {
                internalCache.appSpecs = res.data;
                callback(res.data);
            }, (error) => {
                self.setState({ loading: false, component: <div>Unable to load component</div>, error: true });
            })
        }
    }

    getComponent(name, props, menuData, isMenu, specsData){
        let self = this;
        this.setState({ loading:true});
        LoadBundle(name, specsData, this.props.apiGwUrl, function (result, appDetail) {
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
                    } else {
                        if (eval(appDetail.library) && eval(appDetail.library).App) {
                            //let component = React.createElement(eval(appDetail.library).App, self.dataProps);

                            let routeData = eval(appDetail.library).Routes;
                            let component = null;
                            let path = window.location.pathname.replace(self.props.routeUrl, '')
                            routeData.some((route) => {
                                if (path === '' || path==='/'){
                                    component = React.createElement(route.component, self.dataProps);
                                    return;
                                }else{
                                    if (self.props.match.params){
                                        let re = pathToRegexp(route.path);
                                        let params = re.exec(self.props.match.params[0])
                                        let props = Object.assign({}, self.props,self.dataProps);
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
                                        component = React.createElement(route.component, self.dataProps);
                                        return;
                                    }else{
                                        if (self.props.match.params) {
                                            let re = pathToRegexp(route.path);
                                            let params = re.exec(self.props.match.params[0])
                                            let props = Object.assign({}, self.props, self.dataProps);
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

    loadMenu(menuName,specsData){
        let self = this;
            let menuData = [];
        specsData.forEach((service)=>{
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
                    self.getComponent(data.microService, self.props, menuData, true, specsData);
                })
            }else{
                this.setState({
                    loading: false,
                });
            }
    }

    componentDidMount(){
        let appName = this.props.appName;
        let menuName = this.props.menuName;
        let self = this;
        this.getSpecs(function(specsData){
            if (appName) {
                self.getComponent(appName, self.props, null, false, specsData);
            } else if (menuName) {
                self.loadMenu(menuName, specsData);
            } 
        });
    }

    componentWillReceiveProps(nextProps){
        let appName = nextProps.appName;
        let menuName = nextProps.menuName;
        let self = this;
        this.currentBundle = 0;
        this.getSpecs(function (specsData) {
            if (appName) {
                self.getComponent(appName, nextProps, null, false, specsData);
            } else if (menuName) {
                self.loadMenu(menuName, specsData);
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
                   appDetail: this.state.appDetail, routeUrl: this.props.routeUrl, menuData: this.state.menuData, ...this.props
               })
                return component;
            }
        }else{
            return (
                <div>
                    Unable to load component
                </div>
            )
        }
        
    }
}
