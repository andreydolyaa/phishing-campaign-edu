let bulkLinksArray = [];

function switchTab(tab) {
  // Update tabs
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

  if (tab === 'single') {
    document.querySelector('.tab:nth-child(1)').classList.add('active');
    document.getElementById('single-tab').classList.add('active');
  } else {
    document.querySelector('.tab:nth-child(2)').classList.add('active');
    document.getElementById('bulk-tab').classList.add('active');
  }
}

function generateLink() {
  const username = document.getElementById('username').value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }

  const key = new URLSearchParams(window.location.search).get('key');
  const url = window.location.protocol + '//' + window.location.host + '/generate-link?username=' + encodeURIComponent(username) + '&key=' + key;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const linkEl = document.getElementById('linkUrl');
      linkEl.textContent = data.url;
      linkEl.href = data.url;
      document.getElementById('result').classList.add('show');
    })
    .catch(err => alert('Error: ' + err));
}

function copyToClipboard(elementId, event) {
  const element = document.getElementById(elementId);
  const text = element.textContent || element.innerText;

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess(event.target);
    }).catch(err => {
      console.error('Clipboard API failed:', err);
      fallbackCopy(text, event.target);
    });
  } else {
    fallbackCopy(text, event.target);
  }
}

function fallbackCopy(text, button) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showCopySuccess(button);
  } catch (err) {
    console.error('Fallback copy failed:', err);
    alert('Copy failed: ' + err.message);
  }
  document.body.removeChild(textarea);
}

function showCopySuccess(button) {
  if (!button) return;
  const originalText = button.textContent;
  button.textContent = '✓ COPIED!';
  setTimeout(() => {
    button.textContent = originalText;
  }, 2000);
}

async function generateBulkLinks() {
  const textarea = document.getElementById('usernames').value;
  const usernames = textarea.split('\n')
    .map(u => u.trim())
    .filter(u => u.length > 0);

  if (usernames.length === 0) {
    alert('Please enter at least one username');
    return;
  }

  bulkLinksArray = [];
  const listEl = document.getElementById('bulkLinkList');
  listEl.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Generating links...</div>';
  document.getElementById('bulkResult').classList.add('show');

  const key = new URLSearchParams(window.location.search).get('key');

  for (const username of usernames) {
    try {
      const url = window.location.protocol + '//' + window.location.host + '/generate-link?username=' + encodeURIComponent(username) + '&key=' + key;
      const response = await fetch(url);
      const data = await response.json();
      bulkLinksArray.push({ username: username, url: data.url });
    } catch (err) {
      console.error('Error generating link for ' + username, err);
    }
  }

  // Display results
  listEl.innerHTML = bulkLinksArray.map((item, index) => `
    <div class="bulk-item">
      <div class="bulk-username">${item.username}</div>
      <div class="bulk-item-content">
        <div class="bulk-link">${item.url}</div>
        <button class="bulk-item-copy" onclick="copyIndividualLink(${index}, event)">Copy</button>
      </div>
    </div>
  `).join('');

  // Display array output
  const arrayOutputEl = document.getElementById('arrayOutput');
  arrayOutputEl.textContent = JSON.stringify(bulkLinksArray, null, 2);

  document.getElementById('linkCount').textContent = bulkLinksArray.length;
}

function copyAllLinksText(event) {
  const text = bulkLinksArray.map(item => item.url).join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess(event.target);
    }).catch(err => {
      console.error('Clipboard API failed:', err);
      fallbackCopy(text, event.target);
    });
  } else {
    fallbackCopy(text, event.target);
  }
}

function copyArrayOutput(event) {
  const arrayText = JSON.stringify(bulkLinksArray, null, 2);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(arrayText).then(() => {
      showCopySuccess(event.target);
    }).catch(err => {
      console.error('Clipboard API failed:', err);
      fallbackCopy(arrayText, event.target);
    });
  } else {
    fallbackCopy(arrayText, event.target);
  }
}

function copyIndividualLink(index, event) {
  const link = bulkLinksArray[index].url;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      const btn = event.target;
      const originalText = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    }).catch(err => {
      console.error('Clipboard API failed:', err);
      fallbackCopy(link, event.target);
    });
  } else {
    fallbackCopy(link, event.target);
  }
}

function downloadLinks() {
  const text = bulkLinksArray.map(item => `${item.username}: ${item.url}`).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'phishing-links-' + new Date().toISOString().split('T')[0] + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  const usernameInput = document.getElementById('username');
  if (usernameInput) {
    usernameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') generateLink();
    });
  }
});
