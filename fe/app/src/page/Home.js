import React from "react";
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from '../App'

export class Home extends React.Component {
    componentDidMount() {
        document.title = i18n.t('home.title');
        convertBase();
        pageInit();
    }

    render() {
        return (
            <div>
                <div style={{background: '#eee', border: '1px solid #ccc', padding: '5px 10px'}}>
                    <span className="marker"><em><strong><font
                        color="red">{i18n.t('home.browser')}</font></strong></em></span>
                </div>
                <div style={{background: '#eee', border: '1px solid #ccc', padding: '5px 10px'}}>
                    <span className="marker"><em><strong>{i18n.t('home.GameUpdate')}</strong></em></span>
                </div>
                <div style={{background: '#eee', border: '1px solid #ccc', padding: '5px 10px'}}>
                    <strong><em>{i18n.t('home.WebUpdate')}</em></strong>
                </div>

                <hr/>
                <h1><strong>{i18n.t('home.Welcome')}</strong></h1>

                <p>{i18n.t('home.introduce1')}</p>
                <ul>
                    <li>{i18n.t('home.trait1')}</li>
                    <li>{i18n.t('home.trait2')}</li>
                    <li>{i18n.t('home.trait3')}</li>
                    <li>{i18n.t('home.trait4')}</li>
                    <li>{i18n.t('home.trait5')}</li>
                    <li>{i18n.t('home.trait6')}</li>
                    <li>{i18n.t('home.trait7')}</li>
                    <li>{i18n.t('home.trait8')}</li>
                    <li>{i18n.t('home.trait9')}</li>
                </ul>

                <p><img alt="" src={i18n.t('home.introduce2')}
                        style={{width: '100%'}}/>
                </p>

                <p><img alt="" src={i18n.t('home.introduce3')}
                        style={{width: '100%'}}/>
                </p>

                <p><img alt="" src={i18n.t('home.introduce4')}
                        style={{width: '100%'}}/>
                </p>

                <p><img alt="" src={i18n.t('home.introduce5')}
                        style={{width: '100%'}}/>
                </p>
            </div>
        );
    }
}