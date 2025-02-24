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

            // 将登录状态保存到 localStorage
            localStorage.setItem('user', JSON.stringify({
                isLoggedIn: true,
                userInfo: user.username,
                userId: user.userId,
                role: user.role
            }));
        },
        logout(state) {
            state.isLoggedIn = false;
            state.userInfo = null;
            state.userId = null;  // 清除 userId
            state.role = '';

            // 清除 localStorage 中的登录状态
            localStorage.removeItem('user');
        },
        initializeStore(state) {
            // 从 localStorage 恢复登录状态
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                state.isLoggedIn = user.isLoggedIn;
                state.userInfo = user.userInfo;
                state.userId = user.userId;
                state.role = user.role;
            }
        }
    },
    actions: {
        login({ commit }, user) {
            commit('login', user); // 提交 login mutation
        },
        logout({ commit }) {
            commit('logout');
        },
        initializeStore({ commit }) {
            commit('initializeStore');
        }
    },
    getters: {
        isLoggedIn: (state) => state.isLoggedIn,
        userInfo: (state) => state.userInfo,
        userId: (state) => state.userId,  // 获取 userId
        userRole: (state) => state.role,
    },
};

export default user;