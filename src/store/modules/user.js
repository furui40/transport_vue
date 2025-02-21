const user = {
    namespaced: true,
    state: {
        isLoggedIn: false,  // 登录状态
        userInfo: null,     // 用户信息
        userId: null,       // 用户 ID
        role: '',           // 用户角色
    },
    mutations: {
        login(state, user) {
            state.isLoggedIn = true;
            state.userInfo = user.username;
            state.userId = user.userId;  // 存储 userId
            state.role = user.role;
        },
        logout(state) {
            state.isLoggedIn = false;
            state.userInfo = null;
            state.userId = null;  // 清除 userId
            state.role = '';
        },
    },
    actions: {
        login({ commit }, user) {
            commit('login', user); // 提交 login mutation
        },
        logout({ commit }) {
            commit('logout');
        },
    },
    getters: {
        isLoggedIn: (state) => state.isLoggedIn,
        userInfo: (state) => state.userInfo,
        userId: (state) => state.userId,  // 获取 userId
        userRole: (state) => state.role,
    },
};

export default user;
