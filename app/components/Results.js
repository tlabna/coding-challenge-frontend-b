var React = require('react');
var queryString = require('query-string');
var PropTypes = require('prop-types');
var api = require('../utils/api');
var Loading = require('./Loading');
var DepartureList = require('./DepartureList');
var SelectLanguage = require('./SelectLanguage');
var Locale = require('../utils/locale.json');

class Results extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			cities: null,
			departures: null,
			locations: null,
			operators: null,
			loading: true,
			error: false,
			selectedLanguage: 'en' 
		};

		this.params = queryString.parse(this.props.location.search);

		this.updateLanguage = this.updateLanguage.bind(this);
		this.requestDepartures = this.requestDepartures.bind(this);
	}

	/** 
	 * Set selectedLanguage state before render() runs
	 * so we're using the correct language 
	 */
	componentWillMount () {
		this.setState(function () {
			return {
				selectedLanguage: this.params.lang
			};
		});
	}

	componentDidMount () {
		this.requestDepartures(this.params);
	}

	requestDepartures (params, poll = false, index = null) {
		api.getDepartures(params, poll, index)
			.then(function (data) {
				var index = data.departures.length;

				if (data.cities) {
					/** Create cities object and reference by departure and arrival
					* departure is always at index 0 and arrival at 1
					*/
					var cities = {
						departure: data.cities[0],
						arrival: data.cities[1]
					};

					this.setState(function () {
						return {
							cities: cities
						};
					});
				}

				if (!data.complete) {
					// Run poll after 3 seconds
					return setTimeout(function (){
						this.requestDepartures(params, true, index);
					}.bind(this), 3000);
				}
				else {
					var locations = {}; 
					var operators = {};

					/** If after polling we get no results then keep 
					* departures state to null
					*/
					if(data.departures.length === 0) {
						data.departures = null;
					}

					// Create locations object and reference each item by location id
					data.locations.map(function (location) {
						locations[location.id] = location;
					});

					// Create operators object and reference each item by operator id
					data.operators.map(function (operator) {
						operators[operator.id] = operator;
					});

					this.setState(function () {
						return {
							departures: data.departures,
							locations: locations,
							operators: operators,
							loading: false
						};
					});
				}
			}.bind(this))
			.catch(function () {
				this.setState(function () {
					return {
						error: true,
						loading: false
					};
				});
			}.bind(this));
	}

	updateLanguage (lang) {
		this.setState(function () {
			return {
				selectedLanguage: lang
			};
		});
	}

	render() {
		var {loading, 
			cities,  
			departures, 
			locations, 
			operators,
			error,
			selectedLanguage} = this.state;
		var locale = Locale[selectedLanguage];

		return (
			<section className='results-container'>
				<SelectLanguage
					selectedLanguage={selectedLanguage} 
					onSelect={this.updateLanguage} />

				{loading &&
					<Loading
						text={locale.loadingMessage} 
						selectedLanguage={selectedLanguage} />}

				{error &&
					<p className='error'>{locale.errorMessage}</p>}

				{departures == null && !loading && !error &&
					<p className='error'>{locale.errorSomethingWrong}</p>}

				{departures != null && !loading && !error &&
					<DepartureList
						cities={cities}
						departures={departures}
						locations={locations}
						operators={operators}
						selectedLanguage={selectedLanguage}
					/>
				}
			</section>
		);
	}
}

Results.propTypes = {
	location: PropTypes.object.isRequired
};

module.exports = Results;