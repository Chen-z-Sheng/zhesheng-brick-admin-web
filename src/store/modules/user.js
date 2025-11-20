// src/store/modules/user.js
import { getUserInfo, login, logout /* 或者 getMe */ } from "@/api/user";
import { getAccessToken, removeAccessToken, setAccessToken } from "@/utils/accessToken";
import { resetRouter } from "@/router";
import { title, tokenName } from "@/config";
import { ElMessage } from "element-plus";
import { jwtDecode } from "jwt-decode";

// 从 JWT 中解析 userId（优先 id，其次 sub）
function deriveUserIdFromToken(token) {
  try {
    if (!token) return "";
    const p = jwtDecode(token);
    return String(p.id ?? p.sub ?? "");
  } catch {
    return "";
  }
}

const state = () => {
  const token = getAccessToken();
  return {
    accessToken: token,
    userId: deriveUserIdFromToken(token), // 启动时恢复 userId，避免拼接成 /user/
    username: "",
    avatar: "",
    permissions: [],
  };
};

const getters = {
  accessToken: (s) => s.accessToken,
  userId: (s) => s.userId,
  username: (s) => s.username,
  avatar: (s) => s.avatar,
  permissions: (s) => s.permissions,
};

const mutations = {
  setAccessToken(s, t) {
    s.accessToken = t;
    setAccessToken(t);
  },
  setUserId(s, id) {
    s.userId = id;
  },
  setUsername(s, v) { s.username = v; },
  setAvatar(s, v) { s.avatar = v; },
  setPermissions(s, v) { s.permissions = v; },
};

const actions = {
  setPermissions({ commit }, v) { commit("setPermissions", v); },

  async login({ commit }, userInfo) {
    const { data } = await login(userInfo);
    const accessToken = data[tokenName] || data.accessToken;
    if (!accessToken) {
      ElMessage.error(`登录接口异常，未正确返回 ${tokenName || "accessToken"}...`);
      return;
    }
    commit("setAccessToken", accessToken);

    // 解析 userId
    const id = deriveUserIdFromToken(accessToken);
    if (!id) {
      console.error("JWT 解析失败：未得到 userId");
      ElMessage.error("登录令牌解析失败");
      return;
    }
    commit("setUserId", id);

    const hour = new Date().getHours();
    const thisTime = hour < 8 ? "早上好" : hour <= 11 ? "上午好" : hour <= 13 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
    ElMessage.success(`欢迎登录${title}，${thisTime}！`);
  },

  async getUserInfo({ commit, state }) {
    try {
      // 兜底：没有 userId 就再从 token 解一次；还没有就直接返回空权限避免死循环请求 /user/
      if (!state.userId) {
        const id = deriveUserIdFromToken(state.accessToken);
        if (id) commit("setUserId", id);
        else {
          console.warn("[user/getUserInfo] userId 缺失，跳过请求");
          return [];
        }
      }

      // 如果你已经实现了 /server/admin/user/me，这里改成 const { data } = await getMe();
      const { data } = await getUserInfo(state.userId);
      if (!data) {
        ElMessage.error("验证失败，请重新登录...");
        return [];
      }

      // 字段映射
      const mapRoleCode = (code) => (code === 0 ? "admin" : code === 1 ? "manager" : "user");
      let permissions = [];
      if (typeof data.roleCode === "number") permissions = [mapRoleCode(data.roleCode)];
      else if (Array.isArray(data.permissions)) permissions = data.permissions;

      const username = data.username || "用户";
      const avatar = data.headUrl || data.avatar || "";

      if (!permissions.length) permissions = ["user"]; // 兜底

      commit("setPermissions", permissions);
      commit("setUsername", username);
      commit("setAvatar", avatar);
      return permissions;
    } catch (error) {
      console.error("获取用户信息失败:", error);
      ElMessage.error("获取用户信息失败，请重新登录");
      return [];
    }
  },

  async logout({ dispatch }) {
    try { await logout(); } catch {}
    await dispatch("resetAccessToken");
    await resetRouter();
    location.reload();
  },

  resetAccessToken({ commit }) {
    commit("setPermissions", []);
    commit("setUserId", "");
    commit("setAccessToken", "");
    removeAccessToken();
  },
};

export default { state, getters, mutations, actions };
