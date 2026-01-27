function dispatchInputEvents(target: HTMLElement) {
  target.dispatchEvent(new Event('input', {bubbles: true}));
  target.dispatchEvent(new Event('change', {bubbles: true}));
}

function insertIntoInput(target: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  target.setRangeText(text, start, end, 'end');
  dispatchInputEvents(target);
}

function insertIntoContentEditable(target: HTMLElement, text: string) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  if (document.queryCommandSupported('insertText')) {
    document.execCommand('insertText', false, text);
  } else if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  dispatchInputEvents(target);
}

function insertText(text: string) {
  const active = document.activeElement as HTMLElement | null;
  if (!active) {
    return;
  }
  if (active instanceof HTMLInputElement) {
    if (['checkbox', 'radio', 'button', 'submit', 'reset', 'file'].includes(active.type)) {
      return;
    }
    insertIntoInput(active, text);
    return;
  }
  if (active instanceof HTMLTextAreaElement) {
    insertIntoInput(active, text);
    return;
  }
  if (active.isContentEditable) {
    insertIntoContentEditable(active, text);
  }
}

chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'INSERT' && typeof message.text === 'string') {
    insertText(message.text);
  }
});
