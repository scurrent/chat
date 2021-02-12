var AWS = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});

const tableName = "Messages"

// aws dynamodb delete-table --table-name Messages --endpoint=http://localhost:8000 --region us-west-2

//DYNAMO_ENDPOINT=http://localhost:8001 AWS_REGION=us-west-2

// DYNAMO_ENDPOINT=http://localhost:8000 AWS_REGION=us-west-2 AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local ./dynamodb-admin 
//DYNAMO_ENDPOINT=http://localhost:8000 AWS_REGION=us-west-2 ./dynamodb-admin 



function createMessagesTable() {
    var dynamodb = new AWS.DynamoDB();

    var params = {
        TableName : tableName,
        KeySchema: [       
            { AttributeName: "room", KeyType: "HASH"},  //Partition key
            { AttributeName: "id", KeyType: "RANGE" }
             
        ],
        AttributeDefinitions: [       
            { AttributeName: "room", AttributeType: "S" },
            { AttributeName: "id", AttributeType: "S" }
           
            
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 3, 
            WriteCapacityUnits: 3
        }
    };

    dynamodb.createTable(params, function(err, data) {
        if (err) {
            console.error("Unable to create Messages table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Created Messages table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}
 //   createMessagesTable()


var addMessage = function addMessage(message) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log("Adding message to chat room");


        var params = {
            TableName: tableName,
            Item: {
                "id" : uuidv4(),
                "room":  message.room,
                "user": message.user,
                "message":  message.message,
                "createdAt": new Date().getTime()
            }
        };

        docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add message.  Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("PutItem for new message succeeded");
        }
        });
    }

let data = { 
    room : "Civics Friends",
    user : "Jack",
    message : "Hey, this is a third message from Jack"
    
}
//addMessage(data);

var getMessages = function getMessages(room) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log("Getting messages for chat room");

    var params = {
        KeyConditionExpression: "room = :room",
        ExpressionAttributeValues: {
            ':room': room
        },
        TableName: tableName
    };

   


    
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to get messages.  Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Got list of messages for room");
            console.log(data)
            data.Items.forEach(function(obj) {
                //console.log(obj); 
                  console.log("Test:" + obj.message); 
            });



        }
    });
}
//getMessages("Plunder Pirates")

    



 
  module.exports = {
    addMessage 
  }