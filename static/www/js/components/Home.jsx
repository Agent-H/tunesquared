/** @jsx React.DOM */

'use strict';
define([
  'react',
  'jquery',
  'underscore',
  'components/SongVignette',
  'players/LayoutProxy',
  'models/suggestions',
  'utils'
], function(
  React,
  $,
  _,
  SongVignette,
  LayoutProxy,
  suggestions,
  utils){

	var Home = React.createClass({

		getInitialState: function() {
			return {
        visu: LayoutProxy.getLayout() != null, // Tells wether a visualisation is available or not
        suggestions: []
      };
		},

		componentDidMount: function() {
      LayoutProxy.on('change removed', this.updateVisualisation, this);

      var self = this;
      _.defer(function(){
        self.updateVisualisation(null, LayoutProxy.getLayout());
      });


      this.refreshSuggestions();
		},

    componentWillUnmount: function() {
      LayoutProxy.off(null, null, this);
      this.updateVisualisation(LayoutProxy.getLayout(), null, {setState: false});
    },



    updateVisualisation: function(oldVisu, newVisu, options) {
      options = _.defaults(options || {}, {
        setState: true
      });

      if (oldVisu) {
        oldVisu.hide();
      }
      if (newVisu) {
        if (options.setState !== false) {
          this.setState({
            visu: true
          });
        }
        newVisu.attachTo(this.refs.visu.getDOMNode());
      } else if (options.setState !== false) {
        this.setState({
          visu: false
        });
      }
    },

    refreshSuggestions: function(cb) {
      var self = this;
      console.log('sugg');
      suggestions.fetch({
        success: function(sugg){
          self.setState({
            suggestions: sugg.toJSON()
          });
        }
      });
    },

    onChooseSong: function (song) {
      mixpanel.track('pick suggestion', {
        party_id: this.props.party.id,
        song_title: song.title
      });
      this.props.party.get('playlist').add(song);
    },

		render: function(){
      var suggestions = [];
      for (var i = 0 ; i*3 < this.state.suggestions.length ; i++) {
        var row = [];
        for(var j = 0 ; i*3 + j < this.state.suggestions.length && j < 3; j++) {
          var sug = this.state.suggestions[i*3+j];
          row.push(<div class="col-4">
            <SongVignette song={sug} onClick={this.onChooseSong} />
          </div>);
        }
        suggestions.push(<div class="row">{row}</div>);
      }

      var visu_placeholder = <div>
        <h1>Party: {this.props.party.get('name')}</h1>
        <p class="lead">Your party is on! Pick some songs to get started. <br />
        You can also use the search bar if you want something specific.
        Let your guests scan this code to access your party more easily.
        </p>
        <p class="alert-success alert">Tip: Show this page on a beamer in fullscreen for best effect!</p>
        <div class="panel panel-primary suggestions">
          <div class="panel-heading">
            <h3 class="panel-title">Suggestions:</h3>
          </div>
          <div class="panel-body">
            {suggestions}
          </div>
        </div>
      </div>;

      var currentSong = this.props.party.get('currentSong');

      var visu_real = <div>
        <h2>{(currentSong && currentSong.get('title') || '') + ' '
          /*<small>{(currentSong && currentSong.get('artist')) || ''}</small>*/
        }
        </h2>
        <div id="visu-anchor" ref="visu" />
      </div>;

			return (
        <div class="visu-container home">
          { (!this.state.visu) ? visu_placeholder : visu_real }
        </div>
			);
		}
	});

	return Home;
});
