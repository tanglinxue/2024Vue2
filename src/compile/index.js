import { parseHTML } from './parse'
//对模板进行编译处理
export function compileToFunction(template) {
  //1.就是将template转化成ast语法树
  let ast = parseHTML(template)
  console.log('打印')
  console.log(ast)

  //2.生成render方法(render方法执行后的返回的结果就是虚拟DOM)
}
