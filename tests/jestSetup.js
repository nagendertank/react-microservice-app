import React from "react";
import Enzyme, { shallow, render, mount, ReactWrapper } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter'
import renderer from "react-test-renderer";

var y = document.createElement("INPUT");
y.setAttribute("type", "hidden");
y.setAttribute("id", "deploymentType");
y.setAttribute("value", "local");
document.body.appendChild(y);

y = document.createElement("INPUT");
y.setAttribute("type", "hidden");
y.setAttribute("id", "inCwcCustomerId");
y.setAttribute("value", "testdemo3");
document.body.appendChild(y);

y = document.createElement("INPUT");
y.setAttribute("type", "hidden");
y.setAttribute("id", "inCwcSessionId");
y.setAttribute("value", "testSession");
document.body.appendChild(y);

// React 16 Enzyme adapter
Enzyme.configure({ adapter: new Adapter() });

// Make Enzyme functions available in all test files without importing
global.shallow = shallow;
global.render = render;
global.mount = mount;
global.renderer = renderer;
global.ReactWrapper = ReactWrapper;
global.React = React;

//start: needed to mock userdashboard loaded from external file in performance tab
class OverrideComponent extends React.Component {
  render(){
    return (
        <div id="UsersDashboardMock"/>
    )
  }
}

//end: needed to mock userdashboard loaded from external file in performance tab
global.axiosMockAdapter = new MockAdapter(axios);
global.OverrideComponent = OverrideComponent;
global.window.localStorage = global.window.sessionStorage = new class {
  constructor() {
    this.store = {};
  }
  
  getItem(key) {
    return this.store[key];
  }
  
  setItem(key, value) {
    this.store[key] = value.toString();
  }
  
  removeItem(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {}
  }
  
  key() {
    return Object.keys(this.store);
  }
};
