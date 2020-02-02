// ==UserScript==
// @namespace   Apigee
// @name        filter-policy-list
// @description Filter the list of policies in the policy picker
// @match       https://apigee.com/platform/*/proxies/*/develop/*
// @grant       none
// @copyright   2019-2020 Google LLC
// @version     0.1.1
// @run-at      document-end
// @license     Apache 2.0
// ==/UserScript==

/* jshint esversion: 9 */
/* global fetch */

(function (globalScope){
  const delayAfterPageLoad = 800,
        delayAfterFoundElement = 650,
        debounceInterval = 390;

  let timerControl = {};

  const log = function(){
          Function.prototype.apply.apply(console.log, [console, arguments]);
        };

  function waitForPredicate(predicate, action, controlKey) {
    controlKey = controlKey || Math.random().toString(36).substring(2,15);
    //log('waitForPredicate: controlkey= ' + controlKey);
    let interval = timerControl[controlKey];
    //log('waitForPredicate: interval= ' + interval);
    let found = predicate();

    if (found) {
      //log('waitForPredicate: found= ' + found);
      action(found);
      if (interval) {
        //log('waitForPredicate: clearInterval ' + found);
        clearInterval (interval);
        delete timerControl[controlKey];
      }
      else {
        //log('waitForPredicate: there is no interval set.');
      }
    }
    else {
      if ( ! interval) {
        timerControl[controlKey] = setInterval ( function () {
          waitForPredicate(predicate, action, controlKey);
        }, 300);
      }
    }
  }

  function getElementsByTagAndClass(root, tag, clazz) {
    var nodes = root.getElementsByClassName(clazz);
    if (tag) {
      var tagUpper = tag.toUpperCase();
      nodes = Array.prototype.filter.call(nodes,
                                          testElement => testElement.nodeName.toUpperCase() === tagUpper );
    }
    return nodes;
  }

  function debounce(callback, interval) {
    let debounceTimeoutId;
    return function(...args) {
      if (debounceTimeoutId) { clearTimeout(debounceTimeoutId); }
      debounceTimeoutId = setTimeout(() => callback.apply(this, args), interval);
    };
  }

  function applyFilter(event) {
    let firstPolicyListDiv = document.querySelector('div.policyList');
    let nodes = getElementsByTagAndClass(firstPolicyListDiv, 'ul', 'ng-scope');

    if (nodes) {
      let n = getElementsByTagAndClass(document, 'input', 'policy-list-filter-box');
      if (n && n.length == 1) {
        let filterInput = n[0],
            re0 = new RegExp('[^\dA-Za-z ]', 'g'),
            cleanFilter = filterInput.value.replace(re0, ''),
            re1 = new RegExp(cleanFilter, 'i');
        Array.prototype.forEach.call(nodes, (ul) => {
          let items = ul.getElementsByTagName('li');
          Array.prototype.forEach.call(items, (li) => {
            let spans = getElementsByTagAndClass(li, 'span', 'policyText');
            if (spans && spans.length == 1) {
              let match = re1.exec(spans[0].innerHTML);
              if ( ! match) {
                li.setAttribute('style', 'display: none;');
              }
              else {
                li.setAttribute('style', 'display: initial;');
              }
            }
          });
        });
      }
    }
  }

  function addFilterBox() {
    log('Apigee UE policy list - addFilterBox()');
    let nodes = getElementsByTagAndClass(document, 'div', 'policies-panel');

    if (nodes && nodes.length == 1) {
      let outerContainerDiv = document.createElement('div');
      outerContainerDiv.setAttribute('class', 'filter-outer-container');
      outerContainerDiv.setAttribute('style', 'margin-bottom: 10px;');

      let label = document.createElement('label');
      label.setAttribute('class', 'control-label');
      label.innerHTML = 'Filter';
      label.setAttribute('style', 'width: 120px;');
      outerContainerDiv.appendChild(label);

      let filterbox = document.createElement('input');
      filterbox.innerHTML = '';
      filterbox.setAttribute('type', 'text');
      filterbox.setAttribute('title', 'filter');
      filterbox.setAttribute('class', 'policy-list-filter-box');
      filterbox.addEventListener('input', debounce(applyFilter, debounceInterval));
      filterbox.setAttribute('style', 'width: 240px;');

      let innerContainerDiv = document.createElement('div');
      innerContainerDiv.setAttribute('style', 'margin-left: 130px;');
      innerContainerDiv.appendChild(filterbox);

      outerContainerDiv.appendChild(innerContainerDiv);

      let policiesPanel = nodes[0],
          form = policiesPanel.parentNode;
      form.insertBefore(outerContainerDiv, policiesPanel);
    }
  }

  function onPlusPolicy(event) {
    setTimeout(addFilterBox, 630);
    return true;
  }

  function addPlusPolicyButtonClickHandlers() {
    let buttons = getPlusPolicyButtons();
    if (buttons && buttons.length == 3) {
      buttons.forEach( (button) => button.addEventListener('click', onPlusPolicy) );
    }
  }

  function getPlusPolicyButtons() {
    // There will be three buttons: onein the policy list, one in
    // each of request and response in the center canvas.

    let b1 = document.querySelector('div.policiesnode > div > button.btn-mini.right');
    if (b1 == null) {
      return null;
    }

    var buttons = getElementsByTagAndClass(document, 'a', 'attachPolicyToSegment');
    if ( ! buttons || buttons.length != 2) {
      return null;
    }

    return [b1, buttons[0], buttons[1]];
  }


  setTimeout(function() {
    log('Apigee UE Policy list filter tweak running: ' + window.location.href);
    waitForPredicate(getPlusPolicyButtons, function() {
      log('Apigee UE Undeploy - got plus-policy buttons');
      addPlusPolicyButtonClickHandlers();
    });
  }, delayAfterPageLoad);

}(this));
