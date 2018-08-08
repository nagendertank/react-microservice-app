import AppComponent from '../src/AppComponent';

const getInstance = () => {
  return wrapper.instance();
};

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

  
});
