import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { initStateMixin } from './state'
import { initGlobalAPI } from './gloableAPI'

//将所有的方法都耦合在一起
function Vue(options) {//options就是用户的选项
  this._init(options)//默认就调用了init
}

initGlobalAPI(Vue)//扩展了init方法
initMixin(Vue)//vm_update vm_render
initLifeCycle(Vue)//全局API的实现
initStateMixin(Vue)//实现了nextTick $watch

export default Vue
