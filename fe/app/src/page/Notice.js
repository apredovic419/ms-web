import React from "react";

import {getLocalDate, extractMessage} from '../utils'
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {beNoticeDetail, beNoticeList} from "../api/news";

/* global layer */

/* global marked */

function Notice(props) {
    return <div className="article"><a href={"notice/" + props.id}>{props.title}</a> <span
        className="article-time">{getLocalDate(props.date)}</span></div>

}

export class NoticePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {notices: []}
    }

    componentDidMount() {
        document.title = "MagicMS - " + i18n.t('Notice.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(5)').setAttribute("style", "background-color: green");
        let _this = this;
        beNoticeList(30, 1).then(res => {
            _this.setState({notices: res.data.items})
        }).catch(error => {
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(message, {icon: 2, time: 6000});
        })
        convertBase();
        pageInit();
    }

    render() {
        return (
            <div>
                <h2 className="text-center">{i18n.t('Notice.title')}</h2>
                <hr/>
                <div className="article-list">
                    {this.state.notices.map((item) => <Notice key={item.id} id={item.id} title={item.title}
                                                              date={item.create_time}/>)}
                </div>
            </div>
        );
    }
}

export class NoticeDetailPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {data: [], content: ''}
    }

    componentDidMount() {
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(5)').setAttribute("style", "background-color: green");
        let _this = this;
        convertBase();
        beNoticeDetail(this.props.match.params.nid).then(res => {
            document.title = res.data.title;
            _this.setState({data: res.data});
            let content = document.querySelector('div.article-content')
            content.innerHTML = marked.parse(res.data.content)
            for (let tb of document.querySelectorAll('table')) {
                tb.className = 'table table-striped table-bordered table-hover'
            }
        }).catch(error => {
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(message, {icon: 2, time: 6000});
        })
        pageInit();
    }

    render() {
        return (
            <div>
                <div className="article-head">
                    <h2 className="text-center">{this.state.data.title}</h2>
                    <span style={{float: 'right', marginTop: '10px'}}>{this.state.data.create_time}</span>
                    <hr/>
                </div>
                <div className="article-content">
                </div>
            </div>
        );
    }
}