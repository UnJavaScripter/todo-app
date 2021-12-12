const { MongoClient, ObjectId } = require("mongodb");
const fetch = require("node-fetch");
// const messages = require('./build/gen/data_pb');
// const services = require('./build/gen/data_grpc_pb');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = process.env.PROTO_PATH || 'todo.proto';
const port = process.env.PORT || '50051';
const uri = process.env.MONGO_CONN ||  "mongodb://admin:admin@mongo:27017/";
const displayAddress = process.env.DISPLAY_ADDRESS;


const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
const todoProto = grpc.loadPackageDefinition(packageDefinition).todoapp;
const server = new grpc.Server();

const client = new MongoClient(uri);
let db;
let todosCollection;

async function initMongo() {
  try {
    await client.connect();
    db = client.db('todos');
    todosCollection = db.collection('todoList');

  } catch {
    await client.close();
  }
}

async function addTodo(call, callback) {
  const newTodo = call.request;
  const newTodoDoc = await dbWrite(newTodo);

  if(newTodoDoc.error) {
    return newTodoDoc.error;
  }
  sendToRenderer();
  callback(null, await newTodoDoc);
}

async function getTodosStream(call, callback) {
  (await dbRead()).forEach(item => {
    call.write(item);
  });
  call.end();
}

async function dbRead() {
  const todos = await todosCollection.find({});
  const todosArr = await todos.toArray();

  const newTodosArr = (await todosArr).map(todo => {
    todo.id = todo._id
    delete todo._id
    return todo;
  })
  
  return newTodosArr;
}

async function dbWrite(todo) {
  if (
    Object.hasOwn(todo, 'label') &&
    Object.hasOwn(todo, 'done') &&
    Object.hasOwn(todo, 'display')
  ) {
    todo.id = todo.id || new ObjectId();
    const newTodoObj = {
      label: todo.label,
      done: todo.done,
      display: todo.display,
    }
    await todosCollection.updateOne(
      {_id: ObjectId(todo.id)},
      {
        $set: newTodoObj
      },
      {upsert: true}
    );

    return {...newTodoObj, id: todo.id}
  } else {
    return {error: 'validate obj'}
  }
}

async function sendToRenderer() {
  try {
    const todosArr = await dbRead();
    console.log(await todosArr);
    await fetch(displayAddress, {
      method: 'POST',
      body: JSON.stringify(await todosArr),
      headers: {'Content-Type': 'application/json'}
    });
  }catch(err) {
    console.log(err);
  }
}

async function main() {
  await initMongo();
  server.addService(todoProto.Todo.service, {
    addTodo: addTodo,
    getTodosStream: getTodosStream
  });
  server.bindAsync('0.0.0.0:' + port,
    grpc.ServerCredentials.createInsecure(), () => {
      console.log(`server listening on :${port}...`);
      server.start();
    });
}

process.on('SIGINT', function() {
  process.exit();
});

main();