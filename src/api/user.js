import request from "@/utils/request";

// 登录
export async function login (data) {
  return request({
    url: "/auth/login",
    method: "post",
    data,
  });
}

// 获取用户信息
export function getUserInfo (userId) {
  return request({
    url: `users/${userId}`,
    method: "get",
  });
}

// 退出登录
export function logout () {
  return request({
    url: "/auth/logout",
    method: "post",
  });
}

// 注册（你后端是 create）
export function register (data) {
  return request({
    url: "/users/create",
    method: "post",
    data,
  });
}

// 刷新 token（可选）
export function refreshToken () {
  return request({
    url: "/auth/refresh",
    method: "post",
  });
}
