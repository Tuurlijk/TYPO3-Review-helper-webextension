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

function reviewIssue(data) {
    if (data.startsWith(')]}\'')) {
        data = data.substr(4);
    }

    console.log(JSON.parse(data));
}

function xhrError () {
    console.log('doh!');
}

function loadIssueDetails (url, callBack) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(null);
    xhr.callback = callBack;
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            reviewIssue(xhr.responseText);
        }
    };
    xhr.onerror = xhrError;
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // We only react on a complete load of a http(s) page,
    // only then we're sure the content.js is loaded.
    if (changeInfo.status !== 'complete' || tab.url.indexOf('http') !== 0) {
        return;
    }

    // Prep some variables
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

        var parser = document.createElement('a');
        parser.href = tab.url;
        if (parser.hash.startsWith('#/c/')) {
            updateIcon(1, tabId);

            var issueNumber, issueParts, url;

            if (parser.hash.endsWith('/')) {
                issueParts = parser.hash.slice(0, -1);
            }

            issueNumber = issueParts.split('/').pop();

            // https://review.typo3.org/changes/44704/detail?O=2002
            url = parser.protocol + '//' + parser.hostname + '/changes/' + issueNumber + '/detail?O=2002';

            loadIssueDetails(url, reviewIssue);
        } else {
            updateIcon(0, tabId);
        }
    }
});

// Request the current status and update the icon accordingly
chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(
        tab.id,
        {
            cmd: 'reviewTYPO3Patch'
        },
        function (response) {
            if (response.status !== undefined) {
                var bkg = chrome.extension.getBackgroundPage();
                bkg.console.log(response);
                bkg.console.log(tab.url);
            }
        }
    );
});
