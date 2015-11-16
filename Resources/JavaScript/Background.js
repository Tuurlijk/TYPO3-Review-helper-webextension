/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*global chrome, document, localStorage, safari, SAFARI, openTab, DS, localize */
'use strict';

function updateIcon (status, tabId) {
    // Figure the correct title/image with the given state
    var title = 'Please navigate to an issue',
        image = 'ToolbarIconDisabled';

    if (status === 1) {
        title = 'Review this patch in http://review.local.typo3.org/';
        image = 'ToolbarIcon';
    }

    // Update title
    chrome.pageAction.setTitle({
        tabId: tabId,
        title: title
    });

    // Update image
    chrome.pageAction.setIcon({
        tabId: tabId,
        path: {
            '19': '/Resources/Icons/' + image + '19.png',
            '38': '/Resources/Icons/' + image + '38.png'
        }
    });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // We only react on a complete load of a http(s) page,
    // only then we're sure the content.js is loaded.
    if (changeInfo.status !== 'complete' || tab.url.indexOf('http') !== 0) {
        return;
    }

    // Prepare some variables
    var gerritUrl = 'https://review.typo3.org/';

    // Check if localStorage is available and get the settings out of it
    if (localStorage) {
        if (localStorage.elements) {
            gerritUrl = localStorage.gerritUrl;
        }
    }

    // Show icon if we are on a gerritUrl
    if (tab.url.startsWith(gerritUrl)) {
        // Show the pageAction
        chrome.pageAction.show(tabId);

        var parser = document.createElement('a'),
            hashParts,
            issueNumber;
        parser.href = tab.url;
        if (parser.hash.startsWith('#/c/')) {
            hashParts = parser.hash.split('/');

            if (hashParts.length > 2) {
                hashParts.shift();
                hashParts.shift();
                issueNumber = hashParts.shift();
            }

            if (issueNumber !== undefined) {
                updateIcon(1, tabId);
            }
        } else {
            updateIcon(0, tabId);
        }
    }
});
