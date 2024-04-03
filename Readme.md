# 图像处理库 pixelwind 之 github 分库

示例页：https://jiankun-wf.github.io/pixelwind/

## 大小仅为 20kb 但是可以随意操纵 RGBA 类型的像素通道
# 现已支持多线程处理，处理速度对比（参考）：
 

# 简单使用

## 1. 读取图像

`import { pw } from 'lib/index.ts'`<br>
`const mat = pw.readAsElement(HTMLImgElement)`<br>
`const mat = await pw.readAsDataUrl(src)`<br>
`const mat = await pw.readAsBlob(blob)`<br>

## 2. 操作

- 当您想要实现一个剪裁时：

###### `pw.clip(mat: Mat, x, y, width, height)`

- 当您想要缩放时：

###### `pw.resize(mat: Mat, 1000, 2000, 2)`

- 当您想灰度处理时：

###### `pw.gray(mat: Mat)`

- 当您想添加滤镜时：

###### `pw.groundGlassFilter(mat: Mat, 7, false) // 毛玻璃滤镜`

### 3. 拓展

- 当您想要自己处理像素值时：
  `const mat = await pw.readAsBlob(blob)` <br>
  `mat.recycle((pixel, row, col) => {` <br>
  `const [R, G, B, A] = pixel;`
  `// 处理像素值`
  `const NR = R / 255`
  `const NG = G / 255`
  `const NB = B / 244`
  `// 更新`
  `mat.update(row, col, NR, NG, NB)`
  `})`

# 目前实现了 以下快捷功能：

|      方法名       |     说明     |                                          参数                                           | 返回类型 | 执行结果                                                                                                                                            |
| :---------------: | :----------: | :-------------------------------------------------------------------------------------: | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
|      flip   |   镜像翻转   |     `mat: Mat, mode: 1/ 2/ 3`      |    Mat   |     返回新图像数据，对图像进行水平（mode = 1）、垂直（mode = 2）、对角线反转（mode = 3） |
|      resize       |     缩放     |  `mat: Mat;` <br> `scaleWidth: number;`<br> `scaleHeight: number; `<br> `mode: 1/2/3`   |   Mat    | 返回新图像数据，将图像按指定宽度与高度进行缩放，mode 为最近邻插值（最快，质量差）、双线性插值（默认，兼顾质量速度）、三次线性插值（速度慢，质量高） |
|       clip        |     剪裁     | `mat: Mat;` <br> `x: number;`<br> `y: number; `<br> `width: number`<br>`height: number` |   Mat    | 返回新图像数据， 按开始坐标剪裁 width 与 height 宽度的区域。                                                                                        |
|       fade        |   线性擦退   |                       `mat: Mat, mode: FadeMode, percent: number`                       |   void   | 更改源图像数据， 按比例使得图像变白，可由 mode 控制从深色还是浅色开始擦退                                                                           |
|      native       |  纯色化处理  |                               `mat: Mat, color: Hexcolor`                               |   void   | 更改源图像数据, 使得图像中的非白与非透明像素变为指定颜色 color 为 hex 格式                                                                          |
|  nativeRollback   |   纯色反转   |                                       `mat: Mat`                                        |   void   | 更改源图像数据, 使得纯色化处理的图片非白变白，白变非白                                                                                              |
|  dropTransparent  | 去除透明像素 |                               `mat: Mat, color: HexColor`                               |   void   | 更改源图像数据, 使得透明像素变为指定颜色（如: #FFFFFFEC）                                                                                           |
|   colorRollback   |   颜色反转   |                                       `mat: Mat`                                        |   void   | 更改源图像数据, 使得图像的 RGBA 通道全部反转(255 - x)                                                                                               |
|    medianBlur     |   中值滤波   |                                `mat: Mat, ksize: number`                                |   void   | 更改源图像数据, 使得图像按模糊度进行模糊，通常用来去除椒盐噪点与胡椒噪点                                                                            |
|   gaussianBlur    |   高斯滤波   |                `mat: Mat, ksize: number, sigmaX: number, sigmaY: number`                |   void   | 更改源图像数据, 使得图像以高斯函数的形式进行模糊                                                                                                    |
|     meanBlur      |   均值滤波   |                                `mat: Mat, ksize: number`                                |   void   | 更改源图像数据, 使得图像按模糊进行模糊                                                                                                              |
|        LUT        |   色彩增强   |                        `mat: Mat, lutTable?: Uint8ClampedArray`                         |   void   | 更改原图像数据，使得图像以 lut 查找表进行色彩增强，不同的查找表会有不同效果，比如：亮度、对比度、鲜艳度，都会有一套不同的查找表参数                 |
|     threshold     |  二值化处理  |              `mat: Mat, threshold: number, maxValue: number,  type, mode`               |   void   | 更改源图像数据，实现 opencv 的全部二值化处理                                                                                                        |
|     dropWhite     |  去除白像素  |                                       `mat: Mat`                                        |   void   | 更改原图像数据，将白色背景变透明                                                                                                                    |
|       gray        |   灰度滤镜   |                                       `mat: Mat`                                        |   void   | 更改原图像数据，将图像按照国际化公式处理为灰色图像                                                                                                  |
| groundGlassFilter |  毛玻璃滤镜  |                     `mat: Mat, offset: number，bothFamily: boolean`                     |   void   | 更改原图像数据，对图像施加毛玻璃特效，偏移量越大越明显；当图像色彩纹理不太复杂时，x，y 的坐标像素会使用不同的随机偏移                               |
|  nostalgiaFilter  |   怀旧滤镜   |                                       `mat: Mat`                                        |   void   | 更改原图像数据，使得图像变为怀旧风格                                                                                                                |
|  fleetingFilter   |   流年滤镜   |                             `mat: Mat, ksize: number = 12`                              |   void   | 更改原图像数据，使得图像变为流年风格                                                                                                                |
|  sunLightFilter   |   光照滤镜   |     `mat: Mat, centerX: number, centerY: number, radius: number, strength: number`      |   void   | 更改原图像数据，使得图像再指定中心点与半径的圆处添加光照效果                                                                                        |

## Mat 数据结构为存放 RGBA 像素的 Uint8ClampedArray 的 TypedArray，有以下属性和方法：

### 属性

|   参数   |      说明      |                类型                 |
| :------: | :------------: | :---------------------------------: |
|   rows   |    像素行数    |              `number`               |
|   cols   |    像素列数    |              `number`               |
| channels | 通道数固定为 4 |              `number`               |
|   size   |   图像的大小   | `{ width: number; height: number }` |
|   data   |  储存图像数据  |         `Uint8ClampedArray`         |

### 方法

| 方法名     | 说明                                   | 参数                                                                                                | 返回值                             |
| ---------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------- |
| at         | 获取指定坐标的像素通道                 | x: number, y: number`                                                                               | `[R, G, B, A]                      |
| recycle    | 循环所有像素值，执行每个像素的回调函数 | `callback: (pixel: number, row: number, col: number) => void`                                       | void                               |
| getAddress | 获取指定坐标在图像数据的实际地址       | `x: number, y: number`                                                                              | `[indexR, indexG, indexB, indexA]` |
| imgshow    | 输出图像到画布                         | `canvas：id / HTMLCANVASELEMENT  mat: Mat, clip?: boolean, clipWidth?: number, clipHeight?: number` | Promise<void>                      |
| toBlob     | 输出 blob 格式的图像数据               | `type: image/png / image / jpeg/image / webp, quality?: number = 1`                                 | Blob                               |
| toDataURL  | 输出 base64 格式的图片地址             | `type: image / png  image / jpeg  image / webp, quality?: number = 1`                               | Base64String                       |

# 使用，如果想用 npm，请自行发布

## 基于本项目开发

`npm install` <br>
`npm run start` <br>
`npm run build` <br>

## typescript 环境

将 lib/index.ts 迁移到您的项目即可使用

## node--commonjs

将打包后的 modules/index.cjs 复制到您的项目

## node-esm

将打包后的 modules/index.mjs 复制到您的项目

## CND

使用 modules/index.js 文件， pw 变量将自动挂载到 window 下
