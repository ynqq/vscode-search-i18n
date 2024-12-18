# search-i18n

![alt text22](images/download.png)

自动翻译英语、日语并写入配置文件

- [需要安装另一个翻译插件 trans-lang](https://marketplace.visualstudio.com/items?itemName=ynqq.trans-lang)
- 使用的百度翻译，需要申请 key
- 配置
  ```json
  {
    // i18n-ally.localesPaths第一个目录的相对路径
    "search-i18n.entry": "./language/zh-CN.json",
    // 是否开启自动转换
    "search-i18n.enableTransform": true,
    // 是否开启翻译功能
    "search-i18n.enableTrans": true,
    // 自动转换的前置key 默认是: autoKey 效果就是(autoKey1, autoKey2...)
    "search-i18n.transKey": "ynqq_auto_key",
    // 配置文件 路径和 entry 一样 目前只支持英语、日语
    "search-i18n.transFileConfig": {
      "en": "./language/en-US.json",
      "jp": "./language/ja.json"
    }
  }
  ```

![alt text](images/translateForMe.gif)

根据文本去匹配 i18 的 key 搜索对应的文件

# 使用方法

1. 配置 setting.json

   ```json
   {
     "i18n-ally.localesPaths": ["src/locales"], // 语言包目录
     "search-i18n": {
       "entry": "zh.js", // 查询插件中文文件
       "incldesFile": "ts,tsx,vue" // 匹配文件 默认: ts,tsx,vue
     }
   }
   ```

2. 运行任务(ctrl+shift+p)
3. 搜索 searchi18n
4. 输入搜索内容，点击回车。
5. 插件会查询到所有匹配的内容，然后执行搜索功能。
   ![搜索结果](images/image-1.png)
6. 选中中文时可以自动替换成对应的 key
   ![替换](images/image.png)

## LICENSE

MIT

- 在使用自定义key时，将当前的git分支也当做key。防止多个分支出现相同key的问题
- 增加两个快捷键，可以使用中文的英文小驼峰当做key