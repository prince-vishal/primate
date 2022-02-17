/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isObject, randomHex} from '../../lib/core-toolkit.js';

const {document} = window;

/**
 * Finds the index of an LI element among its siblings.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {HTMLInputElement} inputElement - The current checkbox input.
 * @return {number} The index.
 */
function findItemIndex(listElement, inputElement) {
    const liElement = inputElement.closest('li');
    const {identifier} = liElement.dataset;

    let index = 0;

    for (let child in listElement.children) {
        if (child.dataset.identifier === identifier) {
            break;
        }

        index++;
    }

    return index;
}

/**
 * Creates LI nodes with token values under the specified UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {Object[]|string[]} available - An array of nodeValue - displayText pair.
 * @param {string[]} selected - An array of items to be marked as selected.
 * @return {Object[]} The added token array.
 */
function attachItemElements(listElement, available, selected = []) {
    for (let item of available) {
        let {nodeValue, displayText} = isObject(item) ? item : {nodeValue: item, displayText: item};

        let itemElement = document.createElement('li');
        let inputElement = document.createElement('input');
        let labelElement = document.createElement('label');

        itemElement.identifier = randomHex();

        inputElement.type = 'checkbox';
        inputElement.value = nodeValue;

        if (selected.indexOf(nodeValue) >= 0) {
            inputElement.checked = true;
        }

        labelElement.appendChild(inputElement);
        labelElement.append(`\u00A0 ${displayText}`);

        itemElement.appendChild(labelElement);
        listElement.appendChild(itemElement);
    }

    return available;
}

/**
 * Removes all LI nodes from the UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @return {number} - The number of items removed.
 */
function clearItemElements(listElement) {
    const length = 0;

    while (listElement.firstChild !== null) {
        listElement.removeChild(listElement.lastChild);
    }

    return length;
}

/**
 * Checks the input elements as per the values in items array.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {string[]} selected - An array of nodeValues to be checked.
 * @return {number} - The number of items checked.
 */
function checkSelectedItems(listElement, selected) {
    let counter = 0;

    for (let child of listElement.children) {
        let inputElement = child.querySelector('input[type="checkbox"]');

        if (selected.indexOf(inputElement.value) >= 0) {
            inputElement.checked = true;
        }
    }

    return counter;
}

/**
 * Initializes the multi-check directive.
 *
 * @param {Object} scope - The injected scope object.
 * @property {string[]=} scope.available - An array of available items to be checked
 * @property {string[]=} scope.selected - An array of items selected from available list
 * @param {Object} element - The parent element wrapped as jqLite object.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element) {
    if (!Array.isArray(scope.selected) || !Array.isArray(scope.available)) {
        return false;
    }

    /** @type HTMLElement */
    const parentElement = element[0];

    const childElements = {};
    childElements.listElement = parentElement.querySelector('ul.multi-check__list');

    const onSelectedListUpdated = (current, previous) => {
        if (!Array.isArray(previous) || current.length !== previous.length) {
            return checkSelectedItems(childElements.listElement, current);
        }

        return false;
    };

    const onAvailableListUpdated = (current, previous) => {
        clearItemElements(childElements.listElement);

        if (!Array.isArray(current) || current.length === 0) {
            return false;
        }

        if (!Array.isArray(previous) || current.length !== previous.length) {
            const items = attachItemElements(childElements.listElement, current, scope.selected);
            return items.length >= 1;
        }

        return false;
    };

    childElements.listElement.addEventListener('click', (event) => {
        const {target} = event;

        if (target.nodeName !== 'INPUT') {
            return false;
        }

        if (target.checked === true) {
            scope.selected.push(target.value);
        } else {
            const position = findItemIndex(childElements.listElement, target);
            scope.selected.splice(position, 1);
        }
    });

    scope.$watch('selected', onSelectedListUpdated, false);
    scope.$watch('available', onAvailableListUpdated, false);
}

export default function MultiCheckDirective() {
    const template = '<ul class="multi-check__list"></ul>';

    return {
        transclude: false,
        restrict: 'E',
        require: ['ngModel'],
        scope: {selected: '=ngModel', available: '=optionList'},
        link,
        template
    };
}
