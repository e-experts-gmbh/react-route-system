"use strict";
var toRegexp = require("path-to-regexp");
var react = require("react");
var qs = require("querystring");

class Route{
	constructor(router,name,path,next,query){
		this.router = router;
		this.name = name;
		this.keys = [];
		this.regexp = toRegexp(path,this.keys);
		if(next && next){
			this.regexp = this.regexp+"";
			this.regexp = new RegExp(this.regexp.substr(1,this.regexp.length-4)+"(.*)$","i");
		}
		if(next) this.next = next;
		if(query) this.query = query;
	}
	match(path){
		var values = this.regexp.exec(path);
		if(values == null) return false;
		var params = {};
		var path = values[0];
		values = values.slice(1);
		for(var i = 0; i < this.keys.length; i++){
			params[this.keys[i].name] = values[i];
		}
		params.values = values;
		params.subPath = this.next?values[values.length-1]:"";
		if(params.subPath.length && !params.subPath.startsWith("/")) params.subPath = "/"+params.subPath;
		params.path = path.slice(0,path.length-params.subPath.length);
		return params;
	}

	render(props){
		return react.createElement(Location,{props:props,route:this});
	}
}

class Router{
	constructor(){
		this.routes = [];
	}
	add(name,path,next,query){
		if(next && !next.router) next.router = new Router().add("","");
		this.routes.push(new Route(this,name,path,next,query));
		return this;
	}

	route(path){
		if(path instanceof react.Component) path = path.props.location.subPath;
		for(var i = 0; i < this.routes.length; i++){
			var route = this.routes[i];
			var params = route.match(path);
			if(!params) continue;
			if(route.next && !route.next.router.route(params.subPath)) continue;
			return route;
		}
	}
}

class RootComponent extends react.Component{
	constructor(props,context){
		super(props,context);
		this.path = "";
		this.params = {};
		this.subPath = location.pathname;
		this.query = qs.parse(location.search);
		this.root = this;
		window.onpopstate = function(){
			this.forceUpdate();
		}.bind(this)
	}
	getChildContext(){
		return {
			location:this
		}
	}
	render(){
		this.subPath = location.pathname;
		this.query = qs.parse(location.search);
		class Mounter extends react.Component{
			render(){
				return this.props.route.render();
			}
		}
		Mounter.router = new Router().add("","",this.props.component);
		return react.createElement(Mounter,{location:this,params:this.params,route:Mounter.router.routes[0]});
	}
}

RootComponent.childContextTypes = {
	location: react.PropTypes.object
}

class Location extends react.Component{
	constructor(props,context){
		super(props,context);
		this.root = this.context.location.root;
		this.componentWillReceiveProps(props);
	}
	componentWillReceiveProps(props){
		delete this.parentSubPath;
		this.route = props.route;
		this.parseParams();
	}

	parseParams(){
		this.subRoute = this.route.next.router.route(this.parentSubPath!==undefined?this.parentSubPath:this.context.location.subPath);
		this.params = this.subRoute.match(this.parentSubPath||this.context.location.subPath);
		this.path = this.params.path;
		this.subPath = this.params.subPath;
		this.query = {};
		for(var key in this.subRoute.query){
			this.query[key] = this.root.query[key];
		}
	}
	getChildContext(){
		return {
			location:this
		}
	}
	render(){
		return react.createElement(this.route.next,Object.assign({},this.props.props,{location:this,params:this.params,route:this.subRoute,query:this.query}));
	}

	transition(replace,path,query){
		var route = this.route.next.router.route(path);
		if(!route) throw new Error("path '"+path+"' does not match any routes");
		for(var key in query){
			if(!route.query[key]) throw new Error("query key '"+key+"' is not allowed for this route");
		}
		this.parentSubPath = path;
		this.parseParams();
		this.query = query;

		var path = [path];
		var location = this.context.location;
		while(location){
			path.unshift(location.path);
			location = location.context.location;
		}
		path = path.join("");
		query = qs.stringify(Object.assign({},this.root.query,this.query));
		history[replace?"replaceState":"pushState"](null,null,path+(query.length?("?"+query):""));
		this.forceUpdate();
	}
	push(path,query){
		this.transition(false,path,query);
	}
	replace(path,query){
		this.transition(true,path,query);
	}


}
Location.contextTypes = {
	location:react.PropTypes.object
}
Location.childContextTypes = {
	location:react.PropTypes.object
}

exports.RootComponent = RootComponent;
exports.Router = Router;