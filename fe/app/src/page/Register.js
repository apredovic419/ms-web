import React from "react";
import {sleep, cdnHost, extractMessage, RECAPTCHA_SITE_KEY} from "../utils";
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {beInviteHelper, beRegCaptcha, beRegister, beTos} from "../api/auth";

/* global layer */

/* global marked */

export class RegisterPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            password2: '',
            invitationCode: "",
            email: '',
            emailCode: '',
            birthday: '',
            tos: false,
            codeWait: 0
        };

        this.onChangeValue = this.onChangeValue.bind(this);
        this.readTos = this.readTos.bind(this);
        this.sendEmail = this.sendEmail.bind(this);
        this.registerBtn = this.registerBtn.bind(this);
    }

    componentDidMount() {
        document.title = "MagicMS - " + i18n.t('Register.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(1)').setAttribute("style", "background-color: green");
        let script = document.createElement("script");
        script.type = 'text/javascript';
        script.async = 'async';
        script.src = 'https://recaptcha.net/recaptcha/api.js';
        document.body.appendChild(script);
        convertBase();
        pageInit();
    }

    onChangeValue(e) {
        let name = e.target.getAttribute('name');
        this.setState({[name]: e.target.value})
    }

    readTos(e) {
        this.setState({tos: true});
        beTos().then(resp => {
            const stylesheet = `<link rel="stylesheet" href="${cdnHost}/static/css/github-markdown.css">`;
            let content = marked.parse(resp.data.content);
            layer.open({
                type: 1,
                title: i18n.t('Register.tos_title'),
                shadeClose: true,
                shade: 0.8,
                area: ['100%', '100%'],
                content: stylesheet + content
            });
        })
    }

    readInvite(e) {
        beInviteHelper().then(resp => {
            const stylesheet = `<link rel="stylesheet" href="${cdnHost}/static/css/github-markdown.css">`;
            let content = marked.parse(resp.data.content);
            layer.open({
                type: 1,
                title: i18n.t('Register.invitationCode'),
                shadeClose: true,
                shade: 0.1,
                area: ['800px', '320px'],
                content: stylesheet + content
            });
        })
    }

    sendEmail() {
        // if (Math.round(new Date()) > 1659283200000) {
        //     layer.msg(i18n.t('Register.register_stop'), {icon: 0});
        //     return
        // }

        let em = document.getElementById('inputEmail').value
        if (em === "") {
            layer.msg(i18n.t('Register.email_verify'), {icon: 0});
            return
        }
        if (!(/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(em))) {
            layer.msg(i18n.t('Register.valid_email'), {icon: 0});
            return
        }
        this.setState({codeWait: 60})
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
        beRegCaptcha(em).then(resp => {
            layer.msg(resp.message, {icon: 1});
        }).catch(error => {
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(message, {icon: 2, time: 10000});
        })
    }

    registerBtn() {
        // if (Math.round(new Date()) > 1659283200000) {
        //     layer.msg(i18n.t('Register.register_stop'), {icon: 0});
        //     return
        // }

        // eslint-disable-next-line no-undef
        let captcha = grecaptcha.getResponse();
        let username, pwd1, pwd2, invitationCode, birthday, email, code;
        if (!this.state.tos) {
            layer.msg(i18n.t('Register.tos_read'), {icon: 0});
            return false;
        }
        username = document.getElementById('inputUsername').value;
        let userRe = /^[0-9a-zA-Z]{5,12}$/
        if (username.length < 5 || username.length > 12) {
            layer.msg(i18n.t('Register.user_length'), {icon: 0});
            return false;
        }
        if (!userRe.test(username)) {
            layer.msg(i18n.t('Register.user_verify'), {icon: 0});
            return false;
        }
        pwd1 = document.getElementById('inputPassword').value;
        pwd2 = document.getElementById('inputPassword2').value;
        invitationCode = document.getElementById('invitationCode').value;
        email = document.getElementById('inputEmail').value
        code = document.getElementById('emailCode').value
        birthday = document.getElementById('inputBirthday').value;
        if (pwd1 !== pwd2) {
            layer.msg(i18n.t('Register.pwd_diff'), {icon: 0});
            return false;
        }
        if (pwd1.length < 6 || pwd1.length > 16) {
            layer.msg(i18n.t('Register.pwd_length'), {icon: 0});
            return false;
        }
        let passwordRe = /^[0-9a-zA-Z~!@#$%^&*()_\-+=<>?:"{}|,./;'\\[\]·！￥…（）—《》？：“”【】、；‘，。]{6,16}$/
        if (!passwordRe.test(pwd1)) {
            layer.msg(i18n.t('Register.password_verify'), {icon: 0});
            return false;
        }
        if (email === "") {
            layer.msg(i18n.t('Register.valid_email'), {icon: 0});
            return false;
        }
        if (birthday === "") {
            layer.msg(i18n.t('Register.birthday_verify'), {icon: 0});
            return false;
        }
        if (localStorage.getItem('forceInvite') === 'true' && invitationCode === '') {
            layer.msg(i18n.t('Register.invitation_verify'), {icon: 0});
            return false;
        }
        if (code === "") {
            layer.msg(i18n.t('Register.emailCode_verify'), {icon: 0});
            return false;
        }
        if (captcha === "") {
            layer.msg(i18n.t('Register.captcha_verify'), {icon: 0});
            return false;
        }
        beRegister(username, email, code, pwd1, pwd2, birthday, invitationCode, captcha).then(resp => {
            layer.msg(resp.message, {'title': i18n.t('Register.register_success'), 'icon': 6, time: 5000})
            sleep(3000).then(() => {
                window.location.reload()
            });
        }).catch(error => {
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(message, {icon: 2, time: 10000});
        })
    }

    render() {
        let forceInvite = localStorage.getItem('forceInvite')
        return (
            <div>
                <h2 className="text-center">{i18n.t('Register.title')}</h2>
                <hr/>
                <center>
                    <div className="form-group">
                        <label htmlFor="inputUsername">{i18n.t('Register.username')}</label>
                        <input type="text" style={{width: '50%'}} name="username" maxLength="12"
                               className="form-control" id="inputUsername" autoComplete="off" placeholder={i18n.t('Register.username')}
                               required="" value={this.state.username} onChange={this.onChangeValue}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="inputPassword">{i18n.t('Register.password')}</label>
                        <input type="password" style={{width: '50%'}} name="password" maxLength="12"
                               className="form-control" id="inputPassword" autoComplete="off" placeholder={i18n.t('Register.password')}
                               required="" value={this.state.password} onChange={this.onChangeValue}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="inputPassword2">{i18n.t('Register.password_2')}</label>
                        <input type="password" style={{width: '50%'}} name="password2" maxLength="12"
                               className="form-control" id="inputPassword2" autoComplete="off" placeholder={i18n.t('Register.password_2')}
                               required="" value={this.state.password2} onChange={this.onChangeValue}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="invitationCode">{i18n.t('Register.invitationCode')}(<a href={true} onClick={this.readInvite}>{i18n.t('Register.invitationCode3')}</a>)</label>
                        <input type="text" style={{width: '50%'}} name="invitationCode"
                               className="form-control" id="invitationCode" autoComplete="off" placeholder={forceInvite === "true" ? i18n.t('Register.invitationCode4') :  i18n.t('Register.invitationCode2')}
                               value={this.state.invitationCode} onChange={this.onChangeValue}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="inputEmail">{i18n.t('Register.email')}</label>
                        <div className="input-group" style={{width: '50%'}}>
                            <input type="email" name="email" className="form-control" id="inputEmail"
                                   autoComplete="off" placeholder={i18n.t('Register.email')} required="" value={this.state.email}
                                   onChange={this.onChangeValue}/>
                            <span className="input-group-btn"><button className="btn btn-default" type="button"
                                                                      disabled={this.state.codeWait > 0}
                                                                      id="sendEmailBtn"
                                                                      onClick={this.sendEmail}>{this.state.codeWait > 0 ? i18n.t('Register.get_email_code') + '(' + this.state.codeWait + ')' : i18n.t('Register.get_email_code')}</button></span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailCode">{i18n.t('Register.email_code')}</label>
                        <input type="text" style={{width: '50%'}} name="emailCode" className="form-control"
                               id="emailCode" autoComplete="off" placeholder={i18n.t('Register.email_code')} required=""
                               value={this.state.emailCode} onChange={this.onChangeValue}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="inputBirthday">{i18n.t('Register.birthday')}</label>
                        <input type="date" style={{width: '50%'}} name="birthday" className="form-control"
                               id="inputBirthday" autoComplete="off" placeholder={i18n.t('Register.birthday')} required=""
                               value={this.state.birthday} onChange={this.onChangeValue}/>
                    </div>
                    <font size="2">{i18n.t('Register.tos_message')}<a href={true} onClick={this.readTos}>{i18n.t('Register.tos_title')}</a></font>
                    <br/>
                    <br/>
                    <label>{i18n.t('Register.captcha')}</label>
                    <div className="g-recaptcha" data-sitekey={RECAPTCHA_SITE_KEY}></div>
                    <br/>
                    <br/>
                    <input type="submit" onClick={this.registerBtn} className="btn btn-primary" name="submit"
                           value={i18n.t('Register.register')}/>
                    <br/>
                    <br/>

                </center>
            </div>
        );
    }
}