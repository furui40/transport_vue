const state = {
    history: {
        dynamicWeighing: [],
        weather: [],
        subside: [],
        waterPressure: [],
        humiture: []
    }
};

const getters = {
    getUploadHistory: (state) => (dataType) => {
        return state.history[dataType] || [];
    }
};

const mutations = {
    SET_UPLOAD_HISTORY(state, { dataType, history }) {
        state.history[dataType] = history;
    },
    ADD_HISTORY_ITEM(state, { dataType, record }) {
        const existingIndex = state.history[dataType].findIndex(
            item => item.filePath === record.filePath
        );

        if (existingIndex >= 0) {
            state.history[dataType].splice(existingIndex, 1, record);
        } else {
            state.history[dataType].unshift(record);
        }
    },
    DELETE_HISTORY_ITEM(state, { dataType, filePath }) {
        state.history[dataType] = state.history[dataType].filter(
            item => item.filePath !== filePath
        );
    },
    CLEAR_ALL_HISTORY(state, dataType) {
        state.history[dataType] = [];
    },
    UPDATE_HISTORY_ITEM(state, { dataType, filePath, updates }) {
        const item = state.history[dataType].find(item => item.filePath === filePath);
        if (item) {
            Object.assign(item, updates);
        }
    }
};

const actions = {
    async fetchUploadHistory({ commit }, dataType) {
        try {
            const history = JSON.parse(localStorage.getItem(`uploadHistory_${dataType}`)) || [];
            commit('SET_UPLOAD_HISTORY', { dataType, history });
        } catch (error) {
            console.error('加载上传历史失败:', error);
            throw error;
        }
    },

    async addUploadHistory({ commit, state }, { dataType, record }) {
        try {
            commit('ADD_HISTORY_ITEM', { dataType, record });

            localStorage.setItem(
                `uploadHistory_${dataType}`,
                JSON.stringify(state.history[dataType])
            );
        } catch (error) {
            console.error('添加上传历史失败:', error);
            throw error;
        }
    },

    async deleteHistoryItem({ commit, state }, { dataType, filePath }) {
        try {
            commit('DELETE_HISTORY_ITEM', { dataType, filePath });

            localStorage.setItem(
                `uploadHistory_${dataType}`,
                JSON.stringify(state.history[dataType])
            );
        } catch (error) {
            console.error('删除上传历史失败:', error);
            throw error;
        }
    },

    async clearAllHistoryByType({ commit, state }, dataType) {
        try {
            commit('CLEAR_ALL_HISTORY', dataType);

            localStorage.setItem(
                `uploadHistory_${dataType}`,
                JSON.stringify(state.history[dataType])
            );
        } catch (error) {
            console.error('清空历史记录失败:', error);
            throw error;
        }
    },

    async updateHistoryItem({ commit, state }, { dataType, filePath, updates }) {
        try {
            commit('UPDATE_HISTORY_ITEM', { dataType, filePath, updates });

            localStorage.setItem(
                `uploadHistory_${dataType}`,
                JSON.stringify(state.history[dataType])
            );
        } catch (error) {
            console.error('更新历史记录失败:', error);
            throw error;
        }
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
};