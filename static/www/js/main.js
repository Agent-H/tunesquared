﻿/*
 * main.js is the only file explicitly loaded by require (see index.html)
 * It will load every main classes needed by app to initialize.
 * One doesn't need to specify here sub-dependencies.
 */

'use strict';

requirejs.config({
  paths: {
    'lib': '../lib',
    'socket.io': '/socket.io/socket.io',
    'underscore': '../lib/underscore',
    'backbone': '../lib/backbone',
    'bootstrap': '../lib/bootstrap/js',
    'jquery': '../lib/jquery',
    'bootstrap-slider': '../lib/slider/js/bootstrap-slider',
    'wizard': '../lib/wizard',
    'react': '../lib/react',
    'components': 'components-build',
    'search': '../lib/search',
    'swfobject': '../lib/swfobject',
    'json': '../lib/json3',
    'qrcode': '../lib/qrcode.min'
  },

  shim: {
    'backbone': {
      //These script dependencies should be loaded before loading
      //backbone.js
      deps: ['underscore', 'jquery'],
      //Once loaded, use the global 'Backbone' as the
      //module value.
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },

    'swfobject': {
      exports: 'swfobject'
    }

  }
});


require(['app']);
