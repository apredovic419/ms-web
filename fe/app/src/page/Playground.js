import React from "react";
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {cdnHost, storage} from "../utils";
import {beUserInfo} from "../api/auth";

/* global layer */

export class PlaygroundPage extends React.Component {
    componentDidMount() {
        document.title = i18n.t('Playground.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(8)').setAttribute("style", "background-color: green");
        convertBase();
        pageInit();
    }

    renderIframe() {
        const iframe = (
            <iframe
                src="https://next.maplez.org"
                width="800px"
                height="600px"
                style={{border: 'none'}}
            />
        );
        const forbidden = (
            <div style={{marginTop: '300px', marginBottom: '300px', textAlign: 'center'}}>
                <h2 style={{color: 'blue', fontSize: '18px', margin: '10px'}}>
                    {i18n.t('Playground.noAccess')}
                </h2>
            </div>
        );

        if (storage.getExpire('token')) {
            if (storage.getExpire('user')) {
                return iframe;
            } else {
                beUserInfo().then(resp => {
                    storage.setExpire("user", JSON.stringify(resp.data), 1800000);
                    return iframe;
                }).catch(error => {
                    storage.clear();
                    layer.msg(i18n.t('Playground.noAccess'), {icon: 7, time: 5000});
                    return forbidden;
                })
            }
        }
        layer.msg(i18n.t('Playground.noAccess'), {icon: 7, time: 5000});
        return forbidden;
    }

    render() {
        return (
            <div style={{
                backgroundColor: '#cccccc',
                padding: '5px',
                marginTop: '5px',
                textAlign: 'center'
            }}>
                <h2 style={{color: 'black', fontSize: '18px', margin: '10px'}}>
                    {i18n.t('Playground.slogan')}
                </h2>
                <span style={{fontSize: '12px'}}>{i18n.t('Playground.nightlyTip')}</span>
                {this.renderIframe()}
            </div>
        );
    }
}