import { c as create_ssr_component, b as compute_rest_props, d as spread, f as escape_object, h as escape_attribute_value, s as setContext, v as validate_component, i as createEventDispatcher, g as getContext, a as subscribe, e as escape } from "../../../chunks/index2.js";
import "mapbox-gl";
import "@mapbox/mapbox-gl-geocoder";
import "@mapbox/tilebelt";
import "babylonjs";
import "babylonjs-loaders";
import "babylonjs-serializers";
import "color-convert";
import "stackblur-canvas";
import { w as writable } from "../../../chunks/index.js";
import "d3";
function toClassName(value) {
  let result = "";
  if (typeof value === "string" || typeof value === "number") {
    result += value;
  } else if (typeof value === "object") {
    if (Array.isArray(value)) {
      result = value.map(toClassName).filter(Boolean).join(" ");
    } else {
      for (let key in value) {
        if (value[key]) {
          result && (result += " ");
          result += key;
        }
      }
    }
  }
  return result;
}
function classnames(...args) {
  return args.map(toClassName).filter(Boolean).join(" ");
}
const Modal_svelte_svelte_type_style_lang = "";
function getVerticalClass(vertical) {
  if (vertical === false) {
    return false;
  } else if (vertical === true || vertical === "xs") {
    return "flex-column";
  }
  return `flex-${vertical}-column`;
}
const Nav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let $$restProps = compute_rest_props($$props, [
    "class",
    "tabs",
    "pills",
    "vertical",
    "horizontal",
    "justified",
    "fill",
    "navbar",
    "card"
  ]);
  let { class: className = "" } = $$props;
  let { tabs = false } = $$props;
  let { pills = false } = $$props;
  let { vertical = false } = $$props;
  let { horizontal = "" } = $$props;
  let { justified = false } = $$props;
  let { fill = false } = $$props;
  let { navbar = false } = $$props;
  let { card = false } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.tabs === void 0 && $$bindings.tabs && tabs !== void 0)
    $$bindings.tabs(tabs);
  if ($$props.pills === void 0 && $$bindings.pills && pills !== void 0)
    $$bindings.pills(pills);
  if ($$props.vertical === void 0 && $$bindings.vertical && vertical !== void 0)
    $$bindings.vertical(vertical);
  if ($$props.horizontal === void 0 && $$bindings.horizontal && horizontal !== void 0)
    $$bindings.horizontal(horizontal);
  if ($$props.justified === void 0 && $$bindings.justified && justified !== void 0)
    $$bindings.justified(justified);
  if ($$props.fill === void 0 && $$bindings.fill && fill !== void 0)
    $$bindings.fill(fill);
  if ($$props.navbar === void 0 && $$bindings.navbar && navbar !== void 0)
    $$bindings.navbar(navbar);
  if ($$props.card === void 0 && $$bindings.card && card !== void 0)
    $$bindings.card(card);
  classes = classnames(className, navbar ? "navbar-nav" : "nav", horizontal ? `justify-content-${horizontal}` : false, getVerticalClass(vertical), {
    "nav-tabs": tabs,
    "card-header-tabs": card && tabs,
    "nav-pills": pills,
    "card-header-pills": card && pills,
    "nav-justified": justified,
    "nav-fill": fill
  });
  return `<ul${spread([escape_object($$restProps), { class: escape_attribute_value(classes) }], {})}>${slots.default ? slots.default({}) : ``}</ul>`;
});
const NavItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let $$restProps = compute_rest_props($$props, ["class", "active"]);
  let { class: className = "" } = $$props;
  let { active = false } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0)
    $$bindings.active(active);
  classes = classnames(className, "nav-item", active ? "active" : false);
  return `<li${spread([escape_object($$restProps), { class: escape_attribute_value(classes) }], {})}>${slots.default ? slots.default({}) : ``}</li>`;
});
const NavLink = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let $$restProps = compute_rest_props($$props, ["class", "disabled", "active", "href"]);
  let { class: className = "" } = $$props;
  let { disabled = false } = $$props;
  let { active = false } = $$props;
  let { href = "#" } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0)
    $$bindings.active(active);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0)
    $$bindings.href(href);
  classes = classnames(className, "nav-link", { disabled, active });
  return `<a${spread(
    [
      escape_object($$restProps),
      { href: escape_attribute_value(href) },
      { class: escape_attribute_value(classes) }
    ],
    {}
  )}>${slots.default ? slots.default({}) : ``}</a>`;
});
const Offcanvas_svelte_svelte_type_style_lang = "";
const Spinner = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let $$restProps = compute_rest_props($$props, ["class", "type", "size", "color"]);
  let { class: className = "" } = $$props;
  let { type = "border" } = $$props;
  let { size = "" } = $$props;
  let { color = "" } = $$props;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.type === void 0 && $$bindings.type && type !== void 0)
    $$bindings.type(type);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0)
    $$bindings.size(size);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0)
    $$bindings.color(color);
  classes = classnames(className, size ? `spinner-${type}-${size}` : false, `spinner-${type}`, color ? `text-${color}` : false);
  return `<div${spread(
    [
      escape_object($$restProps),
      { role: "status" },
      { class: escape_attribute_value(classes) }
    ],
    {}
  )}><span class="visually-hidden">${slots.default ? slots.default({}) : `Loading...`}</span></div>`;
});
const TabHeader = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, []);
  setContext("tabs", true);
  return `${validate_component(Nav, "Nav").$$render($$result, Object.assign({}, $$restProps), {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
const TabContent = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let $$restProps = compute_rest_props($$props, ["class", "pills", "vertical"]);
  const dispatch = createEventDispatcher();
  let { class: className = "" } = $$props;
  let { pills = false } = $$props;
  let { vertical = false } = $$props;
  const activeTabId = writable();
  setContext("tabContent", {
    activeTabId,
    setActiveTab: (tabId) => {
      activeTabId.set(tabId);
      dispatch("tab", tabId);
    }
  });
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.pills === void 0 && $$bindings.pills && pills !== void 0)
    $$bindings.pills(pills);
  if ($$props.vertical === void 0 && $$bindings.vertical && vertical !== void 0)
    $$bindings.vertical(vertical);
  classes = classnames("tab-content", className, { "d-flex align-items-start": vertical });
  return `<div${spread([escape_object($$restProps), { class: escape_attribute_value(classes) }], {})}>${validate_component(TabHeader, "TabHeader").$$render(
    $$result,
    {
      class: classnames({ "me-3": vertical }),
      pills,
      tabs: !pills,
      vertical
    },
    {},
    {
      default: () => {
        return `${slots.default ? slots.default({}) : ``}`;
      }
    }
  )}
  ${slots.default ? slots.default({}) : ``}</div>`;
});
const TabPane = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classes;
  let $$restProps = compute_rest_props($$props, ["class", "active", "disabled", "tab", "tabId"]);
  let $activeTabId, $$unsubscribe_activeTabId;
  let { class: className = "" } = $$props;
  let { active = false } = $$props;
  let { disabled = false } = $$props;
  let { tab = void 0 } = $$props;
  let { tabId = void 0 } = $$props;
  const tabs = getContext("tabs");
  const { activeTabId, setActiveTab } = getContext("tabContent");
  $$unsubscribe_activeTabId = subscribe(activeTabId, (value) => $activeTabId = value);
  let tabOpen = active;
  if ($$props.class === void 0 && $$bindings.class && className !== void 0)
    $$bindings.class(className);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0)
    $$bindings.active(active);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  if ($$props.tab === void 0 && $$bindings.tab && tab !== void 0)
    $$bindings.tab(tab);
  if ($$props.tabId === void 0 && $$bindings.tabId && tabId !== void 0)
    $$bindings.tabId(tabId);
  {
    if ($activeTabId !== void 0)
      tabOpen = $activeTabId === tabId;
  }
  classes = classnames("tab-pane", className, { active: tabOpen, show: tabOpen });
  $$unsubscribe_activeTabId();
  return `${tabs ? `${validate_component(NavItem, "NavItem").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(NavLink, "NavLink").$$render($$result, { active: tabOpen, disabled }, {}, {
        default: () => {
          return `${tab ? `${escape(tab)}` : ``}
      ${slots.tab ? slots.tab({}) : ``}`;
        }
      })}`;
    }
  })}` : `<div${spread([escape_object($$restProps), { class: escape_attribute_value(classes) }], {})}>${slots.default ? slots.default({}) : ``}</div>`}`;
});
const LoadingScreen = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { text = "" } = $$props;
  let { backgroundColor: backgroundColor2 = "" } = $$props;
  let { loading = true } = $$props;
  let containerWidth = 0;
  if ($$props.text === void 0 && $$bindings.text && text !== void 0)
    $$bindings.text(text);
  if ($$props.backgroundColor === void 0 && $$bindings.backgroundColor && backgroundColor2 !== void 0)
    $$bindings.backgroundColor(backgroundColor2);
  if ($$props.loading === void 0 && $$bindings.loading && loading !== void 0)
    $$bindings.loading(loading);
  return `<div class="d-flex flex-column justify-content-center align-items-center h-100 text-center" style="${"background-color: " + escape(backgroundColor2, true) + "; overflow: hidden;"}"><img src="/favicon.png" alt="Logo" style="width: 20%;">
	<div><span class="mb-4 text-center" style="${"font-size: " + escape(containerWidth / 15, true) + "px; font-weight: semi-bold;"}">${escape(text)}</span>
		${loading ? `${validate_component(Spinner, "Spinner").$$render($$result, { class: "", color: "primary" }, {}, {})}` : ``}</div></div>`;
});
const BabylonScene_svelte_svelte_type_style_lang = "";
globalThis && globalThis.__awaiter || function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
const geocoderStyle = "";
const SoilDisplay_svelte_svelte_type_style_lang = "";
const MapDisplay_svelte_svelte_type_style_lang = "";
const _page__svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-er1u6z{scrollbar-width:auto;scrollbar-color:#000000 #ffffff}.svelte-er1u6z::-webkit-scrollbar{width:10px}.svelte-er1u6z::-webkit-scrollbar-track{background:rgba(0, 0, 0, 0.2)}.svelte-er1u6z::-webkit-scrollbar-thumb{background-color:#000000;border-radius:12px;border:2px solid #ffffff}#info-panel.svelte-er1u6z{overflow:hidden}.scrollable-div.svelte-er1u6z{overflow-y:scroll;overflow-x:hidden;padding:20px;flex-grow:1;height:100%}",
  map: null
};
let backgroundColor = "gray";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${$$result.head += `<!-- HEAD_svelte-d57v99_START --><link href="https://api.mapbox.com/mapbox-gl-js/v2.5.1/mapbox-gl.css" rel="stylesheet" class="svelte-er1u6z"><!-- HEAD_svelte-d57v99_END -->`, ""}
<div class="row p-0 m-0 svelte-er1u6z" style="width: 100vw; height: 100vh;"><div class="col-xl-7 p-0 m-0 svelte-er1u6z"><div id="map-holder" class="svelte-er1u6z"><div id="map" style="width: 100%; height: 100vh;" class="svelte-er1u6z"></div></div></div>
	<div id="info-panel" class="col-xl-5 p-0 m-0 d-flex flex-column svelte-er1u6z" style="${"background-color:" + escape(backgroundColor, true) + ";max-height:100vh;"}"><div id="model-container" class="ratio ratio-16x9 w-100 svelte-er1u6z" style="max-height:50vh;">${`${validate_component(LoadingScreen, "LoadingScreen").$$render(
    $$result,
    {
      text: "Select Property on Map",
      loading: false
    },
    {},
    {}
  )}`}</div>

		

		${validate_component(TabContent, "TabContent").$$render(
    $$result,
    {
      class: "pt-3 px-3 flex-fill d-flex flex-column flex-grow-1",
      style: "overflow: hidden;"
    },
    {},
    {
      default: () => {
        return `${validate_component(TabPane, "TabPane").$$render(
          $$result,
          {
            tabId: "info",
            active: true,
            style: "overflow: hidden; height:100%;"
          },
          {},
          {
            tab: () => {
              return `<span class="text-black svelte-er1u6z" slot="tab">Info </span>`;
            },
            default: () => {
              return `<div class="scrollable-div min-h-100 svelte-er1u6z">${``}</div>`;
            }
          }
        )}
			${validate_component(TabPane, "TabPane").$$render(
          $$result,
          {
            tabId: "terrain",
            style: "overflow: hidden; height:100%;"
          },
          {},
          {
            tab: () => {
              return `<span class="text-black svelte-er1u6z" slot="tab">Terrain </span>`;
            },
            default: () => {
              return `<div style="overflow: hidden; height:100%;" class="svelte-er1u6z"><div class="scrollable-div svelte-er1u6z">${``}</div></div>`;
            }
          }
        )}
			${validate_component(TabPane, "TabPane").$$render(
          $$result,
          {
            tabId: "soil",
            style: "overflow: hidden; height:100%;"
          },
          {},
          {
            tab: () => {
              return `<span class="text-black svelte-er1u6z" slot="tab">Soil </span>`;
            },
            default: () => {
              return `<div class="scrollable-div svelte-er1u6z">${``}</div>`;
            }
          }
        )}
			${validate_component(TabPane, "TabPane").$$render(
          $$result,
          {
            tabId: "weather",
            style: "overflow: hidden; height:100%;"
          },
          {},
          {
            tab: () => {
              return `<span class="text-black svelte-er1u6z" slot="tab">Weather </span>`;
            },
            default: () => {
              return `<div class="scrollable-div svelte-er1u6z">${``}</div>`;
            }
          }
        )}`;
      }
    }
  )}</div>
</div>`;
});
export {
  Page as default
};
