// 创建所有观察者
class Watcher{
  /**
   * 
   * @param {*} vm 
   * @param {*} expx 
   * @param {Funciton} cb  回调函数
   */
  constructor(vm, expr, cb){
    this.vm = vm
    this.expr = expr
    this.cb = cb
    // 先把旧值保存起来
    this.oldVal = this.getOldVal()
  }
  // 获取旧值
  getOldVal(){
    Dep.target = this  // 挂载到dep上 添加订阅者
    // 获取旧值
    let oldVal = compileUtil.getVal(this.expr, this.vm)
    Dep.target = null   // 挂载上后进行销毁， 否则会造成很多观察者
    return oldVal
  }
  // 更新
  update(){
    // 查看新值和旧值是否有变化, 如果有变化则更新视图
    let newVal = compileUtil.getVal(this.expr, this.vm)
    if(newVal !== this.oldVal){
      this.cb(newVal)
    }
  }
}

// 通知/收集所有watcher
class Dep{
  constructor(){
    this.subs = []
  }
  // 收集观察者
  addSub(watcher){
    this.subs.push(watcher)
  }
  // 通知观察者去更新
  notify(){
    // 通知了观察者
    console.log('通知了观察者', this.subs)
    this.subs.forEach(watch =>{
      // 遍历每个观察者
      watch.update()
    })
  }
}

// 监听所有属性
class Observer{
  constructor(data) {
    // 监听
    this.observer(data)
  }
  observer(data){
    // 只针对对象来做处理
    if(data && typeof(data) === 'object'){
      // console.log(Object.keys(data))
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key]) // 劫持监听
      })
    }
  }

  defineReactive(obj, key ,value){
    // 递归遍历
    this.observer(value)

    const dep = new Dep()
    // 劫持并监听所有的属性
    Object.defineProperty(obj, key, {
      enumerable: true, // 设置属性是否可被遍历
      configurable: false, // 设置属性是否可被删除
      // writable: true, // 设置属性是否可被修改
      // 编译前进行初始化时候
      get(){
        // 订阅数据变化时，往Dep中添加观察者 收集每个观察者的依赖
        // 如果Dep.target 有值，则添加一个观察者
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      // 修改数据时，进行此方法
      set:(newVal) => {
        // 因为箭头函数没有this指向，在其调用处寻找，所以会找到Observer
        this.observer(value)
        if(newVal !== value){
          // 更改完之后  告诉Dep通知变化
          value = newVal
        }
        dep.notify()
      }
    })
  }
}