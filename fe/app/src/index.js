import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './wz.css';
import './App';
import {Home} from './page/Home'
import {DownloadPage} from './page/Download'
import {NoticePage, NoticeDetailPage} from './page/Notice'
import {VotePage} from './page/Vote'
import {RankPage} from './page/Rank'
import {CashShopPage} from './page/CashShop'
import {RegisterPage} from './page/Register'
import {Library} from './page/Library'
import {ForgotPage} from './page/Forgot'
import {PlaygroundPage} from './page/Playground'

import reportWebVitals from './reportWebVitals';
import {BrowserRouter, Route, Switch} from 'react-router-dom'

ReactDOM.render(
    (<BrowserRouter>
        <Switch>
            <Route path="/wz" component={Library}/>
            <Route path="/notice/:nid(\d+)" component={NoticeDetailPage}/>
            <Route path="/notice" component={NoticePage}/>
            <Route path="/ranking" component={RankPage}/>
            <Route path="/vote" component={VotePage}/>
            <Route path="/download" component={DownloadPage}/>
            <Route path="/library" component={Library}/>
            <Route path="/cashshop" component={CashShopPage}/>
            <Route path="/register" component={RegisterPage}/>
            <Route path="/forgot" component={ForgotPage}/>
            <Route path="/playground" component={PlaygroundPage}/>
            <Route path="/" component={Home}/>
        </Switch>
    </BrowserRouter>),
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
