// GA4 config, served from our own origin so the Content-Security-Policy needs
// no 'unsafe-inline'. Google's snippet puts this in an inline <script>, which
// would mean allowing every inline script on the site to run.
window.dataLayer = window.dataLayer || []
function gtag() {
  window.dataLayer.push(arguments)
}
gtag('js', new Date())
gtag('config', 'G-N4R2D8DVN4')
