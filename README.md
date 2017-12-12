本Linq.ts是移植.net上System.Linq.Enumerable的对可枚举对象的扩展方法。

有什么用？
可以视为集成了对集合的通用操作，以及添加了延迟计算的特性。

延迟计算。就是等集合需要求值时才对集合进行操作。
如将一个数组每个元素x10再取前十个元素：var r1=Enumerable.CreamForm(arr).Select(v=>v*10).Take(10);
相当于先取十个元素再每个元素x10：var r2=Enumerable.CreamForm(arr)).Take(10).Select(v=>v*10;
而且r1.Last()求结果集最后一个元素时，才会进行计算。最后r1.Last()===r2.Last();

在本源码结构上Stream.ts是核。基本上Stream.ts可以拿来直接使用
Linq.ts是皮。Linq.ts是在Stream上添加一层外皮，代码上很多时候都是添加函数重载，最后在使用上更接近.net的linq函数式查询方式。

VSCode编译src/ts目录中的文件到src/js目录下，然后node build.js将src/js的源码合并为dest/linq.js，以便在浏览器上运行。