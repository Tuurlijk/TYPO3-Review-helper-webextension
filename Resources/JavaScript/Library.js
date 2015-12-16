/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, globalstrict: true,
 latedef:true, noarg:true, noempty:true, nonew:true, undef:true, maxlen:256,
 strict:true, trailing:true, boss:true, browser:true, devel:true, jquery:true */
/*jslint plusplus:true, nomen:true, browser:true*/
/*global chrome, openTab, DS, console, alert, localStorage */

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
         * ID prefix used to uniquely target elements in content script
         *
         * @since 1.0.0
         *
         * @type {string}
         */
        prefixId = '#TYPO3Review_1447791881',

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
        isReviewSiteAvailable = false,

        /**
         * Issue details
         *
         * @since 1.0.0
         */
        issueDetails;

    /**
     * Clear status messages
     *
     * @since 1.0.0
     *
     */
    function clearStatusMessages() {
        document.getElementById(prefix + 'status').innerHTML = '';
    }

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
     * Get preferred repository
     *
     * @since 1.0.0
     *
     * @param repositories
     *
     * @return {string}
     */
    function getPreferredRepository(repositories) {
        var preferredRepository = '';
        if (localStorage) {
            if (localStorage.preferredRepository) {
                preferredRepository = localStorage.preferredRepository;
            }
        }
        if (preferredRepository === '') {
            if (repositories.indexOf('typo3_src') > -1) {
                preferredRepository = 'typo3_src';
            } else {
                preferredRepository = repositories[0];
            }
        }
        return preferredRepository;
    }

    /**
     * Get preferred review site
     *
     * @since 1.0.0
     *
     * @param sites
     *
     * @return {string}
     */
    function getPreferredReviewSite(sites) {
        var preferredReviewSite = '';
        if (localStorage) {
            if (localStorage.preferredReviewSite) {
                preferredReviewSite = localStorage.preferredReviewSite;
            }
        }
        if (preferredReviewSite === '') {
            if (sites.indexOf('review.local.typo3.org') > -1) {
                preferredReviewSite = 'review.local.typo3.org';
            } else {
                preferredReviewSite = sites[0];
            }
        }
        return preferredReviewSite;
    }

    /**
     * Fade out infoBox and remove after 1 second
     *
     * @since 1.0.0
     *
     * @param id
     * @param alternativeDocument
     *
     * @return {*}  Not defined.
     */
    function fadeOutStatusMessage(id, alternativeDocument) {
        var theDocument;
        if (alternativeDocument !== undefined) {
            theDocument = alternativeDocument;
        } else {
            theDocument = document;
        }
        theDocument.getElementById(id).classList.remove('fadeIn');
        theDocument.getElementById(id).classList.add('fadeOut');
        var timer = new Timer(
            function () {
                removeStatusMessage(id, alternativeDocument);
            },
            1000
        );
    }

    /**
     * Remove infoBox
     *
     * @since 1.0.0
     *
     * @param id
     * @param alternativeDocument
     *
     * @return {*}  Not defined.
     */
    function removeStatusMessage(id, alternativeDocument) {
        var theDocument;
        if (alternativeDocument !== undefined) {
            theDocument = alternativeDocument;
        } else {
            theDocument = document;
        }
        theDocument.getElementById(id).style.display = 'none';
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
     * Pauseable Timer
     *
     * @since 1.0.0
     *
     * @param  {object} callback  The callback object.
     * @param  {int} delay  The delay.
     * @this   {Timer}  A Timer.
     * @return {*}  Not defined.
     */
    function Timer(callback, delay) {
        var timerId, start, remaining = delay;

        this.pause = function () {
            window.clearTimeout(timerId);
            remaining -= new Date() - start;
        };

        this.resume = function () {
            start = new Date();
            timerId = window.setTimeout(callback, remaining);
        };

        this.resume();
    }

    /**
     * Hide loading indicator
     *
     * @since 1.0.0
     *
     * @param alternativeDocument
     */
    function hideLoadingIndicator(alternativeDocument) {
        var theDocument;
        if (alternativeDocument !== undefined) {
            theDocument = alternativeDocument;
        } else {
            theDocument = document;
        }
        theDocument.querySelector(prefixId + ' .loading').classList.add('hide');
    }

    /**
     * Show loading indicator
     *
     * @since 1.0.0
     *
     * @param alternativeDocument
     */
    function showLoadingIndicator(alternativeDocument) {
        var theDocument;
        if (alternativeDocument !== undefined) {
            theDocument = alternativeDocument;
        } else {
            theDocument = document;
        }
        theDocument.querySelector(prefixId + ' .loading').classList.remove('hide');
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
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('cherryPickSuccess'));
                } else {
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('cherryPickFaill'), 'error');
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
            showLoadingIndicator();
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
                    from: 'library',
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
        showLoadingIndicator();
        var xhr = new XMLHttpRequest(),
            parameters = "cmd=reset";
        xhr.open('POST', 'https://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(parameters);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('resetSitesSuccess'));
                } else {
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('resetSitesFail'), 'error');
                }
            }
        };
    }

    /**
     * Un-hide api markup in template
     *
     * @param apiVersion
     */
    function showApiMarkup(apiVersion) {
        apiVersion = apiVersion.replace(/\./g, '-');
        document.querySelector(prefixId + ' .api-v' + apiVersion).classList.remove('hide');
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
        publicMethods.detectApiVersion()
            .then(function () {
                if (publicMethods.getApiVersion() > 0) {

                } else {
                    return publicMethods.getReviewSiteAvailability();
                }
            })
            .then(function (result) {
                console.log(result);
                if (changeDetailUrl && result !== undefined) {
                    publicMethods.loadIssueDetails(changeDetailUrl, revision);
                }
            })
            .catch(function (reason) {
            });
    }

    /**
     * Update review sites
     *
     * @since 1.0.0
     */
    function updateReviewSites() {
        showLoadingIndicator();
        var xhr = new XMLHttpRequest(),
            parameters = "cmd=update";
        xhr.open('POST', 'https://local.typo3.org/review.php', true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('updateSitesSuccess'));
                } else {
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('updateSitesFail'), 'error');
                }
            }
        };
        xhr.send(parameters);
    }

    var publicMethods = {

        /**
         * Create review buttons
         *
         * @since 1.0.0
         *
         * @param response
         * @param revision
         */
        createReviewButtons: function (response, revision) {
            var revisions,
                allRevisions,
                cherryPickCommand = '',
                allRevisionButtons = '',
                m,
                n,
                resetButton,
                updateButton;

            showLoadingIndicator();
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
                            showLoadingIndicator();
                            runCherryPickCommand(cherryPickCommand);
                        }
                    });
                }, false);
            }
            document.getElementById(prefix + 'resetButton').addEventListener('click', resetReviewSites, false);
            document.getElementById(prefix + 'updateButton').addEventListener('click', updateReviewSites, false);
            document.getElementById(prefix + 'openReviewSitesButton').addEventListener('click', openReviewSites, false);
            hideLoadingIndicator();
        },

        /**
         * Create repository selector
         *
         * @since 1.0.0
         *
         * @param items
         */
        createRepositorySelector: function (items) {
            if (items.length === 0) {
                items[0] = 'No repositories found';
            }

            showLoadingIndicator();
            var select = '<select name="repository">',
                preferredRepository = getPreferredRepository(items),
                selected = '';
            items.forEach(function (item) {
                if (item === preferredRepository) {
                    selected = 'selected';
                } else {
                    selected = '';
                }
                select += '<option value="' + item + '" ' + selected + '>' + item + '</option>';
            });
            select += '</select><br/>';

            document.querySelector(prefixId + ' .repositorySelector').innerHTML = select;
            hideLoadingIndicator();
        },

        /**
         * Create review selector
         *
         * @since 1.0.0
         *
         * @param response
         * @param revision
         */
        createReviewSelector: function (response, revision) {
            showLoadingIndicator();
            var revisions,
                selected = '',
                cherryPickCommand = '',
                revisionOptions = '<select name="revision">';

            if (revision === 'latest' || '') {
                revision = objectLength(response[0].revisions);
            }
            revisions = Object.keys(response[0].revisions).map(function (key) {
                return response[0].revisions[key];
            });
            revisions.sort(sortObjectArrayByRevision);
            revisions.forEach(function (currentRevision) {
                if (parseInt(currentRevision._number, 10) === parseInt(revision, 10)) {
                    selected = 'selected';
                } else {
                    selected = '';
                }
                cherryPickCommand = currentRevision.fetch['anonymous http'].commands['Cherry Pick'];
                if (cherryPickCommand !== '') {
                    revisionOptions += '<option value="' + currentRevision._number + '" ' + selected + '>revision ' + currentRevision._number + '</option>';
                }
            });
            revisionOptions += '</select><br/>';

            document.querySelector(prefixId + ' .reviewSelector').innerHTML = revisionOptions;
            hideLoadingIndicator();
        },

        /**
         * Create site pulldown
         *
         * @since 1.0.0
         *
         * @param items
         */
        createSiteSelector: function (items) {
            return new Promise(function (resolve, reject) {
                showLoadingIndicator();
                var select = '<select name="site">',
                    preferredSite = getPreferredReviewSite(items),
                    selected = '';
                items.forEach(function (item) {
                    if (item === preferredSite) {
                        selected = 'selected';
                    } else {
                        selected = '';
                    }
                    select += '<option value="' + item + '" ' + selected + '>' + item + '</option>';
                });
                select += '</select><br/>';

                document.querySelector(prefixId + ' .siteSelector').innerHTML = select;
                document.querySelector(prefixId + ' .siteSelector select').addEventListener('change', function () {
                    showLoadingIndicator();
                    publicMethods.getGitRepositories(this.value)
                        .then(function (gitRepositories) {
                            publicMethods.createRepositorySelector(gitRepositories);
                            hideLoadingIndicator();
                        })
                        .catch(function () {
                        });
                });
                hideLoadingIndicator();
                resolve(preferredSite);
            });
        },

        /**
         * Detect the API version
         *
         * Promise is always resolved so we can try a fallback script
         *
         * @since 1.0.0
         */
        detectApiVersion: function () {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest(),
                    response;
                xhr.open('GET', apiEnd + '/version', true);
                xhr.onload = function () {
                    if (xhr.responseText.charAt(0) === '{') {
                        response = JSON.parse(xhr.responseText);
                        if (response.status === 'OK') {
                            apiVersion = response.stdout;
                            //publicMethods.addStatusMessage('API: ' + apiVersion);
                            showApiMarkup(apiVersion);
                            resolve(apiVersion);
                        }
                    }
                    else {
                        publicMethods.addStatusMessage(chrome.i18n.getMessage('apiVersionFetchFail'), 'error');
                        resolve({
                            status: this.status,
                            statusText: xhr.statusText
                        });
                    }
                };
                xhr.onerror = function () {
                    isReviewSiteAvailable = false;
                    resolve({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.timeout = 2000;
                xhr.ontimeout = function () {
                    isReviewSiteAvailable = false;
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('apiVersionFetchFail'), 'error');
                    resolve({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.send();
            });
        },

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
            if (detailUrl === '') {
                publicMethods.addStatusMessage(chrome.i18n.getMessage('changeIdNotFound'), 'error');
            }
            return detailUrl;
        },

        /**
         * Get Git repositories
         *
         * @param site
         *
         * @since 1.0.0
         */
        getGitRepositories: function (site) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest(),
                    response;
                xhr.open('GET', apiEnd + '/git/list/' + site, true);
                xhr.onload = function () {
                    response = JSON.parse(xhr.response);
                    if (response.status === 'OK') {
                        if (response.stdout === undefined) {
                            console.log('returning empty array');
                            resolve([]);
                        } else {
                            resolve(response.stdout);
                        }
                    } else {
                        reject({
                            status: response.status,
                            statusText: response.stderr
                        });
                    }
                };
                xhr.onerror = function () {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.send();
            });
        },

        /**
         * Get the api version
         *
         * @since 1.0.0
         *
         * @returns {string}
         */
        getApiVersion: function () {
            return apiVersion;
        },

        /**
         * Get issue details
         *
         * @since 1.0.0
         *
         * @returns {object}
         */
        getIssueDetails: function () {
            return issueDetails;
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
         * Check if the review site is available
         *
         * @since 1.0.0
         */
        getReviewSiteAvailability: function () {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('HEAD', 'https://local.typo3.org/review.php', true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 0 || xhr.status === 400 || xhr.status === 404) {
                            isReviewSiteAvailable = false;
                            publicMethods.addStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
                            reject({
                                status: this.status,
                                statusText: xhr.statusText
                            });
                        } else {
                            isReviewSiteAvailable = true;
                            resolve({
                                status: this.status,
                                statusText: xhr.statusText
                            });
                        }
                    }
                };
                xhr.onerror = function () {
                    isReviewSiteAvailable = false;
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.timeout = 2000;
                xhr.ontimeout = function () {
                    isReviewSiteAvailable = false;
                    publicMethods.addStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.send();
            });
        },

        /**
         * Get TYPO3 sites
         *
         * @since 1.0.0
         */
        getTypo3Sites: function () {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest(),
                    response;
                xhr.open('GET', apiEnd + '/site/list', true);
                xhr.onload = function () {
                    response = JSON.parse(xhr.response);
                    if (response.status === 'OK') {
                        resolve(response.stdout);
                    } else {
                        reject({
                            status: response.status,
                            statusText: response.stderr
                        });
                    }
                };
                xhr.onerror = function () {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.send();
            });
        },

        /**
         * Listen for cherry pick command
         *
         * @since 1.0.0
         */
        listenForCherryPickCommand: function () {
            document.querySelector(prefixId + ' .cherry-pick-form').addEventListener('submit', function (event) {
                event.preventDefault();
                var form = event.target,
                    data = {},
                    ref,
                    revisions = publicMethods.getIssueDetails()[0].revisions,
                    url;
                data.site = form.site.value;
                data.repository = form.repository.value;
                data.revision = form.revision.value;

                // Visit non-inherited enumerable keys
                Object.keys(revisions).forEach(function (key) {
                    if (revisions.hasOwnProperty(key)) {
                        if (parseInt(revisions[key]._number, 10) === parseInt(data.revision, 10)) {
                            ref = revisions[key].fetch['anonymous http'].ref;
                            url = revisions[key].fetch['anonymous http'].url;
                        }
                    }
                });

                console.log(ref, url);
            });
        },

        /**
         * Load the details for a certains issue
         *
         * @since 1.0.0
         *
         * @param url
         */
        loadIssueDetails: function (url) {
            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest(),
                    responseText;
                xhr.open('GET', url, true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            if (xhr.responseText.startsWith(')]}\'')) {
                                responseText = xhr.responseText.substr(4);
                            }
                            issueDetails = JSON.parse(responseText);
                            resolve(issueDetails);
                        } else {
                            reject({
                                status: this.status,
                                statusText: xhr.statusText
                            });
                            publicMethods.addStatusMessage(chrome.i18n.getMessage('issueDetailLoadFail'), 'error');
                        }
                    }
                };
                xhr.send();
            });
        },

        /**
         * Show change information
         *
         * @since 1.0.0
         *
         */
        showChangeInformation: function () {
            var change = publicMethods.getIssueDetails()[0];
            document.querySelector(prefixId + ' .changeInformation .subject').innerText = change.subject;
            document.querySelector(prefixId + ' .changeInformation .project').innerText = change.project;
            document.querySelector(prefixId + ' .changeInformation .branch').innerText = change.branch;
            document.querySelector(prefixId + ' .changeInformation .canMerge').innerText = change.mergeable;
            document.querySelector(prefixId + ' .changeInformation .change-id').innerText = change.change_id;
            document.querySelector(prefixId + ' .changeInformation .commit').innerText = change.current_revision;
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
                            clearStatusMessages();
                            showReviewPopup(event);
                        }, false);
                        parent.appendChild(clone);
                        ++m;
                        ++n;
                    }
                }
                break;
            case 'certificateFailure':
                publicMethods.addStatusMessage(chrome.i18n.getMessage('certificateFailure'), 'error');
                break;
            case 'reviewSiteUnavailable':
                publicMethods.addStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
                break;
            }
            sendResponse({});
        },

        /**
         * Add status message
         *
         * @since 1.0.0
         *
         * @param message
         * @param status
         * @param alternativeDocument
         */
        addStatusMessage: function (message, status, alternativeDocument) {
            var theDocument,
                timers = {};
            if (alternativeDocument !== undefined) {
                theDocument = alternativeDocument;
            } else {
                theDocument = document;
            }

            var timestamp = (new Date).getTime(),
                messageDiv = theDocument.createElement('div'),
                closeButton = theDocument.createElement('div');

            if (status === undefined) {
                status = '2xx';
            } else if (status === 'error') {
                status = '4xx';
            } else {
                status = '4xx';
            }

            hideLoadingIndicator(theDocument);

            messageDiv.id = 'TYPO3Review_' + timestamp;
            messageDiv.innerHTML = message;
            messageDiv.setAttribute('class', 'message fadeIn status' + status);

            closeButton.id = 'TYPO3Review_' + timestamp + '_closeButton';
            closeButton.setAttribute('class', 'closeButton');
            closeButton.innerText = '✖';
            messageDiv.appendChild(closeButton);

            if (theDocument.querySelector(prefixId + ' .status').firstChild) {
                theDocument.querySelector(prefixId + ' .status').insertBefore(
                    messageDiv,
                    theDocument.querySelector(prefixId + ' .status').firstChild
                );
            } else {
                theDocument.querySelector(prefixId + ' .status').appendChild(messageDiv);
            }

            timers.timestamp = new Timer(
                function () {
                    fadeOutStatusMessage(messageDiv.id, alternativeDocument);
                },
                15000
            );

            theDocument.getElementById(messageDiv.id + '_closeButton').addEventListener('click', function () {
                fadeOutStatusMessage(messageDiv.id, alternativeDocument);
            }, false);
        }

    };

    return publicMethods;
}());
