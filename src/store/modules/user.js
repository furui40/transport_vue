import axios from 'axios';

const user = {
    namespaced: true,
    state: {
        isLoggedIn: false,  // 登录状态
        userInfo: null,     // 用户信息
        userId: null,       // 用户 ID
        role: '',           // 用户角色
        loginTime: null,    // 登录时间
        avatarUrl: '',      // 用户头像 URL
    },
    mutations: {
        login(state, user) {
            state.isLoggedIn = true;
            state.userInfo = user.username;
            state.userId = user.userId;  // 存储 userId
            state.role = user.role;
            state.loginTime = new Date().getTime(); // 记录登录时间

            // 将登录状态保存到 localStorage
            localStorage.setItem('user', JSON.stringify({
                isLoggedIn: true,
                userInfo: user.username,
                userId: user.userId,
                role: user.role,
                loginTime: state.loginTime, // 保存登录时间
            }));
        },
        logout(state) {
            state.isLoggedIn = false;
            state.userInfo = null;
            state.userId = null;  // 清除 userId
            state.role = '';
            state.loginTime = null; // 清除登录时间
            state.avatarUrl = '';

            // 清除 localStorage 中的登录状态
            localStorage.removeItem('user');
        },
        setRole(state, role) {
            state.role = role; // 更新用户角色

            // 更新 localStorage 中的角色
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                user.role = role;
                localStorage.setItem('user', JSON.stringify(user));
            }
        },
        setAvatarUrl(state, avatarUrl) {
            state.avatarUrl = avatarUrl; // 更新用户角色
            // 将头像 URL 保存到 localStorage
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                user.avatarUrl = avatarUrl;
                localStorage.setItem('user', JSON.stringify(user));
            }
        },
        initializeStore(state) {
            // 从 localStorage 恢复登录状态
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const currentTime = new Date().getTime();
                const loginTime = user.loginTime;

                // 检查登录状态是否过期（1440 分钟，一天）
                if (currentTime - loginTime <= 1440 * 60 * 1000) {
                    state.isLoggedIn = user.isLoggedIn;
                    state.userInfo = user.userInfo;
                    state.userId = user.userId;
                    state.role = user.role;
                    state.loginTime = user.loginTime;
                    state.avatarUrl = user.avatarUrl || ''; // 恢复头像 URL
                } else {
                    // 登录状态已过期，清除状态
                    localStorage.removeItem('user');
                }
            }
        },
    },
    actions: {
        login({ commit }, user) {
            commit('login', user); // 提交 login mutation
            axios.get(`http://localhost:8080/avatar/getavatar?userId=${user.userId}`)
                .then(response => {
                    if (response.data) {
                        commit('setAvatarUrl', response.data); // 更新头像 URL
                    }
                })
                .catch(error => {
                    console.error('获取头像失败:', error);
                });
        },
        logout({ commit }) {
            commit('logout');
        },
        setRole({ commit }, role) {
            commit('setRole', role); // 更新用户角色
        },
        initializeStore({ commit }) {
            commit('initializeStore');
        },
        checkLoginTimeout({ commit, state }) {
            const currentTime = new Date().getTime();
            const loginTime = state.loginTime;

            // 如果登录状态已过期（1440 分钟），则登出
            if (loginTime && currentTime - loginTime > 1440 * 60 * 1000) {
                commit('logout');
                return true; // 返回 true 表示已过期
            }
            return false; // 返回 false 表示未过期
        },
        updateAvatar({ commit }, avatarUrl) {
            commit('setAvatarUrl', avatarUrl);
        },
    },
    getters: {
        isLoggedIn: (state) => state.isLoggedIn,
        userInfo: (state) => state.userInfo,
        userId: (state) => state.userId,
        userRole: (state) => state.role,
        loginTime: (state) => state.loginTime,
    },
};

export default user;