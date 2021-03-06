/** @jsx React.DOM */
'use strict';

define([
	'react',
	'jquery',
	'backbone',
	'mixins/Router',
	'mixins/Backbone',
	'models/Session',
	'models/Party',
	'components/Player',
	'components/Search',
	'components/Navbar',
	'components/ErrorDialog',
	'components/QRCode',
	'components/Playlist',
	'components/Home',
	'components/Music',
	'controllers/PlaybackController'
], function(
	React,
	$,
	Backbone,
	Router,
	BackboneMixin,
	Session,
	Party,
	Player,
	SearchView,
	Navbar,
	ErrorDialog,
	QRCode,
	Playlist,
	Home,
	MusicView,
	PlaybackController
){

	var App = React.createClass({

		mixins: [Router, BackboneMixin],

		getInitialState: function(){
			return {
				dialog: null,
				playbackController: null,
				main: 'home'/*,
				currentPlayer: null*/
			};
		},

		routes: {
			'search/:q': function (q) {
				mixpanel.track('search', {
					party_id: this.props.session.get('party').id,
					q: q,
					platform: 'desktop'
				});
				this.setState({
					dialog: null,
					main: 'search',
					query: decodeURIComponent(q)
				});
			},

			'search': function() {
				this.setState({
					main: 'search',
					query: null
				});
			},

			'home': function() {
				this.setState({
					main: 'home'
				});
			},

			'playlist': function() {
				this.setState({
					main: 'playlist'
				});
			},

			'music': function() {
				this.setState({
					main: 'music'
				});
			},

			'': function () {
				this.router.navigate('home', {trigger: true, replace: true});
			}
		},

		componentWillReceiveProps: function(props) {
      this.updateQRCodeURL(props.party);
    },

    updateQRCodeURL: function(party) {
      party = party || this.props.session.get('party');
      this.setState({
        QRCodeURL: 'http://' +
          window.location.host +
          '/party/' +
          encodeURIComponent(party.get('name'))
      });
    },

		getBackboneModels: function () {
			return [this.props.session];
		},

		updateSessionRefs: function() {
			var session = this.props.session;

			if (this.party) {
				this.party.off(null, null, this);
			}

			this.party = session.get('party');
			this.party.on('change sync', this.updateQRCodeURL, this);

			this.updateQRCodeURL();
		},

		componentDidMount: function(){
			var self = this;
			this.props.session.fetch({
        success: function () {
					if (self.props.session.get('party') == null) {
						partyExpired();
					} else {
						Backbone.history.start();
						self.setState({
							playbackController:  new PlaybackController(self.props.session.get('party'))
						});
          }
        },
        error: function() {
					partyExpired();
        }
      });
			this.props.session.on('sync', this.updateSessionRefs, this);

      function partyExpired() {
				self.setState({
					error: [{type: 'critical', message: 'Your party has expired'}]
				});
      }

      window.app = this;
		},

		onPlayerError: function (errs){
			var errors = [];
			errs.forEach(function(err){
				errors.push ({
					type : err.type,
					message : err.err
				});
			});
			this.setState({
				error : errors
			});
		},

		render: function () {

			var session = this.props.session;
			var currentParty = session.get('party') || new Party();

			var dialog = [];

			var main;
			if (this.state.main === 'home')
				main = <Home party={currentParty} />;
			else if(this.state.main === 'search')
				main = <SearchView party={currentParty} query={this.state.query} />
			else if (this.state.main === 'music')
				main = <MusicView party={currentParty} />

			if (this.state.error)
				this.state.error.forEach(function(error){
				dialog.push (<ErrorDialog type={error.type} message={error.message} />);
			});

			return (
				<div>
					<Navbar session={ session } player={this.state.currentPlayer} />
					<div class="side">
						<Player playbackController={this.state.playbackController} />
						<Playlist party={currentParty} />
					</div>
					<div class="main row">
						<div class="col-md-12 col-xs-12 col-lg-12 col-sm-12">
							{main}
						</div>
					</div>
					{dialog}
				</div>
			);
		}
	});

	return App;
});
