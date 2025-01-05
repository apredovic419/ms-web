import React from "react";
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from '../App'

import {getQueryVariable, sleep, extractMessage} from "../utils";
import {beResetPassword, beResetReqCode} from "../api/auth";

/* global layer */

export class ForgotPage extends React.Component {
    constructor(props) {
        super(props);
        let username = getQueryVariable("username");
        let code = getQueryVariable("code");
        let step = getQueryVariable("step");
        this.state = {
            username: username || '',
            code: code || '',
            step: parseInt(step) || 0,
            password1: '',
            password2: '',
            codeWait: 0,
            resetWait: 0
        };
        this.sendEmailCode = this.sendEmailCode.bind(this);
    }

    componentDidMount() {
        document.title = i18n.t('home.title');
        convertBase();
        pageInit();
    }

    sendEmailCode() {
        this.setState({codeWait: 5})
        let _this = this;
        this.timer = setInterval(
            () => {
                let codeWait = _this.state.codeWait - 1;
                _this.setState({codeWait: codeWait});
                if (codeWait === 0) {
                    clearInterval(_this.timer)
                }
            },
            1000
        );
        beResetReqCode(this.state.username).then(res => {
            layer.msg(res.message, {'icon': 6, time: 8000})
            this.setState({'username': this.state.username, 'step': 1})
        }).catch(error => {
            const msg = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(msg, {icon: 2, time: 5000});
        })
        this.setState({'wait': false})
    }

    confirmReset() {
        this.setState({resetWait: 3})
        let _this = this;
        this.timer = setInterval(
            () => {
                let resetWait = _this.state.resetWait - 1;
                _this.setState({resetWait: resetWait});
                if (resetWait === 0) {
                    clearInterval(_this.timer)
                }
            },
            1000
        );
        if (this.state.password1 !== this.state.password2) {
            layer.msg(i18n.t('Register.pwd_diff'), {icon: 0});
            return
        }
        let password = this.state.password1
        let passwordRe = /^[0-9a-zA-Z~!@#$%^&*()_\-+=<>?:"{}|,./;'\\[\]·！￥…（）—《》？：“”【】、；‘，。]{6,16}$/
        if (!passwordRe.test(password)) {
            layer.msg(i18n.t('Register.password_verify'), {icon: 0});
            return false;
        }
        beResetPassword(this.state.username, password, this.state.code).then(res => {
            layer.msg(res.message, {'icon': 6, time: 8000})
            sleep(3000).then(() => {
                window.location.href = '/'
            });
        }).catch(error => {
            const msg = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(msg, {icon: 2, time: 5000});
        })
    }

    render() {
        return (
            <div>
                <h2 className="text-left">忘记密码</h2>
                <hr/>
                <div className="panel panel-default">
                    <div className="panel-body">
                        <div className="text-center">
                            <h3><i className="fa fa-lock fa-4x"/></h3>
                            <h2 className="text-center">找回密码?</h2>
                            <br/>
                            <p>使用注册时的电子邮箱地址以重置密码</p>
                            {(this.state.code !== '' || this.state.step > 0) ? (
                                <div className="panel-body">
                                    <form id="register-form" className="form" method="post">
                                        <div className="form-group">
                                            <div className="input-group">
                                                <span className="input-group-addon"><i
                                                    className="fa fa-user-circle"/></span>
                                                <input id="UserName" name="username" placeholder="游戏账号"
                                                       className="form-control" type="text" value={this.state.username}
                                                       onChange={(e) => {
                                                           this.setState({username: e.target.value})
                                                       }}/>
                                            </div>
                                            <br/>
                                        </div>
                                        <div className="form-group">
                                            <div className="input-group">
                                            <span className="input-group-addon"><i
                                                className="fa fa-envelope"/></span>
                                                <input id="captcha" name="captcha" placeholder="验证码"
                                                       className="form-control" type="text" value={this.state.code}
                                                       onChange={(e) => {
                                                           this.setState({code: e.target.value})
                                                       }}/>
                                            </div>
                                            <br/>
                                        </div>
                                        <div className="form-group">
                                            <div className="input-group">
                                            <span className="input-group-addon"><i
                                                className="fa fa-key"/></span>
                                                <input id="password1" name="password1" placeholder="新密码"
                                                       className="form-control" type="password"
                                                       value={this.state.password1}
                                                       onChange={(e) => {
                                                           this.setState({password1: e.target.value})
                                                       }}/>
                                            </div>
                                            <br/>
                                        </div>
                                        <div className="form-group">
                                            <div className="input-group">
                                            <span className="input-group-addon"><i
                                                className="fa fa-key"/></span>
                                                <input id="password2" name="password2" placeholder="确认密码"
                                                       className="form-control" type="password"
                                                       value={this.state.password2}
                                                       onChange={(e) => {
                                                           this.setState({password2: e.target.value})
                                                       }}/>
                                            </div>
                                            <br/>
                                        </div>
                                        <div className="form-group">
                                            <input className="btn btn-lg btn-primary btn-block" value="确认重置"
                                                   readOnly="readonly" disabled={this.state.resetWait > 0}
                                                   onClick={(e) => {
                                                       this.confirmReset()
                                                   }}/>
                                        </div>
                                    </form>
                                </div>) : (
                                <div className="panel-body">
                                    <form id="register-form" className="form" method="post">
                                        <div className="form-group">
                                            <div className="input-group">
                                                <span className="input-group-addon"><i
                                                    className="fa fa-user-circle"/></span>
                                                <input id="UserName" name="username" placeholder="游戏账号"
                                                       className="form-control" type="text" value={this.state.username}
                                                       onChange={(e) => {
                                                           this.setState({username: e.target.value})
                                                       }}/>
                                            </div>
                                            <br/>
                                        </div>
                                        <div className="form-group">
                                            <input className="btn btn-lg btn-primary btn-block" value="重置密码"
                                                   readOnly="readonly" disabled={this.state.codeWait > 0}
                                                   onClick={(e) => {
                                                       this.sendEmailCode()
                                                   }}/>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}