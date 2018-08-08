import React from "react";
import Enzyme, { shallow, render, mount, ReactWrapper } from "enzyme";
import Adapter from "enzyme-adapter-react-15";
import renderer from "react-test-renderer";


// React 16 Enzyme adapter
Enzyme.configure({ adapter: new Adapter() });

// Make Enzyme functions available in all test files without importing
global.shallow = shallow;
global.render = render;
global.mount = mount;
global.ReactWrapper = ReactWrapper;
global.React = React;
global.renderer = renderer;
