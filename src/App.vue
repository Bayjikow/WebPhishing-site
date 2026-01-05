<script setup>
import { ref } from 'vue'

const url = ref('')
const isChecking = ref(false)
const result = ref(null)
const showTutorialDialog = ref(false)
const tutorialData = ref(null)

const reasons = [
  'Domain looks similar to a known brand (typo-squatting).',
  'Suspicious login form requests extra personal data.',
  'Certificate and domain age do not match expected pattern.'
]

const safetyTips = [
  'Check the URL carefully for extra letters or strange domains.',
  'Avoid entering passwords on sites reached from random links.',
  'Look for HTTPS and a valid certificate before submitting data.',
  'Use a password manager to spot fake domains.'
]

const phishingScenarios = [
  {
    url: 'https://paypa1.com/login',
    realUrl: 'https://paypal.com',
    issues: [
      { type: 'domain', text: 'paypa1.com', highlight: '1', correct: 'l', description: 'Letter "l" replaced with number "1"' },
      { type: 'ssl', text: 'Self-signed certificate', description: 'SSL certificate not issued by trusted authority' },
      { type: 'age', text: 'Domain age: 3 days', description: 'Legitimate PayPal domain is 25+ years old' }
    ]
  },
  {
    url: 'http://amazon-security-verify.com',
    realUrl: 'https://amazon.com',
    issues: [
      { type: 'domain', text: 'amazon-security-verify.com', highlight: '-security-verify', correct: '', description: 'Extra words added to look official' },
      { type: 'protocol', text: 'HTTP (not secure)', description: 'No SSL encryption - real Amazon uses HTTPS' },
      { type: 'age', text: 'Domain age: 1 day', description: 'Newly registered domain is suspicious' }
    ]
  },
  {
    url: 'https://microsofl-office.com/signin',
    realUrl: 'https://microsoft.com',
    issues: [
      { type: 'domain', text: 'microsofl-office.com', highlight: 'fl', correct: 'ft', description: 'Typo: "ft" replaced with "fl"' },
      { type: 'ssl', text: 'Certificate mismatch', description: 'SSL certificate issued for different domain' },
      { type: 'redirect', text: 'Suspicious redirect', description: 'Page redirects to unknown server after login' }
    ]
  }
]

const analyzeUrl = (inputUrl) => {
  const urlLower = inputUrl.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
  
  // Whitelist of legitimate domains - these are SAFE
  const legitimateDomains = [
    // Google Services
    'google.com', 'google.ru', 'google.co.uk', 'google.de', 'google.fr', 'google.es', 'google.it',
    'gmail.com', 'youtube.com', 'youtu.be', 'drive.google.com', 'meet.google.com', 'maps.google.com',
    'play.google.com', 'docs.google.com', 'photos.google.com', 'calendar.google.com',
    
    // Microsoft Services
    'microsoft.com', 'office.com', 'office365.com', 'outlook.com', 'live.com', 'hotmail.com',
    'msn.com', 'bing.com', 'xbox.com', 'skype.com', 'onedrive.com', 'azure.com',
    
    // Apple Services
    'apple.com', 'icloud.com', 'me.com', 'mac.com', 'itunes.com', 'appstore.com',
    
    // Social Media
    'facebook.com', 'fb.com', 'instagram.com', 'whatsapp.com', 'messenger.com',
    'twitter.com', 'x.com', 'linkedin.com', 'pinterest.com', 'snapchat.com',
    'tiktok.com', 'reddit.com', 'tumblr.com', 'discord.com', 'telegram.org',
    'vk.com', 'vk.ru', 'ok.ru', 'viber.com',
    
    // E-commerce
    'amazon.com', 'amazon.ru', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.es', 'amazon.it',
    'ebay.com', 'aliexpress.com', 'alibaba.com', 'etsy.com', 'walmart.com', 'target.com',
    'bestbuy.com', 'ikea.com', 'shopify.com',
    
    // Payment Services
    'paypal.com', 'paypal.ru', 'stripe.com', 'square.com', 'venmo.com',
    
    // Streaming & Entertainment
    'netflix.com', 'spotify.com', 'twitch.tv', 'hulu.com', 'disneyplus.com',
    'primevideo.com', 'hbomax.com', 'crunchyroll.com', 'soundcloud.com', 'pandora.com',
    
    // Video Conferencing
    'zoom.us', 'teams.microsoft.com', 'webex.com', 'gotomeeting.com',
    
    // Cloud Storage & Productivity
    'dropbox.com', 'box.com', 'notion.so', 'evernote.com', 'trello.com',
    'slack.com', 'asana.com', 'monday.com', 'airtable.com',
    
    // Development & Tech
    'github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com', 'stackexchange.com',
    'npmjs.com', 'pypi.org', 'docker.com', 'kubernetes.io', 'jenkins.io',
    
    // News & Media
    'cnn.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com', 'theguardian.com', 'reuters.com',
    'bloomberg.com', 'forbes.com', 'techcrunch.com', 'medium.com',
    
    // Education & Reference
    'wikipedia.org', 'wiki.org', 'coursera.org', 'udemy.com', 'khanacademy.org',
    'edx.org', 'duolingo.com', 'quizlet.com',
    
    // Russian Services
    'yandex.ru', 'yandex.com', 'mail.ru', 'rambler.ru', 'avito.ru', 'ozon.ru',
    'wildberries.ru', 'sberbank.ru', 'tinkoff.ru', 'gosuslugi.ru',
    
    // Banking & Finance
    'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
    'capitalone.com', 'discover.com', 'americanexpress.com',
    
    // Travel
    'booking.com', 'airbnb.com', 'expedia.com', 'tripadvisor.com', 'hotels.com',
    'kayak.com', 'skyscanner.com',
    
    // Other Popular Services
    'adobe.com', 'canva.com', 'figma.com', 'wordpress.com', 'blogger.com',
    'wix.com', 'squarespace.com', 'godaddy.com', 'namecheap.com',
    'cloudflare.com', 'digitalocean.com', 'heroku.com', 'vercel.com'
  ]
  
  // Check if it's a legitimate domain (exact match)
  if (legitimateDomains.includes(urlLower)) {
    return { isPhishing: false, scenario: null }
  }
  
  const urlLowerFull = inputUrl.toLowerCase()
  
  // Check for specific phishing patterns with typos
  if ((urlLowerFull.includes('paypa1') || urlLowerFull.includes('paypai') || urlLowerFull.includes('paypa-')) && !legitimateDomains.includes(urlLower)) {
    return { scenario: phishingScenarios[0], isPhishing: true } // PayPal scenario
  }
  if ((urlLowerFull.includes('arnazon') || urlLowerFull.includes('amazom') || urlLowerFull.includes('amazon-')) && !legitimateDomains.includes(urlLower)) {
    return { scenario: phishingScenarios[1], isPhishing: true } // Amazon scenario
  }
  if ((urlLowerFull.includes('microsofl') || urlLowerFull.includes('microssoft') || urlLowerFull.includes('microsoft-')) && !legitimateDomains.includes(urlLower)) {
    return { scenario: phishingScenarios[2], isPhishing: true } // Microsoft scenario
  }
  
  // Try to detect the real brand from common typos
  if ((urlLowerFull.includes('gooogle') || urlLowerFull.includes('gogle') || urlLowerFull.includes('googl1') || urlLowerFull.includes('goog1e')) && !legitimateDomains.includes(urlLower)) {
    return {
      isPhishing: true,
      scenario: {
        url: inputUrl,
        realUrl: 'https://google.com',
        issues: [
          { type: 'domain', text: inputUrl.replace('https://', '').replace('http://', ''), highlight: 'ooo', correct: 'oo', description: 'Extra "o" letters - typo-squatting attack' },
          { type: 'ssl', text: 'Invalid SSL certificate', description: 'Certificate does not match Google\'s official domain' },
          { type: 'age', text: 'Domain age: 2 days', description: 'Real Google domain is 25+ years old' }
        ]
      }
    }
  }
  
  if ((urlLowerFull.includes('appl3') || urlLowerFull.includes('app1e') || urlLowerFull.includes('apple-')) && !legitimateDomains.includes(urlLower)) {
    return {
      isPhishing: true,
      scenario: {
        url: inputUrl,
        realUrl: 'https://apple.com',
        issues: [
          { type: 'domain', text: urlLower, highlight: 'suspicious pattern', correct: 'apple.com', description: 'Domain mimics Apple but with variations' },
          { type: 'protocol', text: 'HTTP (not secure)', description: 'Real Apple always uses HTTPS encryption' },
          { type: 'age', text: 'Domain age: 5 days', description: 'Newly registered, likely malicious' }
        ]
      }
    }
  }
  
  if ((urlLowerFull.includes('faceb00k') || urlLowerFull.includes('facebook-') || urlLowerFull.includes('face-book')) && !legitimateDomains.includes(urlLower)) {
    return {
      isPhishing: true,
      scenario: {
        url: inputUrl,
        realUrl: 'https://facebook.com',
        issues: [
          { type: 'domain', text: urlLower, highlight: 'variation', correct: 'facebook.com', description: 'Domain is not the official Facebook domain' },
          { type: 'ssl', text: 'Self-signed certificate', description: 'Not issued by trusted authority' },
          { type: 'redirect', text: 'Suspicious redirect detected', description: 'Page redirects to unknown server' }
        ]
      }
    }
  }
  
  // Check for common phishing indicators
  const hasMultipleDashes = (urlLower.match(/-/g) || []).length > 2
  const hasSuspiciousWords = /verify|secure|login|account|update|confirm|banking|wallet/i.test(urlLower)
  const hasNumbersInBrand = /[a-z]+[0-9]+[a-z]+|[0-9]+[a-z]+/.test(urlLower)
  
  if (hasMultipleDashes || hasSuspiciousWords || hasNumbersInBrand) {
    return {
      isPhishing: true,
      scenario: {
        url: inputUrl,
        realUrl: 'Unknown - verify the legitimate website',
        issues: [
          { type: 'domain', text: inputUrl.replace('https://', '').replace('http://', ''), description: 'Suspicious domain pattern detected - possible phishing' },
          { type: 'ssl', text: 'Certificate warning', description: 'SSL certificate validation failed' },
          { type: 'age', text: 'Domain age: Very recent', description: 'Newly registered domains are often used for phishing' }
        ]
      }
    }
  }
  
  // If no phishing patterns detected, it's likely safe
  return { isPhishing: false, scenario: null }
}

const checkWebsite = () => {
  if (!url.value.trim()) return

  isChecking.value = true

  setTimeout(() => {
    const analysis = analyzeUrl(url.value)
    const probability = analysis.isPhishing ? Math.floor(75 + Math.random() * 25) : Math.floor(10 + Math.random() * 30)
    
    result.value = {
      label: analysis.isPhishing ? 'Phishing' : 'Safe',
      severity: analysis.isPhishing ? 'danger' : 'success',
      probability
    }
    isChecking.value = false
    
    // Show tutorial dialog for phishing sites
    if (analysis.isPhishing) {
      tutorialData.value = {
        detectedUrl: url.value,
        ...analysis.scenario,
        probability
      }
      showTutorialDialog.value = true
    }
  }, 1500)
}

const closeTutorial = () => {
  showTutorialDialog.value = false
}
</script>

<template>
  <div class="app-container">
    <div class="background-shields">
      <div class="shield shield-1">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L14 2L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    <div class="shield shield-2">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L14 2L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="shield shield-3">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L14 2L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="shield shield-4">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L14 2L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="shield shield-5">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L14 2L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="shield shield-6">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L14 2L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
  <div class="page">
    <header class="hero">
      <p class="eyebrow">Academic Demo</p>
      <h1>Phishing Website Detection Portal</h1>
      <p class="subtitle">
        A visual dashboard that simulates how a deep learning system flags risky websites.
      </p>
      <div class="hero-tags">
        <Tag severity="info" value="Vue 3 + PrimeVue" />
        <Tag severity="success" value="Mock Results" />
        <Tag severity="warning" value="No Real Data" />
      </div>
    </header>

    <Card class="panel">
      <template #title>Check a Website</template>
      <template #content>
        <div class="form-row">
          <div class="field">
            <label class="label" for="url-input">Website URL</label>
            <InputText
              id="url-input"
              v-model="url"
              placeholder="https://example.com"
              class="input"
            />
          </div>
          <Button
            label="Check website"
            icon="pi pi-search"
            :loading="isChecking"
            @click="checkWebsite"
          />
        </div>
      </template>
    </Card>

    <div class="grid">
      <Card v-if="result" class="panel result">
        <template #title>Result Summary</template>
        <template #content>
          <div class="result-header">
            <Tag :severity="result.severity" :value="result.label" />
            <span class="probability">{{ result.probability }}% probability</span>
          </div>
          <ProgressBar :value="result.probability" :showValue="false" />
          <p class="note">This is mock data for a visual demo only.</p>
        </template>
      </Card>

      <Card class="panel reasons">
        <template #title>Why this looks suspicious</template>
        <template #content>
          <ul class="list">
            <li v-for="reason in reasons" :key="reason">
              <i class="pi pi-exclamation-triangle"></i>
              <span>{{ reason }}</span>
            </li>
          </ul>
        </template>
      </Card>
    </div>

    <Card class="panel tips">
      <template #title>How to avoid phishing</template>
      <template #content>
        <div class="tips-grid">
          <div v-for="tip in safetyTips" :key="tip" class="tip-item">
            <i class="pi pi-shield"></i>
            <span>{{ tip }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>

  <!-- Interactive Tutorial Dialog -->
  <Dialog 
    v-model:visible="showTutorialDialog" 
    modal 
    :closable="false"
    :style="{ width: '90vw', maxWidth: '900px' }"
    class="tutorial-dialog"
  >
    <template #header>
      <div class="tutorial-header">
        <div class="hero-character">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="url(#heroGradient)"/>
            <path d="M32 8L20 16V26C20 36 26 45 32 48C38 45 44 36 44 26V16L32 8Z" fill="white" opacity="0.9"/>
            <path d="M28 28L30 30L36 24" stroke="#2c5f8d" stroke-width="2" stroke-linecap="round"/>
            <circle cx="26" cy="22" r="2" fill="#2c5f8d"/>
            <circle cx="38" cy="22" r="2" fill="#2c5f8d"/>
            <path d="M26 34C26 34 28 36 32 36C36 36 38 34 38 34" stroke="#2c5f8d" stroke-width="2" stroke-linecap="round"/>
            <defs>
              <linearGradient id="heroGradient" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stop-color="#4dd0e1"/>
                <stop offset="100%" stop-color="#64b5f6"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="tutorial-header-text">
          <h2>⚠️ Phishing Detected!</h2>
          <p>Let me show you why this website is dangerous</p>
        </div>
      </div>
    </template>

    <div v-if="tutorialData" class="tutorial-content">
      <div class="url-comparison">
        <div class="url-box suspicious">
          <label>🚨 Suspicious URL you entered:</label>
          <div class="url-display">{{ tutorialData.detectedUrl }}</div>
        </div>
        <div class="arrow-down">
          <i class="pi pi-arrow-down"></i>
        </div>
        <div class="url-box real">
          <label>✅ Real website should be:</label>
          <div class="url-display">{{ tutorialData.realUrl }}</div>
        </div>
      </div>

      <Divider align="center">
        <b class="divider-text">Security Issues Found</b>
      </Divider>

      <div class="issues-list">
        <div v-for="(issue, index) in tutorialData.issues" :key="index" class="issue-card">
          <div class="issue-icon">
            <i v-if="issue.type === 'domain'" class="pi pi-globe"></i>
            <i v-if="issue.type === 'ssl'" class="pi pi-lock"></i>
            <i v-if="issue.type === 'age'" class="pi pi-calendar"></i>
            <i v-if="issue.type === 'protocol'" class="pi pi-shield"></i>
            <i v-if="issue.type === 'redirect'" class="pi pi-directions"></i>
          </div>
          <div class="issue-content">
            <div class="issue-title">
              <Tag :severity="'danger'" :value="issue.type.toUpperCase()" />
              <span class="issue-label">{{ issue.text }}</span>
            </div>
            <p class="issue-description">{{ issue.description }}</p>
            <div v-if="issue.highlight" class="issue-highlight">
              <span class="highlight-label">Look closely:</span>
              <div class="highlight-comparison">
                <span class="wrong">
                  <i class="pi pi-times"></i>
                  {{ issue.text }}
                  <mark class="error-mark">{{ issue.highlight }}</mark>
                </span>
                <i class="pi pi-arrow-right"></i>
                <span class="correct">
                  <i class="pi pi-check"></i>
                  Should be: <mark class="correct-mark">{{ issue.correct }}</mark>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tutorial-tips">
        <h3><i class="pi pi-info-circle"></i> How to Stay Safe</h3>
        <ul>
          <li><strong>Double-check the URL</strong> - Look for typos, extra words, or wrong domains</li>
          <li><strong>Verify HTTPS</strong> - Real sites use secure connections with valid certificates</li>
          <li><strong>Check domain age</strong> - Legitimate sites have been around for years</li>
          <li><strong>Use bookmarks</strong> - Don't click links from emails or messages</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <div class="tutorial-footer">
        <Button label="I Understand" icon="pi pi-check" @click="closeTutorial" severity="success" size="large" />
      </div>
    </template>
  </Dialog>
  </div>
</template>
