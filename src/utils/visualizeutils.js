// src/utils/visualizeutils.js
import * as echarts from 'echarts';

/**
 * 计算列的最小值和最大值
 * @param {Array} data - 数据
 * @param {string} column - 列名
 * @returns {Object} - 包含 min 和 max 的对象
 */
export function calculateColumnStats(data, column) {
    if (!data || data.length === 0 || !column) {
        return { min: null, max: null };
    }
    const columnData = data.map((item) => item[column]);
    return {
        min: Math.min(...columnData),
        max: Math.max(...columnData),
    };
}

/**
 * 渲染自定义饼状图
 * @param {HTMLElement} chartDom - 图表容器 DOM 元素
 * @param {Array} data - 数据
 * @param {string} selectedColumn - 当前选择的列
 * @param {Array} customRanges - 自定义区间配置
 */
export function renderColumnPieChart(chartDom, data, selectedColumn, customRanges) {
    if (!selectedColumn || data.length === 0) {
        throw new Error('请选择列或确保数据存在');
    }

    // 检查区间配置是否有效
    const validRanges = customRanges.filter(range => range.min !== null && range.max !== null);
    if (validRanges.length === 0) {
        throw new Error('请至少配置一个有效的区间');
    }

    const chartInstance = echarts.init(chartDom);

    const columnData = data.map((item) => item[selectedColumn]);

    const ranges = validRanges.map(range => ({
        min: parseFloat(range.min),
        max: parseFloat(range.max),
        label: `[${range.min}, ${range.max})`
    }));

    const count = ranges.map(() => 0);
    columnData.forEach((value) => {
        ranges.forEach((range, index) => {
            if (value >= range.min && value < range.max) { // 左闭右开
                count[index]++;
            }
        });
    });

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: (params) => {
                const { name, value, percent } = params;
                return `${name}: ${value} 辆 (${percent}%)`;
            },
        },
        legend: {
            orient: 'vertical',
            left: 'left',
        },
        series: [
            {
                name: selectedColumn,
                type: 'pie',
                radius: '50%',
                data: ranges.map((range, index) => ({
                    name: range.label,
                    value: count[index],
                })),
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
            },
        ],
    };

    chartInstance.setOption(option);
}