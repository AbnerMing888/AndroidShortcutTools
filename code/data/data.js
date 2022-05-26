let require = parent.window.require;
let fs = require('fs');
const {dialog} = require("@electron/remote");
var numAndroid = 0;//是否是Android项目
var isEmptyDir = false;//选择的是否是空的目录
//获取存储的项目路径，配置文件选择的
let selectPath = localStorage.getItem("select_path");
$(function () {
    //获取存储的路径
    getSavePath();

    function getSavePath() {
        if (selectPath !== "" && selectPath !== null) {
            //遍历文件
            fs.readdir(selectPath, function (err, files) {
                if (err) {
                    console.log(err);
                    return
                }
                //length 为0 证明，选择的文件路径下是空的,隐藏选择目录选项
                if (files.length === 0) {
                    isEmptyDir = true;
                    $(".data_select_file").css("display", "none");
                    return;
                }
                //不为空，就遍历当前路径下的所有的文件目录
                var isDir = false;
                files.forEach(function (item, position) {
                    let path = selectPath + "/" + item;
                    fs.stat(path, function (err, stats) {
                        if (err) {
                            return false;
                        }
                        if (stats.isDirectory()) {
                            isDir = true;
                        }
                        //最后一个判断
                        if (position === files.length - 1) {
                            //没有一个文件夹，隐藏
                            if (!isDir) {
                                isEmptyDir = true;
                                $(".data_select_file").css("display", "none");
                            }
                        }
                        //检测选择的是否是一个Android项目，通过是否包含app，gradle，settings.gradle，当然也可以判断其他
                        if (item === "app" || item === "gradle" || item === "settings.gradle") {
                            numAndroid++;
                        }
                        //判断是文件夹
                        if (stats.isDirectory()
                            && item != "build" && item != "gradle"
                            && item.indexOf(".") != 0) {
                            var vItem = item;
                            if (item.length > 7) {
                                item = item.substr(0, 7) + "…";
                            }
                            //是文件
                            let nodeDiv = "<div><label for='radiobutton_" + position + "'>" +
                                "<input type='radio' name='selectFile'" +
                                "id='radiobutton_" + position + "' endFile='" + vItem + "' value='" + item + "'/>" +
                                "<span>" + item + "</span>" +
                                "</label></div>";
                            $(".data_file").append(nodeDiv);
                        }
                    });
                });
            });
        }
    }

    //点击确定，生成对应的对象文件
    var endJsonContent = "";
    $(".action_submit span").click(function () {
        //选择的文件路径
        let selectFile = $("input[name='selectFile']:checked").attr("endFile");
        if (selectFile == null) {
            showToast("请选择生成路径");
            return;
        }
        //获取Json
        endJsonContent = $(".data_content").val();
        //获取文件名字
        let dataName = $(".data_name").val();
        if (endJsonContent == null || endJsonContent == "") {
            showToast("请填充Json");
            return;
        }
        if (dataName == null || dataName == "") {
            showToast("请输入对象名字");
            return;
        }

        let codePath = selectPath + "/" + selectFile + "/src/main/java";
        mRP = codePath;
        //读取java目录
        readdirJava(0, codePath);
    });

    var indexPack = 0
    var mPackPath = "";
    var mRCom = "";
    var mRP = "";
    var mTempData = [];

    function endJsonBean() {
        //获取文件名字
        let dataName = $(".data_name").val();
        //获取存储的包名地址
        mPackPath = mPackPath.substring(1, mPackPath.length);
        let isJson = true;
        //解析Json
        try {
            var json = JSON.parse(endJsonContent);
        } catch (e) {
            isJson = false;
            showToast("请查看Json是否正确");
        }

        if (isJson) {
            //获取当前的继承状态

            let httpExtend = parseInt($("input[name='beanExtend']:checked").val());

            var endJson = "package " + mPackPath + ".data.bean\n" +
                "\n";

            //是否需要集成一个父类，需要的话，就在这里填充
            if (httpExtend == 0) {
                endJson = endJson + "import com.gwm.common.data.bean.CommonHttpResultBean\n";
            }

            endJson = endJson + "\n" +
                "\n";
            //是否需要继承一个父类

            if (httpExtend == 0) {
                //继承
                endJson = endJson + "class " + dataName + " : CommonHttpResultBean() {\n";
            } else if (httpExtend == 1) {
                endJson = endJson + "class " + dataName + " {\n";
            }

            mTempData.push(dataName);


            //2、遍历Json串获取其属性 判断属性值
            var forJ = "";
            for (var item in json) {
                var value = json[item];//获取对应的值
                if (httpExtend == 0) {
                    //继承之后，哪些字段不在重写
                    if (item != "code" && item != "message" && item != "successful") {
                        forJ = forJ + forJson(item, value) + "\n";
                    }
                } else {
                    forJ = forJ + forJson(item, value) + "\n";
                }

            }
            endJson = endJson + forJ;
            endJson = endJson + "\n}";

            fs.writeFile(mRP + mRCom + "/data/bean/" + dataName + ".kt",
                endJson, function (err) {
                    if (err) {
                        return;
                    }
                    showSuccess("对象创建成功");
                    location.reload();
                });
        }

    }

    //读取java目录，正常的代码都是存储在这里
    function readdirJava(type, path) {
        fs.readdir(path, function (err, files) {
            if (err) {
                return
            }
            //遍历文件夹
            if (type == 0) {
                if (indexPack < 3) {
                    mRCom = mRCom + "/" + files[0];//存储包路径
                    mPackPath = mPackPath + "." + files[0];//存储包名 com.***
                    path = path + "/" + files[0];
                    readdirJava(0, path);
                } else {
                    //获取最终
                    readdirJava(1, path);
                }
                indexPack++;
            } else {
                var isData = false;
                //遍历是否包含data包名
                files.forEach(function (item, index) {
                    if ("data" == item) {
                        isData = true;
                    }
                });

                //包含data包名
                if (isData) {
                    var isBean = false;
                    //data存在,遍历data,判断bean包是否存在
                    fs.readdir(path + "/data", function (err, files) {
                        if (err) {
                            return
                        }
                        //继续遍历
                        files.forEach(function (item, index) {
                            if ("bean" == item) {
                                isBean = true;
                            }
                        });
                        //存在bean包
                        if (isBean) {
                            //存在 就开始创建文件进行，写入
                            wirteDataBeanContent();
                        } else {
                            //不存在bean包路径，就去创建Bean
                            mkFileBean(path + "/data/bean");
                        }

                    });

                } else {
                    //data包名不存在
                    let p = path + "/data";
                    fs.mkdir(p, function (err) {
                        if (err) {
                        }
                        //创建bean
                        mkFileBean(p + "/bean");
                    })

                }

            }
        });
    }

    function mkFileBean(path) {
        fs.mkdir(path, function (err) {
            if (err) {
            }
            wirteDataBeanContent();
        })
    }

    //写入JavaBean
    function wirteDataBeanContent() {
        endJsonBean()
    }

    function forJson(item, value) {
        var forJ = "";
        if (typeof (value) == "number") {
            if (("" + value).length > 9 && ("" + value).indexOf(".") == -1) {
                //没有点，大于9
                let num = "    var " + item + ": Long = 0";
                forJ = num;
            } else if (("" + value).indexOf(".") != -1) {
                let num = "    var " + item + ": Float = 0.0f";
                forJ = num;
            } else {
                let num = "    var " + item + " = 0";
                forJ = num;
            }
        } else if (typeof (value) == "string") {
            let str = "    var " + item + ": String? = null";
            forJ = str;
        } else if (typeof (value) == "boolean") {
            let str = "    var " + item + ": Boolean? = null";
            forJ = str;
        } else if (typeof (value) == "object") {
            if (value == null) {//为空
                let str = "    var " + item + ": String? = null"
                forJ = str;
            } else {
                let ob = JSON.stringify(value).substring(0, 1);

                if (ob == "{") {
                    //对象，生成JavaBean
                    let s = ("" + item);
                    var aCode = s.substring(0, 1).toUpperCase();
                    aCode = aCode + s.substring(1, s.length) + "Bean"
                    var obj = "    var " + item + ": " + aCode + "? = null\n";
                    obj = obj + "    class " + aCode + "{\n";

                    mTempData.push(mTempData[mTempData.length - 1] + "." + aCode);

                    //遍历其中的参数
                    var forObj = "";
                    for (var iObj in value) {
                        var iObjValue = value[iObj];//获取对应的值
                        forObj = forObj + forJson(iObj, iObjValue) + "\n";
                    }
                    obj = obj + forObj;

                    obj = obj + "\n    }";
                    forJ = obj;
                } else if (ob == "[") {
                    //数组 生成List
                    let s = ("" + item);
                    var aCode = s.substring(0, 1).toUpperCase();
                    aCode = aCode + s.substring(1, s.length) + "Bean"
                    var arr = "    var " + item + ": List<" + aCode + ">? = null\n";
                    arr = arr + "    class " + aCode + "{\n";
                    mTempData.push(mTempData[mTempData.length - 1] + "." + aCode);
                    //遍历其中的参数
                    var arrValue = value[0];

                    var forObj = "";
                    for (var iObj in arrValue) {
                        var iObjValue = arrValue[iObj];//获取对应的值
                        forObj = forObj + forJson(iObj, iObjValue) + "\n";
                    }
                    arr = arr + forObj;

                    arr = arr + "    }";
                    forJ = arr;
                }
            }
        }
        return forJ;
    }

    //弹出普通信息
    function showToast(msg) {
        const dialog = require('@electron/remote').dialog;
        dialog.showMessageBox({
            type: 'info', //弹出框类型
            message: msg
        });
    }

    //弹出提示
    function showSuccess(msg) {
        const dialog = require('@electron/remote').dialog;
        dialog.showMessageBox({
            type: 'info', //弹出框类型
            message: msg
        });
    }

    //发起请求
    $(".request_http").click(function () {
        //获取请求地址
        let data_http_url = $(".data_http_url").val();
        //获取请求头
        var data_http_head = $(".data_http_head").val();
        //获取请求参数
        var data_http_arguments = $(".data_http_arguments").val();

        if (data_http_url == null || data_http_url == "") {
            showToast("请输入接口地址");
            return;
        }

        //把参数存储到一个对象里
        var argumentsObj = {};
        if (data_http_arguments != null && data_http_arguments != "") {
            if (data_http_arguments.indexOf(" ") == -1) {
                data_http_arguments = data_http_arguments + " ";
            }
            let arr = data_http_arguments.split(" ");
            for (var i = 0; i < arr.length; i++) {
                var bean = arr[i];
                if (bean != null && bean != "") {
                    let item = bean.split("=");
                    let key = item[0];
                    let value = item[1];
                    argumentsObj[key] = value;
                }
            }
        }

        //把头参数存储到一个对象里
        var headObj = {};
        if (data_http_head != null && data_http_head != "") {
            if (data_http_head.indexOf(" ") == -1) {
                data_http_head = data_http_head + " ";
            }
            let arr = data_http_head.split(" ");
            for (var i = 0; i < arr.length; i++) {
                var bean = arr[i];
                if (bean != null && bean != "") {
                    let item = bean.split("=");
                    let key = item[0];
                    let value = item[1];
                    headObj[key] = value;
                }
            }
        }

        //请求方式
        let method = $("input[name='method']:checked").val();
        if (method == null || method == "") {
            showToast("请选择请求方式");
            return;
        }

        if (method == 0) {
            $.ajax({
                type: "GET",
                url: data_http_url,
                dataType: "json",
                headers: headObj,
                success: function (res) {
                    showSuccess("数据反回成功")
                    $(".data_content").val(formatToJson(JSON.stringify(res), false));
                }
            });
        } else if (method == 1) {
            $.ajax({
                type: "POST",
                url: data_http_url,
                dataType: "json",
                data: argumentsObj,
                headers: headObj,
                success: function (res) {
                    showSuccess("数据反回成功")
                    $(".data_content").val(formatToJson(JSON.stringify(res), false));
                }
            });

        } else if (method == 2) {
            //json
            let jS = JSON.stringify(argumentsObj);
            $.ajax({
                type: "POST",
                url: data_http_url,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: jS,
                headers: headObj,
                success: function (res) {
                    showSuccess("数据反回成功");
                    $(".data_content").val(formatToJson(JSON.stringify(res), false));
                }
            });
        }


    });

    //格式化Json
    function formatToJson(txt, compress) {
        var indentChar = '    ';
        if (/^\s*$/.test(txt)) {
            console.log('数据为空,无法格式化! ');
            return;
        }
        try {
            var data = eval('(' + txt + ')');
        } catch (e) {
            console.log('数据源语法错误,格式化失败! 错误信息: ' + e.description, 'err');
            return;
        }
        var draw = [],
            last = false,
            This = this,
            line = compress ? '' : '\n',
            nodeCount = 0,
            maxDepth = 0;

        var notify = function (name, value, isLast, indent, formObj) {
            nodeCount++; /*节点计数*/
            for (var i = 0, tab = ''; i < indent; i++)
                tab += indentChar; /* 缩进HTML */
            tab = compress ? '' : tab; /*压缩模式忽略缩进*/
            maxDepth = ++indent; /*缩进递增并记录*/
            if (value && value.constructor == Array) {
                /*处理数组*/
                draw.push(
                    tab + (formObj ? '"' + name + '":' : '') + '[' + line
                ); /*缩进'[' 然后换行*/
                for (var i = 0; i < value.length; i++)
                    notify(i, value[i], i == value.length - 1, indent, false);
                draw.push(
                    tab + ']' + (isLast ? line : ',' + line)
                ); /*缩进']'换行,若非尾元素则添加逗号*/
            } else if (value && typeof value == 'object') {
                /*处理对象*/
                draw.push(
                    tab + (formObj ? '"' + name + '":' : '') + '{' + line
                ); /*缩进'{' 然后换行*/
                var len = 0,
                    i = 0;
                for (var key in value)
                    len++;
                for (var key in value)
                    notify(key, value[key], ++i == len, indent, true);
                draw.push(
                    tab + '}' + (isLast ? line : ',' + line)
                ); /*缩进'}'换行,若非尾元素则添加逗号*/
            } else {
                if (typeof value == 'string') value = '"' + value + '"';
                draw.push(
                    tab +
                    (formObj ? '"' + name + '":' : '') +
                    value +
                    (isLast ? '' : ',') +
                    line
                );
            }
        };
        var isLast = true,
            indent = 0;
        notify('', data, isLast, indent, false);
        return draw.join('');
    }
});