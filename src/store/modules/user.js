import { getUserInfo, login, logout } from "@/api/user"
import { getAccessToken, removeAccessToken, setAccessToken } from "@/utils/accessToken"
import { resetRouter } from "@/router"
import { title } from "@/config"
import { ElMessage } from "element-plus"
import { jwtDecode } from "jwt-decode"

function deriveUserIdFromToken(token) {
  try {
    if (!token) return ""
    const p = jwtDecode(token)
    return String(p.id ?? p.sub ?? "")
  } catch {
    return ""
  }
}

const state = () => {
  const token = getAccessToken()
  return {
    accessToken: token,
    refreshToken: "",
    tokenType: "Bearer",
    userId: deriveUserIdFromToken(token),
    username: "",
    avatar: "",
    permissions: [],
    userLoaded: false,
  }
}

const getters = {
  accessToken: s => s.accessToken,
  refreshToken: s => s.refreshToken,
  tokenType: s => s.tokenType,
  userId: s => s.userId,
  username: s => s.username,
  avatar: s => s.avatar,
  permissions: s => s.permissions,
  userLoaded: s => s.userLoaded,
}

const mutations = {
  setAccessToken(s, t) { s.accessToken = t; setAccessToken(t) },
  setRefreshToken(s, t) { s.refreshToken = t || "" },
  setTokenType(s, t) { s.tokenType = t || "Bearer" },
  setUserId(s, id) { s.userId = id },
  setUsername(s, v) { s.username = v },
  setAvatar(s, v) { s.avatar = v },
  setPermissions(s, v) { s.permissions = v || [] },
  SET_USER_LOADED(s, v) { s.userLoaded = !!v },
}

const actions = {
  setPermissions({ commit }, v) { commit("setPermissions", v) },

  async login({ commit }, userInfo) {
    const { data } = await login(userInfo)
    const { accessToken, refreshToken, tokenType } = data || {}
    if (!accessToken) {
      ElMessage.error("登录接口异常：未返回 accessToken")
      return
    }
    commit("setAccessToken", accessToken)
    commit("setRefreshToken", refreshToken || "")
    commit("setTokenType", tokenType || "Bearer")

    const id = deriveUserIdFromToken(accessToken)
    if (!id) {
      ElMessage.error("登录令牌解析失败")
      return
    }
    commit("setUserId", id)

    const hour = new Date().getHours()
    const thisTime = hour < 8 ? "早上好" : hour <= 11 ? "上午好" : hour <= 13 ? "中午好" : hour < 18 ? "下午好" : "晚上好"
    ElMessage.success(`欢迎登录${title}，${thisTime}！`)
  },

  async getUserInfo({ commit, state }) {
    try {
      if (!state.userId) {
        const id = deriveUserIdFromToken(state.accessToken)
        if (id) commit("setUserId", id)
        else {
          console.warn("[user/getUserInfo] userId 缺失，跳过请求")
          return []
        }
      }

      const { data } = await getUserInfo(state.userId)
      if (!data) {
        ElMessage.error("验证失败，请重新登录")
        return []
      }

      const mapRoleCode = (code) => (code === 0 ? "admin" : code === 1 ? "manager" : "user")
      let permissions = []
      if (typeof data.roleCode === "number") permissions = [mapRoleCode(data.roleCode)]
      else if (Array.isArray(data.permissions)) permissions = data.permissions

      const username = data.username || "用户"
      const avatar = data.avatarUrl || data.avatar || ""

      if (!permissions.length) permissions = ["user"]

      commit("setPermissions", permissions)
      commit("setUsername", username)
      commit("setAvatar", avatar)
      commit("SET_USER_LOADED", true)
      return permissions
    } catch (error) {
      console.error("获取用户信息失败:", error)
      ElMessage.error("获取用户信息失败，请重新登录")
      return []
    }
  },

  async logout({ dispatch }) {
    try { await logout() } catch { }
    await dispatch("resetAccessToken")
    await resetRouter()
    location.reload()
  },

  resetAccessToken({ commit }) {
    commit("setPermissions", [])
    commit("setUserId", "")
    commit("setAccessToken", "")
    commit("setRefreshToken", "")
    commit("setTokenType", "Bearer")
    commit("SET_USER_LOADED", false)
    removeAccessToken()
  },
}

export default { state, getters, mutations, actions }
