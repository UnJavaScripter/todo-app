print('init***********************************************')
import os
import sys
#sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'renderer'))
sys.path.insert(1, './renderer')

import json
from flask import Flask, json, request
from renderer import renderList

app = Flask(__name__)

# todoList = [
#   {
#     "label": "Create Server",
#     "done": False,
#     "id": 3,
#     "display": True
#   },
#   {
#     "label": "Hook up server",
#     "done": False,
#     "id": 2,
#     "display": True
#   },
#   {
#     "label": "Done & done",
#     "done": True,
#     "id": 1,
#     "display": True
#   }
# ]


@app.route("/", methods=["GET"])
def index():
    return 'Alive!'


@app.route("/", methods=["POST"])
def get_todos():
    todo_list = request.get_json(silent=True)
    filtered_todo_list = [p for p in todo_list if p['display'] == True]
    render = renderList(filtered_todo_list)
    if render:
        response = app.response_class(
          response=json.dumps(filtered_todo_list),
          status=200,
          mimetype='application/json'
        )
        return response
    else:
        return '', 500



