import axios from "axios";
import {
  baseURL,
  contentType,
  debounce,
  invalidCode,
  loginInterception,
  noPermissionCode,
  requestTimeout,
  successCode,
  tokenName,
} from "@/config";
import store from "@/store";
import qs from "qs";
import router from "@/router";
import { isArray } from "@/utils/validate";
import { ElLoading, ElMessage } from "element-plus";
import { pickBy, identity } from "lodash-es";

// 在生产环境下引入mock数据
if (process.env.NODE_ENV === "production") {
  const mockContext = require.context("../../mock/controller", true, /\.js$/);
  mockContext.keys().forEach((key) => {
    const mockModule = mockContext(key);
    if (mockModule.default) {
      mockModule.default;
    } else {
      mockModule;
    }
  });
}

let loadingInstance;

/**
 * @description 处理code异常
 * @param {*} code
 * @param {*} msg
 */
const handleCode = (code, msg) => {
  switch (code) {
    case invalidCode:
      ElMessage.error(msg || `后端接口${code}异常`);
      store.dispatch("user/resetAccessToken");
      if (loginInterception) {
        location.reload();
      }
      break;
    case noPermissionCode:
      router.push({ path: "/401" }).catch(() => { });
      break;
    default:
      ElMessage.error(msg || `后端接口${code}异常`);
      break;
  }
};

// 请求重试配置
const retryConfig = {
  retry: 3, // 重试次数
  retryDelay: 1000, // 重试间隔时间
};

// 创建axios实例
const instance = axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    "Content-Type": contentType,
  },
});

// 请求重试方法
instance.defaults.retry = retryConfig.retry;
instance.defaults.retryDelay = retryConfig.retryDelay;

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // ✅ 从 store 拿到 token，放到 Authorization 头里
    const token = store.getters?.accessToken || store.state.user?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // （可选）如果你后端仅接受 JSON，这里保持默认 Content-Type 即可
    // config.headers['Content-Type'] = 'application/json;charset=UTF-8'

    // 这里会过滤所有为空、0、false 的 key（如果你需要保留 0/false，请删掉这一行）
    if (config.data) config.data = pickBy(config.data, identity);

    if (
      config.data &&
      config.headers["Content-Type"] ===
      "application/x-www-form-urlencoded;charset=UTF-8"
    ) {
      config.data = qs.stringify(config.data);
    }

    if (debounce.some((item) => config.url.includes(item))) {
      loadingInstance = ElLoading.service();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (loadingInstance) loadingInstance.close();

    const { data, config } = response;

    if (data === undefined || data === null) {
      ElMessage.error("后端接口返回数据为空");
      return Promise.reject("后端接口返回数据为空");
    }

    // ✅ 兼容 message/msg 两种字段
    const code = data.code !== undefined ? data.code : null;
    const msg =
      data.message !== undefined
        ? data.message
        : data.msg !== undefined
          ? data.msg
          : "未知错误";

    // 操作正常 Code
    const codeVerificationArray = isArray(successCode)
      ? [...successCode]
      : [successCode];

    if (code !== null && codeVerificationArray.includes(code)) {
      // 按你现有调用习惯，保留返回整个 data（包含 data.code/message/data）
      return data;
    } else {
      handleCode(code, msg);
      return Promise.reject(
        `vue-admin-better请求异常拦截:${JSON.stringify({
          url: config.url,
          code,
          msg,
        })}` || "Error"
      );
    }
  },
  (error) => {
    if (loadingInstance) loadingInstance.close();

    // 重试逻辑保持不变…
    const { config } = error;
    if (config && config.retry) {
      config.__retryCount = config.__retryCount || 0;
      if (config.__retryCount < config.retry) {
        config.__retryCount += 1;
        const backoff = new Promise((resolve) => {
          setTimeout(() => {
            console.log(
              `重试请求: ${config.url}, 尝试次数: ${config.__retryCount}`
            );
            resolve();
          }, config.retryDelay || 1000);
        });
        return backoff.then(() => instance(config));
      }
    }

    if (!error) {
      ElMessage.error("发生未知错误");
      return Promise.reject("发生未知错误");
    }

    const { response, message } = error;

    if (response && response.data) {
      // 这里是 HTTP 层错误（如 401/403/500）
      const { status, data } = response;
      const serverMsg =
        data?.message ?? data?.msg ?? message ?? "未知错误"; // ✅ 也兼容 message/msg
      handleCode(status, serverMsg);
      return Promise.reject(error);
    } else {
      let errorMsg = "后端接口未知异常";
      if (message) {
        if (message === "Network Error") errorMsg = "后端接口连接异常";
        else if (message.includes("timeout")) errorMsg = "后端接口请求超时";
        else if (message.includes("Request failed with status code")) {
          const code = message.slice(-3);
          errorMsg = `后端接口${code}异常`;
        }
      }
      ElMessage.error(errorMsg);
      return Promise.reject(error);
    }
  }
);

export default instance;
