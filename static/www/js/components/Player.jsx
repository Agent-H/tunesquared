/** @jsx React.DOM */
'use strict';

/*
  Master player component. Controls hidden players as well as the song flow.
  It takes consumes the playlist. To give the player a song, one must simply
  add it to the playlist. One cannot force a song to go in the player, it has
  to be first in the playlist at the moment songs are switched.
*/
define(['react', 'jquery', 'players/PlayerFactory', 'jquery-ui'], function (React, jquery, PlayerFactory) {

	var Player = React.createClass({

    getInitialState: function () {
      /* States for the player are : 'empty', it waits for a new song to come in and start */
      return {
        /* When true, music is playing or will be as soon as the player will be fed with a song.
          Therefore, there exists a state where playing is true but no song is loaded. */
        playing: false,

        /* Volume is stored in player state so that it actually acts as a master
         and can keep it consistent across different player implementations */
        volume: 0.5,

        /* Player in foreground it's state is linked to the UI (loading, progress, etc...) */
        currentPlayer: null,

        /*
          Player in background, this one preloads the next track and, if there is time,
          contributes to the "smooth transition". It's state is never shown, it replaces currentPlayer
          when current song is skipped or ends.
          Assert : There can not be a nextPlayer if currentPlayer == null
        */
        nextPlayer: null,


        loading: false
      };
    },

    componentDidMount: function () {
      var errors = PlayerFactory.checkCompatibility();
      // TODO : handle compatibility error
      if(errors){
        console.error('Compatibility errors');
        console.log(errors);
      }
    },

    componentWillReceiveProps: function (newProps) {
      if (this.props.playlist && newProps.playlist && this.props.playlist !== newProps.playlist) {
        this.props.playlist.off(null, null, this);
        this.fetchPlaylistForNextSong(newProps.playlist);
      }

    },

		componentDidUpdate: function(){
      if (this.state.currentPlayer != null){
        $(this.refs['volume-slider'].getDOMNode()).slider({animate: 'fast'});
      }
		},

    /*
      Tries to extract next song from the playlist.
      If it fails, listen to playlist's 'add' event to retry
    */
    fetchPlaylistForNextSong: function (playlist) {
      console.log('fetching playlist');

      if (playlist == null)
        playlist = this.props.playlist;

      if (playlist.length === 0){
        console.log('try again');
        playlist.once('add', function() {
          this.fetchPlaylistForNextSong(playlist);
        }.bind(this));
      } else {
        var song = playlist.first();
        playlist.remove(song);

        this.onNextSong(song);
      }
    },

    /* Called by fetchPlaylistForNextSong when it actually fetched a song from the playlist */
    onNextSong: function (song) {
      console.log('houra, song available : ');
      console.log(song);

      var anchor = document.createElement('div');
      document.body.appendChild(anchor);

      if(this.state.currentPlayer == null)
        this.setState({loading: true});

      PlayerFactory.create(song, anchor, function (err, player) {
        if(err) throw err; // TODO : handle error


        /* Exposes the player to make tests, very handy ;) */
        window.player = player;

        if (this.state.currentPlayer == null){
          console.log('got current player');
          player.on('end', this.onPlayerEnd);
          this.setState({
            currentPlayer: player,
            loading: false
          });
        } else if (this.state.nextPlayer == null) {
          console.log('got next player');
          this.setState({
            nextPlayer: player
          });
          player.pause();
        } else {
          throw new Error('Woops, I fetched a song from playlist but I already have two players :-o');
        }
      }.bind(this));
    },

    onPlayerEnd: function() {
      console.log('end !');

      // Players internals are sometimes a bit shitty so we give'em some help for memory management
      this.state.currentPlayer.release();

      this.setState({
        currentPlayer: null
      });

      // Then try to get a new one
      this.fetchPlaylistForNextSong();
    },

		render: function () {

      var contents;

      if (this.state.currentPlayer != null) {
        var song = this.state.currentPlayer.song;
        contents = (
          <div class="container-fluid">
            <div class="row-fluid">
              <div class="span4">
                <div class="img-container small"><img src={this.state.currentPlayer.song.get('thumb')} /></div>
              </div>
              <div class="span8">
                <ul class="song-attributes">
                  <li><strong>{this.state.currentPlayer.song.get('title')}</strong></li>
                  <li>by {this.state.currentPlayer.song.get('artist')}</li>
                </ul>
              </div>
            </div>
            <hr />
            <div class="row-fluid">
              <div class="player-actions clearfix">
                  <div class="action"><a href="#" class="btn play-button" ref="play-button" ><i class="icon-play"></i></a></div>
                  <div class="action"><a href="#" class="btn forward-button" ref="fwd-button"><i class="icon-fast-forward"></i></a></div>
                  <div class="action volume"><i class="icon-volume-up pull-left"></i><div class="volume-slider" ref="volume-slider"></div></div>
              </div>
            </div>
            <div class="row-fluid">
              <div ref="player-progress-slider"></div>
            </div>
          </div>
        );
      } else if (this.state.loading){
        contents = <img src="img/ajax-loader.gif" />;
      } else {
        contents = 'Nothing to play. Add some songs to get started.';
      }

			return <div id="player">
        {contents}
      </div>;
		}
	});

	return Player;
});
