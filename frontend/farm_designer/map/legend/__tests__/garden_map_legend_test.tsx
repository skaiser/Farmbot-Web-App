jest.mock("../../../../history", () => ({
  history: { push: jest.fn() },
  getPathArray: () => [],
}));

let mockAtMax = false;
let mockAtMin = false;
jest.mock("../../zoom", () => {
  return {
    atMaxZoom: () => mockAtMax,
    atMinZoom: () => mockAtMin,
  };
});

let mockDev = false;
jest.mock("../../../../account/dev/dev_support", () => ({
  DevSettings: {
    futureFeaturesEnabled: () => mockDev,
  }
}));

import * as React from "react";
import { shallow, mount } from "enzyme";
import {
  GardenMapLegend, ZoomControls, PointsSubMenu, RotationSelector
} from "../garden_map_legend";
import { GardenMapLegendProps } from "../../interfaces";
import { clickButton } from "../../../../__test_support__/helpers";
import { history } from "../../../../history";
import { BooleanSetting } from "../../../../session_keys";
import { fakeTimeSettings } from "../../../../__test_support__/fake_time_settings";

describe("<GardenMapLegend />", () => {
  const fakeProps = (): GardenMapLegendProps => ({
    zoom: () => () => undefined,
    toggle: () => () => undefined,
    updateBotOriginQuadrant: () => () => undefined,
    botOriginQuadrant: 2,
    legendMenuOpen: true,
    showPlants: false,
    showPoints: false,
    showSpread: false,
    showFarmbot: false,
    showImages: false,
    showSensorReadings: false,
    hasSensorReadings: false,
    dispatch: jest.fn(),
    timeSettings: fakeTimeSettings(),
    getConfigValue: jest.fn(),
    imageAgeInfo: { newestDate: "", toOldest: 1 },
  });

  it("renders", () => {
    const wrapper = mount(<GardenMapLegend {...fakeProps()} />);
    ["plants", "origin", "move"].map(string =>
      expect(wrapper.text().toLowerCase()).toContain(string));
    expect(wrapper.html()).toContain("filter");
    expect(wrapper.html()).not.toContain("extras");
  });

  it("shows submenu", () => {
    mockDev = true;
    const p = fakeProps();
    p.hasSensorReadings = true;
    const wrapper = mount(<GardenMapLegend {...p} />);
    expect(wrapper.html()).toContain("filter");
    expect(wrapper.html()).toContain("extras");
    mockDev = false;
  });
});

describe("<ZoomControls />", () => {
  const expectDisabledBtnCountToEqual = (expected: number) => {
    const wrapper = shallow(<ZoomControls
      zoom={jest.fn()}
      getConfigValue={jest.fn()} />);
    expect(wrapper.find(".disabled").length).toEqual(expected);
  };

  it("zoom buttons active", () => {
    mockAtMax = false;
    mockAtMin = false;
    expectDisabledBtnCountToEqual(0);
  });

  it("zoom out button disabled", () => {
    mockAtMax = false;
    mockAtMin = true;
    expectDisabledBtnCountToEqual(1);
  });

  it("zoom in button disabled", () => {
    mockAtMax = true;
    mockAtMin = false;
    expectDisabledBtnCountToEqual(1);
  });
});

describe("<PointsSubMenu />", () => {
  it("navigates to point creator", () => {
    const wrapper = mount(<PointsSubMenu
      toggle={jest.fn()}
      getConfigValue={jest.fn()} />);
    clickButton(wrapper, 0, "point creator");
    expect(history.push).toHaveBeenCalledWith(
      "/app/designer/plants/create_point");
  });

  it("shows historic points", () => {
    const toggle = jest.fn();
    const wrapper = shallow(<PointsSubMenu
      toggle={toggle}
      getConfigValue={() => true} />);
    const toggleBtn = wrapper.find("LayerToggle");
    expect(toggleBtn.props().value).toEqual(true);
    toggleBtn.simulate("click");
    expect(toggle).toHaveBeenCalledWith(BooleanSetting.show_historic_points);
  });
});

describe("<RotationSelector />", () => {
  it("swaps map x&y", () => {
    const dispatch = jest.fn();
    const wrapper = mount(<RotationSelector
      dispatch={dispatch} value={false} />);
    wrapper.find("button").simulate("click");
    expect(dispatch).toHaveBeenCalled();
  });

  it("shows correct status", () => {
    const wrapper = mount(<RotationSelector
      dispatch={jest.fn()} value={true} />);
    expect(wrapper.find("button").hasClass("green")).toBeTruthy();
  });
});
