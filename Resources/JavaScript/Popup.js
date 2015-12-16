/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global chrome, console, alert, isValidUrl, TYPO3Review_1447791881 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    var t3Review = TYPO3Review_1447791881;

    document.querySelector('#TYPO3Review_1447791881 .extensionName').innerText = chrome.i18n.getMessage('extensionName');

    // Query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        var url = t3Review.getChangeDetailUrl(tabs[0].url),
            revision = t3Review.getRevision(tabs[0].url);

        t3Review.detectApiVersion()
            .then(function () {
                if (t3Review.getApiVersion() === 0) {
                    return t3Review.getReviewSiteAvailability();
                } else {
                    return {status: true};
                }
            })
            .then(function (result) {
                if (url && result !== undefined) {
                    return t3Review.loadIssueDetails(url);
                } else {
                    reject({});
                }
            })
            .then(function (issueDetails) {
                if (t3Review.getApiVersion() === 0) {
                    t3Review.createReviewButtons(issueDetails, revision);
                } else {
                    return t3Review.getTypo3Sites();
                }
            })
            .then(function (sites) {
                if (sites.length > 0) {
                    t3Review.showChangeInformation();
                    t3Review.createReviewSelector(t3Review.getIssueDetails(), revision);
                    return t3Review.createSiteSelector(sites);
                }
            })
            .then(function () {
                return t3Review.getGitRepositories(t3Review.getPreferredReviewSite());
            })
            .then(function (gitRepositories) {
                t3Review.createRepositorySelector(gitRepositories);
                t3Review.setFormDefaults();
                t3Review.listenForFormChanges();
                t3Review.listenForCherryPickCommand();
            })
            .catch(function () {
            });
    });
});
