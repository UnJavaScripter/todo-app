// const messages = require('./build/gen/data_pb');
// const services = require('./build/gen/data_grpc_pb');

// const google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { engine } from 'express-handlebars';
import grpc from '@grpc/grpc-js'
import protoLoader from "@grpc/proto-loader"

const app = express()

const port = process.env.PORT;
const PROTO_PATH = process.env.PROTO_PATH || 'todo.proto';
const packageDef = protoLoader.loadSync(PROTO_PATH, {});
const grpcObject = grpc.loadPackageDefinition(packageDef);
const todoPackage = grpcObject.todoapp;

let todos = new Map();
const target = process.env.SERVER_ADDRESS || '0.0.0.0:50051';
const client = new todoPackage.Todo(
  target,
  grpc.credentials.createInsecure()
);

// client.getTodos(null, function (err, response) {
//   if (err) {
//     console.log(err);
//   }
//   if (response.items)
//     response.items.forEach(item => console.log('get:' + item));
// });

async function addTodo(todo) {
  return new Promise((resolve) => {
    client.addTodo(todo, async (err, savedTodo) => {
      if (err) {
        console.log(err);
        return err;
      }
      const newTodoList = addToLocalTodos(savedTodo);
      resolve(newTodoList);
    });
  })
}
function addToLocalTodos(todo) {
  if (
    Object.hasOwn(todo, 'label') &&
    Object.hasOwn(todo, 'done') &&
    Object.hasOwn(todo, 'display')
  ) {
    todos.set(todo.id, todo);
  }
  return todos;
}

async function getTodosStream() {
  const call = client.getTodosStream();
  call.on("end", e => console.log("server done!"))

  return new Promise(resolve => {
    call.on("data", async (item) => {
      const localTodos = addToLocalTodos(item)
      resolve(localTodos);
    })
  })

}

getTodosStream();

app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

async function getTodosArr() {
  const updatedLocalTodosMap = await getTodosStream();
  const todosArr = Array.from(updatedLocalTodosMap, ([id, value]) => ({ id, ...value }))
  return todosArr;
}

app.get('/', async (req, res) => {
  let todosArr;
  if(todos.size === 0) {
    todosArr = [];
  } else {
    todosArr = await getTodosArr();
  }
  res.render('home', { todosArr });
})

app.post('/update-todos', async (req, res) => {
  const todo = req.body;
  const newTodo = {
    label: req.body.todo ?? todo.label,
    done: todo.done ?? false,
    display: todo.display ?? true,
    id: todo.id ?? undefined
  }
  await addTodo(newTodo);
  res.send(newTodo);
})

app.listen(port, () => {
  console.log(`Client app listening at ${port}`)
})
