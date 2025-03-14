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
export function renderColumnPieChart(chartDom, data, selectedColumn, customRanges, getColumnLabel) {
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
                return `${name}: ${value} (${percent}%)`;
            },
        },
        legend: {
            orient: 'vertical',
            left: 'left',
        },
        series: [
            {
                name: getColumnLabel(selectedColumn),
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

/**
 * 渲染柱状图
 * @param {HTMLElement} chartDom - 图表容器 DOM 元素
 * @param {Array} data - 数据
 * @param {string} selectedColumn - 当前选择的列
 * @param {Array} customRanges - 自定义区间配置
 */
export function renderColumnBarChart(chartDom, data, selectedColumn, customRanges, getColumnLabel) {
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
            trigger: 'axis',
            formatter: (params) => {
                const { name, value } = params[0];
                return `${name}: ${value} `;
            },
        },
        xAxis: {
            type: 'category',
            data: ranges.map(range => range.label),
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                name: getColumnLabel(selectedColumn),
                type: 'bar',
                data: count,
                itemStyle: {
                    color: '#5470C6',
                },
            },
        ],
    };

    chartInstance.setOption(option);
}

/**
 * 渲染折线图
 * @param {HTMLElement} chartDom - 图表容器 DOM 元素
 * @param {Array} data - 数据
 * @param {string} selectedColumn - 当前选择的列
 * @param {Array} customRanges - 自定义区间配置
 */
export function renderColumnLineChart(chartDom, data, selectedColumn, customRanges, getColumnLabel) {
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
            trigger: 'axis',
            formatter: (params) => {
                const { name, value } = params[0];
                return `${name}: ${value} `;
            },
        },
        xAxis: {
            type: 'category',
            data: ranges.map(range => range.label),
        },
        yAxis: {
            type: 'value',
        },
        series: [
            {
                name: getColumnLabel(selectedColumn),
                type: 'line',
                data: count,
                itemStyle: {
                    color: '#91CC75',
                },
            },
        ],
    };

    chartInstance.setOption(option);
}
/**
 * 格式化时间戳
 * @param {string} timestamp - 时间戳
 * @returns {string} - 格式化后的时间
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1; // 月份从 0 开始，需要加 1
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}.${day} ${hours}:${minutes}`; // 返回格式如 "7.12 10:30"
}

/**
 * 按数据点绘制折线图
 * @param {HTMLElement} chartDom - 图表容器 DOM 元素
 * @param {Array} data - 数据
 * @param {string} selectedColumn - 当前选择的列
 */
export function renderLineChartByDataPoints(chartDom, data, selectedColumn, getColumnLabel) {
    if (!selectedColumn || data.length === 0) {
        throw new Error('请选择列或确保数据存在');
    }

    const chartInstance = echarts.init(chartDom);

    // 格式化时间戳
    const xAxisData = data.map((item) => formatTimestamp(item.timestamp));
    const yAxisData = data.map((item) => item[selectedColumn]);

    // 计算纵轴范围
    const minValue = Math.min(...yAxisData);
    const maxValue = Math.max(...yAxisData);
    const padding = (maxValue - minValue) * 0.1; // 增加 10% 的间距

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const { dataIndex } = params[0];
                const timestamp = xAxisData[dataIndex]; // 获取格式化后的时间戳
                const value = yAxisData[dataIndex]; // 获取数值
                return `${timestamp}, ${value}`; // 返回格式如 "7.12 10:30, 26.3℃"
            },
        },
        xAxis: {
            type: 'category',
            data: xAxisData,
            boundaryGap: false, // 不留空白
            axisLabel: {
                rotate: 45, // 旋转标签以避免重叠
            },
        },
        yAxis: {
            type: 'value',
            min: minValue - padding, // 动态调整纵轴范围
            max: maxValue + padding,
        },
        grid: {
            top: 20, // 上间距
            bottom: 50, // 下间距，增加以容纳横轴标签
            left: 50, // 左间距，增加以容纳纵轴标签
            right: 20, // 右间距
        },
        dataZoom: [
            {
                type: 'inside', // 内置缩放
                start: 0, // 默认显示前 30 个数据点
                end: (30 / xAxisData.length) * 100,
            },
            {
                type: 'slider', // 滑动条
                start: 0,
                end: (30 / xAxisData.length) * 100,
            },
        ],
        series: [
            {
                name: getColumnLabel(selectedColumn),
                type: 'line',
                data: yAxisData,
                itemStyle: {
                    color: '#91CC75',
                },
                lineStyle: {
                    width: 2, // 线条宽度
                },
            },
        ],
    };

    chartInstance.setOption(option);
}

/**
 * 按小时绘制折线图
 * @param {HTMLElement} chartDom - 图表容器 DOM 元素
 * @param {Array} data - 数据
 * @param {string} selectedColumn - 当前选择的列
 */
export function renderLineChartByHour(chartDom, data, selectedColumn, getColumnLabel) {
    if (!selectedColumn || data.length === 0) {
        throw new Error('请选择列或确保数据存在');
    }

    const chartInstance = echarts.init(chartDom);

    // 按小时聚合数据（每 6 个数据点为一小时）
    const hourlyData = [];
    const hourlyTimestamps = [];
    for (let i = 0; i < data.length; i += 6) {
        const hourData = data.slice(i, i + 6);
        const averageValue = hourData.reduce((sum, item) => sum + item[selectedColumn], 0) / hourData.length;
        hourlyData.push(averageValue);
        hourlyTimestamps.push(formatTimestamp(hourData[0].timestamp)); // 使用第一个数据点的时间戳
    }

    // 计算纵轴范围
    const minValue = Math.min(...hourlyData);
    const maxValue = Math.max(...hourlyData);
    const padding = (maxValue - minValue) * 0.1; // 增加 10% 的间距

    const option = {
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const { dataIndex } = params[0];
                const timestamp = hourlyTimestamps[dataIndex]; // 获取格式化后的时间戳
                const value = hourlyData[dataIndex]; // 获取数值
                return `${timestamp}, ${value}`; // 返回格式如 "7.12 10:30, 26.3℃"
            },
        },
        xAxis: {
            type: 'category',
            data: hourlyTimestamps,
            boundaryGap: false, // 不留空白
            axisLabel: {
                rotate: 45, // 旋转标签以避免重叠
            },
        },
        yAxis: {
            type: 'value',
            min: minValue - padding, // 动态调整纵轴范围
            max: maxValue + padding,
        },
        grid: {
            top: 20, // 上间距
            bottom: 50, // 下间距，增加以容纳横轴标签
            left: 50, // 左间距，增加以容纳纵轴标签
            right: 20, // 右间距
        },
        dataZoom: [
            {
                type: 'inside', // 内置缩放
                start: 0, // 默认显示前 30 个数据点
                end: (30 / hourlyTimestamps.length) * 100,
            },
            {
                type: 'slider', // 滑动条
                start: 0,
                end: (30 / hourlyTimestamps.length) * 100,
            },
        ],
        series: [
            {
                name: getColumnLabel(selectedColumn),
                type: 'line',
                data: hourlyData,
                itemStyle: {
                    color: '#5470C6',
                },
                lineStyle: {
                    width: 2, // 线条宽度
                },
            },
        ],
    };

    chartInstance.setOption(option);
}