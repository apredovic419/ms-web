import React from "react";

import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {extractMessage} from "../utils";
import {beVote} from "../api/auth";

/* global layer */

export class VotePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {username: ''};
        this.postVote = this.postVote.bind(this);
    }

    componentDidMount() {
        document.title = "MagicMS - " + i18n.t('Vote.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(4)').setAttribute("style", "background-color: green");
        convertBase();
        pageInit();
    }

    postVote() {
        if (!this.state.username) {
            layer.msg(i18n.t('Vote.input_error'), {icon: 7, time: 5000});
            return;
        }
        console.log(this.state.username);
        beVote(this.state.username).then(res => {
            window.location.href = res.data.url;
        }).catch(error => {
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(message, {icon: 2, time: 5000});
        })
    }

    render() {
        return (
            <div>
                <h2 className="text-center">{i18n.t('Vote.title')}</h2>
                <hr/>
                <center><b>{i18n.t('Vote.introduce1')}</b><br/>
                    {i18n.t('Vote.introduce2')}<br/>
                    <hr/>
                    <b>{i18n.t('Vote.introduce3')}</b><br/>
                    <div style={{'textAlign': 'center', width: '65%', 'list-style-position': 'inside'}}>
                        <ol>
                            <li><small>{i18n.t('Vote.introduce4')}</small></li>
                            <li><small>{i18n.t('Vote.introduce5')}</small></li>
                            <li><small>{i18n.t('Vote.introduce6')}</small></li>
                        </ol>
                    </div>
                    <small>
                        <strong><b><font color="#ff4500">{i18n.t('Vote.introduce7')}<br/></font></b></strong>
                        <br/>
                    </small>
                    {i18n.t('Vote.account')}<br/><input type="text" name="name" maxLength="15" className="form-control"
                                    style={{width: '50%'}} placeholder={i18n.t('Vote.account')} required="" autoComplete="off"
                                    value={this.state.username} onChange={(e) => {
                        this.setState({username: e.target.value})
                    }}/><br/>
                    <input type="submit" name="submit" value={i18n.t('Vote.vote_btn')} id="voteBtn"
                           className="btn btn-primary" onClick={this.postVote}/>
                </center>
            </div>
        );
    }
}