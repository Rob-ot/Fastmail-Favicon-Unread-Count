// ==UserScript==
// @name        Fastmail Favicon Unread Count
// @author      Rob Middleton
// @license     MIT
// @description Adds a dynamic favicon to fastmail.com showing unread emails.
// @namespace   rob@middlerob.com
// @version     1.2.0
// @grant       none
// @include     https://www.fastmail.com/mail/*
// ==/UserScript==

;(function () {

  // Edit here to change excluded folders
  // To exclude sub folders just separate with a > like: "My Folder > Sub Folder"
  var excludeFolders = ["Spam", "Trash", "Promotions", "Events"]


  var totalUnread = '?'
  var pageFocused = false
  var focusedSinceNew = true
  var animateFlashesRemaining = 0
  var animateFlashOn

  var listeners = []
  var favicon = document.querySelector("link[sizes='32x32']")

  var defaultImage = new Image()
  defaultImage.onload = draw
  defaultImage.src = favicon.href

  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')

  var faviconWidth = 16
  canvas.width = faviconWidth
  canvas.height = faviconWidth

  function draw () {
    var text = totalUnread
    var highlight = false

    ctx.clearRect(0, 0, faviconWidth, faviconWidth)

    if (animateFlashesRemaining > 0) {
      highlight = animateFlashOn
    }
    else {
      highlight = focusedSinceNew
    }

    if (highlight) {
      ctx.drawImage(defaultImage, 0, 0, 16, 16)
    }
    else {
      ctx.fillStyle = '#ff2323'
      ctx.fillRect(0, 0, faviconWidth, faviconWidth)
    }

    ctx.font = 'bold 14px Arial'
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'

    var textWidth = ctx.measureText(text).width
    var centered = (faviconWidth / 2) - (textWidth / 2)
    if (textWidth <= faviconWidth) {
      ctx.strokeText(text, centered, 13)
      ctx.fillText(text, centered, 13)
    }
    else {
      ctx.strokeText(text, 0, 13, faviconWidth)
      ctx.fillText(text, 0, 13, faviconWidth)
    }

    favicon.href = canvas.toDataURL('image/png')
  }

  setInterval(function () {
    if (animateFlashesRemaining > 0) {
      animateFlashOn = !(animateFlashesRemaining % 2)
      animateFlashesRemaining--
      draw()
    }
  }, 1000)

  window.addEventListener('focus', function () {
    pageFocused = true
    focusedSinceNew = true
    animateFlashesRemaining = 0
    draw()
  })
  window.addEventListener('blur', function () {
    pageFocused = false
  })


  function nameForBox (box) {
    var parent = box.get("parent")
    var name = box.get("name")
    return parent ? (parent.get("name") + " > " + name) : name
  }

  function updateTotal () {
    var unread = window.FastMail.allMailboxes.filter(function (box) {
      return excludeFolders.indexOf(nameForBox(box)) === -1
    }).reduce(function (total, current) {
      return total + current.get("unread")
    }, 0)

    if (unread > parseInt(totalUnread, 10)) {
      // new unread message
      if (!pageFocused) {
        focusedSinceNew = false
        animateFlashesRemaining = 11
      }
    }
    else if (unread === 0) {
      // for when they read all emails elsewhere
      focusedSinceNew = true
      animateFlashesRemaining = 0
    }
    totalUnread = unread.toString()
    draw()
  }

  function reBind () {
    var listener
    while (listener = listeners.pop()) {
      listener[0].removeObserverForKey(listener[1], listener[2], listener[3])
    }

    window.FastMail.allMailboxes.forEach(function (box) {
      var handler = {fn: function () {
        updateTotal()
      }}
      box.addObserverForKey("unread", handler, "fn")
      listeners.push([box, "unread", handler, "fn"])
    })
  }

  function tryInit () {
    // wait for FastMail to load by polling
    if (window.FastMail.allMailboxes) {
      window.FastMail.allMailboxes.addObserverForRange({}, {
        fn: function () {
          reBind()
          updateTotal()
        }
      }, "fn")
      reBind()
      updateTotal()
    }
    else {
      // try again in 1s
      setTimeout(tryInit, 1000)
    }
  }

  tryInit()

})()
