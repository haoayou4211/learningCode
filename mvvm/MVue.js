const compileUtil = {
  getVal(expr, vm){
    return expr.split('.').reduce((data, currentVal) =>{
      return data[currentVal]
    }, vm.$data)
  },
  setVal(expr, vm, inputVal){
    return expr.split('.').reduce((data, currentVal) =>{
       data[currentVal] = inputVal  // currentVal为旧值   inputVal为新值
    }, vm.$data)
  },


  getContentVal(expr, vm){
    // 此处需要将获得的值返回出去
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm)
    })
  },

  text(node, expr, vm){
    let value
    // const value = vm.$data[expr] // 从data中取对应值 {{}}
    if(expr.indexOf('{{') !== -1){
      // 存在 {{a}}  {{b}}
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {

        // 绑定观察者 解析指令更新数据时候 触发回调，进行更新
        new Watcher(vm, args[1], () => {
          // 重新更新
          this.updater.textUpdater(node, this.getContentVal(expr, vm))
        })

        return this.getVal(args[1], vm)
      })
    }else{
      // 绑定观察者 解析指令更新数据时候 触发回调，进行更新
      new Watcher(vm, expr, (newVal) => {
        // 重新更新
        this.updater.textUpdater(node, newVal)
      })
      value = this.getVal(expr, vm)
    }
    this.updater.textUpdater(node, value)   // 文本赋值
  },

  html(node, expr, vm){
    const value = this.getVal(expr, vm)
    // 解析指令更新数据时候绑定观察者
    new Watcher(vm, expr, (newVal) => {
      // 重新更新
      this.updater.htmlUpdater(node, newVal)
    })
    this.updater.htmlUpdater(node, value)
  },

  model(node, expr, vm){
    const value = this.getVal(expr, vm)// 解析指令更新数据时候绑定观察者
    // 绑定更新函数 数据驱动视图
    new Watcher(vm, expr, (newVal) => {
      // 重新更新
      this.updater.modelUpdater(node, newVal)
    })

    // 视图影响数据
    node.addEventListener('input', (e) => {
      // 设置值
      this.setVal(expr, vm, e.target.value)
    })

    this.updater.modelUpdater(node, value)
  },

  on(node, expr, vm, eventName){
    let fn = vm.$options.methods && vm.$options.methods[expr]
    node.addEventListener(eventName, fn.bind(vm), false);
  },

  // 绑定数据attr
  bind(node, expr, vm, eventName){
    const value = this.getVal(expr, vm)
    this.updater.attrUpdater(node, eventName, value)
  },
  
  updater: {
    textUpdater(node, value){
      node.textContent = value
    },
    htmlUpdater(node, value){
      node.innerHTML = value
    },
    modelUpdater(node, value){
      node.value = value
    },
    attrUpdater(node, attrName, value){
      node.setAttribute(attrName, value)
    }
  }
}

// 解析类
class Compile{
  constructor(el, vm){
    // 判断el是否是元素节点对象   是则立马赋值进去，否则则利用document获取
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm

    // 获取文档对象，放入内存，会减少页面回流和重绘
    const fragment = this.node2Fragment(this.el)
    // console.log(fragment)

    // 编译模板
    this.compile(fragment)

    // 追加子元素到根元素
    this.el.appendChild(fragment)
    
  }
  // 判断是否是元素节点
  isElementNode(node){
    return node.nodeType === 1
  }

  // 文档碎片
  node2Fragment(el){
    // 创建文档碎片
    const f = document.createDocumentFragment()
    let firstChild
    while(firstChild = el.firstChild){
      // 从父节点的第一个子节点拿出来，复制到文档碎片中
      // appendChild如果某个节点已经拥有父节点，在被传递给此方法后，它首先会被移除，再被插入到新的位置
      f.appendChild(firstChild)
    }
    return f

    // console.log(node.childNodes)
  }

  // 编译模板
  compile(fragment){
    // 获取子节点
    const childNodes = fragment.childNodes  // NodeList无法进行循环，length始终为0
    // 合并数组后，循环判断child
    ![...childNodes].forEach(child => {
      // 判断是元素节点还是文本节点
      if(this.isElementNode(child)){
        // 元素节点 编译元素节点
        // console.log('元素节点', child)
        this.compileElement(child)
      }else{
        // 文本节点 编译文本节点
        // console.log('文本节点', child)
        this.compileText(child)
      }
      
      // 子元素中还有其他元素，则继续进行遍历（递归
      if(child.childNodes && child.childNodes.length){
        this.compile(child)
      }
    })
  }
  // 编译元素节点
  compileElement(node){
    // console.log(node)
    // 截取页面指令，根据后置返回进行对应处理 v-text v-html v-model
    const attributes = node.attributes
    ![...attributes].forEach(attr => {
      // console.log(attr)
      const {name, value} = attr // 结构赋值
      // console.log(name)
      // 判断数据是否是v-开头  那便是一个指令   v-html  v-text v-model  v-on:click
      if(this.isDirective(name)){
        // 获取数组的第二个参数   解构赋值
        const [,directive] = name.split('-') // html  text model on:click
        const [dirName, eventName] = directive.split(':') // click

        // 更新数据  数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName)
        // 删除有指令的标签上的属性
        node.removeAttribute('v-' + directive)
      }else if(this.isEventName(name)){ // @click
        let [, eventName] = name.split('@')
        compileUtil['on'](node, value, this.vm, eventName)
      }else if(this.isElementAttr(name)){ // :src="src"
        let [, attrName] = name.split(':')
        compileUtil['bind'](node, value, this.vm, attrName)
      }
    })

  }

  // 编译文本节点
  compileText(node){
    // {{}} v-text 
    // console.log(node.textContent)
    const content = node.textContent
    if(/\{\{(.+?)\}\}/.test(content)){
      // console.log(content)
      compileUtil['text'](node, content, this.vm)
    }
  }

  // 判断数据是否以v-开头
  isDirective(name){
    // 正则
    return name.match(new RegExp('^v-.*$'))
  }

  // 是否是@符号开头
  isEventName(attrName){
    return attrName.match(new RegExp('^@.*$'))
  }

  // 是否是:符号开头
  isElementAttr(attrName){
    return attrName.match(new RegExp('^:.*$'))
  }
  
}

// 构造MVue类 （入口函数）
class MVue{
  constructor(options){
    // 绑定属性
    this.$el = options.el 
    this.$data = options.data // 绑定的data函数
    this.$options = options // 可能存在生命周期或者方法调用

    // 查看当前传进来的el是否是个节点对象
    if(this.$el){
      // 1. 实现一个数据的观察者
      // Object.defineProperty  劫持/监听所有数据
      new Observer(this.$data)

      // 2. 实现一个指令的解析器
      new Compile(this.$el, this)

      // 代理
      this.proxyData(this.$data)
    }
  }
  proxyData(data){
    for(const key in data){
      Object.defineProperty(this, key, {
        get(){
          return data[key]
        },
        set(newVal){
          data[key] = newVal
        }
      })
    }
  }
}