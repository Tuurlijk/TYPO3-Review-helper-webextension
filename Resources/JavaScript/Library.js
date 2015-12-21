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
         * Forger url
         *
         * @since 2.0.0
         *
         * @type {string}
         */
        forgerUrl = 'https://forger.typo3.org/',

        /**
         * Gerrit url
         *
         * @since 2.0.0
         *
         * @type {string}
         */
        gerritUrl = 'https://review.typo3.org/',

        /**
         * Stash url
         *
         * @since 2.0.0
         *
         * @type {string}
         */
        stashUrl = 'https://stash.maxserv.com/',

        /**
         * Tab url
         *
         * @since 2.0.0
         *
         * @type {string}
         */
        tabUrl = '',

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
         * Template code for the popup
         *
         * @since 1.0.0
         *
         * @type {string}
         */
        popupTemplate = '',

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
        document.querySelector(prefixId + ' .status').innerHTML = '';
    }

    /**
     * Create content popup element
     *
     * @since 1.0.0
     *
     */
    function createContentPopup() {
        return Promise.resolve({status: 'OK'})
            .then(function () {
                if (popupTemplate === '') {
                    return fetchPopupTemplate();
                } else {
                    return Promise.resolve(popupTemplate);
                }
            })
            .then(function (template) {
                if (popupTemplate === '') {
                    popupTemplate = template.replace(/<link[^>]*>/g, '');
                }

                var containerDiv = document.createElement('div');
                containerDiv.id = prefixId.replace(/\#/g, '');
                containerDiv.innerHTML = popupTemplate;
                containerDiv.querySelector(prefixId + ' .closeButton').classList.remove('hide');
                containerDiv.classList.add('normalMode');

                containerDiv.querySelector(prefixId + ' .throbber').style.backgroundImage = "url('" + chrome.extension.getURL('Resources/Images/throbber.svg') + "')";

                if (document.getElementsByTagName('body')[0]) {
                    document.getElementsByTagName('body')[0].appendChild(containerDiv);
                } else {
                    document.getElementsByTagName('html')[0].appendChild(containerDiv);
                }

                var elements = containerDiv.querySelectorAll('link, script'),
                    index;
                for (index = elements.length - 1; index >= 0; index--) {
                    elements[index].parentNode.removeChild(elements[index]);
                }

                document.querySelector(prefixId + ' .closeButton').addEventListener('click', function () {
                    document.querySelector(prefixId).classList.add('hide');
                }, false);
            });
    }

    /**
     * Execute git pull command
     *
     * @since 1.0.0
     *
     * @param data
     */
    function executeGitPull(data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest(),
                response;
            xhr.open('GET', apiEnd + '/git/pull/' + data.site + '/' + data.repository, true);
            xhr.onload = function () {
                response = JSON.parse(xhr.response);
                if (response.status === 'OK') {
                    resolve({
                        status: response.status,
                        stdout: response.stdout,
                        stderr: response.stderr
                    });
                } else {
                    reject({
                        status: response.status,
                        stderr: response.stderr,
                        stdout: response.stdout
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
    }

    /**
     * Execute git reset command
     *
     * @since 1.0.0
     *
     * @param data
     */
    function executeGitReset(data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest(),
                response;
            xhr.open('GET', apiEnd + '/git/reset/' + data.site + '/' + data.repository, true);
            xhr.onload = function () {
                response = JSON.parse(xhr.response);
                if (response.status === 'OK') {
                    resolve({
                        status: response.status,
                        stdout: response.stdout,
                        stderr: response.stderr
                    });
                } else {
                    reject({
                        status: response.status,
                        stderr: response.stderr,
                        stdout: response.stdout
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
    }

    /**
     * Execute git status command
     *
     * @since 1.0.0
     *
     * @param data
     */
    function executeGitStatus(data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest(),
                response;
            xhr.open('GET', apiEnd + '/git/status/' + data.site + '/' + data.repository.replace(/\//g, '!'), true);
            xhr.onload = function () {
                response = JSON.parse(xhr.response);
                if (response.status === 'OK') {
                    resolve({
                        status: response.status,
                        stdout: response.stdout,
                        stderr: response.stderr
                    });
                } else {
                    reject({
                        status: response.status,
                        stderr: response.stderr,
                        stdout: response.stdout
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
    }

    /**
     * Execute git cherry pick command
     *
     * @since 1.0.0
     *
     * @param data
     */
    function executeGitCherryPick(data) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest(),
                parameters = '?change=' + encodeURIComponent(data.change) + '&fetchUrl=' + encodeURIComponent(data.fetchUrl),
                response;
            xhr.open('GET', apiEnd + '/git/pick/' + data.site + '/' + data.repository + parameters, true);
            xhr.onload = function () {
                response = JSON.parse(xhr.response);
                if (response.status === 'OK') {
                    resolve({
                        status: response.status,
                        stdout: response.stdout,
                        stderr: response.stderr
                    });
                } else {
                    reject({
                        status: response.status,
                        stderr: response.stderr,
                        stdout: response.stdout
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
    }

    /**
     * Fade out infoBox and remove after 1 second
     *
     * @since 1.0.0
     *
     * @param timestamp
     * @param alternativeDocument
     *
     * @return {*}  Not defined.
     */
    function fadeOutStatusMessage(timestamp, alternativeDocument) {
        var index, theDocument;
        if (alternativeDocument !== undefined) {
            theDocument = alternativeDocument;
        } else {
            theDocument = document;
        }

        var messages = theDocument.querySelectorAll(prefixId + ' .message.' + timestamp);

        for (index = 0; index < messages.length; ++index) {
            messages[index].classList.remove('fadeIn');
            messages[index].classList.add('fadeOut');
        }

        new Timer(
            function () {
                removeStatusMessage(timestamp, alternativeDocument);
            },
            1000
        );
    }

    /**
     * Fetch popup template
     *
     * @since 1.0.0
     *
     */
    function fetchPopupTemplate() {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', chrome.extension.getURL('Resources/HTML/Popup.html'), true);
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
        });
    }

    /**
     * Get forger url
     *
     * @since 2.0.0
     *
     * @returns {string}
     */
    function getForgerUrl() {
        if (localStorage) {
            if (localStorage.forgerUrl) {
                forgerUrl = localStorage.forgerUrl;
            }
        }
        return forgerUrl;
    }

    /**
     * Get gerrit url
     *
     * @since 2.0.0
     *
     * @returns {string}
     */
    function getGerritUrl() {
        if (localStorage) {
            if (localStorage.gerritUrl) {
                gerritUrl = localStorage.gerritUrl;
            }
        }
        return gerritUrl;
    }

    /**
     * Get stash url
     *
     * @since 2.0.0
     *
     * @returns {string}
     */
    function getStashUrl() {
        if (localStorage) {
            if (localStorage.stashUrl) {
                stashUrl = localStorage.stashUrl;
            }
        }
        return stashUrl;
    }

    /**
     * Get tab url
     *
     * @since 2.0.0
     *
     * @returns {string}
     */
    function getTabUrl() {
        return tabUrl;
    }

    /**
     * Remove infoBox
     *
     * @since 1.0.0
     *
     * @param timestamp
     * @param alternativeDocument
     *
     * @return {*}  Not defined.
     */
    function removeStatusMessage(timestamp, alternativeDocument) {
        var index, theDocument;
        if (alternativeDocument !== undefined) {
            theDocument = alternativeDocument;
        } else {
            theDocument = document;
        }
        var messages = theDocument.querySelectorAll(prefixId + ' .message.' + timestamp);

        for (index = 0; index < messages.length; ++index) {
            messages[index].style.display = 'none';
        }
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
     * Show command result
     *
     * @since 1.0.0
     *
     * @param result
     */
    function showCommandResult(result) {
        if (result.stdout) {
            publicMethods.addStatusMessage('<pre>' + result.stdout.join("\n") + '</pre>');
        }
        if (result.stderr) {
            if (result.status === 'OK') {
                publicMethods.addStatusMessage('<pre>' + result.stderr.join("\n") + '</pre>');
            } else {
                publicMethods.addStatusMessage('<pre>' + result.stderr.join("\n") + '</pre>', 'error');
            }
        }
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
     * @since 0.0.0
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
     * Open review sites
     *
     * @since 1.0.0
     *
     * @param site
     */
    function openSite(site) {
        var url = 'http://' + site + '/typo3/';
        console.log(url);
        if (chrome.tabs !== undefined) {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                chrome.tabs.create({
                    'url': url,
                    'index': tabs[0].index + 1,
                    'active': false
                });
            });
        }

        if (activeTabId !== undefined) {
            chrome.runtime.sendMessage({
                from: 'library',
                cmd: 'openTab',
                url: url,
                index: activeTabId + 1
            }, function () {
            });
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
     * Set tab url
     *
     * @since 2.0.0
     *
     * @param url
     */
    function setTabUrl(url) {
        tabUrl = url;
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
     * Show content popup
     *
     * @since 1.0.0
     *
     * @param event
     */
    function showContentPopup(event) {
        var url = publicMethods.getChangeDetailUrl(event.target.parentElement.href),
            revision = 'latest',
            popup;

        popup = document.querySelector(prefixId);
        popup.classList.remove('hide');
        event.target.parentElement.parentElement.appendChild(popup);

        // Make sure the popup can scroll with the buttons in the table cell
        event.target.parentElement.parentElement.style.position = 'relative';

        // Set the review api version
        publicMethods.populatePopup(url, revision);
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
            var select = '<select name="repository">';
            items.forEach(function (item) {
                select += '<option value="' + item + '">' + item + '</option>';
            });
            select += '</select><br/>';

            document.querySelector(prefixId + ' .repositorySelector').innerHTML = select;
            document.querySelector(prefixId + ' .repositorySelector select').addEventListener('change', function () {
                publicMethods.setUserDefault('repository', this.value);
                publicMethods.showRepositoryInformation();
            });
            document.querySelector(prefixId + ' .repositorySelector select').value = publicMethods.getUserDefault('repository');

            hideLoadingIndicator();
        },

        /**
         * Create review selector
         *
         * @since 1.0.0
         *
         * @param revision
         */
        createReviewSelector: function (revision) {
            showLoadingIndicator();
            var revisions,
                selected = '',
                cherryPickCommand = '',
                response = publicMethods.getIssueDetails(),
                revisionOptions = '<select name="revision">';

            if (getTabUrl().startsWith(getGerritUrl())) {
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
            }
            if (getTabUrl().startsWith(getStashUrl())) {
                cherryPickCommand = response.fromRef;
                if (cherryPickCommand !== '') {
                    revisionOptions += '<option value="' + response.id + '" ' + selected + ' selected="selected">pull-request ' + response.id + '</option>';
                }
            }
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
                var select = '<select name="site">';
                items.forEach(function (item) {
                    select += '<option value="' + item + '">' + item + '</option>';
                });
                select += '</select><br/>';

                document.querySelector(prefixId + ' .siteSelector').innerHTML = select;
                document.querySelector(prefixId + ' .siteSelector select').addEventListener('change', function () {
                    showLoadingIndicator();
                    publicMethods.setUserDefault('site', this.value);
                    publicMethods.getGitRepositories(this.value)
                        .then(function (gitRepositories) {
                            publicMethods.createRepositorySelector(gitRepositories);
                            hideLoadingIndicator();
                        })
                        .then(function () {
                            publicMethods.showRepositoryInformation();
                        })
                        .catch(function () {
                        });
                });
                document.querySelector(prefixId + ' .siteSelector select').value = publicMethods.getUserDefault('site');

                hideLoadingIndicator();
                resolve();
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
                    resolve({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.timeout = 2000;
                xhr.ontimeout = function () {
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
                index,
                issueNumber,
                hashParts,
                pathSegments,
                shiftCount,
                revision = 'latest',
                detailUrl = '';
            parser.href = url;

            // Gerrit url
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

            if (parser.pathname.indexOf('\/pull-requests\/') > -1) {
                pathSegments = parser.pathname.split('/').reverse();

                for (index = 0; index < pathSegments.length; index = index + 1) {
                    issueNumber = pathSegments[index];
                    issueNumber = parseInt(issueNumber, 10);
                    if ((typeof issueNumber === 'number') && (issueNumber % 1 === 0) && issueNumber > 0) {
                        break;
                    }
                }

                pathSegments = pathSegments.reverse();
                for (shiftCount = 0; shiftCount < index; shiftCount = shiftCount + 1) {
                    pathSegments.pop();
                }

                if (issueNumber !== undefined) {
                    // https://stash.maxserv.com/rest/api/latest/projects/TUE/repos/tue.nl/pull-requests/85
                    detailUrl = parser.protocol + '//' + parser.hostname + '/rest/api/latest' + pathSegments.join('/');
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
                            publicMethods.addStatusMessage(chrome.i18n.getMessage('reviewSiteUnavailable'), 'error');
                            reject({
                                status: this.status,
                                statusText: xhr.statusText
                            });
                        } else {
                            resolve({
                                status: this.status,
                                statusText: xhr.statusText
                            });
                        }
                    }
                };
                xhr.onerror = function () {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.timeout = 2000;
                xhr.ontimeout = function () {
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
         * Get user default
         *
         * @since 1.0.0
         *
         * @param name
         */
        getUserDefault: function (name) {
            var userDefaults = {
                openSite: true,
                repository: 'typo3_src',
                pullRepository: true,
                resetRepository: true,
                site: 'review.local.typo3.org'
            };
            if (localStorage && localStorage.userDefaults && localStorage.userDefaults.length > 2) {
                userDefaults = JSON.parse(localStorage.userDefaults);
            }
            return userDefaults[name];
        },

        /**
         * Get user defaults
         *
         * @since 1.0.0
         */
        getUserDefaults: function () {
            var userDefaults = {
                openSite: true,
                repository: 'typo3_src',
                pullRepository: true,
                resetRepository: true,
                site: 'review.local.typo3.org'
            };
            if (localStorage && localStorage.userDefaults && localStorage.userDefaults.length > 2) {
                userDefaults = JSON.parse(localStorage.userDefaults);
            }
            return userDefaults;
        },

        /**
         * Listen for cherry pick command
         *
         * @since 1.0.0
         */
        listenForCherryPickCommand: function () {
            document.querySelector(prefixId + ' .cherry-pick-form').addEventListener('submit', function (event) {
                showLoadingIndicator();
                event.preventDefault();
                var form = event.target,
                    data = {},
                    change = '',
                    issueDetails = publicMethods.getIssueDetails(),
                    fetchUrl = '',
                    revisions;

                if (getTabUrl().startsWith(getGerritUrl())) {
                    revisions = issueDetails[0].revisions;
                    // Visit non-inherited enumerable keys
                    Object.keys(revisions).forEach(function (key) {
                        if (revisions.hasOwnProperty(key)) {
                            if (parseInt(revisions[key]._number, 10) === parseInt(form.revision.value, 10)) {
                                change = revisions[key].fetch['anonymous http'].ref;
                                fetchUrl = revisions[key].fetch['anonymous http'].url;
                            }
                        }
                    });
                }
                if (getTabUrl().startsWith(getStashUrl())) {
                    change = issueDetails.fromRef.id;
                    fetchUrl = issueDetails.fromRef.repository.cloneUrl;
                }

                data.change = change;
                data.fetchUrl = fetchUrl;
                data.site = form.site.value;
                data.repository = form.repository.value;

                console.log(data);
                Promise.resolve({status: 'OK'})
                    .then(function () {
                        if (form.resetRepository.checked === true) {
                            showLoadingIndicator();
                            return executeGitReset(data);
                        } else {
                            return Promise.resolve({status: 'OK'});
                        }
                    })
                    .then(function (result) {
                        showCommandResult(result);
                        if (form.pullRepository.checked === true) {
                            showLoadingIndicator();
                            return executeGitPull(data);
                        } else {
                            return Promise.resolve({status: 'OK'});
                        }
                    })
                    .then(function (result) {
                        showCommandResult(result);
                        showLoadingIndicator();
                        return executeGitCherryPick(data);
                    })
                    .then(function (result) {
                        showCommandResult(result);
                        publicMethods.showRepositoryInformation();
                        if (form.openSite.checked === true) {
                            openSite(form.site.value);
                        }
                    })
                    .catch(function (error) {
                        showCommandResult(error);
                    });
            });
        },

        /**
         * Listen for form changes
         *
         * @since 1.0.0
         */
        listenForFormChanges: function () {
            document.querySelector(prefixId + ' .openSite').addEventListener('change', function () {
                publicMethods.setUserDefault('openSite', this.checked);
            });
            document.querySelector(prefixId + ' .pullRepository').addEventListener('change', function () {
                publicMethods.setUserDefault('pullRepository', this.checked);
            });
            document.querySelector(prefixId + ' .resetRepository').addEventListener('change', function () {
                publicMethods.setUserDefault('resetRepository', this.checked);
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
                            if (url.startsWith(getGerritUrl()) && xhr.responseText.startsWith(')]}\'')) {
                                responseText = xhr.responseText.substr(4);
                            } else {
                                responseText = xhr.responseText;
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
         * Populate the popup
         *
         * @param url
         * @param revision
         */
        populatePopup: function (url, revision) {
            setTabUrl(url);
            publicMethods.detectApiVersion()
                .then(function () {
                    if (publicMethods.getApiVersion() === 0) {
                        return publicMethods.getReviewSiteAvailability();
                    } else {
                        return {status: true};
                    }
                })
                .then(function (result) {
                    if (url && result !== undefined) {
                        return publicMethods.loadIssueDetails(url);
                    } else {
                        reject({});
                    }
                })
                .then(function (issueDetails) {
                    if (publicMethods.getApiVersion() === 0) {
                        publicMethods.createReviewButtons(issueDetails, revision);
                    } else {
                        return publicMethods.getTypo3Sites();
                    }
                })
                .then(function (sites) {
                    if (sites.length > 0) {
                        publicMethods.showChangeInformation();
                        publicMethods.createReviewSelector(revision);
                        return publicMethods.createSiteSelector(sites);
                    }
                })
                .then(function () {
                    return publicMethods.getGitRepositories(publicMethods.getUserDefault('site'));
                })
                .then(function (gitRepositories) {
                    publicMethods.createRepositorySelector(gitRepositories);
                    publicMethods.showRepositoryInformation();
                    publicMethods.setFormDefaults();
                    publicMethods.listenForFormChanges();
                    publicMethods.listenForCherryPickCommand();
                })
                .catch(function () {
                });
        },

        /**
         * Set form defaults
         *
         * @since 1.0.0
         */
        setFormDefaults: function () {
            document.querySelector(prefixId + ' .openSite').checked = publicMethods.getUserDefault('openSite');
            document.querySelector(prefixId + ' .pullRepository').checked = publicMethods.getUserDefault('pullRepository');
            document.querySelector(prefixId + ' .resetRepository').checked = publicMethods.getUserDefault('resetRepository');
        },

        /**
         * Set user default
         *
         * @since 1.0.0
         *
         * @param name
         * @param value
         */
        setUserDefault: function (name, value) {
            var userDefaults = {
                openSite: true,
                repository: 'typo3_src',
                pullRepository: true,
                resetRepository: true,
                site: 'review.local.typo3.org'
            };
            if (localStorage && localStorage.userDefaults && localStorage.userDefaults.length > 2) {
                userDefaults = JSON.parse(localStorage.userDefaults);
            }
            userDefaults[name] = value;
            localStorage.removeItem('userDefaults');
            localStorage.setItem('userDefaults', JSON.stringify(userDefaults));
        },

        /**
         * Show change information
         *
         * @since 1.0.0
         *
         */
        showChangeInformation: function () {
            var change = publicMethods.getIssueDetails();
            if (getTabUrl().startsWith(getGerritUrl())) {
                change = change[0];
                document.querySelector(prefixId + ' .changeInformation .subject').innerText = change.subject;
                document.querySelector(prefixId + ' .changeInformation .project').innerText = change.project;
                document.querySelector(prefixId + ' .changeInformation .branch').innerText = change.branch;
                document.querySelector(prefixId + ' .changeInformation .canMerge').innerHTML = change.mergeable ? '<span class="status2xx">' + change.mergeable + '</span>' : '<span class="status4xx">' + change.mergeable + '</span>';
                document.querySelector(prefixId + ' .changeInformation .change-id').innerText = change.change_id;
                document.querySelector(prefixId + ' .changeInformation .commit').innerText = change.current_revision;
            }
            if (getTabUrl().startsWith(getStashUrl())) {
                document.querySelector(prefixId + ' .changeInformation .subject').innerText = change.title;
                document.querySelector(prefixId + ' .changeInformation .project').innerText = change.fromRef.repository.name;
                document.querySelector(prefixId + ' .changeInformation .branch').innerText = change.fromRef.displayId;
                document.querySelector(prefixId + ' .changeInformation .change-id').innerText = change.fromRef.latestChangeset;
                document.querySelector(prefixId + ' .changeInformation .commit').innerText = change.fromRef.latestCommit;
            }
        },

        /**
         * Show repository information
         *
         * @since 1.0.0
         *
         */
        showRepositoryInformation: function () {
            var form = document.querySelector(prefixId + ' .cherry-pick-form'),
                data = {
                    site: form.site.value,
                    repository: form.repository.value
                };
            executeGitStatus(data)
                .then(function (result) {
                    if (result.status === 'OK') {
                        document.querySelector(prefixId + ' .repositoryInformation .sha1').innerHTML = result.stdout[0].sha1;
                        document.querySelector(prefixId + ' .repositoryInformation .subject').innerHTML = result.stdout[0].subject;
                        document.querySelector(prefixId + ' .repositoryInformation .subject').setAttribute('title', result.stdout[0].subject);
                    }
                });
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
                createContentPopup();
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
                            // Make sure the popup can scroll with the buttons in the table cell
                            event.target.parentElement.parentElement.style.position = 'relative';
                            clearStatusMessages();
                            showContentPopup(event);
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

            var timestamp = 't' + (new Date).getTime(),
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

            messageDiv.innerHTML = message;
            messageDiv.classList.add(timestamp, 'message', 'fadeIn', 'status' + status);

            closeButton.classList.add('closeButton');
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
                    fadeOutStatusMessage(timestamp, alternativeDocument);
                },
                15000
            );

            theDocument.querySelector(prefixId + ' .message.' + timestamp + ' .closeButton').addEventListener('click', function () {
                fadeOutStatusMessage(timestamp, alternativeDocument);
            }, false);
        }

    };

    return publicMethods;
}());
