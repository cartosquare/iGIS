IGIS
=======
Intellengent GIS


#### Mac下安装环境

```bash
$ sudo brew install node
$ cd <project-path>
$ sudo npm install
```


```bash
$ sudo npm install electron-prebuilt -g
$ sudo npm install electron-prebuilt --save-dev
$ sudo brew install wine
```
> wine是为了发布windows版本使用，参考：https://github.com/maxogden/electron-packager

最后，还需要将gmap的node封装库拷贝到node_modules目录下



#### 开发

```bash
$ cd <project-path>
$ gulp
```


#### 发布

```bash
$ cd <project-path>
$ gulp release
```
