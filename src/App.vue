<template>
  <div id="app">
    <el-dialog :title="title" :visible.sync="dialogVisible" width="50%">
      <div class="content">
        <img :src="src" :alt="alt" />
        <div>
          <p>
            今天{{ todayWeather.type }}， {{ todayWeather.fx }}， 风力{{
              todayWeather.fl
            }}。 气温{{ todayWeather.low_format_number }}-{{
              todayWeather.high_format_number
            }}度。
          </p>
          <p>
            日出时间{{ todayWeather.sunrise }}，日落时间{{
              todayWeather.sunset
            }}。
          </p>
          <p>{{ todayWeather.notice }}。</p>
        </div>
      </div>
      <template v-if="lastOpenTime" slot="footer">
        <div class="last-open-time">
          您上次打开weather_service的时间为{{ lastOpenTime }}
        </div>
      </template>
    </el-dialog>

    <div id="myEcharts" class="echarts"></div>
    <el-form>
      <el-form-item label="导出天气信息">
        <el-date-picker
          v-model="date"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :picker-options="pickerOption"
          @change="changeDateRange"
        >
        </el-date-picker>
        <el-button
          class="export-button"
          type="primary"
          @click="exportExcel"
          :disabled="date.length != 2"
          >导出</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import http from "./service/http";
import * as echarts from "echarts";
import { getDateDiff } from "./service/timestamp";
export default {
  name: "App",
  // components: {},
  data() {
    return {
      // 弹窗可见性
      dialogVisible: false,
      // 问候语
      title: "早上好！",
      // 问候弹窗天气与对应显示图片关系字典
      weatherImgDict: {
        晴: require("./assets/晴.png"),
        多云: require("./assets/多云.png"),
        阴: require("./assets/阴.png"),
        小雨: require("./assets/小雨.png"),
      },
      // 问候弹窗天气图片
      src: "",
      alt: "晴",
      // 近期天气预报
      forecast: [],
      // 今日天气
      todayWeather: {},
      // 上次打开时间
      lastOpenTime: "",
      // 选择日期
      date: [],
      // 选中要导出的数据
      exportData: [],
      // 选择日期组件配置
      pickerOption: {
        disabledDate(time) {
          let today = new Date(
            new Date(new Date().getTime()).setHours(0, 0, 0, 0)
          ).getTime();
          return (
            time.getTime() < today || time.getTime() >= today + 15 * 86400000
          );
        },
      },
      // echarts图表配置项
      option: {
        title: {
          text: "近15天温度变化图",
        },
        tooltip: {
          trigger: "axis",
        },
        legend: {
          right: "10%",
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: [],
        },
        yAxis: {
          type: "value",
          axisLabel: {
            formatter: "{value} °C",
          },
        },
        series: [
          {
            name: "当天最高温度",
            type: "line",
            data: [],
            markPoint: {
              label: {
                show: true,
              },
              data: [{ type: "max" }],
            },
          },
          {
            name: "当天最低温度",
            type: "line",
            data: [],
            markPoint: {
              data: [{ type: "min" }],
            },
          },
        ],
      },
    };
  },
  created() {
    // 设置问候语
    let hour = new Date().getHours();
    if (hour < 6) {
      this.title = "凌晨好！";
    } else if (hour < 9) {
      this.title = "早上好！";
    } else if (hour < 12) {
      this.title = "上午好！";
    } else if (hour < 14) {
      this.title = "中午好！";
    } else if (hour < 17) {
      this.title = "下午好！";
    } else if (hour < 19) {
      this.title = "傍晚好！";
    } else if (hour < 22) {
      this.title = "晚上好！";
    }

    // 获取上次打开时间
    let lastOpenTime = localStorage.getItem("lastOpenTime");
    if (lastOpenTime) {
      this.lastOpenTime = getDateDiff(lastOpenTime);
    }
    localStorage.setItem("lastOpenTime", new Date().getTime());

    // 请求数据
    http.get("weather/city/101280101").then((res) => {
      console.log(res);
      this.forecast = res.data.forecast;
      this.todayWeather = this.forecast[0];
      this.src = this.weatherImgDict[this.todayWeather.type];
      this.alt = this.todayWeather.type;
      this.dialogVisible = true;

      this.forecast.forEach((day) => {
        //导出时去除“最高”“最低”字眼
        day.high_format = day.high.split(" ")[1];
        day.low_format = day.low.split(" ")[1];
        day.high_format_number = day.high.replace(/\D/g, "");
        day.low_format_number = day.low.replace(/\D/g, "");
        // 添加数据
        this.option.xAxis.data.push(day.date);
        this.option.series[0].data.push(day.high.replace(/\D/g, ""));
        this.option.series[1].data.push(day.low.replace(/\D/g, ""));
      });
      console.log(this.option);
      // 基于准备好的dom，初始化echarts实例
      var myChart = echarts.init(document.getElementById("myEcharts"));
      // 绘制图表
      myChart.setOption(this.option);
    });
  },
  mounted() {},
  methods: {
    //导出excel
    exportExcel() {
      //引入文件
      const { export_json_to_excel } = require("./vendor/Export2Excel.js");
      //表头
      const tHeader = [
        "完整日期",
        "日期",
        "天气",
        "最高温度",
        "最低温度",
        "星期",
        "日出时间",
        "日落时间",
        "风向",
        "风力",
        "问候语",
      ];
      //table表格中对应的属性名
      const filterVal = [
        "ymd",
        "date",
        "type",
        "high_format",
        "low_format",
        "week",
        "sunrise",
        "sunset",
        "fx",
        "fl",
        "notice",
      ];
      //表格绑定数据转json
      const data = this.formatJson(filterVal, this.exportData || this.forecast);
      export_json_to_excel(
        tHeader,
        data,
        "天气预报" + new Date().toLocaleDateString()
      ); //对应下载文件的名字
    },
    //导出列表格式化数据的方法
    formatJson(filterVal, jsonData) {
      return jsonData.map((v) => filterVal.map((j) => v[j]));
    },
    changeDateRange(e) {
      let start = e[0];
      let startIndex;
      let end = e[1];
      let endIndex;
      this.forecast.forEach((item, index) => {
        if (item.ymd === start) {
          startIndex = index;
        }
        if (item.ymd === end) {
          endIndex = index;
        }
      });
      this.exportData = this.forecast.slice(startIndex, endIndex + 1);
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.content {
  height: 200px;
  display: flex;
}
.content > img {
  height: 100%;
}
.content > div {
  margin-left: 15px;
}
.last-open-time {
  color: #606266;
  font-size: 14px;
  word-break: break-all;
}
.echarts {
  width: 500px;
  height: 400px;
}
button.export-button {
  margin-left: 15px;
}
</style>
