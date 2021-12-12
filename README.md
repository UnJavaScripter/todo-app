# ToDo App

My take on a ToDo list app. It showcases an extremely basic gRPC implementation with a `client` and a `server`. The server stores data in MongoDB and reports changes to a `rendering server` (via a regular HTTP calls for now) running on a raspberry pi equipped with an [e-paper display](https://www.waveshare.com/wiki/2.13inch_e-Paper_HAT).

## Who should use this?

Probably no one besides me, I started working on this because I wanted to learn more about Ansible, gRPC and Docker. Also I had a Raspberry pi Zero-w and an e-paper display module just gathering dust.

## Components

The whole application is split into 4 components:
  - `client`: Handle user input and display ToDos
  - `server`: Manage data
  - `rendering server`: Receive rendering requests
  - `renderer`: Render ToDos to the display

### The `client`

It exposes a simple Server Side rendered form (that uses at least one [web component](https://unjavascripter.github.io/dc-elements/dc-elements/checkbox/index.html)). It receives a data stream from the `server` with any changes made to the ToDo list, and reports any client side updates.

### The `server`

Exposes a method to add ToDos and a method that streams them down. It uses MongoDB to store data an reports changes to the `rendering server` via an HTTP POST call.

### The `rendering server`

It's a simple Python server using Flask (Why python here? well, the e-paper display library comes in C and Python versions only). It exposes a single endpoint to receive data changes. When the endpoint is queried, it invokes the Python `renderer` handler.

### The `renderer`

It's a simple library(?) that implements the [Waveshare e-paper display official library](https://github.com/waveshare/e-Paper/tree/master/RaspberryPi_JetsonNano/python/lib/waveshare_epd) and renders the ToDo list.

## Future work?

### Security
Currently all the components communicate without any kind of security implementation.

### Automation
- Improve the existing Ansible playbook (rendering side) to pull the server code and create "daemonize" it automatically.
- Create a playbook to run start `client` and `server` via `docker-compose`.

### Client
Make it look better.