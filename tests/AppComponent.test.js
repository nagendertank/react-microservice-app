import AppComponent from '../src/AppComponent';
import React, { Component } from 'react'
import internalCache from "../src/internalCache";

const getInstance = () => {
  return wrapper.instance();
};

window.cascustomreports = {
  "ReportList" : class ReportList extends Component {
      render() {
        return <div>Dummy MicroApp</div>
      }
    }
}

jest.mock('../src/LoadBundlesUtils', ()=>({
  __esModule: true, // this property is for ES export default
  default: function(name, specsData,apiGWURl, authToken,callback){
      
    callback(true,specsData[1].spec) //This needs to be generalized to accept any appDetails
  },

}));

let wrapper = null;
const specs = [
      {
        "service_name": "Security",
        "service_id": "38108790-999e-11e8-96bf-c3ed26ccecae",
        "spec": {
          "name": "Security",
          "version": "1.0",
          "servers": [
            {
              "url": "http://127.0.0.1:8082",
              "description": "local"
            },
            {
              "url": "https://poc-web-app2.azurewebsites.net/",
              "description": "dev"
            }
          ],
          "resources": [
            {
              "type": "javascript",
              "fileName": "LOAD_SUCCESS_SRC",
              "extension": "js"
            }
          ],
          "navigation": [
            {
              "menuName": "user",
              "tabs": [
                {
                  "tabName": "App Security",
                  "componentName": "UserSecurity"
                },
                {
                  "tabName": "Access Security",
                  "componentName": "AccessSecurity"
                }
              ]
            },
            {
              "menuName": "operations",
              "tabs": [
                {
                  "tabName": "User Operations",
                  "componentName": "AccessSecurity"
                }
              ]
            }
          ],
          "sharedRoutes": [
            "/more/:id"
          ],
          "library": "App2"
        },
        "type": "UI"
      },{
        "service_name": "CASReports",
        "spec": {
            "name": "CASReports",
            "version": "1.0",
            "servers": [
                {
                    "url": "http://localhost:9000",
                    "description": "local"
                }
            ],
            "resources": [
                {
                    "type": "javascript",
                    "fileName": "cascustomreports_bundle",
                    "extension": "js"
                },
                {
                    "type": "css",
                    "fileName": "cascustomreports_main",
                    "extension": "css"
                }
                
            ],
            "navigation": [
                {
                    "menuName": "CustomReports",
                    "componentName": "ReportList"
                }
            ],
            "sharedRoutes": [
                "/customreports",
                "/customreports/create",
                "/customreports/view",
                "/customreports/edit"
            ],
            "library": "cascustomreports"
        },
        "type": "UI"
    }
    ];


describe('Test React Microservice Component', () => {
  test('Verify override component renders even match menu not available', (done) => {
   
    axiosMockAdapter.onGet('/apigw/v1/register/UI').reply(200, specs);
  
    let wrapper = shallow(<AppComponent menuName="Security" overrideComponent={OverrideComponent} routeUrl="/security" apiGwUrl={''} />);
    wrapper.instance().loadMenu = jest.fn(() => {
        wrapper
          .instance()
          .setState({
            loading: false,
          },()=>{
            jestExpect(wrapper.find(OverrideComponent).length).toEqual(1);
            done();
          });
      });

      jestExpect(wrapper.text()).toEqual('loading...');

  });

  test('Load single component when tabs not mentioned in navigation', (done) => {
   
    axiosMockAdapter.onGet('/apigw/v1/register/UI').reply(200, specs);
  
    let wrapper = shallow(<AppComponent menuName="CustomReports" routeUrl="/customreports" apiGwUrl={''} />);
    setTimeout(()=>{
      wrapper.update()
      jestExpect(wrapper.html()).toMatchSnapshot();
      done()
    },1000)
    
  });

  test('Verify override component renders even match menu not available for uiSpecUrl', (done) => {
   
    axiosMockAdapter.onGet('/uiSpecUrl/register/UI').reply(200, specs);
    internalCache.appSpecs = [];
    internalCache.componentLoaded = [];
  
    let wrapper = shallow(<AppComponent menuName="Security" overrideComponent={OverrideComponent} routeUrl="/security" apiGwUrl={''} uiSpecUrl={'/uiSpecUrl/register/UI'} />);
    wrapper.instance().loadMenu = jest.fn(() => {
        wrapper
          .instance()
          .setState({
            loading: false,
          },()=>{
            jestExpect(wrapper.find(OverrideComponent).length).toEqual(1);
            done();
          });
      });

      jestExpect(wrapper.text()).toEqual('loading...');

  });

  test('Load single component when tabs not mentioned in navigation', (done) => {
   
    axiosMockAdapter.onGet('/uiSpecUrl/register/UI').reply(200, specs);
  
    let wrapper = shallow(<AppComponent menuName="CustomReports" routeUrl="/customreports" apiGwUrl={''} uiSpecUrl={'/uiSpecUrl/register/UI'}/>);
    setTimeout(()=>{
      wrapper.update()
      jestExpect(wrapper.html()).toMatchSnapshot();
      done()
    },1000)
    
  });
  
});
