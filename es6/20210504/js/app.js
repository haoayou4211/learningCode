
// 模块引入
// import * as m1 from './m1.js'
// import * as m2 from './m2.js'
// import * as m3 from './m3.js'


// console.log(m1)
// console.log(m2)
// console.log(m3)






// 动态引入
const btn = document.getElementById('btn');

btn.onclick = function(){
  // 返回的js对象
  import('./hello.js').then(module => {
    module.hello()
  })
}