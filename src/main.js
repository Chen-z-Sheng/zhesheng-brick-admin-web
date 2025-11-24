// src/main.js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "@/store";
import plugins from "./plugins";
import { printLayoutsInfo } from "@/utils/printInfo";
import { registerLayoutComponents } from "@/layouts/export";
import eventBus from "@/utils/eventBus";
import { title } from "@/config";
import { mockXHR } from "@/utils/static";

import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// ✅ 用这个：element-ui(v3)，不是 element-plus
import formCreate from "@form-create/element-ui";
import FcDesigner from "@form-create/designer";

const app = createApp(App);

app.use(store);
app.use(router);
plugins(app);
registerLayoutComponents(app);

app.config.globalProperties.$eventBus = eventBus;
app.config.globalProperties.$baseTitle = title;
window.$eventBus = eventBus;
window.$baseTitle = title;

if (process.env.NODE_ENV === "production") {
  mockXHR();
  console.log("生产环境已启用Mock拦截，所有接口请求将被Mock拦截");
}
printLayoutsInfo();

app.use(ElementPlus);

// ⚠️ 一定先挂渲染器，再挂设计器
app.use(formCreate);
app.use(FcDesigner);

app.mount("#vue-admin-better");
