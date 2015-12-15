/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint browser:true */
/*global chrome, TYPO3Review_1447791881, console */

chrome.runtime.onMessage.addListener(TYPO3Review_1447791881.contentMessageListener);

chrome.runtime.sendMessage(
    {
        from: 'content',
        cmd: 'getActiveTabId'
    },
    function (response) {
        'use strict';
        TYPO3Review_1447791881.setActiveTabId(response);
    }
);
