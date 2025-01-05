import React from "react";
import i18n from '../i18next/i18n';
import {pageInit, convertBase} from "../App";
import {cdnHost} from "../utils";

export class DownloadPage extends React.Component {
    componentDidMount() {
        document.title = i18n.t('download.title')
        document.querySelector('div.navbar-collapse.collapse > ul > li:nth-child(2)').setAttribute("style", "background-color: green");
        convertBase();
        pageInit();
    }

    render() {
        let forceInvite = localStorage.getItem('forceInvite')
        let clientUrl = cdnHost + '/static/images/client.png'
        return (
            <div>
                <h2 className="text-center">{i18n.t('download.center')}</h2>
                <hr/>
                <div className="img-responsive" style={{margin: '0 auto'}}>
                    <div style={{textAlign: 'center'}}>
                        <img src={clientUrl} alt="Client" style={{display: 'inline-block'}}/>
                    </div>
                    <center>
                        {forceInvite === 'true' ? (<div><b>{i18n.t('download.invite_message')}</b><br/></div>) : ''}
                        <b>{i18n.t('download.language_message')}</b><br/>
                        <b>{i18n.t('download.contain1')} <font color="red">{i18n.t('download.contain2')}</font></b><br/>
                        <a href="#">{i18n.t('download.google')}</a><br/>
                        <a href="#">{i18n.t('download.caiyun1')}</a> {i18n.t('download.caiyun2')}<br/>
                        <br/>
                        <a href="https://wwe.lanzouw.com/iFLBFzmrwub">{i18n.t('download.update1')}</a> {i18n.t('download.update2')}<br/>
                        <b>{i18n.t('download.contact_help1')}(<a href=''></a>){i18n.t('download.contact_help2')}</b>
                        <br/>
                        <br/>

                        <b>{i18n.t('download.install_help0')}</b><br/>
                        {i18n.t('download.install_help1')}<br/>
                        {i18n.t('download.install_help2')}<br/>
                        {i18n.t('download.install_help3')}<br/>
                        {i18n.t('download.install_help4')}<br/>
                        <br/>
                    </center>
                    <button type="button" className="center-block btn btn-info" data-toggle="collapse"
                            data-target="#demo">{i18n.t('download.solution_btn')}
                    </button>
                    <div id="demo" className="collapse"><br/>
                        <b>{i18n.t('download.solution_q1')}</b><br/>
                        {i18n.t('download.solution_a1_1')}<br/>{i18n.t('download.solution_a1_2')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q2')}</b><br/>
                        {i18n.t('download.solution_a2_1')}<a href="https://wws.lanzous.com/ioGifjk322b">{i18n.t('download.solution_a2_2')}</a>{i18n.t('download.solution_a2_3')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q3')}</b><br/>
                        {i18n.t('download.solution_a3')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q4')}</b><br/>
                        {i18n.t('download.solution_a4')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q5')}</b><br/>
                        {i18n.t('download.solution_a5')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q6')}</b><br/>
                        {i18n.t('download.solution_a6_0')}<br/>
                        {i18n.t('download.solution_a6_1')}<br/>
                        {i18n.t('download.solution_a6_2')}<br/>
                        {i18n.t('download.solution_a6_3')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q7')}</b><br/>
                        {i18n.t('download.solution_a7')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q8')}</b><br/>
                        {i18n.t('download.solution_a8')}
                        <br/><br/>
                        <b>{i18n.t('download.solution_q11')}</b><br/>
                        {i18n.t('download.solution_a11_1')}<br/>
                        {i18n.t('download.solution_a11_2')}<a href={'https://support.microsoft.com/zh-cn/topic/%E5%A6%82%E4%BD%95%E5%9C%A8-windows-%E4%B8%AD%E6%89%A7%E8%A1%8C%E5%B9%B2%E5%87%80%E5%90%AF%E5%8A%A8-da2f9573-6eec-00ad-2f8a-a97a1807f3dd'}>{i18n.t('download.solution_a11_3')}</a><br/>
                        {i18n.t('download.solution_a11_4')}<br/>
                        <br/><br/>
                        <b>{i18n.t('download.solution_q9')}</b><br/>
                        {i18n.t('download.solution_a9_1')}<a href='#'>{i18n.t('download.solution_a9_2')}</a>。
                        <br/><br/>
                        <b>{i18n.t('download.solution_q10')}</b><br/>
                        {i18n.t('download.solution_a10_1')}(<a href='#'></a>){i18n.t('download.solution_a10_2')}
                    </div>
                </div>
            </div>
        );
    }
}