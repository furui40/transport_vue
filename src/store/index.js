import { createStore } from 'vuex';
import user from './modules/user'; // 引入用户模块
import table from './modules/table'; // 引入 table 模块
import visualize from './modules/visualize';//引入可视化数据模块

const store = createStore({
    modules: {
        user, // 注册用户模块
        table, // 注册 table 模块
        visualize,//注册可视化数据模块
    },
    state: {
        // 可以在这里配置全局的状态
    },
    mutations: {
        // 全局 mutation
    },
    actions: {
        // 全局 action
    },
    getters: {
        // 全局 getters
    }
});

export default store;
