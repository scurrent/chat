var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
});


function createChatTable() {
    var dynamodb = new AWS.DynamoDB();

    var params = {
        TableName : "Rooms",
        KeySchema: [       
            { AttributeName: "name", KeyType: "HASH"},  //Partition key
            { AttributeName: "topic", KeyType: "RANGE" } 
        ],
        AttributeDefinitions: [       
            { AttributeName: "name", AttributeType: "S" },
            { AttributeName: "topic", AttributeType: "S" }
        ],
        ProvisionedThroughput: {       
            ReadCapacityUnits: 10, 
            WriteCapacityUnits: 10
        }
    };

    dynamodb.createTable(params, function(err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Created Rooms table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}


function createChatRoom(name, topic, creator) {
    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log("Adding chat topics into DynamoDB. Please wait.");


        var params = {
            TableName: "Rooms",
            Item: {
                "name":  name,
                "topic": topic,
                "creator":  creator,
                "createdAt": new Date().getTime()
            }
        };

        docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add entry " + name + " Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("PutItem succeeded:",name);
        }
        });
    }
 //   createChatRoom("Plunder Pirates", "Piraty things", "Rip Current");
  //  createChatRoom("Civic Pirates", "Piraty things", "Civic Current");


   






const roomScan = async function dbRead() {
    var docClient = new AWS.DynamoDB.DocumentClient();
    let params = {
        TableName: 'Rooms'
   };


    console.log('dbRead');
    let promise = docClient.scan(params).promise();
    let result = await promise;
    let data = result.Items;
    if (result.LastEvaluatedKey) {
        params.ExclusiveStartKey = result.LastEvaluatedKey;
        data = data.concat(await dbRead(params));
    }
    return data;
}



const scanForRooms = async() => {
    const mylist = await roomScan();
    return mylist; 
}    





module.exports = {
    roomScan, 
    scanForRooms
}
