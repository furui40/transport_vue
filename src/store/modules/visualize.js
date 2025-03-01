// store/modules/visualize.js
const state = {
    data: [],
    dataType: '',
};

const mutations = {
    SET_VISUALIZE_DATA(state, payload) {
        state.data = payload.data;
        state.dataType = payload.dataType;
    },
};

const actions = {
    setVisualizeData({ commit }, payload) {
        commit('SET_VISUALIZE_DATA', payload);
    },
};

export default {
    namespaced: true,
    state,
    mutations,
    actions,
};