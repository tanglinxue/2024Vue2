
import { initState } from './state'
import { compileToFunction } from './compile/index'
import { mountComponent, callHook } from './lifecycle'
import { mergeOptions } from './utils'
export function initMixin(Vue) {//就是给Vue增加init方法的
  Vue.prototype._init = function (options) { //用于初始化操作
    const vm = this;
    vm.$options = mergeOptions(this.constructor.options, options); //将用户的选项挂载到实例上
    callHook(vm, 'beforeCreate')
    // 初始化状态
    initState(vm)
    callHook(vm, 'created')
    if (options.el) {
      vm.$mount(options.el)//实现数据的挂载
    }
  }
  Vue.prototype.$mount = function (el) {
    const vm = this;
    el = document.querySelector(el)
    let opts = vm.$options;
    if (!opts.render) {//先进行查找有没有render函数
      let template;//没有render看一下是否写了template,没有template采用外部的template
      if (!opts.template && el) {//没有写模板但是写了el
        template = el.outerHTML;
      } else {
        template = opts.template //如果有el，则采用模板的内容
      }
      if (template) {
        //对模板进行编译
        const render = compileToFunction(template)
        opts.render = render
      }
    }
    mountComponent(vm, el)//组件的挂载
  }
}

