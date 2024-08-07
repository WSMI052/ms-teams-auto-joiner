// ==UserScript==
// @name         Teams 自動入會
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  每隔一秒檢測是否存在 data-testid="meeting-notification" 的元素，如果存在則點擊相應的按鈕完成自動入會，並提供配置和日志功能的UI。
// @author       Your Name
// @match        https://teams.microsoft.com/v2/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const TEAMS_BUTTON_SELECTOR = '[aria-label="團隊"]';
    const CHANNEL_JOIN_MEETING_BUTTON_SELECTOR = '[data-tid="channel-ongoing-meeting-banner-join-button"]';
    const MIC_BUTTON_SELECTOR = '[data-tid="prejoin-audio-common-header-computer-no-audio"]';
    const JOIN_BUTTON_SELECTOR = '[data-tid="prejoin-join-button"]';
    const LISTENING_TEAM = "ST";
    const LISTENING_CHANNEL = "iOSTeam🎙️";

    // 定義 sleep 函數
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 獲取當前時間的函數
    function getCurrentTime() {
        let now = new Date();
        let year = now.getFullYear();
        let month = String(now.getMonth() + 1).padStart(2, '0');
        let day = String(now.getDate()).padStart(2, '0');
        let hours = String(now.getHours()).padStart(2, '0');
        let minutes = String(now.getMinutes()).padStart(2, '0');
        let seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 日誌輸出函數
    function log(message) {
        console.log(`[${getCurrentTime()}] ${message}`);
    }

    // 等待元素出現的函數
    async function waitForElement(selector, timeout = 60000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
            await sleep(500); // 每隔500毫秒檢查一次
        }
        throw new Error(`元素 ${selector} 未在 ${timeout} 毫秒內出現`);
    }

    // 定義異步函數，用於處理點擊操作
    async function handleMeetingNotification() {
        try {
            let channelJoinMeetingButton = document.querySelector(CHANNEL_JOIN_MEETING_BUTTON_SELECTOR);
            if (!channelJoinMeetingButton) {
                log('未發現會議通知。');
                return;
            }

            log('發現會議通知！');
            channelJoinMeetingButton.click();
            log('已點擊加入會議按鈕。');

            // 等待麥克風按鈕出現並點擊
            let micButton = await waitForElement(MIC_BUTTON_SELECTOR);
            micButton.click();
            log('已點擊麥克風按鈕。');
            await sleep(1000)
            // 等待加入會議按鈕出現並點擊
            let joinButton = await waitForElement(JOIN_BUTTON_SELECTOR);
            joinButton.click();
            log('已點擊加入按鈕。');

        } catch (error) {
            log(`錯誤: ${error.message}`);
        }
    }

    (async () => {
        try {
            let teamsButton = await waitForElement(TEAMS_BUTTON_SELECTOR);
            teamsButton.click();
            log('已點擊 团队 按鈕。');
            await sleep(1000);

            let listeningTeamButton = await waitForElement(`[displayname="${LISTENING_TEAM}"]`);
            listeningTeamButton.click();
            log(`已选择 ${LISTENING_TEAM} 团队`);
            await sleep(1000);

            // 等待并查找包含频道名称的 span 元素并点击
            await waitForElement('[data-tid="channel-list-item"] span');
            let channels = document.querySelectorAll('[data-tid="channel-list-item"] span');
            for (let channel of channels) {
                if (channel.textContent.trim() === LISTENING_CHANNEL) {
                    channel.click();
                    log(`已选择 ${LISTENING_CHANNEL} 频道`);
                    break;
                } else {
                    log(`未找到 ${LISTENING_CHANNEL} 频道`);
                }
            }
        } catch (error) {
            log(`錯誤: ${error.message}`);
        }
    })();

    // 設置定時器，每隔一秒執行一次檢查函數
    setInterval(handleMeetingNotification, 1000);
})();
