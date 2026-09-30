// ─────────────────────────────────────────────────────────────────────────────
//  Bible versions offered in the "Bible" menu, in menu order.
//
//  provider:
//    'esv'      -> api.esv.org, needs ESV_API_KEY
//    'apibible' -> API.Bible, needs API_BIBLE_KEY and the version's bibleId
//                  (find IDs in your API.Bible account)
//    'bibleapi' -> bible-api.com, public domain, no key
//
//  A version only appears when its key is set. `fallback: true` versions are
//  used only when no other version is available (e.g. running locally without
//  any keys).
//
//  `copyright` is shown until the API sends its own notice for that version.
// ─────────────────────────────────────────────────────────────────────────────

export const TRANSLATION_CONFIG = {
  esv: {
    name: 'English Standard Version',
    provider: 'esv',
    copyright:
      'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.',
  },
  niv: {
    name: 'New International Version',
    provider: 'apibible',
    bibleId: '78a9f6124f344018-01',
    copyright:
      'Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.',
  },
  nasb: {
    name: 'New American Standard Bible',
    provider: 'apibible',
    bibleId: 'd6e14a625393b4da-01',
    copyright:
      'Scripture quotations taken from the (NASB®) New American Standard Bible®, Copyright © The Lockman Foundation. Used by permission. All rights reserved. lockman.org',
  },
  nkjv: {
    name: 'New King James Version',
    provider: 'apibible',
    bibleId: '63097d2a0a2f7db3-01',
    copyright:
      'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
  },
  kjv: {
    name: 'King James Version',
    provider: 'bibleapi',
    fallback: true,
  },
};
