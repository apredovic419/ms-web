import React from "react";

import {getLocalDate, beHost, extractMessage, storage} from "../utils";
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {beCsType, beCsPoster, beItemList, beItemGift, beCSHelper} from "../api/cs";
import { beNoticeList } from "../api/news";
import {beCharList} from "../api/auth";

/* global layer */

/* global marked */

function ShopItem(props) {
    let icoUrl = ''
    if (props.data.item_ico !== null) {
        if (props.data.item_ico.substring(0, 4) === 'http') {
            icoUrl = props.data.item_ico;
        } else {
            icoUrl = 'data:image/png;base64,' + props.data.item_ico;
        }
    } else {
        icoUrl = 'https://maplestory.io/api/GMS/253/item/' + props.data.item_id + '/iconRaw';
    }
    return (
        <div className="col-md-4 shop-item"
             data-item={JSON.stringify(props.data)}>
            <div className="row shop-detail" id={props.data.id}>
                <div className="col-md-4"><img className="item-ico img-rounded" alt={props.data.id}
                                               src={icoUrl}/>
                </div>
                <div className="col-md-7 col-md-offset-1">
                    <div className="item-title">{props.data.title}</div>
                    <div className="item-content">{props.data.desc}</div>
                    <div className="item-price">{i18n.t('Common.price')}: <font color="#ff8c00"><b>{props.data.price}</b> </font><font
                        color="#18bc9c">{props.data.currency}</font><br/>{i18n.t('CashShop.stock')}: {props.data.amount === null ? i18n.t('Common.adequate') : props.data.amount}
                    </div>
                    <div className="item-button">
                        <button type="button" style={{float: 'right'}}
                                className="btn-info btn-sm btn-buy" onClick={(e) => props.buy(e)}>{i18n.t('Common.buy')}
                        </button>
                        <button type="button" style={{float: 'right', marginRight: '10px'}}
                                onClick={(e) => props.gift(e)}
                                className="btn-success btn-sm btn-gift">{i18n.t('Common.gift')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


function ShopItemRow(props) {
    let count = 0;
    let templates = [];
    let arr = [];
    for (let cs of props.data) {
        arr.push(cs)
        count = count + 1;
        if (arr.length === 3) {
            templates.push(arr);
            arr = [];
        }
    }
    if (arr.length > 0) {
        templates.push(arr);
    }
    return (
        templates.map((arr, index) => <div key={index} className="row shop-list">{arr.map(cs => <ShopItem key={cs.id}
                                                                                                          data={cs}
                                                                                                          buy={props.buyBtn}
                                                                                                          gift={props.giftBtn}/>)}</div>)
    );
}

export class CashShopPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {helper: null, types: [], category: '', page: 1, limit: 15, data: [], total: 0, keyword: null, poster: {}}
        this.helper = this.helper.bind(this)
        this.docs = this.docs.bind(this)
        this.selectType = this.selectType.bind(this)
        this.getShopList = this.getShopList.bind(this)
        this.nextPage = this.nextPage.bind(this)
        this.prevPage = this.prevPage.bind(this)
        this.buttonBuy = this.buttonBuy.bind(this)
        this.checkGoods = this.checkGoods.bind(this)
        this.buttonGift = this.buttonGift.bind(this)
        this.onKeyDownChange = this.onKeyDownChange.bind(this)
        this.changeKeyWord = this.changeKeyWord.bind(this)
        this.poster = this.poster.bind(this)

        String.prototype.format = function (args) {
            var result = this;
            if (arguments.length > 0) {
                if (arguments.length === 1 && typeof (args) == "object") {
                    for (let key in args) {
                        if (args[key] !== undefined) {
                            let reg = new RegExp("({" + key + "})", "g")
                            result = result.replace(reg, args[key])
                        }
                    }
                } else {
                    for (let i = 0; i < arguments.length; i++) {
                        if (arguments[i] !== undefined) {
                            let reg = new RegExp("({)" + i + "(})", "g")
                            result = result.replace(reg, arguments[i])
                        }
                    }
                }
            }
            return result;
        };
    }

    componentWillMount() {
        let _this = this;
        document.title = 'MagicMS - ' + i18n.t('CashShop.title');
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(6)').setAttribute("style", "background-color: green");

        beCsType().then(res => {
            _this.setState({types: res.data.items})
        }).catch(error => {
            const msg = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll();
            layer.msg(msg, {icon: 2, time: 5000})
        })

        beCsPoster().then(res => {
            _this.setState({poster: res.data})
        }).catch(error => {
            const msg = extractMessage(error, i18n.t('Common.server_error'));
            layer.closeAll();
            layer.msg(msg, {icon: 2, time: 5000})
        })

        this.getShopList(1, 15, '', '')
        convertBase();
    }

    componentDidMount() {
        pageInit();
    }

    helper() {
        if (this.state.helper) {
            layer.open({
                type: 1,
                title: '道具商城使用帮助',
                shadeClose: true,
                shade: 0.8,
                area: ['100%', '100%'],
                content: marked.parse(this.state.helper)
            });
            return;
        }
        beCSHelper().then(res => {
            this.setState({helper: res.data.content})
            layer.open({
                type: 1,
                title: i18n.t('CashShop.help_title'),
                shadeClose: true,
                shade: 0.8,
                area: ['100%', '100%'],
                content: marked.parse(res.data.content)
            })
        }).catch(error => {
            const msg = extractMessage(error, i18n.t('CashShop.server_error'));
            layer.closeAll()
            layer.msg(msg, {icon: 2, time: 5000});
        })
    }


    docs(doc, title) {
        beNoticeList().then(res => {
            layer.open({
                type: 1,
                title: title || '',
                shadeClose: true,
                shade: 0.8,
                area: ['640px', '500px'],
                content: marked.parse(res.data.content)
            })
        }).catch(error => {
            const msg = extractMessage(error, i18n.t('CashShop.server_error'));
            layer.closeAll()
            layer.msg(msg, {icon: 2, time: 5000});
        })
    }

    selectType(e) {
        let category = e.target.getAttribute('data')
        this.setState({category: category})
        for (let ele of document.querySelectorAll('div.item-type > button')) {
            ele.setAttribute('style', '')
        }
        e.target.setAttribute("style", "background-color: green")
        this.setState({page: 1, category: category})
        this.getShopList(1, this.state.limit, category)
    }

    getShopList(page, limit, category, keyword) {
        let idx = layer.load(1);
        beItemList(page, limit, category, keyword).then(res => {
            this.setState({data: res.data.items, total: res.data.total, keyword: keyword});
            layer.close(idx);
        }).catch(error => {
            layer.close(idx);
            const msg = extractMessage(error, i18n.t('Common.server_error'));
            layer.msg(msg, {icon: 2, time: 5000});
        });
    }

    nextPage() {
        if (this.state.total < (this.state.page * this.state.limit)) {
            layer.msg(i18n.t('Common.last_page'), {icon: 7, time: 3000});
        } else {
            let npage = this.state.page + 1
            this.setState({page: npage})
            this.getShopList(npage, this.state.limit, this.state.category, this.state.keyword);
        }
    }

    poster() {
        if (this.state.poster.doc !== undefined && this.state.poster.doc !== '')
            this.docs(this.state.poster.doc, this.state.poster.title)
    }

    prevPage() {
        if (this.state.page > 1) {
            let npage = this.state.page - 1
            this.setState({page: npage})
            this.getShopList(npage, this.state.limit, this.state.category, this.state.keyword)
        } else {
            layer.msg(i18n.t('Common.first_page'), {icon: 7, time: 3000});
        }
    }

    checkGoods(e, t) {
        let ele = e.parentNode.parentNode.parentNode.parentNode;
        let data = JSON.parse(ele.getAttribute('data-item'));
        if (!data.can_buy) {
            layer.msg(i18n.t('CashShop.not_allow_buy'), {icon: 2, time: 6000});
            return;
        }
        if (data.amount != null && data.amount <= 0) {
            layer.msg(i18n.t('CashShop.not_stock'), {icon: 7, time: 6000});
            return;
        }
        if (data.start_sale_time && new Date().getTime() < new Date(data.start_sale_time.replace(/-/g, "/")).getTime()) {
            layer.msg(i18n.t('CashShop.sale_time_before').format(getLocalDate(data.start_sale_time)), {icon: 7, time: 6000});
            return;
        }
        if (data.end_sale_time && new Date().getTime() > new Date(data.end_sale_time.replace(/-/g, "/")).getTime()) {
            layer.msg(i18n.t('CashShop.sale_time_after'), {icon: 7, time: 6000});
            return;
        }
        if (t === 'gift' && data.ban_gift) {
            layer.msg(i18n.t('CashShop.not_allow_gift'), {icon: 7, time: 6000});
            return;
        }
        return data;
    }

    async buttonBuy(e) {
        let data = this.checkGoods(e.target)
        if (data == null)
            return;
        let confirm_str = i18n.t('CashShop.buy_confirm')
        let expiration = i18n.t('Common.unlimited')
        if (data.receive_method === 0)
            expiration = "60 " + i18n.t('Common.days')
        if (data.receive_method !== 0 && data.expiration != null)
            expiration = (data.expiration / 86400) + " " + i18n.t('Common.days')

        let errMsg = '';
        const charList = [];
        beCharList().then(res => {
            for (let cr of res.data.items) {
                charList.push(cr);
            }
        }).catch(error => {
            errMsg = extractMessage(error, i18n.t('Common.server_error'));
        });

        layer.confirm(confirm_str.format(data.title, data.price, data.currency, expiration),
            {btn: [i18n.t('Common.buy'), i18n.t('Common.cancel')], title: '{0}'.format(data.title)},
            function () {
                if (errMsg !== '') {
                    layer.msg(errMsg, {icon: 2, time: 6000});
                    return;
                }
                let content = '<select host="' + beHost + '" class="form-control" id="select-char"><option>' + i18n.t('CashShop.select-char') + '</option>'
                for (let cr of charList) {
                    content += '<option value="' + cr.id + '">' + cr.name + '</option>'
                }
                content += '</select></div></div>'
                content += `<script>

                document.getElementById('select-char').onchange = function (){
                    let select = document.getElementById('select-char')
                    let host = select.getAttribute("host")
                    let index = select.selectedIndex
                    let cid = select.options[index].value
                    let name = select.options[index].text
                    if (name === "${i18n.t('CashShop.select-char')}") return

                    layer.confirm('${i18n.t('CashShop.buy_text1')} ' + name + ' ${i18n.t('CashShop.buy_text2')}',
                        {icon: 3, title: '${i18n.t('CashShop.transport')}', skin: 'my-skin', btn: ['${i18n.t('Common.confirm')}', '${i18n.t('Common.cancel')}']},
                        function (index) {
                            let xhr = new XMLHttpRequest();
                            xhr.open("post", host + "/api/v1/cashshop/buy");
                            xhr.setRequestHeader("Authorization", "Bearer ${storage.getExpire('token')}");
                            xhr.setRequestHeader('Content-Type', 'application/json');
                            let payload = {shop_id: ${data.id}, character_id: cid};
                            xhr.send(JSON.stringify(payload));
                            xhr.onreadystatechange = function() {
                                if (this.readyState === XMLHttpRequest.DONE) {
                                    if (this.status === 200) { 
                                        layer.closeAll();
                                        let resp = JSON.parse(this.responseText);
                                        if (resp.code === 200) {
                                            layer.msg(resp.message.replace("\\n", "<br>"), {title: '${i18n.t('CashShop.buy_success')}', icon: 6, time: 5000});
                                        } else {
                                            layer.msg(resp.message, {title: '${i18n.t('CashShop.buy_failure')}', icon: 2, time: 6000});
                                        }
                                    } else {
                                        layer.msg(${i18n.t('Common.server_error')}, {title: '${i18n.t('CashShop.buy_failure')}', icon: 2, time: 6000});
                                    }
                                }
                            }
                        })
                }
                </script>`;
                layer.open({
                    type: 1,
                    title: ['<span style="color:white;">' + i18n.t('CashShop.transport') + '</span> ',
                        'background-color: #4898d5'],
                    closeBtn: 0,
                    anim: 2,
                    shadeClose: true,
                    area: ['420px',],
                    content: content
                });
            }
        )
    };

    buttonGift(e) {
        let data = this.checkGoods(e.target, 'gift')
        if (data == null)
            return;
        let expiration = i18n.t('unlimited');
        if (data.receive_method === 0)
            expiration = "60 " + i18n.t('Common.days')
        if (data.receive_method === 9 && data.expiration != null)
            expiration = (data.expiration / 86400) + " " + i18n.t('Common.days');
        layer.open({
            type: 1,
            title: '赠送物品',
            skin: 'layui-layer-rim',
            area: [document.body.clientWidth > 450 ? '450px' : '100%', 'auto'],
            content: ' <div class="row" style="width: 420px;  margin-left:7px; margin-top:10px;">'
                + '<div class="col-sm-12">'
                + '<div class="input-group">'
                + '<span class="input-group-addon">' + i18n.t('CashShop.shop_name') + '</span>'
                + '<input type="text" class="form-control" value="{0}" disabled>'.format(data.title)
                + '</div>'
                + '</div>'
                + '<div class="col-sm-12" style="margin-top: 10px">'
                + '<div class="input-group">'
                + '<span class="input-group-addon">' + i18n.t('CashShop.price') + '</span>'
                + '<input type="text" class="form-control" value="{0} {1}" disabled>'.format(data.price, data.currency)
                + '</div>'
                + '</div>'
                + '<div class="col-sm-12" style="margin-top: 10px">'
                + '<div class="input-group">'
                + '<span class="input-group-addon">' + i18n.t('CashShop.aging') + '</span>'
                + '<input type="text" class="form-control" value="{0}" disabled>'.format(expiration)
                + '</div>'
                + '</div>'
                + '<div class="col-sm-12" style="margin-top: 10px">'
                + '<div class="input-group">'
                + '<span class="input-group-addon">' + i18n.t('CashShop.receiver_name') + '</span>'
                + '<input id="accept" type="text" class="form-control" placeholder="' + i18n.t('CashShop.receiver_info') + '">'
                + '</div>'
                + '</div>'
                + '<div class="col-sm-12" style="margin-top: 10px">'
                + '<div class="input-group">'
                + '<span class="input-group-addon">' + i18n.t('Common.birthday') +'</span>'
                + '<input id="birthday" type="date" class="form-control" placeholder="' + i18n.t('CashShop.birthday_info') + '">'
                + '</div>'
                + '</div>'
                + '</div>'
            ,
            btn: [i18n.t('Common.gift'), i18n.t('Common.cancel')],
            btn1: function (index, layero) {
                let accept = layero.find("#accept").val();
                let birthday = layero.find("#birthday").val();
                if (!(accept && birthday)) {
                    layer.msg(i18n.t('CashShop.gift_post_failure'), {icon: 7, time: 6000});
                    return;
                }
                console.log(accept, birthday);
                layer.confirm(i18n.t('CashShop.gift_confirm_title').format(accept),
                    {icon: 3, title: i18n.t('CashShop.transport'), skin: 'my-skin', btn: [i18n.t('Common.confirm'), i18n.t('Common.cancel')]},
                    function (index) {
                        beItemGift(data.id, accept, birthday).then(resp => {
                            layer.closeAll();
                            layer.msg(resp.message.replace("\n", "<br>"), {
                                title: i18n.t('CashShop.gift_success'),
                                icon: 6,
                                time: 5000
                            }, function () {
                            })
                        }).catch(error => {
                            const msg = extractMessage(error, i18n.t('CashShop.gift_failure'));
                            layer.msg(msg, {title: i18n.t('CashShop.gift_failure'), icon: 2, time: 6000});
                        })
                    });
            },
            btn2: function (index) {
                layer.close(index);
            }
        });
    };

    changeKeyWord(e) {
        this.setState({keyword: e.target.value})
    }

    onKeyDownChange(e) {
        if (e.keyCode === 13) {
            this.getShopList(1, this.state.limit, this.state.category, e.target.value)
        }
    }


    render() {
        return (
            <div>
                <h2 className="text-center">{i18n.t('CashShop.title')}<span><font size="3">(<a href={true}
                                                                         onClick={this.helper}>{i18n.t('CashShop.help')}</a>)</font></span>
                </h2>
                <hr/>
                <div className="row">
                    <div className="col-md-8" style={{paddingRight: '0px'}}>
                        <div className="well well2 item-type">
                            <button className="btn-sm btn-default btn-type" data="" onClick={this.selectType}
                                    style={{backgroundColor: 'green'}}>{i18n.t('CashShop.category_all')}
                            </button>
                            {this.state.types.map(tp => <button key={tp.id} onClick={this.selectType}
                                                                className="btn-sm btn-default btn-type"
                                                                data={tp.id}>{tp.name}</button>)}
                        </div>
                    </div>
                    <div className="col-md-4" style={{paddingLeft: '0px'}}>
                        <div style={{float: 'right'}}>
                            <div className="well well2" style={{marginBottom: '0px', padding: '16px 19px 15px 19px'}}>
                                <div className="input-group">
                                    <input type="text" name="search" id="keyword" className="form-control"
                                           placeholder={i18n.t('CashShop.search_info')} required="" value={this.props.keyword}
                                           onChange={this.changeKeyWord} onKeyDown={this.onKeyDownChange}/>
                                    <span className="input-group-btn">
                                        <button className="btn btn-primary" type="submit"
                                                onClick={e => this.getShopList(1, this.state.limit, this.state.category, this.state.keyword)}
                                                id="shop-search">
                                            <i className="icon-search"/> {i18n.t('Common.search')}</button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {(this.state.poster.href !== undefined && this.state.poster.href !== '') ? (
                    <div style={{textAlign: 'center'}}>
                        <a alt={this.state.poster.title} title={this.state.poster.title} href={this.state.poster.redirect || '#'} onClick={this.poster}><img alt='2022新春快乐' style={{
                            // width: '100%',
                            maxWidth: '100%',
                            margin: '0 auto'
                        }} src={this.state.poster.href}/></a>
                    </div>) : ""
                }
                <hr/>
                <div className="shop-node">
                    <ShopItemRow data={this.state.data} buyBtn={this.buttonBuy} giftBtn={this.buttonGift}/>
                </div>
                <ul className="pager">
                    {i18n.t('CashShop.cs_count_1')}<b id="cashShopCount">{this.state.total}</b>{i18n.t('CashShop.cs_count_2')}
                    <li className="next"><a href={true} onClick={this.nextPage}>Next<i
                        className="icon-arrow-right"/></a></li>
                    <li className="next"><a href={true} onClick={this.prevPage}>Prev<i
                        className="icon-arrow-right"/></a></li>
                </ul>
            </div>
        );
    }
}