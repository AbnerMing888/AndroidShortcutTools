const require = parent.window.require;
const fs = require('fs');
var numAndroid = 0;//是否是Android项目
var isEmptyDir = false;//选择的是否是空的目录
$(function () {
    //获取存储的路径
    let selectPath = localStorage.getItem("select_path");
    //取出默认的dp配置前缀
    let selectDp = localStorage.getItem("select_dp");
    //取出默认的color配置前缀
    let selectColor = localStorage.getItem("select_color");

    if (selectPath != "" && selectPath != null) {
        //遍历文件
        fs.readdir(selectPath, function (err, files) {
            if (err) {
                console.log(err);
                return
            }
            //length 为0 证明，选择的文件路径下是空的,隐藏选择目录选项
            if (files.length === 0) {
                isEmptyDir = true;
                $(".shape_select_file").css("display", "none");
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
                            $(".shape_select_file").css("display", "none");
                        }
                    }
                    //检测选择的是否是一个Android项目，通过是否包含app，gradle，settings.gradle，当然也可以判断其他
                    if (item === "app" || item === "gradle" || item === "settings.gradle") {
                        numAndroid++;
                    }
                    if (stats.isDirectory()
                        && item != "build" && item != "gradle"
                        && item.indexOf(".") != 0) {
                        var vItem = item;
                        if (item.length > 9) {
                            item = item.substr(0, 7) + "…";
                        }
                        //是文件
                        let nodeDiv = "<div><label for='radiobutton_" + position + "'>" +
                            "<input type='radio' name='selectFile'" +
                            "id='radiobutton_" + position + "' endFile='" + vItem + "' value='" + item + "'/>" +
                            "<span>" + item + "</span>" +
                            "</label></div>";
                        $(".shape_file").append(nodeDiv);
                    }
                });
            });
        });
    }


    $(".shape_submit span").click(function () {
        //确定
        let selectFile = $("input[name='selectFile']:checked").attr("endFile");//文件路径
        let radius = $(".input_radius").val();
        let color = $(".input_color").val();
        let solid = $(".input_solid").val();
        let react = $(".input_react").val();
        let reactSize = $(".input_react_size").val();
        let name = $(".input_name").val();

        if (selectFile == null && !isEmptyDir) {
            showToast("请选择文件路径");
            return;
        }
        var checkText = ""
        $.each($('input:checkbox'), function () {
            if (this.checked) {
                let v = $(this).val();
                checkText = checkText + v;
            }
        });

        if (name == "" || name == null) {
            showToast("请输入文件名字");
            return;
        }

        var endShapeText = "";
        if (mShapeType == 0) {
            //实心
            endShapeText = getSolidText(radius, color, checkText);
        } else if (mShapeType == 1) {
            //空心
            endShapeText = getStrokeText(radius, solid, react, reactSize, checkText);
        } else {
            //渐变
            endShapeText = getGradientXml(radius, checkText);
        }


        //创建文件
        if (numAndroid === 3) {//是Android项目
            //根据选择的目录，找到对应的res路径，一般都是固定的
            let endPathFile = selectPath + "/" + selectFile + "/src/main/res";
            let endPath = endPathFile + "/drawable/" + name + '.xml';
            //先判断drawable文件是否存在，不存在去创建
            fs.readdir(endPathFile, function (err, files) {
                if (err) {
                    return
                }
                var booDrawable = false;
                files.forEach(function (item) {
                    if ("drawable" === item) {
                        booDrawable = true;
                    }
                });

                if (booDrawable) {
                    writeDrawable(endPath, endShapeText);
                } else {
                    //不存在，创建
                    fs.mkdir(endPathFile + "/drawable", function (err) {
                        if (err) {
                            return;
                        }
                        writeDrawable(endPath, endShapeText);
                    });
                }
            });
        } else {
            //不是Android项目
            let endPathFile = selectPath + "/" + selectFile
            var endPath = endPathFile + "/" + name + '.xml';

            //选择的目录为空，直接以保存的路径
            if (isEmptyDir) {
                endPath = selectPath + "/" + name + '.xml';
            }
            writeDrawable(endPath, endShapeText);
        }


    });

    function writeDrawable(path, text) {
        fs.writeFile(path,
            text, 'utf8',
            function (error) {
                if (error) {
                    return false;
                }
                //信息重置
                showSuccess("文件已生成");
            });
    }

    //获取实心的代码
    function getStrokeText(radius, solid, react, reactSize, checkText) {
        //不为空
        if (radius != "" && radius != null && selectDp != null && selectDp != "") {
            //取出默认的dp配置前缀
            radius = selectDp + radius;
        } else {
            radius = radius + "dp";
        }

        if (reactSize != "" && reactSize != null && selectDp != null && selectDp != "") {
            //取出默认的dp配置前缀
            reactSize = selectDp + reactSize;
        } else {
            reactSize = reactSize + "dp";
        }
        //边框颜色
        //基础信息color不为空，就追加前缀
        react = getEndColor(react);
        var content = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<shape xmlns:android=\"http://schemas.android.com/apk/res/android\"\n" +
            "    >\n";
        content = content + "    <stroke\n" +
            "        android:width=\"" + reactSize + "\"\n" +
            "        android:color=\"" + react + "\" />\n";
        if (radius != null && (checkText == "" || checkText == "0123")) {
            //全部
            content = content + "    <corners android:radius=\"" + radius + "\" />\n";
        } else {

            content = content + "    <corners \n";
            if (checkText.indexOf("0") != -1) {
                content = content + "android:topLeftRadius=\"" + radius + "\"\n";
            }
            if (checkText.indexOf("1") != -1) {
                content = content + "        android:topRightRadius=\"" + radius + "\"\n";
            }
            if (checkText.indexOf("2") != -1) {
                content = content + "        android:bottomLeftRadius=\"" + radius + "\"\n";
            }
            if (checkText.indexOf("3") != -1) {
                content = content + "        android:bottomRightRadius=\"" + radius + "\"\n";
            }
            content = content + "        />\n";
        }

        solid = getEndColor(solid);

        content = content + " <solid android:color=\"" + solid + "\"/>\n";
        content = content + "</shape>"
        return content;
    }

    //获取实心的代码
    function getSolidText(radius, color, checkText) {
        var content = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<shape xmlns:android=\"http://schemas.android.com/apk/res/android\">\n";

        //不为空
        if (radius != "" && radius != null && selectDp != null && selectDp != "") {
            //取出默认的dp配置前缀
            radius = selectDp + radius;
        } else {
            radius = (radius == null || radius === "") ? "" : radius + "dp";
        }

        if (radius != null && (checkText == "" || checkText == "0123")) {
            //全部
            content = content + "    <corners android:radius=\"" + radius + "\"></corners>\n";
        } else {
            content = content + "    <corners\n";
            if (checkText.indexOf("0") != -1) {
                content = content + "        android:topLeftRadius=\"" + radius + "\"\n";
            }
            if (checkText.indexOf("1") != -1) {
                content = content + "        android:topRightRadius=\"" + radius + "\"\n";
            }
            if (checkText.indexOf("2") != -1) {
                content = content + "        android:bottomLeftRadius=\"" + radius + "\"\n";
            }
            if (checkText.indexOf("3") != -1) {
                content = content + "        android:bottomRightRadius=\"" + radius + "\"\n";
            }
            content = content + "        />\n";
        }
        //基础信息color不为空，就追加前缀
        color = getEndColor(color);
        content = content + "    <solid android:color=\"" + color + "\" />\n";
        content = content + "</shape>";
        return content;
    }

    //获取渐变
    function getGradientXml(radius, checkText) {
        //渐变
        var inputReactStartColor = $(".input_react_start_color").val();//起始颜色
        var inputReactCenterColor = $(".input_react_center_color").val();//中间颜色
        var inputReactEndColor = $(".input_react_end_color").val();//结束颜色
        let inputReactGradientRadius = $(".input_react_gradient_radius").val();//渐变角度
        let shapeGradientType = $("input[name='shapeGradientType']:checked").val();

        inputReactStartColor = getEndColor(inputReactStartColor);
        inputReactCenterColor = getEndColor(inputReactCenterColor);
        inputReactEndColor = getEndColor(inputReactEndColor);

        if (inputReactGradientRadius == null || inputReactGradientRadius == "") {
            showToast("请输入渐变角度");
            return "";
        }
        var sgType;
        if (shapeGradientType == 0) {
            sgType = "linear";
        } else if (shapeGradientType == 1) {
            sgType = "radial";
        } else {
            sgType = "sweep";
        }
        var gradient = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
            "<shape xmlns:android=\"http://schemas.android.com/apk/res/android\">\n" +
            "\n" +
            "    <gradient\n" +
            "        android:angle=\"" + inputReactGradientRadius + "\"\n";

        if (inputReactCenterColor != null && inputReactCenterColor != "") {
            gradient = gradient + "        android:centerColor=\"" + inputReactCenterColor + "\"\n";
        }
        gradient = gradient + "        android:endColor=\"" + inputReactEndColor + "\"\n" +
            "        android:startColor=\"" + inputReactStartColor + "\"\n" +
            "        android:type=\"" + sgType + "\" />\n"
        //不为空
        if (radius != "" && radius != null) {
            //取出默认配置前缀，若不为空，就追加
            if (selectDp != "" && selectDp != null) {
                radius = selectDp + radius;
            } else {
                radius = radius + "dp";
            }
            if (checkText == "" || checkText == "0123") {
                //全部
                gradient = gradient + "    <corners android:radius=\"" + radius + "\"></corners>\n";
            } else {
                gradient = gradient + "    <corners\n";
                if (checkText.indexOf("0") != -1) {
                    gradient = gradient + "        android:topLeftRadius=\"" + radius + "\"\n";
                }
                if (checkText.indexOf("1") != -1) {
                    gradient = gradient + "        android:topRightRadius=\"" + radius + "\"\n";
                }
                if (checkText.indexOf("2") != -1) {
                    gradient = gradient + "        android:bottomLeftRadius=\"" + radius + "\"\n";
                }
                if (checkText.indexOf("3") != -1) {
                    gradient = gradient + "        android:bottomRightRadius=\"" + radius + "\"\n";
                }
                gradient = gradient + "        />\n";
            }
        }

        gradient = gradient + "</shape>";
        return gradient;
    }

    //空心和实现监听
    var mShapeType = 0;
    $(".input_name").val("shape_solid__radius_");
    $("input:radio[name='shapeType']").change(function () {
        let type = $(this).val();
        mShapeType = type;
        if (type == 0) {
            $(".input_rect2").css("display", "block");
            $(".input_rect3").css("display", "none");
            $(".input_rect4").css("display", "none");
            $(".input_rect5").css("display", "none");
            $(".input_rect_color").css("display", "none");
        } else if (type == 1) {
            $(".input_rect2").css("display", "none");
            $(".input_rect3").css("display", "block");
            $(".input_rect4").css("display", "block");
            $(".input_rect5").css("display", "block");
            $(".input_rect_color").css("display", "none");
        } else {
            //渐变
            $(".input_rect2").css("display", "none");
            $(".input_rect3").css("display", "none");
            $(".input_rect4").css("display", "none");
            $(".input_rect5").css("display", "none");
            $(".input_rect_color").css("display", "block");
        }
    });

    //获取名字
    $(".getName").click(function () {
        let selectFile = $("input[name='selectFile']:checked").attr("endFile");//文件路径
        if (selectFile == null && !isEmptyDir) {
            showToast("请选择文件路径");
            return;
        }
        var nameFile = "";
        if (selectFile != null && selectFile != "app" && isEmptyDir) {
            nameFile = selectFile + "_";
        }
        var color = "";

        if (mShapeType == 0) {//实心
            color = $(".input_color").val();
        } else if (mShapeType == 1) {//空心
            color = $(".input_solid").val();
        } else {
            //渐变
            let startColor = $(".input_react_start_color").val();
            let endColor = $(".input_react_end_color").val();

            color = startColor + "_to_" + endColor;
        }
        color = color.replaceAll("#", "");

        var radius = $(".input_radius").val();
        if (radius.indexOf("dp") != 0) {
            radius = radius.replace("dp", "");
        }

        var checkText = ""
        $.each($('input:checkbox'), function () {
            if (this.checked) {
                let v = $(this).val();
                checkText = checkText + v;
            }
        });

        var lTRT = "";
        if (checkText != "0123") {
            if (checkText.indexOf("0") != -1 || checkText.indexOf("1") != -1) {
                //左上
                lTRT = "_top"
            }
            if (checkText.indexOf("2") != -1 || checkText.indexOf("3") != -1) {
                //左下
                lTRT = "_bottom"
            }
        }

        if (mShapeType == 0) {
            //实心
            $(".input_name").val(nameFile + "shape_solid" + lTRT + "_" + color + "_radius_" + radius);
        } else if (mShapeType == 1) {
            //空心
            $(".input_name").val(nameFile + "shape_stroke" + lTRT + "_" + color + "_radius_" + radius);
        } else {
            //渐变
            $(".input_name").val(nameFile + "shape_gradient" + lTRT + "_" + color + "_radius_" + radius);
        }
    });

    //弹出提示
    function showToast(msg) {
        const require = parent.window.require;
        const dialog = require('@electron/remote').dialog;
        dialog.showMessageBox({
            type: 'error', //弹出框类型
            message: msg
        });
    }

    function showSuccess(msg) {
        const require = parent.window.require;
        const dialog = require('@electron/remote').dialog;
        dialog.showMessageBox({
            type: 'info', //弹出框类型
            message: msg
        });
    }

    //获取最终的一个颜色值
    function getEndColor(color) {
        if (selectColor != null && selectColor != "" && color != null && color != "") {
            if (color.indexOf("#") != -1) {
                color = color.replace("#", "");
            }
            color = selectColor + color;
        }
        return color;
    }
});