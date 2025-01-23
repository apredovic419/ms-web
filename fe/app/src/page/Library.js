import React from "react";

import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {extractMessage} from "../utils";
import {beItemSearch, beLibrarySource} from "../api/game";

/* global layer */
const ItemCategories = {
    "Hair": i18n.t('Library.Hair', 'Hair'),
    "Face": i18n.t('Library.Face', 'Face'),
    "Cap": i18n.t('Library.Cap', 'Cap'),
    "Cape": i18n.t('Library.Cape', 'Cape'),
    "Coat": i18n.t('Library.Coat', 'Coat'),
    "Glove": i18n.t('Library.Glove', 'Glove'),
    "Longcoat": i18n.t('Library.Longcoat', 'Longcoat'),
    "Pants": i18n.t('Library.Pants', 'Pants'), 
    "PetEquip": i18n.t('Library.PetEquip', 'PetEquip'),
    "Ring": i18n.t('Library.Ring', 'Ring'),
    "Shield": i18n.t('Library.Shield', 'Shield'),
    "Shoes": i18n.t('Library.Shoes', 'Shoes'),
    "Cash": i18n.t('Library.Cash', 'Cash'),
    "Consume": i18n.t('Library.Consume', 'Consume'),
    "Etc": i18n.t('Library.Etc', 'Etc'),
    "Ins": i18n.t('Library.Ins', 'Ins'),
    "Pet": i18n.t('Library.Pet', 'Pet'),
    "TamingMob": i18n.t('Library.TamingMob', 'TamingMob'),
}
const WeaponTypes = {
    "gun": i18n.t('Library.weaponGun'),
    "knuckle": i18n.t('Library.weaponKnuckle'),
    "poleArm": i18n.t('Library.weaponArm'),
    "spear": i18n.t('Library.weaponSpear'),
    "cBow": i18n.t('Library.weaponCBow'),
    "bow": i18n.t('Library.weaponBow'),
    "tGlove": i18n.t('Library.weaponGlove')
};
const WeaponMapping = {
    '141': i18n.t('Library.weapon2Haxe'),
    '131': i18n.t('Library.weapon1Haxe'),
    '142': i18n.t('Library.weapon2HBlunt'),
    '132': i18n.t('Library.weapon1HBlunt'),
    '137': i18n.t('Library.weaponWand'),
    '138': i18n.t('Library.weaponStaff'),
    '130': i18n.t('Library.weapon1HSword'),
    '140': i18n.t('Library.weapon2HSword'),
    '133': i18n.t('Library.weaponDagger')
};
const AccessoryMapping = {
    'Be': i18n.t('Library.accessoryBelt', 'Be'),
    'Me': i18n.t('Library.accessoryMedal', 'Me'),
    'Ae': i18n.t('Library.accessoryEardrop', 'Ae'),
    'Ay': i18n.t('Library.accessoryAy', 'Ay'), 
    'Af': i18n.t('Library.accessoryFace', 'Af'),
    'Pe': i18n.t('Library.accessoryPe', 'Pe')
};
const SpeedMapping = {
    2: i18n.t('Library.attackSpeed2'),
    3: i18n.t('Library.attackSpeed3'),
    4: i18n.t('Library.attackSpeed4'),
    5: i18n.t('Library.attackSpeed5'),
    6: i18n.t('Library.attackSpeed6'),
    7: i18n.t('Library.attackSpeed7'),
    8: i18n.t('Library.attackSpeed8'),
    9: i18n.t('Library.attackSpeed9'),
    15: i18n.t('Library.attackSpeed15'),
};
const AttrNameList = [
    i18n.t('Library.incSTR'), 
    i18n.t('Library.incDEX'), 
    i18n.t('Library.incINT'),
    i18n.t('Library.incLUK'),
    i18n.t('Library.incMHP'),
    i18n.t('Library.incMMP'),
    i18n.t('Library.incPAD'),
    i18n.t('Library.incMAD'),
    i18n.t('Library.incPDD'),
    i18n.t('Library.incMDD'),
    i18n.t('Library.incACC'),
    i18n.t('Library.incEVA'),
    i18n.t('Library.incSpeed'),
    i18n.t('Library.incJump'),
    i18n.t('Library.tuc'),
];



class QueryInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {keyword: props.keyword}
        this.onKeyDownChange = this.onKeyDownChange.bind(this)
    }

    onKeyDownChange(e) {
        if (e.keyCode === 13) {
            this.props.onClick()
        }
    }

    render() {
        return (
            <div className="input-group "
                 style={{'textAlign': 'center', margin: '0 auto', 'maxWidth': '500px', width: '100%'}}>
                <input id="input-key" type="text" className="form-control" placeholder={i18n.t('Library.please_entire_item')}
                       value={this.props.keyword} style={{'height': '50px'}} onKeyDown={e => this.onKeyDownChange(e)}
                       onChange={(e) => {
                           this.props.onKeywordChange(e.target.value)
                       }}/>
                <span className="input-group-btn">
                <button className="btn btn-info btn-search" style={{'height': '50px'}}
                        onClick={this.props.onClick}>{i18n.t('Library.search')}</button>
              </span>
            </div>
        )
    }
}

class Category extends React.Component {
    constructor(props) {
        super(props);
        let category = [
            {key: '发型', value: 'Hair'}, {key: '脸型', value: 'Face'},
            {key: '帽子', value: 'Cap'}, {key: '武器', value: 'Weapon'},
            {key: '鞋', value: 'Shoes'}, {key: '长袍', value: 'Longcoat'},
            {key: '上衣', value: 'Coat'}, {key: '披风', value: 'Cape'},
            {key: '手套', value: 'Glove'}, {key: '裤子', value: 'Pants'},
            {key: '配饰', value: 'Accessory'}, {key: '戒指', value: 'Ring'},
            {key: '盾牌', value: 'Shield'}, {key: '宠物', value: 'Pet'},
            {key: '宠装', value: 'PetEquip'}, {key: '消耗', value: 'Consume'},
            {key: '其他', value: 'Etc'}, {key: '设置', value: 'Ins'},
            {key: '现金', value: 'Cash'}, {key: 'NPC', value: 'Npc'},
            {key: '怪物', value: 'Mob'}, {key: '地图', value: 'Map'},
        ]
        if (i18n.language.indexOf("zh") === -1) {
            for (let i = 0; i < category.length; i++) {
                category[i]['key'] = category[i]['value']
            }
        }
        this.state = {
            category: category
        };
        this.selectAll = this.selectAll.bind(this);
        this.selectCategory = this.selectCategory.bind(this);
    }

    selectAll(ele) {
        // 全选/反选
        let parent = ele.parentNode.parentNode;
        for (let e of parent.children) {
            if (e.children[0] !== ele)
                e.children[0].checked = ele.checked;
        }
    }

    selectCategory(ele) {
        if (!ele) return;
        let parent = ele.parentNode && ele.parentNode.parentNode;
        if (!parent) return;
        let all = parent.children[0] && parent.children[0].children[0];
        if (all && !ele.checked && all.checked) {
            all.checked = false;
        }
    }

    render() {
        const listItems = this.state.category.map((obj) =>
            <label className="checkbox-inline" key={obj.key} onClick={e => this.selectCategory(e.target)}><input type="checkbox" value={obj.value} />{obj.key}
            </label>
        );
        return (
            <div id="types" style={{ 'textAlign': 'center', margin: '0 auto', 'maxWidth': '600px', width: '100%' }}>
                <label className="checkbox-inline"><input type="checkbox" value='all'
                    onClick={e => this.selectAll(e.target)} />{i18n.t('Common.all')}</label>
                {listItems}
            </div>
        )
    }
}

class QueryItem extends React.Component {
    constructor(props) {
        super(props);
        this.showAttribute = this.showAttribute.bind(this);
        this.showAttributeItem = this.showAttributeItem.bind(this);
        this.showAttributeMob = this.showAttributeMob.bind(this);
        this.showAttributeMap = this.showAttributeMap.bind(this);
        this.showSource = this.showSource.bind(this);
        this.showItemSource = this.showItemSource.bind(this);
        this.showMobSource = this.showMobSource.bind(this);
    }

    showAttribute(e) {
        let attr = JSON.parse(e.target.parentNode.parentNode.parentNode.getAttribute('data-item'));
        switch (attr.category) {
            case 'Npc':
                layer.msg("暂不支持" + attr.category + "类别查询", {icon: 4, time: 6000});
                break
            case 'Mob':
                return this.showAttributeMob(e)
            case "Map":
                return this.showAttributeMap(e)
            default:
                return this.showAttributeItem(e)
        }
    }

    showAttributeMob(e) {
        const parseAttribute = (element, attribute) => {
            return JSON.parse(element.closest('[data-item]').getAttribute('data-item'));
        };
    
        const attr = parseAttribute(e.target, 'data-item');
        const info = [];
        const isNotChinese = !i18n.language.includes("zh");
    
        const labels = {
            level: isNotChinese ? "Level" : "怪物等级",
            hp: isNotChinese ? "HP" : "怪物血量",
            watk: isNotChinese ? "Physical Attack" : "物理攻击",
            wdef: isNotChinese ? "Physical Defense" : "物理防御",
            matk: isNotChinese ? "Magic Attack" : "魔法攻击",
            mdef: isNotChinese ? "Magic Defense" : "魔法防御",
            exp: isNotChinese ? "EXP" : "经验值",
            category: isNotChinese ? "Category : Mob" : "分类 : 怪物"
        };
    
        const requirements = ['level', 'hp', 'watk', 'wdef', 'matk', 'mdef', 'exp'];
        requirements.forEach((req, index) => {
            const value = attr.info[req] !== undefined ? attr.info[req] : 0;
            info.push(`${labels[req]} : ${value}&nbsp;&nbsp;`);
            if (index % 2 === 1) info.push('<br>');
        });
    
        const createElement = (content) => `
            <div role="dialog" tabindex="-1">
                <div id="wz_bg_frame_cover"></div>
                <div id="wz_bg_top"></div>
                <div id="wz_bg_middle_1">
                    <div id="wz_item_name">${attr.name}</div>
                </div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_2">
                    <div id="wz_mob_icon">
                        <div id="wz_mob_img" style="background-image:url(${attr.icon});background-size: contain;"></div>
                    </div>
                    <div id="wz_damage_increase"></div>
                </div>
                <div id="wz_bg_middle_3"><div id="wz_job_bg2">&nbsp;</div></div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_4">
                    <div id="equip_str">${labels.category}<br>${info.join('')}</div>
                </div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_6"></div>
                <div id="wz_bg_bottom"></div>
            </div>
        `;
    
        layer.open({
            type: 1,
            title: false,
            closeBtn: 1,
            area: ['281px', "auto"],
            skin: 'layui-bg-gray',
            shadeClose: true,
            content: createElement()
        });
    }

    showAttributeMap(e) {
        const attr = JSON.parse(e.target.closest('[data-item]').getAttribute('data-item'));    
        const { street = '', name, icon, info = {} } = attr;
        const title = street ? `${street} - ${name}` : name;
    
        const generateText = (list, indentation) => {
            return list.sort().map((item, index) => {
                let text = `${item.oid}<span style="color:orange"> ${item.name}</span>`;
                if (indentation === false || index % 2 === 1) {
                    text += '<br>';
                } else {
                    const currentWidth = item.oid.length * 5 + item.name.length * 12 + 1;
                    const remainingWidth = 281 - currentWidth;
                    const spaceCount = remainingWidth > 0 ? Math.floor(remainingWidth / 8) : 0;
                    text += '&nbsp;'.repeat(spaceCount);
                }
                return text;
            }).join('');
        };
    
        const portalText = generateText(info.portal || [], false);
        const npcText = generateText(info.npc || [], true);
        const mobText = generateText(info.mob || [], true);
    
        const createSection = (text, label) => {
            if (!text) return '';
            return `
                <div style="display: flex; align-items: center; margin: 3px 0;">
                    <span style="flex: 1; height: 1px; background-color: #000;"></span>
                    <span style="margin: 0 5px;color: lightseagreen;font-size: 9pt;font-weight: bold">${label}</span>
                    <span style="flex: 1; height: 1px; background-color: #000;"></span>
                </div>
                <div id="map_part">${text}</div>
            `;
        };
    
        const ele = `
            <div role="dialog" tabindex="-1">
                <div id="wz_bg_frame_cover"></div>
                <div id="wz_bg_top"></div>
                <div id="wz_bg_middle_1">
                    <div id="wz_item_name">${title}</div>
                </div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_2">
                    <div id="map_icon">
                        <div id="wz_mob_img" style="background-image:url(${icon});background-size: contain;"></div>
                    </div>
                    <div id="map_info">
                        ${createSection(portalText, '传送门')}
                        ${createSection(npcText, 'NPC')}  
                        ${createSection(mobText, 'Monster')}
                    </div>
                    <div id="wz_bg_bottom"></div>
                </div>
            </div>
        `;
        
        layer.open({
            type: 1,
            title: false,
            closeBtn: 1,
            area: ['281px', "auto"],
            skin: 'layui-bg-gray',
            shadeClose: true,
            content: ele
        });
    }

    showAttributeItem(e) {
        const attr = JSON.parse(e.target.closest('[data-item]').getAttribute('data-item'));
        const reqJobHTML = this.generateReqJobHTML(attr);
        const reqAttributeHTML = this.generateReqAttributeHTML(attr);
        const incAttributeHTML = this.generateIncAttributeHTML(attr);
        const content = `
            <div role="dialog" tabindex="-1">
                <div id="wz_bg_frame_cover"></div>
                <div id="wz_bg_top"></div>
                <div id="wz_bg_middle_1">
                    <div id="wz_item_name">${attr.name}</div>
                </div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_2">
                    <div id="wz_item_icon">
                        <div id="wz_item_img" style="background-image:url(${attr.icon})"></div>
                        <div id="wz_item_icon_cover"></div>
                        <div id="wz_item_icon_frame"></div>
                    </div>
                    <div id="wz_damage_increase">
                        ${reqAttributeHTML}
                    </div>
                </div>
                <div id="wz_bg_middle_3">${reqJobHTML}</div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_4">
                    ${incAttributeHTML}
                </div>
                <div class="dot_line"></div>
                <div id="wz_bg_middle_6"></div>
                <div id="wz_bg_bottom"></div>
            </div></div>`
        
        layer.open({
            type: 1,
            title: false,
            closeBtn: 1,
            area: ['281px', "auto"],
            skin: 'layui-bg-gray',
            shadeClose: true,
            content: content
        });
    }
    
    generateReqJobHTML(attr) {
        if (!attr.info || attr.info.reqJob === undefined) return '<div id="wz_job_bg2">&nbsp;</div>';
        const jobId = [-1, 1, 2, 4, 8, 16];
        const jobName = [
            i18n.t('Library.beginner'), 
            i18n.t('Library.warrior'), 
            i18n.t('Library.magician'), 
            i18n.t('Library.bowman'), 
            i18n.t('Library.thief'), 
            i18n.t('Library.pirate')
        ];
        let reqJob = '<div id="wz_job_bg2">&nbsp;';
        jobName.forEach((name, index) => {
            const color = (attr.info.reqJob === 0 || attr.info.reqJob === jobId[index]) ? 'white' : 'orangered';
            reqJob += `<span style="color:${color}">${name}</span>&nbsp;&nbsp;`;
        });
        reqJob += "</div>";
        return reqJob;
    }
    
    generateReqAttributeHTML(attr) {
        let reqAttribute = '<div id="wz_item_req2">';
        const display = ['Etc', 'Ins', 'Consume', 'Pet', 'Cash'];
        if (display.includes(attr.category)) {
            reqAttribute += attr.desc.replace(/(\\r)?\\n/g, '<br>');
        } else if (attr.info) {
            reqAttribute += this.generateRequirements(attr);
        }
        reqAttribute += '</div>';
        return reqAttribute;
    }
    
    generateRequirements(attr) {
        const reqs = ['reqLevel', 'reqSTR', 'reqDEX', 'reqINT', 'reqLUK', 'reqPOP'];
        const reqName = [
            i18n.t('Library.reqLevel'), 
            i18n.t('Library.reqSTR'), 
            i18n.t('Library.reqDEX'), 
            i18n.t('Library.reqINT'), 
            i18n.t('Library.reqLUK'), 
            i18n.t('Library.reqPOP')
        ];
        let requirements = '';
        reqs.forEach((req, index) => {
            const value = attr.info[req] !== undefined ? attr.info[req] : 0;
            requirements += `${reqName[index]} : ${value}&nbsp;&nbsp;`;
            if (index === 0 || index % 2 === 0) requirements += '<br>';
        });
        if (attr.info.maxLevel !== undefined && attr.info.maxLevel !== 7) {
            requirements += `<br>${i18n.t('Library.maxLevel')} : ${attr.info.maxLevel}&nbsp;&nbsp;<br>`;
        }
        return requirements;
    }

    generateIncAttributeHTML(attr) {
        let incAttribute = `<div id="equip_str">${i18n.t('Library.itemCategory')} : ${this.getCategory(attr)}`;
        const attackSpeed = this.getAttackSpeed(attr.info?.attackSpeed);
        if (attr.info?.attackSpeed) {
            incAttribute += `<br>${i18n.t('Library.attackSpeed')} : ${attackSpeed}&nbsp;&nbsp;`;
        }
        if (attr.info) {
            incAttribute += '<br>' + this.getIncAttributes(attr) ;
        }
        return incAttribute + '</div>';
    }

    getCategory(attr) {
        const cate = attr.category;
        if (cate === 'Weapon') {
            return this.getWeaponType(attr);
        } else if (cate === 'Accessory') {
            return this.getAccessoryType(attr);
        }
        return ItemCategories[cate] || 'unknown';
    }

    getWeaponType(attr) {
        if (WeaponTypes[attr.info.sfx]) {
            return WeaponTypes[attr.info.sfx];
        }
        const prefix = attr.oid.substring(0, 3);
        return WeaponMapping[prefix] || 'Weapon';
    }

    getAccessoryType(attr) {
        return AccessoryMapping[attr.info.islot] || '';
    }

    getAttackSpeed(speed) {
        return SpeedMapping[speed] || 'unknow';
    }

    getIncAttributes(attr) {
        const incs = ['incSTR', 'incDEX', 'incINT', 'incLUK', 'incMHP', 'incMMP', 'incPAD', 'incMAD', 'incPDD', 'incMDD', 'incACC', 'incEVA', 'incSpeed', 'incJump', 'tuc'];
        let attributes = '';
        incs.forEach((inc, index) => {
            const value = attr.info[inc];
            if (value !== undefined && value !== 0) {
                attributes += index === incs.length - 1 ? 
                    `${AttrNameList[index]} : ${value}` : 
                    `${AttrNameList[index]} : +${value}&nbsp;&nbsp;<br>`;
            }
        });
        return attributes;
    }

    showSource(e) {
        let attr = JSON.parse(e.target.parentNode.parentNode.parentNode.getAttribute('data-item'));
        switch (attr.category) {
            case 'Npc':
                return this.showNpcSource(e)
            case 'Map':
                layer.msg("暂不支持" + attr.category + "类别查询", {icon: 4, time: 6000});
                break
            case 'Mob':
                return this.showMobSource(e)
            default:
                return this.showItemSource(e)
        }
    }

    showItemSource(e) {
        // 查询物品来源
        const loadIdx = layer.load(1);
        let attr = JSON.parse(e.target.parentNode.parentNode.parentNode.getAttribute('data-item'));
        beLibrarySource(attr.oid, '').then(resp => {
            layer.close(loadIdx);
            let dropInfo = '', npcShop = '', checkin = '', h5Shop = '', charShop = '', cashShop = '', quest = '';
            if (resp.data.drop !== undefined) {
                for (let d of resp.data.drop) {
                    dropInfo += `${d.dropperid} <span style="color:orange">${d.name}</span> ${i18n.t('Library.baseDropRate')}:${(d.chance / 10000).toFixed(2)}%<br>`;
                }
            }
            if (resp.data.npc_shop !== undefined) {
                for (let n of resp.data.npc_shop) {
                    let moneyType = i18n.t('Library.mesoText');
                    let price = n.price;
                    if (n.pitch > 0) {
                        moneyType = i18n.t('Library.pitchText');
                        price = n.pitch;
                    }
                    npcShop += `${n.oid} <span style="color:orange">${n.name}</span> (<span style="color: #18bc9c">${price}</span> ${moneyType})<br>`;
                }
            }
            if (resp.data.checkin !== undefined) {
                checkin = `${i18n.t('Library.gainRate')}: <span style="color:orange">${resp.data.checkin}%</span><br>`;
            }
            if (resp.data.h5_shop !== undefined) {
                for (let n of resp.data.h5_shop) {
                    h5Shop += `${i18n.t('Library.goodPrice')}: <span style="color:orange">${n.price}</span> ${i18n.t('Library.nxText')}<br>`;
                }
            }
            if (resp.data.hire_shop !== undefined) {
                for (let n of resp.data.hire_shop) {
                    charShop += `<span style="color:orange">${n.owner}</span>的商店 (<span style="color:#18bc9c">${n.price}</span> ${i18n.t('Library.mesoText')})<br>`;
                }
            }
            if (resp.data.cash_shop !== undefined) {
                for (let n of resp.data.cash_shop) {
                    cashShop += `${i18n.t('Library.goodPrice')}${n.count > 1 ? '(' + n.count + ')' : ''}: <span style="color:orange">${n.price}</span> ${i18n.t('Library.nxText')}<br>`;
                }
            }
            if (resp.data.quest !== undefined) {
                for (let n of resp.data.quest) {
                    quest += `${n.oid} <span style="color:orange">${n.name}</span><br>`;
                }
            }
            let doc = '<div style="background: #444; border-radius: 5px; color: white; min-height: 400px;width: auto;min-width: 320px;max-width: 100%"><div class="jconfirm-title-c"></div><div class="jconfirm-content-pane" style="transition-duration: 0.3s; transition-timing-function: cubic-bezier(0.36, 0.55, 0.19, 1);"><div><div style="width: auto;min-width: 320px; max-width: 100%">\n' +
                '        <div class="name_detail_d">\n' +
                '            <label id="name_npc" style="width: 100%;text-align: center;font-weight: 700">' + attr.name + '</label>\n' +
                '        </div>\n' +
                '        <div style="width: auto;overflow:hidden;min-width: 320px;max-width: 100%">\n' +
                '            <div style="background: #9d9d9d ;margin-left: 5px;height: auto ;width: auto;float: left">\n' +
                `<img id="icon_npc" style="width: auto;max-height:180px;min-width: 100px; max-width: 140px;margin: 10px;" src="${attr.icon}">` +
                '            </div>\n' +
                '            <div style="float:left;margin-left: 6px;margin-right: 6px;font-size: 12px;">\n' +
                (dropInfo === '' ? '' : `=======${i18n.t('Library.wildDrop')}<br>` + dropInfo) +
                (quest === '' ? '' : `=======${i18n.t('Library.relateQuest')}<br>` + quest) +
                (npcShop === '' ? '' : `=======${i18n.t('Library.npcShop')}<br>` + npcShop) +
                (h5Shop === '' ? '' : `=======${i18n.t('Library.h5Shop')}<br>` + h5Shop) +
                (cashShop === '' ? '' : `=======${i18n.t('Library.gameShop')}<br>` + cashShop) +
                (checkin === '' ? '' : `=======${i18n.t('Library.dayCheckin')}<br>` + checkin) +
                (charShop === '' ? '' : `=======${i18n.t('Library.hireMerchant')}<br>` + charShop) +
                '<br></label>\n' +
                '            </div>\n' +
                '        </div>\n' +
                '    </div></div></div></div>'
            layer.open({
                type: 1,
                title: false,
                closeBtn: 1,
                area: ['auto', '400px'],
                fixed: true,
                skin: 'layui-bg-gray',
                shadeClose: true,
                content: doc,
            });
        }).catch(error => {
            layer.close(loadIdx);
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.msg(message, {icon: 2, time: 6000});
        })

    }

    showMobSource(e) {
        // 查询怪物掉落
        let attr = JSON.parse(e.target.parentNode.parentNode.parentNode.getAttribute('data-item'));
        beLibrarySource(attr.oid, 'Mob').then(resp => {
            let drop_info = '';
            let spawn_info = '';
            for (let d of resp.data.drop) {
                drop_info += `${d.itemid} <span style="color:orange">${d.name}</span> ${i18n.t('Library.baseDropRate')}:${(d.chance / 10000).toFixed(2)}%<br>`;
            }
            for (let sp of resp.data.respawn) {
                spawn_info += `---- <span style="color:orange">频道 ${sp.channel}</span> ${i18n.t('Library.respawnPeriod')} <span style="color:orange">${sp.status}</span><br>`;
            }
            let doc = `
                <div style="background: #444; border-radius: 5px; color: white; min-height: 400px; width: auto; min-width: 320px; max-width: 100%">
                    <div class="jconfirm-title-c"></div>
                    <div class="jconfirm-content-pane" style="transition-duration: 0.3s; transition-timing-function: cubic-bezier(0.36, 0.55, 0.19, 1);">
                        <div>
                            <div style="width: auto; min-width: 320px; max-width: 100%">
                                <div class="name_detail_d">
                                    <label id="name_npc" style="width: 100%; text-align: center; font-weight: 700">${attr.name}</label>
                                </div>
                                <div style="width: auto; overflow: hidden; min-width: 320px; max-width: 100%">
                                    <div style="background: #9d9d9d; margin-left: 5px; height: auto; width: auto; float: left">
                                        <img id="icon_npc" style="width: auto; max-height: 180px; min-width: 100px; max-width: 140px; margin: 10px;" src="${attr.icon}">
                                    </div>
                                    <div style="float: left; margin-left: 6px; margin-right: 6px; font-size: 12px;">
                                        ${spawn_info === '' ? '' : `=======${i18n.t('Library.respawnTime')}<br>${spawn_info}`}
                                        <br>=======${i18n.t('Library.dropItemList')}<br>${drop_info === '' ? '无<br>' : drop_info}
                                        <br>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            layer.closeAll()
            layer.open({
                type: 1,
                title: false,
                closeBtn: 1,
                area: ['auto', '400px'],
                fixed: true,
                skin: 'layui-bg-gray',
                shadeClose: true,
                content: doc,
            });
        }).catch(error => {
            let msg = i18n.t('Common.server_error');
            if (error.response && error.response.data && error.response.data.msg !== undefined)
                msg = error.response.data.msg;
            layer.msg(msg, {icon: 2, time: 6000});
        })
    }

    showNpcSource(e) {
        // 查询Npc掉落
        const loadIdx = layer.load(1);
        let attr = JSON.parse(e.target.parentNode.parentNode.parentNode.getAttribute('data-item'));
        beLibrarySource(attr.oid, 'Npc').then(resp => {
            let mapInfo = '';
            for (let m of resp.data.map) {
                mapInfo += `${m.oid} <span style="color:orange">${m.name}</span><br>`;
            }
            let questInfo = '';
            for (let q of resp.data.quest) {
                questInfo += `${q.oid} <span style="color:orange">${q.name}</span><br>`;
            }
            let doc = `
                <div style="background: #444; border-radius: 5px; color: white; min-height: 400px; width: auto; min-width: 320px; max-width: 100%">
                    <div class="jconfirm-title-c"></div>
                    <div class="jconfirm-content-pane" style="transition-duration: 0.3s; transition-timing-function: cubic-bezier(0.36, 0.55, 0.19, 1);">
                        <div>
                            <div style="width: auto; min-width: 320px; max-width: 100%">
                                <div class="name_detail_d">
                                    <label id="name_npc" style="width: 100%; text-align: center; font-weight: 700">${attr.name}</label>
                                </div>
                                <div style="width: auto; overflow: hidden; min-width: 320px; max-width: 100%">
                                    <div style="background: #9d9d9d; margin-left: 5px; height: auto; width: auto; float: left">
                                        <img id="icon_npc" style="width: auto; max-height: 180px; min-width: 100px; max-width: 140px; margin: 10px;" src="${attr.icon}">
                                    </div>
                                    <div style="float: left; margin-left: 6px; margin-right: 6px; font-size: 12px;">
                                        <br>=======${i18n.t('Library.respawnMap')}<br>${mapInfo === '' ? '无<br>' : mapInfo}
                                        <br>=======${i18n.t('Library.relateQuest')}<br>${questInfo === '' ? '无<br>' : questInfo}
                                        <br>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            layer.closeAll()
            layer.open({
                type: 1,
                title: false,
                closeBtn: 1,
                area: ['auto', '400px'],
                fixed: true,
                skin: 'layui-bg-gray',
                shadeClose: true,
                content: doc,
            });
        }).catch(error => {
            layer.close(loadIdx);
            let msg = i18n.t('Common.server_error');
            if (error.response && error.response.data && error.response.data.msg !== undefined)
                msg = error.response.data.msg;
            layer.msg(msg, {icon: 2, time: 6000});
        })
    }


    render() {
        return (
            <tbody>
            <tr data-index={this.props.oid} data-item={JSON.stringify(this.props.data)}>
                <td style={{'textAlign': 'center', width: '150px'}}>
                    <img src={this.props.icon} alt={this.props.name} title={this.props.name} className="img-rounded" style={{maxWidth:300}} />
                </td>
                <td style={{'textAlign': 'center', width: '100px'}}>{this.props.oid}</td>
                <td style={{'textAlign': 'center', width: '120px'}}>{this.props.name}</td>
                <td style={{'textAlign': 'center'}}>{this.props.desc}</td>
                <td style={{'textAlign': 'center', width: '100px'}}>
                    <a href><i className="fa fa-eye" title={i18n.t('Library.attribute')} onClick={this.showAttribute}></i></a>&emsp;
                    <a href><i className="fa fa-search" title={i18n.t('Library.source')} onClick={this.showSource}></i></a>
                </td>
            </tr>
            </tbody>
        );
    }
}

class QueryTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {items: props.items};
    }

    render() {
        let head = (
            <thead>
            <tr>
                <th style={{'textAlign': 'center', width: '150px'}} data-field="icon" tabIndex="0">
                    <div className="th-inner ">{i18n.t('Library.thead1')}</div>
                    <div className="fht-cell"></div>
                </th>
                <th style={{'textAlign': 'center', width: '100px'}} data-field="id" tabIndex="0">
                    <div className="th-inner ">{i18n.t('Library.thead2')}</div>
                    <div className="fht-cell"></div>
                </th>
                <th style={{'textAlign': 'center', width: '120px'}} data-field="name" tabIndex="0">
                    <div className="th-inner ">{i18n.t('Library.thead3')}</div>
                    <div className="fht-cell"></div>
                </th>
                <th style={{'textAlign': 'center'}} data-field="desc" tabIndex="0">
                    <div className="th-inner ">{i18n.t('Library.thead4')}</div>
                    <div className="fht-cell"></div>
                </th>
                <th style={{'textAlign': 'center'}} data-field="action" tabIndex="0">
                    <div className="th-inner ">{i18n.t('Library.thead5')}</div>
                    <div className="fht-cell"></div>
                </th>
            </tr>
            </thead>
        )

        let items = this.props.items.map(
            (e, index) => <QueryItem data={e} index={index} key={e.oid} name={e.name} desc={e.desc} oid={e.oid}
                                     icon={e.icon} category={e.category}/>
        )
        return (
            <table id="table" className="table table-hover">
                {head}
                {items}
            </table>
        );
    }
}

class PaginationButton extends React.Component {
    render() {
        return (
            <li className={this.props.active ? "page-number active" : "page-number"}>
                <a href page={this.props.page} onClick={this.props.changePage}>{this.props.page}</a>
            </li>
        );
    }
}

class Pagination extends React.Component {
    constructor(props) {
        super(props);
        this.state = {page: props.page, maxPage: props.maxPage, total: props.total}
    }

    render() {
        let displayPage = 7;
        let pageArr = [];
        for (let index = this.props.page - (displayPage - 1) / 2; index <= Math.min(this.props.page + displayPage - 1, this.props.maxPage); index++) {
            if (index <= 0)
                continue;
            if (pageArr.length === displayPage)
                break;
            pageArr.push(<PaginationButton key={index} page={index} active={index === this.props.page}
                                           changePage={this.props.changePage}/>)
        }

        return (
            <div className="pager" style={{marginTop: '30px'}}>
                <hr/>
                <p style={{textAlign: 'center'}}>{i18n.t("Library.total")} <b>{this.props.maxPage}</b> {i18n.t("Library.page")}&emsp;<b>{this.props.total}</b> {i18n.t('Library.record')}
                </p>
                <div className="pull-right pagination">
                    <ul className="pagination">
                        {pageArr}
                    </ul>
                </div>
            </div>

        );
    }
}

export class Library extends React.Component {
    constructor(props) {
        super(props);
        this.state = {keyword: '', items: [], page: 1, maxPage: 1, total: 0};
        this.handleQuery = this.handleQuery.bind(this);
        this.handleKeywordChange = this.handleKeywordChange.bind(this);
    }

    componentDidMount() {
        document.title = "MagicMS - " + i18n.t('Library.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(7)').setAttribute("style", "background-color: green");
        convertBase();
        pageInit();
    }

    handleQuery(e) {
        let page = e !== undefined && e.target.getAttribute('page') ? e.target.getAttribute('page') : 1;
        let types = document.getElementById('types').querySelectorAll('input')
        let category = [];
        for (let ele of types) {
            if (ele.checked) category.push(ele.value)
        }
        if (category.length < 1) {
            layer.closeAll();
            layer.msg(i18n.t('Library.select_one_category'), {icon: 7, time: 5000});
            return;
        }
        if (this.state.keyword === '') {
            layer.closeAll();
            layer.msg(i18n.t('Library.please_entire_item'), {icon: 7, time: 5000});
            return;
        }
        const btn = document.querySelector('.btn-search');
        btn.disabled = true;
        const loadIdx = layer.load(1);
        const limit = 15;
        beItemSearch(this.state.keyword, category.join(','), page ? page : this.state.page, limit).then(res => {
            btn.disabled = false;
            layer.close(loadIdx)
            let data = res.data.items
            if (data.length === 0) {
                layer.closeAll()
                layer.msg(i18n.t('Library.no_math_data'), {icon: 7, time: 3000});
            } else {
                for (let obj of data) {
                    if (['Npc', 'Mob'].indexOf(obj.category) !== -1)
                        obj.icon = obj.icon != null && obj.icon.stand != null ? 'data:image/png;base64,' + obj.icon.stand : '';
                    else if (obj.category === 'Map') {
                        let miniMap = obj.icon?.mini_map;
                        obj.icon = 'data:image/png;base64,' + (miniMap ? miniMap : 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4//8/AwAI/AL+p5qgoAAAAABJRU5ErkJggg==');
                    }
                    else {
                        obj.icon = obj.icon != null && obj.icon.item != null ? 'data:image/png;base64,' + obj.icon.item : '';
                    }
                }
            }
            this.setState({
                items: data,
                page: res.data.page,
                total: res.data.total,
                maxPage: Math.ceil(res.data.total / 15)
            });
        }).catch(error => {
            btn.disabled = false;
            layer.closeAll()
            const message = extractMessage(error, i18n.t('Common.server_error'));
            layer.msg(message, {icon: 2, time: 5000});
        })
    }

    handleKeywordChange(value) {
        this.setState({keyword: value});
    }

    render() {
        return (
            <div>
                <h2 className="text-center">{i18n.t('Library.title')}</h2>
                <hr/>
                <QueryInput keyword={this.state.keyword} onKeywordChange={this.handleKeywordChange} onClick={(e) => {
                    this.handleQuery(e)
                }}/>
                <br/>
                <Category/>
                <hr/>
                <QueryTable items={this.state.items}/>
                <Pagination total={this.state.total} page={this.state.page} maxPage={this.state.maxPage}
                            changePage={(e) => {
                                this.handleQuery(e)
                            }}/>
            </div>
        );
    }
}