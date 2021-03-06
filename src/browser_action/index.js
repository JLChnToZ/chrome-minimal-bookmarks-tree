/* global window,document,localStorage */

import * as autoScroll from 'dom-autoscroller';
import {
  nothing,
  translateDocument,
  hasClass,
  addClass,
  removeClass,
  getElementData,
  elementIndex,
  openBookmark,
} from '../common/functions';
import {
  buildTree,
  setElementDimensions,
  toggleFolder,
  showContextMenuFolder,
  showContextMenuBookmark,
  openAllBookmarks,
  removeContextMenu,
} from './functions';
import SettingsFactory from '../common/settings_factory';
import dragula from '../../node_modules/dragula/dragula';

(function init(settings, chrome) {
  let scrollTimeout;
  let initialIndexOfDraggable;
  const font = settings.get('font', '__default__');
  const hideEmptyFolders = settings.get('hide_empty_folders');
  const startWithAllFoldersClosed = settings.get('start_with_all_folders_closed');
  const loading = document.querySelector('#loading');
  const bm = document.querySelector('#bookmarks');

  chrome.bookmarks.getTree((bookmarksTree) => {
    const otherBookmarks = buildTree(
      bookmarksTree[0].children[1],
      hideEmptyFolders,
      startWithAllFoldersClosed,
      true,
    );

    delete bookmarksTree[0].children[1];
    const bookmarksFolder = buildTree(
      bookmarksTree[0],
      hideEmptyFolders,
      startWithAllFoldersClosed,
      true,
    );

    if (bookmarksFolder) {
      bm.appendChild(bookmarksFolder);
      bm.childNodes.forEach((item) => {
        if (item.nodeName !== 'LI') {
          return;
        }
        addClass(item, 'nosort');
      });
    }
    if (otherBookmarks) {
      bm.appendChild(otherBookmarks);
    }

    bm.addEventListener('click', (event) => {
      if (!event.target || event.target.nodeName !== 'SPAN') {
        return false;
      }

      document.querySelectorAll('.selected').forEach((element) => {
        removeClass(element, 'selected');
      });

      if (document.querySelector('#contextMenu').length) {
        removeContextMenu();

        return nothing(event);
      }

      if (hasClass(event.target.parentNode, 'folder')) {
        toggleFolder(event.target.parentNode);

        return false;
      }

      if (event.button !== 0) {
        return false;
      }

      let actionType = 'click_action';

      if (event.ctrlKey || event.metaKey) {
        actionType = 'super_click_action';
      }

      const url = getElementData(event.target.parentNode, 'url');
      openBookmark(url, settings.get(actionType));

      return nothing(event);
    });

    bm.addEventListener('contextmenu', (event) => {
      if (!event.target || event.target.nodeName !== 'SPAN') {
        return nothing(event);
      }
      document.querySelectorAll('.selected').forEach((element) => {
        removeClass(element, 'selected');
      });
      removeContextMenu();
      if (hasClass(event.target.parentNode, 'folder')) {
        showContextMenuFolder(event.target.parentNode, {
          x: event.pageX,
          y: event.pageY,
        });

        return nothing(event);
      }

      showContextMenuBookmark(event.target.parentNode, {
        x: event.pageX,
        y: event.pageY,
      });

      return nothing(event);
    });

    bm.addEventListener('mousedown', (event) => {
      if (!event.target || event.target.nodeName !== 'SPAN') {
        return false;
      }
      document.querySelectorAll('.selected').forEach((element) => {
        removeClass(element, 'selected');
      });
      removeContextMenu();

      if (event.button === 1) {
        if (hasClass(event.target.parentNode, 'folder')) {
          openAllBookmarks(event.target.parentNode);

          return nothing(event);
        }
        const url = getElementData(event.target.parentNode, 'url');
        openBookmark(url, settings.get('middle_click_action'));
      }

      return false;
    });

    bm.style.display = 'block';
    loading.parentNode.removeChild(loading);

    if (settings.get('remember_scroll_position')) {
      const scrolltop = localStorage.getItem('scrolltop');
      if (scrolltop !== null) {
        setTimeout(() => {
          document.querySelector('#wrapper').scrollTop = parseInt(scrolltop, 10);
        }, 100);
      }
    }

    const drake = dragula([bm], {
      isContainer: element => hasClass(element, 'sub'),
      moves: element => !hasClass(element, 'nosort'),
      accepts: (element, target) => {
        if (element.parentNode.getAttribute('id') === 'bookmarks' && elementIndex(element) === 0) {
          return false;
        }

        return (hasClass(element, 'folder') || hasClass(target, 'sub'));
      },
      revertOnSpill: true,
    }).on('drag', (element) => {
      initialIndexOfDraggable = elementIndex(element);
    }).on('drop', (element) => {
      const options = {
        index: elementIndex(element),
      };

      if (options.index > initialIndexOfDraggable) {
        // we need to compensate for the original element that was
        // in the tree but has been moved down
        options.index++;
      }

      if (element.parentNode.getAttribute('id') === 'bookmarks') {
        options.index--;
      } else {
        options.parentId = getElementData(element.parentNode.parentNode, 'item-id');
      }

      chrome.bookmarks.move(getElementData(element, 'item-id'), options);
    });

    autoScroll([
      document.querySelector('#wrapper'),
    ], {
      margin: 20,
      maxSpeed: 5,
      scrollWhenOutside: true,
      autoScroll: function autoScrollCheck() { return this.down && drake.dragging; },
    });
  });

  document.addEventListener('contextmenu', () => false);

  document.querySelector('#wrapper').addEventListener('scroll', () => {
    if (settings.get('remember_scroll_position')) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        localStorage.setItem('scrolltop', document.querySelector('#wrapper').scrollTop);
      }, 100);
    }
  });

  translateDocument(window.document);

  chrome.tabs.query({ active: true }, () => {
    setElementDimensions(
      document.querySelector('#wrapper'),
      parseInt(settings.get('width'), 10),
      parseInt(settings.get('height'), 10),
    );
  });

  const htmlBodyElement = document.querySelector('body');

  if (font !== '__default__') {
    htmlBodyElement.style.fontFamily = `"${font}"`;
  }

  const theme = settings.get('theme');

  addClass(htmlBodyElement, `theme--${theme}`);
}(SettingsFactory.create(), window.chrome));
