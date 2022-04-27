const require = parent.window.require;
const dialog = require('@electron/remote').dialog;

$(function () {
    //获取存储的选择路径
    let selectPath = localStorage.getItem("select_path");
    let selectDp = localStorage.getItem("select_dp");
    let selectColor = localStorage.getItem("select_color");
    //不为空进行回显
    if (selectPath != "" && selectPath != null) {
        $(".config_file_input").val(selectPath);
    }

    //回显dp
    if (selectDp != "" && selectDp != null) {
        $(".config_input").eq(0).val(selectDp);
    }
    //回显颜色
    if (selectColor != "" && selectColor != null) {
        $(".config_input").eq(1).val(selectColor);
    }

    //点击选择项目路径
    $(".select_file").click(function () {
        //选择文件
        dialog.showOpenDialog({
            properties: ['openDirectory']
        }).then(result => {
            const path = result.filePaths;
            if (path != null && path != "") {
                //选择后回显
                $(".config_file_input").val(path);
                //进行保存路径
                localStorage.setItem("select_path", path)
            }

        })
    });

    //确定点击
    $(".config_submit span").click(function () {
        let dp = $(".config_input").eq(0).val();
        let color = $(".config_input").eq(1).val();
        if (dp != null) {
            localStorage.setItem("select_dp", dp);
        }
        if (color != null) {
            localStorage.setItem("select_color", color);
        }
        showSuccess("保存成功");
    });

    function showSuccess(msg) {
        const require = parent.window.require;
        const dialog = require('@electron/remote').dialog;
        dialog.showMessageBox({
            type: 'info', //弹出框类型
            message: msg
        });
    }
});