// ==UserScript==
// @name         读取百度文库文章
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http*://wenku.baidu.com/view/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// ==/UserScript==


(function() {
    'use strict';
    let md5sum;
    let docconvert;
    let thePendingText = [];
    getCommonArticle();


    // 获取当前文章的请求数据数组
    function byResStrGetReaParqams(qrfData = {}) {
        const { articleId } = qrfData;
        const returnData = { getDataFlag: true };
        const reqArr = [];

        if (!articleId) {
            alert('脚本运行错误，请联系开发人员 2732460915@qq.com!!!');
            return;
        };
        GM_xmlhttpRequest({
            method: 'get',
            url: `https://wenku.baidu.com/view/${articleId}.html?fr=search`,
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Cache-Control': 'max-age=0',
                'Upgrade-Insecure-Requests': 1
            },
            onload(res) {
                const reqText = res.responseText;
                md5sum = reqText.split('&md5sum=')[1].split('&range=0')[0];
                const startNum = reqText.indexOf('docconvert');
                console.log(startNum);
                docconvert = `docconvert${reqText.slice(startNum, startNum + 20).match(/\d+/)[0]}`;
                reqText
                    .split(`0.json?`)
                    .slice(1)
                    .map(ele => {
                        const reqStr = ele.split('}')[0].slice(0, -4);
                        if (reqArr.indexOf(reqStr) === -1 ) {
                            reqArr.push(reqStr);
                        }
                    });
            },
            onerror(error) {
                returnData.getDataFlag = false;
            }
        });
        returnData.reqArr = reqArr;
        return returnData;
    };
    // 获取普通文章
    async function getCommonArticle() {
        const pathnameArr = location.pathname.split('/');
        const articleId = pathnameArr[pathnameArr.length - 1].split('.')[0]
        const reqData = await byResStrGetReaParqams({ articleId });
        const { getDataFlag, reqArr } = reqData;
        let theCommonTextArr = [];
        if (!getDataFlag) {
            alert('接口数据请求错误，请重新再试!!!');
            return;
        };
        setTimeout(() =>{
            let loopNum = reqArr.length;
            for (let i = 0; i < loopNum; i++ ) {
                const ele = reqArr[i];
                GM_xmlhttpRequest({
                    method: 'get',
                    url: `https://wkbjcloudbos.bdimg.com/v1/${docconvert}/wk/${md5sum}/0.json?${ele}`,
                    headers: {
                        Accept: '*/*',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept-Language': 'zh-CN,zh;q=0.9'
                    },
                    onload(res) {
                        theCommonTextArr.push(JSON.parse(res.responseText.slice(8,-1)).body);
                        if ( i === (loopNum - 1)) {
                            const timer = setTimeout(() => {
                                byHtmlTextToArticle({ article_htmlText: theCommonTextArr, loopNum });
                                clearTimeout(timer);
                            }, 300);
                        }
                    }
                });
            }
        }, 3500);
    };
    // 将错误信息发送到开发者邮箱
    function sendEmailToDeveloper() {

    }
    // 将获取的 HTML 内容转化为文章
    function byHtmlTextToArticle(qrfData = {} ) {
        let articleText;
        const { article_htmlText, loopNum } = qrfData;
        for (let i = loopNum - 1; i >= 0; i--) {
            articleText +='\n\n';
            const arrLength = article_htmlText[loopNum - 1 - i].length;
            for (let j = 0; j < arrLength; j++ ) {

                const str = article_htmlText[loopNum - 1 - i][j].c;
                if (typeof str === 'string') {
                    articleText += str;
                }
            }
        }
        articleText = articleText.replace('undefined', '');
        GM_setClipboard(articleText);
        alert('文章获取成功!!!');
    }

})();