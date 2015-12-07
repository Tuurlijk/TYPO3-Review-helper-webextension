/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global chrome, safari, SAFARI, openTab, Ember, DS, console, alert */

var TYPO3Review_1447791881 = (function () {
    'use strict';

    /**
     * The id of the active tab
     *
     * @since 1.0.0
     */
    var activeTabId,

        /**
         * ID prefix used to uniquely target elements in content script
         *
         * @since 1.0.0
         *
         * @type {string}
         */
        prefix = 'TYPO3Review_1447791881_',

        /**
         * API endpoint
         *
         * @since 1.0.0
         *
         * @type {string}
         */
        apiEnd = 'https://local.typo3.org',

        /**
         * API version
         *
         * @since 1.0.0
         */
        apiVersion = '0',

        /**
         * Is the review site available?
         *
         * @since 1.0.0
         */
        isReviewSiteAvailable = false;

    /**
     * Create popup element
     *
     * @since 1.0.0
     *
     */
    function createPopupDiv() {
        var containerDiv = document.createElement('div');
        containerDiv.id = 'TYPO3Review_1447791881';
        containerDiv.innerHTML = '<div class="normalMode"><div id="' + prefix + 'closeButton">✖</div><div id="' + prefix + 'status"></div>' +
            '<div class="separator"></div>' +
            '<div id="' + prefix + 'loading" class="hide">' +
            '<div class="throbber" style="background-image: url(\'' + chrome.extension.getURL('Resources/Images/throbber.svg') + '\')"></div>' +
            '</div>' +
            '<div class="buttons">' +
            '<div id="' + prefix + 'currentRevision"></div>' +
            '<div id="' + prefix + 'allRevisions"></div>' +
            '<div class="separator"></div>' +
            '<input id="' + prefix + 'resetButton" class="button" type="button" name="cmd" value="Reset Review Sites">' +
            '<br/>' +
            '<input id="' + prefix + 'updateButton" class="button" type="button" name="cmd" value="Update Review Sites">' +
            '<div class="separator"></div>' +
            '<input id="' + prefix + 'openReviewSitesButton" class="button" type="button" name="cmd" value="Open Review Sites">' +
            '</div></div>';

        if (document.getElementsByTagName('body')[0]) {
            document.getElementsByTagName('body')[0].appendChild(containerDiv);
        } else {
            document.getElementsByTagName('html')[0].appendChild(containerDiv);
        }
        containerDiv.style.visibility = 'hidden';

        document.getElementById(prefix + 'closeButton').addEventListener('click', function () {
            document.getElementById('TYPO3Review_1447791881').className = 'fadeOutFast';
            document.getElementById('TYPO3Review_1447791881').style.visibility = 'hidden';
        }, false);

    }

    /**
     * Gen the number of objects within an object
     *
     * @since 1.0.0
     *
     * @param object
     *
     * @returns {number}
     */
    function objectLength(object) {
        var length = 0,
            key;
        for (key in object) {
            if (object.hasOwnProperty(key)) {
                ++length;
            }
        }
        return length;
    }

    /**
     * Sort function to sort objectArray by number
     *
     * @since 1.0.0
     *
     * @param {object} a  Object a.
     * @param {object} b  Object b.
     *
     * @return {*}  Not defined.
     */
    function sortObjectArrayByRevision(a, b) {
        if (a._number > b._number) {
            return -1;
        }
        if (a._number < b._number) {
            return 1;
        }
        return 0;
    }

    /**
     * Reset and update are also possible cmd values
     *
     * @since 1.0.0
     *
     * @param cherryPickCommand
     */
    function runCherryPickCommand(cherryPickCommand) {
        var xhr = new XMLHttpRequest(),
            parameters = "parameter=" + encodeURIComponent(cherryPickCommand) + "&cmd=review";
        xhr.open('POST', 'https://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onerror = publicMethods.setStatusMessage(chrome.i18n.getMessage('cherryPickFaill'), 'error');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    publicMethods.setStatusMessage(chrome.i18n.getMessage('cherryPickSuccess'));
                } else {
                    publicMethods.setStatusMessage(chrome.i18n.getMessage('cherryPickFaill'), 'error');
                }
            }
        };
    }

    /**
     * Get the cherry-pick command from the revision data
     *
     * @since 1.0.0
     *
     * @param currentRevision
     *
     * @returns {string}
     */
    function getCherryPickCommand(currentRevision) {
        var cherryPickCommand = '';
        if (parseInt(currentRevision._number, 10) === parseInt(event.target.dataset.revision, 10)) {
            cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
            document.getElementById(prefix + 'loading').className = 'loading';
            runCherryPickCommand(cherryPickCommand);
        }
        return cherryPickCommand;
    }

    /**
     * Open review sites
     *
     * @since 1.0.0
     */
    function openReviewSites() {
        var urls = [
                "http://dev-master.local.typo3.org/typo3/",
                "http://review.local.typo3.org/typo3/"
            ],
            count;
        if (chrome.tabs !== undefined) {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                for (count = 0; count < urls.length; count++) {
                    chrome.tabs.create({
                        'url': urls[count],
                        'index': tabs[0].index + 1,
                        'active': false
                    });
                }
            });
        }

        if (activeTabId !== undefined) {
            for (count = 0; count < urls.length; count++) {
                chrome.runtime.sendMessage({
                    from: 'content',
                    cmd: 'openTab',
                    url: urls[count],
                    index: activeTabId + 1
                }, function () {
                });
            }
        }
    }

    /**
     * Reset review sites
     *
     * @since 1.0.0
     */
    function resetReviewSites() {
        document.getElementById(prefix + 'loading').className = 'loading';
        var xhr = new XMLHttpRequest(),
            parameters = "cmd=reset";
        xhr.open('POST', 'https://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onerror = publicMethods.setStatusMessage(chrome.i18n.getMessage('resetSitesFail'), 'error');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    publicMethods.setStatusMessage(chrome.i18n.getMessage('resetSitesSuccess'));
                } else {
                    publicMethods.setStatusMessage(chrome.i18n.getMessage('resetSitesFail'), 'error');
                }
            }
        };
    }

    /**
     * Show review popup
     *
     * @since 1.0.0
     *
     * @param event
     */
    function showReviewPopup(event) {
        var changeDetailUrl = publicMethods.getChangeDetailUrl(event.target.parentElement.href),
            revision = 'latest',
            popup;

        popup = document.getElementById('TYPO3Review_1447791881');
        popup.className = '';
        popup.style.visibility = 'visible';
        event.target.parentElement.parentElement.appendChild(popup);

        // Make sure the popup can scroll with the buttons in the table cell
        event.target.parentElement.parentElement.style.position = 'relative';

        // Set the review api version
        var promise = new Promise(function (resolve, reject) {
            resolve(publicMethods.getApiVersion());
        });
        publicMethods.getReviewSiteAvailability();

        if (changeDetailUrl) {
            document.getElementById(prefix + 'loading').className = 'loading';
            publicMethods.loadIssueDetails(changeDetailUrl, revision);
        } else {
            publicMethods.setStatusMessage(chrome.i18n.getMessage('changeIdNotFound', 'error'));
        }
    }

    /**
     * Update review sites
     *
     * @since 1.0.0
     */
    function updateReviewSites() {
        document.getElementById(prefix + 'loading').className = 'loading';
        var xhr = new XMLHttpRequest(),
            parameters = "cmd=update";
        xhr.open('POST', 'https://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onerror = publicMethods.setStatusMessage(chrome.i18n.getMessage('updateSitesFail'), 'error');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    publicMethods.setStatusMessage(chrome.i18n.getMessage('updateSitesSuccess'));
                } else {
                    publicMethods.setStatusMessage(chrome.i18n.getMessage('updateSitesFail'), 'error');
                }
            }
        };
    }

    /**
     * Create review buttons
     *
     * @since 1.0.0
     *
     * @param responseText
     * @param revision
     */
    function createReviewButtons(responseText, revision) {
        if (responseText.startsWith(')]}\'')) {
            responseText = responseText.substr(4);
        }

        var response = JSON.parse(responseText),
            revisions,
            allRevisions,
            cherryPickCommand = '',
            allRevisionButtons = '',
            m,
            n,
            resetButton,
            updateButton;

        if (revision === 'latest' || '') {
            revision = objectLength(response[0].revisions);
        }
        revisions = Object.keys(response[0].revisions).map(function (key) {
            return response[0].revisions[key];
        });
        revisions.forEach(function (currentRevision) {
            if (parseInt(currentRevision._number, 10) === parseInt(revision, 10)) {
                cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
                if (cherryPickCommand !== '') {
                    document.getElementById(prefix + 'currentRevision').innerHTML = '<input class="' + prefix + 'revisionButton button" type="button" name="revision" data-revision="' + currentRevision._number + '" value="Cherry-Pick revision ' + revision + '">';
                } else {
                    alert('doh! No cherry pick command found.');
                }
            }
        });
        revisions.sort(sortObjectArrayByRevision);

        revisions.forEach(function (currentRevision) {
            if (parseInt(currentRevision._number, 10) !== parseInt(revision, 10)) {
                cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
                if (cherryPickCommand !== '') {
                    allRevisionButtons += '<input type="button" class="' + prefix + 'revisionButton button" name="revision" data-revision="' + currentRevision._number + '" value="Cherry-Pick revision ' + currentRevision._number + '"><br/>';
                } else {
                    alert('doh! No cherry pick command found.');
                }
            }
        });
        document.getElementById(prefix + 'allRevisions').innerHTML = allRevisionButtons;
        allRevisions = document.getElementsByClassName(prefix + 'revisionButton');
        for (m = 0, n = allRevisions.length; m < n; ++m) {
            allRevisions[m].addEventListener('click', function (event) {
                revisions.forEach(function (currentRevision) {
                    if (parseInt(currentRevision._number, 10) === parseInt(event.target.dataset.revision, 10)) {
                        cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
                        document.getElementById(prefix + 'loading').className = 'loading';
                        runCherryPickCommand(cherryPickCommand);
                    }
                });
            }, false);
        }
        document.getElementById(prefix + 'resetButton').addEventListener('click', resetReviewSites, false);
        document.getElementById(prefix + 'updateButton').addEventListener('click', updateReviewSites, false);
        document.getElementById(prefix + 'openReviewSitesButton').addEventListener('click', openReviewSites, false);
    }

    var publicMethods = {

        /**
         * Get the change detail url
         *
         * @since 1.0.0
         *
         * @param url
         * @returns {string}
         */
        getChangeDetailUrl: function (url) {
            var parser = document.createElement('a'),
                issueNumber,
                hashParts,
                revision = 'latest',
                detailUrl = '';
            parser.href = url;
            if (parser.hash.startsWith('#/c/')) {
                hashParts = parser.hash.split('/');

                if (hashParts.length > 2) {
                    hashParts.shift();
                    hashParts.shift();
                    issueNumber = hashParts.shift();

                    if (hashParts.length) {
                        revision = hashParts.shift();
                    }
                }

                if (issueNumber !== undefined && revision !== undefined) {
                    // https://review.typo3.org/changes/?q=change:36674&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS
                    detailUrl = parser.protocol + '//' + parser.hostname + '/changes/?q=change:' + issueNumber + '&o=ALL_REVISIONS&o=DOWNLOAD_COMMANDS';
                }
            }
            return detailUrl;
        },

        /**
         * Get the id prefix
         *
         * @since 1.0.0
         *
         * @returns {string}
         */
        getPrefix: function () {
            return prefix;
        },

        /**
         * Set the active tab id
         *
         * @since 1.0.0
         *
         * @param tabId
         */
        setActiveTabId: function (tabId) {
            activeTabId = tabId;
        },

        /**
         * Get currently viewed revision
         *
         * @since 1.0.0
         *
         * @param url
         * @returns {string}
         */
        getRevision: function (url) {
            var parser = document.createElement('a'),
                hashParts,
                revision = 'latest';
            parser.href = url;
            if (parser.hash.startsWith('#/c/')) {
                hashParts = parser.hash.split('/');

                if (hashParts.length > 2) {
                    hashParts.shift();
                    hashParts.shift();
                    hashParts.shift();

                    if (hashParts.length > 1) {
                        revision = hashParts.shift();
                    }
                }
            }
            if (revision === '') {
                revision = 'latest';
            }
            return revision;
        },

        /**
         * Get the API version
         *
         * @since 1.0.0
         */
        getApiVersion: function () {
            var xhr = new XMLHttpRequest(),
                response;
            xhr.open('GET', apiEnd + '/version', true);
            xhr.send(null);
            xhr.onerror = publicMethods.setStatusMessage(chrome.i18n.getMessage('apiVersionFetchFail'), 'error');
            ;
            xhr.onload = function () {
                response = JSON.parse(xhr.responseText);
                if (response.status === 'OK') {
                    apiVersion = response.stdout;
                }
            };
        },

        /**
         * Check if the review site is available
         *
         * @since 1.0.0
         */
        getReviewSiteAvailability: function () {
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', 'https://local.typo3.org/review.php', true);
            xhr.send(null);
            xhr.onerror = publicMethods.setStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
            ;
            xhr.timeout = 1000;
            xhr.ontimeout = function () {
                isReviewSiteAvailable = false;
                publicMethods.setStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
            };
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 0 || xhr.status === 400 || xhr.status === 404) {
                        isReviewSiteAvailable = false;
                        publicMethods.setStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
                    }
                }
            };
        },

        /**
         * Load the details for a certains issue
         *
         * @since 1.0.0
         *
         * @param url
         * @param revision
         */
        loadIssueDetails: function (url, revision) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(null);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        createReviewButtons(xhr.responseText, revision);
                        document.getElementById(prefix + 'loading').className = 'hide';
                    }
                }
            };
            xhr.onerror = publicMethods.setStatusMessage(chrome.i18n.getMessage('issueDetailLoadFail'), 'error');
            ;
        },

        /*
         * Handles messages from other extension parts to content script
         *
         * @since 1.0.0
         *
         * @param request
         * @param sender
         * @param sendResponse
         */
        contentMessageListener: function (request, sender, sendResponse) {
            var button,
                clone,
                externalLinkIcon,
                links,
                m,
                n,
                parent,
                reviewTextNode;

            // Execute the requested command
            switch (request.cmd) {
            case 'addButtons':
                createPopupDiv();
                links = document.getElementsByTagName('a');
                for (m = 0, n = links.length; m < n; ++m) {
                    if (links[m].href.startsWith(request.gerritUrl)) {
                        parent = links[m].parentElement;
                        clone = links[m].cloneNode(true);
                        externalLinkIcon = clone.getElementsByTagName('i')[0];
                        button = clone.getElementsByTagName('span')[0];
                        button.innerText = '';
                        button.appendChild(externalLinkIcon);
                        reviewTextNode = document.createTextNode(' Review');
                        button.appendChild(reviewTextNode);
                        clone.addEventListener('click', function (event) {
                            event.preventDefault();
                            showReviewPopup(event);
                        }, false);
                        parent.appendChild(clone);
                        ++m;
                        ++n;
                    }
                }
                break;
            case 'insecureResponse':
                publicMethods.setStatusMessage(chrome.i18n.getMessage('certificateFailure'), 'error');
                break;
            }
            sendResponse({});
        },

        /**
         * Set status message
         *
         * @since 1.0.0
         *
         * @param message
         * @param status
         */
        setStatusMessage: function (message, status) {
            if (status === undefined) {
                status = '2xx';
            } else if (status === 'error') {
                status = '4xx';
            } else {
                status = '4xx';
            }

            document.getElementById(prefix + 'loading').className = 'hide';
            document.getElementById(prefix + 'status').innerHTML = message;
            document.getElementById(prefix + 'status').setAttribute('class', 'status' + status);
        }

    };

    return publicMethods;
}());
