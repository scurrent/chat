const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
global.fetch = require('node-fetch');


AWS.config.region = 'us-east-1'; // Region
//AWS.config.credentials = new AWS.CognitoIdentityCredentials({
//    IdentityPoolId: 'us-east-1:b64bb629-ec73-4569-91eb-0d950f854f4f'
//});

const poolData = {    
    UserPoolId : "us-east-1_wNDmGLDnY", // Your user pool id here    
    ClientId : "701v7bv6uljfjf2lfagj2h6bl4" // Your client id here
}; 

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData); 

async function registerUser(user){

    console.log("Registration: " + JSON.stringify(user));
    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"nickname",Value:user.nickname.trim()}));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value:user.email.trim()}));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"custom:piratename",Value:user.piratename.trim()}));
    

  //  if (await User.findOne({ user.username })) {
  //      throw 'Username "' + userParam.username + '" is already taken';
  //  }

    
    await userPool.signUp(user.nickname, user.password, attributeList, null, function(err, result){
        if (err) {
                //The user has already registered so go to the SignIn method
                if(err['code'] === "UsernameExistsException"){ 
                   console.log("UsernameExistsException detected: " + err);
                   throw 'Username "' + uuser.nickname + '" is already taken';
                }
            console.log("Registration error: " + JSON.stringify(err));
            throw "Registration error: " + JSON.stringify(err);
        }
        cognitoUser = result.user;
        console.log('returning ' + JSON.stringify(cognitoUser));
        return cognitoUser;
    });
}

function login(username, password) {
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username : username,
        Password : password,
    });

    var userData = {
        Username : username,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());
            console.log('id token + ' + result.getIdToken().getJwtToken());
            console.log('refresh token + ' + result.getRefreshToken().getToken());
        },
        onFailure: function(err) {
            console.log("Login error:" + err);
        },

    });
}

  //  login("cheddar", "cheese")
  //  login("Blackbeard", "SamplePassword123")
    

    function update(username, password){
        var attributeList = [];
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: "custom:scope",
            Value: "some new value"
        }));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: "name",
            Value: "some new value"
        }));
  
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
        });

        var userData = {
            Username: username,
            Pool: userPool
        };
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.updateAttributes(attributeList, (err, result) => {
            if (err) {
                //handle error
            } else {
                console.log(result);
            }
        });
}

function validateToken(token) {
    request({
        url: `https://cognito-idp.${pool_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            pems = {};
            var keys = body['keys'];
            for(var i = 0; i < keys.length; i++) {
                //Convert each key to PEM
                var key_id = keys[i].kid;
                var modulus = keys[i].n;
                var exponent = keys[i].e;
                var key_type = keys[i].kty;
                var jwk = { kty: key_type, n: modulus, e: exponent};
                var pem = jwkToPem(jwk);
                pems[key_id] = pem;
            }
            //validate the token
            var decodedJwt = jwt.decode(token, {complete: true});
            if (!decodedJwt) {
                console.log("Not a valid JWT token");
                return;
            }

            var kid = decodedJwt.header.kid;
            var pem = pems[kid];
            if (!pem) {
                console.log('Invalid token');
                return;
            }

            jwt.verify(token, pem, function(err, payload) {
                if(err) {
                    console.log("Invalid Token.");
                } else {
                    console.log("Valid Token.");
                    console.log(payload);
                }
            });
        } else {
            console.log("Error! Unable to download JWKs");
        }
    });
}

module.exports = {
    update,
    login,
   // getAll,
   // getById,
    registerUser,
    validateToken,
  //  delete: _delete
};