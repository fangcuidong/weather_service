import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 设置请求头和请求路径
axios.defaults.baseURL = process.env.VUE_APP_BASE_URL;
axios.defaults.timeout = 10000;

const http = {
  get(url, params) {
    return new Promise((resolve, reject) => {
      NProgress.start();
      axios
        .get(url, { params })
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          reject(err.data);
        }).finally(() => {
          NProgress.done();
        });
    });
  }
};

export default http;