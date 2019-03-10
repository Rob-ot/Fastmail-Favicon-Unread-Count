// ==UserScript==
// @name        Fastmail Favicon Unread Count
// @author      Rob Middleton
// @license     MIT
// @description Adds a dynamic favicon to fastmail.com showing unread emails.
// @namespace   rob@middlerob.com
// @grant       none
// @version     2.1.0
// @include     https://www.fastmail.com/mail/*
// ==/UserScript==

;(function() {
  var totalUnread = '?'
  var pageFocused = false
  var focusedSinceNew = true
  var animateFlashesRemaining = 0
  var animateFlashOn

  var favicon = document.querySelector("link[sizes='64x64']")

  var defaultImage = new Image()
  defaultImage.onload = draw
  defaultImage.src = favicon.href

  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')

  var faviconWidth = 64
  canvas.width = faviconWidth
  canvas.height = faviconWidth

  function draw() {
    var text = totalUnread
    var highlight = false

    ctx.clearRect(0, 0, faviconWidth, faviconWidth)

    if (animateFlashesRemaining > 0) {
      highlight = animateFlashOn
    } else {
      highlight = focusedSinceNew
    }

    if (highlight) {
      ctx.drawImage(defaultImage, 0, 0, faviconWidth, faviconWidth)
    } else {
      ctx.fillStyle = '#ff2323'
      ctx.fillRect(0, 0, faviconWidth, faviconWidth)
    }

    ctx.font = 'bold ' + faviconWidth * 0.8 + 'px Arial'
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'

    var textWidth = ctx.measureText(text).width
    var centered = faviconWidth / 2 - textWidth / 2
    if (textWidth <= faviconWidth) {
      ctx.strokeText(text, centered, faviconWidth * 0.8)
      ctx.fillText(text, centered, faviconWidth * 0.8)
    } else {
      ctx.strokeText(text, 0, faviconWidth * 0.8, faviconWidth)
      ctx.fillText(text, 0, faviconWidth * 0.8, faviconWidth)
    }

    favicon.href = canvas.toDataURL('image/png')
  }

  setInterval(function() {
    if (animateFlashesRemaining > 0) {
      animateFlashOn = !(animateFlashesRemaining % 2)
      animateFlashesRemaining--
      draw()
    }
  }, 1000)

  window.addEventListener('focus', function() {
    pageFocused = true
    focusedSinceNew = true
    animateFlashesRemaining = 0
    draw()
  })
  window.addEventListener('blur', function() {
    pageFocused = false
  })

  function updateTotal() {
    var el = document.querySelector('.v-MailboxSource--inbox .v-MailboxSource-badge')
    if (!el) return
    var unread = parseInt(el.innerHTML, 10)

    if (unread > parseInt(totalUnread, 10)) {
      // new unread message
      if (!pageFocused) {
        focusedSinceNew = false
        animateFlashesRemaining = 11
      }
    } else if (unread === 0) {
      // for when they read all emails elsewhere
      focusedSinceNew = true
      animateFlashesRemaining = 0
    }
    totalUnread = unread.toString()
    draw()
  }

  function pollForChanges() {
    setTimeout(pollForChanges, 1000)
    updateTotal()
  }

  pollForChanges()
})()
