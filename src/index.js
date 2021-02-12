const path = require('path')
const http = require('http')
const express = require('express')
const mustacheExpress = require('mustache-express');
var router = express.Router()
const socketio = require('socket.io')
const Filter = require('bad-words')
const { roomScan, scanForRooms  } = require('./utils/chatRooms')
const { addMessage  } = require('./utils/roomMessages')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

var dateFormat = require('dateformat');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 3000;
const publicDirectoryPath = path.join(__dirname, '../public')


const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('./utils/jwt');
const errorHandler = require('./utils/error-handler');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// use JWT auth to secure the api
//app.use(jwt());

// api routes
app.use('/users', require('./users/users.controller'));




app.engine('html', mustacheExpress());          // register file extension mustache
app.set('view engine', 'mustache');                 // register file extension for partials
app.engine('mustache', mustacheExpress());
app.set('views', publicDirectoryPath);
app.use(express.static(publicDirectoryPath));

// routes




app.get('/health', function (req, res) {
    console.log("to health ", __dirname );
    res.send('GET request to the health page')
  });


app.get('/login', function (req, res) {
    let roomList = []
    scanForRooms().then((result)=> {
        console.log("manama:" + JSON.stringify(result));
       

        var date = new Date();
        date = dateFormat(date, "dddd, mmmm dS, yyyy");
        
         result.forEach(function(obj) {
            console.log(obj); 
              console.log("Test:" + obj.name); 
              roomList.push(obj)
        });
        console.log(roomList); 
       
        res.render ('login.html', 
            {   date: date, 
                rooms: roomList
            }      
        );
   
      }).catch((e) =>{
        console.log(e)
      });
   
  });


  //app.post('/users/register', function (req, res) {
   
  //  console.log("to health ", __dirname );
  //  res.send('Posted request to the register page')
  //});



io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome ${user.username}!' ))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        let data = { 
            room : user.room,
            user : user.username,
            message : message
        }
        addMessage(data)
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})


