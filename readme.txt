react-route-system
==================

A lightweight routing system for react with the following features

example
------------
```
class Task extends react.Component{
	render(){
		return (<h1>I'm task {this.props.task}!</h1>)
	}
}

class Tasks extends react.Component{
	render(){
		return (<div>
			<h1>Tasks</h1>
			<a href="/tasks/1" onClick=this.props.location.push.bind("/tasks/1")>Task 1</a>
		</div>)
	}
}

class App extends react.Component{
	render(){
		return this.props.route.render(this.props.params)
	}
}
App.router = new Router()
	.add("tasks","/tasks",Tasks)
	.add("task","/tasks/:task",Task)

reactDom.render(<RootComponent component={App}/>,document.body)
```
