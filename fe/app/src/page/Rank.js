import React from "react";

import {getQueryVariable, beHost, extractMessage} from '../utils'
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {cdnHost} from "../utils";
import {beCharRank, beGuildRank} from "../api/game";

/* global layer */

function RankingFilter() {
    return (<div className="row">
        <div className="col-md-8" style={{paddingRight: '0px'}}>
            <div className="well well2" style={{margin: '0 auto', display: 'inline-block', marginBottom: '0px'}}>
                <a href="/ranking"><img src={`${cdnHost}/static/images/all.png`} data-toggle="tooltip"
                                        title="全部" alt="全部"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=beginner"><img
                    src={`${cdnHost}/static/images/beginner.png`}
                    data-toggle="tooltip" title="新手" alt="新手"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=warrior"><img
                    src={`${cdnHost}/static/images/warrior.png`}
                    data-toggle="tooltip" title="战士" alt="战士"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=magician"><img
                    src={`${cdnHost}/static/images/magician.png`}
                    data-toggle="tooltip" title="魔法师" alt="魔法师"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=bowman"><img
                    src={`${cdnHost}/static/images/bowman.png`}
                    data-toggle="tooltip" title="弓箭手" alt="弓箭手"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=thief"><img
                    src={`${cdnHost}/static/images/thief.png`}
                    data-toggle="tooltip" title="飞侠" alt="飞侠"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=pirate"><img
                    src={`${cdnHost}/static/images/pirate.png`}
                    data-toggle="tooltip" title="海盗" alt="海盗"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=cygnus"><img
                    src={`${cdnHost}/static/images/cygnus.png`}
                    data-toggle="tooltip" title="骑士团" alt="骑士团"/></a>
                <a style={{paddingLeft: '2px'}} href="?job=aran"><img
                    src={`${cdnHost}/static/images/aran.png`}
                    data-toggle="tooltip" title="战神" alt="战神"/></a>
                <a style={{paddingLeft: '2px'}} href="?sort=fame"><img
                    src={`${cdnHost}/static/images/fame.png`}
                    data-toggle="tooltip" title="人气" alt="人气"/></a>
                <a style={{paddingLeft: '2px'}} href="?sort=quest"><img
                    src={`${cdnHost}/static/images/quest.png`}
                    data-toggle="tooltip" title="任务" alt="任务"/></a>
                <a style={{paddingLeft: '2px'}} href="?sort=monsterbook"><img
                    src={`${cdnHost}/static/images/monsterbook.png`}
                    data-toggle="tooltip" title="怪物书" alt="怪物书"/></a>
                <a style={{paddingLeft: '2px'}} href="?sort=guild"><img
                    src={`${cdnHost}/static/images/guild.png`}
                    data-toggle="tooltip" title="家族"
                    alt="家族"/></a>
            </div>
        </div>
        <div className="col-md-4" style={{paddingLeft: '0px'}}>
            <div style={{float: 'right'}}>
                <div className="well well2" style={{marginBottom: '0px', padding: '16px 19px 15px 19px'}}>
                    <div className="input-group">
                        <input type="text" name="search" id="s" className="form-control"
                               placeholder={i18n.t('Rank.search_name')}
                               required=""/>
                        <span className="input-group-btn">
						<button className="btn btn-primary" type="submit" onClick={() => {
                            layer.msg(i18n.t('Common.not_supply_search'), {icon: 0, time: 6000})
                        }}><i className="icon-search"></i> {i18n.t('Common.search')}</button>
					</span>
                    </div>
                </div>
            </div>
        </div>
    </div>);
}

function RankingLine(props) {
    let jobIco;
    if (props.job === 0) {
        jobIco = `${cdnHost}/static/images/beginner.png`
    } else if (props.job >= 100 && props.job < 200) {
        jobIco = `${cdnHost}/static/images/warrior.png`
    } else if (props.job >= 200 && props.job < 300) {
        jobIco = `${cdnHost}/static/images/magician.png`
    } else if (props.job >= 300 && props.job < 400) {
        jobIco = `${cdnHost}/static/images/bowman.png`
    } else if (props.job >= 400 && props.job < 500) {
        jobIco = `${cdnHost}/static/images/thief.png`
    } else if (props.job >= 500 && props.job < 600) {
        jobIco = `${cdnHost}/static/images/pirate.png`
    } else if (props.job >= 1000 && props.job < 1600) {
        jobIco = `${cdnHost}/static/images/cygnus.png`
    } else if (props.job >= 2000) {
        jobIco = `${cdnHost}/static/images/aran.png`
    }

    return (
        <tr>
            <td style={{'verticalAlign': 'middle'}}><span className="badge">{props.rank}</span></td>
            <td className="hidden-sm hidden-xs">
                <img alt={props.name} src={beHost + '/api/avatar/' + props.id}
                     className="avatar img-responsive" style={{margin: '0 auto'}}/>
            </td>
            <td style={{'verticalAlign': 'middle'}}>
                <a href={true} style={{'color': 'orange'}}><b>{props.name}</b></a><br/>
                {props.guild !== null &&
                <div><img alt={props.guild.name}
                          src={'https://maplestory.io/api/GMS/83/GuildMark/background/' + props.guild.logo_bg + '/' + props.guild.logo_bg_color + '/mark/' + props.guild.logo + '/' + props.guild.logo_color}/>{props.guild.name}
                </div>
                }
            </td>
            <td style={{'verticalAlign': 'middle'}}>
                <img alt={props.jobName} src={jobIco}/><br/>{props.jobName}
            </td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.level}</td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.fame}</td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.quest_count}</td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.monster_book}</td>
        </tr>
    );
}

function GuildRanking(props) {
    return (
        <tr>
            <td style={{'verticalAlign': 'middle'}}><span className="badge">{props.rank}</span></td>
            <td style={{'verticalAlign': 'middle'}}>
                <div><img alt={props.data.name}
                          src={'https://maplestory.io/api/GMS/83/GuildMark/background/' + props.data.logo_bg + '/' + props.data.logo_bg_color + '/mark/' + props.data.logo + '/' + props.data.logo_color}/>{props.data.name}
                </div>
                {props.data.alliance !== null &&
                <div>{props.data.alliance}</div>
                }
            </td>
            <td className="hidden-sm hidden-xs">
                <img alt="leader" title={props.data.leader_name}
                     src={beHost + '/api/avatar/' + props.data.leader_id}
                     className="avatar img-responsive" style={{margin: '0 auto'}}/>
            </td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.member}/{props.data.capacity}</td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.gp}</td>
            <td style={{'verticalAlign': 'middle'}}>{props.data.notice}</td>
        </tr>
    );
}

export class RankPage extends React.Component {
    constructor(props) {
        super(props);
        let job = getQueryVariable("job") || 'all';
        let sort = getQueryVariable("sort") || 'level';
        this.state = {data: [], page: 1, job: job ? job : 'false', limit: 10, sort: sort ? sort : 'false'};
        this.getRank = this.getRank.bind(this);
        this.nextPage = this.nextPage.bind(this);
        this.prevPage = this.prevPage.bind(this);
    }

    componentDidMount() {
        document.title = "MagicMS - " + i18n.t('Rank.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(3)').setAttribute("style", "background-color: green");
        this.getRank();
        convertBase();
        pageInit();
    }

    getRank(page) {
        let _this = this;
        let pr;
        if (this.state.sort !== 'guild') {
            pr = beCharRank(this.state.job, this.state.sort, this.state.limit, page ? page : this.state.page)
        } else {
            pr = beGuildRank(this.state.limit, page ? page : this.state.page)
        }
        pr.then(res => {
            _this.setState({data: res.data.items, count: Math.min(100, res.data.total)});
        }).catch(error => {
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll()
            layer.msg(message, {icon: 2, time: 6000});
        })
    }

    nextPage() {
        if (this.state.page > 9 || this.state.data.length < this.limit) {
            layer.msg(i18n.t('Rank.last_page'), {icon: 7, time: 3000});
        } else {
            this.getRank(this.state.page + 1);
            this.setState({page: this.state.page + 1})
        }
    }

    prevPage() {
        if (this.state.page > 1) {
            this.getRank(this.state.page - 1);
            this.setState({page: this.state.page - 1})
        } else {
            layer.msg(i18n.t('Rank.first_page'), {icon: 7, time: 3000});
        }
    }

    render_guild() {
        return (
            <div>
                <h2 className="text-center">{i18n.t('Rank.title')}</h2>
                <hr/>
                <RankingFilter/>
                <hr/>
                <div className="table-responsive">
                    <table className="table table-striped table-hover center-table table-bordered text-center">
                        <thead>
                        <tr>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_1')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_9')}</th>
                            <th style={{'textAlign': 'center'}}
                                className="hidden-sm hidden-xs">{i18n.t('Rank.thead_10')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_11')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_12')}</th>
                            <th style={{'textAlign': 'center'}}><b title={'如公开家族公告，请修改公告以"[p]"开头 \n禁止出现侮辱性及违反当地法律法规的词汇'}> {i18n.t('Rank.thead_13')}<sup>?</sup></b></th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.data.map((item, index) =>
                            <GuildRanking key={index} rank={(this.state.page - 1) * 10 + index + 1} data={item}/>)}
                        </tbody>
                    </table>
                </div>
                <ul className="pager">
                    {i18n.t('Rank.rank_count')} <b id="charCount">{this.state.count}</b>
                    <li className="next"><a href={false} onClick={this.nextPage}>Next<i
                        className="icon-arrow-right"></i></a>
                    </li>
                    <li className="next"><a href={false} onClick={this.prevPage}>Prev<i
                        className="icon-arrow-right"></i></a></li>
                </ul>
            </div>
        )
    }


    render() {
        console.log(this.state.sort)
        if (this.state.sort === 'guild') {
            return this.render_guild()
        }

        return (
            <div>
                <h2 className="text-center">{i18n.t('Rank.title')}</h2>
                <hr/>
                <RankingFilter/>
                <hr/>
                <div className="table-responsive">
                    <table className="table table-striped table-hover center-table table-bordered text-center">
                        <thead>
                        <tr>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_1')}</th>
                            <th style={{'textAlign': 'center'}}
                                className="hidden-sm hidden-xs">{i18n.t('Rank.thead_2')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_3')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_4')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_5')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_6')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_7')}</th>
                            <th style={{'textAlign': 'center'}}>{i18n.t('Rank.thead_8')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.data.map((item, index) =>
                            <RankingLine key={index} rank={(this.state.page - 1) * 10 + index + 1} name={item.name}
                                         guild={item.guild}
                                         job={item.job} jobName={item.jobName} id={item.id} data={item}
                            />)}
                        </tbody>
                    </table>
                </div>
                <ul className="pager">
                    {i18n.t('Rank.rank_count')} <b id="charCount">{this.state.count}</b>
                    <li className="next"><a href={false} onClick={this.nextPage}>Next<i
                        className="icon-arrow-right"></i></a>
                    </li>
                    <li className="next"><a href={false} onClick={this.prevPage}>Prev<i
                        className="icon-arrow-right"></i></a></li>
                </ul>
            </div>
        );
    }
}