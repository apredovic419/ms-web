import './App.css';
import {getServerTime, beHost, storage, extractMessage} from './utils'
import {beLogin, beUserInfo} from "./api/auth";
import {beCharList, beEA, beInviteCode, beServerStatus} from "./api/game";

import i18n from "./i18next/i18n";

/* global layer */

export function convertBase() {
    // ui翻译
    document.querySelector("body > div > div > div > div.col-md-3 > div:nth-child(2) > h3").textContent = i18n.t("Common.status_title");
    document.querySelector('#ts_online').textContent = i18n.t("Common.online");
    document.querySelector('#ts_time').textContent = i18n.t("Common.server_time");
    document.querySelector('#ts_status').textContent = i18n.t("Common.status");
    document.querySelector('#ts_version').textContent = i18n.t("Common.version");
    document.querySelector('#ts_exp_rate').textContent = i18n.t("Common.exp_rate");
    document.querySelector('#ts_meso_rate').textContent = i18n.t("Common.meso_rate");
    document.querySelector('#ts_drop_rate').textContent = i18n.t("Common.drop_rate");
    document.querySelector('#ts_boss_rate').textContent = i18n.t("Common.boss_rate");
    document.querySelector('#ts_quest_rate').textContent = i18n.t("Common.quest_rate");
    document.querySelector('#ts_quest_info').textContent = i18n.t("Common.quest_rate_info");
    document.querySelector('body > div > footer > div > center > p').innerHTML = i18n.t("Common.web_quote");
    document.querySelector('ul > li:nth-child(1) > a > span').textContent = i18n.t("Common.register");
    document.querySelector('ul > li:nth-child(2) > a > span').textContent = i18n.t("Common.download");
    document.querySelector('ul > li:nth-child(3) > a > span').textContent = i18n.t("Common.ranking");
    document.querySelector('ul > li:nth-child(4) > a > span').textContent = i18n.t("Common.vote");
    document.querySelector('ul > li:nth-child(5) > a > span').textContent = i18n.t("Common.notice");
    document.querySelector('ul > li:nth-child(6) > a > span').textContent = i18n.t("Common.shop");
    document.querySelector('ul > li:nth-child(7) > a > span').textContent = i18n.t("Common.database");
    // document.querySelector('ul > li:nth-child(8) > a > span').textContent = i18n.t("Common.playground");
    document.querySelector('#loginform > div:nth-child(1) > label').textContent = i18n.t("Register.username");
    document.querySelector('#loginform > div:nth-child(2) > label').innerHTML = i18n.t("Common.password");
    document.querySelector('#username').placeholder = i18n.t("Register.username");
    document.querySelector('#password').placeholder = i18n.t("Register.password");
    document.querySelector('#login').value = i18n.t("Common.login");
    document.querySelector('#loginform > a').textContent = i18n.t("Common.register");
    let qq = document.querySelector('body > div > div > div > div.col-md-3 > div:nth-child(3) > img');
    if (qq !== null && i18n.language.indexOf("zh") === -1) {
        // qq.setAttribute('src', '')
    }
}


const checkin = async function () {
    beCharList().then(resp => {
        let content = '<select host="' + beHost + '" class="form-control" id="select-char""><option>' + i18n.t('CashShop.select-char') + '</option>'
        for (let cr of resp.data.items) {
            content += '<option value="' + cr.id + '">' + cr.name + '</option>';
        }
        content += '</select>'
        content += `<script>
        document.getElementById('select-char').onchange = function () {
            let select = document.getElementById('select-char');
            let host = select.getAttribute("host")
            let index = select.selectedIndex;
            let cid = select.options[index].value;
            let name = select.options[index].text;
            if (name === "${i18n.t('CashShop.select-char')}") return;
            layer.confirm('${i18n.t('Common.checkin_text1')} ' + name + ' ${i18n.t('Common.checkin_text2')}',
                {icon: 3, title: '${i18n.t('Common.checkin')}', skin: 'my-skin', btn: ['${i18n.t('Common.confirm')}', '${i18n.t('Common.cancel')}']},
                function (index) {
                    let xhr = new XMLHttpRequest();
                    xhr.open("post", host + "/api/v1/user/checkin");
                    xhr.setRequestHeader("Authorization", "Bearer ${storage.getExpire('token')}");
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    let data = {character_id: cid};
                    xhr.send(JSON.stringify(data));
                    xhr.onreadystatechange = function() {
                        if (this.readyState === XMLHttpRequest.DONE) {
                            if (this.status===200){
                                layer.closeAll();
                                let resp = JSON.parse(this.responseText);
                                if (resp.code === 200) {
                                    layer.msg(resp.message.replace("\\n", "<br>"), {title: '${i18n.t('Common.checkin_success')}', icon: 6, time: 5000})
                                } else {
                                    layer.msg(resp.message, {title: '${i18n.t('Common.checkin_failure')}', icon: 2, time: 6000});
                                }
                            } else {
                                layer.msg(${i18n.t('Common.server_error')}, {title: '${i18n.t('Common.checkin_failure')}', icon: 2, time: 6000});
                            }
                        }
                    }
                }
            )}
        </script>`;
        layer.open({
            type: 1,
            title: ['<span style="color:white;">' + i18n.t("Common.checkin") + '</span> ',
                'background-color: #4898d5'],
            closeBtn: 0, //不显示关闭按钮
            anim: 2,
            shadeClose: true, //开启遮罩关闭
            area: [document.body.clientWidth > 420 ? '420px' : '100%',], //宽高
            content: content
        });
    }).catch(error => {
        const message = extractMessage(error, i18n.t('Common.server_error'));
        layer.msg(message, {icon: 2, time: 6000});
    });
    window.beChekIn = undefined;
}

const logout = function () {
    layer.confirm(i18n.t('Common.logout_text'),
        {
            icon: 0,
            title: i18n.t('Common.logout_title'),
            skin: 'my-skin',
            btn: [i18n.t('Common.confirm'), i18n.t('Common.cancel')]
        },
        function (index) {
            layer.close(index);
            storage.clear();
            window.location.reload();
        });
}


const gameEA = function () {
    layer.confirm(i18n.t('Common.sos_text'),
        {
            icon: 0,
            title: i18n.t('Common.sos_title'),
            skin: 'my-skin',
            btn: [i18n.t('Common.confirm'), i18n.t('Common.cancel')]
        },
        function (index) {
            layer.close(index);
            beEA().then(resp => {
                layer.msg(resp.message, {title: '成功', icon: 6, time: 6000});
            }).catch(error => {
                const msg = extractMessage(error, i18n.t('Common.server_error'));
                layer.closeAll();
                layer.msg(msg, {icon: 2, time: 6000});
            });
        }
    );
};

const reqInvite = function () {
    layer.confirm(i18n.t('Common.invite_text'),
        {
            icon: 3,
            title: i18n.t('Common.invite'),
            skin: 'my-skin',
            btn: [i18n.t('Common.confirm'), i18n.t('Common.cancel')]
        },
        function (index) {
            layer.close(index);
            beInviteCode().then(resp => {
                layer.msg(resp.message, {title: '成功', icon: 6, time: 8000});
            }).catch(error => {
                const msg = extractMessage(error, i18n.t('Common.server_error'));
                layer.closeAll();
                layer.msg(msg, {icon: 2, time: 8000});
            });
        }
    );
};

const messageHtml = `
<div id="message"><div class="alert alert-success" style="text-align:center">${i18n.t('Common.login_info')}</div>
<div class="alert"><div style="float:left;"><button type="button" class="btn btn-default" onclick="checkin()">${i18n.t('Common.checkin')}</button></div>
<div style="float:right;"><button type="button" class="btn btn-warning">${i18n.t('Common.logout')}</button></div></div>
<div class="alert"><button type="button" class="btn btn-info" style="width:100%">${i18n.t('Common.invite')}</button></div>
<div class="alert" style="margin-top: -40px; margin-bottom: 0;"><button type="button" class="btn btn-danger" style="width:100%">${i18n.t('Common.sos')}</button></div></div>
`;

// 登录态的页面展示
const isLoginDisplay = function () {
    const lg = document.getElementById('loginform');
    lg.style.transition = 'height 1000ms';
    lg.style.overflow = 'hidden';
    lg.style.height = '0';
    document.getElementById('message').innerHTML = messageHtml;
    let checkinBtn = document.querySelector('#message  div:nth-child(1) > button');
    if (checkinBtn !== null) {
        checkinBtn.onclick = checkin;
    }
    let logoutBtn = document.querySelector('#message  div:nth-child(2) > button');
    if (logoutBtn !== null) {
        logoutBtn.onclick = logout;
    }
    let inviteBtn = document.querySelector('#message  div:nth-child(3) > button');
    if (inviteBtn !== null) {
        inviteBtn.onclick = reqInvite;
    }
    let sosBtn = document.querySelector('#message  div:nth-child(4) > button');
    if (sosBtn !== null) {
        sosBtn.onclick = gameEA;
    }
};

const loginBtnClick = function () {
    document.getElementById('username').setAttribute('disabled', 'true');
    document.getElementById('password').setAttribute('disabled', 'true');
    beLogin(document.getElementById('username').value, document.getElementById('password').value).then(_ => {
        isLoginDisplay();
    }).catch(error => {
        console.log(error)
        document.getElementById('username').removeAttribute('disabled');
        document.getElementById('password').removeAttribute('disabled');
        document.getElementById('message').innerHTML = '<br/><div class="alert alert-danger">' + error.message + '</div>';
    });
    return false
}

const showOnline = function (res) {
    document.getElementById('onlineNumber').innerText = res.online;
    if (res.status === '正常') {
        document.getElementById('serverStatus').innerText = i18n.t('Common.normal')
        document.getElementById('serverStatus').style.color = '#2ecc71'
    } else if (res.status === '异常') {
        document.getElementById('serverStatus').innerText = i18n.t('Common.abnormal')
        document.getElementById('serverStatus').style.color = '#FF0000'
    } else if (res.status === "EOL") {
        document.getElementById('serverStatus').innerText = "EOL"
        document.getElementById('serverStatus').style.color = '#808080'
    } else {
        document.getElementById('serverStatus').innerText = res.status;
        document.getElementById('serverStatus').style.color = '#f4ac06'
    }
}

const reloadOnline = function () {
    let res = storage.getExpire('ServerStatus');
    if (res == null) {
        beServerStatus().then(resp => {
            res = {online: resp.data.count, status: resp.data.status};
            storage.setExpire('ServerStatus', res, 60000);
            storage.setItem('forceInvite', resp.data.invite === true);
            showOnline(res);
        })
    } else {
        showOnline(res);
    }
}

export function pageInit() {
    if (i18n.language.indexOf("zh") === -1) {
        let notice = document.getElementById('recent_notice');
        if (notice != null) {
            notice.parentNode.removeChild(notice);
        }
    }

    setInterval(function () {
        document.getElementById("ServerTime").innerText = getServerTime();
    }, 1000);

    if (storage.getExpire('token')) {
        if (storage.getExpire('user')) {
            isLoginDisplay();
        } else {
            beUserInfo().then(resp => {
                storage.setExpire("user", JSON.stringify(resp.data), 1800000);
                isLoginDisplay();
            }).catch(error => {
                storage.clear();
            })
        }
    }

    let lgBtn = document.getElementById('login');
    lgBtn.onclick = loginBtnClick;
    lgBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            lgBtn.click();
        }
    });

    reloadOnline()
    setInterval(reloadOnline, 180000)
}
