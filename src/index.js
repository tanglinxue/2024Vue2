import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { nextTick } from './observe/watch'
import { initGlobalAPI } from './gloableAPI'
function Vue(options) {//options就是用户的选项
  this._init(options)
}

Vue.prototype.$nextTick = nextTick;
initGlobalAPI(Vue)
initMixin(Vue)
initLifeCycle(Vue)




export default Vue
