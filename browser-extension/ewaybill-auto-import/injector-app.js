// Runs on the JK EWayBill screen (localhost:3000/ewaybill).
//
// Watches for newly-scraped EWB numbers (written by scraper-gov-portal.js
// into chrome.storage.local) and auto-fills + auto-submits them using the
// EXISTING "Please Enter E-Way Bill numbers.." textbox and
// "Import Portal data" button. No app code is modified, duplicated, or
// bypassed - this only drives the existing UI exactly as a user would.

const STORAGE_KEY = 'jkEwayBill_scrapedNumbers';
const PROCESSED_KEY = 'jkEwayBill_processedNumbers';

// console.log('[JK EWayBill Injector] content script loaded on', window.location.href);

function setReactInputValue(input, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  nativeSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function findEwbInput() {
  return (
    Array.from(document.querySelectorAll('input')).find((el) => {
      const label = el.closest('.MuiFormControl-root')?.querySelector('label');
      return label && label.textContent.includes('E-Way Bill numbers');
    }) || null
  );
}

function findImportButton() {
  return (
    Array.from(document.querySelectorAll('button')).find((el) =>
      el.textContent.trim().toLowerCase().includes('import portal data')
    ) || null
  );
}

// Reads the EWB No column (first cell of each row) out of the results table
// that's already on screen - this is how we tell whether a submitted number
// actually got saved, instead of just assuming the click worked.
function getVisibleEwbNumbersInTable() {
  return Array.from(document.querySelectorAll('table tbody tr'))
    .map((row) => row.querySelector('td')?.textContent.trim())
    .filter(Boolean);
}

// After clicking Import, the app's own fetch pipeline (token -> per-number
// detail fetch -> save) runs asynchronously and can take a while for a
// larger batch. Poll the table until every submitted number shows up, or
// until the timeout - whichever comes first. Anything not confirmed stays
// pending and gets retried on a later cycle instead of being marked done.
async function waitForConfirmedSaves(pending, timeoutMs = 30000, checkEveryMs = 1500) {
  const deadline = Date.now() + timeoutMs;
  let confirmed = [];
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, checkEveryMs));
    const visible = new Set(getVisibleEwbNumbersInTable());
    confirmed = pending.filter((n) => visible.has(n));
    if (confirmed.length === pending.length) break;
  }
  return confirmed;
}

let isRunning = false;

async function tryAutoImport() {
  if (isRunning) return; // Avoid overlapping runs while a previous submit is still confirming.

  const input = findEwbInput();
  const button = findImportButton();
  console.log('[JK EWayBill Injector] check: input found =', !!input, ', button found =', !!button);
  if (!input || !button) return; // Today's EWayBill tab isn't open right now.

  const stored = await chrome.storage.local.get([STORAGE_KEY, PROCESSED_KEY]);
  const scraped = stored[STORAGE_KEY] || [];
  const processed = new Set(stored[PROCESSED_KEY] || []);
  const pending = scraped.filter((n) => !processed.has(n));

  console.log(
    '[JK EWayBill Injector] scraped =', scraped.length,
    ', already processed =', processed.size,
    ', pending =', pending.length,
    ', button disabled =', button.disabled
  );

  if (pending.length === 0 || button.disabled) return;

  isRunning = true;
  try {
    setReactInputValue(input, pending.join(' '));
    await new Promise((resolve) => setTimeout(resolve, 300)); // let React state settle
    button.click();

    const confirmed = await waitForConfirmedSaves(pending);

    // Clear the textbox now that the submission has finished, so it doesn't
    // sit there showing stale numbers until the next cycle overwrites it.
    // Re-find the input in case React re-rendered it during the wait above.
    const inputAfter = findEwbInput();
    if (inputAfter) {
      setReactInputValue(inputAfter, '');
    }

    if (confirmed.length > 0) {
      const newProcessed = new Set([...processed, ...confirmed]);
      await chrome.storage.local.set({ [PROCESSED_KEY]: Array.from(newProcessed) });
    }

    console.log(
      `[JK EWayBill Injector] Confirmed saved ${confirmed.length}/${pending.length}:`,
      confirmed
    );

    const stillMissing = pending.filter((n) => !confirmed.includes(n));
    if (stillMissing.length > 0) {
      console.warn(
        `[JK EWayBill Injector] ${stillMissing.length} submitted number(s) did not show up in the table yet, will retry next cycle:`,
        stillMissing
      );
    }
  } finally {
    isRunning = false;
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    tryAutoImport();
  }
});

// This is a single-page app: the textbox/button don't exist in the DOM until
// React has mounted the EWayBill tab (and the user has today's date
// submitted). A single check right after document_idle can run before that
// render has happened, so poll periodically instead of checking only once.
tryAutoImport();
setInterval(tryAutoImport, 5000);
