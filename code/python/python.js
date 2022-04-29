const require = parent.window.require;
const dialog = require('@electron/remote').dialog;
const fs = require('fs');
$(function () {
    let channelPath = "python/info/channel.txt"
    fs.readFile(channelPath, 'utf-8',
        function (err, data) {
            if (err) {
                return;
            }
            $(".channelText").val(data)
        })

    $(".python_submit span").click(function () {
        let apkInPath = $(".apk_in_path").val();
        let apkOutPath = $(".apk_out_path").val();
        let channelText = $(".channelText").val();
        if (apkInPath == null || apkInPath == "") {
            showErrorToast("清选择apk");
            return;
        }
        if (apkOutPath == null || apkOutPath == "") {
            showErrorToast("清选择apk输出路径");
            return;
        }
        if (channelText == null || channelText == "") {
            showErrorToast("清输入渠道id");
            return;
        }
        //写渠道id
        fs.writeFile(channelPath,
            channelText, 'utf8',
            function (error) {
                if (error) {
                    return false;
                }
                writeChannelBuildTool(apkInPath, apkOutPath);
            });
    });


    //写入python执行内容
    function writeChannelBuildTool(apkInPath, apkOutPath) {
        fs.writeFile("python/ChannelBuildTool.py",
            getChannelBuildTool(apkInPath, apkOutPath), 'utf8',
            function (error) {
                if (error) {
                    return false;
                }
                //成功之后，直接进行打多渠道包
                printData();
            });
    }

    //执行python命令
    function printData() {
        const pro = parent.window.require("child_process");
        pro.exec("python python/ChannelBuildTool.py", function (error, stdout, stderr) {
            if (error) {
                return
            }
            showSuccessToast("各个渠道apk已生成,快去看看吧~");
        })
    }

    //选择Apk
    $(".selectInApk").click(function () {
        dialog.showOpenDialog({
            title: '请选择需要打多渠道的Apk',
            properties: ['openFile'],
            filters: [{
                name: 'file',
                extensions: ['apk']

            }]
        }).then(result => {
            const path = result.filePaths;
            if (path != null && path != "" && path.toString().indexOf("apk") != -1) {
                //选择后回显
                $(".apk_in_path").val(path);
            } else {
                showErrorToast("必须选择apk文件");
            }

        });
    });

    //选择输出路径
    $(".selectOutApk").click(function () {
        dialog.showOpenDialog({
            title: '请选择Apk的输出路径',
            properties: ['openDirectory']
        }).then(result => {
            const path = result.filePaths;
            if (path != null && path != "") {
                //选择后回显
                $(".apk_out_path").val(path);
            }

        });
    });

    function showErrorToast(msg) {
        dialog.showMessageBox({
            type: 'error', //弹出框类型
            message: msg
        });
    }

    function showSuccessToast(msg) {
        dialog.showMessageBox({
            type: 'info', //弹出框类型
            message: msg
        });
    }

    //写入python执行文件
    function getChannelBuildTool(apkInPath, apkOutPath) {
        let filePath = apkInPath.toString();
        let endPosition = filePath.lastIndexOf("\\");
        let endName = filePath.substring(endPosition + 1, filePath.length)

        apkInPath = apkInPath.replaceAll("\\n", "\\\\n")
            .replaceAll("\\t", "\\\\t");

        apkOutPath = apkOutPath.replaceAll("\\n", "\\\\n")
            .replaceAll("\\t", "\\\\t");

        let channel = "# coding=utf-8\n" +
            "import zipfile\n" +
            "import shutil\n" +
            "import os\n" +
            "\n" +
            "# 空文件 便于写入此空文件到apk包中作为channel文件\n" +
            "src_empty_file = 'python/info/empty.txt'\n" +
            "# 创建一个空文件（不存在则创建）\n" +
            "f = open(src_empty_file, 'w') \n" +
            "f.close()\n" +
            "\n" +
            "# 获取当前目录中apk源包\n" +
            "src_apk = '" + apkInPath + "' #apk地址\n" +
            "\n" +
            "# 获取渠道列表\n" +
            "channel_file = 'python/info/channel.txt'\n" +
            "f = open(channel_file)\n" +
            "lines = f.readlines()\n" +
            "f.close()\n" +
            "\n" +
            "# file name (with extension)\n" +
            "src_apk_file_name = os.path.basename('" + endName + "')\n" +
            "# 分割文件名与后缀\n" +
            "temp_list = os.path.splitext(src_apk_file_name)\n" +
            "# name without extension\n" +
            "src_apk_name = temp_list[0]\n" +
            "# 后缀名，包含.   例如: \".apk \"\n" +
            "src_apk_extension = temp_list[1]\n" +
            "\n" +
            "# 创建生成目录,与文件名相关  输出的apk地址\n" +
            "output_dir = '" + apkOutPath + "\\\\'+'output_'+src_apk_name+'\\\\'\n" +
            "# 目录不存在则创建\n" +
            "if not os.path.exists(output_dir):\n" +
            "   os.mkdir(output_dir)\n" +
            "\n" +
            "# 遍历渠道号并创建对应渠道号的apk文件\n" +
            "for line in lines:\n" +
            "   # 获取当前渠道号，因为从渠道文件中获得带有\\n,所有strip一下\n" +
            "   target_channel = line.strip()\n" +
            "   # 拼接对应渠道号的apk\n" +
            "   target_apk = output_dir + src_apk_name + \"-\" + target_channel + src_apk_extension\n" +
            "   # 拷贝建立新apk  apk地址\n" +
            "   shutil.copy('" + apkInPath + "',  target_apk)\n" +
            "   # zip获取新建立的apk文件\n" +
            "   zipped = zipfile.ZipFile(target_apk, 'a', zipfile.ZIP_DEFLATED)\n" +
            "   # 初始化渠道信息\n" +
            "   empty_channel_file = \"META-INF/channel_{channel}\".format(channel = target_channel)\n" +
            "   # 写入渠道信息\n" +
            "   zipped.write(src_empty_file, empty_channel_file)\n" +
            "   # 关闭zip流\n" +
            "   zipped.close()\n" +
            "\n";

        return channel;
    }
})